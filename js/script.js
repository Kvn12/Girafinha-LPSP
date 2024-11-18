function syncValues(sliderId, inputId, callback) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    // Atualizar caixa de texto quando o slider mudar
    slider.addEventListener('input', () => {
        input.value = slider.value;
        if (callback) callback();
    });

    // Atualizar slider quando a caixa de texto mudar
    input.addEventListener('input', () => {
        slider.value = input.value;
        if (callback) callback();
    });
}

// Função para atualizar valores de X e Y com base nos ângulos J1 e J2
function updateForwardKinematics() {
    const theta1 = parseFloat(document.getElementById('angle-j1').value);
    const theta2 = parseFloat(document.getElementById('angle-j2').value);

    const [x, y] = forwardKinematics(theta1, theta2);

    document.getElementById('position-x').value = x;
    document.getElementById('value-x').value = x;
    document.getElementById('position-y').value = y;
    document.getElementById('value-y').value = y;
}

// Função para atualizar valores de J1, J2 e J3 com base nas posições X e Y
function updateInverseKinematics() {
    const x = parseFloat(document.getElementById('position-x').value);
    const y = parseFloat(document.getElementById('position-y').value);

    const [theta1, theta2, phi] = inverseKinematics(x, y);

    document.getElementById('angle-j1').value = theta1;
    document.getElementById('value-j1').value = theta1;
    document.getElementById('angle-j2').value = theta2;
    document.getElementById('value-j2').value = theta2;
    document.getElementById('angle-j3').value = phi;
    document.getElementById('value-j3').value = phi;
}

// Sincronizar cada slider com a caixa de texto correspondente
syncValues('angle-j1', 'value-j1', updateForwardKinematics);
syncValues('angle-j2', 'value-j2', updateForwardKinematics);
syncValues('angle-j3', 'value-j3'); 
syncValues('position-x', 'value-x', updateInverseKinematics);
syncValues('position-y', 'value-y', updateInverseKinematics);
syncValues('position-z', 'value-z'); 

// Sincronizar cada slider com a caixa de texto correspondente
syncValues('angle-j1', 'value-j1');
syncValues('angle-j2', 'value-j2');
syncValues('angle-j3', 'value-j3');
syncValues('position-z', 'value-z');
syncValues('position-x', 'value-x');
syncValues('position-y', 'value-y');

// Função para calcular cinemática direta (forward kinematics)
function forwardKinematics(theta1, theta2) {
    const L1 = 228;   // Comprimento do primeiro braço
    const L2 = 136.5; // Comprimento do segundo braço

    const theta1F = theta1 * Math.PI / 180; // graus para radianos
    const theta2F = theta2 * Math.PI / 180;

    const xP = Math.round(L1 * Math.cos(theta1F) + L2 * Math.cos(theta1F + theta2F));
    const yP = Math.round(L1 * Math.sin(theta1F) + L2 * Math.sin(theta1F + theta2F));

    return [xP, yP];
}

// Função para calcular cinemática inversa
function inverseKinematics(x, y) {
    const L1 = 228;   // Comprimento do primeiro braço
    const L2 = 136.5; // Comprimento do segundo braço

    let theta2 = Math.acos((Math.pow(x, 2) + Math.pow(y, 2) - Math.pow(L1, 2) - Math.pow(L2, 2)) / (2 * L1 * L2));
    if (x < 0 && y < 0) {
        theta2 = -theta2;
    }

    let theta1 = Math.atan(x / y) - Math.atan((L2 * Math.sin(theta2)) / (L1 + L2 * Math.cos(theta2)));

    theta2 = -theta2 * 180 / Math.PI;
    theta1 = theta1 * 180 / Math.PI;

    if (x >= 0 && y >= 0) {
        theta1 = 90 - theta1;
    }
    if (x < 0 && y > 0) {
        theta1 = 90 - theta1;
    }
    if (x < 0 && y < 0) {
        theta1 = 270 - theta1;
        phi = 270 - theta1 - theta2;
        phi = -phi;
    }
    if (x > 0 && y < 0) {
        theta1 = -90 - theta1;
    }
    if (x < 0 && y === 0) {
        theta1 = 270 + theta1;
    }

    let phi = 90 + theta1 + theta2;
    phi = -phi;

    if (x < 0 && y < 0) {
        phi = 270 - theta1 - theta2;
    }
    if (Math.abs(phi) > 165) {
        phi = 180 + phi;
    }

    theta1 = Math.round(theta1);
    theta2 = Math.round(theta2);
    phi = Math.round(phi);

    return [theta1, theta2, phi];
}

