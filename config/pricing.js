// INR pricing configuration
const CURRENCY_CONFIG = {
  'INR': {
    symbol: '₹',
    locale: 'en-IN'
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

// New Pricing Plans Structure - INR Based (Focused on implemented features)
const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free Tier',
    subtitle: 'For testing and demo purposes',
    price: 0,
    currency: 'INR',
    interval: 'month',
    icon: '💡',
    features: {
      monthlyMessages: 100,
      websites: 1,
      customization: 'basic',
      analytics: false,
      dashboard: false,
      branding: 'with_watermark',
      support: 'community',
      apiAccess: false
    },
    featureList: [
      '100 messages/month',
      'Basic widget customization (colors, position)',
      'Mouna branding watermark',
      'Community support only',
      '1 website deployment'
    ],
    description: 'Perfect for testing Mouna on your website',
    popular: false,
    limitations: ['Message limit enforced', 'Watermark required', 'No dashboard access']
  },
  
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    subtitle: 'For small businesses',
    price: 499,
    currency: 'INR',
    interval: 'month',
    icon: '✅',
    features: {
      monthlyMessages: 1000,
      websites: 2,
      customization: 'standard',
      analytics: 'basic',
      dashboard: true,
      branding: 'with_watermark',
      support: 'email',
      apiAccess: true
    },
    featureList: [
      '1,000 messages/month',
      'Dashboard with chat history & analytics',
      'API key integration (OpenAI/Anthropic)',
      'Widget customization options',
      'Email support',
      '2 website deployments'
    ],
    description: 'Great for small businesses and startups',
    popular: true,
    stripeProductId: 'prod_basic_india',
    stripePriceId: 'price_basic_monthly_india'
  },
  
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    subtitle: 'For growing businesses',
    price: 1499,
    currency: 'INR',
    interval: 'month',
    icon: '🏢',
    features: {
      monthlyMessages: 5000,
      websites: 10,
      customization: 'advanced',
      analytics: 'advanced',
      dashboard: true,
      branding: 'removable',
      support: 'priority_email',
      apiAccess: true,
      prioritySupport: true
    },
    featureList: [
      '5,000 messages/month',
      'Remove Mouna branding watermark',
      'Advanced dashboard with detailed analytics',
      'Advanced widget customization',
      'Priority email support',
      '10 website deployments',
      'API access with higher rate limits'
    ],
    description: 'Perfect for growing businesses',
    popular: false,
    stripeProductId: 'prod_pro_india',
    stripePriceId: 'price_pro_monthly_india'
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    subtitle: 'For large organizations',
    price: 4999,
    currency: 'INR',
    interval: 'month',
    icon: '🧑‍💼',
    features: {
      monthlyMessages: 'unlimited',
      websites: 'unlimited',
      customization: 'full',
      analytics: 'enterprise',
      dashboard: true,
      branding: 'white_label',
      support: 'dedicated',
      apiAccess: true,
      customBackend: true
    },
    featureList: [
      'Unlimited messages per month',
      'Complete white-label solution',
      'Enterprise dashboard & analytics',
      'Full widget customization control',
      'Dedicated account manager',
      'Unlimited website deployments',
      'Custom API endpoints & integrations',
      '99.9% uptime SLA'
    ],
    description: 'For large enterprises with high volume needs',
    popular: false,
    stripeProductId: 'prod_enterprise_india',
    stripePriceId: 'price_enterprise_monthly_india',
    note: 'Custom pricing available for larger deployments'
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

// Usage limits and overages for new pricing structure
const USAGE_LIMITS = {
  free: {
    messagesPerMonth: 100,
    overageRate: 0, // No overages for free plan
    maxOverageMessages: 0,
    websites: 1,
    analytics: false,
    dashboard: false
  },
  basic: {
    messagesPerMonth: 1000,
    overageRate: 0.50, // ₹0.50 per extra message
    maxOverageMessages: 500,
    websites: 2,
    analytics: true,
    dashboard: true
  },
  pro: {
    messagesPerMonth: 5000,
    overageRate: 0.30, // ₹0.30 per extra message
    maxOverageMessages: 2000,
    websites: 10,
    analytics: true,
    dashboard: true,
    whatsappIntegration: true
  },
  enterprise: {
    messagesPerMonth: 'unlimited',
    overageRate: 0, // No overages for enterprise
    maxOverageMessages: 0,
    websites: 'unlimited',
    analytics: true,
    dashboard: true,
    customAPI: true,
    teamAccess: true
  }
};


module.exports = {
  CURRENCY_CONFIG,
  BASE_PRICING_PLANS,
  PRICING_PLANS,
  FEATURE_DESCRIPTIONS,
  USAGE_LIMITS
};
