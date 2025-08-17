// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // If on login page and already logged in, redirect to dashboard
    if (window.location.pathname.endsWith('index.html') {
        if (token && user) {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    // If not on login page and not logged in, redirect to login
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Display welcome message if element exists
    const welcomeUser = document.getElementById('welcomeUser');
    if (welcomeUser) {
        welcomeUser.textContent = `Welcome, ${user.username}`;
    }
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}