/**
 * 8 bit Register enum for use in the Instruction LUT
 * @typedef {number} Register8
 */
const Register8 = Object.freeze({
    A: 0, // 8 bit registers
    F: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    H: 6,
    L: 7
});

// 16 bit counterpart to Register8
/**
 * Enum referencing index of 16 bit registers
 * @typedef {number} Register16
 */
const Register16 = Object.freeze({
    SP: 0, // stack pointer
    PC: 1, // program counter
});

// Instruction LUT
const INSTRUCTIONS = {
};

const register8Table = document.querySelector('#register8-table');
const register16Table = document.querySelector('#register16-table');

class CPU {
    constructor() {
        this.registers8 = new Uint8Array(8); // 8 bit registers
        this.registers16 = new Uint16Array(2); // 16 bit registers
    }

    displayRegisters() {
        for (const reg of Object.keys(Register8)) {
            const row = register8Table.querySelector('#' + reg).childNodes; // children of the row are the cells
            const value = this.registers8[Register8[reg]];

            row[1].innerHTML = '0b' + value.toString(2).padStart(8, '0');
            row[2].innerHTML = '0x' + value.toString(16).padStart(2, '0');
            row[3].innerHTML = value;
        }

        for (const reg of Object.keys(Register16)) {
            const row = register16Table.querySelector('#' + reg).childNodes; // children of the row are the cells
            const value = this.registers16[Register16[reg]];

            row[1].innerHTML = '0b' + value.toString(2).padStart(8, '0');
            row[2].innerHTML = '0x' + value.toString(16).padStart(2, '0');
            row[3].innerHTML = value;
        }
    }

    /**
     * 
     * @param {Register8} reg1 First 8 bit register
     * @param {Register8} reg2 Second 8 bit register (should be adjacent to first)
     * @param {number} val Value to write to combined register
     */
    combinedRegWrite(reg1, reg2, val) {
        this.registers8[reg1] = val >> 8; // higher byte into first reg
        this.registers8[reg2] = val & 0xFF; // lower byte into second reg
    }

    /**
     * 
     * @param {Register8} reg1 First 8 bit register
     * @param {Register8} reg2 Second 8 bit register (should be adjacent to first)
     */
    combinedRegRead(reg1, reg2) {
        return this.registers8[reg1] << 8 + this.registers8[reg2];
    }
    
    // Each instruction can either be executed immediately, or return a function for use in the LUT
    add(register, addend, numBits, inLUT = false) {
        let instr;

        // if (addend == Register.CONSTANT) {
        //     instr = (constant) => {
        //         if (numBits == 16) {
        //             // get 16 bit register from two adjacent 16 bit registers
        //             let regValue = (this.registers[register] << 8) + this.registers[register + 1]; 

        //             regValue += constant;

        //             this.registers[register] = regValue >> 8; // top 8 bits go into high register
        //             this.registers[register + 1] = regValue & 0xFF; // bottom 8 bits go into low register
        //         } else {
        //             let regValue = this.registers[register];

        //             regValue += constant;

        //             this.registers[register] = regValue;
        //         }
        //     }
        // } else if (addend == Register.MEMORY) {
        //     instr = (address) => {
        //         if (numBits == 16) {
        //             // get 16 bit register from two adjacent 16 bit registers
        //             let regValue = (this.registers[register] << 8) + this.registers[register + 1]; 

        //             regValue += RAM.read(address);

        //             this.registers[register] = regValue >> 8; // top 8 bits go into high register
        //             this.registers[register + 1] = regValue & 0xFF; // bottom 8 bits go into low register
        //         } else {
        //             let regValue = this.registers[register];

        //             regValue += RAM.read(address);

        //             this.registers[register] = regValue;
        //         }
        //     }
        // } else {
        //     instr = () => {
        //         let reg = this.registers[register];

        //         if (numBits == 16)
        //             reg = (reg << 8) + this.registers[register + 1]; // get 16 bit register from two adjacent 16 bit

        //         let addendReg = this.registers[addend];

        //         if (numBits == 16)
        //             addendReg = (addendReg << 8) + this.registers[addend + 1]; // get 16 bit register from two adjacent 16 bit
    
        //         reg += addendReg;
        //     }
        // }

        return inLUT ? instr : instr();
    }
}

function generateRegisterTable() {
    for (const reg of Object.keys(Register8)) { // loop through all registers
        const row = document.createElement('tr'); // make a row for each reg
        row.id = reg; // create ID so we can index it later

        const regLabel = document.createElement('td');
        regLabel.innerHTML = reg;

        row.append(regLabel);
        // append 3 cells for the different display types
        row.append(document.createElement('td'), document.createElement('td'), document.createElement('td'));

        register8Table.append(row); // add row to table
    }

    for (const reg of Object.keys(Register16)) { // loop through all registers
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