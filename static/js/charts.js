// Charts.js - Shared chart utility functions

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

// Calculate percentage change
function calculatePercentChange(oldValue, newValue) {
    if (oldValue === 0) return Infinity;
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

// Format date to display format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Group data by time period (daily, weekly, monthly, yearly)
function groupDataByPeriod(data, period, valueField, dateField = 'date') {
    const grouped = {};
    
    data.forEach(item => {
        const date = new Date(item[dateField]);
        let key;
        
        switch(period) {
            case 'daily':
                key = date.toISOString().split('T')[0];
                break;
            case 'weekly':
                // Get the Monday of the week
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(date.setDate(diff));
                key = monday.toISOString().split('T')[0];
                break;
            case 'monthly':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'yearly':
                key = date.getFullYear().toString();
                break;
            default:
                key = date.toISOString().split('T')[0];
        }
        
        if (!grouped[key]) {
            grouped[key] = 0;
        }
        
        grouped[key] += parseFloat(item[valueField]);
    });
    
    return grouped;
}

// Create a time series chart
function createTimeSeriesChart(ctx, label, data, period) {
    const timeLabels = Object.keys(data).sort();
    const timeValues = timeLabels.map(label => data[label]);
    
    let timeFormat;
    switch(period) {
        case 'daily':
            timeFormat = 'MMM D, YYYY';
            break;
        case 'weekly':
            timeFormat = 'Week of MMM D, YYYY';
            break;
        case 'monthly':
            timeFormat = 'MMM YYYY';
            break;
        case 'yearly':
            timeFormat = 'YYYY';
            break;
        default:
            timeFormat = 'MMM D, YYYY';
    }
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: label,
                data: timeValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        },
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
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}

// Create a comparison chart (bar or line)
function createComparisonChart(ctx, labels, datasets, type = 'bar') {
    return new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        },
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
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}
