const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
// Use mock DB for local testing
const { User } = require('../mockDB');
const router = express.Router();

// Token blacklist for logout functionality (in-memory for demo)
const tokenBlacklist = new Set();

// Enhanced JWT middleware with blacklist support
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if token is blacklisted
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been invalidated' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(403).json({ error: 'Token verification failed' });
    }
    req.user = user;
    req.token = token; // Store token for potential blacklisting
    next();
  });
};

// Utility function to generate secure tokens
const generateSecureToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomBytes(16).toString('hex') // JWT ID for uniqueness
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'ai-chatbot-widget',
      audience: 'chatbot-users'
    }
  );
};

// Register (with signup alias)
router.post('/signup', [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('company').optional().trim().escape(),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { name, email, password, company, website, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      company,
      website,
      phone
    });

    // Generate API key
    user.generateApiKey();

    await user.save();

    // Generate secure JWT token
    const token = generateSecureToken({ userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      redirectTo: '/dashboard',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        website: user.website,
        subscription: user.subscription,
        apiKey: user.apiKey
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (original endpoint for backward compatibility)
router.post('/register', [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('company').optional().trim().escape(),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { name, email, password, company, website, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      company,
      website,
      phone
    });

    // Generate API key
    user.generateApiKey();

    await user.save();

    // Generate secure JWT token
    const token = generateSecureToken({ userId: user._id, email: user.email });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        website: user.website,
        subscription: user.subscription,
        apiKey: user.apiKey
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate secure JWT token
    const token = generateSecureToken({ userId: user._id, email: user.email });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      redirectTo: '/dashboard',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        website: user.website,
        subscription: user.subscription,
        usage: user.usage,
        apiKey: user.apiKey
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response using the mock DB select method
    const userWithoutPassword = user.select('-password');

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        website: user.website,
        phone: user.phone,
        subscription: user.subscription,
        usage: user.usage,
        widgetConfig: user.widgetConfig,
        apiKey: user.apiKey,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update widget configuration
router.put('/widget-config', authenticateToken, [
  body('primaryColor').optional().isHexColor(),
  body('position').optional().isIn(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  body('title').optional().isLength({ min: 1, max: 50 }).trim().escape(),
  body('subtitle').optional().isLength({ min: 1, max: 100 }).trim().escape(),
  body('welcomeMessage').optional().isLength({ min: 1, max: 200 }).trim().escape(),
  body('placeholder').optional().isLength({ min: 1, max: 50 }).trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update widget configuration
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (user.widgetConfig.hasOwnProperty(key)) {
        user.widgetConfig[key] = updates[key];
      }
    });

    await user.save();

    res.json({
      message: 'Widget configuration updated successfully',
      widgetConfig: user.widgetConfig
    });

  } catch (error) {
    console.error('Widget config update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  try {
    // Add token to blacklist
    tokenBlacklist.add(req.token);
    
    // Clean up old tokens periodically (basic cleanup)
    if (tokenBlacklist.size > 10000) {
      // Keep only last 5000 tokens to prevent memory issues
      const tokensArray = Array.from(tokenBlacklist);
      tokenBlacklist.clear();
      tokensArray.slice(-5000).forEach(token => tokenBlacklist.add(token));
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Blacklist the current token
    tokenBlacklist.add(req.token);
    
    // Generate new token
    const newToken = generateSecureToken({ userId: user._id, email: user.email });

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate API Key
router.post('/regenerate-api-key', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.generateApiKey();
    await user.save();

    res.json({
      message: 'API key regenerated successfully',
      apiKey: user.apiKey
    });

  } catch (error) {
    console.error('API key regeneration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, authenticateToken };
