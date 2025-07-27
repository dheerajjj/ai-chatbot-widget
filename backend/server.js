const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// In-memory storage for basic logging and stats
let chatLogs = [];
let stats = {
  totalMessages: 0,
  totalSessions: 0,
  startTime: new Date()
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({ 
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    },
  },
}));
app.use(morgan('combined'));

// Serve static files (widget.js and admin.js)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname))); // Serve admin.js from backend

// Rate limiter
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
});

// Validation middleware
const validateMessage = [
  body('message').isLength({ min: 1, max: 1000 }).trim().escape(),
  body('sessionId').optional().isUUID(),
  body('userAgent').optional().isString(),
  body('referrer').optional().isURL()
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Admin dashboard HTML page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Stats endpoint for admin dashboard
app.get('/admin/stats', (req, res) => {
  const auth = req.headers.authorization;
  const expectedAuth = `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}`).toString('base64')}`;
  
  if (!auth || auth !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    ...stats,
    recentLogs: chatLogs.slice(-50), // Last 50 messages
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Main chat endpoint
app.post('/ask', validateMessage, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input', details: errors.array() });
  }

  const { message, sessionId = uuidv4(), userAgent, referrer } = req.body;
  const ipAddr = req.ip || req.connection.remoteAddress;
  const timestamp = new Date();

  // Rate limiting
  try {
    await rateLimiter.consume(ipAddr);
  } catch (err) {
    return res.status(429).json({ 
      error: 'Too many requests, please try again later.',
      retryAfter: Math.round(err.msBeforeNext / 1000)
    });
  }

  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return res.status(500).json({ error: 'Service configuration error' });
  }

  try {
    // Call OpenAI Chat Completion API
    const openAIResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful customer support assistant. Be concise, friendly, and professional. If you cannot help with something, politely direct them to human support.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.6
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });

    const aiResponse = openAIResponse.data.choices[0].message.content;

    // Log the conversation (basic in-memory logging)
    const logEntry = {
      id: uuidv4(),
      sessionId,
      timestamp,
      userMessage: message,
      aiResponse,
      ipAddr: ipAddr.replace(/^.*:/, ''), // Remove IPv6 prefix if present
      userAgent,
      referrer,
      responseTime: Date.now() - timestamp.getTime()
    };

    chatLogs.push(logEntry);
    
    // Keep only last 1000 logs in memory
    if (chatLogs.length > 1000) {
      chatLogs = chatLogs.slice(-1000);
    }

    // Update stats
    stats.totalMessages++;
    if (!chatLogs.some(log => log.sessionId === sessionId && log.id !== logEntry.id)) {
      stats.totalSessions++;
    }

    // Send webhook if configured (for client tracking)
    if (process.env.WEBHOOK_URL) {
      try {
        await axios.post(process.env.WEBHOOK_URL, {
          event: 'chat_message',
          sessionId,
          timestamp,
          referrer,
          userAgent
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': process.env.WEBHOOK_SECRET
          },
          timeout: 5000
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError.message);
        // Don't fail the main request if webhook fails
      }
    }

    res.json({ 
      response: aiResponse,
      sessionId,
      timestamp: timestamp.toISOString()
    });

  } catch (error) {
    console.error('Error processing chat request:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    let errorMessage = 'Sorry, I\'m having trouble processing your request right now.';
    let statusCode = 500;

    if (error.response?.status === 401) {
      errorMessage = 'Authentication error with AI service.';
      statusCode = 503;
    } else if (error.response?.status === 429) {
      errorMessage = 'AI service is currently busy. Please try again in a moment.';
      statusCode = 503;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout. Please try again.';
      statusCode = 504;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }
});

// Widget configuration endpoint
app.get('/config', (req, res) => {
  res.json({
    features: {
      darkMode: true,
      customization: true,
      fileUpload: false,
      voiceInput: false
    },
    limits: {
      messageLength: 1000,
      rateLimitInfo: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
      }
    },
    branding: {
      name: 'AI Assistant',
      tagline: 'How can I help you today?'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Gracefully shutting down...');
  
  // Save logs to file before shutdown (optional)
  if (chatLogs.length > 0) {
    const logFile = path.join(__dirname, 'chat-logs.json');
    fs.writeFileSync(logFile, JSON.stringify({ logs: chatLogs, stats }, null, 2));
    console.log(`Saved ${chatLogs.length} chat logs to ${logFile}`);
  }
  
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 AI Chatbot Backend Server running on port ${port}`);
  console.log(`📊 Admin dashboard available at http://localhost:${port}/admin/stats`);
  console.log(`🏥 Health check available at http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

