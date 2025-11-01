# -*- coding: utf-8 -*-
"""
Backend API for TuZhiXing Travel Planning Platform
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime, timedelta
import uuid
import os
import re
import random
import string

# Load environment variables from .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Load .env file from the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(backend_dir, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"[Backend] Loaded environment variables from {env_path}")
    else:
        # Try loading from project root
        load_dotenv()
except ImportError:
    # python-dotenv not installed, rely on system environment variables
    pass

from models import (
    TripGenerationRequest, TripGenerationResponse,
    TripDetail, TripSummary, TripsListResponse,
    ExpenseCreateRequest, ExpenseCreateResponse,
    ExpenseVoiceParseRequest, ExpenseVoiceParseResponse,
    TripUpdateRequest, DeleteResponse,
    BudgetInfo, Expense,
    LoginRequest, RegisterRequest, SendVerifyCodeRequest,
    ForgotPasswordRequest, AuthResponse, VerifyCodeResponse,
    UserProfileResponse, UpdateUserProfileRequest, ChangePasswordRequest
)
from database import get_db
from ai_service import generate_trip_with_llm, parse_expense_from_voice

# Create FastAPI app
app = FastAPI(
    title="TuZhiXing API",
    description="Intelligent Travel Planning Platform Backend Service",
    version="1.0.0"
)

# Configure CORS
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "TuZhiXing API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

def infer_missing_fields(ai_result: dict, request_data: dict) -> dict:
    """
    Intelligently infer missing fields based on existing information
    """
    result = ai_result.copy()
    requirements_text = request_data.get("requirementsText", "").lower()
    
    # 1. Infer destination if missing
    if not result.get("destination"):
        print("[API] Inferring destination from requirements...")
        # Try to extract destination from requirements (using Unicode for safety)
        city_keywords = {
            "shanghai": "Shanghai",
            "beijing": "Beijing", 
            "chengdu": "Chengdu",
            "sanya": "Sanya",
            "tokyo": "Tokyo, Japan",
            "xian": "Xi'an",
            "xi'an": "Xi'an"
        }
        # Check English keywords first
        found = False
        for keyword, city in city_keywords.items():
            if keyword in requirements_text:
                result["destination"] = city
                found = True
                break
        
        # Check Chinese keywords (using try-except for encoding safety)
        if not found:
            try:
                req_utf8 = requirements_text.encode('utf-8').decode('utf-8')
                if "\u4e0a\u6d77" in req_utf8:  # Shanghai
                    result["destination"] = "Shanghai"
                elif "\u5317\u4eac" in req_utf8:  # Beijing
                    result["destination"] = "Beijing"
                elif "\u6210\u90fd" in req_utf8:  # Chengdu
                    result["destination"] = "Chengdu"
                elif "\u4e09\u4e9a" in req_utf8:  # Sanya
                    result["destination"] = "Sanya"
                elif "\u4e1c\u4eac" in req_utf8:  # Tokyo
                    result["destination"] = "Tokyo, Japan"
                elif "\u897f\u5b89" in req_utf8:  # Xi'an
                    result["destination"] = "Xi'an"
                else:
                    result["destination"] = "Unknown"
                    found = True
            except (UnicodeDecodeError, UnicodeEncodeError):
                result["destination"] = "Unknown"
        
        if not found and not result.get("destination"):
            result["destination"] = "Unknown"
        print(f"[API] Inferred destination: {result['destination']}")
    
    # 2. Infer departure if missing
    if not result.get("departure"):
        print("[API] Inferring departure from requirements...")
        # Try to extract departure from requirements (using Unicode for safety)
        departure_keywords = {
            "from beijing": "Beijing",
            "beijing to": "Beijing",
            "from shanghai": "Shanghai",
            "shanghai to": "Shanghai",
            "from chengdu": "Chengdu",
            "chengdu to": "Chengdu"
        }
        
        found = False
        for keyword, city in departure_keywords.items():
            if keyword in requirements_text:
                result["departure"] = city
                found = True
                break
        
        # Check Chinese keywords
        if not found:
            try:
                req_utf8 = requirements_text.encode('utf-8').decode('utf-8')
                if "\u4ece\u5317\u4eac" in req_utf8:  # from Beijing
                    result["departure"] = "Beijing"
                    found = True
                elif "\u4ece\u4e0a\u6d77" in req_utf8:  # from Shanghai
                    result["departure"] = "Shanghai"
                    found = True
                elif "\u4ece\u6210\u90fd" in req_utf8:  # from Chengdu
                    result["departure"] = "Chengdu"
                    found = True
            except (UnicodeDecodeError, UnicodeEncodeError):
                pass
        
        # If not found, leave as None (optional field)
        if result.get("departure"):
            print(f"[API] Inferred departure: {result['departure']}")
    
    # 3. Infer totalDays from itinerary length if missing
    itinerary = result.get("itinerary", [])
    if not result.get("totalDays") and itinerary:
        result["totalDays"] = len(itinerary)
        print(f"[API] Inferred totalDays from itinerary length: {result['totalDays']}")
    elif not result.get("totalDays"):
        # Try to extract days from requirements (support both Chinese and English)
        days_patterns = [
            r'(\d+)\s*\u5929',  # days in Chinese
            r'(\d+)\s*\u65e5',  # days in Chinese
            r'(\d+)\s*day[s]?',  # day/days
        ]
        found_days = False
        for pattern in days_patterns:
            days_match = re.search(pattern, requirements_text, re.IGNORECASE)
            if days_match:
                result["totalDays"] = int(days_match.group(1))
                print(f"[API] Inferred totalDays from requirements: {result['totalDays']}")
                found_days = True
                break
        if not found_days:
            result["totalDays"] = 3  # Default to 3 days
            print(f"[API] Using default totalDays: {result['totalDays']}")
    
    # 4. Infer startDate if missing or "unknown"
    start_date_str = result.get("startDate", "")
    if not start_date_str or (isinstance(start_date_str, str) and start_date_str.lower() in ["unknown", "null", "none", ""]):
        # If startDate is missing or "unknown", set to current date
        start_date = datetime.now()
        result["startDate"] = start_date.strftime("%Y-%m-%d")
        print(f"[API] startDate was missing/unknown, set to current date: {result['startDate']}")
    else:
        # Validate existing startDate
        try:
            datetime.strptime(start_date_str, "%Y-%m-%d")
            print(f"[API] Using existing startDate: {result['startDate']}")
        except (ValueError, TypeError):
            # Invalid date format, set to current date
            start_date = datetime.now()
            result["startDate"] = start_date.strftime("%Y-%m-%d")
            print(f"[API] Invalid startDate format, set to current date: {result['startDate']}")
    
    # 5. Infer endDate from startDate and totalDays
    # Always recalculate endDate based on startDate + totalDays
    if result.get("startDate") and result.get("totalDays"):
        try:
            start_date = datetime.strptime(result["startDate"], "%Y-%m-%d")
            end_date = start_date + timedelta(days=result["totalDays"] - 1)
            result["endDate"] = end_date.strftime("%Y-%m-%d")
            print(f"[API] Calculated endDate from startDate + totalDays: {result['endDate']}")
        except (ValueError, TypeError) as e:
            # Fallback: use current date + totalDays
            start_date = datetime.now()
            end_date = start_date + timedelta(days=result.get("totalDays", 3) - 1)
            result["startDate"] = start_date.strftime("%Y-%m-%d")
            result["endDate"] = end_date.strftime("%Y-%m-%d")
            print(f"[API] Error calculating dates, using current date + totalDays: start={result['startDate']}, end={result['endDate']}")
    else:
        # No startDate or totalDays, use defaults
        start_date = datetime.now()
        total_days = result.get("totalDays", 3)
        end_date = start_date + timedelta(days=total_days - 1)
        result["startDate"] = start_date.strftime("%Y-%m-%d")
        result["endDate"] = end_date.strftime("%Y-%m-%d")
        print(f"[API] Missing startDate or totalDays, using defaults: start={result['startDate']}, end={result['endDate']}")
    
    # 6. Ensure itinerary dates match startDate
    if result.get("startDate") and itinerary:
        try:
            start_date = datetime.strptime(result["startDate"], "%Y-%m-%d")
            for i, day_item in enumerate(itinerary):
                if isinstance(day_item, dict) and not day_item.get("date"):
                    day_date = start_date + timedelta(days=i)
                    day_item["date"] = day_date.strftime("%Y-%m-%d")
                    print(f"[API] Added date to day {day_item.get('day', i+1)}: {day_item['date']}")
        except (ValueError, TypeError) as e:
            print(f"[API] Warning: Could not set itinerary dates: {str(e)}")
    
    # 7. Infer numTravellers if missing
    if not result.get("numTravellers") or not isinstance(result.get("numTravellers"), int):
        print("[API] Inferring numTravellers...")
        # Try to extract from requirements text
        traveller_patterns = [
            r'(\d+)\s*[\u4e2a\u4eba]',  # people in Chinese
            r'(\d+)\s*(people|person|traveler|traveller)',  # English
            r'(\d+)\s*\u4eba',  # people in Chinese
        ]
        found_travellers = False
        for pattern in traveller_patterns:
            match = re.search(pattern, requirements_text, re.IGNORECASE)
            if match:
                num = int(match.group(1))
                if 1 <= num <= 100:  # Reasonable range
                    result["numTravellers"] = num
                    print(f"[API] Inferred numTravellers from requirements: {result['numTravellers']}")
                    found_travellers = True
                    break
        
        # Check AI result for variations
        if not found_travellers:
            for key in ["numTravellers", "num_travellers", "travellers", "people", "persons"]:
                value = result.get(key)
                if value and isinstance(value, (int, float)) and 1 <= value <= 100:
                    result["numTravellers"] = int(value)
                    print(f"[API] Found numTravellers in AI result: {result['numTravellers']}")
                    found_travellers = True
                    break
        
        # Default to 2 if not found
        if not found_travellers:
            result["numTravellers"] = 2
            print(f"[API] Using default numTravellers: {result['numTravellers']}")
    
    # 8. Infer budget from requirements if missing (already handled above, but ensure it exists)
    # Ensure budget is correctly extracted from AI result
    budget_value = result.get("budget")
    if budget_value is not None:
        # Try to convert to float if it's a string number
        if isinstance(budget_value, str):
            try:
                budget_value = float(budget_value)
            except (ValueError, TypeError):
                budget_value = None
        
        if isinstance(budget_value, (int, float)) and budget_value > 0:
            result["budget"] = float(budget_value)
            print(f"[API] Using budget from AI result: {result['budget']}")
    
    if not result.get("budget") or not isinstance(result.get("budget"), (int, float)):
        # Try to extract budget from requirements (using Unicode for safety)
        budget_patterns = [
            r'(\d+)\s*[\u4e07\u5343]?[\u5143yuan]',  # Unicode pattern
            r'(\d+)\s*wan',  # wan
            r'(\d+)\s*yuan',  # yuan
            r'(\d+)\s*rmb',  # rmb
            r'(\d+)\s*cny',  # cny
        ]
        found_budget = False
        for pattern in budget_patterns:
            budget_match = re.search(pattern, requirements_text, re.IGNORECASE)
            if budget_match:
                budget_str = budget_match.group(1)
                # wan
                try:
                    req_utf8 = requirements_text.encode('utf-8').decode('utf-8')
                    if "\u4e07" in req_utf8 or "wan" in requirements_text.lower():  # wan (10k) multiplier
                        result["budget"] = float(budget_str) * 10000
                    else:
                        result["budget"] = float(budget_str)
                    print(f"[API] Inferred budget from requirements: {result['budget']}")
                    found_budget = True
                    break
                except (UnicodeDecodeError, UnicodeEncodeError):
                    if "wan" in requirements_text.lower():
                        result["budget"] = float(budget_str) * 10000
                    else:
                        result["budget"] = float(budget_str)
                    print(f"[API] Inferred budget from requirements: {result['budget']}")
                    found_budget = True
                    break
        if not found_budget:
            # Already set default above, but ensure it's here too
            result["budget"] = 10000.0
            print(f"[API] Using default budget: {result['budget']}")
    
    return result


@app.post("/api/trips/generate", response_model=TripGenerationResponse)
async def generate_trip(request: TripGenerationRequest):
    print("\n" + "*"*60)
    print("[API] POST /api/trips/generate - Request received")
    print("*"*60)
    print(f"[API] Request data: {request.dict()}")
    
    try:
        ai_result = generate_trip_with_llm(request.dict())
        trip_id = f"trip_{uuid.uuid4().hex[:12]}"
        
        print(f"\n[API] Generated trip_id: {trip_id}")
        
        # Intelligently infer missing fields
        print("\n[API] Inferring missing fields...")
        ai_result = infer_missing_fields(ai_result, request.dict())
        
        # Extract and validate budget from AI result
        budget_total = ai_result.get("budget")
        if budget_total is None or not isinstance(budget_total, (int, float)) or budget_total <= 0:
            print("[API] Warning: Budget not found or invalid, using default 10000")
            budget_total = 10000.0
        else:
            budget_total = float(budget_total)
            print(f"[API] Using budget from AI result: {budget_total}")
        
        # Validate and set default values for budget breakdown
        budget_breakdown = ai_result.get("budgetBreakdown", [])
        if not budget_breakdown or not isinstance(budget_breakdown, list):
            print("[API] Warning: Budget breakdown not found, using default")
            budget_breakdown = [
                {"category": "Transportation", "allocated": budget_total * 0.3, "spent": 0},
                {"category": "Accommodation", "allocated": budget_total * 0.35, "spent": 0},
                {"category": "Food", "allocated": budget_total * 0.2, "spent": 0},
                {"category": "Activities", "allocated": budget_total * 0.1, "spent": 0},
                {"category": "Shopping", "allocated": budget_total * 0.05, "spent": 0}
            ]
        
        # Validate and transform itinerary
        itinerary = ai_result.get("itinerary", [])
        if not itinerary or not isinstance(itinerary, list):
            print("[API] Warning: Itinerary not found or invalid")
            itinerary = []
        else:
            # Transform itinerary to ensure correct data types
            transformed_itinerary = []
            for day_item in itinerary:
                if not isinstance(day_item, dict):
                    continue
                
                # Fix day field: extract integer from string like "Day1" or "Day2"
                day_value = day_item.get("day")
                if isinstance(day_value, str):
                    # Extract number from strings like "Day1", "Day 1", etc.
                    day_match = re.search(r'\d+', day_value)
                    if day_match:
                        day_value = int(day_match.group())
                    else:
                        print(f"[API] Warning: Could not extract day number from '{day_value}', using index")
                        day_value = len(transformed_itinerary) + 1
                elif not isinstance(day_value, int):
                    day_value = len(transformed_itinerary) + 1
                
                # Ensure activities is a list
                activities = day_item.get("activities", [])
                if not isinstance(activities, list):
                    activities = []
                
                transformed_day = {
                    "day": day_value,
                    "date": day_item.get("date", ""),
                    "title": day_item.get("title", f"Day {day_value}"),
                    "summary": day_item.get("summary"),
                    "activities": activities
                }
                transformed_itinerary.append(transformed_day)
            
            itinerary = transformed_itinerary
            print(f"[API] Transformed {len(itinerary)} itinerary days")
        
        # Validate and transform notes
        notes = ai_result.get("notes", [])
        if isinstance(notes, str):
            # If notes is a string, convert to list
            print("[API] Converting notes from string to list")
            notes = [notes] if notes else []
        elif not isinstance(notes, list):
            print("[API] Warning: Notes is not a list or string, using empty list")
            notes = []
        
        # Ensure ai_result is a dict (safety check)
        if not isinstance(ai_result, dict):
            print(f"[API] Warning: ai_result is not a dict, type: {type(ai_result)}")
            ai_result = {}
        
        # Generate trip name intelligently
        # Priority 1: Use tripName from AI result if available
        # Also extract destination and total_days for later use (must be defined before use)
        destination = ai_result.get("destination") or "Trip"
        total_days = ai_result.get("totalDays") or 0
        
        # Ensure destination is a string
        if not isinstance(destination, str):
            destination = str(destination) if destination else "Trip"
        
        # Ensure total_days is an integer
        if not isinstance(total_days, (int, float)):
            try:
                total_days = int(total_days) if total_days else 0
            except (ValueError, TypeError):
                total_days = 0
        
        trip_name = ai_result.get("tripName")
        if trip_name and isinstance(trip_name, str) and trip_name.strip():
            trip_name = trip_name.strip()
            print(f"[API] Using tripName from AI result: {trip_name}")
        else:
            # Priority 2: Generate from destination and totalDays
            if destination and destination != "Unknown":
                if total_days > 0:
                    trip_name = f"{destination} {total_days} Day Trip"
                else:
                    trip_name = f"{destination} Trip"
            else:
                trip_name = f"Travel Plan - {datetime.now().strftime('%Y-%m-%d')}"
            print(f"[API] Generated tripName: {trip_name}")
        
        # Extract numTravellers from AI result
        num_travellers = ai_result.get("numTravellers")
        if num_travellers is None or not isinstance(num_travellers, int) or num_travellers <= 0:
            num_travellers = None  # Optional field, can be None
            print("[API] numTravellers not found or invalid, leaving as None")
        else:
            print(f"[API] Using numTravellers from AI result: {num_travellers}")
        
        # Extract imageUrl from AI result (support both img_url and imageUrl)
        print(f"[API] Checking for imageUrl in AI result...")
        print(f"[API] AI result keys: {list(ai_result.keys())}")
        
        # Check for img_url first (common in AI responses)
        image_url = None
        if "img_url" in ai_result:
            image_url = ai_result.get("img_url")
            print(f"[API] Found img_url in AI result: {image_url}")
        elif "imageUrl" in ai_result:
            image_url = ai_result.get("imageUrl")
            print(f"[API] Found imageUrl in AI result: {image_url}")
        
        # Validate and clean the URL
        if image_url:
            if isinstance(image_url, str):
                image_url = image_url.strip()
                if image_url:
                    print(f"[API] Using imageUrl from AI result: {image_url}")
                else:
                    image_url = None
                    print("[API] imageUrl is empty string, setting to None")
            else:
                print(f"[API] imageUrl is not a string (type: {type(image_url)}), setting to None")
                image_url = None
        
        # Fallback: try to get from first activity image if imageUrl not found
        if not image_url:
            print("[API] No imageUrl found in AI result, trying fallback...")
            if itinerary and len(itinerary) > 0:
                first_day = itinerary[0]
                if isinstance(first_day, dict):
                    activities = first_day.get("activities", [])
                    if activities and len(activities) > 0:
                        first_activity = activities[0]
                        if isinstance(first_activity, dict) and first_activity.get("image"):
                            image_url = first_activity.get("image")
                            print(f"[API] Using imageUrl from first activity: {image_url}")
                        else:
                            print("[API] No image found in first activity")
                    else:
                        print("[API] No activities found in first day")
                else:
                    print("[API] Invalid itinerary day format")
            else:
                print("[API] No itinerary available for fallback")
        
        if not image_url:
            print("[API] Final: No imageUrl assigned, leaving as None")
        
        trip = TripDetail(
            tripId=trip_id,
            tripName=trip_name,
            departure=ai_result.get("departure"),
            destination=destination,
            startDate=ai_result.get("startDate"),
            endDate=ai_result.get("endDate"),
            totalDays=total_days if total_days > 0 else 1,
            numTravellers=num_travellers,
            status="draft",
            budget=BudgetInfo(
                total=float(budget_total),
                currency=request.currency or "CNY",
                spent=0.0,
                remaining=float(budget_total)
            ),
            budgetBreakdown=budget_breakdown,
            itinerary=itinerary,
            expenses=[],
            notes=notes,
            imageUrl=image_url,
            createdAt=datetime.now().isoformat(),
            updatedAt=datetime.now().isoformat()
        )
        
        db = get_db()
        db.create_trip(trip)
        
        # Verify trip was saved
        saved_trip = db.get_trip(trip_id)
        if saved_trip:
            print(f"[API] Trip saved to database successfully (verified)")
            print(f"[API] Database now contains {db.get_trips_count()} trip(s)")
        else:
            print(f"[API] WARNING: Trip not found after saving!")
        
        print(f"[API] Response: trip_id={trip_id}, status=success")
        print("*"*60 + "\n")
        
        return TripGenerationResponse(
            tripId=trip_id,
            status="success",
            message="Trip generated successfully"
        )
    except Exception as e:
        import traceback
        error_detail = str(e)
        error_traceback = traceback.format_exc()
        print(f"[API ERROR] Failed to generate trip: {error_detail}")
        print(f"[API ERROR] Traceback:\n{error_traceback}")
        print("*"*60 + "\n")
        raise HTTPException(status_code=500, detail=f"Failed to generate trip: {error_detail}")

@app.get("/api/trips/{trip_id}", response_model=TripDetail)
async def get_trip_detail(trip_id: str):
    print(f"\n[API] GET /api/trips/{trip_id} - Request received")
    
    db = get_db()
    trips_count = db.get_trips_count()
    print(f"[API] Database contains {trips_count} trip(s)")
    if trips_count > 0:
        trip_ids = db.get_all_trip_ids()
        print(f"[API] Available trip IDs: {trip_ids[:5]}...")  # Show first 5 for debugging
    
    trip = db.get_trip(trip_id)
    
    if not trip:
        print(f"[API] Trip not found: {trip_id}")
        raise HTTPException(status_code=404, detail=f"Trip not found: {trip_id}")
    
    # Get expenses from database
    expenses = db.get_expenses(trip_id)
    trip.expenses = expenses
    print(f"[API] Trip found: {trip.tripName}, {trip.totalDays} days")
    print(f"[API] Loaded {len(expenses)} expenses for this trip")
    if expenses:
        print(f"[API] Expense IDs: {[e.expenseId for e in expenses]}")
    print(f"[API] Returning trip details\n")
    return trip

@app.put("/api/trips/{trip_id}", response_model=TripDetail)
async def update_trip(trip_id: str, updates: TripUpdateRequest):
    db = get_db()
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    trip = db.update_trip(trip_id, update_data)
    
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip not found: {trip_id}")
    
    return trip

@app.delete("/api/trips/{trip_id}", response_model=DeleteResponse)
async def delete_trip(trip_id: str):
    db = get_db()
    success = db.delete_trip(trip_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Trip not found: {trip_id}")
    
    return DeleteResponse(success=True, message="Trip deleted successfully")

@app.post("/api/trips/{trip_id}/expenses", response_model=ExpenseCreateResponse)
async def add_expense(trip_id: str, expense_data: ExpenseCreateRequest):
    db = get_db()
    trip = db.get_trip(trip_id)
    
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip not found: {trip_id}")
    
    expense = Expense(
        expenseId=f"exp_{uuid.uuid4().hex[:12]}",
        amount=expense_data.amount,
        category=expense_data.category,
        date=expense_data.date,
        description=expense_data.description or "",
        createdAt=datetime.now().isoformat()
    )
    
    db.add_expense(trip_id, expense)
    updated_trip = db.get_trip(trip_id)
    
    return ExpenseCreateResponse(
        expenseId=expense.expenseId,
        success=True,
        updatedBudget=updated_trip.budget
    )

@app.put("/api/trips/{trip_id}/expenses/{expense_id}", response_model=ExpenseCreateResponse)
async def update_expense(
    trip_id: str, 
    expense_id: str, 
    expense_data: ExpenseCreateRequest
):
    """Update an existing expense record"""
    db = get_db()
    trip = db.get_trip(trip_id)
    
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip not found: {trip_id}")
    
    # Build update dict
    updates = {
        'amount': expense_data.amount,
        'category': expense_data.category,
        'date': expense_data.date,
        'description': expense_data.description or ""
    }
    
    # Update expense
    updated_expense = db.update_expense(trip_id, expense_id, updates)
    
    if not updated_expense:
        raise HTTPException(
            status_code=404, 
            detail=f"Expense not found: {expense_id} in trip {trip_id}"
        )
    
    # Get updated trip to return new budget
    updated_trip = db.get_trip(trip_id)
    
    return ExpenseCreateResponse(
        expenseId=updated_expense.expenseId,
        success=True,
        updatedBudget=updated_trip.budget
    )

@app.delete("/api/trips/{trip_id}/expenses/{expense_id}", response_model=DeleteResponse)
async def delete_expense(trip_id: str, expense_id: str):
    """Delete an expense record"""
    print(f"\n[API] DELETE /api/trips/{trip_id}/expenses/{expense_id} - Request received")
    db = get_db()
    trip = db.get_trip(trip_id)
    
    if not trip:
        print(f"[API] Trip not found: {trip_id}")
        raise HTTPException(status_code=404, detail=f"Trip not found: {trip_id}")
    
    # Debug: List all expenses for this trip
    all_expenses = db.get_expenses(trip_id)
    print(f"[API] Trip has {len(all_expenses)} expenses")
    print(f"[API] Looking for expense_id: {expense_id}")
    print(f"[API] Available expense IDs:")
    for exp in all_expenses:
        print(f"  - {exp.expenseId} (type: {type(exp.expenseId).__name__})")
    
    # Delete expense
    success = db.delete_expense(trip_id, expense_id)
    
    if not success:
        print(f"[API] Failed to delete expense: {expense_id}")
        raise HTTPException(
            status_code=404, 
            detail=f"Expense not found: {expense_id} in trip {trip_id}"
        )
    
    print(f"[API] Expense {expense_id} deleted successfully")
    return DeleteResponse(
        success=True, 
        message=f"Expense {expense_id} deleted successfully"
    )

@app.post("/api/expenses/parse-voice", response_model=ExpenseVoiceParseResponse)
async def parse_expense_voice(request: ExpenseVoiceParseRequest):
    """Parse expense information from voice text using AI"""
    print(f"\n[API] POST /api/expenses/parse-voice - Request received")
    print(f"[API] Voice text: {request.voiceText}")
    
    try:
        expense_data = parse_expense_from_voice(request.voiceText)
        
        return ExpenseVoiceParseResponse(
            amount=expense_data['amount'],
            category=expense_data['category'],
            date=expense_data['date'],
            description=expense_data['description']
        )
    except Exception as e:
        print(f"[API] Error parsing expense from voice: {str(e)}")
        import traceback
        print(f"[API] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to parse expense from voice: {str(e)}")

@app.get("/api/trips", response_model=TripsListResponse)
async def get_trips_list(
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    db = get_db()
    trips, total = db.get_all_trips(status=status, page=page, limit=limit)
    
    trips_summary = [
        TripSummary(
            tripId=trip.tripId,
            tripName=trip.tripName,
            departure=trip.departure,
            destination=trip.destination,
            startDate=trip.startDate,
            endDate=trip.endDate,
            totalDays=trip.totalDays,
            status=trip.status,
            budget=trip.budget,
            imageUrl=trip.imageUrl if trip.imageUrl else (
                trip.itinerary[0].activities[0].image if trip.itinerary and trip.itinerary[0].activities else None
            )
        )
        for trip in trips
    ]
    
    return TripsListResponse(trips=trips_summary, total=total, page=page, limit=limit)

@app.get("/api/health")
async def health_check():
    db = get_db()
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected",
        "total_trips": db.get_trips_count()
    }


# ============ Authentication APIs ============

@app.post("/api/auth/send-verify-code", response_model=VerifyCodeResponse)
async def send_verify_code(request: SendVerifyCodeRequest):
    """Send verification code to phone"""
    phone = request.phone.strip()
    
    # Validate phone format
    phone_regex = re.compile(r'^1[3-9]\d{9}$')
    if not phone_regex.match(phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    # Generate 6-digit code
    code = ''.join(random.choices(string.digits, k=6))
    
    # Store code (expire in 5 minutes)
    db = get_db()
    db.store_verify_code(phone, code, expire_minutes=5)
    
    # In production, send SMS here
    print(f"[DEBUG] Verification code for {phone}: {code}")
    
    return VerifyCodeResponse(
        success=True,
        message="Verification code sent successfully"
    )


@app.post("/api/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """User registration"""
    phone = request.phone.strip()
    email = request.email.strip()
    password = request.password.strip()
    verify_code = request.verifyCode.strip()
    
    # Validate inputs
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    phone_regex = re.compile(r'^1[3-9]\d{9}$')
    if not phone_regex.match(phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")
    
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_regex.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    db = get_db()
    
    # Verify code
    if not db.verify_code(phone, verify_code):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    # Create user
    try:
        user = db.create_user(phone, email, password)
        
        # Generate token (simple implementation)
        token = str(uuid.uuid4())
        
        return AuthResponse(
            success=True,
            message="Registration successful",
            token=token,
            userId=user.userId,
            username=user.phone
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """User login"""
    username = request.username.strip()
    password = request.password.strip()
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    
    db = get_db()
    
    # Find user by phone or email
    user = db.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not db.verify_password(user, password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Update last login
    db.update_last_login(user.userId)
    
    # Generate token (simple implementation)
    token = str(uuid.uuid4())
    
    return AuthResponse(
        success=True,
        message="Login successful",
        token=token,
        userId=user.userId,
        username=user.phone
    )


@app.post("/api/auth/forgot-password", response_model=VerifyCodeResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email"""
    email = request.email.strip()
    
    # Validate email
    email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    if not email_regex.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    db = get_db()
    
    # Check if user exists
    user = db.get_user_by_email(email)
    if not user:
        # Don't reveal if email exists for security
        return VerifyCodeResponse(
            success=True,
            message="If the email exists, a password reset link has been sent"
        )
    
    # In production, send password reset email here
    print(f"[DEBUG] Password reset requested for email: {email}")
    
    return VerifyCodeResponse(
        success=True,
        message="If the email exists, a password reset link has been sent"
    )


