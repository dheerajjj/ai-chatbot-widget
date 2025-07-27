# 🤖 AI Chatbot Widget

A complete full-stack AI chatbot widget that can be embedded into any website. Powered by OpenAI GPT-4 with a professional-looking floating interface similar to Intercom or Tidio.

## 🌟 Live Demo

**🚀 Deployed Backend:** `https://ai-chatbot-widget-production.up.railway.app`  
**📊 Admin Dashboard:** [https://ai-chatbot-widget-production.up.railway.app/admin](https://ai-chatbot-widget-production.up.railway.app/admin)  
**🔑 Admin Login:** `admin` / `secure123`

### Quick Test
Add this to any HTML page to test the live widget:
```html
<script src="https://ai-chatbot-widget-production.up.railway.app/widget.js"></script>
```

## ✨ Features

### Frontend Widget
- 🎨 **Modern Design**: Beautiful floating chatbot interface with smooth animations
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🌙 **Dark Mode**: Built-in theme toggle
- ⚙️ **Customizable**: Colors, position, messages, and more
- 🔄 **Typing Indicators**: Real-time typing animation
- 💬 **Chat History**: Maintains conversation within session

### Backend
- 🚀 **Node.js + Express**: Fast and reliable API server
- 🔐 **Secure**: Environment variables, rate limiting, input validation
- 📊 **Admin Dashboard**: Monitor usage and chat logs
- 🔗 **CORS Enabled**: Ready for cross-origin requests
- 📈 **Analytics**: Basic logging and statistics
- 🪝 **Webhook Support**: Optional integration with external services

### Security & Performance
- 🛡️ **Rate Limiting**: Prevents abuse
- 🔒 **Input Validation**: Sanitized user inputs
- 🚫 **No API Key Exposure**: Keys safely stored on backend
- ⚡ **Optimized**: Lightweight and fast loading

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- OpenAI API key
- npm or yarn

### 1. Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd ai-chatbot-widget

# Install backend dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
```

### 2. Configuration

Edit the `.env` file in the `backend` directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://127.0.0.1:5500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure123
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### 4. Test the Widget

Open `frontend/example-website.html` in your browser to see the widget in action.

## 🔧 Integration

### Basic Integration

Add this single line to any website:

```html
<!-- For local development -->
<script src="http://localhost:3000/widget.js"></script>

<!-- For production (using deployed backend) -->
<script src="https://ai-chatbot-widget-production.up.railway.app/widget.js"></script>
```

### Advanced Integration

Customize the widget with data attributes:

```html
<script 
  src="https://ai-chatbot-widget-production.up.railway.app/widget.js"
  data-primary-color="#ff6b6b"
  data-position="bottom-left"
  data-title="Custom Assistant"
  data-subtitle="Online • Here to help"
  data-welcome-message="Hello! How can I help you today?"
  data-placeholder="Ask me anything...">
</script>
```

### Configuration Options

| Attribute | Description | Default |
|-----------|-------------|---------|
| `data-api-url` | Backend API URL | `http://localhost:3000` |
| `data-position` | Widget position | `bottom-right` |
| `data-primary-color` | Primary color | `#667eea` |
| `data-title` | Assistant name | `AI Assistant` |
| `data-subtitle` | Status message | `Online • Usually replies instantly` |
| `data-welcome-message` | Initial greeting | `👋 Hi there! I'm your AI assistant...` |
| `data-placeholder` | Input placeholder | `Type your message...` |

### Position Options
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

## 📊 Admin Dashboard

Access the admin dashboard at `http://localhost:3000/admin`

**Default credentials:**
- Username: `admin`
- Password: `secure123`

### Features
- 📈 Real-time statistics
- 💬 Recent chat logs
- 📱 Session tracking
- 🖥️ Memory usage monitoring
- 🔄 Auto-refresh

## 🛠️ API Endpoints

### Chat
- **POST** `/ask` - Send message to AI
- **GET** `/config` - Get widget configuration

### Admin
- **GET** `/admin` - Admin dashboard
- **GET** `/admin/stats` - Statistics (requires auth)

### Health
- **GET** `/health` - Health check

## 🎨 Customization

### Styling
The widget uses CSS custom properties and can be styled by overriding the classes:

```css
.ai-chatbot-widget {
  /* Custom styles */
}
```

### API Integration
The widget sends the following data to the `/ask` endpoint:

```json
{
  "message": "User's message",
  "sessionId": "unique-session-id",
  "userAgent": "browser-info",
  "referrer": "website-url"
}
```

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Keep OpenAI keys secure on backend only
3. **Rate Limiting**: Configure appropriate limits
4. **CORS**: Set specific allowed origins in production
5. **Admin Access**: Change default admin credentials
6. **HTTPS**: Use SSL certificates in production

## 📱 Mobile Support

The widget is fully responsive and includes:
- Touch-friendly interface
- Mobile-optimized sizing
- Swipe gestures support
- Keyboard handling

## 🚢 Deployment

### Backend Deployment Options

1. **Fly.io** (Recommended)
2. **Railway**
3. **Render**
4. **Heroku**
5. **DigitalOcean**

### Frontend Deployment Options

1. **Vercel** (Recommended)
2. **Netlify**
3. **GitHub Pages**
4. **AWS S3**

### Environment Setup

For production deployment:

1. Set `NODE_ENV=production`
2. Update `ALLOWED_ORIGINS` with your domains
3. Use strong admin credentials
4. Enable HTTPS
5. Set up proper error monitoring

## 🔍 Troubleshooting

### Common Issues

**Widget not loading:**
- Check CORS settings
- Verify API URL is correct
- Check browser console for errors

**OpenAI API errors:**
- Verify API key is correct
- Check API usage limits
- Ensure model availability

**Rate limiting:**
- Adjust `RATE_LIMIT_MAX_REQUESTS`
- Increase `RATE_LIMIT_WINDOW_MS`

### Debugging

Enable verbose logging:
```env
NODE_ENV=development
```

## 📈 Analytics & Monitoring

### Built-in Analytics
- Total messages
- Unique sessions
- Response times
- Memory usage
- Error rates

### External Integration
Configure webhooks to send data to:
- Google Analytics
- Mixpanel
- Custom analytics platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 🎯 Roadmap

- [ ] File upload support
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Team collaboration features

---

Made with ❤️ by [Your Name]
