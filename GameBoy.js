class GameBoy {
    constructor() {
        this.CPU = new CPU();

        this.reset();
    }

    reset() {
        RAM.fill(0);
        // resets RAM and registers according to 
        for (const [addr, val] of Object.entries(INITIAL_RAM))
            RAM.write(addr, val);
        
        this.CPU.reg8 = INITIAL_REG8.slice(0);
        this.CPU.reg16 = INITIAL_REG16.slice(0);
    }

    powerOn() {
        this.reset();
    }
}