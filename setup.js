#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function generateSecureSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setup() {
  console.log('🤖 AI Chatbot Widget Setup');
  console.log('============================\n');

  // Check if .env already exists
  if (fs.existsSync('.env')) {
    const overwrite = await askQuestion('⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('Please provide the following configuration:\n');

  // Collect configuration
  const config = {
    OPENAI_API_KEY: await askQuestion('🔑 OpenAI API Key: '),
    MONGODB_URI: await askQuestion('🗄️  MongoDB URI: '),
    ADMIN_PASSWORD: await askQuestion('👤 Admin Password: '),
    JWT_SECRET: generateSecureSecret(),
    SESSION_SECRET: generateSecureSecret()
  };

  // Optional Stripe configuration
  const useStripe = await askQuestion('\n💳 Configure Stripe payments? (y/N): ');
  if (useStripe.toLowerCase() === 'y') {
    config.STRIPE_SECRET_KEY = await askQuestion('🔑 Stripe Secret Key: ');
    config.STRIPE_PUBLISHABLE_KEY = await askQuestion('🔑 Stripe Publishable Key: ');
    config.STRIPE_WEBHOOK_SECRET = await askQuestion('🔑 Stripe Webhook Secret: ');
  }

  // Generate .env file
  const envContent = `# AI Chatbot Widget Configuration
# Generated on ${new Date().toISOString()}

# Basic configuration
NODE_ENV=development
PORT=3000

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${config.ADMIN_PASSWORD}

# Security secrets (auto-generated)
JWT_SECRET=${config.JWT_SECRET}
JWT_EXPIRES_IN=7d
SESSION_SECRET=${config.SESSION_SECRET}
SESSION_MAX_AGE=604800000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://127.0.0.1:5500

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OpenAI Configuration
OPENAI_API_KEY=${config.OPENAI_API_KEY}
OPENAI_MODEL=gpt-4o-mini

# Database
MONGODB_URI=${config.MONGODB_URI}

# Multi-currency settings
DEFAULT_CURRENCY=INR
SUPPORTED_CURRENCIES=INR,USD,EUR,GBP,CAD,AUD
`;

  // Add Stripe config if provided
  let stripeConfig = '';
  if (config.STRIPE_SECRET_KEY) {
    stripeConfig = `
# Stripe Configuration
STRIPE_SECRET_KEY=${config.STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${config.STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${config.STRIPE_WEBHOOK_SECRET}
`;
  } else {
    stripeConfig = `
# Stripe Configuration (add your keys here)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
`;
  }

  // Write .env file
  fs.writeFileSync('.env', envContent + stripeConfig);

  console.log('\n✅ Configuration saved to .env file');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm start');
  console.log('3. Visit: http://localhost:3000/test');
  console.log('\n📖 For more information, see README.md');

  rl.close();
}

// Check if running directly
if (require.main === module) {
  setup().catch(console.error);
}

module.exports = { setup };
