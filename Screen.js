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

function drawSprite(x, y, index, flags) {
    // for (let r = y; r < y + )
}

// Read through sprite attribute memory (OAM) and tile table to construct screen
function drawScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background
    
    // window
    
    // sprites
    // start at OAM and look through each sprite's attributes to display them
    for (let i = OAM; i < OAM + OAM_SPAN; i += 4) { // increment 4 because each sprite data is a block of 4 bytes
        // byte 0: y
        // byte 1: x
        // byte 2: sprite index in tile table
        // byte 3: flags
        drawSprite(RAM.read(i + 1), RAM.read(i), RAM.read(i + 2), RAM.read(i + 3));
    }
    // once screen is drawn, set v-blank in interrupt flag
    CPU.setInterruptFlag(Interrupt.VBLANK, true);
}