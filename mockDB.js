// Mock Database for Local Testing (Before MongoDB setup)
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// In-memory storage
let users = [];
let subscriptions = [];
let messageLogs = [];
let chatSessions = [];
let currentId = 1;

// Mock User Model
class MockUser {
  constructor(userData) {
    this._id = currentId++;
    this.name = userData.name;
    this.email = userData.email;
    this.password = userData.password; // Will be hashed
    this.phone = userData.phone || '';
    this.company = userData.company || '';
    this.website = userData.website || '';
    
    this.subscription = {
      plan: 'free',
      status: 'active',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    };
    
    this.usage = {
      messagesThisMonth: 0,
      totalMessages: 0,
      lastResetDate: new Date(),
      websites: []
    };
    
    this.widgetConfig = {
      primaryColor: '#667eea',
      position: 'bottom-right',
      title: 'AI Assistant',
      subtitle: 'Online • Usually replies instantly',
      welcomeMessage: '👋 Hi there! I\'m your AI assistant. How can I help you today?',
      placeholder: 'Type your message...',
      branding: true
    };
    
    this.apiKey = null;
    this.emailVerified = false;
    this.phoneVerified = false;
    this.verificationStatus = {
      email: false,
      phone: false,
      emailVerifiedAt: null,
      phoneVerifiedAt: null
    };
    this.createdAt = new Date();
    this.lastLoginAt = new Date();
  }

  async save() {
    // Hash password if it's being set/changed
    if (this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }

    const existingIndex = users.findIndex(u => u._id === this._id);
    if (existingIndex !== -1) {
      users[existingIndex] = this;
    } else {
      users.push(this);
    }
    return this;
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  generateApiKey() {
    const crypto = require('crypto');
    this.apiKey = 'cb_' + crypto.randomBytes(32).toString('hex');
    return this.apiKey;
  }

  canSendMessage() {
    const { USAGE_LIMITS } = require('./config/pricing');
    const plan = this.subscription.plan;
    const limit = USAGE_LIMITS[plan];
    
    return this.usage.messagesThisMonth < limit.messagesPerMonth;
  }

  static async findOne(query) {
    const user = users.find(u => {
      if (query.email) return u.email === query.email;
      if (query._id) return u._id === query._id;
      if (query['subscription.stripeCustomerId']) return u.subscription.stripeCustomerId === query['subscription.stripeCustomerId'];
      return false;
    });
    return user ? Object.assign(new MockUser(user), user) : null;
  }

  static async findById(id) {
    const user = users.find(u => u._id == id);
    return user ? Object.assign(new MockUser(user), user) : null;
  }

  select(fields) {
    const userCopy = { ...this };
    if (fields === '-password') {
      delete userCopy.password;
    }
    return userCopy;
  }
}

// Mock Subscription Model
class MockSubscription {
  constructor(subData) {
    this._id = currentId++;
    this.userId = subData.userId;
    this.stripeSubscriptionId = subData.stripeSubscriptionId;
    this.stripePriceId = subData.stripePriceId;
    this.plan = subData.plan;
    this.interval = subData.interval;
    this.status = subData.status;
    this.currentPeriodStart = subData.currentPeriodStart;
    this.currentPeriodEnd = subData.currentPeriodEnd;
    this.cancelAtPeriodEnd = subData.cancelAtPeriodEnd || false;
    this.amount = subData.amount;
    this.currency = subData.currency || 'inr';
    this.createdAt = new Date();
  }

  async save() {
    subscriptions.push(this);
    return this;
  }

