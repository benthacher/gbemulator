generateRegisterTable();

const gb = new GameBoy();

let stopped = true;
let PCinc;

let romInput = document.querySelector('#rom-input');
romInput.value = "";
romInput.onchange = function() {
    const reader = new FileReader();
    reader.onload = function() {
        const arrayBuffer = this.result;

        RAM.loadROM(new Uint8Array(arrayBuffer));
    };
    reader.readAsArrayBuffer(this.files[0]);
};

gb.CPU.displayRegisters();

while (!stopped) {
    // PC increment defined by return value of next instruction at PC (0 for jump, most others 1, some are 2)
    // always pass the next byte in memory as a parameter, just in case the instruction requires it
    PCinc = CPU.instructions[RAM.read(gb.CPU.PC)](RAM.read(gb.CPU.PC + 1), RAM.read(gb.CPU.PC + 2));

    gb.CPU.PC += PCinc;
}