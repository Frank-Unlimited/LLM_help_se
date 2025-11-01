# -*- coding: utf-8 -*-
"""
Data Storage Layer (SQLite Database Version)
"""
from typing import Dict, List, Optional
from models import TripDetail, Expense, BudgetInfo, BudgetBreakdownItem, DailyItinerary, Activity
from datetime import datetime, timedelta
import uuid
import hashlib
import sqlite3
import json
import os
from pathlib import Path


class User:
    """User model"""
    def __init__(self, user_id: str, phone: str, email: str, password_hash: str):
        self.userId = user_id
        self.phone = phone
        self.email = email
        self.passwordHash = password_hash
        self.nickname: Optional[str] = None
        self.gender: Optional[str] = None
        self.avatar: Optional[str] = None
        self.createdAt = datetime.now().isoformat()
        self.lastLoginAt: Optional[str] = None


class SQLiteDatabase:
    """SQLite database implementation"""
    
    def __init__(self, db_path: str = "travel_planner.db"):
        """Initialize SQLite database"""
        # Get database path (store in backend directory)
        backend_dir = Path(__file__).parent
        self.db_path = backend_dir / db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize database and create tables
        self._init_database()
    
    def _get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def _init_database(self):
        """Initialize database tables"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    userId TEXT PRIMARY KEY,
                    phone TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    passwordHash TEXT NOT NULL,
                    nickname TEXT,
                    gender TEXT,
                    avatar TEXT,
                    createdAt TEXT NOT NULL,
                    lastLoginAt TEXT
                )
            """)
            
            # Create trips table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trips (
                    tripId TEXT PRIMARY KEY,
                    tripName TEXT NOT NULL,
                    departure TEXT,
                    destination TEXT NOT NULL,
                    startDate TEXT NOT NULL,
                    endDate TEXT NOT NULL,
                    totalDays INTEGER NOT NULL,
                    numTravellers INTEGER,
                    status TEXT NOT NULL DEFAULT 'draft',
                    budget_total REAL NOT NULL,
                    budget_currency TEXT NOT NULL DEFAULT 'CNY',
                    budget_spent REAL NOT NULL DEFAULT 0.0,
                    budget_remaining REAL NOT NULL DEFAULT 0.0,
                    budgetBreakdown TEXT NOT NULL,  -- JSON array
                    itinerary TEXT NOT NULL,  -- JSON array
                    notes TEXT,  -- JSON array
                    imageUrl TEXT,
                    createdAt TEXT,
                    updatedAt TEXT,
                    userId TEXT
                )
            """)
            
            # Create expenses table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS expenses (
                    expenseId TEXT PRIMARY KEY,
                    tripId TEXT NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    date TEXT NOT NULL,
                    description TEXT,
                    createdAt TEXT NOT NULL,
                    FOREIGN KEY (tripId) REFERENCES trips(tripId) ON DELETE CASCADE
                )
            """)
            
            # Create verify_codes table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS verify_codes (
                    phone TEXT PRIMARY KEY,
                    code TEXT NOT NULL,
                    expire_time TEXT NOT NULL
                )
            """)
            
            # Create indexes for better performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_expenses_tripId ON expenses(tripId)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_trips_userId ON trips(userId)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
            
            conn.commit()
        finally:
            conn.close()
    
    def create_trip(self, trip: TripDetail) -> TripDetail:
        """Create trip"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Serialize complex objects to JSON
            budget_breakdown_json = json.dumps([
                {
                    "category": item.category,
                    "allocated": item.allocated,
                    "spent": item.spent
                }
                for item in trip.budgetBreakdown
            ], ensure_ascii=False)
            
            itinerary_json = json.dumps([
                {
                    "day": day.day,
                    "date": day.date,
                    "title": day.title,
                    "summary": day.summary,
                    "activities": [
                        {
                            "id": act.id,
                            "time": act.time,
                            "title": act.title,
                            "category": act.category,
                            "location": act.location,
                            "description": act.description,
                            "image": act.image,
                            "estimatedCost": act.estimatedCost,
                            "nextLocation": act.nextLocation
                        }
                        for act in day.activities
                    ]
                }
                for day in trip.itinerary
            ], ensure_ascii=False)
            
            notes_json = json.dumps(trip.notes or [], ensure_ascii=False)
            
            cursor.execute("""
                INSERT INTO trips (
                    tripId, tripName, departure, destination, startDate, endDate,
                    totalDays, numTravellers, status,
                    budget_total, budget_currency, budget_spent, budget_remaining,
                    budgetBreakdown, itinerary, notes, imageUrl, createdAt, updatedAt, userId
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trip.tripId,
                trip.tripName,
                trip.departure,
                trip.destination,
                trip.startDate,
                trip.endDate,
                trip.totalDays,
                trip.numTravellers,
                trip.status,
                trip.budget.total,
                trip.budget.currency,
                trip.budget.spent,
                trip.budget.remaining,
                budget_breakdown_json,
                itinerary_json,
                notes_json,
                trip.imageUrl,
                trip.createdAt or datetime.now().isoformat(),
                trip.updatedAt or datetime.now().isoformat(),
                getattr(trip, 'userId', None)
            ))
            
            conn.commit()
            return trip
        finally:
            conn.close()
    
    def get_trip(self, trip_id: str, user_id: Optional[str] = None) -> Optional[TripDetail]:
        """Get trip details"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            if user_id:
                cursor.execute("SELECT * FROM trips WHERE tripId = ? AND userId = ?", (trip_id, user_id))
            else:
                cursor.execute("SELECT * FROM trips WHERE tripId = ?", (trip_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            # Parse JSON fields
            budget_breakdown_data = json.loads(row['budgetBreakdown'])
            itinerary_data = json.loads(row['itinerary'])
            notes_data = json.loads(row['notes']) if row['notes'] else []
            
            # Reconstruct TripDetail object
            trip = TripDetail(
                tripId=row['tripId'],
                tripName=row['tripName'],
                departure=row['departure'],
                destination=row['destination'],
                startDate=row['startDate'],
                endDate=row['endDate'],
                totalDays=row['totalDays'],
                numTravellers=row['numTravellers'],
                status=row['status'],
                budget=BudgetInfo(
                    total=row['budget_total'],
                    currency=row['budget_currency'],
                    spent=row['budget_spent'],
                    remaining=row['budget_remaining']
                ),
                budgetBreakdown=[
                    BudgetBreakdownItem(**item) for item in budget_breakdown_data
                ],
                itinerary=[
                    DailyItinerary(
                        day=day_data['day'],
                        date=day_data['date'],
                        title=day_data['title'],
                        summary=day_data.get('summary'),
                        activities=[
                            Activity(**act_data)
                            for act_data in day_data['activities']
                        ]
                    )
                    for day_data in itinerary_data
                ],
                expenses=self.get_expenses(trip_id),
                notes=notes_data,
                imageUrl=row['imageUrl'],
                createdAt=row['createdAt'],
                updatedAt=row['updatedAt'],
                userId=row['userId']
            )
            
            return trip
        finally:
            conn.close()
    
    def update_trip(self, trip_id: str, updates: dict, user_id: Optional[str] = None) -> Optional[TripDetail]:
        """Update trip"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # First get the existing trip
            trip = self.get_trip(trip_id, user_id)
            if not trip:
                return None
            
            # Verify user ownership if user_id is provided
            if user_id and trip.userId != user_id:
                return None
            
            # Update fields
            update_fields = []
            update_values = []
            
            # Handle simple fields
            field_mapping = {
                'tripName': 'tripName',
                'departure': 'departure',
                'destination': 'destination',
                'startDate': 'startDate',
                'endDate': 'endDate',
                'numTravellers': 'numTravellers',
                'status': 'status',
                'imageUrl': 'imageUrl'
            }
            
            for key, value in updates.items():
                if key in field_mapping and value is not None:
                    update_fields.append(f"{field_mapping[key]} = ?")
                    update_values.append(value)
            
            # Handle budget update
            if 'budget' in updates and updates['budget']:
                budget = updates['budget']
                update_fields.append("budget_total = ?")
                update_values.append(budget.get('total', trip.budget.total))
                update_fields.append("budget_currency = ?")
                update_values.append(budget.get('currency', trip.budget.currency))
            
            # Handle budgetBreakdown update
            if 'budgetBreakdown' in updates and updates['budgetBreakdown']:
                budget_breakdown_json = json.dumps([
                    {
                        "category": item.get('category'),
                        "allocated": item.get('allocated'),
                        "spent": item.get('spent', 0.0)
                    }
                    for item in updates['budgetBreakdown']
                ], ensure_ascii=False)
                update_fields.append("budgetBreakdown = ?")
                update_values.append(budget_breakdown_json)
            
            # Handle itinerary update
            if 'itinerary' in updates and updates['itinerary']:
                itinerary_json = json.dumps(updates['itinerary'], ensure_ascii=False)
                update_fields.append("itinerary = ?")
                update_values.append(itinerary_json)
            
            # Always update updatedAt
            update_fields.append("updatedAt = ?")
            update_values.append(datetime.now().isoformat())
            
            # Update the database
            if update_fields:
                update_values.append(trip_id)
                if user_id:
                    sql = f"UPDATE trips SET {', '.join(update_fields)} WHERE tripId = ? AND userId = ?"
                    update_values.append(user_id)
                else:
                    sql = f"UPDATE trips SET {', '.join(update_fields)} WHERE tripId = ?"
                cursor.execute(sql, update_values)
                conn.commit()
            
            # Return updated trip
            return self.get_trip(trip_id, user_id)
        finally:
            conn.close()
    
    def delete_trip(self, trip_id: str, user_id: Optional[str] = None) -> bool:
        """Delete trip"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Verify ownership if user_id is provided
            if user_id:
                trip = self.get_trip(trip_id, user_id)
                if not trip or trip.userId != user_id:
                    return False
            
            # Delete trip (expenses will be automatically deleted due to CASCADE)
            if user_id:
                cursor.execute("DELETE FROM trips WHERE tripId = ? AND userId = ?", (trip_id, user_id))
            else:
                cursor.execute("DELETE FROM trips WHERE tripId = ?", (trip_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            return deleted
        finally:
            conn.close()
    
    def add_expense(self, trip_id: str, expense: Expense) -> Optional[Expense]:
        """Add expense record"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if trip exists
            cursor.execute("SELECT tripId FROM trips WHERE tripId = ?", (trip_id,))
            if not cursor.fetchone():
                return None
            
            # Insert expense
            cursor.execute("""
                INSERT INTO expenses (expenseId, tripId, amount, category, date, description, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                expense.expenseId,
                trip_id,
                expense.amount,
                expense.category,
                expense.date,
                expense.description,
                expense.createdAt
            ))
            
            # Update trip budget info
            self._recalculate_trip_budget(trip_id, cursor)
            
            conn.commit()
            return expense
        finally:
            conn.close()
    
    def _recalculate_trip_budget(self, trip_id: str, cursor: sqlite3.Cursor):
        """Recalculate trip budget based on expenses"""
        # Get total spent
        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE tripId = ?", (trip_id,))
        total_spent = cursor.fetchone()[0]
        
        # Get trip budget info
        cursor.execute("SELECT budget_total, budgetBreakdown FROM trips WHERE tripId = ?", (trip_id,))
        row = cursor.fetchone()
        if not row:
            return
        
        budget_total = row['budget_total']
        budget_breakdown_data = json.loads(row['budgetBreakdown'])
        
        # Calculate category spent
        cursor.execute("""
            SELECT category, COALESCE(SUM(amount), 0) as spent
            FROM expenses WHERE tripId = ?
            GROUP BY category
        """, (trip_id,))
        
        category_spent_map = {}
        for row in cursor.fetchall():
            category_spent_map[row['category']] = row['spent']
        
        # Update breakdown spent
        for breakdown in budget_breakdown_data:
            category = breakdown['category']
            breakdown['spent'] = category_spent_map.get(category, 0.0)
        
        # Update trip
        cursor.execute("""
            UPDATE trips SET
                budget_spent = ?,
                budget_remaining = ? - ?,
                budgetBreakdown = ?
            WHERE tripId = ?
        """, (
            total_spent,
            budget_total,
            total_spent,
            json.dumps(budget_breakdown_data, ensure_ascii=False),
            trip_id
        ))
    
    def get_expenses(self, trip_id: str) -> List[Expense]:
        """Get all expenses for trip"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM expenses WHERE tripId = ? ORDER BY createdAt DESC
            """, (trip_id,))
            
            expenses = []
            for row in cursor.fetchall():
                expense = Expense(
                    expenseId=row['expenseId'],
                    amount=row['amount'],
                    category=row['category'],
                    date=row['date'],
                    description=row['description'],
                    createdAt=row['createdAt']
                )
                expenses.append(expense)
            
            return expenses
        finally:
            conn.close()
    
    def update_expense(self, trip_id: str, expense_id: str, updates: dict) -> Optional[Expense]:
        """Update expense record"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if expense exists
            cursor.execute("SELECT * FROM expenses WHERE expenseId = ? AND tripId = ?", (expense_id, trip_id))
            row = cursor.fetchone()
            if not row:
                return None
            
            # Build update query
            update_fields = []
            update_values = []
            
            if 'amount' in updates:
                update_fields.append("amount = ?")
                update_values.append(float(updates['amount']))
            if 'category' in updates:
                update_fields.append("category = ?")
                update_values.append(updates['category'])
            if 'date' in updates:
                update_fields.append("date = ?")
                update_values.append(updates['date'])
            if 'description' in updates:
                update_fields.append("description = ?")
                update_values.append(updates['description'])
            
            if update_fields:
                update_values.append(expense_id)
                update_values.append(trip_id)
                sql = f"UPDATE expenses SET {', '.join(update_fields)} WHERE expenseId = ? AND tripId = ?"
                cursor.execute(sql, update_values)
                
                # Recalculate trip budget
                self._recalculate_trip_budget(trip_id, cursor)
                
                conn.commit()
            
            # Return updated expense
            cursor.execute("SELECT * FROM expenses WHERE expenseId = ? AND tripId = ?", (expense_id, trip_id))
            row = cursor.fetchone()
            if row:
                return Expense(
                    expenseId=row['expenseId'],
                    amount=row['amount'],
                    category=row['category'],
                    date=row['date'],
                    description=row['description'],
                    createdAt=row['createdAt']
                )
            return None
        finally:
            conn.close()
    
    def delete_expense(self, trip_id: str, expense_id: str) -> bool:
        """Delete expense record"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Delete expense
            cursor.execute("DELETE FROM expenses WHERE expenseId = ? AND tripId = ?", (expense_id, trip_id))
            deleted = cursor.rowcount > 0
            
            if deleted:
                # Recalculate trip budget
                self._recalculate_trip_budget(trip_id, cursor)
                conn.commit()
            
            return deleted
        finally:
            conn.close()
    
    def get_all_trips(self, status: Optional[str] = None, 
                      page: int = 1, limit: int = 10, user_id: Optional[str] = None) -> tuple:
        """Get all trips (support filtering and pagination)"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Build query
            where_clause = "WHERE 1=1"
            params = []
            
            if user_id:
                where_clause += " AND userId = ?"
                params.append(user_id)
            
            if status:
                where_clause += " AND status = ?"
                params.append(status)
            
            # Get total count
            cursor.execute(f"SELECT COUNT(*) FROM trips {where_clause}", params)
            total = cursor.fetchone()[0]
            
            # Get paginated trips
            offset = (page - 1) * limit
            cursor.execute(f"""
                SELECT * FROM trips {where_clause}
                ORDER BY createdAt DESC
                LIMIT ? OFFSET ?
            """, params + [limit, offset])
            
            trips_list = []
            for row in cursor.fetchall():
                trip = self.get_trip(row['tripId'], user_id)
                if trip:
                    trips_list.append(trip)
            
            return trips_list, total
        finally:
            conn.close()
    
    # User authentication methods
    def hash_password(self, password: str) -> str:
        """Hash password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, phone: str, email: str, password: str) -> User:
        """Create new user"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if phone or email already exists
            cursor.execute("SELECT userId FROM users WHERE phone = ? OR email = ?", (phone, email))
            existing = cursor.fetchone()
            if existing:
                cursor.execute("SELECT phone FROM users WHERE phone = ?", (phone,))
                if cursor.fetchone():
                    raise ValueError("Phone number already registered")
                raise ValueError("Email already registered")
            
            user_id = str(uuid.uuid4())
            password_hash = self.hash_password(password)
            created_at = datetime.now().isoformat()
            
            cursor.execute("""
                INSERT INTO users (userId, phone, email, passwordHash, createdAt)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, phone, email, password_hash, created_at))
            
            conn.commit()
            
            user = User(user_id, phone, email, password_hash)
            user.createdAt = created_at
            return user
        finally:
            conn.close()
    
    def get_user_by_phone(self, phone: str) -> Optional[User]:
        """Get user by phone"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
            row = cursor.fetchone()
            if row:
                return self._row_to_user(row)
            return None
        finally:
            conn.close()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            if row:
                return self._row_to_user(row)
            return None
        finally:
            conn.close()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by phone or email"""
        user = self.get_user_by_phone(username)
        if not user:
            user = self.get_user_by_email(username)
        return user
    
    def _row_to_user(self, row) -> User:
        """Convert database row to User object"""
        user = User(
            row['userId'],
            row['phone'],
            row['email'],
            row['passwordHash']
        )
        user.nickname = row['nickname']
        user.gender = row['gender']
        user.avatar = row['avatar']
        user.createdAt = row['createdAt']
        user.lastLoginAt = row['lastLoginAt']
        return user
    
    def verify_password(self, user: User, password: str) -> bool:
        """Verify password"""
        password_hash = self.hash_password(password)
        return user.passwordHash == password_hash
    
    def update_last_login(self, user_id: str):
        """Update user last login time"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE users SET lastLoginAt = ? WHERE userId = ?
            """, (datetime.now().isoformat(), user_id))
            conn.commit()
        finally:
            conn.close()
    
    def store_verify_code(self, phone: str, code: str, expire_minutes: int = 5):
        """Store verification code"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            expire_time = datetime.now() + timedelta(minutes=expire_minutes)
            cursor.execute("""
                INSERT OR REPLACE INTO verify_codes (phone, code, expire_time)
                VALUES (?, ?, ?)
            """, (phone, code, expire_time.isoformat()))
            conn.commit()
        finally:
            conn.close()
    
    def verify_code(self, phone: str, code: str) -> bool:
        """Verify code"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT code, expire_time FROM verify_codes WHERE phone = ?", (phone,))
            row = cursor.fetchone()
            if not row:
                return False
            
            expire_time = datetime.fromisoformat(row['expire_time'])
            if datetime.now() > expire_time:
                cursor.execute("DELETE FROM verify_codes WHERE phone = ?", (phone,))
                conn.commit()
                return False
            
            if row['code'] == code:
                cursor.execute("DELETE FROM verify_codes WHERE phone = ?", (phone,))
                conn.commit()
                return True
            
            return False
        finally:
            conn.close()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by user ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM users WHERE userId = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_user(row)
            return None
        finally:
            conn.close()
    
    def update_user_profile(self, user_id: str, updates: dict) -> Optional[User]:
        """Update user profile"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if user exists
            user = self.get_user_by_id(user_id)
            if not user:
                return None
            
            update_fields = []
            update_values = []
            
            # Update fields if provided
            if 'nickname' in updates and updates['nickname'] is not None:
                update_fields.append("nickname = ?")
                update_values.append(updates['nickname'].strip())
            
            if 'email' in updates and updates['email'] is not None:
                new_email = updates['email'].strip()
                # Validate email format
                import re
                email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
                if not email_regex.match(new_email):
                    raise ValueError("Invalid email format")
                
                # Check if email is already taken by another user
                cursor.execute("SELECT userId FROM users WHERE email = ? AND userId != ?", (new_email, user_id))
                if cursor.fetchone():
                    raise ValueError("Email already registered")
                
                update_fields.append("email = ?")
                update_values.append(new_email)
            
            if 'gender' in updates and updates['gender'] is not None:
                update_fields.append("gender = ?")
                update_values.append(updates['gender'])
            
            if 'avatar' in updates and updates['avatar'] is not None:
                update_fields.append("avatar = ?")
                update_values.append(updates['avatar'])
            
            if update_fields:
                update_values.append(user_id)
                sql = f"UPDATE users SET {', '.join(update_fields)} WHERE userId = ?"
                cursor.execute(sql, update_values)
                conn.commit()
            
            return self.get_user_by_id(user_id)
        finally:
            conn.close()
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> bool:
        """Change user password"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            user = self.get_user_by_id(user_id)
            if not user:
                return False
            
            # Verify current password
            if not self.verify_password(user, current_password):
                return False
            
            # Update password
            new_password_hash = self.hash_password(new_password)
            cursor.execute("""
                UPDATE users SET passwordHash = ? WHERE userId = ?
            """, (new_password_hash, user_id))
            conn.commit()
            return True
        finally:
            conn.close()
    
    def get_trips_count(self, status: Optional[str] = None) -> int:
        """Get total number of trips"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            if status:
                cursor.execute("SELECT COUNT(*) FROM trips WHERE status = ?", (status,))
            else:
                cursor.execute("SELECT COUNT(*) FROM trips")
            return cursor.fetchone()[0]
        finally:
            conn.close()
    
    def get_all_trip_ids(self) -> List[str]:
        """Get all trip IDs (for debugging)"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT tripId FROM trips ORDER BY createdAt DESC")
            return [row['tripId'] for row in cursor.fetchall()]
        finally:
            conn.close()


# Keep InMemoryDatabase for backward compatibility if needed
InMemoryDatabase = SQLiteDatabase


# Global database instance
db = SQLiteDatabase()


def get_db() -> SQLiteDatabase:
    """Get database instance"""
    return db


