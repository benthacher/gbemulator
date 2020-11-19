class GameBoy {
    constructor() {
        this.CPU = new CPU();

        this.reset();
    }

    reset() {
        // RAM.fill(0); // specifically do NOT clear RAM, because the actual game boy doesn't do this
        // resets RAM and registers according to 
        for (const [addr, val] of Object.entries(INITIAL_RAM))
            RAM.write(addr, val);
        
        this.CPU.registers8 = INITIAL_REG8.slice(0);
        this.CPU.registers16 = INITIAL_REG16.slice(0);
    }

    powerOn() {
        this.reset();
    }
}