document.addEventListener('DOMContentLoaded', function() {
    const customerSelect = document.getElementById('customerSelect');
    const customerInfo = document.getElementById('customerInfo');
    const itemSelect = document.getElementById('itemSelect');
    const addItemToBill = document.getElementById('addItemToBill');
    const billItemsBody = document.getElementById('billItemsBody');
    const subtotalElement = document.getElementById('subtotal');
    const discountInput = document.getElementById('discount');
    const discountAmountElement = document.getElementById('discountAmount');
    const totalAmountElement = document.getElementById('totalAmount');
    const printBillBtn = document.getElementById('printBill');
    const clearBillBtn = document.getElementById('clearBill');
    const saveBillBtn = document.getElementById('saveBill');
    
    let billItems = [];
    let subtotal = 0;
    
    // Load customers for dropdown
    function loadCustomers() {
        fetch('http://localhost:8080/pahanaeduapi/api/customers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            customerSelect.innerHTML = '<option value="">-- Select Customer --</option>';
            data.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.accountNumber} - ${customer.name}`;
                customerSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error:', error));
    }
    
    // Load items for dropdown
    function loadItems() {
        fetch('http://localhost:8080/pahanaeduapi/api/items', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            itemSelect.innerHTML = '<option value="">-- Select Item --</option>';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.code} - ${item.name} (LKR ${item.price.toFixed(2)})`;
                option.setAttribute('data-price', item.price);
                option.setAttribute('data-description', item.description || item.name);
                itemSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error:', error));
    }
    
    // Display customer info when selected
    customerSelect.addEventListener('change', function() {
        const customerId = this.value;
        if (!customerId) {
            customerInfo.innerHTML = '';
            return;
        }
        
        fetch(`http://localhost:8080/pahanaeduapi/api/customers/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(customer => {
            customerInfo.innerHTML = `
                <h4>${customer.name}</h4>
                <p>Account No: ${customer.accountNumber}</p>
                <p>Address: ${customer.address}</p>
                <p>Phone: ${customer.phone}</p>
                ${customer.email ? `<p>Email: ${customer.email}</p>` : ''}
            `;
        })
        .catch(error => console.error('Error:', error));
    });
    
    // Add item to bill
    addItemToBill.addEventListener('click', function() {
        const itemId = itemSelect.value;
        const selectedOption = itemSelect.options[itemSelect.selectedIndex];
        const quantity = parseInt(document.getElementById('itemQuantity').value) || 1;
        
        if (!itemId) {
            alert('Please select an item');
            return;
        }
        
        const price = parseFloat(selectedOption.getAttribute('data-price'));
        const description = selectedOption.getAttribute('data-description');
        const itemCode = selectedOption.textContent.split(' - ')[0];
        const total = price * quantity;
        
        // Check if item already exists in bill
        const existingItemIndex = billItems.findIndex(item => item.id === itemId);
        
        if (existingItemIndex >= 0) {
            // Update quantity and total
            billItems[existingItemIndex].quantity += quantity;
            billItems[existingItemIndex].total += total;
        } else {
            // Add new item
            billItems.push({
                id: itemId,
                code: itemCode,
                description,
                price,
                quantity,
                total
            });
        }
        
        updateBill();
        itemSelect.selectedIndex = 0;
        document.getElementById('itemQuantity').value = 1;
    });
    
    // Update bill display and calculations
    function updateBill() {
        billItemsBody.innerHTML = '';
        subtotal = 0;
        
        billItems.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.code}</td>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
                <td><button class="delete-btn action-btn" data-index="${index}">Remove</button></td>
            `;
            billItemsBody.appendChild(row);
            subtotal += item.total;
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                billItems.splice(index, 1);
                updateBill();
            });
        });
        
        calculateTotal();
    }
    
    // Calculate total with discount
    function calculateTotal() {
        const discount = parseFloat(discountInput.value) || 0;
        const discountAmount = subtotal * (discount / 100);
        const total = subtotal - discountAmount;
        
        subtotalElement.textContent = subtotal.toFixed(2);
        discountAmountElement.textContent = discountAmount.toFixed(2);
        totalAmountElement.textContent = total.toFixed(2);
    }
    
    // Recalculate when discount changes
    discountInput.addEventListener('input', calculateTotal);
    
    // Clear bill
    clearBillBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the current bill?')) {
            billItems = [];
            subtotal = 0;
            updateBill();
            customerSelect.selectedIndex = 0;
            customerInfo.innerHTML = '';
            discountInput.value = 0;
        }
    });
    
    // Print bill
    printBillBtn.addEventListener('click', function() {
        if (billItems.length === 0) {
            alert('No items in the bill to print');
            return;
        }
        
        const customerId = customerSelect.value;
        if (!customerId) {
            alert('Please select a customer');
            return;
        }
        
        // In a real application, this would open a print dialog with a formatted bill
        window.print();
    });
    
    // Save bill
    saveBillBtn.addEventListener('click', function() {
        if (billItems.length === 0) {
            alert('No items in the bill to save');
            return;
        }
        
        const customerId = customerSelect.value;
        if (!customerId) {
            alert('Please select a customer');
            return;
        }
        
        const discount = parseFloat(discountInput.value) || 0;
        const billData = {
            customerId,
            items: billItems.map(item => ({
                itemId: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            discount,
            subtotal,
            total: parseFloat(totalAmountElement.textContent)
        };
        
        fetch('http://localhost:8080/pahanaeduapi/api/bills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(billData)
        })
        .then(response => response.json())
        .then(data => {
            alert('Bill saved successfully!');
            // Clear bill after saving
            billItems = [];
            subtotal = 0;
            updateBill();
            customerSelect.selectedIndex = 0;
            customerInfo.innerHTML = '';
            discountInput.value = 0;
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error saving bill');
        });
    });
    
    // Initial load
    loadCustomers();
    loadItems();
});