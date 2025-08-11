const API_BASE_UR_CUS = 'http://localhost:8080/pahanaeduapi/api';

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('customerList')) {
        loadCustomers();
    }
    
    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        showCustomerForm();
    });
    
    document.getElementById('searchCustomerBtn')?.addEventListener('click', () => {
        loadCustomers(document.getElementById('customerSearch').value);
    });
});

async function loadCustomers(searchTerm = '') {
    try {
        let url = `${API_BASE_UR_CUS}/customers`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const customers = await response.json();
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Account #</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Units</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(customer => `
                        <tr>
                            <td>${customer.accountNumber}</td>
                            <td>${customer.name}</td>
                            <td>${customer.email}</td>
                            <td>${customer.telephone}</td>
                            <td>${customer.unitsConsumed}</td>
                            <td>
                                <button class="action-btn edit-btn" onclick="editCustomer('${customer.accountNumber}')">Edit</button>
                                <button class="action-btn delete-btn" onclick="deleteCustomer('${customer.accountNumber}')">Delete</button>
                                <button class="action-btn view-btn" onclick="viewCustomerBills('${customer.accountNumber}')">Bills</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('customerList').innerHTML = table;
    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customerList').innerHTML = '<p>Error loading customers. Please try again.</p>';
    }
}

function showCustomerForm(customer = null) {
    const isEdit = customer !== null;
    const form = `
        <h2>${isEdit ? 'Edit' : 'Add'} Customer</h2>
        <form id="customerForm">
            <div class="form-group">
                <label for="accountNumber">Account Number</label>
                <input type="text" id="accountNumber" value="${isEdit ? customer.accountNumber : ''}" ${isEdit ? 'readonly' : ''} required>
            </div>
            <div class="form-group">
                <label for="name">Name</label>
                <input type="text" id="name" value="${isEdit ? customer.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="address">Address</label>
                <textarea id="address" required>${isEdit ? customer.address : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="telephone">Phone</label>
                <input type="tel" id="telephone" value="${isEdit ? customer.telephone : ''}" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" value="${isEdit ? customer.email : ''}" required>
            </div>
            <div class="form-group">
                <label for="unitsConsumed">Units Consumed</label>
                <input type="number" id="unitsConsumed" value="${isEdit ? customer.unitsConsumed : 0}" required>
            </div>
            <button type="submit" class="btn">${isEdit ? 'Update' : 'Save'}</button>
        </form>
    `;
    
    openModal(form);
    
    document.getElementById('customerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const customerData = {
            accountNumber: document.getElementById('accountNumber').value,
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            telephone: document.getElementById('telephone').value,
            email: document.getElementById('email').value,
            unitsConsumed: parseInt(document.getElementById('unitsConsumed').value)
        };
        
        try {
            let url, method;
            if (isEdit) {
                url = `${API_BASE_UR_CUS}/customers/${encodeURIComponent(customerData.accountNumber)}`;
                method = 'PUT';
            } else {
                url = `${API_BASE_UR_CUS}/customers`;
                method = 'POST';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
            
            if (response.ok) {
                loadCustomers();
                closeModal();
            } else {
                const errorText = await response.text();
                throw new Error(`Server error: ${errorText}`);
            }
        } catch (error) {
            console.error('Error saving customer:', error);
            alert(`Error saving customer: ${error.message}`);
        }
    });
}

function editCustomer(accountNumber) {
    fetch(`${API_BASE_UR_CUS}/customers/${encodeURIComponent(accountNumber)}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(customer => showCustomerForm(customer))
        .catch(error => {
            console.error('Error fetching customer:', error);
            alert('Error loading customer data.');
        });
}

function deleteCustomer(accountNumber) {
    if (confirm('Are you sure you want to delete this customer?')) {
        fetch(`${API_BASE_UR_CUS}/customers/${encodeURIComponent(accountNumber)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                loadCustomers();
            } else {
                throw new Error('Failed to delete customer');
            }
        })
        .catch(error => {
            console.error('Error deleting customer:', error);
            alert('Error deleting customer.');
        });
    }
}

function viewCustomerBills(accountNumber) {
    document.querySelector('nav a[data-section="bills"]').click();
    document.getElementById('billSearch').value = accountNumber;
    document.getElementById('searchBillBtn').click();
}

// Helper functions (if not already defined elsewhere)
function openModal(content) {
    const modal = document.getElementById('modal');
    modal.innerHTML = content;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}