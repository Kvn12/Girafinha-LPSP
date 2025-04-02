const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport'); // Importação da biblioteca serialport
const { createProxyMiddleware } = require('http-proxy-middleware');
const session = require('express-session'); 
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const port = 80;

// Credenciais vêm das variáveis de ambiente
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

let currentPosition = { j1: 0, j2: 0, j3: 0, z: 0, gripper: 100, rele: 0};

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

// Configuração da sessão
app.use(session({
  secret: 'Lpsp@4.0', // Altere para uma chave secreta forte
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
};

// Rota para a página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rota para processar o login
app.post('/login', express.json(), async (req, res) => {
  const { username, password } = req.body;
  
  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
  
  try {
    // Compara a senha fornecida com o hash armazenado
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    
    if (match) {
      req.session.authenticated = true;
      return res.status(200).json({ message: 'Login bem-sucedido' });
    } else {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rota para logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a pagina inicial
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rota para a segunda página
app.get('/move', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'movement.html'));
});

// Endpoint para receber o comando do HTML e enviá-lo ao Arduino
app.post('/sendCommand', requireAuth, (req, res) => {
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

app.post('/save-position', requireAuth, (req, res) => {
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

app.get('/get-positions', requireAuth, (req, res) => {
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
app.post('/reset_arduino', requireAuth, (req, res) => {
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

// Endpoint para atualizar a posição do braço
app.post('/update-position', requireAuth, (req, res) => {
  const { j1, j2, j3, z, gripper, rele } = req.body;
  
  if (j1 === undefined || j2 === undefined || j3 === undefined || z === undefined || gripper === undefined || rele === undefined) {
      return res.status(400).send('Invalid data');
  }

  currentPosition = { j1, j2, j3, z, gripper, rele};
  console.log('Posição do braço atualizada:', currentPosition);

  res.status(200).send('Positions updated.');
});

// Endpoint para obter a posição atual
app.get('/current-position', requireAuth, (req, res) => {
  res.json(currentPosition);
});

// Colocando camera no site
//Pegar camera do pc da pipefa
// app.get('/video_feed_girafinha', createProxyMiddleware({ 
//   target: 'http://143.106.61.198:5003', 
//   changeOrigin: true,
//   ws: true
// }));

//Pegar camera do pc da girafinah
app.get('/video_feed_0', requireAuth, createProxyMiddleware({ 
  target: 'http://localhost:5000', 
  changeOrigin: true,
  ws: true
}));

//para abrir o server da camera
const { execFile } = require('child_process'); // Importa o módulo child_process

// Caminho para o script Python da câmera
const cameraScriptPath = path.join(__dirname, 'camera_server.py');

// Função para iniciar o servidor da câmera
function startCameraServer() {
const pythonProcess = execFile('python', [cameraScriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao iniciar o servidor da câmera: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no servidor da câmera: ${stderr}`);
      return;
    }
    console.log(`Servidor da câmera iniciado: ${stdout}`);
  });

  // Evento para quando o processo Python for encerrado
  pythonProcess.on('close', (code) => {
    console.log(`Servidor da câmera encerrado com código ${code}`);
  });
}

// Inicia o servidor da câmera quando o servidor Node.js for iniciado
startCameraServer();