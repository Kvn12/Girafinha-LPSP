const { exec } = require('child_process');

// Executa o script Python
exec(process.cwd()+'/cams/stream0.py', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar o script Python: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no script Python: ${stderr}`);
      return;
    }
  
    // Saída do script Python
    console.log(`Saída do Python: ${stdout}`);
  });
  
  // Executa o script Python
  exec(process.cwd()+'/cams/stream1.py', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao executar o script Python: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no script Python: ${stderr}`);
      return;
    }
  
    // Saída do script Python
    console.log(`Saída do Python: ${stdout}`);
  });