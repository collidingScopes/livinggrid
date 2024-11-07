const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const width = 1024;
const height = 1024;
canvas.width = width;
canvas.height = height;

var animationRequest;
var playAnimationToggle = false;

let t = 0;
let frameCounter = 0;
let colorCycle = false;

let selectedPalette;
const paletteNames = [];
for(i=0; i<colorPalettes.length; i++){
  paletteNames.push(colorPalettes[i].name);
}
//console.log(paletteNames);

let numCells;
let cellWidth;
let cellHeight;
// let initialGridColors = [];

//add gui
var obj = {
  pattern: "cycle",
  animationSpeed: 3,
  numCols: 4,
  numRows: 4,
  numCircles: 5,
  margin: 20,
  padding: 10,
  colorPalette: "retro",
  randomness: 2,
  checkToggle: false,
  backgroundColor: '#141937',
  borderColor: '#faebc5',
  colorMode: 'TBD',
};

var gui = new dat.gui.GUI( { autoPlace: false } );
//gui.close();
var guiOpenToggle = true;

gui.add(obj, "pattern", ["cycle", "stamp", "trail"]).onFinishChange(refreshCanvas).listen();
gui.add(obj, "animationSpeed").min(1).max(10).step(1).name('Animation Speed');
gui.add(obj, "numCols").min(1).max(20).step(1).name('# Cols').onChange(refreshCanvas).listen();
gui.add(obj, "numRows").min(1).max(20).step(1).name('# Rows').onChange(refreshCanvas).listen();
gui.add(obj, "numCircles").min(1).max(20).step(1).name('# Items').listen();
gui.add(obj, "margin").min(0).max(50).step(1).name('Margin').onChange(refreshCanvas);
gui.add(obj, "padding").min(0).max(50).step(1).name('Padding').onChange(refreshCanvas);
gui.add(obj, "randomness").min(0).max(10).step(1).name('Randomness');
gui.add(obj, "colorPalette", paletteNames).onFinishChange(changePalette).listen();
gui.addColor(obj, "backgroundColor").onChange(changeBackgroundColor);
gui.addColor(obj, "borderColor");
gui.add(obj, "checkToggle").name('TBD').onFinishChange(toggleColorCycle).listen();
gui.add(obj, 'colorMode', ['TBD']);

obj['refresh'] = function () {
  refreshCanvas();
};
gui.add(obj, 'refresh').name("Restart Animation");

obj['clearCanvas'] = function () {
  clearCanvas();
};
gui.add(obj, 'clearCanvas').name("Clear Canvas (c)");

obj['randomizeInputs'] = function () {
randomizeInputs();
};
gui.add(obj, 'randomizeInputs').name("Randomize Inputs (r)");

obj['playAnimation'] = function () {
  pausePlayAnimation();
};
gui.add(obj, 'playAnimation').name("Play/Pause Animation (p)");

obj['saveImage'] = function () {
  saveImage();
};
gui.add(obj, 'saveImage').name("Save Image (s)");

obj['saveVideo'] = function () {
  toggleVideoRecord();
};
gui.add(obj, 'saveVideo').name("Video Export (v)");

customContainer = document.getElementById( 'gui' );
customContainer.appendChild(gui.domElement);

function animateCycle() {

  //background color for whole canvas
  ctx.fillStyle = obj.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  //stroke outline for grid cells
  ctx.strokeStyle = obj.borderColor;
  ctx.lineWidth = 2;

  for(let i=0; i<obj.numRows; i++){
    for(let j=0; j<obj.numCols; j++){
      
      let index = i*obj.numCols+j;
      
      //background color fill for grid
      ctx.fillStyle = obj.backgroundColor;
      let x = obj.margin + obj.padding*j + j*cellWidth;
      let y = obj.margin + obj.padding*i + i*cellHeight;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      let maxRadius = Math.floor(cellWidth*0.8/2);

      //animated circles
      for(let z=0; z<obj.numCircles; z++){

        ctx.fillStyle = selectedPalette[( (index+z) % (selectedPalette.length-1))];
        //ctx.fillStyle = selectedPalette[( (z) % (selectedPalette.length-1))];
        let radius = maxRadius * Math.pow(0.8,z);
        let maxCenterShift = maxRadius-radius;

        let centerX = x+cellWidth/2;
        let centerY = y+cellHeight/2;
        let centerShiftX = Math.cos(t*z/3 + (index/numCells)*Math.PI*2)*maxCenterShift;
        let centerShiftY = Math.sin(t*z/3 + (index/numCells)*Math.PI*2)*maxCenterShift; 

        if(z==0){
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI*2);
          ctx.fill();
          ctx.stroke();
        } else {
          // radius = maxRadius * ((Math.sin((t+index) / z)+1)/2);
          ctx.beginPath();
          ctx.arc(centerX+centerShiftX, centerY+centerShiftY, radius, 0, Math.PI*2);
          ctx.fill();
          ctx.stroke();
        }
        

      }

    }
  }
  
  frameCounter++;
  t += obj.animationSpeed/100;
  animationRequest = requestAnimationFrame(animateCycle);

}

