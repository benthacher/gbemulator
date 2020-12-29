generateRegisterTable();

const gb = new GameBoy();

let instrPerLoop = 1; // it can kinda go up to 100 almost 

const romInput = document.querySelector('#rom-input');
romInput.value = "";
romInput.onchange = function() {
    const reader = new FileReader();
    reader.onload = function() {
        RAM.loadROM(new Uint8Array(this.result));
    };
    reader.readAsArrayBuffer(this.files[0]);
};

const stepCheckbox = document.querySelector('#step');

stepCheckbox.oninput = updateButtonState;

const startButton = document.querySelector('#start');

startButton.onclick = function() {
    if (CPU.stopped) {
        CPU.stopped = false;
        loop();
    } else {    
        CPU.stop(false);
    }
    updateButtonState();
}

function updateButtonState() {
    if (CPU.stopped) {
        startButton.value = 'Start';
        startButton.style.background = 'green';
    } else {
        startButton.value = 'Stop';
        startButton.style.background = 'red';
    }
}

window.onmousedown = loop;

function loop() {
    if (CPU.stopped) {
        console.log('GameBoy has stopped.')
        return;
    }

    if (stepCheckbox.checked) {
        CPU.doCycle();
        updateButtonState();
    } else {
        for (let i = 0; i < instrPerLoop; i++) {
            CPU.doCycle();
        }
        drawScreen();
        requestAnimationFrame(loop);
    }
}

loop();