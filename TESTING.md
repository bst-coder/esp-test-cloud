# 🧪 Testing Guide - Smart Irrigation System

## 🔐 JWT Token Generation

### Generate JWT Token
```bash
# Generate token for default device (ESP32-001)
npm run generate-token

# Generate token for specific device
npm run generate-token ESP32-002

# Generate token with custom expiration
npm run generate-token ESP32-001 1h
npm run generate-token ESP32-001 7d
npm run generate-token ESP32-001 30m
```

### Manual JWT Generation (if needed)
```bash
# Using Node.js directly
node generate-token.js ESP32-001 24h

# Export token to environment variable
export JWT_TOKEN=$(npm run generate-token ESP32-001 1h 2>/dev/null | grep -A1 "JWT Token:" | tail -n1 | tr -d '─' | xargs)
echo $JWT_TOKEN
```

## 🧪 Local Testing Commands

### Full Test Suite
```bash
# Run complete local test suite
npm test

# Or directly
./test-local.sh
```

### Quick API Tests
```bash
# Test API endpoints (server must be running)
npm run test:api

# Test against different server
./test-api.sh http://localhost:5000
./test-api.sh https://your-domain.com
```

### Individual Tests
```bash
# Environment validation
npm run validate-env

# Health check
npm run health

# Start ESP32 simulator
npm run simulator

# Generate JWT token
npm run generate-token ESP32-001
```

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your MongoDB credentials
nano .env

# Validate configuration
npm run validate-env
```

### 2. Local Testing
```bash
# Install dependencies
npm install
npm run install-client

# Run full test suite
npm test

# If tests pass, you're ready for deployment!
```

### 3. Manual API Testing
```bash
# Start server
npm run dev

# In another terminal, test APIs
npm run test:api

# Test with simulator
npm run simulator ESP32-001
```

## 🔧 API Testing Examples

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Device Authentication
```bash
curl -X POST http://localhost:5000/api/devices/authenticate \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ESP32-001","name":"Test Device","location":"Lab"}'
```

### Device Sync (with token)
```bash
# First get token from authentication, then:
curl -X POST http://localhost:5000/api/devices/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "sensorData": [{
      "zoneId": 1,
      "soilMoisture": 45.5,
      "temperature": 22.3,
      "humidity": 65.2,
      "pressure": 1013.2,
      "lightLevel": 450
    }],
    "irrigationStatus": {
      "1": {
        "isIrrigating": false,
        "duration": 0,
        "reason": "none"
      }
    }
  }'
```

### Get Devices
```bash
curl http://localhost:5000/api/devices
```

### Send Command
```bash
curl -X POST http://localhost:5000/api/devices/ESP32-001/command \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": 1,
    "commandType": "irrigate",
    "parameters": {
      "duration": 300,
      "force": true
    }
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **JWT Token Generation Fails**
   ```bash
   # Check if JWT_SECRET is set
   npm run validate-env
   
   # Generate with temporary secret
   JWT_SECRET=temp_secret npm run generate-token
   ```

2. **Server Won't Start**
   ```bash
   # Check environment
   npm run validate-env
   
   # Check if port is in use
   lsof -i :5000
   
   # Kill existing processes
   pkill -f "node server.js"
   ```

3. **API Tests Fail**
   ```bash
   # Check server is running
   npm run health
   
   # Check MongoDB connection
   curl http://localhost:5000/api/health
   
   # Restart server
   npm run dev
   ```

4. **ESP32 Simulator Issues**
   ```bash
   # Check server URL
   npm run simulator ESP32-001 http://localhost:5000/api
   
   # Check authentication
   npm run generate-token ESP32-001
   ```

### Log Files
- Server logs: Check console output from `npm run dev`
- Test logs: Generated during test runs
- PM2 logs: `npm run logs` (for production)

## 📊 Test Results Interpretation

### Successful Test Output
```
✅ PASS - Environment variables are properly configured
✅ PASS - Backend dependencies installed
✅ PASS - JWT token generated successfully
✅ PASS - Backend server started successfully
✅ PASS - Health check endpoint working
✅ PASS - Device authentication successful
✅ PASS - Device synchronization successful
```

### Failed Test Indicators
```
❌ FAIL - Environment validation failed
❌ FAIL - Backend server failed to start
❌ FAIL - Device authentication failed
⚠️  WARN - Simulator device not found in system
```

## 🚀 Ready for AWS Deployment

Once all local tests pass:

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "Ready for AWS deployment"
   git push origin main
   ```

2. **Deploy to AWS**
   ```bash
   npm run deploy
   ```

3. **Test production deployment**
   ```bash
   ./test-api.sh https://your-ec2-domain.com
   ```