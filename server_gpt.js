const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 80;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const arduinoPort = new SerialPort({ path: 'COM3', baudRate: 115200 });
const parser = new ReadlineParser();
arduinoPort.pipe(parser);

let armState = { j1: 0, j2: 0, j3: 0, z: 0 }; // Estado do braço robótico

arduinoPort.on('open', () => console.log('Conexão com o Arduino estabelecida'));
parser.on('data', (data) => console.log('Resposta do Arduino:', data));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/move', (req, res) => res.sendFile(path.join(__dirname, 'views', 'movement.html')));

app.post('/sendCommand', (req, res) => {
    const { command, state } = req.body;
    if (state) {
        armState = state;
        io.emit('updateState', armState);
    }
    arduinoPort.write(command + '\n', (err) => {
        if (err) return res.status(500).send('Erro ao enviar comando');
        console.log('Comando enviado:', command);
        res.send('Comando enviado com sucesso');
    });
});

app.get('/get-state', (req, res) => res.json(armState));

app.post('/save-position', (req, res) => {
    const { name, j1, j2, j3, z } = req.body;
    if (!name || j1 == null || j2 == null || j3 == null || z == null) {
        return res.status(400).send('Dados inválidos.');
    }
    const position = `${name},${j1},${j2},${j3},${z}\n`;
    fs.appendFile('positions.txt', position, (err) => {
        if (err) return res.status(500).send('Erro ao salvar posição.');
        res.status(200).send('Posição salva com sucesso.');
    });
});

app.get('/get-positions', (req, res) => {
    fs.readFile('positions.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).send([]);
        res.json(data.trim().split('\n'));
    });
});

app.post('/reset_arduino', (req, res) => {
    arduinoPort.close((err) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Erro ao fechar a porta serial' });
        setTimeout(() => {
            arduinoPort.open((err) => {
                if (err) return res.status(500).json({ status: 'error', message: 'Erro ao reabrir a porta serial' });
                res.json({ status: 'success', message: 'Arduino reiniciado com sucesso!' });
            });
        }, 2000);
    });
});

io.on('connection', (socket) => {
    console.log('Novo usuário conectado');
    socket.emit('updateState', armState);
});

server.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
