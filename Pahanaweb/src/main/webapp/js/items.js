document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('itemList')) {
        loadItems();
    }
    
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        showItemForm();
    });
    
    document.getElementById('searchItemBtn')?.addEventListener('click', () => {
        loadItems(document.getElementById('itemSearch').value);
    });
});

async function loadItems(searchTerm = '') {
    try {
        let url = 'http://localhost:8080/pahanaeduapi/api/items';
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        const response = await fetch(url);
        const items = await response.json();
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Unit Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.itemId}</td>
                            <td>${item.itemCode}</td>
                            <td>${item.description}</td>
                            <td>${item.category}</td>
                            <td>$${item.unitPrice.toFixed(2)}</td>
                            <td>${item.stockQuantity}</td>
                            <td>
                                <button class="action-btn edit-btn" onclick="editItem(${item.itemId})">Edit</button>
                                <button class="action-btn delete-btn" onclick="deleteItem(${item.itemId})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('itemList').innerHTML = table;
    } catch (error) {
        console.error('Error loading items:', error);
        document.getElementById('itemList').innerHTML = '<p>Error loading items. Please try again.</p>';
    }
}

function showItemForm(item = null) {
    const isEdit = item !== null;
    const form = `
        <h2>${isEdit ? 'Edit' : 'Add'} Item</h2>
        <form id="itemForm">
            <div class="form-group">
                <label for="itemCode">Item Code</label>
                <input type="text" id="itemCode" value="${isEdit ? item.itemCode : ''}" required>
            </div>
            <div class="form-group">
                <label for="description">Description</label>
                <input type="text" id="description" value="${isEdit ? item.description : ''}" required>
            </div>
            <div class="form-group">
                <label for="unitPrice">Unit Price</label>
                <input type="number" step="0.01" id="unitPrice" value="${isEdit ? item.unitPrice : ''}" required>
            </div>
            <div class="form-group">
                <label for="category">Category</label>
                <input type="text" id="category" value="${isEdit ? item.category : ''}" required>
            </div>
            <div class="form-group">
                <label for="stockQuantity">Stock Quantity</label>
                <input type="number" id="stockQuantity" value="${isEdit ? item.stockQuantity : 0}" required>
            </div>
            <button type="submit" class="btn">${isEdit ? 'Update' : 'Save'}</button>
        </form>
    `;
    
    openModal(form);
    
    document.getElementById('itemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const itemData = {
            itemCode: document.getElementById('itemCode').value,
            description: document.getElementById('description').value,
            unitPrice: parseFloat(document.getElementById('unitPrice').value),
            category: document.getElementById('category').value,
            stockQuantity: parseInt(document.getElementById('stockQuantity').value)
        };
        
        if (isEdit) {
            itemData.itemId = item.itemId;
        }
        
        try {
            let response;
            if (isEdit) {
                response = await fetch(`http://localhost:8080/pahanaeduapi/api/items/${item.itemId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemData)
                });
            } else {
                response = await fetch('http://localhost:8080/pahanaeduapi/api/items', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(itemData)
                });
            }
            
            if (response.ok) {
                loadItems();
                document.getElementById('modal').style.display = 'none';
            } else {
                alert('Error saving item. Please try again.');
            }
        } catch (error) {
            console.error('Error saving item:', error);
            alert('Error saving item. Please try again.');
        }
    });
}

function editItem(itemId) {
    fetch(`http://localhost:8080/pahanaeduapi/api/items/${itemId}`)
        .then(response => response.json())
        .then(item => showItemForm(item))
        .catch(error => {
            console.error('Error fetching item:', error);
            alert('Error loading item data.');
        });
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        fetch(`http://localhost:8080/pahanaeduapi/api/items/${itemId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                loadItems();
            } else {
                alert('Error deleting item.');
            }
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            alert('Error deleting item.');
        });
    }
}