// Budget.js - Handles budget planning functionality

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to budget form
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetUpdate);
    }
    
    // Load budget data
    loadBudget();
    
    // Initialize budget chart
    initializeBudgetChart();
});

// Handle budget form submission
function handleBudgetUpdate(e) {
    e.preventDefault();
    
    const budgetData = {};
    const categoryInputs = document.querySelectorAll('[id^="budget_"]');
    
    categoryInputs.forEach(input => {
        const category = input.id.replace('budget_', '');
        budgetData[category] = parseFloat(input.value) || 0;
    });
    
    // Send to server
    updateBudget(budgetData);
}

// Update budget via API
function updateBudget(budgetData) {
    fetch('/api/budget', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showAlert('Budget updated successfully!', 'success');
        loadBudget();
    })
    .catch(error => {
        console.error('Error updating budget:', error);
        showAlert('Error updating budget. Please try again.', 'danger');
    });
}

// Load budget data from API
function loadBudget() {
    // Load budget data
    fetch('/api/budget')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(budget => {
            // Load current spending data
            return fetch('/api/expenses')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(expenses => {
                    updateBudgetDisplay(budget, expenses);
                });
        })
        .catch(error => {
            console.error('Error loading budget data:', error);
            showAlert('Error loading budget data. Please try again.', 'danger');
        });
}

// Update budget display with budget and spending data
function updateBudgetDisplay(budget, expenses) {
    // Calculate spending by category
    const spendingByCategory = {};
    expenses.forEach(expense => {
        const category = expense.category;
        if (!spendingByCategory[category]) {
            spendingByCategory[category] = 0;
        }
        spendingByCategory[category] += parseFloat(expense.amount);
    });
    
    // Update the form inputs with current budget values
    Object.keys(budget).forEach(category => {
        const inputElement = document.getElementById(`budget_${category}`);
        if (inputElement) {
            inputElement.value = budget[category];
        }
    });
    
    // Update the progress bars and spending info
    const budgetItems = document.querySelectorAll('.budget-item');
    budgetItems.forEach(item => {
        const category = item.getAttribute('data-category');
        const budgetAmount = parseFloat(budget[category] || 0);
        const spentAmount = parseFloat(spendingByCategory[category] || 0);
        
        // Calculate percentage
        const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
        
        // Update the progress bar
        const progressBar = item.querySelector('.progress-bar');
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        progressBar.setAttribute('aria-valuenow', Math.min(percentage, 100));
        
        // Set the progress bar color based on percentage
        progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        if (percentage > 100) {
            progressBar.classList.add('bg-danger');
        } else if (percentage > 70) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-success');
        }
        
        // Update the spent amount and percentage text
        const spentElement = item.querySelector('.spent-amount');
        if (spentElement) {
            spentElement.textContent = formatCurrency(spentAmount);
        }
        
        const percentElement = item.querySelector('.budget-percent');
        if (percentElement) {
            percentElement.textContent = `${percentage.toFixed(1)}%`;
            percentElement.classList.remove('text-success', 'text-warning', 'text-danger');
            if (percentage > 100) {
                percentElement.classList.add('text-danger');
            } else if (percentage > 70) {
                percentElement.classList.add('text-warning');
            } else {
                percentElement.classList.add('text-success');
            }
        }
    });
    
    // Update the budget chart
    updateBudgetChart(budget, spendingByCategory);
}

// Initialize budget chart
function initializeBudgetChart() {
    const chartCanvas = document.getElementById('budget-chart');
    if (!chartCanvas) return;
    
    window.budgetChart = new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Budget',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Spent',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                },
                title: {
                    display: true,
                    text: 'Budget vs. Actual Spending',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Update budget chart with new data
function updateBudgetChart(budget, spendingByCategory) {
    const chartCanvas = document.getElementById('budget-chart');
    if (!chartCanvas || !window.budgetChart) return;
    
    // Get categories that have either a budget or spending
    const allCategories = [...new Set([
        ...Object.keys(budget),
        ...Object.keys(spendingByCategory)
    ])];
    
    // Sort categories alphabetically
    allCategories.sort();
    
    // Prepare data for chart
    const budgetData = [];
    const spentData = [];
    
    allCategories.forEach(category => {
        budgetData.push(parseFloat(budget[category] || 0));
        spentData.push(parseFloat(spendingByCategory[category] || 0));
    });
    
    // Update chart data
    window.budgetChart.data.labels = allCategories;
    window.budgetChart.data.datasets[0].data = budgetData;
    window.budgetChart.data.datasets[1].data = spentData;
    
    window.budgetChart.update();
}

// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
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
