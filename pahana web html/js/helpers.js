// Utility functions
document.addEventListener('DOMContentLoaded', function() {
    // Update dashboard stats
    if (document.getElementById('totalCustomers')) {
        fetch('http://localhost:8080/pahanaeduapi/api/customers/count', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalCustomers').textContent = data.count;
        })
        .catch(error => console.error('Error:', error));
    }
    
    if (document.getElementById('totalItems')) {
        fetch('http://localhost:8080/pahanaeduapi/api/items/count', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalItems').textContent = data.count;
        })
        .catch(error => console.error('Error:', error));
    }
    
    if (document.getElementById('todaysBills')) {
        const today = new Date().toISOString().split('T')[0];
        fetch(`http://localhost:8080/pahanaeduapi/api/bills/count?date=${today}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('todaysBills').textContent = data.count;
        })
        .catch(error => console.error('Error:', error));
    }
});