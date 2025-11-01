# Frontend Configuration - Fix 404 Error

## Problem

Frontend is getting 404 error when calling backend API.

**Error**: `Failed to load resource: the server responded with a status of 404 (Not Found)`

## Root Cause

Frontend is trying to call API at:
- ? `http://localhost:5173/api/trips/generate` (WRONG - frontend server)

But backend is actually at:
- ? `http://localhost:3000/api/trips/generate` (CORRECT - backend server)

## Solution

### Create `.env.local` file in project root

**Location**: `app_507029916162/.env.local`

**Content**:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Steps:

1. **Create the file** (in project root, same level as `package.json`):
   ```
   app_507029916162/
   ©À©¤©¤ .env.local          ¡û CREATE THIS FILE
   ©À©¤©¤ package.json
   ©À©¤©¤ src/
   ©¸©¤©¤ ...
   ```

2. **Add this content**:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Restart frontend** (Very Important!):
   ```bash
   # Press Ctrl+C to stop current dev server
   # Then restart:
   npm run dev
   ```

4. **Test again**:
   - Go to http://localhost:5173
   - Enter travel requirements
   - Click "Generate"
   - Should work now!

---

## Verification

After restarting frontend, check browser console. You should see requests going to:
```
http://localhost:3000/api/trips/generate  ? CORRECT
```

Instead of:
```
http://localhost:5173/api/trips/generate  ? WRONG
```

---

## Quick Fix Commands

```bash
# 1. Stop frontend (Ctrl+C)

# 2. Create .env.local file
echo VITE_API_BASE_URL=http://localhost:3000/api > .env.local

# 3. Restart frontend
npm run dev
```

---

## Alternative: Use Vite Proxy (if .env doesn't work)

Edit `vite.config.ts`, add proxy:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

Then restart frontend.

---

## Checklist

Before testing:
- [ ] Backend is running on port 3000
- [ ] Frontend `.env.local` file created
- [ ] `.env.local` contains: `VITE_API_BASE_URL=http://localhost:3000/api`
- [ ] Frontend restarted after creating `.env.local`

If all checked, the 404 error should be gone!

---

## Current Status

? Backend: Running at http://localhost:3000  
? Frontend: Running at http://localhost:5173  
? Request sent: Working  
? API URL: Wrong (needs .env.local)  
? Fix: Create `.env.local` + Restart frontend  



