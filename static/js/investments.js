// Investments.js - Handles investment tracking functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize investment form with today's date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('investment-purchase-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Add event listener to investment form
    const investmentForm = document.getElementById('investment-form');
    if (investmentForm) {
        investmentForm.addEventListener('submit', handleInvestmentSubmit);
    }
    
    // Load investments
    loadInvestments();
    
    // Add event listeners for investment actions (delegated)
    const investmentsList = document.getElementById('investments-list');
    if (investmentsList) {
        investmentsList.addEventListener('click', function(e) {
            // Delete investment
            if (e.target && e.target.classList.contains('delete-investment')) {
                const investmentId = e.target.getAttribute('data-id');
                deleteInvestment(investmentId);
            }
            
            // Update investment value
            if (e.target && e.target.classList.contains('update-investment')) {
                const investmentId = e.target.getAttribute('data-id');
                showUpdateValueModal(investmentId);
            }
        });
    }
    
    // Add event listener to value update form
    const valueForm = document.getElementById('value-form');
    if (valueForm) {
        valueForm.addEventListener('submit', handleValueUpdate);
    }
    
    // Initialize investment chart
    initializeInvestmentChart();
});

// Handle investment form submission
function handleInvestmentSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('investment-name').value;
    const type = document.getElementById('investment-type').value;
    const amount = document.getElementById('investment-amount').value;
    const purchaseDate = document.getElementById('investment-purchase-date').value;
    const currentValue = document.getElementById('investment-current-value').value || amount;
    const notes = document.getElementById('investment-notes').value || '';
    
    // Simple validation
    if (!name || !type || !amount || !purchaseDate) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    // Create investment object
    const investment = {
        name: name,
        type: type,
        amount: parseFloat(amount),
        purchase_date: purchaseDate,
        current_value: parseFloat(currentValue),
        notes: notes
    };
    
    // Send to server
    addInvestment(investment);
}

// Add new investment via API
function addInvestment(investment) {
    fetch('/api/investments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(investment)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        document.getElementById('investment-form').reset();
        
        // Set date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('investment-purchase-date').value = today;
        
        // Show success message
        showAlert('Investment added successfully!', 'success');
        
        // Reload investments
        loadInvestments();
    })
    .catch(error => {
        console.error('Error adding investment:', error);
        showAlert('Error adding investment. Please try again.', 'danger');
    });
}

// Load investments from API
function loadInvestments() {
    fetch('/api/investments')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(investments => {
            displayInvestments(investments);
            updateInvestmentChart(investments);
        })
        .catch(error => {
            console.error('Error loading investments:', error);
            showAlert('Error loading investments. Please try again.', 'danger');
        });
}

