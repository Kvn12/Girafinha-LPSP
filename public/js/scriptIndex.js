// Função para comandar somente o rele que liga o braço robótico
document.getElementById('relaySwitch').addEventListener('change', function() {

    console.log("relay");
    const state = this.checked ? '0' : '1';

    localStorage.setItem('releOn', this.checked);

    const command = `0,2000,0,0,0,100,100,${state}`;

    fetch('/sendCommand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
    });
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