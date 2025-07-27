# 🚀 AI Chatbot Widget - Deployment Test Guide

## ✅ Deployment Status

**Backend URL:** `https://ai-chatbot-widget-production.up.railway.app`  
**Status:** Successfully deployed on Railway  
**Last Updated:** $(date)

## 🧪 Quick Tests

### 1. Test the Widget Locally
Open `test-deployed-widget.html` in your browser to test the deployed widget.

### 2. Test Integration Examples
Open `frontend/example-website.html` to see different integration examples.

### 3. Admin Dashboard
Visit: `https://ai-chatbot-widget-production.up.railway.app/admin`
- **Username:** `admin`
- **Password:** `secure123`

## 🔗 Key Endpoints

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/widget.js` | Widget script | ✅ Working |
| `/ask` | Chat API | ✅ Working |
| `/admin` | Dashboard | ✅ Working |
| `/admin/stats` | Stats API | ✅ Working |

## 📋 Integration Code

### Basic Integration
```html
<script src="https://ai-chatbot-widget-production.up.railway.app/widget.js"></script>
```

### Custom Integration
```html
<script 
  src="https://ai-chatbot-widget-production.up.railway.app/widget.js"
  data-api-url="https://ai-chatbot-widget-production.up.railway.app"
  data-primary-color="#667eea"
  data-position="bottom-right"
  data-title="AI Assistant"
  data-welcome-message="👋 Hi! How can I help you?">
</script>
```

## 🛠️ Configuration Options

- `data-api-url` - Backend API URL (required for custom deployments)
- `data-position` - Widget position: bottom-right, bottom-left, top-right, top-left
- `data-primary-color` - Primary color (hex code)
- `data-title` - Assistant name
- `data-subtitle` - Status message
- `data-welcome-message` - Initial greeting
- `data-placeholder` - Input placeholder text

## 🎯 What to Test

- [ ] Widget button appears on page
- [ ] Clicking opens/closes chat window
- [ ] Messages can be typed and sent
- [ ] AI responses are received
- [ ] Widget styling looks professional
- [ ] Mobile responsiveness works
- [ ] Admin dashboard login works
- [ ] Stats are displayed correctly

## 🔧 Troubleshooting

If the widget doesn't load:
1. Check browser console for errors
2. Verify the script URL is accessible
3. Ensure CORS is working (should be configured)
4. Check network tab for failed requests

If AI responses don't work:
1. Verify OpenAI API key is set in Railway environment
2. Check backend logs in Railway dashboard
3. Test `/ask` endpoint directly

## 📊 Monitoring

- **Railway Dashboard:** Monitor logs and metrics
- **Admin Dashboard:** View chat statistics and logs
- **Browser DevTools:** Debug client-side issues

## 🎉 Success Criteria

✅ Widget loads and appears on any website  
✅ Chat functionality works end-to-end  
✅ AI responses are received from OpenAI  
✅ Admin dashboard shows statistics  
✅ Mobile-responsive design works  
✅ CORS allows embedding on external sites  

## 🚀 Next Steps

1. **Test on External Sites:** Try embedding on different domains
2. **Load Testing:** Test with multiple concurrent users
3. **Custom Domains:** Consider adding custom domain to Railway
4. **SSL/HTTPS:** Ensure all connections are secure
5. **Analytics:** Add more detailed analytics if needed

---

**🎊 Congratulations!** Your AI Chatbot Widget is successfully deployed and ready for production use!
