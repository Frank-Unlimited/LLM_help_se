# Complete Startup Guide

## Problem Fixed!

The 404 error has been fixed by adding proxy configuration to `vite.config.ts`.

---

## How to Start (2 terminals)

### Terminal 1: Backend

```bash
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend
.\venv\Scripts\activate
python app.py
```

**Wait for**: `INFO: Uvicorn running on http://0.0.0.0:3000`

### Terminal 2: Frontend

```bash
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162
npm run dev
```

**Wait for**: `Local: http://localhost:5173`

---

## Test the Complete Flow

1. **Open browser**: http://localhost:5173

2. **Navigate to**: "行程规划" (Trip Planning) page

3. **Enter requirements**: 
   ```
   两个大人一个小孩去上海玩5天
   ```

4. **Select preferences**: 
   - Travel type: shopping
   - Transport: high-speed-rail
   - Accommodation: economic

5. **Click**: "生成智能行程" (Generate Smart Itinerary)

6. **Result**: 
   - Should see success message
   - Automatically redirect to detail page
   - Show generated itinerary

---

## What Was Fixed?

### Problem:
Frontend was trying to call API at wrong URL:
- ? `http://localhost:5173/api/trips/generate` (frontend server)

### Solution:
Added proxy in `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  }
}
```

Now requests to `/api/*` automatically proxy to `http://localhost:3000/api/*`

---

## Verification

After starting both servers, check:

### 1. Backend Health
Visit: http://localhost:3000/api/health

Should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected",
  "total_trips": 0
}
```

### 2. Backend API Docs
Visit: http://localhost:3000/docs

Should see Swagger UI

### 3. Frontend
Visit: http://localhost:5173

Should see homepage

---

## Troubleshooting

### Backend won't start?
- Check if port 3000 is free
- Make sure you're in `backend` directory
- Make sure virtual environment is activated
- See `backend/FIXED_START.md`

### Frontend shows 404?
- Make sure backend is running first
- Restart frontend after backend is up
- Check browser console for actual request URL

### Frontend won't start?
- Run `npm install` first
- Check if port 5173 is free

---

## Quick Commands (Copy-Paste)

### Start Backend
```powershell
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162\backend ; .\venv\Scripts\activate ; python app.py
```

### Start Frontend (new terminal)
```powershell
cd D:\Users\Lenovo\Desktop\LLM_help_se\homework3\app_507029916162 ; npm run dev
```

---

## Success Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] http://localhost:3000/api/health returns healthy status
- [ ] http://localhost:5173 shows homepage
- [ ] Can generate trip successfully
- [ ] Redirects to detail page after generation

All checked? **You're ready to develop!** ?

---

## Next Steps

Now that everything is working:

1. Test generating different trips
2. Check the generated itinerary in detail page
3. Review `PROJECT_STATUS.md` for remaining tasks
4. Start implementing frontend-backend integration for other pages

---

**Everything should work now!** ?

If you still see errors, check:
1. Both servers are running
2. No firewall blocking
3. Correct directories
4. Virtual environment activated (backend)



