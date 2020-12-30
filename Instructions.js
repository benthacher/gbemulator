// Instruction LUT
// https://meganesulli.com/generate-gb-opcodes/ used extensively
let INSTRUCTIONS = [];
INSTRUCTIONS[0x00] = CPU.nop();
INSTRUCTIONS[0x10] = CPU.stop();

// JR - jump bounded by [-128, 127] range
for (const condition of Object.values(JumpCondition))
    INSTRUCTIONS[0x20 + condition] = CPU.jump(true, condition);

// load 16 bit regs
let i = 0x01; // starting from 0x01, the index is incremented by 16 each loop, basically starting from opcode 0x01 and going to 0x31
for (const reg16 of Reg16Order) {
    INSTRUCTIONS[i] = CPU.ld16(reg16, Reg16.CONSTANT);
    i += 16;
}

INSTRUCTIONS[0x02] = CPU.ldBCA;
INSTRUCTIONS[0x12] = CPU.ldDEA;
INSTRUCTIONS[0x22] = CPU.ldHLincA;
INSTRUCTIONS[0x32] = CPU.ldHLdecA;

INSTRUCTIONS[0x0A] = CPU.ldABC;
INSTRUCTIONS[0x1A] = CPU.ldADE;
INSTRUCTIONS[0x2A] = CPU.ldAHLinc;
INSTRUCTIONS[0x3A] = CPU.ldAHLdec;

// increment 16 bit regs
i = 0x03;
for (const reg16 of Reg16Order) {
    INSTRUCTIONS[i] = CPU.inc16(reg16);
    i += 16;
}

// increment 8 bit regs
i = 0x04;
for (const reg8 of Reg8Order) {
    INSTRUCTIONS[i] = CPU.inc8(reg8);
    i += 8;
}

// decrement 8 bit regs
i = 0x05;
for (const reg8 of Reg8Order) {
    INSTRUCTIONS[i] = CPU.inc8(reg8, true); // decrement = true
    i += 8;
}

// load 8 bit regs with immediate data
i = 0x06;
for (const reg8 of Reg8Order) {
    INSTRUCTIONS[i] = CPU.ld8Data(reg8);
    i += 8;
}

// RLCA (shorter opcode than normal 2 byte one)
INSTRUCTIONS[0x07] = CPU.rotate(Reg8.A, true, true);
// RLA (shorter opcode than normal 2 byte one)
INSTRUCTIONS[0x17] = CPU.rotate(Reg8.A, true, false);
// DAA - converts A register to binary coded decimal
INSTRUCTIONS[0x27] = CPU.daa();
// SCF - set carry flag
INSTRUCTIONS[0x37] = CPU.scf();
// load SP into address
INSTRUCTIONS[0x08] = CPU.ldSP();
// JR with no condition
INSTRUCTIONS[0x18] = CPU.jump(true);

// HL addition instructions
i = 0x09
for (const reg16 of Reg16Order) {
    INSTRUCTIONS[i] = CPU.addHL(reg16);
    i += 16;
}

// 16 bit decrement
i = 0x0B
for (const reg16 of Reg16Order) {
    INSTRUCTIONS[i] = CPU.inc16(reg16, true);
    i += 16;
}

// RRCA (shorter opcode than normal 2 byte one)
INSTRUCTIONS[0x0F] = CPU.rotate(Reg8.A, false, true);
// RRA (shorter opcode than normal 2 byte one)
INSTRUCTIONS[0x1F] = CPU.rotate(Reg8.A, false, false);
// CPL - binary complement of A
INSTRUCTIONS[0x2F] = CPU.cpl();
// CCF - flip carry flag
INSTRUCTIONS[0x3F] = CPU.ccf();

// starting from opcode 0x40, populate the load instructions
i = 0x40;
for (let dest of Reg8Order) {
    for (let src of Reg8Order) {
        INSTRUCTIONS[i++] = CPU.ld8(dest, src);
    }
}

