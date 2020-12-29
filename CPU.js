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

const Reg16Order = [
    Reg8.B,
    Reg8.D,
    Reg8.H,
    Reg16.SP,
];

/**
 * Bit offsets for flag register (F)
 * @typedef {number} Flag
 */
const Flag = Object.freeze({
    Z: 1 << 7,
    N: 1 << 6,
    H: 1 << 5,
    C: 1 << 4
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

const Interrupt = Object.freeze({
    VBLANK: 0x40,
    STAT: 0x48,
    TIMER: 0x50,
    SERIAL: 0x58,
    JOYPAD: 0x60
});

const register8Table = document.querySelector('#register8-table');
const register16Table = document.querySelector('#register16-table');
const IMEval = document.querySelector('#IME-val');
const IFlist = document.querySelectorAll('.IF');
const IElist = Array.from(document.querySelectorAll('.IE'));

const CPU = {
    reg8: new Uint8Array(8), // 8 bit registers
    reg16: new Uint16Array(2), // 16 bit registers
    PCinc: 0,
    IME: true,
    stopped: true,

    setFlags(flag, value) {
        if (value)
            this.reg8[Reg8.F] |= flag;
        else
            this.reg8[Reg8.F] &= ~flag;
    },
    getFlag(flag) {
        return (this.reg8[Reg8.F] & flag) != 0;
    },
    setHalfCarry(addend1, addend2) {
        // set half carry flag if the sum of the lower nibbles is greater than 0b1111 (a half carry occured)
        this.setFlags(Flag.H, ((addend1 & 0xF) + (addend2 & 0xF)) > 0xF);
    },
    setCarry(addend1, addend2) {
        // set carry flag if the sum of the two values is greater than 0b11111111 (a carry occured)
        this.setFlags(Flag.C, ((addend1 & 0xFF) + (addend2 & 0xFF)) > 0xFF);
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
    scf() {
        return () => {
            this.setFlags(Flag.C, 1);
            this.setFlags(Flag.N + Flag.H, 0);
            return 1;
        }
    },
    ccf() {
        return () => {
            this.reg8[Reg8.F] ^= Flag.C; // flip carry flag
            this.setFlags(Flag.N + Flag.H, 0);
            return 1;
        }
    },
    cpl() {
        return () => {
            this.reg8[Reg8.A] = ~this.reg8[Reg8.A]; // flip bits of A reg

            this.setFlags(Flag.N + Flag.H, 0);

            return 1;
        }
    },
    // converts data in A register to binary coded decimal
    daa() {
        return () => {
            let Adata = this.reg8[Reg8.A];

            const tensPlace = Math.floor(Adata / 10) % 10;
            const onesPlace = Adata % 10;

            this.reg8[Reg8.A] = (tensPlace << 4) + onesPlace;

            this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
            this.setFlags(Flag.H, 0);
            // this.setFlags Carry???

            return 1;
        }
    },
    ei() {
        return () => {
            this.IME = true;
            IMEval.innerHTML = 1;
            return 1;
        }
    },
    di() {
        return () => {
            this.IME = false;
            IMEval.innerHTML = 0;
            return 1;
        }
    },
    reti() {
        const instr = this.ret();
        return () => {
            this.IME = true; // enable interrupts and return normally
            IMEval.innerHTML = 1;
            return instr();
        }
    },
    rst(addr) {
        const instr = this.jump(false); // jump with no condition
        return () => instr(addr); // call the jump instruction to address specified as method parameter
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
                return (addr_l, addr_h) => {
                    RAM.write(RAM.read((addr_h << 8) + addr_l), this.reg8[src]);
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
                return (addr_l, addr_h) => {
                    this.reg8[dest] = RAM.read((addr_h << 8) + addr_l);
                    return 1;
                };
        }
        // if no special cases, simply load src into dest
        return () => {
            this.reg8[dest] = this.reg8[src];
            return 1;
        }
    },
    ld8Data(reg8) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return (imm8) => {
                RAM.write(this.getHL(), imm8);
                return 2;
            }
        } else {
            return (imm8) => {
                this.reg8[reg8] = imm8;
                return 2;
            }
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
        return (addr_l, addr_h) => {
            RAM.write(addr_h, this.reg16[Reg16.SP] >> 8);
            RAM.write(addr_l, this.reg16[Reg16.SP] & 0xFF);

            return 3;
        }
    },
    // dec argument allows this function to work as decrement as well
    inc8(reg, dec = false) {
        if (reg == Reg8.HL_ADDRESS) {
            return dec ? () => {
                const HLvalue = this.getHL();
                const ramValue = RAM.read(HLvalue);
                const res = (ramValue - 1) & 0xFF;
                RAM.write(HLvalue, res);

                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, 1);
                this.setHalfCarry(ramValue, -1);

                return 1;
            } : () => {
                const HLvalue = this.getHL();
                const ramValue = RAM.read(HLvalue);
                const res = (ramValue + 1) & 0xFF;
                RAM.write(HLvalue, res);

                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, 0);
                this.setHalfCarry(ramValue, 1);

                return 1;
            }
        } else {
            return dec ? () => {
                const regValue = this.reg8[reg];
                const res = --this.reg8[reg];

                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, 1);
                this.setHalfCarry(regValue, -1);

                return 1;
            } : () => {
                const regValue = this.reg8[reg];
                const res = ++this.reg8[reg];

                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, 0);
                this.setHalfCarry(regValue, 1);

                return 1;
            };
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
                
                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, subtract);
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
                
                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, subtract);
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
                
                this.setFlags(Flag.Z, res == 0);
                this.setFlags(Flag.N, subtract);
                this.setHalfCarry(regValue, addValue);
                this.setCarry(regValue, addValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        }
    },
    addSP() {
        return (imm8) => {
            imm8 = twosComp(imm8);

            const regValue = this.reg16[Reg16.SP];
            
            this.reg16[Reg16.SP] += imm8;
            
            this.setFlags(Flag.Z + Flag.N, 0);
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

                this.setFlags(Flag.N, 0);
                this.setHalfCarry(HLvalue, regValue);
                this.setCarry(HLvalue, regValue);

                this.combinedRegWrite(Reg8.H, Reg8.L, HLvalue + regValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        } else { // this.reg16 refers to stack pointer
            return () => {
                const HLvalue = this.getHL();
                const regValue = this.reg16[Reg16.SP];

                this.setFlags(Flag.N, 0);
                this.setHalfCarry(HLvalue, regValue);
                this.setCarry(HLvalue, regValue);

                this.combinedRegWrite(Reg8.H, Reg8.L, HLvalue + regValue);

                return 1; // increment PC by 1 (skip forward instruction length)
            }
        }
    },
    and(reg8) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                this.reg8[Reg8.A] &= RAM.read(this.getHL());
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.C, 0);
                this.setFlags(Flag.H, 1);

                return 1;
            }
        } else if (reg8 == Reg8.CONSTANT) {
            return (imm8) => {
                this.reg8[Reg8.A] &= imm8;

                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.C, 0);
                this.setFlags(Flag.H, 1);

                return 1;
            }
        } else {
            return () => {
                this.reg8[Reg8.A] &= this.reg8[reg8];
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.C, 0);
                this.setFlags(Flag.H, 1);

                return 1;
            }
        }
    },
    or(reg8) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                this.reg8[Reg8.A] |= RAM.read(this.getHL());
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.H + Flag.C, 0);

                return 1;
            }
        } else if (reg8 == Reg8.CONSTANT) {
            return (imm8) => {
                this.reg8[Reg8.A] |= imm8;
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.H + Flag.C, 0);

                return 1;
            }
        } else {
            return () => {
                this.reg8[Reg8.A] |= this.reg8[reg8];
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.H + Flag.C, 0);

                return 1;
            }
        }
    },
    xor(reg8) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                this.reg8[Reg8.A] ^= RAM.read(this.getHL());
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.H + Flag.C, 0);

                return 1;
            }
        } else if (reg8 == Reg8.CONSTANT) {
            return (imm8) => {
                this.reg8[Reg8.A] ^= imm8;
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.H + Flag.C, 0);

                return 1;
            }
        } else {
            return () => {
                this.reg8[Reg8.A] ^= this.reg8[reg8];
                
                this.setFlags(Flag.Z, this.reg8[Reg8.A] == 0);
                this.setFlags(Flag.N + Flag.H + Flag.C, 0);

                return 1;
            }
        }
    },
    cp(reg8) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                let Avalue = this.reg8[Reg8.A];
                const ramValue = RAM.read(this.getHL());
                Avalue -= ramValue;
                
                this.setFlags(Flag.Z, Avalue == 0);
                this.setFlags(Flag.N, 1);
                this.setHalfCarry(this.reg8[Reg8.A], -ramValue);
                this.setCarry(this.reg8[Reg8.A], -ramValue);

                return 1;
            }
        } else if (reg8 == Reg8.CONSTANT) {
            return (imm8) => {
                let Avalue = this.reg8[Reg8.A];
                Avalue -= imm8;
                
                this.setFlags(Flag.Z, Avalue == 0);
                this.setFlags(Flag.N, 1);
                this.setHalfCarry(this.reg8[Reg8.A], -imm8);
                this.setCarry(this.reg8[Reg8.A], -imm8);

                return 1;
            }
        } else {
            return () => {
                let Avalue = this.reg8[Reg8.A];
                const regValue = this.reg8[reg8];
                Avalue -= regValue;
                
                this.setFlags(Flag.Z, Avalue == 0);
                this.setFlags(Flag.N, 1);
                this.setHalfCarry(this.reg8[Reg8.A], -regValue);
                this.setCarry(this.reg8[Reg8.A], -regValue);

                return 1;
            }
        }
    },
    // takes the first register of a 16 bit register pair
    push(reg16) {
        return () => {
            this.reg16[Reg16.SP]--;
            if (this.reg16[Reg16.SP] <= TOP_OF_STACK)
                console.log('STACK OVERFLOW! (he said the thing!)');
            else
                RAM.write(this.reg16[Reg16.SP], this.reg8[reg16]); // put high byte of reg pair into SP - 1
            
            this.reg16[Reg16.SP]--;
            RAM.write(this.reg16[Reg16.SP], this.reg8[reg16 + 1]); // put lower byte of reg pair into SP - 2

            return 1;
        }
    },
    // takes the first register of a 16 bit register pair
    pop(reg16) {
        return () => {
            this.reg8[reg16 + 1] = RAM.read(this.reg16[Reg16.SP]); // put contents at SP into low byte of reg pair
            this.reg16[Reg16.SP]++;
            this.reg8[reg16] = RAM.read(this.reg16[Reg16.SP]); // put contents at SP + 1 into high byte of reg pair
            this.reg16[Reg16.SP]++;

            return 1;
        }
    },
    ret(returnCondition) {
        switch (returnCondition) {
            case undefined:
                return () => {
                    // put value at SP into PC (SP -> low byte, SP + 1 -> high byte)
                    this.reg16[Reg16.PC] = (RAM.read(this.reg16[Reg16.SP] + 1) << 8) + RAM.read(this.reg16[Reg16.SP]);
                    this.reg16[Reg16.SP] += 2; // increment SP by 2, maintaining stack order

                    return 0; // return zero, as the instruction at PC needs to be executed next
                };
            case JumpCondition.Z:
                return () => {
                    if (this.getFlag(Flag.Z)) {
                        // put value at SP into PC (SP -> low byte, SP + 1 -> high byte)
                        this.reg16[Reg16.PC] = (RAM.read(this.reg16[Reg16.SP] + 1) << 8) + RAM.read(this.reg16[Reg16.SP]);
                        this.reg16[Reg16.SP] += 2; // increment SP by 2, maintaining stack order
                        
                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1; // else, do nothing and increment PC as normal to get to next instruction
                };
            case JumpCondition.NZ:
                return () => {
                    if (!this.getFlag(Flag.Z)) {
                        // put value at SP into PC (SP -> low byte, SP + 1 -> high byte)
                        this.reg16[Reg16.PC] = (RAM.read(this.reg16[Reg16.SP] + 1) << 8) + RAM.read(this.reg16[Reg16.SP]);
                        this.reg16[Reg16.SP] += 2; // increment SP by 2, maintaining stack order
                        
                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1; // else, do nothing and increment PC as normal to get to next instruction
                };
            case JumpCondition.C:
                return () => {
                    if (this.getFlag(Flag.C)) {
                        // put value at SP into PC (SP -> low byte, SP + 1 -> high byte)
                        this.reg16[Reg16.PC] = (RAM.read(this.reg16[Reg16.SP] + 1) << 8) + RAM.read(this.reg16[Reg16.SP]);
                        this.reg16[Reg16.SP] += 2; // increment SP by 2, maintaining stack order
                        
                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1; // else, do nothing and increment PC as normal to get to next instruction
                };
            case JumpCondition.NC:
                return () => {
                    if (!this.getFlag(Flag.C)) {
                        // put value at SP into PC (SP -> low byte, SP + 1 -> high byte)
                        this.reg16[Reg16.PC] = (RAM.read(this.reg16[Reg16.SP] + 1) << 8) + RAM.read(this.reg16[Reg16.SP]);
                        this.reg16[Reg16.SP] += 2; // increment SP by 2, maintaining stack order
                        
                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1; // else, do nothing and increment PC as normal to get to next instruction
                };
        }
    },
    call(callCondition) {
        switch (callCondition) {
            case undefined:
                return (addr_l, addr_h) => {
                    // push PC + 1 onto stack
                    this.reg16[Reg16.SP]--;
                    if (this.reg16[Reg16.SP] <= TOP_OF_STACK)
                        console.log('STACK OVERFLOW! (he said the thing!)');
                    else
                        RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) >> 8); // put high byte of PC + 1 into SP - 1
                    
                    this.reg16[Reg16.SP]--;
                    RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) & 0xFF); // put lower byte of PC + 1 into SP - 2

                    this.reg16[Reg16.PC] = (addr_h << 8) + addr_l;

                    return 0; // return zero, as the instruction at PC needs to be executed next
                };
            case JumpCondition.Z:
                return (addr_l, addr_h) => {
                    if (this.getFlag(Flag.Z)) {
                        // push PC + 1 onto stack
                        this.reg16[Reg16.SP]--;
                        if (this.reg16[Reg16.SP] <= TOP_OF_STACK)
                            console.log('STACK OVERFLOW! (he said the thing!)');
                        else
                            RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) >> 8); // put high byte of PC + 1 into SP - 1
                        
                        this.reg16[Reg16.SP]--;
                        RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) & 0xFF); // put lower byte of PC + 1 into SP - 2

                        this.reg16[Reg16.PC] = (addr_h << 8) + addr_l;

                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1;
                };
            case JumpCondition.NZ:
                return (addr_l, addr_h) => {
                    if (!this.getFlag(Flag.Z)) {
                        // push PC + 1 onto stack
                        this.reg16[Reg16.SP]--;
                        if (this.reg16[Reg16.SP] <= TOP_OF_STACK)
                            console.log('STACK OVERFLOW! (he said the thing!)');
                        else
                            RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) >> 8); // put high byte of PC + 1 into SP - 1
                        
                        this.reg16[Reg16.SP]--;
                        RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) & 0xFF); // put lower byte of PC + 1 into SP - 2

                        this.reg16[Reg16.PC] = (addr_h << 8) + addr_l;

                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1;
                };
            case JumpCondition.C:
                return (addr_l, addr_h) => {
                    if (this.getFlag(Flag.C)) {
                        // push PC + 1 onto stack
                        this.reg16[Reg16.SP]--;
                        if (this.reg16[Reg16.SP] <= TOP_OF_STACK)
                            console.log('STACK OVERFLOW! (he said the thing!)');
                        else
                            RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) >> 8); // put high byte of PC + 1 into SP - 1
                        
                        this.reg16[Reg16.SP]--;
                        RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) & 0xFF); // put lower byte of PC + 1 into SP - 2

                        this.reg16[Reg16.PC] = (addr_h << 8) + addr_l;

                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1;
                };
            case JumpCondition.NC:
                return (addr_l, addr_h) => {
                    if (!this.getFlag(Flag.C)) {
                        // push PC + 1 onto stack
                        this.reg16[Reg16.SP]--;
                        if (this.reg16[Reg16.SP] <= TOP_OF_STACK)
                            console.log('STACK OVERFLOW! (he said the thing!)');
                        else
                            RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) >> 8); // put high byte of PC + 1 into SP - 1
                        
                        this.reg16[Reg16.SP]--;
                        RAM.write(this.reg16[Reg16.SP], (this.reg16[Reg16.PC] + 1) & 0xFF); // put lower byte of PC + 1 into SP - 2

                        this.reg16[Reg16.PC] = (addr_h << 8) + addr_l;

                        return 0; // return zero, as the instruction at PC needs to be executed next
                    } else return 1;
                };
        }
    },
    rotate(reg8, left, carry) {
        if (reg8 == Reg8.HL_ADDRESS) {
            if (left) {
                if (carry) {
                    return () => {
                        let HLdata = RAM.read(this.getHL());
                        const rotatedBit = HLdata & (1 << 7);
                        HLdata = (HLdata << 1) & 0xFF; // shift left once, cut off bit 8

                        if (rotatedBit)
                            HLdata |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                        
                        RAM.write(this.getHL(), HLdata); 

                        this.setFlags(Flag.Z, HLdata == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                } else {
                    return () => {
                        let HLdata = RAM.read(this.getHL());
                        const rotatedBit = HLdata & (1 << 7);
                        HLdata = (HLdata << 1) & 0xFF; // shift left once, cut off bit 8

                        if (this.getFlag(Flag.C))
                            HLdata |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                        
                        RAM.write(this.getHL(), HLdata); 

                        this.setFlags(Flag.Z, HLdata == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                }
            } else {
                if (carry) {
                    return () => {
                        let HLdata = RAM.read(this.getHL());
                        const rotatedBit = HLdata & 1; // depending on direction (left or right), save bit 0 or 7

                        HLdata >>= 1; // shift right once

                        if (rotatedBit)
                            HLdata |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                        
                        RAM.write(this.getHL(), HLdata); 

                        this.setFlags(Flag.Z, HLdata == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                } else {
                    return () => {
                        let HLdata = RAM.read(this.getHL());
                        const rotatedBit = HLdata & 1; // depending on direction (left or right), save bit 0 or 7

                        HLdata >>= 1; // shift right once

                        if (this.getFlag(Flag.C))
                            HLdata |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                        
                        RAM.write(this.getHL(), HLdata); 

                        this.setFlags(Flag.Z, HLdata == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }   
                }
            }
        } else {
            if (left) {
                if (carry) {
                    return () => {
                        const rotatedBit = this.reg8[reg8] & (1 << 7); // depending on direction (left or right), save bit 0 or 7

                        this.reg8[reg8] <<= 1;

                        if (rotatedBit)
                            this.reg8[reg8] |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side

                        this.setFlags(Flag.Z, this.reg8[reg8] == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                } else {
                    return () => {
                        const rotatedBit = this.reg8[reg8] & (1 << 7); // depending on direction (left or right), save bit 0 or 7

                        this.reg8[reg8] <<= 1;

                        if (this.getFlag(Flag.C))
                            this.reg8[reg8] |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side

                        this.setFlags(Flag.Z, this.reg8[reg8] == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                }
            } else {
                if (carry) {
                    return () => {
                        const rotatedBit = this.reg8[reg8] & 1; // depending on direction (left or right), save bit 0 or 7

                        this.reg8[reg8] >>= 1;

                        if (rotatedBit)
                            this.reg8[reg8] |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side
                    
                        this.setFlags(Flag.Z, this.reg8[reg8] == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                } else {
                    return () => {
                        const rotatedBit = this.reg8[reg8] & 1; // depending on direction (left or right), save bit 0 or 7

                        this.reg8[reg8] >>= 1;

                        if (this.getFlag(Flag.C))
                            this.reg8[reg8] |= left ? 1 : (1 << 7); // if rotated bit was 1, add it back to the right/left side

                        this.setFlags(Flag.Z, this.reg8[reg8] == 0);
                        this.setFlags(Flag.N + Flag.H, 0);
                        this.setFlags(Flag.C, rotatedBit);

                        return 1;
                    }
                }
            }
        }
    },
    shift(reg8, left, leaveBit7) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                let HLdata = RAM.read(this.getHL());
                // if shifting to the left, save bit7 in carry
                // else save bit0
                this.setFlags(Flag.C, HLdata & (left ? (1 << 7) : 1));
                
                if (left)
                    HLdata = (HLdata << 1) & 0xFF; // shift left once, cut off bit 8
                else {
                    if (leaveBit7) // get bit7 of HLdata, OR it with HLdata shifted to the right once
                        HLdata = (HLdata & (1 << 7)) | (HLdata >> 1);
                    else
                        HLdata >>= 1; // else just shift it normally, reseting bit 7
                }
                
                RAM.write(this.getHL(), HLdata); 

                this.setFlags(Flag.Z, HLdata == 0);
                this.setFlags(Flag.N + Flag.H, 0);

                return 1;
            }
        } else {
            return () => {
                this.setFlags(Flag.C, this.reg8[reg8] & (left ? (1 << 7) : 1));

                if (left)
                    this.reg8[reg8] <<= 1; // shift left once, cut off bit 8
                else {
                    if (leaveBit7) // get bit7 of reg, OR it with reg shifted to the right once
                        this.reg8[reg8] = (this.reg8[reg8] & (1 << 7)) | (this.reg8[reg8] >> 1);
                    else
                        this.reg8[reg8] >>= 1; // else just shift it normally, reseting bit 7
                }

                this.setFlags(Flag.Z, this.reg8[reg8] == 0);
                this.setFlags(Flag.N + Flag.H, 0);

                return 1;
            }
        }
    },
    swap(reg8) {
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                let HLdata = RAM.read(this.getHL());
                const highNibble = HLdata >> 4; // shift 4 times to the right to get high nibble
                HLdata &= 0x0F; // get lower nibble into HLdata

                RAM.write(this.getHL(), (HLdata << 4) + highNibble);

                return 1;
            }
        } else {
            return () => {
                //   xxxxllll0000 // reg << 4
                // +     0000hhhh // reg >> 4
                // --------------
                //   xxxxllllhhhh <- top 4 bits (xxxx) are chopped off because registers are only 8 bits!
                this.reg8[reg8] = (this.reg8[reg8] << 4) + (this.reg8[reg8] >> 4);

                return 1;
            }
        }
    },
    jump(bounded, jumpCondition) {
        if (bounded) { // if instruction is JR, add immediate signed value to PC based on conditions
            switch (jumpCondition) {
                case undefined:
                    return (imm8) => {
                        this.reg16[Reg16.PC] += twosComp(imm8);
                        return 0;
                    };
                case JumpCondition.Z:
                    return (imm8) => {
                        if (this.getFlag(Flag.Z)) {
                            this.reg16[Reg16.PC] += twosComp(imm8);
                            return 0;
                        } else return 1;
                    };
                case JumpCondition.NZ:
                    return (imm8) => {
                        if (!this.getFlag(Flag.Z)) {
                            this.reg16[Reg16.PC] += twosComp(imm8);
                            return 0;
                        } else return 1;
                    };
                case JumpCondition.C:
                    return (imm8) => {
                        if (this.getFlag(Flag.C)) {
                            this.reg16[Reg16.PC] += twosComp(imm8);
                            return 0;
                        } else return 1;
                    };
                case JumpCondition.NC:
                    return (imm8) => {
                        if (!this.getFlag(Flag.C)) {
                            this.reg16[Reg16.PC] += twosComp(imm8);
                            return 0;
                        } else return 1;
                    };
            }
        } else {
            switch (jumpCondition) {
                case undefined:
                    return (imm16_l, imm16_h) => {
                        this.reg16[Reg16.PC] = (imm16_h << 8) + imm16_l;
                        return 0;
                    };
                case JumpCondition.Z:
                    return (imm16_l, imm16_h) => {
                        if (this.getFlag(Flag.Z)) {
                            this.reg16[Reg16.PC] = (imm16_h << 8) + imm16_l;
                            return 0;
                        } else return 1;
                    };
                case JumpCondition.NZ:
                    return (imm16_l, imm16_h) => {
                        if (!this.getFlag(Flag.Z)) {
                            this.reg16[Reg16.PC] = (imm16_h << 8) + imm16_l;
                            return 0;
                        } else return 1;
                    };
                case JumpCondition.C:
                    return (imm16_l, imm16_h) => {
                        if (this.getFlag(Flag.C)) {
                            this.reg16[Reg16.PC] = (imm16_h << 8) + imm16_l;
                            return 0;
                        } else return 1;
                    };
                case JumpCondition.NC:
                    return (imm16_l, imm16_h) => {
                        if (!this.getFlag(Flag.C)) {
                            this.reg16[Reg16.PC] = (imm16_h << 8) + imm16_l;
                            return 0;
                        } else return 1;
                    };
            }
        }
    },
    jumpHL() {
        return () => {
            this.reg16[Reg16.PC] = this.getHL();
            return 0;
        }
    },
    bit(bit, reg8) {
        const mask = (1 << bit);
        if (reg8 == Reg8.HL_ADDRESS) {
            return () => {
                const bitValue = RAM.read(this.getHL()) & mask;

                this.setFlags(Flag.Z, !bitValue)
                this.setFlags(Flag.N, 0);
                this.setFlags(Flag.H, 1);

                return 1;
            }
        } else {
            return () => {
                const bitValue = this.reg8[reg8] & mask;

                this.setFlags(Flag.Z, !bitValue)
                this.setFlags(Flag.N, 0);
                this.setFlags(Flag.H, 1);

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
    setInterruptFlag(interrupt, value) {
        let IF = RAM.read(IO_IF);
        const bit = Object.values(Interrupt).indexOf(interrupt);

        if (value)
            IF |= 1 << bit; // enable
        else
            IF &= ~(1 << bit); // disable

        IFlist[bit].innerHTML = value;

        RAM.write(IO_IF, IF);
    },
    // the weird instructions
    // load A into 16 bit reg memory 
    ldBCA: () => { RAM.write(CPU.combinedRegRead(Reg8.B, Reg8.C), CPU.reg8[Reg8.A]); return 1; },
    ldDEA: () => { RAM.write(CPU.combinedRegRead(Reg8.D, Reg8.E), CPU.reg8[Reg8.A]); return 1;  },
    ldHLincA: () => { // load contents of A into memory at HL, then increment HL
        const hl = CPU.getHL();
        RAM.write(hl, CPU.reg8[Reg8.A]);
        CPU.combinedRegWrite(Reg8.H, Reg8.L, hl + 1);
        return 1;
    },
    ldHLdecA: () => { // load contents of A into memory at HL, then decrement HL
        const hl = CPU.getHL();
        RAM.write(hl, CPU.reg8[Reg8.A]);
        CPU.combinedRegWrite(Reg8.H, Reg8.L, hl - 1);
        return 1;
    },
    // load data at 16 bit reg into A
    ldABC: () => { CPU.reg8[Reg8.A] = RAM.read(CPU.combinedRegRead(Reg8.B, Reg8.C)); return 1; },
    ldADE: () => { CPU.reg8[Reg8.A] = RAM.read(CPU.combinedRegRead(Reg8.D, Reg8.E)); return 1; },
    ldAHLinc: () => { // load contents of memory at HL into A, then increment HL
        const hl = CPU.getHL();
        CPU.reg8[Reg8.A] = RAM.read(hl);
        CPU.combinedRegWrite(Reg8.H, Reg8.L, hl + 1);
        return 1;
    },
    ldAHLdec: () => { // load contents of memory at HL into A, then decrement HL
        const hl = CPU.getHL();
        CPU.reg8[Reg8.A] = RAM.read(hl);
        CPU.combinedRegWrite(Reg8.H, Reg8.L, hl - 1);
        return 1;
    },
    // essentially z80 OUT and IN instructions
    out: (imm8) => { RAM.write(0xFF00 + imm8, CPU.reg8[Reg8.A]); return 2; },
    in: (imm8) => { CPU.reg8[Reg8.A] = RAM.read(0xFF00 + imm8); return 2; },
    // z80 OUT and IN using data at C
    outC: () => { RAM.write(0xFF00 + CPU.reg8[Reg8.C], CPU.reg8[Reg8.A]); return 1; },
    inC: () => { CPU.reg8[Reg8.A] = RAM.read(0xFF00 + CPU.reg8[Reg8.C]); return 1; },
    
    // weirdest instruction by far
    // add s8 to SP and store result in HL
    ld_hl_sp_s8: (s8) => { // takes signed 8 bit immediate data
        s8 = twosComp(s8); // fix sign (force 8 bit twos complement)
        let sp = CPU.reg16[Reg16.SP];

        CPU.setFlags(Flag.Z | Flag.N, 0); // reset zero and subtract flags
        CPU.setCarry(sp, s8);
        CPU.setHalfCarry(sp, s8);
        
        CPU.reg16[Reg16.SP] += s8;
        CPU.combinedRegWrite(Reg8.H, Reg8.L, CPU.reg16[Reg16.SP]);

        return 2;
    }
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

function twosComp(imm8) {
    return (imm8 & (1 << 7)) ? -((~imm8 & 0xFF) + 1) : imm8;
}