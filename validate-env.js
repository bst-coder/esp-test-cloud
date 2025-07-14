#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Usage: node validate-env.js
 */

require('dotenv').config();

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET'
];

const optionalVars = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'RATE_LIMIT_MAX',
  'HELMET_ENABLED',
  'LOG_LEVEL',
  'DB_NAME',
  'SIMULATOR_DEVICE_ID',
  'SIMULATOR_SERVER_URL',
  'SIMULATOR_SYNC_INTERVAL',
  'API_TIMEOUT',
  'API_RETRY_ATTEMPTS'
];

console.log('🔍 Smart Irrigation System - Environment Validation');
console.log('=' .repeat(60));

let hasErrors = false;

// Check required variables
console.log('\n📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  } else if (value.includes('<') && value.includes('>')) {
    console.log(`⚠️  ${varName}: Contains placeholder values`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('URI')
      ? value.substring(0, 10) + '...'
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

// Check optional variables
console.log('\n📝 Optional Environment Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD')
      ? value.substring(0, 10) + '...'
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`⚪ ${varName}: Using default`);
  }
});

// MongoDB URI specific validation
if (process.env.MONGODB_URI) {
  console.log('\n🗄️  MongoDB Configuration:');
  const uri = process.env.MONGODB_URI;
  
  if (uri.includes('mongodb+srv://')) {
    console.log('✅ Using MongoDB Atlas (cloud)');
  } else if (uri.includes('mongodb://')) {
    console.log('✅ Using MongoDB (local/self-hosted)');
  } else {
    console.log('❌ Invalid MongoDB URI format');
    hasErrors = true;
  }
  
  if (uri.includes('<db_password>')) {
    console.log('❌ Please replace <db_password> with your actual password');
    hasErrors = true;
  }
  
  if (uri.includes('bst-coder')) {
    console.log('✅ Using bst-coder username');
  }
  
  if (uri.includes('cluster0.3tcrszs.mongodb.net')) {
    console.log('✅ Using correct cluster endpoint');
  }
}

// JWT Secret validation
if (process.env.JWT_SECRET) {
  console.log('\n🔐 JWT Configuration:');
  const secret = process.env.JWT_SECRET;
  
  if (secret === 'your_super_secret_jwt_key_here_change_this_in_production') {
    console.log('⚠️  Using default JWT secret - CHANGE THIS IN PRODUCTION!');
    if (process.env.NODE_ENV === 'production') {
      hasErrors = true;
    }
  } else if (secret.length < 32) {
    console.log('⚠️  JWT secret is too short (recommended: 32+ characters)');
  } else {
    console.log('✅ JWT secret is properly configured');
  }
}

// Environment-specific checks
console.log('\n🌍 Environment Configuration:');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`📍 NODE_ENV: ${nodeEnv}`);

if (nodeEnv === 'production') {
  console.log('🔒 Production environment detected');
  
  // Additional production checks
  if (!process.env.FRONTEND_URL) {
    console.log('⚠️  FRONTEND_URL not set for production');
  }
  
  if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_here_change_this_in_production') {
    console.log('❌ Default JWT secret detected in production!');
    hasErrors = true;
  }
} else {
  console.log('🔧 Development environment detected');
}

// Summary
console.log('\n' + '=' .repeat(60));
if (hasErrors) {
  console.log('❌ Environment validation FAILED');
  console.log('');
  console.log('🔧 To fix these issues:');
  console.log('1. Copy .env.example to .env if you haven\'t already');
  console.log('2. Replace all placeholder values (especially <db_password>)');
  console.log('3. Generate a strong JWT secret for production');
  console.log('4. Ensure all required variables are set');
  console.log('');
  process.exit(1);
} else {
  console.log('✅ Environment validation PASSED');
  console.log('🚀 Your environment is properly configured!');
  console.log('');
  process.exit(0);
}