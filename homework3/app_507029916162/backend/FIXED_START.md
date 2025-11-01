# FIXED - Backend Start Guide

## Problem Solved!

The `SystemError: Negative size passed to PyUnicode_New` error was caused by **file encoding issues** on Windows.

## Solution: Use app.py instead of main.py

### Quick Start (3 steps):

```bash
# 1. Go to backend directory
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend

# 2. Activate virtual environment
.\venv\Scripts\activate

# 3. Start server
python app.py
```

That's it!

### Success Sign

You should see:
```
Starting TuZhiXing API Service...
API Docs: http://localhost:3000/docs
INFO:     Uvicorn running on http://0.0.0.0:3000
INFO:     Application startup complete.
```

Then visit: **http://localhost:3000/docs**

---

## Alternative Method (if above doesn't work)

```bash
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend
.\venv\Scripts\activate
uvicorn app:app --host 0.0.0.0 --port 3000 --reload
```

---

## What Changed?

- **OLD**: `main.py` (had Unicode characters in comments/strings)
- **NEW**: `app.py` (pure ASCII, no Unicode issues)

Both files have the same functionality, but `app.py` works on all Windows systems.

---

## Files You Should Use:

- ? `app.py` - Main FastAPI application (USE THIS)
- ? `models.py` - Data models
- ? `database.py` - Database layer
- ? `ai_service.py` - AI generation service

## Files You Can Ignore:

- ? `main.py` - May have encoding issues
- ? `run.py` - Not needed anymore

---

## Test the API

After starting the server:

1. Visit http://localhost:3000/docs
2. Try `POST /api/trips/generate`
3. Use this test data:

```json
{
  "requirementsText": "I want to visit Beijing for 3 days with a budget of 5000 yuan",
  "preferences": ["food"],
  "travelType": ["food"],
  "transportPreference": ["high-speed-rail"],
  "accommodationType": ["comfortable"],
  "currency": "CNY"
}
```

4. Copy the returned `tripId`
5. Try `GET /api/trips/{tripId}`

---

## Now Everything Should Work!

The backend is running successfully. You can now:

1. Test all 6 API endpoints
2. Start the frontend (http://localhost:5173)
3. Test the complete workflow

**Problem: SOLVED!** ?



