const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/pahanaeduapi/api',
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
    }
};