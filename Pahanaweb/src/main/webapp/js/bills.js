const API_BASE_URL = 'http://localhost:8080/pahanaeduapi/api';

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
        if (accountNumber) {
            url = `${API_BASE_URL}/bills/account/${accountNumber}`;
        }
        
        const response = await fetch(url);
        let bills = await response.json();
        
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
                            <td>${bill.paymentStatus}</td>
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
            <button type="submit" class="btn">Generate Bill</button>
        </form>
    `;
    
    openModal(form);
    
    document.getElementById('generateBillForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const accountNumber = document.getElementById('billAccountNumber').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/bills/generate/${accountNumber}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const bill = await response.json();
                viewBillDetails(bill.billId);
                loadBills();
            } else {
                alert('Error generating bill. Please check the account number and try again.');
            }
        } catch (error) {
            console.error('Error generating bill:', error);
            alert('Error generating bill. Please try again.');
        }
    });
}

function viewBillDetails(billId) {
    fetch(`${API_BASE_URL}/bills/${billId}`)
        .then(response => response.json())
        .then(bill => {
            const details = `
                <h2>Bill Details #${bill.billId}</h2>
                <div class="bill-info">
                    <p><strong>Account Number:</strong> ${bill.accountNumber}</p>
                    <p><strong>Date:</strong> ${new Date(bill.billDate).toLocaleDateString()}</p>
                    <p><strong>Total Units:</strong> ${bill.totalUnits}</p>
                    <p><strong>Amount Due:</strong> $${bill.amountDue.toFixed(2)}</p>
                    <p><strong>Status:</strong> ${bill.paymentStatus}</p>
                </div>
                
                <h3>Items</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map(item => `
                            <tr>
                                <td>${item.itemName}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.unitPrice.toFixed(2)}</td>
                                <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${bill.paymentStatus === 'PENDING' ? 
                    `<button class="btn" onclick="markBillAsPaid(${bill.billId}, true)">Mark as Paid</button>` : 
                    ''
                }
            `;
            
            openModal(details);
        })
        .catch(error => {
            console.error('Error fetching bill details:', error);
            alert('Error loading bill details.');
        });
}

function markBillAsPaid(billId, reloadDetails = false) {
    if (confirm('Are you sure you want to mark this bill as paid?')) {
        fetch(`${API_BASE_URL}/bills/${billId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify('PAID')
        })
        .then(response => {
            if (response.ok) {
                if (reloadDetails) {
                    viewBillDetails(billId);
                }
                loadBills();
            } else {
                alert('Error updating bill status.');
            }
        })
        .catch(error => {
            console.error('Error updating bill status:', error);
            alert('Error updating bill status.');
        });
    }
}