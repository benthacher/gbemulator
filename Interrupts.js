let joyByte = 0; // byte representing the following configuration
let P14selected = false;
/*
This is how it works in the gameboy

      P14      P15
       |        |
P10----O-Right--O-A
       |        |
P11----O-Left---O-B
       |        |
P12----O-Up-----O-Select
       |        |
P13----O-Down---O-Start
       |        |

This is how it's represented in this emulator

          ┌─high nibble─┐ ┌──low nibble─┐
          │     P14     │ │     P15     │
joyByte = P10 P11 P12 P13 P10 P11 P12 P13

*/
// keyCode: mask
// default bindings:
// right, left, up, down => right, left, up, down
// A, B, Select, Start => z, x, space, enter
keyBindings = {
    // P14
    39: 0b10000000, // right arrow
    37: 0b01000000, // left arrow
    38: 0b00100000, // up arrow
    40: 0b00010000, // down arrow
    // P15
    90: 0b00001000, // A button
    88: 0b00000100, // B button
    32: 0b00000010, // Select button
    13: 0b00000001, // Start button
};

window.onkeyup = keyInput;

window.onkeydown = e => {
    if (e.key == 'r') {
		gb.reset();
		if (ROM)
			RAM.loadROMintoRAM();
	}
	keyInput(e);
}

function keyInput(e) {
	const mask = keyBindings[e.keyCode];
	
	// if the keycode is mapped to a binding mask, use it to update joyByte
    if (mask) // if event type is keydown, reset corresponding bit. else set the bit (this mimics active low)
		joyByte = e.type == 'keydown' ? joyByte & (~mask) : joyByte | mask;
}

/**
 * 
 * @param {Array} codes Array of key codes to replace all 8 keys (right, left, up, down, A, B, Select, Start - in order).
 * Mainly used for saving key configs
 */
function remapKeys(codes) {
	// remove previous bindings
	keyBindings = {};

	// starting from 256 (0b100000000), mask is shifted right and each of the keycodes are mapped to the binding mask
	codes.reduce((mask, code) => keyBindings[code] = (mask = mask >> 1), 256);
}

function remapKey(keyMask, newCode) {
	// search through each key binding and delete binding, then add new binding
	for (const [ code, mask ] of Object.entries(keyBindings)) {
		if (mask == keyMask) {
			delete keyBindings[code];
			keyBindings[newCode] = keyMask;
		}
	}
}