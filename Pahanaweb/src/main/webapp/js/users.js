const API_BASE_URL = 'http://localhost:8080/pahanaeduapi/api';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('userList')) {
        // Only allow admin to manage users
        if (localStorage.getItem('userRole') !== 'ADMIN') {
            document.getElementById('users').innerHTML = `
                <h2>Access Denied</h2>
                <p>You don't have permission to access this section.</p>
            `;
            return;
        }
        
        loadUsers();
    }
    
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        showUserForm();
    });
});

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
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
        
        const userData = {
            username: document.getElementById('username').value,
            role: document.getElementById('role').value
        };
        
        const password = document.getElementById('password').value;
        if (password) {
            userData.password = password;
        }
        
        if (isEdit) {
            userData.userId = user.userId;
        }
        
        try {
            let response;
            if (isEdit) {
                response = await fetch(`${API_BASE_URL}/users/${user.userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
            }
            
            if (response.ok) {
                loadUsers();
                document.getElementById('modal').style.display = 'none';
            } else {
                alert('Error saving user. Please try again.');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user. Please try again.');
        }
    });
}

function editUser(userId) {
    fetch(`${API_BASE_URL}/users/${userId}`)
        .then(response => response.json())
        .then(user => showUserForm(user))
        .catch(error => {
            console.error('Error fetching user:', error);
            alert('Error loading user data.');
        });
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
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