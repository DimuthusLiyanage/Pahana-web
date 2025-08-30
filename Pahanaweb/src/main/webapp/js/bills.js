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
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
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
                            <td class="status-${bill.paymentStatus.toLowerCase()}">${bill.paymentStatus}</td>
                            <td>
                                <button class="action-btn view-btn" onclick="viewBillDetails(${bill.billId})">View</button>
                                ${bill.paymentStatus === 'PENDING' ? 
                                    `<button class="action-btn paid-btn" onclick="markBillAsPaid(${bill.billId})">Mark Paid</button>` : 
                                    ''
                                }
                                <button class="action-btn print-btn" onclick="printBill(${bill.billId})">Print</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        document.getElementById('billList').innerHTML = table;
    } catch (error) {
        console.error('Error loading bills:', error);
        document.getElementById('billList').innerHTML = `
            <div class="error-message">
                <p>Error loading bills: ${error.message}</p>
                <button onclick="loadBills()" class="btn">Try Again</button>
            </div>
        `;
    }
}

function showGenerateBillForm() {
    const form = `
        <h2>Generate New Bill</h2>
        <form id="generateBillForm">
            <div class="form-group">
                <label for="billAccountNumber">Account Number *</label>
                <input type="text" id="billAccountNumber" required placeholder="Enter account number">
            </div>
            <div class="form-group">
                <label for="billDate">Bill Date *</label>
                <input type="date" id="billDate" required>
            </div>
            
            <h3>Line Items</h3>
            <div id="lineItemsContainer">
                <div class="line-item">
                    <div class="form-group">
                        <label>Item Code *</label>
                        <input type="text" class="itemCode" required onblur="getItemDetails(this)">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" class="itemDescription" readonly>
                        <input type="hidden" class="itemId">
                    </div>
                    <div class="form-group">
                        <label>Quantity *</label>
                        <input type="number" class="quantity" min="1" value="1" required oninput="calculateLineTotal(this)">
                    </div>
                    <div class="form-group">
                        <label>Unit Price ($)</label>
                        <input type="number" class="unitPrice" step="0.01" min="0.01" readonly>
                    </div>
                    <div class="form-group">
                        <label>Total ($)</label>
                        <input type="number" class="lineTotal" step="0.01" min="0" readonly value="0.00">
                    </div>
                    <button type="button" class="btn-remove" onclick="removeLineItem(this)">×</button>
                </div>
            </div>
            <button type="button" id="addLineItem" class="btn secondary">+ Add Item</button>
            
            <div class="totals-section">
                <div class="form-group">
                    <label for="totalUnits">Total Units</label>
                    <input type="number" id="totalUnits" min="1" required oninput="calculateTotalAmount()" value="1">
                </div>
                <div class="form-group">
                    <label for="amountDue">Amount Due ($)</label>
                    <input type="number" id="amountDue" step="0.01" min="0" readonly value="0.00">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn">Generate Bill</button>
            </div>
        </form>
    `;
    
    openModal(form);
    
    // Set default date to today
    document.getElementById('billDate').valueAsDate = new Date();
    
    // Add line item functionality
    document.getElementById('addLineItem').addEventListener('click', addLineItem);
    
    // Form submission
    document.getElementById('generateBillForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitBillForm();
    });
}

