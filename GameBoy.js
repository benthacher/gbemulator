class GameBoy {
    constructor() {
        this.CPU = new CPU();

        this.reset();
    }

    reset() {
        // RAM.fill(0); // specifically do NOT clear RAM, because the actual game boy doesn't do this
        
    }

    powerOn() {
        this.reset();
    }
}