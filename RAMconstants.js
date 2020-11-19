
const NINTENDO_GRAPHIC = Uint8Array.from([
    0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
    0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E, 0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
    0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC, 0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E
])

// yes this looks gross but it's easy to work with
const CARTIDGE_TYPES = {
    0x0: "ROM ONLY",
    0x1: "ROM+MBC1",
    0x2: "ROM+MBC1+RAM",
    0x3: "ROM+MBC1+RAM+BATT",
    0x5: "ROM+MBC2",
    0x6: "ROM+MBC2+BATTERY",
    0x8: "ROM+RAM",
    0x9: "ROM+RAM+BATTERY",
    0xB: "ROM+MMM01",
    0xC: "ROM+MMM01+SRAM",
    0xD: "ROM+MMM01+SRAM+BATT",
    0xF: "ROM+MBC3+TIMER+BATT",
    0x10: "ROM+MBC3+TIMER+RAM+BATT",
    0x11: "ROM+MBC3",
    0x12: "ROM+MBC3+RAM",
    0x13: "ROM+MBC3+RAM+BATT",
    0x19: "ROM+MBC5",
    0x1A: "ROM+MBC5+RAM",
    0x1B: "ROM+MBC5+RAM+BATT",
    0x1C: "ROM+MBC5+RUMBLE",
    0x1D: "ROM+MBC5+RUMBLE+SRAM",
    0x1E: "ROM+MBC5+RUMBLE+SRAM+BATT",
    0x1F: "Pocket Camera",
    0xFD: "Bandai TAMA5",
    0xFE: "Hudson HuC-3",
    0xFF: "Hudson HuC-1",
}

const ROM_SIZES = {
    0: "256kb = 32kB = 2 banks",
    1: "512kb = 64kB = 4 banks",
    2: "1Mb = 128kB = 8 banks",
    3: "2Mb = 256kB = 16 banks",
    4: "4Mb = 512kB = 32 banks",
    5: "8Mb = 1MB = 64 banks",
    6: "16Mb = 2MB = 128 banks",
    0x52: "9Mb = 1.1MB = 72 banks",
    0x53: "10Mb = 1.2MB = 80 banks",
    0x54: "12Mb = 1.5MB = 96 banks",
}

const RAM_SIZES = {
    0: "None",
    1: "16kb = 2kB = 1 bank",
    2: "64kb = 8kB = 1 bank",
    3: "256kb = 32kB = 4 bank",
    4: "1Mb = 128kB = 16 bank",
}

const DEST_CODES = [
    "Japanese",
    "Non-Japanese"
]