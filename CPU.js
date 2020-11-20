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
    HL_ADDRESS: 10,
    BC_ADDRESS: 11,
    DE_ADDRESS: 12
});

// Reg order defined by opcodes
const Reg8Order = [
    Reg8.B,
    Reg8.C,
    Reg8.D,
    Reg8.E,
    Reg8.H,
    Reg8.L,
    Reg8.HL_ADDRESS,
    Reg8.A,
];

// 16 bit counterpart to Reg8
/**
 * Enum referencing index of 16 bit registers
 * @typedef {number} Reg16
 */
const Reg16 = Object.freeze({
    SP: 0, // stack pointer
    PC: 1, // program counter,
    CONSTANT: 2,
    MEMORY: 3
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
});

/**
 * Jump conditions for call and jump
 */
const JumpCondition = Object.freeze({
    NZ: 0x00,
    Z: 0x08,
    NC: 0x10,
    C: 0x18
});

const register8Table = document.querySelector('#register8-table');
const register16Table = document.querySelector('#register16-table');

const CPU = {
    reg8: new Uint8Array(8), // 8 bit registers
    reg16: new Uint16Array(2), // 16 bit registers
    PCinc: 0,
    stopped: true,

    setFlag(flag, value) {
        if (value)
            this.reg8[Reg8.F] |= 1 << flag;
        else
            this.reg8[Reg8.F] &= ~(1 << flag);
    },
    getFlag(flag) {
        return this.reg8[Reg8.F] & (1 << flag) != 0;
    },
    setHalfCarry(addend1, addend2) {
        // set half carry flag if the sum of the lower nibbles is greater than 0b1111 (a half carry occured)
        this.setFlag(Flag.H, ((addend1 & 0xF) + (addend2 & 0xF)) > 0xF);
    },
    setCarry(addend1, addend2) {
        // set carry flag if the sum of the two values is greater than 0b11111111 (a carry occured)
        this.setFlag(Flag.C, ((addend1 & 0xFF) + (addend2 & 0xFF)) > 0xFF);
    },
    displayRegisters() {
        for (const reg of Object.keys(Reg8)) {
            const value = this.reg8[Reg8[reg]];
            if (value == undefined) break;

            const row = register8Table.querySelector('#' + reg).childNodes; // children of the row are the cells

            row[1].innerHTML = '0b' + value.toString(2).toUpperCase().padStart(8, '0');
            row[2].innerHTML = '0x' + value.toString(16).toUpperCase().padStart(2, '0');
            row[3].innerHTML = value;
        }

        for (const reg of Object.keys(Reg16)) {
            const value = this.reg16[Reg16[reg]];
            if (value == undefined) break;

            const row = register16Table.querySelector('#' + reg).childNodes; // children of the row are the cells

            row[1].innerHTML = '0b' + value.toString(2).toUpperCase().padStart(16, '0');
            row[2].innerHTML = '0x' + value.toString(16).toUpperCase().padStart(4, '0');
            row[3].innerHTML = value;
        }
    },
    /**
     * 
     * @param {Reg8} reg1 First 8 bit register
     * @param {Reg8} reg2 Second 8 bit register (should be adjacent to first)
     * @param {number} val Value to write to combined register
     */
    combinedRegWrite(reg1, reg2, val) {
        this.reg8[reg1] = val >> 8; // higher byte into first reg
        this.reg8[reg2] = val & 0xFF; // lower byte into second reg
    },
    /**
     * 
     * @param {Reg8} reg1 First 8 bit register
     * @param {Reg8} reg2 Second 8 bit register (should be adjacent to first)
     */
    combinedRegRead(reg1, reg2) {
        return (this.reg8[reg1] << 8) + this.reg8[reg2];
    },
    getHL() {
        return this.combinedRegRead(Reg8.H, Reg8.L);
    },
    nop() {
        return () => 1; // return function that returns 1 so that PC is incremented
    },
    // if stop is being used in instruction lookup table (default), return instruction
    stop(inLUT = true) {
        const instr = () => {
            this.stopped = true;

            startButton.background = 'green';
            startButton.value = 'Start';

            return 1;
        };
        return inLUT ? instr : instr();
    },
    halt() {
        // for now, halt just stops the cpu
        return () => {
            this.stopped = true;
            return 1;
        }
    },
    ld8(dest, src) {
        switch (dest) {
            case Reg8.HL_ADDRESS:
                return () => {
                    RAM.write(RAM.read(this.getHL()), this.reg8[src]);
                    return 1;
                };
            case Reg8.BC_ADDRESS:
                return () => {
                    RAM.write(RAM.read(this.combinedRegRead(Reg8.B, Reg8.C)), this.reg8[src]);
                    return 1;
                };
            case Reg8.DE_ADDRESS:
                return () => {
                    RAM.write(RAM.read(this.combinedRegRead(Reg8.D, Reg8.E)), this.reg8[src]);
                    return 1;
                };
            case Reg8.MEMORY:
                return (addr_high, addr_low) => {
                    RAM.write(RAM.read((addr_high << 8) + addr_low), this.reg8[src]);
                    return 1;
                };
        }
        switch (src) {
            case Reg8.HL_ADDRESS:
                return () => {
                    this.reg8[dest] = RAM.read(this.getHL());
                    return 1;
                };
            case Reg8.BC_ADDRESS:
                return () => {
                    this.reg8[dest] = RAM.read(this.combinedRegRead(Reg8.B, Reg8.C));
                    return 1;
                };
            case Reg8.DE_ADDRESS:
                return () => {
                    this.reg8[dest] = RAM.read(this.combinedRegRead(Reg8.D, Reg8.E));
                    return 1;
                };
            case Reg8.MEMORY:
                return (addr_high, addr_low) => {
                    this.reg8[dest] = RAM.read((addr_high << 8) + addr_low);
                    return 1;
                };
        }
        // if no special cases, load simple reg8 into reg8
        return () => {
            this.reg8[dest] = this.reg8[src];
            return 1;
        }
    },
    // dest is the first register in a 2 byte reg pair (B -> BC, D -> DE)
    ld16(dest, src) {
        if (src == Reg16.CONSTANT) {
            if (dest == Reg16.SP) {
                return (imm16_h, imm16_l) => {
                    this.reg16[Reg16.SP] = (imm16_h << 8) + imm16_l;
    
                    return 3; // skip instruction, imm16_h, imm16_l
                }
            } else {
                return (imm16_h, imm16_l) => {
                    this.combinedRegWrite(dest, dest + 1, (imm16_h << 8) + imm16_l);
    
                    return 3;
                }
            }
        } else {
            if (dest == Reg16.SP) {
                return () => {
                    this.reg16[Reg16.SP] = this.combinedRegRead(Reg8.H, Reg8.L);
    
                    return 1; // skip instruction
                }
            }
        }
    },
    ldSP() { // loads the value of the stack pointer into the memory defined by next two bytes
        return (addr_h, addr_l) => {
            RAM.write(addr_h, this.reg16[Reg16.SP] >> 8);
            RAM.write(addr_l, this.reg16[Reg16.SP] & 0xFF);

            return 3;
        }
    },
    // dec argument allows this function to work as decrement as well
    inc8(reg, dec = false) {
        if (reg == Reg8.HL_ADDRESS) {
            return () => {
                const HLvalue = this.getHL();
                const ramValue = RAM.read(HLvalue);
                const res = ramValue + (dec ? -1 : 1)
                RAM.write(HLvalue, res);

                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, dec);
                this.setHalfCarry(ramValue, (dec ? -1 : 1));

                return 1;
            }
        } else {
            return () => {
                const regValue = this.reg8[reg];
                const res = regValue += dec ? -1 : 1;

                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, dec);
                this.setHalfCarry(regValue, (dec ? -1 : 1));

                return 1;
            }
        }
    },
    // dec argument allows this function to work as decrement as well
    inc16(reg, dec = false) {
        if (reg == Reg16.SP) {
            return () => {
                this.reg16[Reg16.SP] += dec ? -1 : 1;
                return 1;
            }
        } else {
            return () => {
                this.combinedRegWrite(reg, reg + 1, this.combinedRegRead(reg, reg + 1) + (dec ? -1 : 1));
                return 1;
            }
        }
    },
    add8(register, addend, carry = false, subtract = false) {
        if (addend == Reg8.HL_ADDRESS) {
            return () => {
                // add data at address pointed to by HL to the register specified and save result
                const regValue = this.reg8[register];
                const ramValue = (RAM.read(this.getHL()) + carry * this.getFlag(Flag.C)) * (subtract ? -1 : 1);
                const res = this.reg8[register] += ramValue;
                
                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, subtract);
                this.setHalfCarry(regValue, ramValue);
                this.setCarry(regValue, ramValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        } else if (addend == Reg8.CONSTANT) {
            return (imm8) => {
                // add immediate value to the register specified and save result
                const regValue = this.reg8[register];
                imm8 = (imm8 + carry * this.getFlag(Flag.C)) * (subtract ? -1 : 1)
                const res = this.reg8[register] += imm8;
                
                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, subtract);
                this.setHalfCarry(regValue, imm8);
                this.setCarry(regValue, imm8);

                return 2; // increment PC by 2 (skip forward instruction length + constant number)
            }
        } else { // normal register addition
            return () => {
                // add value in addend register to the register specified and save result
                const regValue = this.reg8[register];
                const addValue = (this.reg8[addend] + carry * this.getFlag(Flag.C)) * (subtract ? -1 : 1);
                const res = this.reg8[register] += addValue;
                
                this.setFlag(Flag.Z, res == 0);
                this.setFlag(Flag.N, subtract);
                this.setHalfCarry(regValue, addValue);
                this.setCarry(regValue, addValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        }
    },
    addSP() {
        return (imm8) => {
            const regValue = this.reg16[Reg16.SP];
            
            this.reg16[Reg16.SP] += imm8;
            
            this.setFlag(Flag.Z, 0);
            this.setFlag(Flag.N, 0);
            this.setHalfCarry(regValue, imm8);
            this.setCarry(regValue, imm8);
            
            return 1; // increment PC by 1 (skip forward instruction length)
        }
    },
    addHL(reg16) {
        if (reg16 != Reg16.SP) {
            return () => {
                const HLvalue = this.getHL();
                const regValue = this.combinedRegRead(reg16, reg16 + 1);

                this.setFlag(Flag.N, 0);
                this.setHalfCarry(HLvalue, regValue);
                this.setCarry(HLvalue, regValue);

                this.combinedRegWrite(Reg8.H, Reg8.L, HLvalue + regValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        } else { // this.reg16 refers to stack pointer
            return () => {
                const HLvalue = this.getHL();
                const regValue = this.reg16[Reg16.SP];

                this.setFlag(Flag.N, 0);
                this.setHalfCarry(HLvalue, regValue);
                this.setCarry(HLvalue, regValue);

                this.combinedRegWrite(Reg8.H, Reg8.L, HLvalue + regValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        }
    },
    rotate(reg8, left, carry) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                let HLdata = RAM.read(this.getHL());
                const rotatedBit = HLdata & (left ? (1 << 7) : 1); // depending on direction (left or right), save bit 0 or 7

                if (left)
                    HLdata = (HLdata << 1) & 0xFF; // shift left once, cut off bit 8
                else
                    HLdata >>= 1; // shift right once

                if (carry) { // if carry, put the rotatedBit into bit0/7
                    if (rotatedBit)
                        HLdata |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                } else { // if not carry, put the previous carry bit into bit0/7
                    if (this.getFlag(Flag.C))
                        HLdata |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                }
                
                RAM.write(this.getHL(), HLdata); 

                this.setFlag(Flag.Z, HLdata == 0);
                this.setFlag(Flag.N, 0);
                this.setFlag(Flag.H, 0);
                this.setFlag(Flag.C, rotatedBit);

                return 1;
            }
        } else {
            return () => {
                const rotatedBit = this.reg8[reg8] & (left ? (1 << 7) : 1); // depending on direction (left or right), save bit 0 or 7

                if (left)
                    this.reg8[reg8] <<= 1;
                else
                    this.reg8[reg8] >>= 1;

                if (carry) { // copy rotated bit into carry flag
                    if (rotatedBit)
                        this.reg8[reg8] |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                } else {
                    if (this.getFlag(Flag.C))
                        this.reg8[reg8] |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                }

                this.setFlag(Flag.Z, this.reg8[reg8] == 0);
                this.setFlag(Flag.N, 0);
                this.setFlag(Flag.H, 0);
                this.setFlag(Flag.C, rotatedBit);

                return 1;
            }
        }
    },
    shift(reg8, left, leaveBit7) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                let HLdata = RAM.read(this.getHL());
                // if shifting to the left, save bit7 in carry
                // else save bit0
                this.setFlag(Flag.C, HLdata & (left ? (1 << 7) : 1));
                
                if (left)
                    HLdata = (HLdata << 1) & 0xFF; // shift left once, cut off bit 8
                else {
                    if (leaveBit7) // get bit7 of HLdata, OR it with HLdata shifted to the right once
                        HLdata = (HLdata & (1 << 7)) | (HLdata >> 1);
                    else
                        HLdata >>= 1; // else just shift it normally, reseting bit 7
                }
                
                RAM.write(this.getHL(), HLdata); 

                this.setFlag(Flag.Z, HLdata == 0);
                this.setFlag(Flag.N, 0);
                this.setFlag(Flag.H, 0);

                return 1;
            }
        } else {
            return () => {
                this.setFlag(Flag.C, this.reg8[reg8] & (left ? (1 << 7) : 1));

                if (left)
                    this.reg8[reg8] <<= 1; // shift left once, cut off bit 8
                else {
                    if (leaveBit7) // get bit7 of reg, OR it with reg shifted to the right once
                        this.reg8[reg8] = (this.reg8[reg8] & (1 << 7)) | (this.reg8[reg8] >> 1);
                    else
                        this.reg8[reg8] >>= 1; // else just shift it normally, reseting bit 7
                }

                this.setFlag(Flag.Z, this.reg8[reg8] == 0);
                this.setFlag(Flag.N, 0);
                this.setFlag(Flag.H, 0);

                return 1;
            }
        }
    },
    bit(bit, reg8) {
        const mask = (1 << bit);
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                const bitValue = RAM.read(this.getHL()) & mask;

                this.setFlag(Flag.Z, !bitValue)
                this.setFlag(Flag.N, 0);
                this.setFlag(Flag.H, 1);

                return 1;
            }
        } else {
            return () => {
                const bitValue = this.reg8[reg8] & mask;

                this.setFlag(Flag.Z, !bitValue)
                this.setFlag(Flag.N, 0);
                this.setFlag(Flag.H, 1);

                return 1;
            }
        }
    },
    res(bit, reg8) {
        const mask = ~(1 << bit);
        if (reg8 == Reg8.HL_ADDRESS) {    
            return () => {
                RAM.write(this.getHL(), RAM.read(this.getHL()) & mask);
                return 1;
            }
        } else {
            return () => {
                this.reg8[reg8] &= mask;
                return 1;
            }
        }
    },
    set(bit, reg8) {
        const mask = (1 << bit);
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                RAM.write(this.getHL(), RAM.read(this.getHL()) | mask);
                return 1;
            }
        } else {
            return () => {
                this.reg8[reg8] |= mask;
                return 1;
            }
        }
    },
};

function generateRegisterTable() {
    for (const reg of Object.keys(Reg8)) { // loop through all 8-bit registers
        if (Reg8[reg] > CPU.reg8.length - 1) break;

        const row = document.createElement('tr'); // make a row for each reg
        row.id = reg; // create ID so we can index it later

        const regLabel = document.createElement('td');
        regLabel.innerHTML = reg;

        row.append(regLabel);
        // append 3 cells for the different display types
        row.append(document.createElement('td'), document.createElement('td'), document.createElement('td'));

        register8Table.append(row); // add row to table
    }

    for (const reg of Object.keys(Reg16)) { // loop through all 16-bit registers
        if (Reg16[reg] > CPU.reg16.length - 1) break;
        
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