let row=0;
let col=0;
let index = 0;
let x=0;
let y=0;
let indexPositions = [];
let offset = 0;
let frameCycle = 0;
let previousFrameCycle = -1;
let currentColor;
function animateStamp(){

  let frameStep = Math.ceil(30 / obj.animationSpeed);
  let totalFramesPerCycle = frameStep * obj.numCircles;
  let frameCycle = Math.floor(frameCounter/frameStep) % obj.numCircles;

  if(frameCycle == previousFrameCycle){
    
  } else {

    if(frameCounter%totalFramesPerCycle == 0){
      index = indexPositions.pop();
      row = Math.floor(index/obj.numCols);
      col = index - row*obj.numCols;
      x = obj.margin + obj.padding*col + col*cellWidth;
      y = obj.margin + obj.padding*row + row*cellHeight;
      offset = Math.floor(Math.pow(Math.random(),2)*obj.numCircles);
      currentColor = selectedPalette[Math.floor((selectedPalette.length-1)*Math.random())];
      ctx.strokeStyle = currentColor;
    }
  
    let boxWidth = cellWidth * Math.pow(0.8,frameCycle + offset);
    let boxHeight = cellHeight * Math.pow(0.8,frameCycle + offset);
  
    let pixelRandomness = 2*obj.randomness;

    let xShift = (cellWidth-boxWidth)/2 + pixelRandomness*Math.random() - pixelRandomness/2;
    let yShift = (cellHeight-boxHeight)/2 + pixelRandomness*Math.random() - pixelRandomness/2;

    ctx.lineWidth = 2;
    ctx.strokeRect(x+xShift,y+yShift,boxWidth,boxHeight);
    if(Math.random()<0.1){
      ctx.fillStyle = currentColor;
    } else {
      ctx.fillStyle = obj.backgroundColor;
    }
    ctx.fillRect(x+xShift,y+yShift,boxWidth,boxHeight);

    //random noise pixels at the 4 corners of the rectangle
    let numPixels = 5 + Math.random()*15;
    let cornerPixelShift = 5;
    let power = 5;
    ctx.fillStyle = currentColor;

    for(let i=0; i<numPixels; i++){
      ctx.fillRect(x+xShift+noisePower(cornerPixelShift,power), y+yShift+noisePower(cornerPixelShift,power),1,1);
      ctx.fillRect(x+xShift+boxWidth+noisePower(cornerPixelShift,power), y+yShift+noisePower(cornerPixelShift,power),1,1);
      ctx.fillRect(x+xShift+noisePower(cornerPixelShift,power), y+yShift+boxHeight+noisePower(cornerPixelShift,power),1,1);
      ctx.fillRect(x+xShift+boxWidth+noisePower(cornerPixelShift,power), y+yShift+boxHeight+noisePower(cornerPixelShift,power),1,1);
    }

  }

  //cue up next animation frame
  previousFrameCycle = frameCycle;
  frameCounter++;
  t += obj.animationSpeed/100;
  animationRequest = requestAnimationFrame(animateStamp);

}

function animateTrail(){

  //background color for whole canvas
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = obj.backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  //stroke outline for grid cells
  ctx.strokeStyle = obj.borderColor;
  ctx.lineWidth = 2;


  for(let i=0; i<obj.numRows; i++){
    for(let j=0; j<obj.numCols; j++){
      
      let index = i*obj.numCols+j;
      
      //ctx.fillStyle = obj.backgroundColor;
      let x = obj.margin + obj.padding*j + j*cellWidth;
      let y = obj.margin + obj.padding*i + i*cellHeight;

      let centerX = x+cellWidth/2;
      let centerY = y+cellHeight/2;

      ctx.translate(centerX, centerY);
      ctx.rotate((t * Math.PI) / 180 + (index/numCells)*180);
      ctx.translate(-centerX, -centerY);
      
      ctx.strokeStyle = selectedPalette[( (index) % (selectedPalette.length-1))];
      //ctx.fillRect(x, y, cellWidth, cellHeight);
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // Reset transformation matrix to the identity matrix
      ctx.setTransform(1, 0, 0, 1, 0, 0);

    }
  }
  
  frameCounter++;
  t += obj.animationSpeed/5;
  animationRequest = requestAnimationFrame(animateTrail);

}

