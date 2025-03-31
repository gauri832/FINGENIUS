// Expenses.js - Handles expense tracking functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize expense form with today's date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Add event listener to expense form
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }
    
    // Load expenses
    loadExpenses();
    
    // Add event listener to delete buttons (delegated)
    const expensesList = document.getElementById('expenses-list');
    if (expensesList) {
        expensesList.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('delete-expense')) {
                const expenseId = e.target.getAttribute('data-id');
                deleteExpense(expenseId);
            }
        });
    }
    
    // Initialize expense chart
    initializeExpenseChart();
});

// Handle expense form submission
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('expense-description').value;
    const amount = document.getElementById('expense-amount').value;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    
    // Simple validation
    if (!description || !amount || !category || !date) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    // Create expense object
    const expense = {
        description: description,
        amount: parseFloat(amount),
        category: category,
        date: date
    };
    
    // Send to server
    addExpense(expense);
}

// Add new expense via API
function addExpense(expense) {
    fetch('/api/expenses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        document.getElementById('expense-form').reset();
        
        // Set date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expense-date').value = today;
        
        // Show success message
        showAlert('Expense added successfully!', 'success');
        
        // Reload expenses
        loadExpenses();
    })
    .catch(error => {
        console.error('Error adding expense:', error);
        showAlert('Error adding expense. Please try again.', 'danger');
    });
}

// Load expenses from API
function loadExpenses() {
    fetch('/api/expenses')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(expenses => {
            displayExpenses(expenses);
            updateExpenseChart(expenses);
        })
        .catch(error => {
            console.error('Error loading expenses:', error);
            showAlert('Error loading expenses. Please try again.', 'danger');
        });
}

// Display expenses in the table
function displayExpenses(expenses) {
    const expensesList = document.getElementById('expenses-list');
    if (!expensesList) return;
    
    // Sort expenses by date (most recent first)
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear the current list
    expensesList.innerHTML = '';
    
    // Check if we have expenses
    if (expenses.length === 0) {
        expensesList.innerHTML = '<tr><td colspan="5" class="text-center">No expenses found. Add your first expense using the form above.</td></tr>';
        return;
    }
    
    // Loop through expenses and create list items
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString();
        
        // Format amount
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(expense.amount);
        
        row.innerHTML = `
            <td>${expense.description}</td>
            <td>${formattedAmount}</td>
            <td><span class="badge bg-info">${expense.category}</span></td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-expense" data-id="${expense.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        expensesList.appendChild(row);
    });
    
    // Update expense total
    updateExpenseTotal(expenses);
}

// Update expense total
function updateExpenseTotal(expenses) {
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(total);
    
    const totalElement = document.getElementById('expense-total');
    if (totalElement) {
        totalElement.textContent = formattedTotal;
    }
}

// Delete expense
function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showAlert('Expense deleted successfully', 'success');
            loadExpenses();
        })
        .catch(error => {
            console.error('Error deleting expense:', error);
            showAlert('Error deleting expense. Please try again.', 'danger');
        });
    }
}

// Initialize expense chart
function initializeExpenseChart() {
    const chartCanvas = document.getElementById('expense-category-chart');
    if (!chartCanvas) return;
    
    window.expenseCategoryChart = new Chart(chartCanvas, {
        type: 'pie',
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
                    text: 'Expenses by Category',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Update expense chart with new data
function updateExpenseChart(expenses) {
    const chartCanvas = document.getElementById('expense-category-chart');
    if (!chartCanvas || !window.expenseCategoryChart) return;
    
    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(expense.amount);
    });
    
    // Update chart data
    window.expenseCategoryChart.data.labels = Object.keys(categoryTotals);
    window.expenseCategoryChart.data.datasets[0].data = Object.values(categoryTotals);
    
    // Ensure we have enough colors
    const colors = generateChartColors(Object.keys(categoryTotals).length);
    window.expenseCategoryChart.data.datasets[0].backgroundColor = colors;
    
    window.expenseCategoryChart.update();
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
