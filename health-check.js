#!/usr/bin/env node

/**
 * Health Check Script for Smart Irrigation System
 * Usage: node health-check.js [server-url]
 */

const axios = require('axios');
require('dotenv').config();

// Environment-based configuration
const DEFAULT_SERVER_URL = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL || 'http://localhost:5000'
  : 'http://localhost:5000';

const SERVER_URL = process.argv[2] || process.env.HEALTH_CHECK_URL || DEFAULT_SERVER_URL;
const HEALTH_ENDPOINT = `${SERVER_URL}/api/health`;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

async function checkHealth() {
  console.log('🏥 Smart Irrigation System Health Check');
  console.log('=' .repeat(50));
  console.log(`🔗 Server URL: ${SERVER_URL}`);
  console.log(`📡 Health Endpoint: ${HEALTH_ENDPOINT}`);
  console.log('');

  try {
    const startTime = Date.now();
    const response = await axios.get(HEALTH_ENDPOINT, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Smart-Irrigation-Health-Check/1.0'
      }
    });
    const responseTime = Date.now() - startTime;

    console.log('✅ Server Status: HEALTHY');
    console.log(`⚡ Response Time: ${responseTime}ms`);
    console.log(`🌐 HTTP Status: ${response.status}`);
    console.log('');
    
    if (response.data) {
      console.log('📊 Health Data:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Environment: ${response.data.environment || 'unknown'}`);
      console.log(`   Database: ${response.data.database || 'unknown'}`);
      console.log(`   Timestamp: ${response.data.timestamp || 'unknown'}`);
    }

    // Test device endpoints
    console.log('');
    console.log('🔍 Testing API Endpoints...');
    
    try {
      const devicesResponse = await axios.get(`${SERVER_URL}/api/devices`, {
        timeout: 5000
      });
      console.log(`✅ GET /api/devices - Status: ${devicesResponse.status} (${devicesResponse.data.length} devices)`);
    } catch (err) {
      console.log(`❌ GET /api/devices - Error: ${err.response?.status || err.message}`);
    }

    console.log('');
    console.log('🎉 Health check completed successfully!');
    process.exit(0);

  } catch (error) {
    console.log('❌ Server Status: UNHEALTHY');
    console.log('');
    
    if (error.response) {
      console.log(`🌐 HTTP Status: ${error.response.status}`);
      console.log(`📝 Error Message: ${error.response.statusText}`);
      if (error.response.data) {
        console.log(`📄 Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    } else if (error.request) {
      console.log('🔌 Network Error: No response received');
      console.log(`📝 Details: ${error.message}`);
    } else {
      console.log(`⚠️ Error: ${error.message}`);
    }

    console.log('');
    console.log('🔧 Troubleshooting Tips:');
    console.log('   1. Check if the server is running');
    console.log('   2. Verify the server URL is correct');
    console.log('   3. Check network connectivity');
    console.log('   4. Review server logs for errors');
    console.log('   5. Ensure MongoDB is connected');

    process.exit(1);
  }
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n🛑 Health check interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Health check terminated');
  process.exit(1);
});

// Run health check
checkHealth();