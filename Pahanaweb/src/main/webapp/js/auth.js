const API_BASE_URL_auth = 'http://localhost:8080/pahanaeduapi/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElement = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_BASE_URL_auth}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }) // Send raw password over HTTPS
        });

        if (!response.ok) {
            errorElement.textContent = 'Invalid username or password';
            return;
        }

        const data = await response.json();

        // Store token and role securely in localStorage (or sessionStorage)
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('username', data.username);

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'Login failed. Please try again.';
    }
});
