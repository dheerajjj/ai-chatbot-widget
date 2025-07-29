const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  
  // Subscription Details
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due', 'unpaid'],
      default: 'active'
    },
    stripeCustomerId: {
      type: String,
      sparse: true
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  
  // Usage Statistics
  usage: {
    messagesThisMonth: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    websites: [{
      domain: String,
      addedAt: Date,
      lastActive: Date,
      messageCount: { type: Number, default: 0 }
    }]
  },
  
  // Widget Configuration
  widgetConfig: {
    primaryColor: {
      type: String,
      default: '#667eea'
    },
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right'
    },
    title: {
      type: String,
      default: 'AI Assistant'
    },
    subtitle: {
      type: String,
      default: 'Online • Usually replies instantly'
    },
    welcomeMessage: {
      type: String,
      default: '👋 Hi there! I\'m your AI assistant. How can I help you today?'
    },
    placeholder: {
      type: String,
      default: 'Type your message...'
    },
    branding: {
      type: Boolean,
      default: true // Show "Powered by" for free users
    }
  },
  
  // API Keys
  apiKey: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Account Status
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate API key
userSchema.methods.generateApiKey = function() {
  const crypto = require('crypto');
  this.apiKey = 'cb_' + crypto.randomBytes(32).toString('hex');
  return this.apiKey;
};

// Check if user can send more messages
userSchema.methods.canSendMessage = function() {
  const { USAGE_LIMITS } = require('../config/pricing');
  const plan = this.subscription.plan;
  const limit = USAGE_LIMITS[plan];
  
  return this.usage.messagesThisMonth < limit.messagesPerMonth;
};

// Reset monthly usage (call this monthly via cron job)
userSchema.methods.resetMonthlyUsage = function() {
  this.usage.messagesThisMonth = 0;
  this.usage.lastResetDate = new Date();
  return this.save();
};

// Increment message count
userSchema.methods.incrementMessageCount = function() {
  this.usage.messagesThisMonth += 1;
  this.usage.totalMessages += 1;
  return this.save();
};

// Subscription Schema for detailed tracking
const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  stripePriceId: String,
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    required: true
  },
  interval: {
    type: String,
    enum: ['month', 'year'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'unpaid', 'incomplete'],
    required: true
  },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  canceledAt: Date,
  amount: Number, // Amount in paisa (INR cents)
  currency: {
    type: String,
    default: 'inr'
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Message Log Schema for analytics
const messageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: String,
  website: String,
  userMessage: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    required: true
  },
  responseTime: Number, // in milliseconds
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String,
  country: String,
  city: String
}, {
  timestamps: true
});

// Index for better query performance
messageLogSchema.index({ userId: 1, timestamp: -1 });
messageLogSchema.index({ website: 1, timestamp: -1 });

const User = mongoose.model('User', userSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const MessageLog = mongoose.model('MessageLog', messageLogSchema);

module.exports = {
  User,
  Subscription,
  MessageLog
};