// Rever os ranges dos sliders e inputs 
// Rever os valores q estao sendo calculados e converter

// document.getElementById('send').addEventListener('click', () => {
//     sendCommand();
// });


// Função para enviar comando ao servidor
function sendCommand() {
    const j1 = document.getElementById('angle-j1').value;
    const j2 = document.getElementById('angle-j2').value;
    const j3 = document.getElementById('angle-j3').value;
    const z = document.getElementById('position-z').value;
    const x = document.getElementById('position-x').value;
    const y = document.getElementById('position-y').value;
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

document.getElementById('save-position').addEventListener('click', () => {
    const name = document.getElementById('position-name').value.trim();
    if (!name) {
        alert('Por favor, insira um nome para a posição.');
        return;
    }

    const positionData = {
        name: name,
        j1: document.getElementById('angle-j1').value,
        j2: document.getElementById('angle-j2').value,
        j3: document.getElementById('angle-j3').value,
        z: document.getElementById('position-z').value,
    };

    // Enviar dados ao servidor para salvar no arquivo
    fetch('/save-position', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionData),
    })
    .then(response => {
        if (response.ok) {
            alert('Posição salva com sucesso!');
            document.getElementById('position-name').value = ''; // Limpar o campo de nome
        } else {
            alert('Erro ao salvar a posição.');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao salvar a posição.');
    });
});

// Função para carregar posições salvas do servidor
function loadSavedPositions() {
    fetch('/get-positions')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('saved-positions');
            select.innerHTML = ''; // Limpar lista atual

            data.forEach((position, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = position;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar posições:', error);
            alert('Erro ao carregar posições.');
        });
}

// Função para carregar uma posição selecionada
document.getElementById('load-position').addEventListener('click', () => {
    const select = document.getElementById('saved-positions');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption) {
        alert('Por favor, selecione uma posição.');
        return;
    }

    const positionText = selectedOption.textContent;

    // Ajuste na expressão regular para capturar números negativos
    const match = positionText.match(/J1: (-?\d+), J2: (-?\d+), J3: (-?\d+), Z: (-?\d+)/);
    if (match) {
        const j1 = parseInt(match[1], 10);
        const j2 = parseInt(match[2], 10);
        const j3 = parseInt(match[3], 10);
        const z = parseInt(match[4], 10);

        // Atualizar sliders e caixas de texto
        document.getElementById('angle-j1').value = j1;
        document.getElementById('angle-j2').value = j2;
        document.getElementById('angle-j3').value = j3;
        document.getElementById('position-z').value = z;

        document.getElementById('value-j1').value = j1;
        document.getElementById('value-j2').value = j2;
        document.getElementById('value-j3').value = j3;
        document.getElementById('value-z').value = z;

        // Calcular e atualizar X e Y usando forward kinematics
        const [x, y] = forwardKinematics(j1, j2);
        document.getElementById('position-x').value = x;
        document.getElementById('position-y').value = y;

        document.getElementById('value-x').value = x;
        document.getElementById('value-y').value = y;
    } else {
        alert('Erro ao carregar a posição selecionada.');
    }
});


// Carregar posições ao iniciar a página
loadSavedPositions();
