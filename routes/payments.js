const express = require('express');
const { User, Subscription } = require('../mockDB');
const { PRICING_PLANS, ANNUAL_PRICING } = require('../config/pricing');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Initialize Stripe only if secret key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.log('⚠️  Stripe not configured - payment features will be mocked for testing');
}

// Get pricing plans (multi-currency support)
router.get('/plans', async (req, res) => {
  try {
    const { currency = 'INR', live_rates = false } = req.query;
    const { getMultiCurrencyPricing, isSupportedCurrency, formatCurrency } = require('../utils/currency');
    
    // Validate currency
    if (!isSupportedCurrency(currency)) {
      return res.status(400).json({ 
        error: 'Unsupported currency',
        supported: Object.keys(require('../utils/currency').SUPPORTED_CURRENCIES)
      });
    }
    
    // Get multi-currency pricing
    const multiCurrencyPricing = await getMultiCurrencyPricing({
      monthly: PRICING_PLANS,
      annual: ANNUAL_PRICING
    }, live_rates === 'true');
    
    // Return pricing for requested currency
    const currencyPricing = {
      monthly: multiCurrencyPricing[currency]?.monthly || {},
      annual: multiCurrencyPricing[currency]?.annual || {},
      currency: currency,
      all_currencies: Object.keys(multiCurrencyPricing)
    };
    
    res.json(currencyPricing);
    
  } catch (error) {
    console.error('Pricing fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pricing' });
  }
});

// Create Stripe customer and setup intent for card
router.post('/create-setup-intent', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.subscription.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString(),
          company: user.company || '',
        },
      });

      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create setup intent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
    });

  } catch (error) {
    console.error('Setup intent error:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Create subscription
router.post('/create-subscription', authenticateToken, async (req, res) => {
    try {
      const { planId, interval = 'month', paymentMethodId, currency = 'INR' } = req.body;

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get plan details
      const basePlans = interval === 'year' ? ANNUAL_PRICING : PRICING_PLANS;
      const plan = basePlans[planId];

      if (!plan || planId === 'free') {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }

      const customerId = user.subscription.stripeCustomerId;
      if (!customerId) {
        return res.status(400).json({ error: 'No payment method setup' });
      }

      // Attach payment method to customer
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Determine price conversion based on currency
      const convertedPrice = plan.price * (currency === 'INR' ? 1 : 0.014);  // Example conversion rate

      // Create subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description,
            },
            unit_amount: convertedPrice * 100,
            recurring: {
              interval: interval,
            },
          },
        }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user._id.toString(),
          plan: planId,
        },
      });

    // Update user subscription
    user.subscription.plan = planId;
    user.subscription.status = subscription.status;
    user.subscription.stripeSubscriptionId = subscription.id;
    user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

    await user.save();

    // Save subscription details
    const subscriptionRecord = new Subscription({
      userId: user._id,
      stripeSubscriptionId: subscription.id,
      plan: planId,
      interval: interval,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      amount: plan.price * 100,
      currency: 'inr',
    });

    await subscriptionRecord.save();

    res.json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: planId,
        interval: interval,
        amount: plan.price,
        currency: 'INR',
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      },
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message 
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update user record
    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { cancelAtPeriodEnd: true }
    );

    res.json({
      message: 'Subscription will be cancelled at the end of current billing period',
      cancelAt: new Date(subscription.current_period_end * 1000),
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    // Update user record
    user.subscription.cancelAtPeriodEnd = false;
    await user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { cancelAtPeriodEnd: false }
    );

    res.json({
      message: 'Subscription reactivated successfully',
      subscription: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

  } catch (error) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// Get subscription details
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let subscriptionDetails = null;

    if (user.subscription.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        user.subscription.stripeSubscriptionId
      );

      subscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        plan: user.subscription.plan,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        amount: subscription.items.data[0].price.unit_amount / 100,
        currency: 'INR',
      };
    }

    res.json({
      subscription: subscriptionDetails,
      usage: user.usage,
      limits: require('../config/pricing').USAGE_LIMITS[user.subscription.plan],
    });

  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription details' });
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const userId = subscription.metadata.userId;

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.subscription.status = subscription.status;
            user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
            user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

            if (subscription.status === 'canceled') {
              user.subscription.plan = 'free';
            }

            await user.save();
          }
        }
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        const userWithFailedPayment = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (userWithFailedPayment) {
          userWithFailedPayment.subscription.status = 'past_due';
          await userWithFailedPayment.save();
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

module.exports = router;
