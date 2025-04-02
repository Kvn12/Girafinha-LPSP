// Função para comandar somente o rele que liga o braço robótico
document.getElementById('relaySwitch').addEventListener('change', function() {

    console.log("relay");
    const state = this.checked ? '0' : '1';

    const command = `0,2000,0,0,0,100,100,${state}`;

    fetch('/sendCommand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
    });

    const j1 = 0;
    const j2 = 0;
    const j3 = 0;
    const z = 95;
    const gripper = 100;
    const stateNumber = (state == '0')? 1 : 0;

    fetch('/update-position', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' },
        body: JSON.stringify({ j1, j2, j3, z, gripper, rele: stateNumber})
    })
    .then(response => response.text())
    .then(data => console.log('Resposta do servidor:', data))
    .catch(error => console.error('Erro ao atualizar a posição do braço:', error));
});

// Função para dar home no arduino
document.getElementById('homeArduino').addEventListener('click', function() {
    if(!document.getElementById('relaySwitch').checked){
        alert("Please turn on the motors first!");
    }
    else {
        const state = this.checked ? '0' : '1';

        const command = `4000,0,0,0,0,100,100,${state}`;

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

document.getElementById("goButton").addEventListener("click", function () {
    if(!document.getElementById('relaySwitch').checked){
        alert("Please turn on the motors first!");
    }
    else{
        window.location.href = "/move";
    }
});

fetch('/current-position')
    .then(response => response.json())
    .then(data => {
        console.log('Posição atual do braço:', data);

        document.getElementById('relaySwitch').checked = data.rele;
    })
    .catch(error => console.error('Erro ao obter a posição do braço:', error));