function addLineItem() {
    const container = document.getElementById('lineItemsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'line-item';
    newItem.innerHTML = `
        <div class="form-group">
            <label>Item Code *</label>
            <input type="text" class="itemCode" required onblur="getItemDetails(this)">
        </div>
        <div class="form-group">
            <label>Description</label>
            <input type="text" class="itemDescription" readonly>
            <input type="hidden" class="itemId">
        </div>
        <div class="form-group">
            <label>Quantity *</label>
            <input type="number" class="quantity" min="1" value="1" required oninput="calculateLineTotal(this)">
        </div>
        <div class="form-group">
            <label>Unit Price ($)</label>
            <input type="number" class="unitPrice" step="0.01" min="0.01" readonly>
        </div>
        <div class="form-group">
            <label>Total ($)</label>
            <input type="number" class="lineTotal" step="0.01" min="0" readonly value="0.00">
        </div>
        <button type="button" class="btn-remove" onclick="removeLineItem(this)">×</button>
    `;
    container.appendChild(newItem);
}

function removeLineItem(button) {
    button.closest('.line-item').remove();
    calculateTotalAmount();
}

async function getItemDetails(inputElement) {
    const itemCode = inputElement.value.trim();
    const lineItem = inputElement.closest('.line-item');
    
    if (!itemCode) return;
    
    try {
        showLoading(lineItem, true);
        
        const response = await fetch(`${API_BASE_URL}/items/code/${encodeURIComponent(itemCode)}`);
        if (response.ok) {
            const item = await response.json();
            lineItem.querySelector('.itemDescription').value = item.description;
            lineItem.querySelector('.itemId').value = item.itemId;
            lineItem.querySelector('.unitPrice').value = item.unitPrice;
            
            // Calculate line total
            calculateLineTotal(lineItem.querySelector('.quantity'));
        } else if (response.status === 404) {
            alert('Item not found! Please check the item code.');
            resetLineItem(lineItem);
        } else {
            throw new Error(`Server error: ${response.status}`);
        }
    } catch (error) {
        console.error('Error fetching item:', error);
        alert('Error fetching item details. Please try again.');
        resetLineItem(lineItem);
    } finally {
        showLoading(lineItem, false);
    }
}

function resetLineItem(lineItem) {
    lineItem.querySelector('.itemCode').value = '';
    lineItem.querySelector('.itemDescription').value = '';
    lineItem.querySelector('.itemId').value = '';
    lineItem.querySelector('.unitPrice').value = '';
    lineItem.querySelector('.quantity').value = '1';
    lineItem.querySelector('.lineTotal').value = '0.00';
}

function showLoading(element, isLoading) {
    const inputs = element.querySelectorAll('input');
    inputs.forEach(input => {
        input.disabled = isLoading;
    });
    
    if (isLoading) {
        element.classList.add('loading');
    } else {
        element.classList.remove('loading');
    }
}

function calculateLineTotal(inputElement) {
    const lineItem = inputElement.closest('.line-item');
    const quantity = parseFloat(inputElement.value) || 0;
    const unitPrice = parseFloat(lineItem.querySelector('.unitPrice').value) || 0;
    const lineTotal = quantity * unitPrice;
    
    lineItem.querySelector('.lineTotal').value = lineTotal.toFixed(2);
    calculateTotalAmount();
}

function calculateTotalAmount() {
    let totalAmount = 0;
    let totalUnits = 0;
    
    document.querySelectorAll('.line-item').forEach(item => {
        const lineTotal = parseFloat(item.querySelector('.lineTotal').value) || 0;
        const quantity = parseFloat(item.querySelector('.quantity').value) || 0;
        
        totalAmount += lineTotal;
        totalUnits += quantity;
    });
    
    document.getElementById('amountDue').value = totalAmount.toFixed(2);
    document.getElementById('totalUnits').value = totalUnits;
}

async function submitBillForm() {
    const accountNumber = document.getElementById('billAccountNumber').value.trim();
    const billDate = document.getElementById('billDate').value;
    const totalUnits = parseInt(document.getElementById('totalUnits').value);
    const amountDue = parseFloat(document.getElementById('amountDue').value);
    
    // Validate form
    if (!accountNumber) {
        alert('Please enter an account number.');
        return;
    }
    
    if (amountDue <= 0) {
        alert('Amount due must be greater than 0.');
        return;
    }
    
    // Collect line items
    const lineItems = [];
    let hasErrors = false;
    
    document.querySelectorAll('.line-item').forEach((item, index) => {
        const itemId = item.querySelector('.itemId').value;
        const quantity = parseInt(item.querySelector('.quantity').value);
        const unitPrice = parseFloat(item.querySelector('.unitPrice').value);
        
        if (!itemId) {
            alert(`Item #${index + 1} is missing an item code or the code is invalid.`);
            hasErrors = true;
            return;
        }
        
        if (isNaN(quantity) || quantity <= 0) {
            alert(`Item #${index + 1} has an invalid quantity.`);
            hasErrors = true;
            return;
        }
        
        lineItems.push({
            itemId: parseInt(itemId),
            quantity: quantity,
            unitPrice: unitPrice
        });
    });
    
    if (hasErrors || lineItems.length === 0) {
        if (lineItems.length === 0) {
            alert('Please add at least one line item.');
        }
        return;
    }
    
    // Create bill object
    const bill = {
        accountNumber: accountNumber,
        billDate: new Date(billDate).toISOString(),
        totalUnits: totalUnits,
        amountDue: amountDue,
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
            alert('Bill generated successfully!');
            closeModal();
            loadBills();
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create bill');
        }
    } catch (error) {
        console.error('Error generating bill:', error);
        alert(`Error generating bill: ${error.message}`);
    }
}

