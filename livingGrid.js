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
let initialGridColors = [];

//add gui
var obj = {
  animationSpeed: 3,
  numCols: 4,
  numRows: 4,
  numCircles: 5,
  margin: 20,
  padding: 10,
  colorPalette: "retro",
  checkToggle: false,
  spacing: 8,
  backgroundColor: '#141937',
  borderColor: '#faebc5',
  colorMode: 'TBD',
};

var gui = new dat.gui.GUI( { autoPlace: false } );
//gui.close();
var guiOpenToggle = true;

gui.add(obj, "animationSpeed").min(1).max(10).step(1).name('Animation Speed');
gui.add(obj, "numCols").min(1).max(20).step(1).name('# Cols').onChange(refreshCanvas).listen();
gui.add(obj, "numRows").min(1).max(20).step(1).name('# Rows').onChange(refreshCanvas).listen();
gui.add(obj, "numCircles").min(1).max(10).step(1).name('# Interior Circles').listen();
gui.add(obj, "margin").min(0).max(50).step(1).name('Margin').onChange(refreshCanvas);
gui.add(obj, "padding").min(0).max(50).step(1).name('Padding').onChange(refreshCanvas);
gui.add(obj, "colorPalette", paletteNames).onFinishChange(changePalette).listen();
gui.addColor(obj, "backgroundColor").onChange(chooseInitialColors);
gui.addColor(obj, "borderColor");
gui.add(obj, "checkToggle").name('TBD').onFinishChange(toggleColorCycle).listen();
gui.add(obj, 'colorMode', ['TBD']);

obj['refresh'] = function () {
  refreshCanvas();
};
gui.add(obj, 'refresh').name("Restart Animation (r)");

obj['randomizeInputs'] = function () {
randomizeInputs();
};
gui.add(obj, 'randomizeInputs').name("Randomize Inputs");

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

function animate() {

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
      ctx.fillStyle = initialGridColors[index];
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
  animationRequest = requestAnimationFrame(animate);

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

  chooseInitialColors();

}
function initGlobalVariables(){
  numCells = obj.numCols * obj.numRows;
  cellWidth = (width - obj.margin*2 - obj.padding*(obj.numCols-1))/obj.numCols;
  cellHeight = (height - obj.margin*2 - obj.padding*(obj.numRows-1))/obj.numRows;
  chooseInitialColors();
  playAnimationToggle = true;
  animationRequest = requestAnimationFrame(animate);
}

function chooseInitialColors(){
  initialGridColors = [];
  for(let i=0; i<obj.numRows; i++){
    for(let j=0; j<obj.numCols; j++){
      //initialGridColors.push(selectedPalette[Math.floor((selectedPalette.length-1)*Math.random())]);
      initialGridColors.push(obj.backgroundColor);
    }
  }
}

function refreshCanvas() {
  
  if(playAnimationToggle == true){
    cancelAnimationFrame(animationRequest);
    playAnimationToggle = false;
  }
  
  console.log("restart animation");
  t=0;
  frameCounter = 0;
  
  initGlobalVariables();

}

function randomizeInputs(){
  console.log("Randomize inputs");
  obj.numCols = Math.ceil(Math.random() * 10);
  obj.numRows = Math.ceil(Math.random() * 10);
  obj.numCircles = Math.max(2,Math.ceil(Math.random() * 10));
  
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
    playAnimationToggle = true;
    animationRequest = requestAnimationFrame(animate);
  }
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
  }
  
});

function toggleColorCycle(){
  colorCycle = !colorCycle;
  console.log("toggle color cycle: "+colorCycle);
}