INSTRUCTIONS[0x76] = CPU.halt(); // make sure to overwrite LD (HL), (HL) with HALT

// starting from opcode 0x80, populate add, adc, sub, sbc instructions
i = 0x80;
for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8);

for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8, true);

for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8, false, true);

for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.add8(Reg8.A, reg8, true, true);

// starting from 0xA0, populate and, xor, or, cp instructions
i = 0xA0;
for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.and(reg8);

for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.xor(reg8);

for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.or(reg8);

for (const reg8 of Reg8Order)
    INSTRUCTIONS[i++] = CPU.cp(reg8);

// return instructions
for (const condition of Object.values(JumpCondition))
    INSTRUCTIONS[0xC0 + condition] = CPU.ret(condition);

// pop instructions
// technically, the final element in the Reg16Order array is the SP register, while the final pop instruction operates on the AF register.
// luckily, the AF register has the same index in the reg8 array as SP does in the reg16 array (0), so this is not an issue.
i = 0xC1;
for (const reg16 of Reg16Order) {
    INSTRUCTIONS[i] = CPU.pop(reg16);
    i += 16;
}

// normal jump instructions
for (const condition of Object.values(JumpCondition))
    INSTRUCTIONS[0xC2 + condition] = CPU.jump(false, condition);

// jump with no condition
INSTRUCTIONS[0xC3] = CPU.jump(false);

// call instructions
for (const condition of Object.values(JumpCondition))
    INSTRUCTIONS[0xC4 + condition] = CPU.call(condition);

// push instructions
i = 0xC5;
for (const reg16 of Reg16Order) {
    INSTRUCTIONS[i] = CPU.push(reg16);
    i += 16;
}

// add immediate value
INSTRUCTIONS[0xC6] = CPU.add8(Reg8.A, Reg8.CONSTANT, false, false);
// subtract immediate value
INSTRUCTIONS[0xD6] = CPU.add8(Reg8.A, Reg8.CONSTANT, false, true);
// and immediate value
INSTRUCTIONS[0xE6] = CPU.and(Reg8.CONSTANT);
// or immediate value
INSTRUCTIONS[0xF6] = CPU.or(Reg8.CONSTANT);

// add immediate value with carry
INSTRUCTIONS[0xCE] = CPU.add8(Reg8.A, Reg8.CONSTANT, true, false);
// subtract immediate value with carry
INSTRUCTIONS[0xDE] = CPU.add8(Reg8.A, Reg8.CONSTANT, true, true);
// xor immediate value
INSTRUCTIONS[0xEE] = CPU.xor(Reg8.CONSTANT);
// cp immediate value
INSTRUCTIONS[0xFE] = CPU.cp(Reg8.CONSTANT);

// restart instructions
for (i = 0; i < 64; i += 8)
    INSTRUCTIONS[0xC7 + i] = CPU.rst(i);

// stack pointer addition
INSTRUCTIONS[0xE8] = CPU.addSP();

// return with no conditions
INSTRUCTIONS[0xC9] = CPU.ret();
// return and enable interrupts
INSTRUCTIONS[0xD9] = CPU.reti();
// jump to address stored in HL
INSTRUCTIONS[0xE9] = CPU.jumpHL();
// load HL into SP
INSTRUCTIONS[0xF9] = CPU.ld16(Reg16.SP, Reg8.H);
// call with no condition
INSTRUCTIONS[0xCD] = CPU.call();

// out and in instructions
INSTRUCTIONS[0xE0] = CPU.out;
INSTRUCTIONS[0xF0] = CPU.in;
INSTRUCTIONS[0xE2] = CPU.outC;
INSTRUCTIONS[0xF2] = CPU.inC;

// imm16 address load
INSTRUCTIONS[0xEA] = CPU.ld8(Reg8.MEMORY, Reg8.A);
INSTRUCTIONS[0xFA] = CPU.ld8(Reg8.A, Reg8.MEMORY);

