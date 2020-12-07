const canvas = document.querySelector('#screen');
const ctx = canvas.getContext('2d');

const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;
let zoom = 2;

canvas.width = SCREEN_WIDTH * zoom;
canvas.height = SCREEN_WIDTH * zoom;

// support for different color palletes would be cool
let colors = [ 'hsl(53, 100%, 44%)', 'hsl(53, 100%, 29%)', 'hsl(53, 100%, 15%)', 'hsl(53, 100%, 0%)' ];

function resize(newZoom) {
    zoom = newZoom;
    canvas.width = SCREEN_WIDTH * newZoom;
    canvas.height = SCREEN_HEIGHT * newZoom;
}

function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
}

function drawSprite(index) {
    
}

// Read through sprite attribute memory (OAM) and tile table to construct screen
function drawScreen(width, height) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background
    
    // window
    
    // sprites
    // start at OAM and look through each sprite's attributes to display them
    for (let i = OAM; i < OAM + OAM_SPAN; i += 4) { // increment 4 because each sprite is a block of 4 bytes
        
    }
    // once screen is drawn, call v-blank interrupt if it's enabled
    
    CPU.call()(0x00, 0x40); // v-blank interrupt service address is 0x0040
    CPU.di()(); // disable interrupts (IME = 0)
}