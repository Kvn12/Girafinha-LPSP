const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport'); // Importação da biblioteca serialport

const app = express();
const port = 5500;

// Middleware para ler o corpo da requisição JSON
app.use(express.json());

// Configuração da porta serial para o Arduino (ajuste a porta e baud rate conforme necessário)
const arduinoPort = new SerialPort({ path: 'COM5', baudRate: 115200 });

// Evento para monitorar a abertura da porta serial
arduinoPort.on('open', () => {
  console.log('Conexão com o Arduino estabelecida');
});

// Evento para lidar com dados recebidos do Arduino
arduinoPort.on('data', (data) => {
  console.log('Resposta do Arduino:', data.toString());
});

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Endpoint para receber o comando do HTML e enviá-lo ao Arduino
app.post('/sendCommand', (req, res) => {
  const { command } = req.body;

  // Enviar comando para o Arduino pela porta serial
  arduinoPort.write(command + '\n', (err) => {
    if (err) {
      console.error('Erro ao enviar comando para o Arduino:', err.message);
      res.status(500).send('Erro ao enviar comando para o Arduino');
      return;
    }
    console.log('Comando enviado ao Arduino:', command);
    res.send("Comando enviado ao Arduino com sucesso");
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
