const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport'); // Importação da biblioteca serialport
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 80;

// Middleware para ler o corpo da requisição JSON
app.use(express.json());

// Configuração da porta serial para o Arduino (ajuste a porta e baud rate conforme necessário)
const arduinoPort = new SerialPort({ path: 'COM3', baudRate: 115200 });

// Evento para monitorar a abertura da porta serial
arduinoPort.on('open', () => {
  console.log('Conexão com o Arduino estabelecida');
});

// Evento para lidar com dados recebidos do Arduino
arduinoPort.on('data', (data) => {
  console.log('Resposta do Arduino:', data.toString());
});

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a pagina inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rota para a segunda página
app.get('/move', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'movement.html'));
});

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

// Endpoint para salvar a posição no arquivo positions.txt
const fs = require('fs');

app.post('/save-position', (req, res) => {
    const { name, j1, j2, j3, z } = req.body;

    if (!name || !j1 || !j2 || !j3 || !z) {
        return res.status(400).send('Dados inválidos.');
    }

    const position = `Nome: ${name}, J1: ${j1}, J2: ${j2}, J3: ${j3}, Z: ${z}\n`;

    // Salvar no arquivo positions.txt
    fs.appendFile('positions.txt', position, (err) => {
        if (err) {
            console.error('Erro ao salvar posição:', err);
            return res.status(500).send('Erro ao salvar posição.');
        }

        res.status(200).send('Posição salva com sucesso.');
    });
});

app.get('/get-positions', (req, res) => {
  fs.readFile('positions.txt', 'utf8', (err, data) => {
      if (err) {
          console.error('Erro ao ler o arquivo:', err);
          return res.status(500).send([]);
      }

      // Dividir o conteúdo do arquivo por linha e retornar como array
      const positions = data.trim().split('\n');
      res.json(positions);
  });
});

// Reinicar o arduino caso necessario
app.post('/reset_arduino', (req, res) => {
  try {
      arduinoPort.close((err) => {
          if (err) {
              return res.status(500).json({ status: 'error', message: 'Erro ao fechar a porta serial: ' + err.message });
          }

          // Reabrir a conexão após um breve atraso
          setTimeout(() => {
              arduinoPort.open((err) => {
                  if (err) {
                      return res.status(500).json({ status: 'error', message: 'Erro ao reabrir a porta serial: ' + err.message });
                  }
                  res.json({ status: 'success', message: 'Arduino reiniciado com sucesso!' });
              });
          }, 2000); // 2 segundos de pausa antes de reabrir
      });
  } catch (error) {
      res.status(500).json({ status: 'error', message: 'Erro: ' + error.message });
  }
});

// Colocando camera no site
//Pegar camera do pc da pipefa
// app.get('/video_feed_girafinha', createProxyMiddleware({ 
//   target: 'http://143.106.61.198:5003', 
//   changeOrigin: true,
//   ws: true
// }));

//Pegar camera do pc da girafinah
app.get('/video_feed_0', createProxyMiddleware({ 
  target: 'http://localhost:5000', 
  changeOrigin: true,
  ws: true
}));