// Goals.js - Handles financial goals functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize goal form with a future date (6 months from now)
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const dateInput = document.getElementById('goal-target-date');
    if (dateInput) {
        dateInput.value = futureDateStr;
    }
    
    // Add event listener to goal form
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', handleGoalSubmit);
    }
    
    // Load goals
    loadGoals();
    
    // Add event listeners for goal actions (delegated)
    const goalsList = document.getElementById('goals-list');
    if (goalsList) {
        goalsList.addEventListener('click', function(e) {
            // Delete goal
            if (e.target && e.target.classList.contains('delete-goal')) {
                const goalId = e.target.getAttribute('data-id');
                deleteGoal(goalId);
            }
            
            // Update goal progress
            if (e.target && e.target.classList.contains('update-goal')) {
                const goalId = e.target.getAttribute('data-id');
                showUpdateProgressModal(goalId);
            }
        });
    }
    
    // Add event listener to progress form
    const progressForm = document.getElementById('progress-form');
    if (progressForm) {
        progressForm.addEventListener('submit', handleProgressUpdate);
    }
});

// Handle goal form submission
function handleGoalSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('goal-name').value;
    const targetAmount = document.getElementById('goal-target-amount').value;
    const currentAmount = document.getElementById('goal-current-amount').value || 0;
    const targetDate = document.getElementById('goal-target-date').value;
    const description = document.getElementById('goal-description').value || '';
    
    // Simple validation
    if (!name || !targetAmount || !targetDate) {
        showAlert('Please fill in all required fields', 'danger');
        return;
    }
    
    // Create goal object
    const goal = {
        name: name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount),
        target_date: targetDate,
        description: description
    };
    
    // Send to server
    addGoal(goal);
}

// Add new goal via API
function addGoal(goal) {
    fetch('/api/goals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(goal)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Reset form
        document.getElementById('goal-form').reset();
        
        // Set future date (6 months)
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        const futureDateStr = futureDate.toISOString().split('T')[0];
        document.getElementById('goal-target-date').value = futureDateStr;
        
        // Show success message
        showAlert('Goal added successfully!', 'success');
        
        // Reload goals
        loadGoals();
    })
    .catch(error => {
        console.error('Error adding goal:', error);
        showAlert('Error adding goal. Please try again.', 'danger');
    });
}

// Load goals from API
function loadGoals() {
    fetch('/api/goals')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(goals => {
            displayGoals(goals);
        })
        .catch(error => {
            console.error('Error loading goals:', error);
            showAlert('Error loading goals. Please try again.', 'danger');
        });
}

// Display goals in the cards container
function displayGoals(goals) {
    const goalsList = document.getElementById('goals-list');
    if (!goalsList) return;
    
    // Clear the current list
    goalsList.innerHTML = '';
    
    // Check if we have goals
    if (goals.length === 0) {
        goalsList.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No financial goals found. Add your first goal using the form above.</p></div>';
        return;
    }
    
    // Sort goals by target date (closest first)
    goals.sort((a, b) => new Date(a.target_date) - new Date(b.target_date));
    
    // Loop through goals and create cards
    goals.forEach(goal => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';
        
        // Calculate progress percentage
        const targetAmount = parseFloat(goal.target_amount);
        const currentAmount = parseFloat(goal.current_amount);
        const progressPercentage = (currentAmount / targetAmount) * 100;
        
        // Format amounts
        const formattedTarget = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(targetAmount);
        
        const formattedCurrent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(currentAmount);
        
        // Format date
        const targetDate = new Date(goal.target_date);
        const formattedDate = targetDate.toLocaleDateString();
        
        // Calculate days remaining
        const today = new Date();
        const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        const daysRemainingText = daysRemaining > 0 
            ? `${daysRemaining} days remaining` 
            : `<span class="text-danger">Target date passed</span>`;
        
        // Determine progress bar color
        let progressColorClass = 'bg-success';
        if (progressPercentage < 25) {
            progressColorClass = 'bg-danger';
        } else if (progressPercentage < 50) {
            progressColorClass = 'bg-warning';
        } else if (progressPercentage < 75) {
            progressColorClass = 'bg-info';
        }
        
        col.innerHTML = `
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${goal.name}</h5>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" type="button" id="dropdownMenuButton-${goal.id}" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton-${goal.id}">
                            <li><a class="dropdown-item update-goal" href="#" data-id="${goal.id}">Update Progress</a></li>
                            <li><a class="dropdown-item delete-goal" href="#" data-id="${goal.id}">Delete Goal</a></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${goal.description || 'No description provided.'}</p>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span>Progress: ${formattedCurrent} of ${formattedTarget}</span>
                            <span>${progressPercentage.toFixed(1)}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${progressColorClass}" role="progressbar" 
                                style="width: ${progressPercentage}%" 
                                aria-valuenow="${progressPercentage}" 
                                aria-valuemin="0" 
                                aria-valuemax="100"></div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small class="text-muted">Target date: ${formattedDate}</small>
                        <small class="text-muted">${daysRemainingText}</small>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-sm btn-outline-primary update-goal" data-id="${goal.id}">
                        <i class="bi bi-pencil"></i> Update Progress
                    </button>
                </div>
            </div>
        `;
        
        goalsList.appendChild(col);
    });
}

// Show modal to update goal progress
function showUpdateProgressModal(goalId) {
    // Fetch the goal details
    fetch('/api/goals')
        .then(response => response.json())
        .then(goals => {
            const goal = goals.find(g => g.id === goalId);
            if (!goal) {
                showAlert('Goal not found', 'danger');
                return;
            }
            
            // Set the values in the modal
            document.getElementById('progress-goal-id').value = goalId;
            document.getElementById('progress-goal-name').textContent = goal.name;
            document.getElementById('progress-current-amount').value = goal.current_amount;
            document.getElementById('progress-target-amount').textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(goal.target_amount);
            
            // Show the modal
            const progressModal = new bootstrap.Modal(document.getElementById('progress-modal'));
            progressModal.show();
        })
        .catch(error => {
            console.error('Error fetching goal details:', error);
            showAlert('Error fetching goal details', 'danger');
        });
}

// Handle progress update form submission
function handleProgressUpdate(e) {
    e.preventDefault();
    
    const goalId = document.getElementById('progress-goal-id').value;
    const currentAmount = parseFloat(document.getElementById('progress-current-amount').value);
    
    // Validate amount
    if (isNaN(currentAmount) || currentAmount < 0) {
        showAlert('Please enter a valid amount', 'danger');
        return;
    }
    
    // Send update to server
    updateGoalProgress(goalId, currentAmount);
    
    // Hide the modal
    const progressModal = bootstrap.Modal.getInstance(document.getElementById('progress-modal'));
    progressModal.hide();
}

// Update goal progress via API
function updateGoalProgress(goalId, currentAmount) {
    fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            current_amount: currentAmount
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showAlert('Goal progress updated successfully!', 'success');
        loadGoals();
    })
    .catch(error => {
        console.error('Error updating goal progress:', error);
        showAlert('Error updating goal progress. Please try again.', 'danger');
    });
}

// Delete goal
function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        fetch(`/api/goals/${goalId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showAlert('Goal deleted successfully', 'success');
            loadGoals();
        })
        .catch(error => {
            console.error('Error deleting goal:', error);
            showAlert('Error deleting goal. Please try again.', 'danger');
        });
    }
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
