import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import json
import uuid

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "fingenius-dev-key")

# Add datetime to all templates
@app.context_processor
def inject_now():
    return {'now': datetime.now()}

# In-memory data storage for MVP
users = {}
expenses = {}
incomes = {}
goals = {}
investments = {}
budgets = {}

# Default categories
default_expense_categories = [
    "Housing", "Transportation", "Food", "Utilities", "Insurance", 
    "Healthcare", "Debt Payments", "Savings", "Personal", "Entertainment", 
    "Education", "Clothing", "Gifts/Donations", "Miscellaneous"
]

default_income_categories = [
    "Salary", "Freelance", "Business", "Investments", "Rental", 
    "Gifts", "Other"
]

# Helper functions
def generate_id():
    return str(uuid.uuid4())

def is_authenticated():
    return 'user_id' in session

def get_user_data(user_id, data_type):
    if data_type == 'expenses':
        return expenses.get(user_id, [])
    elif data_type == 'incomes':
        return incomes.get(user_id, [])
    elif data_type == 'goals':
        return goals.get(user_id, [])
    elif data_type == 'investments':
        return investments.get(user_id, [])
    elif data_type == 'budgets':
        return budgets.get(user_id, {})
    return []

# Routes
@app.route('/')
def index():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user = users.get(user_id)
    
    if not user:
        session.clear()
        return redirect(url_for('login'))
    
    user_expenses = get_user_data(user_id, 'expenses')
    user_incomes = get_user_data(user_id, 'incomes')
    user_goals = get_user_data(user_id, 'goals')
    user_investments = get_user_data(user_id, 'investments')
    
    # Calculate financial summary
    total_expenses = sum(float(expense['amount']) for expense in user_expenses)
    total_income = sum(float(income['amount']) for income in user_incomes)
    net_worth = total_income - total_expenses
    
    # Get latest transactions
    latest_expenses = sorted(user_expenses, key=lambda x: x['date'], reverse=True)[:5]
    latest_incomes = sorted(user_incomes, key=lambda x: x['date'], reverse=True)[:5]
    
    return render_template('index.html', 
                          username=user['username'],
                          total_expenses=total_expenses,
                          total_income=total_income,
                          net_worth=net_worth,
                          expenses=latest_expenses,
                          incomes=latest_incomes,
                          goals=user_goals,
                          investments=user_investments)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Find user by username
        user_id = None
        for uid, user in users.items():
            if user['username'] == username:
                user_id = uid
                break
        
        if user_id and check_password_hash(users[user_id]['password'], password):
            session['user_id'] = user_id
            flash('Login successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Check if username already exists
        for user in users.values():
            if user['username'] == username:
                flash('Username already exists', 'danger')
                return render_template('register.html')
        
        # Create new user
        user_id = generate_id()
        users[user_id] = {
            'id': user_id,
            'username': username,
            'email': email,
            'password': generate_password_hash(password)
        }
        
        # Initialize data structures for user
        expenses[user_id] = []
        incomes[user_id] = []
        goals[user_id] = []
        investments[user_id] = []
        budgets[user_id] = {category: 0 for category in default_expense_categories}
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'success')
    return redirect(url_for('login'))

@app.route('/expenses', methods=['GET', 'POST'])
def expense_tracker():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user_expenses = get_user_data(user_id, 'expenses')
    
    if request.method == 'POST':
        # Add new expense
        new_expense = {
            'id': generate_id(),
            'description': request.form.get('description'),
            'amount': request.form.get('amount'),
            'category': request.form.get('category'),
            'date': request.form.get('date', datetime.now().strftime('%Y-%m-%d'))
        }
        
        if user_id not in expenses:
            expenses[user_id] = []
            
        expenses[user_id].append(new_expense)
        flash('Expense added successfully!', 'success')
        return redirect(url_for('expense_tracker'))
    
    return render_template('expenses.html', 
                          expenses=user_expenses, 
                          categories=default_expense_categories)

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_expenses = get_user_data(user_id, 'expenses')
    return jsonify(user_expenses)

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    
    new_expense = {
        'id': generate_id(),
        'description': data.get('description'),
        'amount': data.get('amount'),
        'category': data.get('category'),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d'))
    }
    
    if user_id not in expenses:
        expenses[user_id] = []
        
    expenses[user_id].append(new_expense)
    return jsonify({'success': True, 'expense': new_expense})

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_expenses = get_user_data(user_id, 'expenses')
    
    for i, expense in enumerate(user_expenses):
        if expense['id'] == expense_id:
            del expenses[user_id][i]
            return jsonify({'success': True})
    
    return jsonify({'error': 'Expense not found'}), 404

