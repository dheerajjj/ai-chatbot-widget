const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import services and models
const DatabaseService = require('./services/DatabaseService');
const OpenAI = require('openai');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
    console.warn('Please check your .env file and ensure OPENAI_API_KEY is set');
  } else {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error.message);
  console.error('Please check your OPENAI_API_KEY in the .env file');
}

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "https://localhost:3000"]
    }
  }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'https://five-coat-production.up.railway.app',
  'file://',
  'null'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper MIME types
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// API Key validation middleware
async function validateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Check if it's the test API key from environment
    if (apiKey === process.env.TEST_API_KEY) {
      // Create a mock user for the test API key
      req.user = {
        _id: new mongoose.Types.ObjectId(), // Generate a valid ObjectId
        name: 'Test User',
        email: 'test@example.com',
        subscription: {
          plan: 'professional',
          status: 'active'
        },
        usage: {
          messagesThisMonth: 0,
          totalMessages: 0
        },
        canSendMessage: () => true // Always allow for testing
      };
      return next();
    }

    // Check regular database users
    const user = await DatabaseService.findUserByApiKey(apiKey);
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting AI Chatbot Server with MongoDB integration...');
    
    // Initialize database (MongoDB with fallback to mock)
    const mongoConnected = await DatabaseService.initialize();
    const dbStatus = DatabaseService.getConnectionStatus();
    
    console.log(`📊 Database: ${dbStatus.type} (${dbStatus.status})`);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      const status = DatabaseService.getConnectionStatus();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: status,
        openai: !!process.env.OPENAI_API_KEY
      });
    });

    // Widget customization -- Save appearance
    app.post('/api/widget/customize', validateApiKey, async (req, res) => {
      try {
        const userId = req.user._id;
        const { primaryColor, title, welcomeMessage } = req.body;
        const update = {
          'widgetConfig.primaryColor': primaryColor,
          'widgetConfig.title': title,
          'widgetConfig.welcomeMessage': welcomeMessage
        };
        await DatabaseService.updateUser(userId, update);
        res.json({ success: true, message: "Widget customization saved." });
      } catch (error) {
        res.status(500).json({ error: 'Failed to save widget customization.' });
      }
    });

    // Widget prompt -- Save system prompt
    app.post('/api/widget/prompt', validateApiKey, async (req, res) => {
      try {
        const userId = req.user._id;
        const { systemPrompt } = req.body;
        await DatabaseService.updateUser(userId, { 'widgetConfig.systemPrompt': systemPrompt });
        res.json({ success: true, message: "System prompt saved." });
      } catch (error) {
        res.status(500).json({ error: 'Failed to save prompt.' });
      }
    });
    
    // IP detection endpoint
    app.get('/ip', async (req, res) => {
      try {
        // Get external IP using a third-party service
        const https = require('https');
        const options = {
          hostname: 'api.ipify.org',
          port: 443,
          path: '/',
          method: 'GET'
        };
        
        const ipReq = https.request(options, (ipRes) => {
          let data = '';
          ipRes.on('data', (chunk) => {
            data += chunk;
          });
          ipRes.on('end', () => {
            res.json({
              serverIP: data.trim(),
              requestIP: req.ip,
              forwardedFor: req.headers['x-forwarded-for'],
              timestamp: new Date().toISOString()
            });
          });
        });
        
        ipReq.on('error', (error) => {
          res.json({
            error: 'Could not determine external IP',
            requestIP: req.ip,
            forwardedFor: req.headers['x-forwarded-for'],
            timestamp: new Date().toISOString()
          });
        });
        
        ipReq.end();
      } catch (error) {
        res.json({
          error: error.message,
          requestIP: req.ip,
          forwardedFor: req.headers['x-forwarded-for'],
          timestamp: new Date().toISOString()
        });
      }
    });


    // Widget configuration endpoint
    app.get('/config/:apiKey?', async (req, res) => {
      try {
        const apiKey = req.params.apiKey || req.query.apiKey;
        
        if (apiKey) {
          const user = await DatabaseService.findUserByApiKey(apiKey);
          if (user && user.widgetConfig) {
            return res.json(user.widgetConfig);
          }
        }
        
        // Default configuration
        res.json({
          primaryColor: '#667eea',
          position: 'bottom-right',
          title: 'AI Assistant',
          subtitle: 'Online • Usually replies instantly',
          welcomeMessage: 'Hello! How can I help you today?',
          placeholder: 'Type your message...',
          maxMessages: 10,
          branding: true
        });
      } catch (error) {
        console.error('Config error:', error);
        res.status(500).json({ error: 'Configuration error' });
      }
    });

    // Debug endpoint to test API key validation
    app.post('/debug-auth', async (req, res) => {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      console.log('Debug: Received API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'None');
      
      if (!apiKey) {
        return res.json({ error: 'No API key provided', headers: req.headers });
      }
      
      try {
        const user = await DatabaseService.findUserByApiKey(apiKey);
        console.log('Debug: User found:', !!user, user ? user.email : 'N/A');
        res.json({ 
          success: !!user, 
          user: user ? { email: user.email, plan: user.subscription?.plan } : null 
        });
      } catch (error) {
        console.error('Debug: Error finding user:', error);
        res.json({ error: error.message });
      }
    });

    // Chat endpoint
    app.post('/ask', validateApiKey, async (req, res) => {
      try {
        const { message, sessionId, website } = req.body;
        const user = req.user;

        if (!message || !sessionId) {
          return res.status(400).json({ error: 'Message and sessionId are required' });
        }

        // Check if user can send messages (rate limiting by plan)
        if (user.canSendMessage && !user.canSendMessage()) {
          return res.status(429).json({ 
            error: 'Message limit exceeded for your plan',
            plan: user.subscription.plan 
          });
        }

        // Find or create chat session
        let session = await DatabaseService.findChatSession(sessionId);
        if (!session) {
          session = await DatabaseService.createChatSession({
            sessionId,
            userId: user._id,
            website: {
              domain: website || 'unknown',
              page: req.headers.referer || '/',
              title: 'Unknown'
            },
            visitor: {
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            }
          });
        }

        // Add user message to session
        await DatabaseService.addMessageToSession(sessionId, 'user', message);

        let aiResponse;
        const startTime = Date.now();

        try {
          // Get OpenAI response
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant. Provide concise, friendly, and accurate responses.'
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 500,
            temperature: 0.7,
          });

          aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
          
          const responseTime = Date.now() - startTime;
          
          // Add AI response to session with metadata
          await DatabaseService.addMessageToSession(sessionId, 'assistant', aiResponse, {
            responseTime,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            tokens: {
              prompt: completion.usage?.prompt_tokens || 0,
              completion: completion.usage?.completion_tokens || 0,
              total: completion.usage?.total_tokens || 0
            },
            cost: (completion.usage?.total_tokens || 0) * 0.00001 // Rough cost estimation
          });

          // Log message for analytics
          await DatabaseService.logMessage({
            userId: user._id,
            sessionId,
            website: website || 'unknown',
            userMessage: message,
            aiResponse,
            responseTime,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          });

          // Update user usage if using MongoDB
          if (DatabaseService.isMongoConnected && user.incrementMessageCount) {
            await user.incrementMessageCount();
          }

        } catch (openaiError) {
          console.error('OpenAI API error:', openaiError);
          console.error('OpenAI Error Details:', {
            message: openaiError.message,
            status: openaiError.status,
            type: openaiError.type
          });
          
          // Fallback response
          aiResponse = "Sorry, I'm having trouble processing your request right now. Please try again in a moment.";
          
          await DatabaseService.addMessageToSession(sessionId, 'assistant', aiResponse, {
            responseTime: Date.now() - startTime,
            error: 'openai_api_error',
            errorDetails: openaiError.message
          });
        }

        res.json({ 
          response: aiResponse,
          sessionId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Pricing plans endpoint
    app.get('/api/payments/plans', async (req, res) => {
      try {
        const currency = req.query.currency || 'INR';
        const { getMultiCurrencyPricing, formatCurrency } = require('./utils/currency');
        const { PRICING_PLANS } = require('./config/pricing');
        
        if (currency === 'INR') {
          // Return INR pricing directly with formatting
          const formattedPlans = {};
          for (const [planId, plan] of Object.entries(PRICING_PLANS)) {
            formattedPlans[planId] = {
              ...plan,
              formattedPrice: formatCurrency(plan.price, 'INR')
            };
          }
          
          res.json({
            currency: 'INR',
            plans: formattedPlans,
            success: true
          });
        } else {
          // Convert pricing for other currencies
          const convertedPlans = await getMultiCurrencyPricing(PRICING_PLANS);
          
          res.json({
            currency: currency.toUpperCase(),
            plans: convertedPlans[currency.toUpperCase()] || convertedPlans['USD'],
            success: true
          });
        }
      } catch (error) {
        console.error('Pricing fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch pricing plans' });
      }
    });

    // Test page
    app.get('/test', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'test-simple.html'));
    });
    
    // Simple test page
    app.get('/test-simple', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'test-simple.html'));
    });
    
    // OTP Test endpoint - generates and displays OTP for testing
    app.get('/test-otp/:email?', async (req, res) => {
      try {
        const email = req.params.email || 'test@example.com';
        const OTPService = require('./services/OTPService');
        
        // Generate OTP
        const otp = await OTPService.generateAndStoreOTP(email, 'email');
        
        res.json({
          success: true,
          message: 'OTP generated successfully',
          email: email,
          otp: otp,
          note: 'This is for testing only. In production, OTP would be sent via email.'
        });
      } catch (error) {
        console.error('Test OTP error:', error);
        res.status(500).json({ error: 'Failed to generate test OTP' });
      }
    });
    
    // Test registration page with OTP
    app.get('/test-registration', (req, res) => {
      const filePath = path.join(__dirname, 'public', 'test-registration.html');
      
      // Send file with error handling
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error serving test-registration.html:', err);
          // Fallback inline HTML
          res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Test Registration - Email OTP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
        .note { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Test Registration with Email OTP</h1>
    <div class="note">You will receive an OTP via email after registration.</div>
    
    <form id="regForm">
        <div class="form-group">
            <label>Name:</label>
            <input type="text" id="name" required>
        </div>
        <div class="form-group">
            <label>Email:</label>
            <input type="email" id="email" required>
        </div>
        <div class="form-group">
            <label>Password:</label>
            <input type="password" id="password" required>
        </div>
        <div class="form-group">
            <label>Phone:</label>
            <input type="tel" id="phone" placeholder="+91XXXXXXXXXX" required>
        </div>
        <button type="submit">Register</button>
    </form>
    
    <div id="response"></div>
    
    <script>
        document.getElementById('regForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value
            };
            
            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                document.getElementById('response').innerHTML = 
                    '<div style="margin-top:20px;padding:15px;border-radius:4px;background:' + 
                    (response.ok ? '#d4edda;color:#155724' : '#f8d7da;color:#721c24') + '">' +
                    (response.ok ? 'Registration successful! Check server logs for OTP.' : 'Error: ' + result.error) +
                    '</div>';
            } catch (error) {
                document.getElementById('response').innerHTML = 
                    '<div style="margin-top:20px;padding:15px;border-radius:4px;background:#f8d7da;color:#721c24">Network error: ' + error.message + '</div>';
            }
        };
    </script>
</body>
</html>
        `);
        }
      });
    });

    // Get test API key for widget testing
    app.get('/test-api-key', (req, res) => {
      const testApiKey = process.env.TEST_API_KEY;
      if (testApiKey) {
        res.json({
          success: true,
          apiKey: testApiKey
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Test API key not configured'
        });
      }
    });

    // Initialize sample data endpoint (for testing)
    app.post('/init-sample-data', async (req, res) => {
      try {
        if (DatabaseService.isMongoConnected) {
          // For MongoDB, create sample users
          const sampleUser = await DatabaseService.createUser({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            company: 'Test Company',
            website: 'https://test.com'
          });
          
          res.json({ 
            success: true, 
            message: 'Sample data created',
            user: {
              email: sampleUser.email,
              apiKey: sampleUser.apiKey
            }
          });
        } else {
          // For mock DB, use the createSampleData function
          const mockDB = require('./mockDB');
          await mockDB.createSampleData();
          
          // Get the first user's API key
          const users = await DatabaseService.getAllUsers(1);
          const user = users[0];
          
          res.json({ 
            success: true, 
            message: 'Sample data created',
            user: {
              email: user.email,
              apiKey: user.apiKey
            }
          });
        }
      } catch (error) {
        console.error('Sample data creation error:', error);
        res.status(500).json({ error: 'Failed to create sample data' });
      }
    });

    // Admin routes
    const adminRoutes = require('./routes/admin');
    app.use('/admin', adminRoutes);
    
    // Customer authentication routes
    const { router: authRoutes } = require('./routes/auth');
    app.use('/api', authRoutes);
    
    // Customer payment routes
    const paymentRoutes = require('./routes/payments');
    app.use('/api/payments', paymentRoutes);
    
    // Serve pages
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    app.get('/signup', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'signup.html'));
    });
    
    app.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    });
    
    app.get('/dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });
    
    app.get('/pricing', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'pricing.html'));
    });
    
    app.get('/customize-widget', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'customize-widget.html'));
    });

    app.get('/configure-prompt', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'configure-prompt.html'));
    });

    app.get('/integration', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'integration.html'));
    });

    // Welcome dashboard for new users after OTP verification
    app.get('/welcome-dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'welcome-dashboard.html'));
    });
    
    // Admin login page
    app.get('/admin-login', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
    });
    
    // Admin login endpoint
    app.post('/admin/login', (req, res) => {
      const { username, password } = req.body;
      
      // Check credentials
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, token: 'admin-authenticated' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    });
    
    // Serve admin dashboard page with authentication
    app.get('/admin', (req, res, next) => {
      // Check for token in localStorage or request
      res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    });

    // Error handling middleware
    app.use((error, req, res, next) => {
      console.error('Server error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🧪 Test page: http://localhost:${PORT}/test`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 OpenAI configured: ${!!process.env.OPENAI_API_KEY}`);
      console.log(`📍 Root info: http://localhost:${PORT}/`);
      console.log('');
      
      if (!mongoConnected) {
        console.log('⚠️  Note: Using mock database. Install and start MongoDB for production use.');
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🔄 Graceful shutdown initiated...');
      await DatabaseService.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🔄 Graceful shutdown initiated...');
      await DatabaseService.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
