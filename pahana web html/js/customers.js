document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('customerModal');
    const modalTitle = document.getElementById('modalTitle');
    const customerForm = document.getElementById('customerForm');
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const closeBtn = document.querySelector('.close');
    const customersTableBody = document.getElementById('customersTableBody');
    
    // Open modal for adding new customer
    addCustomerBtn.addEventListener('click', function() {
        modalTitle.textContent = 'Add New Customer';
        customerForm.reset();
        document.getElementById('customerId').value = '';
        modal.style.display = 'block';
    });
    
    // Close modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Load customers
    function loadCustomers() {
        fetch('http://localhost:8080/pahanaeduapi/api/customers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            customersTableBody.innerHTML = '';
            data.forEach(customer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.accountNumber}</td>
                    <td>${customer.name}</td>
                    <td>${customer.address}</td>
                    <td>${customer.phone}</td>
                    <td>
                        <button class="edit-btn action-btn" data-id="${customer.id}">Edit</button>
                        <button class="delete-btn action-btn" data-id="${customer.id}">Delete</button>
                    </td>
                `;
                customersTableBody.appendChild(row);
            });
            
            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const customerId = this.getAttribute('data-id');
                    editCustomer(customerId);
                });
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const customerId = this.getAttribute('data-id');
                    deleteCustomer(customerId);
                });
            });
        })
        .catch(error => console.error('Error:', error));
    }
    
    // Edit customer
    function editCustomer(id) {
        fetch(`http://localhost:8080/pahanaeduapi/api/customers/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(customer => {
            modalTitle.textContent = 'Edit Customer';
            document.getElementById('customerId').value = customer.id;
            document.getElementById('accountNumber').value = customer.accountNumber;
            document.getElementById('customerName').value = customer.name;
            document.getElementById('customerAddress').value = customer.address;
            document.getElementById('customerPhone').value = customer.phone;
            document.getElementById('customerEmail').value = customer.email;
            modal.style.display = 'block';
        })
        .catch(error => console.error('Error:', error));
    }
    
    // Delete customer
    function deleteCustomer(id) {
        if (confirm('Are you sure you want to delete this customer?')) {
            fetch(`http://localhost:8080/pahanaeduapi/api/customers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (response.ok) {
                    loadCustomers();
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }
    
    // Save customer (create or update)
    customerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const customerId = document.getElementById('customerId').value;
        const customerData = {
            accountNumber: document.getElementById('accountNumber').value,
            name: document.getElementById('customerName').value,
            address: document.getElementById('customerAddress').value,
            phone: document.getElementById('customerPhone').value,
            email: document.getElementById('customerEmail').value
        };
        
        const url = customerId 
            ? `http://localhost:8080/pahanaeduapi/api/customers/${customerId}`
            : 'http://localhost:8080/pahanaeduapi/api/customers';
            
        const method = customerId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(customerData)
        })
        .then(response => response.json())
        .then(() => {
            modal.style.display = 'none';
            loadCustomers();
        })
        .catch(error => console.error('Error:', error));
    });
    
    // Search customers
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
            const rows = customersTableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Initial load
    loadCustomers();
});