@app.route('/income', methods=['GET', 'POST'])
def income_tracker():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user_incomes = get_user_data(user_id, 'incomes')
    
    if request.method == 'POST':
        # Add new income
        new_income = {
            'id': generate_id(),
            'description': request.form.get('description'),
            'amount': request.form.get('amount'),
            'category': request.form.get('category'),
            'date': request.form.get('date', datetime.now().strftime('%Y-%m-%d'))
        }
        
        if user_id not in incomes:
            incomes[user_id] = []
            
        incomes[user_id].append(new_income)
        flash('Income added successfully!', 'success')
        return redirect(url_for('income_tracker'))
    
    return render_template('income.html', 
                          incomes=user_incomes, 
                          categories=default_income_categories)

@app.route('/api/incomes', methods=['GET'])
def get_incomes():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_incomes = get_user_data(user_id, 'incomes')
    return jsonify(user_incomes)

@app.route('/api/incomes', methods=['POST'])
def add_income():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    
    new_income = {
        'id': generate_id(),
        'description': data.get('description'),
        'amount': data.get('amount'),
        'category': data.get('category'),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d'))
    }
    
    if user_id not in incomes:
        incomes[user_id] = []
        
    incomes[user_id].append(new_income)
    return jsonify({'success': True, 'income': new_income})

@app.route('/api/incomes/<income_id>', methods=['DELETE'])
def delete_income(income_id):
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_incomes = get_user_data(user_id, 'incomes')
    
    for i, income in enumerate(user_incomes):
        if income['id'] == income_id:
            del incomes[user_id][i]
            return jsonify({'success': True})
    
    return jsonify({'error': 'Income not found'}), 404

@app.route('/goals', methods=['GET', 'POST'])
def goal_tracker():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user_goals = get_user_data(user_id, 'goals')
    
    if request.method == 'POST':
        # Add new goal
        new_goal = {
            'id': generate_id(),
            'name': request.form.get('name'),
            'target_amount': request.form.get('target_amount'),
            'current_amount': request.form.get('current_amount', 0),
            'target_date': request.form.get('target_date'),
            'description': request.form.get('description', '')
        }
        
        if user_id not in goals:
            goals[user_id] = []
            
        goals[user_id].append(new_goal)
        flash('Goal added successfully!', 'success')
        return redirect(url_for('goal_tracker'))
    
    return render_template('goals.html', goals=user_goals)

@app.route('/api/goals', methods=['GET'])
def get_goals():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_goals = get_user_data(user_id, 'goals')
    return jsonify(user_goals)

@app.route('/api/goals', methods=['POST'])
def add_goal():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    
    new_goal = {
        'id': generate_id(),
        'name': data.get('name'),
        'target_amount': data.get('target_amount'),
        'current_amount': data.get('current_amount', 0),
        'target_date': data.get('target_date'),
        'description': data.get('description', '')
    }
    
    if user_id not in goals:
        goals[user_id] = []
        
    goals[user_id].append(new_goal)
    return jsonify({'success': True, 'goal': new_goal})

@app.route('/api/goals/<goal_id>', methods=['PUT'])
def update_goal(goal_id):
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    user_goals = get_user_data(user_id, 'goals')
    
    for i, goal in enumerate(user_goals):
        if goal['id'] == goal_id:
            goals[user_id][i].update({
                'name': data.get('name', goal['name']),
                'target_amount': data.get('target_amount', goal['target_amount']),
                'current_amount': data.get('current_amount', goal['current_amount']),
                'target_date': data.get('target_date', goal['target_date']),
                'description': data.get('description', goal['description'])
            })
            return jsonify({'success': True, 'goal': goals[user_id][i]})
    
    return jsonify({'error': 'Goal not found'}), 404