// disable interrupts
INSTRUCTIONS[0xF3] = CPU.di();
// enable interrupts
INSTRUCTIONS[0xFB] = CPU.ei();

INSTRUCTIONS[0xF8] = CPU.ld_hl_sp_s8;

// instructions used with the 0xCB prefix
const CB_INSTRUCTIONS = [];

i = 0;
for (const reg of Reg8Order) // rotate left with carry
    CB_INSTRUCTIONS[i++] = CPU.rotate(reg, true, true);
for (const reg of Reg8Order) // rotate right with carry
    CB_INSTRUCTIONS[i++] = CPU.rotate(reg, false, true);
for (const reg of Reg8Order) // rotate left without carry
    CB_INSTRUCTIONS[i++] = CPU.rotate(reg, true, false);
for (const reg of Reg8Order) // rotate right without carry
    CB_INSTRUCTIONS[i++] = CPU.rotate(reg, false, false);

for (const reg of Reg8Order) // shift left
    CB_INSTRUCTIONS[i++] = CPU.shift(reg, true, false);
for (const reg of Reg8Order) // shift right and leave bit 7 unchanged
    CB_INSTRUCTIONS[i++] = CPU.shift(reg, false, true);
for (const reg of Reg8Order) // swap
    CB_INSTRUCTIONS[i++] = CPU.swap(reg);
for (const reg of Reg8Order) // shift right and reset bit 7
    CB_INSTRUCTIONS[i++] = CPU.shift(reg, false, false);

// starting from CB opcode 0x40, populate bit, reset, and set instructions
for (let bit = 0; bit < 8; bit++) {
    for (const reg of Reg8Order) {
        CB_INSTRUCTIONS[i++] = CPU.bit(bit, reg);
    }
}
for (let bit = 0; bit < 8; bit++) {
    for (const reg of Reg8Order) {
        CB_INSTRUCTIONS[i++] = CPU.res(bit, reg);
    }
}
for (let bit = 0; bit < 8; bit++) {
    for (const reg of Reg8Order) {
        CB_INSTRUCTIONS[i++] = CPU.set(bit, reg);
    }
}

// After instructions are initialized, we can add the doCycle method to the CPU object
CPU.doCycle = function() {
    // get instruction at PC
    let PC = this.reg16[Reg16.PC];

    if (this.IME) { // if interrupts are enabled
        let IF = RAM.read(IO_IF);
        let IE = RAM.read(IO_IE);

        for (let bit = 1; bit < 6; bit++) {
            if (IF & IE & (1 << bit)) { // if bit i is set in IF and IE, we must service interrupt
                this.call()(bit * 8 + 0x40, 0x00);
                this.IME = false; // disable interrupts
                this.setInterruptFlag(bit * 8 + 40, false);
                break;
            }
        }
    }

    let opcode = RAM.read(PC);
    if (opcode == 0xCB) {
        this.reg16[Reg16.PC] = ++PC;
        
        opcode = RAM.read(PC);
        const instr = CB_INSTRUCTIONS[opcode];

        if (instr) {
            this.PCinc = instr(
                RAM.read(PC + 1), // call instruction prefixed with 0xCB using the next two bits
                RAM.read(PC + 2)
            ); // return value is the amount the PC should be incremented by    
        } else {
            // console.log('Undefined opcode:', '0x' + (opcode).toString(16).toUpperCase(), instr);
            this.stopped = true;
        }
    } else {
        const instr = INSTRUCTIONS[opcode];

        if (instr) {
            this.PCinc = instr(
                RAM.read(PC + 1), // call instruction using the next two bits
                RAM.read(PC + 2)
            ); // return value is the amount the PC should be incremented by
            // console.log(instr);
        } else {
            // console.log(typeof opcode)
            // console.log('Undefined opcode:', '0x' + (opcode).toString(16).toUpperCase(), instr);
            this.stopped = true;
        }
    }

    this.reg16[Reg16.PC] += this.PCinc;
    this.displayRegisters();
};

document.querySelector('#opcode-generation-message').style.display = 'none';