async function viewBillDetails(billId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bills/${billId}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
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
                <p><strong>Status:</strong> <span class="status-${bill.paymentStatus.toLowerCase()}">${bill.paymentStatus}</span></p>
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
            
            <div class="modal-actions">
                <button class="btn" onclick="printBill(${bill.billId})">Print Bill</button>
                ${bill.paymentStatus === 'PENDING' ? 
                    `<button class="btn" onclick="markBillAsPaid(${bill.billId}, true)">Mark as Paid</button>` : 
                    ''
                }
                <button class="btn secondary" onclick="closeModal()">Close</button>
            </div>
        `;
        
        openModal(details);
    } catch (error) {
        console.error('Error fetching bill details:', error);
        alert('Error loading bill details. Please try again.');
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
            alert('Bill marked as paid successfully!');
            if (reloadDetails) {
                closeModal();
                viewBillDetails(billId);
            }
            loadBills();
        } else {
            const error = await putResponse.text();
            throw new Error(error || 'Failed to update bill');
        }
    } catch (error) {
        console.error('Error updating bill status:', error);
        alert(`Error updating bill status: ${error.message}`);
    }
}

// Print bill function
async function printBill(billId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bills/${billId}`);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const bill = await response.json();
        
        // Create a print-friendly version of the bill
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill #${bill.billId} - PAHANA EDU</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .invoice-box {
                        max-width: 800px;
                        margin: auto;
                        padding: 30px;
                        border: 1px solid #eee;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
                        font-size: 16px;
                        line-height: 24px;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 20px;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 20px;
                    }
                    .company-info {
                        text-align: left;
                    }
                    .bill-info {
                        text-align: right;
                    }
                    .invoice-details {
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        line-height: inherit;
                        text-align: left;
                        border-collapse: collapse;
                    }
                    table td, table th {
                        padding: 8px;
                        vertical-align: top;
                    }
                    table th {
                        border-bottom: 2px solid #ddd;
                        font-weight: bold;
                    }
                    .items-table {
                        margin: 20px 0;
                    }
                    .items-table td {
                        border-bottom: 1px solid #eee;
                    }
                    .totals-table {
                        margin-top: 20px;
                    }
                    .totals-table td {
                        padding: 5px 0;
                    }
                    .total-amount {
                        font-weight: bold;
                        font-size: 1.2em;
                        border-top: 2px solid #333;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 0.9em;
                        color: #777;
                    }
                    .status {
                        display: inline-block;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-weight: bold;
                    }
                    .status-PAID {
                        background-color: #d4edda;
                        color: #155724;
                    }
                    .status-PENDING {
                        background-color: #fff3cd;
                        color: #856404;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .invoice-box {
                            box-shadow: none;
                            border: none;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="invoice-header">
                        <div class="company-info">
                            <h1>PAHANA EDU</h1>
                            <p>123 Education Street</p>
                            <p>Colombo, Sri Lanka</p>
                            <p>Phone: +94 11 123 4567</p>
                            <p>Email: info@pahanaedu.lk</p>
                        </div>
                        <div class="bill-info">
                            <h2>INVOICE</h2>
                            <p><strong>Bill #:</strong> ${bill.billId}</p>
                            <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span class="status status-${bill.paymentStatus}">${bill.paymentStatus}</span></p>
                        </div>
                    </div>
                    
                    <div class="invoice-details">
                        <p><strong>Account Number:</strong> ${bill.accountNumber}</p>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item ID</th>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bill.items.map(item => `
                                <tr>
                                    <td>${item.itemId}</td>
                                    <td>${getItemDescription(item.itemId) || 'Item'}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.unitPrice.toFixed(2)}</td>
                                    <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <table class="totals-table">
                        <tr>
                            <td width="80%"><strong>Total Units:</strong></td>
                            <td>${bill.totalUnits}</td>
                        </tr>
                        <tr class="total-amount">
                            <td><strong>Amount Due:</strong></td>
                            <td><strong>$${bill.amountDue.toFixed(2)}</strong></td>
                        </tr>
                    </table>
                    
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p>PAHANA EDU - Education Services</p>
                        <p>www.pahanaedu.lk</p>
                    </div>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Print Bill
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                        Close
                    </button>
                </div>
                
                <script>
                    // Try to print automatically when the window loads
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    } catch (error) {
        console.error('Error printing bill:', error);
        alert('Error printing bill. Please try again.');
    }
}

// Helper function to get item description (would need to be implemented)
function getItemDescription(itemId) {
    // In a real implementation, you might want to fetch item details
    // For now, we'll return a placeholder
    return "Educational Service";
}