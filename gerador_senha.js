const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = 'digite_a_sua_senha_desejada'; // Sua senha desejada

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) throw err;
  console.log('Hash da senha:', hash);
  // Copie este hash para o arquivo .env
});