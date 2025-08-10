document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('itemModalTitle');
    const itemForm = document.getElementById('itemForm');
    const addItemBtn = document.getElementById('addItemBtn');
    const closeBtn = document.querySelector('#itemModal .close');
    const itemsTableBody = document.getElementById('itemsTableBody');
    
    // Open modal for adding new item
    addItemBtn.addEventListener('click', function() {
        modalTitle.textContent = 'Add New Item';
        itemForm.reset();
        document.getElementById('itemId').value = '';
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
    
    // Load items
    function loadItems() {
        fetch('http://localhost:8080/pahanaeduapi/api/items', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            itemsTableBody.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>
                        <button class="edit-btn action-btn" data-id="${item.id}">Edit</button>
                        <button class="delete-btn action-btn" data-id="${item.id}">Delete</button>
                    </td>
                `;
                itemsTableBody.appendChild(row);
            });
            
            // Add event listeners to edit buttons
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-id');
                    editItem(itemId);
                });
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const itemId = this.getAttribute('data-id');
                    deleteItem(itemId);
                });
            });
        })
        .catch(error => console.error('Error:', error));
    }
    
    // Edit item
    function editItem(id) {
        fetch(`http://localhost:8080/pahanaeduapi/api/items/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(item => {
            modalTitle.textContent = 'Edit Item';
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemCode').value = item.code;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemDescription').value = item.description || '';
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemQuantity').value = item.quantity;
            modal.style.display = 'block';
        })
        .catch(error => console.error('Error:', error));
    }
    
    // Delete item
    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            fetch(`http://localhost:8080/pahanaeduapi/api/items/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                if (response.ok) {
                    loadItems();
                }
            })
            .catch(error => console.error('Error:', error));
        }
    }
    
    // Save item (create or update)
    itemForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('itemId').value;
        const itemData = {
            code: document.getElementById('itemCode').value,
            name: document.getElementById('itemName').value,
            description: document.getElementById('itemDescription').value,
            price: parseFloat(document.getElementById('itemPrice').value),
            quantity: parseInt(document.getElementById('itemQuantity').value)
        };
        
        const url = itemId 
            ? `http://localhost:8080/pahanaeduapi/api/items/${itemId}`
            : 'http://localhost:8080/pahanaeduapi/api/items';
            
        const method = itemId ? 'PUT' : 'POST';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(itemData)
        })
        .then(response => response.json())
        .then(() => {
            modal.style.display = 'none';
            loadItems();
        })
        .catch(error => console.error('Error:', error));
    });
    
    // Search items
    const itemSearchBtn = document.getElementById('itemSearchBtn');
    if (itemSearchBtn) {
        itemSearchBtn.addEventListener('click', function() {
            const searchTerm = document.getElementById('itemSearch').value.toLowerCase();
            const rows = itemsTableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Initial load
    loadItems();
});