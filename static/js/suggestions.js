// Suggestions.js - Handles financial suggestions functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    initializeTooltips();
    
    // Add event listeners for suggestion card actions
    const suggestionsContainer = document.querySelector('.suggestions-container');
    if (suggestionsContainer) {
        suggestionsContainer.addEventListener('click', function(e) {
            // Handle "Learn More" clicks
            if (e.target && e.target.classList.contains('learn-more')) {
                const suggestionId = e.target.getAttribute('data-id');
                showResourceModal(suggestionId);
            }
            
            // Handle "Take Action" clicks
            if (e.target && e.target.classList.contains('take-action')) {
                const actionType = e.target.getAttribute('data-action');
                navigateToAction(actionType);
            }
        });
    }
});

// Initialize tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Show resource modal with additional information
function showResourceModal(suggestionId) {
    // Define resources for different suggestion types
    const resources = {
        'reduce-expenses': {
            title: 'How to Reduce Expenses',
            content: `
                <p>Reducing expenses is a key component of financial health. Here are some strategies:</p>
                <ul>
                    <li>Track all spending to identify areas to cut back</li>
                    <li>Create a budget and stick to it</li>
                    <li>Reduce discretionary spending (eating out, entertainment)</li>
                    <li>Look for ways to lower fixed expenses (housing, utilities)</li>
                    <li>Consolidate debt to lower interest payments</li>
                    <li>Review subscriptions and cancel unused services</li>
                </ul>
                <p>Aim to keep your expenses below 70% of your income to allow for savings and investments.</p>
            `
        },
        'emergency-fund': {
            title: 'Building an Emergency Fund',
            content: `
                <p>An emergency fund is your financial safety net. Here's how to build one:</p>
                <ul>
                    <li>Start with a goal of $1,000 saved</li>
                    <li>Gradually build to 3-6 months of essential expenses</li>
                    <li>Keep funds in a liquid, easily accessible account</li>
                    <li>Use a high-yield savings account to earn interest while maintaining liquidity</li>
                    <li>Only use for true emergencies (job loss, medical emergency, urgent home repairs)</li>
                </ul>
                <p>Having an emergency fund helps you avoid debt when unexpected costs arise.</p>
            `
        },
        'diversify-investments': {
            title: 'Investment Diversification',
            content: `
                <p>Diversification helps reduce risk in your investment portfolio. Consider these approaches:</p>
                <ul>
                    <li>Spread investments across different asset classes (stocks, bonds, real estate)</li>
                    <li>Include both domestic and international investments</li>
                    <li>Mix different sectors and industries</li>
                    <li>Consider index funds or ETFs for instant diversification</li>
                    <li>Rebalance your portfolio periodically</li>
                </ul>
                <p>Remember: diversification doesn't guarantee profit or protect against loss, but it can help manage risk.</p>
            `
        },
        'budget-creation': {
            title: 'Creating an Effective Budget',
            content: `
                <p>A budget is the foundation of financial success. Follow these steps:</p>
                <ul>
                    <li>Track your income and expenses for at least a month</li>
                    <li>Categorize your spending to identify patterns</li>
                    <li>Set realistic spending limits for each category</li>
                    <li>Prioritize savings and debt repayment</li>
                    <li>Use the 50/30/20 rule as a starting point: 50% needs, 30% wants, 20% savings</li>
                    <li>Review and adjust your budget regularly</li>
                </ul>
                <p>The best budget is one you can actually follow consistently.</p>
            `
        },
        'goal-progress': {
            title: 'Accelerating Goal Progress',
            content: `
                <p>To make faster progress toward your financial goals:</p>
                <ul>
                    <li>Make your goals specific, measurable, achievable, relevant, and time-bound (SMART)</li>
                    <li>Break larger goals into smaller milestones</li>
                    <li>Automate contributions to your goal funds</li>
                    <li>Look for ways to increase your income (side gig, raise, etc.)</li>
                    <li>Redirect windfall money (tax refunds, bonuses) to your goals</li>
                    <li>Review and adjust your goal strategy quarterly</li>
                </ul>
                <p>Consistently tracking your progress can help keep you motivated.</p>
            `
        },
        'high-expense': {
            title: 'Managing High-Cost Categories',
            content: `
                <p>When one spending category dominates your budget:</p>
                <ul>
                    <li>Analyze if the spending is aligned with your priorities and values</li>
                    <li>Look for specific ways to reduce costs in that category</li>
                    <li>Consider if a major life change might be necessary (e.g., moving to reduce housing costs)</li>
                    <li>Research alternatives that provide similar benefits at lower costs</li>
                    <li>Gradually reduce spending to avoid drastic lifestyle changes</li>
                </ul>
                <p>Often, small consistent changes can lead to significant savings over time.</p>
            `
        },
        'default': {
            title: 'Financial Planning Basics',
            content: `
                <p>Building financial security involves several key steps:</p>
                <ul>
                    <li>Track your spending and income</li>
                    <li>Create and follow a budget</li>
                    <li>Build an emergency fund</li>
                    <li>Pay down high-interest debt</li>
                    <li>Save for retirement</li>
                    <li>Set specific financial goals</li>
                    <li>Invest according to your time horizon and risk tolerance</li>
                </ul>
                <p>Remember that financial planning is a journey, not a destination. Small consistent steps will add up over time.</p>
            `
        }
    };
    
    // Get resource information
    const resource = resources[suggestionId] || resources['default'];
    
    // Set the modal content
    document.getElementById('resource-modal-title').textContent = resource.title;
    document.getElementById('resource-modal-content').innerHTML = resource.content;
    
    // Show the modal
    const resourceModal = new bootstrap.Modal(document.getElementById('resource-modal'));
    resourceModal.show();
}

// Navigate to different sections based on suggestion actions
function navigateToAction(actionType) {
    switch(actionType) {
        case 'budget':
            window.location.href = '/budget';
            break;
        case 'expenses':
            window.location.href = '/expenses';
            break;
        case 'income':
            window.location.href = '/income';
            break;
        case 'goals':
            window.location.href = '/goals';
            break;
        case 'investments':
            window.location.href = '/investments';
            break;
        default:
            window.location.href = '/';
            break;
    }
}

// Show custom alert message
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
