# 🧪 Local Testing Guide

## Prerequisites Checklist ✅

Before testing, make sure you have:

- [x] Node.js installed (version 16+)
- [x] PowerShell execution policy set to RemoteSigned
- [x] OpenAI API key (get from https://platform.openai.com/api-keys)
- [x] Dependencies installed (`npm install` completed)

## 🚀 Step-by-Step Testing

### 1. Set up your OpenAI API Key

**Important**: You need to replace `your_openai_api_key_here` in the `.env` file with your actual OpenAI API key.

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key
4. Edit `backend/.env` file:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

### 2. Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
🚀 AI Chatbot Backend Server running on port 3000
📊 Admin dashboard available at http://localhost:3000/admin
🏥 Health check available at http://localhost:3000/health
🔧 Environment: development
```

### 3. Test the API Endpoints

Open your browser and test these URLs:

#### Health Check
- URL: http://localhost:3000/health
- Expected: JSON response with status "healthy"

#### Widget JavaScript
- URL: http://localhost:3000/widget.js
- Expected: JavaScript code for the widget

#### Configuration
- URL: http://localhost:3000/config
- Expected: JSON with widget configuration

### 4. Test the Admin Dashboard

1. Go to: http://localhost:3000/admin
2. Login with:
   - Username: `admin`
   - Password: `secure123`
3. You should see the dashboard with statistics

### 5. Test the Widget

#### Option A: Use the Example Website
1. Open `frontend/example-website.html` in your browser
2. Click the chat button in bottom-right corner
3. Type a message and press Enter
4. You should get an AI response

#### Option B: Create a Simple Test Page
Create a file `test.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Testing AI Chatbot Widget</h1>
    <p>Look for the chat button in the bottom-right corner!</p>
    
    <script src="http://localhost:3000/widget.js"></script>
</body>
</html>
```

### 6. Test Different Configurations

Create another test file with custom configuration:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Custom Widget Test</title>
</head>
<body>
    <h1>Custom Configuration Test</h1>
    
    <script 
        src="http://localhost:3000/widget.js"
        data-primary-color="#ff6b6b"
        data-position="bottom-left"
        data-title="Custom Bot"
        data-welcome-message="Hello! I'm your custom assistant.">
    </script>
</body>
</html>
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. "npm is not recognized"
**Solution**: Make sure Node.js is properly installed and restart your terminal.

#### 2. "Execution policy" error
**Solution**: Run this in PowerShell as administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. Widget not loading
**Possible causes**:
- Server not running
- CORS issues
- JavaScript errors

**Check**:
- Server is running on port 3000
- No errors in browser console (F12)
- Network tab shows widget.js loading

#### 4. "Service configuration error"
**Cause**: OpenAI API key not set
**Solution**: Update the `.env` file with your actual API key

#### 5. AI not responding
**Possible causes**:
- Invalid OpenAI API key
- Rate limits exceeded
- Network issues

**Check**:
- API key is correct and active
- You have OpenAI credits
- Server logs for error messages

## 📊 Testing Checklist

Mark each item as you test:

### Backend Tests
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Widget.js file is served
- [ ] Config endpoint returns JSON
- [ ] Admin dashboard loads
- [ ] Admin dashboard authentication works
- [ ] Rate limiting works (make many requests quickly)

### Frontend Tests
- [ ] Widget loads on webpage
- [ ] Chat button appears and is clickable
- [ ] Chat window opens/closes
- [ ] Messages can be typed and sent
- [ ] AI responds to messages
- [ ] Typing indicator appears
- [ ] Theme toggle works (if enabled)
- [ ] Widget is responsive on mobile

### Integration Tests
- [ ] Multiple sessions work independently
- [ ] Chat history persists during session
- [ ] Custom configuration attributes work
- [ ] Different positions work (bottom-left, top-right, etc.)
- [ ] Custom colors apply correctly

### Error Handling Tests
- [ ] Server handles invalid requests gracefully
- [ ] Widget shows error messages when API is down
- [ ] Rate limiting shows appropriate messages
- [ ] Invalid OpenAI responses are handled

## 📱 Mobile Testing

Test on mobile devices or use browser dev tools:

1. Open browser dev tools (F12)
2. Click device toggle (mobile view)
3. Test different screen sizes
4. Verify widget is responsive
5. Test touch interactions

## 🎯 Performance Testing

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create test file
echo "config:
  target: 'http://localhost:3000'
scenarios:
  - duration: 60
    arrivalRate: 10
    name: 'Chat load test'
    requests:
      - post:
          url: '/ask'
          json:
            message: 'Hello, this is a test message'
            sessionId: '{{ $uuid }}'
" > load-test.yml

# Run load test
artillery run load-test.yml
```

## 🔒 Security Testing

### Test Rate Limiting
1. Make multiple rapid requests to `/ask`
2. Should get 429 status after limit exceeded
3. Check admin dashboard for blocked requests

### Test Input Validation
1. Send empty messages
2. Send very long messages (>1000 chars)
3. Send malicious HTML/JavaScript
4. Verify all inputs are sanitized

## 📈 Monitoring During Tests

Keep an eye on:
- Server console for errors
- Browser console for JavaScript errors
- Network tab for failed requests
- Admin dashboard for real-time stats

## ✅ Success Criteria

Your setup is working correctly if:

1. ✅ Server starts without errors
2. ✅ Widget loads on any webpage
3. ✅ Users can send messages and get AI responses
4. ✅ Admin dashboard shows chat statistics
5. ✅ Custom configurations work
6. ✅ Mobile responsiveness works
7. ✅ Error handling is graceful

## 🎉 Next Steps

Once local testing is complete:

1. Deploy backend to a cloud service
2. Update widget.js API URL for production
3. Deploy frontend to a CDN
4. Update CORS settings for production domains
5. Set up SSL certificates
6. Configure monitoring and analytics

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review server logs for errors
3. Check browser console for JavaScript errors
4. Verify all environment variables are set
5. Ensure OpenAI API key is valid and has credits

---

Happy testing! 🚀
