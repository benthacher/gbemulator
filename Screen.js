const canvas = document.querySelector('#screen');
const ctx = canvas.getContext('2d');

const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;

canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_WIDTH;

// support for different color palletes would be cool
let colors = [ 'hsl(53, 100%, 44%)', 'hsl(53, 100%, 29%)', 'hsl(53, 100%, 15%)', 'hsl(53, 100%, 0%)' ];

// Read through sprite attribute memory (OAM) and tile table to construct screen
function drawScreen(width, height) {
    // background
    
    // window
    
    // sprites
    // start at OAM and look through each sprite's attributes to display them
    for (let i = OAM; i < OAM_SPAN; i += 4) { // increment 4 because each sprite is a block of 4 bytes
        
    }
}