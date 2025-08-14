// bills.js
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('billList')) {
        loadBills();
    }
    
    document.getElementById('generateBillBtn')?.addEventListener('click', () => {
        showGenerateBillForm();
    });
    
    document.getElementById('searchBillBtn')?.addEventListener('click', () => {
        const accountNumber = document.getElementById('billSearch').value;
        const status = document.getElementById('billStatusFilter').value;
        loadBills(accountNumber, status);
    });
});

async function loadBills(accountNumber = '', status = 'all') {
    try {
        let url = `${API_BASE_URL}/bills`;
        const response = await fetch(url);
        let bills = await response.json();
        
        // Client-side filtering
        if (accountNumber) {
            bills = bills.filter(bill => 
                bill.accountNumber.includes(accountNumber)
            );
        }
        if (status !== 'all') {
            bills = bills.filter(bill => bill.paymentStatus === status);
        }
        
        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Bill ID</th>
                        <th>Account #</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${bills.map(bill => `
                        <tr>
                            <td>${bill.billId}</td>
                            <td>${bill.accountNumber}</td>
                            <td>${new Date(bill.billDate).toLocaleDateString()}</td>
                            <td>$${bill.amountDue.toFixed(2)}</td>
                            <td>${bill.paymentStatus.toLowerCase()}</td>
                            <td>
                                <button class="action-btn view-btn" onclick="viewBillDetails(${bill.billId})">View</button>
                                ${bill.paymentStatus === 'PENDING' ? 
                                    `<button class="action-btn edit-btn" onclick="markBillAsPaid(${bill.billId})">Mark Paid</button>` : 
                                    ''
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('billList').innerHTML = table;
    } catch (error) {
        console.error('Error loading bills:', error);
        document.getElementById('billList').innerHTML = '<p>Error loading bills. Please try again.</p>';
    }
}

function showGenerateBillForm() {
    const form = `
        <h2>Generate New Bill</h2>
        <form id="generateBillForm">
            <div class="form-group">
                <label for="billAccountNumber">Account Number</label>
                <input type="text" id="billAccountNumber" required>
            </div>
            <div class="form-group">
                <label for="billDate">Bill Date</label>
                <input type="date" id="billDate" required>
            </div>
            <div class="form-group">
                <label for="totalUnits">Total Units</label>
                <input type="number" id="totalUnits" min="1" required>
            </div>
            
            <h3>Line Items</h3>
            <div id="lineItemsContainer">
                <div class="line-item">
                    <div class="form-group">
                        <label>Item ID</label>
                        <input type="number" class="itemId" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" class="quantity" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Unit Price ($)</label>
                        <input type="number" class="unitPrice" step="0.01" min="0.01" required>
                    </div>
                    <button type="button" class="btn-remove">×</button>
                </div>
            </div>
            <button type="button" id="addLineItem" class="btn">Add Item</button>
            <button type="submit" class="btn">Generate Bill</button>
        </form>
    `;
    
    openModal(form);
    
    // Set default date to today
    document.getElementById('billDate').valueAsDate = new Date();
    
    // Add line item functionality
    document.getElementById('addLineItem').addEventListener('click', () => {
        const container = document.getElementById('lineItemsContainer');
        const newItem = document.createElement('div');
        newItem.className = 'line-item';
        newItem.innerHTML = `
            <div class="form-group">
                <label>Item ID</label>
                <input type="number" class="itemId" min="1" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" class="quantity" min="1" required>
            </div>
            <div class="form-group">
                <label>Unit Price ($)</label>
                <input type="number" class="unitPrice" step="0.01" min="0.01" required>
            </div>
            <button type="button" class="btn-remove">×</button>
        `;
        container.appendChild(newItem);
        
        // Add remove functionality
        newItem.querySelector('.btn-remove').addEventListener('click', () => {
            newItem.remove();
        });
    });
    
    // Remove item functionality for initial item
    document.querySelector('.btn-remove')?.addEventListener('click', (e) => {
        e.target.closest('.line-item').remove();
    });
    
    // Form submission
    document.getElementById('generateBillForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const accountNumber = document.getElementById('billAccountNumber').value;
        const billDate = document.getElementById('billDate').value;
        const totalUnits = parseInt(document.getElementById('totalUnits').value);
        
        // Collect line items
        const lineItems = [];
        let amountDue = 0;
        
        document.querySelectorAll('.line-item').forEach(item => {
            const itemId = parseInt(item.querySelector('.itemId').value);
            const quantity = parseInt(item.querySelector('.quantity').value);
            const unitPrice = parseFloat(item.querySelector('.unitPrice').value);
            
            lineItems.push({
                itemId,
                quantity,
                unitPrice
            });
            
            amountDue += quantity * unitPrice;
        });
        
        // Create bill object
        const bill = {
            accountNumber,
            billDate,
            totalUnits,
            amountDue,
            paymentStatus: 'PENDING',
            items: lineItems
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/bills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bill)
            });
            
            if (response.ok) {
                const createdBill = await response.json();
                viewBillDetails(createdBill.billId);
                loadBills();
            } else {
                const error = await response.text();
                alert(`Error generating bill: ${error}`);
            }
        } catch (error) {
            console.error('Error generating bill:', error);
            alert('Error generating bill. Please try again.');
        }
    });
}

async function viewBillDetails(billId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bills/${billId}`);
        if (!response.ok) throw new Error('Bill not found');
        
        const bill = await response.json();
        
        // Format items table
        const itemsTable = bill.items.map(item => `
            <tr>
                <td>${item.itemId}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
        `).join('');
        
        const details = `
            <h2>Bill Details #${bill.billId}</h2>
            <div class="bill-info">
                <p><strong>Account Number:</strong> ${bill.accountNumber}</p>
                <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</p>
                <p><strong>Total Units:</strong> ${bill.totalUnits}</p>
                <p><strong>Amount Due:</strong> $${bill.amountDue.toFixed(2)}</p>
                <p><strong>Status:</strong> ${bill.paymentStatus.toLowerCase()}</p>
            </div>
            
            <h3>Items</h3>
            <table>
                <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsTable}
                </tbody>
            </table>
            
            ${bill.paymentStatus === 'PENDING' ? 
                `<button class="btn" onclick="markBillAsPaid(${bill.billId}, true)">Mark as Paid</button>` : 
                ''
            }
        `;
        
        openModal(details);
    } catch (error) {
        console.error('Error fetching bill details:', error);
        alert('Error loading bill details.');
    }
}

async function markBillAsPaid(billId, reloadDetails = false) {
    if (!confirm('Are you sure you want to mark this bill as paid?')) return;
    
    try {
        // First get the current bill
        const getResponse = await fetch(`${API_BASE_URL}/bills/${billId}`);
        if (!getResponse.ok) throw new Error('Bill not found');
        
        const bill = await getResponse.json();
        
        // Update payment status
        bill.paymentStatus = 'PAID';
        
        // Send updated bill
        const putResponse = await fetch(`${API_BASE_URL}/bills/${billId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bill)
        });
        
        if (putResponse.ok) {
            if (reloadDetails) {
                viewBillDetails(billId);
            }
            loadBills();
        } else {
            const error = await putResponse.text();
            alert(`Error updating bill: ${error}`);
        }
    } catch (error) {
        console.error('Error updating bill status:', error);
        alert('Error updating bill status.');
    }
}