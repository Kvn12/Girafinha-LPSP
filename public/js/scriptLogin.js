document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    })
    .then(response => {
      if (response.ok) {
        window.location.href = '/'; // Redireciona para a página principal após login
      } else {
        return response.json().then(data => {
          throw new Error(data.message || 'Credenciais inválidas');
        });
      }
    })
    .catch(error => {
      document.getElementById('errorMessage').textContent = error.message;
    });
  });