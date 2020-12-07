const RAM = new Uint8Array(0x10000);

// Memory map base offsets // span (num bytes)
const TOP_OF_STACK = 0xFF80
const IO_PORTS = 0xFF00; // 128
const OAM_SPAN = 0xA0; // 160
const OAM = 0xFE00; // Sprite attribute memory, 160 (40 4 byte blocks for each sprite)
const ECHO_8kB_INTERNAL = 0xE000; // 7680
const INTERNAL_RAM = 0xC000; // 8192
const SWITCHABLE_RAM = 0xA000; // 8192 RAM for save game data on cartidge
const SPRITE_PATTERN_TABLE = 0x8000; // 4095
const VRAM = 0x8000; // 8192
const CARTRIDGE_SWITCHABLE_RAM = 0x4000; // 16384
const INTERNAL_INFO = 0x0100;
const CARTRIDGE_RAM_BANK_0 = 0x0000; // 16384

// IO registers
const IO_P1 = 0xFF00;
// const IO_SB = 0xFF01;
// const IO_SC = 0xFF02;
// const IO_DIV = 0xFF04;
const IO_TIMA = 0xFF05;
const IO_TMA = 0xFF06;
const IO_TAC = 0xFF07;
const IO_IF = 0xFF0F;
const IO_LCDC = 0xFF40;
const IO_IE = 0xFFFF; // interrupt enable

RAM.read = (addr) => {
    if (addr < OAM && addr >= ECHO_8kB_INTERNAL) // if accessing echo RAM, access actual ram instead
        addr -= 0x4000; // shift address down 8kB (size of the echo RAM)
    
    if (addr >= 0 && addr < RAM.length)
        return RAM[addr];
    else
        console.log('Illegal memory access! Attempted to read from', '0x' + (+addr).toString(16).toUpperCase());
}

RAM.write = (addr, val) => {
    if (addr < OAM && addr >= ECHO_8kB_INTERNAL) // if writing to echo RAM, write to actual ram instead
        addr -= 0x4000; // shift address down 8kB (size of the echo RAM)
    
    if (addr >= 0 && addr < RAM.length)
        RAM[addr] = val;
    else
        console.log('Illegal memory access! Attempted to write', val, 'to', '0x' + (+addr).toString(16).toUpperCase());
}

let ROM; // represents full memory of cartidge
let validROM = false;

RAM.loadROM = (buffer) => {
    RAM.fill(0, CARTRIDGE_RAM_BANK_0, VRAM - 1); // clear all cartidge RAM and external RAM
    RAM.fill(0, SWITCHABLE_RAM, INTERNAL_RAM - 1);

    ROM = buffer;

    RAM.loadROMintoRAM();
}

RAM.loadROMintoRAM = () => {
    displayROMAttributes();

    if (validROM)
        RAM.set(ROM.subarray(0, VRAM - 1), CARTRIDGE_RAM_BANK_0); // write the ROM to the cartidge RAM
    else
        console.log('invalid ROM');
}

const ROMData = {};

// combs through ROM variable's first few bytes to get metadata
function displayROMAttributes() {
    if (ROM.subarray(0x104, 0x133).every((byte, index) => byte == NINTENDO_GRAPHIC[index])) // nintendo graphic exists in rom
        validROM = true;
    else {
        validROM = false;
        return;
    }

    document.title = ROMData.name = String.fromCharCode.apply(null, ROM.subarray(0x134, 0x144));

    ROMData.cartType = CARTIDGE_TYPES[ROM[0x147]];
    ROMData.ROMSize = ROM_SIZES[ROM[0x148]];
    ROMData.RAMSize = RAM_SIZES[ROM[0x149]];
    ROMData.destCode = DEST_CODES[ROM[0x14A]];
}