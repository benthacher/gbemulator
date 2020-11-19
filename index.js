generateRegisterTable();

const gb = new GameBoy();

let stopped = false;
let instrPerLoop = 100;
let stepping = false;

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

let stepCheckbox = document.querySelector('#step');

window.onkeydown = e => {
    // stopped = true;

    if (stepCheckbox.checked && e.key == "Enter")
        loop();
}

function loop() {
    if (stopped) {
        console.log('GameBoy has stopped.')
        return;
    }

    if (stepCheckbox.checked) {
        gb.CPU.doCycle();
    } else {
        for (let i = 0; i < instrPerLoop; i++) {
            gb.CPU.doCycle();
        }
        
        requestAnimationFrame(loop);
    }
}

loop();