// Instruction LUT
const INSTRUCTIONS = {
    0x00: CPU.nop(),
    0x01: CPU.ld16(Reg8.B, Reg16.CONSTANT),
    0x02: CPU.ld8(Reg8.BC_ADDRESS, Reg8.A),
}

// starting from opcode 0x40, populate the load instructions
let i = 0x40;
for (let dest of Reg8Order) {
    for (let src of Reg8Order) {
        INSTRUCTIONS[i++] = CPU.ld8(dest, src);
    }
}
INSTRUCTIONS[0x76] = CPU.halt(); // make sure to overwrite LD (HL), (HL) with HALT

// starting from opcode 0x80, populate add, adc, sub, sbc instructions
i = 0x80
for (let reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8);

for (let reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8, true);

for (let reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8, false, true);

for (let reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8, true, true);

// instructions used with the 0xCB prefix
const CB_INSTRUCTIONS = {
    
}

// starting from CB opcode 0x40, populate bit, reset, and set instructions
i = 0x40;
for (let bit = 0; bit < 8; bit++) {
    for (let reg of Reg8Order) {
        CB_INSTRUCTIONS[i++] = CPU.bit(bit, reg);
    }
}
for (let bit = 0; bit < 8; bit++) {
    for (let reg of Reg8Order) {
        CB_INSTRUCTIONS[i++] = CPU.res(bit, reg);
    }
}
for (let bit = 0; bit < 8; bit++) {
    for (let reg of Reg8Order) {
        CB_INSTRUCTIONS[i++] = CPU.set(bit, reg);
    }
}

// After instructions are initialized, we can add the doCycle method to the CPU object
CPU.doCycle = function() {
    // get instruction at PC
    let PC = this.reg16[Reg16.PC];

    if (PC == 0xCB) {
        this.reg16[Reg16.PC] = ++PC;
        
        const opcode = RAM.read(PC);
        const instr = CB_INSTRUCTIONS[opcode];

        if (typeof instr == 'function') {
            this.PCinc = instr(
                RAM.read(PC + 1), // call instruction prefixed with 0xCB using the next two bits
                RAM.read(PC + 2)
            ); // return value is the amount the PC should be incremented by    
        } else {
            console.log('Undefined opcode:', '0x' + (opcode).toString(16).toUpperCase(), instr);
            this.stopped = true;
        }
    } else {
        const opcode = RAM.read(PC);
        const instr = INSTRUCTIONS[opcode];

        if (typeof instr == 'function') {
            this.PCinc = instr(
                RAM.read(PC + 1), // call instruction using the next two bits
                RAM.read(PC + 2)
            ); // return value is the amount the PC should be incremented by
        } else {
            console.log(typeof opcode)
            console.log('Undefined opcode:', '0x' + (opcode).toString(16).toUpperCase(), instr);
            this.stopped = true;
        }
    }

    this.reg16[Reg16.PC] += this.PCinc;
    this.displayRegisters();
};