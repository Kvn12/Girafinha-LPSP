// Função para sincronizar sliders e caixas de texto
function syncValues(sliderId, inputId) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);
    const button = document.getElementById('send');

    // Atualizar caixa de texto quando o slider mudar
    slider.addEventListener('input', () => {
        input.value = slider.value;
    });

    // Atualizar slider quando a caixa de texto mudar
    input.addEventListener('input', () => {
        slider.value = input.value;
    });

    button.addEventListener('click', () => {
        sendCommand();
    });
}

// Sincronizar cada slider com a caixa de texto correspondente
syncValues('angle-j1', 'value-j1');
syncValues('angle-j2', 'value-j2');
syncValues('angle-j3', 'value-j3');
syncValues('position-z', 'value-z');
// syncValues('position-x', 'value-x');
// syncValues('position-y', 'value-y');

// Função para enviar comando ao servidor
function sendCommand() {
const j1 = document.getElementById('angle-j1').value;
const j2 = document.getElementById('angle-j2').value;
const j3 = document.getElementById('angle-j3').value;
const z = document.getElementById('position-z').value;
// const x = document.getElementById('position-x').value;
// const y = document.getElementById('position-y').value;
const gripper = document.getElementById('gripper-value').value;

/*
    data[0] - Speed value
    data[1] - Acceleration value
    data[2] - Joint 1 angle
    data[3] - Joint 2 angle
    data[4] - Joint 3 angle
    data[5] - Z position
    data[6] - Gripper value
*/
// const command = `4000,4000,0,0,0,20000,75`;
const command = `4000,2000,${j1},${j2},${j3},${z},${gripper}`;

console.log("Enviando comando:", command);

fetch('/sendCommand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command })
});
}