@app.route('/api/goals/<goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_goals = get_user_data(user_id, 'goals')
    
    for i, goal in enumerate(user_goals):
        if goal['id'] == goal_id:
            del goals[user_id][i]
            return jsonify({'success': True})
    
    return jsonify({'error': 'Goal not found'}), 404

@app.route('/investments', methods=['GET', 'POST'])
def investment_tracker():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user_investments = get_user_data(user_id, 'investments')
    
    if request.method == 'POST':
        # Add new investment
        new_investment = {
            'id': generate_id(),
            'name': request.form.get('name'),
            'type': request.form.get('type'),
            'amount': request.form.get('amount'),
            'purchase_date': request.form.get('purchase_date'),
            'current_value': request.form.get('current_value', request.form.get('amount')),
            'notes': request.form.get('notes', '')
        }
        
        if user_id not in investments:
            investments[user_id] = []
            
        investments[user_id].append(new_investment)
        flash('Investment added successfully!', 'success')
        return redirect(url_for('investment_tracker'))
    
    investment_types = [
        "Stocks", "Bonds", "Mutual Funds", "ETFs", "Real Estate", 
        "Retirement Accounts", "Cryptocurrencies", "Other"
    ]
    
    return render_template('investments.html', 
                          investments=user_investments,
                          investment_types=investment_types)

@app.route('/api/investments', methods=['GET'])
def get_investments():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_investments = get_user_data(user_id, 'investments')
    return jsonify(user_investments)

@app.route('/api/investments', methods=['POST'])
def add_investment():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    
    new_investment = {
        'id': generate_id(),
        'name': data.get('name'),
        'type': data.get('type'),
        'amount': data.get('amount'),
        'purchase_date': data.get('purchase_date'),
        'current_value': data.get('current_value', data.get('amount')),
        'notes': data.get('notes', '')
    }
    
    if user_id not in investments:
        investments[user_id] = []
        
    investments[user_id].append(new_investment)
    return jsonify({'success': True, 'investment': new_investment})

@app.route('/api/investments/<investment_id>', methods=['PUT'])
def update_investment(investment_id):
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    user_investments = get_user_data(user_id, 'investments')
    
    for i, investment in enumerate(user_investments):
        if investment['id'] == investment_id:
            investments[user_id][i].update({
                'name': data.get('name', investment['name']),
                'type': data.get('type', investment['type']),
                'amount': data.get('amount', investment['amount']),
                'purchase_date': data.get('purchase_date', investment['purchase_date']),
                'current_value': data.get('current_value', investment['current_value']),
                'notes': data.get('notes', investment['notes'])
            })
            return jsonify({'success': True, 'investment': investments[user_id][i]})
    
    return jsonify({'error': 'Investment not found'}), 404

@app.route('/api/investments/<investment_id>', methods=['DELETE'])
def delete_investment(investment_id):
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_investments = get_user_data(user_id, 'investments')
    
    for i, investment in enumerate(user_investments):
        if investment['id'] == investment_id:
            del investments[user_id][i]
            return jsonify({'success': True})
    
    return jsonify({'error': 'Investment not found'}), 404

@app.route('/suggestions')
def suggestions():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user_expenses = get_user_data(user_id, 'expenses')
    user_incomes = get_user_data(user_id, 'incomes')
    user_goals = get_user_data(user_id, 'goals')
    user_investments = get_user_data(user_id, 'investments')
    
    # Calculate financial suggestions
    total_expenses = sum(float(expense['amount']) for expense in user_expenses)
    total_income = sum(float(income['amount']) for income in user_incomes)
    net_worth = total_income - total_expenses
    
    # Group expenses by category
    expense_by_category = {}
    for expense in user_expenses:
        category = expense['category']
        if category not in expense_by_category:
            expense_by_category[category] = 0
        expense_by_category[category] += float(expense['amount'])
    
    # Generate suggestions
    suggestions = []
    
    # Income/Expense ratio suggestion
    if total_income > 0:
        expense_ratio = total_expenses / total_income
        if expense_ratio > 0.9:
            suggestions.append({
                'title': 'Reduce Expenses',
                'description': 'Your expenses are {:.1f}% of your income. Aim to keep expenses below 70% of income.'.format(expense_ratio * 100),
                'type': 'warning'
            })
        elif expense_ratio < 0.5:
            suggestions.append({
                'title': 'Great Savings Rate',
                'description': 'You\'re saving {:.1f}% of your income. Consider investing more for long-term growth.'.format((1-expense_ratio) * 100),
                'type': 'success'
            })
    
    # Emergency fund suggestion
    if not user_investments:
        suggestions.append({
            'title': 'Start an Emergency Fund',
            'description': 'Consider building an emergency fund with 3-6 months of expenses.',
            'type': 'info'
        })
    
    # Investment diversification suggestion
    investment_types = set(inv['type'] for inv in user_investments)
    if len(investment_types) < 3 and user_investments:
        suggestions.append({
            'title': 'Diversify Investments',
            'description': 'Consider diversifying your investment portfolio across different asset classes.',
            'type': 'info'
        })
    
    # High expense category suggestion
    if expense_by_category:
        highest_category = max(expense_by_category.items(), key=lambda x: x[1])
        if highest_category[1] > (total_expenses * 0.4):  # If one category is over 40% of total
            suggestions.append({
                'title': 'High {} Expenses'.format(highest_category[0]),
                'description': '{} expenses make up {:.1f}% of your total spending. Consider ways to reduce this.'.format(
                    highest_category[0], (highest_category[1] / total_expenses) * 100),
                'type': 'warning'
            })
    
    # Goal progress suggestion
    for goal in user_goals:
        target = float(goal['target_amount'])
        current = float(goal['current_amount'])
        progress = (current / target) if target > 0 else 0
        
        if progress < 0.25:
            suggestions.append({
                'title': 'Goal: {}'.format(goal['name']),
                'description': 'You\'re only {:.1f}% of the way to your goal. Consider allocating more funds.'.format(progress * 100),
                'type': 'warning'
            })
            
    # Default suggestions if we don't have enough data yet
    if not suggestions:
        suggestions = [
            {
                'title': 'Track Your Expenses',
                'description': 'Start by logging all your expenses to get better financial insights.',
                'type': 'info'
            },
            {
                'title': 'Set Financial Goals',
                'description': 'Define clear financial goals to help motivate your saving and investing habits.',
                'type': 'info'
            },
            {
                'title': 'Create a Budget',
                'description': 'A budget is the foundation of financial success. Use our budget tool to get started.',
                'type': 'info'
            }
        ]
    
    return render_template('suggestions.html', suggestions=suggestions)

@app.route('/budget', methods=['GET', 'POST'])
def budget_planner():
    if not is_authenticated():
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    user_budget = get_user_data(user_id, 'budgets')
    user_expenses = get_user_data(user_id, 'expenses')
    
    # Initialize budget if it doesn't exist
    if user_id not in budgets:
        budgets[user_id] = {category: 0 for category in default_expense_categories}
    
    if request.method == 'POST':
        # Update budget limits
        for category in default_expense_categories:
            amount = request.form.get(f'budget_{category}', 0)
            budgets[user_id][category] = float(amount) if amount else 0
        
        flash('Budget updated successfully!', 'success')
        return redirect(url_for('budget_planner'))
    
    # Calculate current spending by category
    spending_by_category = {category: 0 for category in default_expense_categories}
    for expense in user_expenses:
        category = expense['category']
        if category in spending_by_category:
            spending_by_category[category] += float(expense['amount'])
    
    budget_data = []
    for category in default_expense_categories:
        budget_amount = user_budget.get(category, 0)
        spent_amount = spending_by_category.get(category, 0)
        percentage = (spent_amount / budget_amount * 100) if budget_amount > 0 else 0
        
        budget_data.append({
            'category': category,
            'budget_amount': budget_amount,
            'spent_amount': spent_amount,
            'percentage': min(percentage, 100),  # Cap at 100% for visual display
            'status': 'danger' if percentage > 100 else 'warning' if percentage > 70 else 'success'
        })
    
    return render_template('budget.html', 
                          budget_data=budget_data,
                          categories=default_expense_categories)

@app.route('/api/budget', methods=['GET'])
def get_budget():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_budget = get_user_data(user_id, 'budgets')
    return jsonify(user_budget)

@app.route('/api/budget', methods=['POST'])
def update_budget():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    user_id = session['user_id']
    
    if user_id not in budgets:
        budgets[user_id] = {}
    
    for category, amount in data.items():
        budgets[user_id][category] = float(amount)
    
    return jsonify({'success': True, 'budget': budgets[user_id]})

@app.route('/api/summary', methods=['GET'])
def get_financial_summary():
    if not is_authenticated():
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user_id']
    user_expenses = get_user_data(user_id, 'expenses')
    user_incomes = get_user_data(user_id, 'incomes')
    user_investments = get_user_data(user_id, 'investments')
    
    # Calculate totals
    total_expenses = sum(float(expense['amount']) for expense in user_expenses)
    total_income = sum(float(income['amount']) for income in user_incomes)
    total_investments = sum(float(investment['current_value']) for investment in user_investments)
    net_worth = total_income - total_expenses + total_investments
    
    # Group expenses by category
    expense_by_category = {}
    for expense in user_expenses:
        category = expense['category']
        if category not in expense_by_category:
            expense_by_category[category] = 0
        expense_by_category[category] += float(expense['amount'])
    
    # Group income by category
    income_by_category = {}
    for income in user_incomes:
        category = income['category']
        if category not in income_by_category:
            income_by_category[category] = 0
        income_by_category[category] += float(income['amount'])
    
    # Group investments by type
    investments_by_type = {}
    for investment in user_investments:
        type = investment['type']
        if type not in investments_by_type:
            investments_by_type[type] = 0
        investments_by_type[type] += float(investment['current_value'])
    
    return jsonify({
        'total_expenses': total_expenses,
        'total_income': total_income,
        'total_investments': total_investments,
        'net_worth': net_worth,
        'expense_by_category': expense_by_category,
        'income_by_category': income_by_category,
        'investments_by_type': investments_by_type
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
