// Dashboard.js - Handles dashboard functionality and charts

// Initialize dashboard charts and data
document.addEventListener('DOMContentLoaded', function() {
    // Fetch financial summary data
    fetchFinancialSummary();
});

// Fetch financial summary data from the API
function fetchFinancialSummary() {
    fetch('/api/summary')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateDashboardSummary(data);
            createExpenseChart(data.expense_by_category);
            createIncomeChart(data.income_by_category);
            createInvestmentChart(data.investments_by_type);
        })
        .catch(error => {
            console.error('Error fetching financial summary:', error);
            displayErrorMessage('Could not load financial summary. Please try again later.');
        });
}

// Update dashboard summary with financial data
function updateDashboardSummary(data) {
    document.getElementById('total-income').textContent = formatCurrency(data.total_income);
    document.getElementById('total-expenses').textContent = formatCurrency(data.total_expenses);
    document.getElementById('net-worth').textContent = formatCurrency(data.net_worth);
    
    // Update savings rate if income exists
    if (data.total_income > 0) {
        const savingsRate = ((data.total_income - data.total_expenses) / data.total_income) * 100;
        document.getElementById('savings-rate').textContent = `${savingsRate.toFixed(1)}%`;
    } else {
        document.getElementById('savings-rate').textContent = 'N/A';
    }
}

// Create expense chart using Chart.js
function createExpenseChart(expenseData) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Convert data object to arrays for Chart.js
    const labels = Object.keys(expenseData);
    const values = Object.values(expenseData);
    
    // Generate random colors for the chart segments
    const colors = generateChartColors(labels.length);
    
    if (window.expenseChart) {
        window.expenseChart.destroy();
    }
    
    window.expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
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

// Create income chart using Chart.js
function createIncomeChart(incomeData) {
    const ctx = document.getElementById('income-chart').getContext('2d');
    
    // Convert data object to arrays for Chart.js
    const labels = Object.keys(incomeData);
    const values = Object.values(incomeData);
    
    // Generate random colors for the chart segments
    const colors = generateChartColors(labels.length);
    
    if (window.incomeChart) {
        window.incomeChart.destroy();
    }
    
    window.incomeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
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

// Create investment chart using Chart.js
function createInvestmentChart(investmentData) {
    const ctx = document.getElementById('investment-chart').getContext('2d');
    
    // Convert data object to arrays for Chart.js
    const labels = Object.keys(investmentData);
    const values = Object.values(investmentData);
    
    // If no investment data, display a message
    if (labels.length === 0) {
        document.getElementById('investment-chart-container').innerHTML = 
            '<div class="alert alert-info">No investment data available. Add investments to see your portfolio breakdown.</div>';
        return;
    }
    
    // Generate random colors for the chart segments
    const colors = generateChartColors(labels.length);
    
    if (window.investmentChart) {
        window.investmentChart.destroy();
    }
    
    window.investmentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
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
                    text: 'Investment Portfolio',
                    color: 'white',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
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

// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(value);
}

// Display error message on the dashboard
function displayErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.getElementById('dashboard-alerts').appendChild(alertDiv);
}
