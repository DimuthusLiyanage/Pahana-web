//const API_BASE_URL2 = 'http://localhost:8080/pahanaeduapi/api';

// Helper function for headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('userList')) {
        loadUsers();
    }
    
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        showUserForm();
    });
});

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.userId}</td>
                            <td>${user.username}</td>
                            <td>${user.role}</td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button class="action-btn edit-btn" onclick="editUser(${user.userId})">Edit</button>
                                <button class="action-btn delete-btn" onclick="deleteUser(${user.userId})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('userList').innerHTML = table;
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('userList').innerHTML = '<p>Error loading users. Please try again.</p>';
    }
}

function showUserForm(user = null) {
    const isEdit = user !== null;
    const form = `
        <h2>${isEdit ? 'Edit' : 'Add'} User</h2>
        <form id="userForm">
            ${isEdit ? `<input type="hidden" id="userId" value="${user.userId}">` : ''}
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" value="${isEdit ? user.username : ''}" required>
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" ${isEdit ? '' : 'required'}>
                ${isEdit ? '<small>Leave blank to keep current password</small>' : ''}
            </div>
            <div class="form-group">
                <label for="role">Role</label>
                <select id="role" required>
                    <option value="ADMIN" ${isEdit && user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                    <option value="STAFF" ${isEdit && user.role === 'STAFF' ? 'selected' : ''}>Staff</option>
                </select>
            </div>
            <button type="submit" class="btn">${isEdit ? 'Update' : 'Save'}</button>
        </form>
    `;
    
    openModal(form);
    
    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userId = document.getElementById('userId')?.value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        const userData = {
            username,
            role
        };
        
        if (password) {
            userData.password = password;
        }
        
        try {
            let response;
            if (isEdit) {
                response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(userData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(userData)
                });
            }
            
            if (response.ok) {
                loadUsers();
                document.getElementById('modal').style.display = 'none';
            } else {
                const error = await response.text();
                alert(`Error: ${error}`);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user. Please try again.');
        }
    });
}

function editUser(userId) {
    fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: getAuthHeaders()
    })
    .then(response => {
        if (!response.ok) throw new Error('User not found');
        return response.json();
    })
    .then(user => showUserForm(user))
    .catch(error => {
        console.error('Error fetching user:', error);
        alert('Error loading user data.');
    });
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        .then(response => {
            if (response.ok) {
                loadUsers();
            } else {
                alert('Error deleting user.');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            alert('Error deleting user.');
        });
    }
}