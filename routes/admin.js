const express = require('express');
const { User, Subscription } = require('../mockDB');
const { getAnalytics } = require('../mockDB');
const router = express.Router();

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const { username, password } = req.headers;
  
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get admin dashboard data
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const analytics = getAnalytics();
    const users = await User.find ? await User.find().limit(10) : []; // Mock fallback
    
    const dashboardData = {
      stats: {
        totalUsers: analytics.totalUsers || 0,
        freeUsers: analytics.freeUsers || 0,
        paidUsers: analytics.paidUsers || 0,
        totalMessages: analytics.totalMessages || 0,
        totalRevenue: analytics.totalRevenue || 0,
        averageMessagesPerUser: analytics.averageMessagesPerUser || 0
      },
      planDistribution: analytics.planDistribution || {},
      recentUsers: users.slice(0, 5).map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.subscription?.plan || 'free',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }))
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const users = await User.find ? 
      await User.find().skip(skip).limit(limit).select('-password') :
      []; // Mock fallback
    
    const totalUsers = users.length;
    
    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        plan: user.subscription?.plan || 'free',
        status: user.subscription?.status || 'active',
        messagesThisMonth: user.usage?.messagesThisMonth || 0,
        totalMessages: user.usage?.totalMessages || 0,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers: totalUsers,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get subscription analytics
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const analytics = getAnalytics();
    
    res.json({
      planDistribution: analytics.planDistribution || {},
      totalRevenue: analytics.totalRevenue || 0,
      monthlyRevenue: analytics.totalRevenue || 0, // Mock for now
      subscriptionTrends: {
        new_subscriptions: 5, // Mock data
        cancelled_subscriptions: 1,
        upgraded_subscriptions: 2
      }
    });
  } catch (error) {
    console.error('Subscription analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
});

// Update user plan (for admin actions)
router.post('/users/:userId/plan', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;
    
    const user = await User.findById ? await User.findById(userId) : null;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.subscription.plan = plan;
    await user.save();
    
    res.json({ message: 'User plan updated successfully' });
  } catch (error) {
    console.error('Plan update error:', error);
    res.status(500).json({ error: 'Failed to update user plan' });
  }
});

module.exports = router;