// Display investments in the table
function displayInvestments(investments) {
    const investmentsList = document.getElementById('investments-list');
    if (!investmentsList) return;
    
    // Sort investments by type
    investments.sort((a, b) => a.type.localeCompare(b.type));
    
    // Clear the current list
    investmentsList.innerHTML = '';
    
    // Check if we have investments
    if (investments.length === 0) {
        investmentsList.innerHTML = '<tr><td colspan="6" class="text-center">No investments found. Add your first investment using the form above.</td></tr>';
        return;
    }
    
    // Calculate total portfolio value
    const totalValue = investments.reduce((sum, investment) => sum + parseFloat(investment.current_value), 0);
    updatePortfolioTotal(totalValue);
    
    // Loop through investments and create table rows
    investments.forEach(investment => {
        const row = document.createElement('tr');
        
        // Calculate return on investment
        const originalAmount = parseFloat(investment.amount);
        const currentValue = parseFloat(investment.current_value);
        const roi = ((currentValue - originalAmount) / originalAmount) * 100;
        
        // Format amounts
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(originalAmount);
        
        const formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(currentValue);
        
        // Format date
        const date = new Date(investment.purchase_date);
        const formattedDate = date.toLocaleDateString();
        
        // Determine ROI color class
        const roiClass = roi >= 0 ? 'text-success' : 'text-danger';
        const roiIcon = roi >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
        
        row.innerHTML = `
            <td>${investment.name}</td>
            <td><span class="badge bg-info">${investment.type}</span></td>
            <td>${formattedAmount}</td>
            <td>${formattedValue}</td>
            <td class="${roiClass}">
                <i class="bi ${roiIcon}"></i> ${Math.abs(roi).toFixed(2)}%
            </td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary update-investment me-1" data-id="${investment.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-investment" data-id="${investment.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        investmentsList.appendChild(row);
    });
}

// Update portfolio total value
function updatePortfolioTotal(totalValue) {
    const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(totalValue);
    
    const totalElement = document.getElementById('portfolio-total');
    if (totalElement) {
        totalElement.textContent = formattedTotal;
    }
}

// Show modal to update investment value
function showUpdateValueModal(investmentId) {
    // Fetch the investment details
    fetch('/api/investments')
        .then(response => response.json())
        .then(investments => {
            const investment = investments.find(i => i.id === investmentId);
            if (!investment) {
                showAlert('Investment not found', 'danger');
                return;
            }
            
            // Set the values in the modal
            document.getElementById('value-investment-id').value = investmentId;
            document.getElementById('value-investment-name').textContent = investment.name;
            document.getElementById('value-current-value').value = investment.current_value;
            document.getElementById('value-original-amount').textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(investment.amount);
            
            // Show the modal
            const valueModal = new bootstrap.Modal(document.getElementById('value-modal'));
            valueModal.show();
        })
        .catch(error => {
            console.error('Error fetching investment details:', error);
            showAlert('Error fetching investment details', 'danger');
        });
}

// Handle value update form submission
function handleValueUpdate(e) {
    e.preventDefault();
    
    const investmentId = document.getElementById('value-investment-id').value;
    const currentValue = parseFloat(document.getElementById('value-current-value').value);
    
    // Validate amount
    if (isNaN(currentValue) || currentValue < 0) {
        showAlert('Please enter a valid amount', 'danger');
        return;
    }
    
    // Send update to server
    updateInvestmentValue(investmentId, currentValue);
    
    // Hide the modal
    const valueModal = bootstrap.Modal.getInstance(document.getElementById('value-modal'));
    valueModal.hide();
}

// Update investment value via API
function updateInvestmentValue(investmentId, currentValue) {
    fetch(`/api/investments/${investmentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            current_value: currentValue
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showAlert('Investment value updated successfully!', 'success');
        loadInvestments();
    })
    .catch(error => {
        console.error('Error updating investment value:', error);
        showAlert('Error updating investment value. Please try again.', 'danger');
    });
}

// Delete investment
function deleteInvestment(investmentId) {
    if (confirm('Are you sure you want to delete this investment?')) {
        fetch(`/api/investments/${investmentId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showAlert('Investment deleted successfully', 'success');
            loadInvestments();
        })
        .catch(error => {
            console.error('Error deleting investment:', error);
            showAlert('Error deleting investment. Please try again.', 'danger');
        });
    }
}

// Initialize investment chart
function initializeInvestmentChart() {
    const chartCanvas = document.getElementById('investment-type-chart');
    if (!chartCanvas) return;
    
    window.investmentTypeChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(201, 203, 207, 0.8)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'white'
                    }
                },
                title: {
                    display: true,
                    text: 'Portfolio Allocation',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Update investment chart with new data
function updateInvestmentChart(investments) {
    const chartCanvas = document.getElementById('investment-type-chart');
    if (!chartCanvas || !window.investmentTypeChart) return;
    
    // Group investments by type
    const typeTotals = {};
    investments.forEach(investment => {
        const type = investment.type;
        if (!typeTotals[type]) {
            typeTotals[type] = 0;
        }
        typeTotals[type] += parseFloat(investment.current_value);
    });
    
    // Update chart data
    window.investmentTypeChart.data.labels = Object.keys(typeTotals);
    window.investmentTypeChart.data.datasets[0].data = Object.values(typeTotals);
    
    // Ensure we have enough colors
    const colors = generateChartColors(Object.keys(typeTotals).length);
    window.investmentTypeChart.data.datasets[0].backgroundColor = colors;
    
    window.investmentTypeChart.update();
}

// Generate colors for chart segments
function generateChartColors(count) {
    const colors = [
        'rgba(54, 162, 235, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(201, 203, 207, 0.8)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 205, 86, 0.6)',
        'rgba(201, 203, 207, 0.6)',
    ];
    
    // If we need more colors than provided, generate random ones
    if (count > colors.length) {
        for (let i = colors.length; i < count; i++) {
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        }
    }
    
    return colors.slice(0, count);
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertsContainer.appendChild(alert);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 500);
    }, 4000);
}