  static async findOneAndUpdate(query, update) {
    const index = subscriptions.findIndex(s => {
      if (query.stripeSubscriptionId) return s.stripeSubscriptionId === query.stripeSubscriptionId;
      return false;
    });
    
    if (index !== -1) {
      Object.assign(subscriptions[index], update);
      return subscriptions[index];
    }
    return null;
  }
}

// Mock MessageLog Model
class MockMessageLog {
  constructor(logData) {
    this._id = currentId++;
    this.userId = logData.userId;
    this.sessionId = logData.sessionId;
    this.website = logData.website;
    this.userMessage = logData.userMessage;
    this.aiResponse = logData.aiResponse;
    this.responseTime = logData.responseTime;
    this.timestamp = logData.timestamp || new Date();
    this.userAgent = logData.userAgent;
    this.ipAddress = logData.ipAddress;
    this.country = logData.country;
    this.city = logData.city;
  }

  async save() {
    messageLogs.push(this);
    return this;
  }

  static find(query = {}) {
    let results = messageLogs;
    
    if (query.userId) {
      results = results.filter(log => log.userId == query.userId);
    }
    
    return {
      sort: (sortObj) => {
        if (sortObj.timestamp === -1) {
          results = results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        return {
          limit: (num) => results.slice(0, num)
        };
      },
      limit: (num) => results.slice(0, num)
    };
  }
}

// Create some sample data for testing
const createSampleData = async () => {
  // Sample users
  const sampleUsers = [
    {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      company: 'Test Company',
      website: 'https://test.com'
    },
    {
      name: 'Pro User',
      email: 'pro@example.com',
      password: 'password123',
      company: 'Pro Company',
      website: 'https://pro.com'
    }
  ];

  for (const userData of sampleUsers) {
    const user = new MockUser(userData);
    user.generateApiKey();
    if (userData.email === 'pro@example.com') {
      user.subscription.plan = 'professional';
      user.subscription.stripeCustomerId = 'cus_test_123';
      user.subscription.stripeSubscriptionId = 'sub_test_123';
    }
    await user.save();
  }

  // Sample message logs
  const user = users[0];
  for (let i = 0; i < 25; i++) {
    const log = new MockMessageLog({
      userId: user._id,
      sessionId: uuidv4(),
      website: 'test.com',
      userMessage: `Test message ${i + 1}`,
      aiResponse: `AI response ${i + 1}`,
      responseTime: Math.random() * 2000 + 500,
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      country: 'India',
      city: 'Hyderabad'
    });
    await log.save();
  }

  console.log('✅ Sample data created successfully');
  console.log(`👥 Users: ${users.length}`);
  console.log(`📊 Message logs: ${messageLogs.length}`);
};

// Analytics functions
const getAnalytics = () => {
  const totalUsers = users.length;
  const freeUsers = users.filter(u => u.subscription.plan === 'free').length;
  const paidUsers = users.filter(u => u.subscription.plan !== 'free').length;
  const totalMessages = messageLogs.length;
  const totalRevenue = users.reduce((sum, user) => {
    if (user.subscription.plan !== 'free') {
      const { PRICING_PLANS } = require('./config/pricing');
      const plan = PRICING_PLANS[user.subscription.plan];
      return sum + (plan ? plan.price : 0);
    }
    return sum;
  }, 0);

  const planDistribution = users.reduce((acc, user) => {
    acc[user.subscription.plan] = (acc[user.subscription.plan] || 0) + 1;
    return acc;
  }, {});

  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMessages = messageLogs.filter(log => new Date(log.timestamp) > last30Days);

  return {
    totalUsers,
    freeUsers,
    paidUsers,
    totalMessages,
    totalRevenue,
    planDistribution,
    recentMessagesCount: recentMessages.length,
    averageMessagesPerUser: totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : 0
  };
};

// Export mock models and functions
module.exports = {
  User: MockUser,
  Subscription: MockSubscription,
  MessageLog: MockMessageLog,
  createSampleData,
  getAnalytics,
  // Direct access to data for debugging
  users: users,
  subscriptions: subscriptions,
  messageLogs: messageLogs,
  chatSessions: chatSessions,
  _users: users,
  _subscriptions: subscriptions,
  _messageLogs: messageLogs,
  _chatSessions: chatSessions
};
