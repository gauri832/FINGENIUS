from app import app, db

with app.app_context():
    # Import the models so tables are created
    from models import User, Expense, Income, Goal, Investment, Budget
    db.create_all()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
