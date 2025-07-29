// Multi-currency pricing configuration
const CURRENCY_CONFIG = {
  'INR': {
    symbol: '₹',
    locale: 'en-IN',
    stripeAccount: 'acct_in', // India Stripe account
  },
  'USD': {
    symbol: '$',
    locale: 'en-US', 
    stripeAccount: 'acct_us', // US Stripe account
  },
  'EUR': {
    symbol: '€',
    locale: 'en-EU',
    stripeAccount: 'acct_eu', // EU Stripe account
  },
  'GBP': {
    symbol: '£',
    locale: 'en-GB',
    stripeAccount: 'acct_gb', // UK Stripe account
  }
};

// Base pricing in INR (will be converted to other currencies)
const BASE_PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    basePrice: 0,
    interval: 'month',
    features: {
      monthlyMessages: 100,
      websites: 1,
      customization: false,
      analytics: 'basic',
      support: 'community',
      branding: 'with_branding',
      responseTime: 'standard'
    },
    description: 'Perfect for testing and small websites',
    popular: false
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 299,
    currency: 'INR',
    interval: 'month',
    features: {
      monthlyMessages: 1000,
      websites: 2,
      customization: true,
      analytics: 'detailed',
      support: 'email',
      branding: 'removable',
      responseTime: 'fast'
    },
    description: 'Great for small businesses and startups',
    popular: true,
    stripeProductId: 'prod_starter_india', // Will be created in Stripe
    stripePriceId: 'price_starter_monthly_india'
  },
  
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 999,
    currency: 'INR',
    interval: 'month',
    features: {
      monthlyMessages: 5000,
      websites: 10,
      customization: true,
      analytics: 'advanced',
      support: 'priority_email',
      branding: 'white_label',
      responseTime: 'priority',
      webhooks: true,
      apiAccess: true
    },
    description: 'Perfect for growing businesses',
    popular: false,
    stripeProductId: 'prod_professional_india',
    stripePriceId: 'price_professional_monthly_india'
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2999,
    currency: 'INR',
    interval: 'month',
    features: {
      monthlyMessages: 25000,
      websites: 'unlimited',
      customization: true,
      analytics: 'enterprise',
      support: 'phone_priority',
      branding: 'white_label',
      responseTime: 'immediate',
      webhooks: true,
      apiAccess: true,
      customIntegrations: true,
      sla: '99.9%'
    },
    description: 'For large enterprises with high volume',
    popular: false,
    stripeProductId: 'prod_enterprise_india',
    stripePriceId: 'price_enterprise_monthly_india'
  }
};

// Generate full pricing plans from base pricing
const PRICING_PLANS = {
  free: BASE_PRICING_PLANS.free,
  starter: {
    ...BASE_PRICING_PLANS.starter,
    price: 299,
    currency: 'INR'
  },
  professional: {
    ...BASE_PRICING_PLANS.professional,
    price: 999,
    currency: 'INR'
  },
  enterprise: {
    ...BASE_PRICING_PLANS.enterprise,
    price: 2999,
    currency: 'INR'
  }
};

// Fix the existing pricing plans structure
PRICING_PLANS.starter = {
  id: 'starter',
  name: 'Starter',
  price: 299,
  currency: 'INR',
  interval: 'month',
  features: {
    monthlyMessages: 1000,
    websites: 2,
    customization: true,
    analytics: 'detailed',
    support: 'email',
    branding: 'removable',
    responseTime: 'fast'
  },
  description: 'Great for small businesses and startups',
  popular: true,
  stripeProductId: 'prod_starter_india',
  stripePriceId: 'price_starter_monthly_india'
};

PRICING_PLANS.professional = {
  id: 'professional',
  name: 'Professional',
  price: 999,
  currency: 'INR',
  interval: 'month',
  features: {
    monthlyMessages: 5000,
    websites: 10,
    customization: true,
    analytics: 'advanced',
    support: 'priority_email',
    branding: 'white_label',
    responseTime: 'priority',
    webhooks: true,
    apiAccess: true
  },
  description: 'Perfect for growing businesses',
  popular: false,
  stripeProductId: 'prod_professional_india',
  stripePriceId: 'price_professional_monthly_india'
};

PRICING_PLANS.enterprise = {
  id: 'enterprise',
  name: 'Enterprise',
  price: 2999,
  currency: 'INR',
  interval: 'month',
  features: {
    monthlyMessages: 25000,
    websites: 'unlimited',
    customization: true,
    analytics: 'enterprise',
    support: 'phone_priority',
    branding: 'white_label',
    responseTime: 'immediate',
    webhooks: true,
    apiAccess: true,
    customIntegrations: true,
    sla: '99.9%'
  },
  description: 'For large enterprises with high volume',
  popular: false,
  stripeProductId: 'prod_enterprise_india',
  stripePriceId: 'price_enterprise_monthly_india'
};

// Annual pricing (20% discount)
const ANNUAL_PRICING = {
  starter: {
    ...PRICING_PLANS.starter,
    price: 2870, // 299 * 12 * 0.8
    interval: 'year',
    stripePriceId: 'price_starter_yearly_india'
  },
  professional: {
    ...PRICING_PLANS.professional,
    price: 9590, // 999 * 12 * 0.8
    interval: 'year',
    stripePriceId: 'price_professional_yearly_india'
  },
  enterprise: {
    ...PRICING_PLANS.enterprise,
    price: 28790, // 2999 * 12 * 0.8
    interval: 'year',
    stripePriceId: 'price_enterprise_yearly_india'
  }
};

// Feature limits and descriptions
const FEATURE_DESCRIPTIONS = {
  monthlyMessages: 'Number of AI chat messages per month',
  websites: 'Number of websites you can add the widget to',
  customization: 'Customize colors, position, and messages',
  analytics: 'Conversation analytics and insights',
  support: 'Customer support level',
  branding: 'Remove or customize "Powered by" branding',
  responseTime: 'AI response speed priority',
  webhooks: 'Connect to external services',
  apiAccess: 'Direct API access for custom integrations',
  customIntegrations: 'Custom development and integrations',
  sla: 'Service Level Agreement uptime guarantee'
};

// Usage limits and overages
const USAGE_LIMITS = {
  free: {
    messagesPerMonth: 100,
    overageRate: 0, // No overages for free plan
    maxOverageMessages: 0
  },
  starter: {
    messagesPerMonth: 1000,
    overageRate: 0.50, // ₹0.50 per extra message
    maxOverageMessages: 500
  },
  professional: {
    messagesPerMonth: 5000,
    overageRate: 0.30, // ₹0.30 per extra message
    maxOverageMessages: 2000
  },
  enterprise: {
    messagesPerMonth: 25000,
    overageRate: 0.20, // ₹0.20 per extra message
    maxOverageMessages: 10000
  }
};


module.exports = {
  CURRENCY_CONFIG,
  BASE_PRICING_PLANS,
  PRICING_PLANS,
  ANNUAL_PRICING,
  FEATURE_DESCRIPTIONS,
  USAGE_LIMITS
};
