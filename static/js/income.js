// Income.js - Handles income tracking functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize income form with today's date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('income-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Add event listener to income form
    const incomeForm = document.getElementById('income-form');
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeSubmit);
    }
    
    // Load incomes
    loadIncomes();
    
    // Add event listener to delete buttons (delegated)
    const incomesList = document.getElementById('incomes-list');
    if (incomesList) {
        incomesList.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('delete-income')) {
                const incomeId = e.target.getAttribute('data-id');
                deleteIncome(incomeId);
            }
        });
    }
    
    // Initialize income chart
    initializeIncomeChart();
});

// Handle income form submission
function handleIncomeSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('income-description').value;
    const amount = document.getElementById('income-amount').value;
    const category = document.getElementById('income-category').value;
    const date = document.getElementById('income-date').value;
    
    // Simple validation
    if (!description || !amount || !category || !date) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    // Create income object
    const income = {
        description: description,
        amount: parseFloat(amount),
        category: category,
        date: date
    };
    
    // Send to server
    addIncome(income);
}

// Add new income via API
function addIncome(income) {
    fetch('/api/incomes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(income)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        document.getElementById('income-form').reset();
        
        // Set date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('income-date').value = today;
        
        // Show success message
        showAlert('Income added successfully!', 'success');
        
        // Reload incomes
        loadIncomes();
    })
    .catch(error => {
        console.error('Error adding income:', error);
        showAlert('Error adding income. Please try again.', 'danger');
    });
}

// Load incomes from API
function loadIncomes() {
    fetch('/api/incomes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(incomes => {
            displayIncomes(incomes);
            updateIncomeChart(incomes);
        })
        .catch(error => {
            console.error('Error loading incomes:', error);
            showAlert('Error loading incomes. Please try again.', 'danger');
        });
}

// Display incomes in the table
function displayIncomes(incomes) {
    const incomesList = document.getElementById('incomes-list');
    if (!incomesList) return;
    
    // Sort incomes by date (most recent first)
    incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear the current list
    incomesList.innerHTML = '';
    
    // Check if we have incomes
    if (incomes.length === 0) {
        incomesList.innerHTML = '<tr><td colspan="5" class="text-center">No income entries found. Add your first income using the form above.</td></tr>';
        return;
    }
    
    // Loop through incomes and create list items
    incomes.forEach(income => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(income.date);
        const formattedDate = date.toLocaleDateString();
        
        // Format amount
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(income.amount);
        
        row.innerHTML = `
            <td>${income.description}</td>
            <td>${formattedAmount}</td>
            <td><span class="badge bg-success">${income.category}</span></td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-income" data-id="${income.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        incomesList.appendChild(row);
    });
    
    // Update income total
    updateIncomeTotal(incomes);
}

// Update income total
function updateIncomeTotal(incomes) {
    const total = incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(total);
    
    const totalElement = document.getElementById('income-total');
    if (totalElement) {
        totalElement.textContent = formattedTotal;
    }
}

// Delete income
function deleteIncome(incomeId) {
    if (confirm('Are you sure you want to delete this income entry?')) {
        fetch(`/api/incomes/${incomeId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showAlert('Income entry deleted successfully', 'success');
            loadIncomes();
        })
        .catch(error => {
            console.error('Error deleting income:', error);
            showAlert('Error deleting income. Please try again.', 'danger');
        });
    }
}

// Initialize income chart
function initializeIncomeChart() {
    const chartCanvas = document.getElementById('income-category-chart');
    if (!chartCanvas) return;
    
    window.incomeCategoryChart = new Chart(chartCanvas, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
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
                    text: 'Income by Category',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Update income chart with new data
function updateIncomeChart(incomes) {
    const chartCanvas = document.getElementById('income-category-chart');
    if (!chartCanvas || !window.incomeCategoryChart) return;
    
    // Group incomes by category
    const categoryTotals = {};
    incomes.forEach(income => {
        const category = income.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(income.amount);
    });
    
    // Update chart data
    window.incomeCategoryChart.data.labels = Object.keys(categoryTotals);
    window.incomeCategoryChart.data.datasets[0].data = Object.values(categoryTotals);
    
    // Ensure we have enough colors
    const colors = generateChartColors(Object.keys(categoryTotals).length);
    window.incomeCategoryChart.data.datasets[0].backgroundColor = colors;
    
    window.incomeCategoryChart.update();
}

// Generate colors for chart segments
function generateChartColors(count) {
    const colors = [
        'rgba(75, 192, 192, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(201, 203, 207, 0.8)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 205, 86, 0.6)',
        'rgba(255, 159, 64, 0.6)',
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
