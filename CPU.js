/**
 * 8 bit Register enum for use in the Instruction LUT
 * @typedef {number} Reg8
 */
const Reg8 = Object.freeze({
    A: 0, // 8 bit registers
    F: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    H: 6,
    L: 7,
    MEMORY: 8,
    CONSTANT: 9,
    HL_ADDRESS: 10
});

/**
 * Bit offsets for flag register (F)
 * @typedef {number} Flag
 */
const Flag = Object.freeze({
    Z: 7,
    N: 6,
    H: 5,
    C: 4
})

// 16 bit counterpart to Reg8
/**
 * Enum referencing index of 16 bit registers
 * @typedef {number} Reg16
 */
const Reg16 = Object.freeze({
    SP: 0, // stack pointer
    PC: 1, // program counter,
    CONSTANT: 2
});

const register8Table = document.querySelector('#register8-table');
const register16Table = document.querySelector('#register16-table');

class CPU {
    constructor() {
        this.registers8 = new Uint8Array(8); // 8 bit registers
        this.registers16 = new Uint16Array(2); // 16 bit registers
    }

    doCycle() {
        // get instruction at PC
        let PC = this.registers16[Reg16.PC];
        PCinc = INSTRUCTIONS[RAM.read(PC)](
            RAM.read(PC + 1), // call instruction using the next two bits
            RAM.read(PC + 2)
        ); // return value is the amount the PC should be incremented by

        this.registers16[Reg16.PC] += PCinc;
        this.displayRegisters();
    }

    setFlag(flag, value) {
        if (value == 1)
            this.registers8[Reg8.F] |= 1 << flag;
        else
            this.registers8[Reg8.F] &= ~(1 << flag);
    }

    setHalfCarry(addend1, addend2) {
        // set half carry flag if the sum of the lower nibbles is greater than 0b1111 (a half carry occured)
        this.setFlag(Flag.H, ((addend1 & 0xF) + (addend2 & 0xF)) > 0xF);
    }

    setCarry(addend1, addend2) {
        // set carry flag if the sum of the two values is greater than 0b11111111 (a carry occured)
        this.setFlag(Flag.C, ((addend1 & 0xFF) + (addend2 & 0xFF)) > 0xFF);
    }

    displayRegisters() {
        for (const reg of Object.keys(Reg8)) {
            const row = register8Table.querySelector('#' + reg).childNodes; // children of the row are the cells
            const value = this.registers8[Reg8[reg]];

            row[1].innerHTML = '0b' + value.toString(2).padStart(8, '0');
            row[2].innerHTML = '0x' + value.toString(16).padStart(2, '0');
            row[3].innerHTML = value;
        }

        for (const reg of Object.keys(Reg16)) {
            const row = register16Table.querySelector('#' + reg).childNodes; // children of the row are the cells
            const value = this.registers16[Reg16[reg]];

            row[1].innerHTML = '0b' + value.toString(2).padStart(8, '0');
            row[2].innerHTML = '0x' + value.toString(16).padStart(2, '0');
            row[3].innerHTML = value;
        }
    }

    /**
     * 
     * @param {Reg8} reg1 First 8 bit register
     * @param {Reg8} reg2 Second 8 bit register (should be adjacent to first)
     * @param {number} val Value to write to combined register
     */
    combinedRegWrite(reg1, reg2, val) {
        this.registers8[reg1] = val >> 8; // higher byte into first reg
        this.registers8[reg2] = val & 0xFF; // lower byte into second reg
    }

    /**
     * 
     * @param {Reg8} reg1 First 8 bit register
     * @param {Reg8} reg2 Second 8 bit register (should be adjacent to first)
     */
    combinedRegRead(reg1, reg2) {
        return this.registers8[reg1] << 8 + this.registers8[reg2];
    }
    
    add(register, addend) {
        let instr;

        if (addend == Reg8.HL_ADDRESS) {
            instr = () => {
                // add data at address pointed to by HL to the register specified and save result
                const regValue = this.registers8[register];
                const ramValue = RAM.read(this.combinedRegRead(Reg8.H, Reg8.L))
                const res = this.registers8[register] += ramValue;
                
                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, 0);
                this.setHalfCarry(regValue, ramValue);
                this.setCarry(regValue, ramValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        } else if (addend == Reg8.CONSTANT) {
            instr = (imm8) => {
                // add immediate value to the register specified and save result
                const regValue = this.registers8[register];
                const res = this.registers8[register] += imm8;
                
                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, 0);
                this.setHalfCarry(regValue, imm8);
                this.setCarry(regValue, imm8);

                return 2; // increment PC by 2 (skip forward instruction length + constant number)
            }
        } else { // normal register addition
            instr = () => {
                // add value in addend register to the register specified and save result
                const regValue = this.registers8[register];
                const addend = this.registers8[addend];
                const res = this.registers8[register] += addend;
                
                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, 0);
                this.setHalfCarry(regValue, addend);
                this.setCarry(regValue, addend);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        }

        return instr;
    }
}

function generateRegisterTable() {
    for (const reg of Object.keys(Reg8)) { // loop through all registers
        const row = document.createElement('tr'); // make a row for each reg
        row.id = reg; // create ID so we can index it later

        const regLabel = document.createElement('td');
        regLabel.innerHTML = reg;

        row.append(regLabel);
        // append 3 cells for the different display types
        row.append(document.createElement('td'), document.createElement('td'), document.createElement('td'));

        register8Table.append(row); // add row to table
    }

    for (const reg of Object.keys(Reg16)) { // loop through all registers
        const row = document.createElement('tr'); // make a row for each reg
        row.id = reg; // create ID so we can index it later

        const regLabel = document.createElement('td');
        regLabel.innerHTML = reg;

        row.append(regLabel);
        // append 3 cells for the different display types
        row.append(document.createElement('td'), document.createElement('td'), document.createElement('td'));

        register16Table.append(row); // add row to table
    }
}