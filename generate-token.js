#!/usr/bin/env node

/**
 * JWT Token Generator for Smart Irrigation System
 * Usage: node generate-token.js [deviceId] [expiresIn]
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Get command line arguments
const deviceId = process.argv[2] || 'ESP32-001';
const expiresIn = process.argv[3] || '24h';

// Get JWT secret from environment or generate a temporary one
let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.log('⚠️  JWT_SECRET not found in environment, generating temporary secret...');
  jwtSecret = crypto.randomBytes(64).toString('hex');
  console.log(`🔑 Temporary JWT Secret: ${jwtSecret}`);
  console.log('💡 Add this to your .env file as JWT_SECRET for consistency\n');
}

console.log('🔐 JWT Token Generator - Smart Irrigation System');
console.log('=' .repeat(60));
console.log(`📱 Device ID: ${deviceId}`);
console.log(`⏰ Expires In: ${expiresIn}`);
console.log(`🔑 Secret Length: ${jwtSecret.length} characters`);
console.log('');

try {
  // Generate the token
  const payload = {
    deviceId: deviceId,
    type: 'device',
    generated: new Date().toISOString()
  };

  const token = jwt.sign(payload, jwtSecret, { 
    expiresIn: expiresIn,
    issuer: 'smart-irrigation-system',
    audience: 'esp32-device'
  });

  console.log('✅ Token Generated Successfully!');
  console.log('');
  console.log('📋 Token Details:');
  
  // Decode token to show payload (without verification for display)
  const decoded = jwt.decode(token, { complete: true });
  console.log(`   Algorithm: ${decoded.header.alg}`);
  console.log(`   Type: ${decoded.header.typ}`);
  console.log(`   Device ID: ${decoded.payload.deviceId}`);
  console.log(`   Issued At: ${new Date(decoded.payload.iat * 1000).toISOString()}`);
  console.log(`   Expires At: ${new Date(decoded.payload.exp * 1000).toISOString()}`);
  console.log(`   Issuer: ${decoded.payload.iss}`);
  console.log(`   Audience: ${decoded.payload.aud}`);
  
  console.log('');
  console.log('🎫 JWT Token:');
  console.log('─'.repeat(60));
  console.log(token);
  console.log('─'.repeat(60));
  
  console.log('');
  console.log('📝 Usage Examples:');
  console.log('');
  console.log('🔹 cURL Authentication Test:');
  console.log(`curl -X POST http://localhost:5000/api/devices/authenticate \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"deviceId":"${deviceId}","name":"Test Device","location":"Test Location"}'`);
  
  console.log('');
  console.log('🔹 cURL Sync Test (use token from auth response):');
  console.log(`curl -X POST http://localhost:5000/api/devices/sync \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\`);
  console.log(`  -d '{"sensorData":[{"zoneId":1,"soilMoisture":45,"temperature":22,"humidity":60,"pressure":1013}]}'`);
  
  console.log('');
  console.log('🔹 Environment Variable Export:');
  console.log(`export JWT_TOKEN="${token}"`);
  console.log(`export DEVICE_ID="${deviceId}"`);
  
  console.log('');
  console.log('💡 Tips:');
  console.log('   • Save this token for testing API endpoints');
  console.log('   • Use the ESP32 simulator for automated testing');
  console.log('   • Tokens expire - generate new ones as needed');
  console.log('   • For production, use strong JWT secrets');

} catch (error) {
  console.error('❌ Error generating token:', error.message);
  process.exit(1);
}

// Verify the token works
try {
  const verified = jwt.verify(token, jwtSecret);
  console.log('');
  console.log('✅ Token verification successful!');
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
  process.exit(1);
}