//MAIN METHOD
changePalette();
initGlobalVariables();

//HELPER FUNCTIONS

function changePalette(){
  
  for(i=0; i<colorPalettes.length; i++){
    if(colorPalettes[i].name == obj.colorPalette){
      console.log("Change palette: "+colorPalettes[i].name);
      selectedPalette = colorPalettes[i].palette;
      break;
    }
  }
}

function initGlobalVariables(){
  numCells = obj.numCols * obj.numRows;
  cellWidth = (width - obj.margin*2 - obj.padding*(obj.numCols-1))/obj.numCols;
  cellHeight = (height - obj.margin*2 - obj.padding*(obj.numRows-1))/obj.numRows;

  startAnimation();
}

function startAnimation(){
  playAnimationToggle = true;
  if(obj.pattern == "cycle"){
    animationRequest = requestAnimationFrame(animateCycle);

  } else if(obj.pattern == "stamp") {
    
    //generate a randomly shuffled array of all inner element positions
    indexPositions = [];
    for(i=0; i<numCells; i++){
      indexPositions.push(i);
    }
    shuffle(indexPositions);
    console.log(indexPositions);

    frameCycle = 0;
    previousFrameCycle = -1;

    animationRequest = requestAnimationFrame(animateStamp);

  } else if(obj.pattern == "trail"){
    animationRequest = requestAnimationFrame(animateTrail);
  }
}

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function changeBackgroundColor(){
  ctx.fillStyle = obj.backgroundColor;
  ctx.fillRect(0,0,width,height);
}

function refreshCanvas() {
  
  if(playAnimationToggle == true){
    cancelAnimationFrame(animationRequest);
    playAnimationToggle = false;
  }
  
  console.log("restart animation");
  t=0;
  frameCounter = 0;
  ctx.fillStyle = obj.backgroundColor;
  ctx.fillRect(0,0,width,height);
  
  initGlobalVariables();

}

function randomizeInputs(){
  console.log("Randomize inputs");
  obj.numCols = Math.ceil(Math.random() * 10);
  obj.numRows = Math.ceil(Math.random() * 10);
  obj.numCircles = Math.max(2,Math.ceil(Math.random() * 20));
  obj.colorPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)].name;
  changePalette();
  refreshCanvas();
}

function pausePlayAnimation(){
  console.log("pause/play animation");
  if(playAnimationToggle==true){
    playAnimationToggle = false;
    cancelAnimationFrame(animationRequest);
    console.log("cancel animation");
  } else {
    initGlobalVariables();
  }
}

function clearCanvas(){
  if(playAnimationToggle==true){
    playAnimationToggle = false;
    cancelAnimationFrame(animationRequest);
    console.log("cancel animation");
  }

  console.log("clear canvas");
  t=0;
  frameCounter = 0;
  ctx.fillStyle = obj.backgroundColor;
  ctx.fillRect(0,0,width,height);

}

function toggleGUI(){
  if(guiOpenToggle == false){
      gui.open();
      guiOpenToggle = true;
  } else {
      gui.close();
      guiOpenToggle = false;
  }
  }
  
  //shortcut hotkey presses
  document.addEventListener('keydown', function(event) {
  
  if (event.key === 'r') {
      randomizeInputs();
  } else if (event.key === 's') {
      saveImage();
  } else if (event.key === 'v') {
      toggleVideoRecord();
  } else if (event.key === 'o') {
      toggleGUI();
  } else if(event.key === 'p'){
      pausePlayAnimation();
  } else if(event.key === 'c'){
      clearCanvas();
}
  
});

function toggleColorCycle(){
  colorCycle = !colorCycle;
  console.log("toggle color cycle: "+colorCycle);
}

function noisePower(max, power){
  if(Math.random()<0.5){
    return Math.pow(Math.random(),power) * max * -1;
  } else {
    return Math.pow(Math.random(),power) * max;
  }
}