# ============ User Profile APIs ============

@app.get("/api/user/profile", response_model=UserProfileResponse)
async def get_user_profile(userId: str = Query(..., description="User ID")):
    """Get user profile"""
    print(f"\n[API] GET /api/user/profile - userId: {userId}")
    db = get_db()
    
    user = db.get_user_by_id(userId)
    if not user:
        print(f"[API] User not found: {userId}")
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"[API] User found: {user.phone}, email: {user.email}")
    return UserProfileResponse(
        userId=user.userId,
        phone=user.phone,
        email=user.email,
        nickname=user.nickname,
        gender=user.gender,
        avatar=user.avatar,
        createdAt=user.createdAt,
        lastLoginAt=user.lastLoginAt
    )


@app.put("/api/user/profile", response_model=UserProfileResponse)
async def update_user_profile(
    userId: str = Query(..., description="User ID"),
    request: UpdateUserProfileRequest = ...
):
    """Update user profile"""
    db = get_db()
    
    user = db.get_user_by_id(userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build updates dict (only include non-None values)
    updates = {}
    if request.nickname is not None:
        updates['nickname'] = request.nickname
    if request.email is not None:
        updates['email'] = request.email
    if request.gender is not None:
        updates['gender'] = request.gender
    if request.avatar is not None:
        updates['avatar'] = request.avatar
    
    try:
        updated_user = db.update_user_profile(userId, updates)
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update profile")
        
        return UserProfileResponse(
            userId=updated_user.userId,
            phone=updated_user.phone,
            email=updated_user.email,
            nickname=updated_user.nickname,
            gender=updated_user.gender,
            avatar=updated_user.avatar,
            createdAt=updated_user.createdAt,
            lastLoginAt=updated_user.lastLoginAt
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/user/change-password")
async def change_password(
    userId: str = Query(..., description="User ID"),
    request: ChangePasswordRequest = ...
):
    """Change user password"""
    # Validate new password
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    db = get_db()
    
    user = db.get_user_by_id(userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Change password
    success = db.change_password(userId, request.currentPassword, request.newPassword)
    if not success:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting TuZhiXing API Service...")
    print("API Docs: http://localhost:3000/docs")
    uvicorn.run("app:app", host="0.0.0.0", port=3000, reload=True)

