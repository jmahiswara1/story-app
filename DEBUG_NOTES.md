# Debug Notes - API Error 405

## Issue Summary

Status 405 (Method Not Allowed) pada `GET /v1/stories?page=1&size=50&location=1`

## Root Causes

### 1. Authentication Required

- Endpoint `/stories` memerlukan `auth: true`
- API akan reject request jika tidak ada token valid di header `Authorization: Bearer {token}`
- **FIX**: User HARUS login dulu sebelum mengakses HomeView

### 2. Possible Causes for 405

- Missing/invalid Authorization token → returns 405 (disguised 401)
- Parameter `location=1` mungkin tidak supported di API
- API version mismatch

### 3. HTTPS Context (Push Notifications)

- Push notifications require HTTPS
- Localhost support push IF browser allows it
- Dev context: `http://localhost:9000` akan disable push notifications
- **Status**: This is expected behavior and correctly handled with informative error message

### 4. Tracking Prevention Warnings

- Browser blocking Leaflet CDN assets (unpkg.com)
- This is normal and doesn't break functionality
- Maps will still work but from cached version or CDN

## Solution Steps

### Step 1: Ensure User is Logged In

1. Go to `#/login`
2. Enter valid credentials (register if needed)
3. Token will be saved in localStorage
4. Then navigate to Home view

### Step 2: Monitor Network Tab

1. Open DevTools → Network tab
2. Filter by `story-api.dicoding.dev`
3. Check:
   - Request headers: `Authorization: Bearer {token}` present
   - Response status: Should be 200, not 405
   - Response body: Check error message

### Step 3: Check Console Logs

New detailed error logging added to HomeView:

```javascript
console.error("Error details:", {
  message: err.message,
  status: err.status,
  response: err.response,
});
```

This will show:

- Exact error message from API
- HTTP status code
- Response body (if available)

## Expected Behavior

### After Login (Home View)

✅ Stories load successfully
✅ Map renders with markers
✅ Push notification button shows (disabled if not HTTPS)
✅ Search/filter works

### If Still Getting 405

1. Check token validity (may have expired)
2. Logout and re-login
3. Check API documentation for parameter format
4. Use Network tab to inspect exact request/response

## Files Modified

- `src/modules/api/storyApi.js`: Better error handling with status codes
- `src/modules/views/HomeView.js`: Enhanced console logging

## Next Steps

1. Login to app
2. Open Network tab
3. Check actual API response for 405 error
4. Share response body for further debugging
