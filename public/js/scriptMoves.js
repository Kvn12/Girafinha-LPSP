function syncValues(sliderId, inputId, callback) {
    const slider = document.getElementById(sliderId);
    const input = document.getElementById(inputId);

    if (slider && input) {
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
    else if (input) {
        input.addEventListener('input', () => {
            if (callback) callback();
        });
    }
}

// Função para atualizar valores de X e Y com base nos ângulos J1 e J2
function updateForwardKinematics() {
    const theta1 = parseFloat(document.getElementById('angle-j1').value);
    const theta2 = parseFloat(document.getElementById('angle-j2').value);

    const [x, y] = forwardKinematics(theta1, theta2);

    document.getElementById('value-x').value = x;
    document.getElementById('value-y').value = y;
}

// Função para atualizar valores de J1, J2 e J3 com base nas posições X e Y
function updateInverseKinematics() {
    const x = parseFloat(document.getElementById('value-x').value);
    const y = parseFloat(document.getElementById('value-y').value);
    const j3 = parseFloat(document.getElementById('angle-j3-global').value);

    const [theta1, theta2, phi] = inverseKinematics(x, y, j3);
    
    // Conversão para a comunicação com o arduino
    j1 = parseInt(theta1*(-58)/90);
    j2 = parseInt(theta2*(-63)/90);
    j3R = parseInt(phi*(-59)/90);
    
    document.getElementById('angle-j1').value = j1;
    document.getElementById('value-j1').value = j1;
    document.getElementById('angle-j2').value = j2;
    document.getElementById('value-j2').value = j2;
    document.getElementById('angle-j3').value = j3R;
    document.getElementById('value-j3').value = j3R;
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


// Função para calcular cinemática direta (forward kinematics)
function forwardKinematics(theta1, theta2) {
    const L1 = 228;   // Comprimento do primeiro braço
    const L2 = 136.5; // Comprimento do segundo braço

    const theta1g = (90*theta1)/-58;
    const theta2g = (90*theta2)/-58;

    const theta1F = theta1g * Math.PI / 180; // graus para radianos
    const theta2F = theta2g * Math.PI / 180;

    const xP = Math.round(L1 * Math.sin(theta1F) + L2 * Math.sin(theta1F + theta2F));
    const yP = Math.round(L1 * Math.cos(theta1F) + L2 * Math.cos(theta1F + theta2F));

    return [xP, yP];
}

// Função para calcular cinemática inversa
function inverseKinematics(x, y, j3Global) {
    const L1 = 228;           // Comprimento do primeiro braço
    const L2 = 137;           // Comprimento do segundo braço
    const PI = Math.PI;

    // Verifica se as coordenadas estão no alcance do braço
    const reach = L1 + L2;
    const distance = Math.sqrt(x ** 2 + y ** 2);

    if (distance > reach || distance < Math.abs(L1 - L2)) {
        console.error("Coordenadas fora do alcance do braço.");
        return [NaN, NaN, NaN];                                     // REVER
    }

    // Calcula theta2 com validação
    let cosTheta2 = (Math.pow(x,2) + Math.pow(y,2) - L1 ** 2 - L2 ** 2) / (2 * L1 * L2);

    if (cosTheta2 < -1 || cosTheta2 > 1) {
        console.error("Erro no cálculo de cosTheta2. Verifique as coordenadas.");
        return [NaN, NaN, NaN];                                     // REVER
    }
    let theta2 = Math.acos(cosTheta2);

    theta2 = -theta2;
    
    // Calcula theta1 evitando divisão por zero
    let theta1 = 0;
    if (x == 0) {
        if (y > 0) {
            theta1 = PI/2 - Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
        }
        else {
            theta1 = -PI/2 - Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
        }
    }
    else{
        theta1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
    }

    // Converte os ângulos para graus
    theta2 = (-1) * theta2 * 180 / PI;
    theta1 = theta1 * 180 / PI;

    // Corrige o referencial de theta1
    theta1 = -theta1 + 90;

    // Calcula o ângulo phi para que a garra fique na angulação desejado em relação ao eixo X
    let phi = j3Global - (theta1 + theta2);

    // Corrigindo mais voltas
    theta1 = theta1 % 360;

    // Corrigindo para os ranges mecanicos
    if (theta1 > 180) {
        theta1 = theta1 - 360;
    }

    if (theta1 < -180) {
        theta1 = 360 + theta1;
    }

    if (Math.abs(phi) > 180) {
        console.log("Não é possível chegar nessa posição com essa angulação.");
        phi = 0;
    }

    // Arredonda os ângulos
    theta1 = Math.round(theta1);
    theta2 = Math.round(theta2);
    phi = Math.round(phi);

    console.log("Theta1:", theta1, "Theta2:", theta2, "Phi:", phi);

    return [theta1, theta2, phi];
}

document.getElementById('send').addEventListener('click', () => {
    sendCommand();
});


// Função para enviar comando ao servidor
function sendCommand() {
    const j1 = document.getElementById('angle-j1').value;
    const j2 = document.getElementById('angle-j2').value;
    const j3 = document.getElementById('angle-j3').value;
    const z = document.getElementById('position-z').value;
    const gripper = document.getElementById('gripper-value').value;
    const state = this.checked ? '0' : '1';

    /*
        data[0] - Speed value
        data[1] - Acceleration value
        data[2] - Joint 1 angle
        data[3] - Joint 2 angle
        data[4] - Joint 3 angle
        data[5] - Z position
        data[6] - Gripper value
        data[7] - Rele State

    */
    const command = `4000,2000,${j1},${j2},${j3},${z},${gripper},${state}`;

    if(!document.getElementById('relaySwitch').checked){
        alert("Please turn on the motors first!");
    }
    else {
        console.log("Enviando comando:", command);

        fetch('/sendCommand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
    }
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

        document.getElementById('value-x').value = x;
        document.getElementById('value-y').value = y;
    } else {
        alert('Erro ao carregar a posição selecionada.');
    }
});

// Função para dar home no arduino
document.getElementById('homeArduino').addEventListener('click', function() {
    if(!document.getElementById('relaySwitch').checked){
        alert("Please turn on the motors first!");
    }
    else {
        const j1 = document.getElementById('angle-j1').value;
        const j2 = document.getElementById('angle-j2').value;
        const j3 = document.getElementById('angle-j3').value;
        const z = document.getElementById('position-z').value;
        const gripper = document.getElementById('gripper-value').value;
        const state = this.checked ? '0' : '1';

        const command = `4000,0,${j1},${j2},${j3},${z},${gripper},${state}`;

        fetch('/sendCommand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
    }
});

// Função para dar reset no arduino
document.getElementById('resetButton').addEventListener('click', () => {
    fetch('/reset_arduino', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        location.reload(); 
        alert(data.message); // Mensagem de sucesso ou erro
    })
    .catch(error => {
        console.error('Erro ao reiniciar o Arduino:', error);
    });
});


// Carregar posições ao iniciar a página
loadSavedPositions();
