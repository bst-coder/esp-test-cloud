#!/bin/bash

# Smart Irrigation System - Local Testing Script
# This script runs comprehensive tests before AWS deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL="http://localhost:5000"
API_URL="$SERVER_URL/api"
DEVICE_ID="ESP32-TEST-001"
TEST_TIMEOUT=30

echo -e "${BLUE}🧪 Smart Irrigation System - Local Testing Suite${NC}"
echo "=================================================================="
echo -e "📅 Test Date: $(date)"
echo -e "🌐 Server URL: $SERVER_URL"
echo -e "📱 Test Device ID: $DEVICE_ID"
echo ""

# Function to print test status
print_test() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC} - $message"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $message"
    else
        echo -e "${BLUE}ℹ️  INFO${NC} - $message"
    fi
}

# Function to wait for server
wait_for_server() {
    local url=$1
    local timeout=$2
    local count=0
    
    echo -e "${BLUE}⏳ Waiting for server to start...${NC}"
    
    while [ $count -lt $timeout ]; do
        if curl -s "$url/api/health" > /dev/null 2>&1; then
            print_test "PASS" "Server is responding"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    
    print_test "FAIL" "Server failed to start within $timeout seconds"
    return 1
}

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    
    local response
    local status_code
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data" 2>/dev/null || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" 2>/dev/null || echo -e "\n000")
        fi
    else
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                -H "$headers" 2>/dev/null || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
                2>/dev/null || echo -e "\n000")
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        print_test "PASS" "$method $endpoint - Status: $status_code"
        echo "$response_body"
        return 0
    else
        print_test "FAIL" "$method $endpoint - Expected: $expected_status, Got: $status_code"
        echo "Response: $response_body"
        return 1
    fi
}

# Test 1: Environment Validation
echo -e "\n${YELLOW}📋 Test 1: Environment Validation${NC}"
echo "----------------------------------"

if npm run validate-env > /dev/null 2>&1; then
    print_test "PASS" "Environment variables are properly configured"
else
    print_test "FAIL" "Environment validation failed"
    echo "Please run: cp .env.example .env and configure your environment"
    exit 1
fi

# Test 2: Dependencies Check
echo -e "\n${YELLOW}📦 Test 2: Dependencies Check${NC}"
echo "------------------------------"

if [ -d "node_modules" ]; then
    print_test "PASS" "Backend dependencies installed"
else
    print_test "WARN" "Installing backend dependencies..."
    npm install
fi

if [ -d "client/node_modules" ]; then
    print_test "PASS" "Frontend dependencies installed"
else
    print_test "WARN" "Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

# Test 3: JWT Token Generation
echo -e "\n${YELLOW}🔐 Test 3: JWT Token Generation${NC}"
echo "--------------------------------"

JWT_TOKEN=$(npm run generate-token $DEVICE_ID 1h 2>/dev/null | grep -A1 "JWT Token:" | tail -n1 | tr -d '─' | xargs)

if [ -n "$JWT_TOKEN" ] && [ ${#JWT_TOKEN} -gt 50 ]; then
    print_test "PASS" "JWT token generated successfully"
    echo "Token length: ${#JWT_TOKEN} characters"
else
    print_test "FAIL" "JWT token generation failed"
    exit 1
fi

# Test 4: Start Backend Server
echo -e "\n${YELLOW}🚀 Test 4: Backend Server Startup${NC}"
echo "-----------------------------------"

# Kill any existing server process
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nodemon server.js" 2>/dev/null || true

# Start server in background
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
if wait_for_server "$SERVER_URL" $TEST_TIMEOUT; then
    print_test "PASS" "Backend server started successfully (PID: $SERVER_PID)"
else
    print_test "FAIL" "Backend server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Test 5: Health Check
echo -e "\n${YELLOW}🏥 Test 5: Health Check${NC}"
echo "------------------------"

if test_api "GET" "/health" "" "" "200"; then
    print_test "PASS" "Health check endpoint working"
else
    print_test "FAIL" "Health check failed"
fi

# Test 6: Device Authentication
echo -e "\n${YELLOW}🔑 Test 6: Device Authentication${NC}"
echo "---------------------------------"

AUTH_DATA="{\"deviceId\":\"$DEVICE_ID\",\"name\":\"Test Device\",\"location\":\"Test Lab\"}"
AUTH_RESPONSE=$(test_api "POST" "/devices/authenticate" "$AUTH_DATA" "" "200" 2>/dev/null)

if [ $? -eq 0 ]; then
    # Extract token from response
    API_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$API_TOKEN" ]; then
        print_test "PASS" "Device authentication successful"
        echo "API Token received: ${API_TOKEN:0:20}..."
    else
        print_test "FAIL" "No token received in authentication response"
    fi
else
    print_test "FAIL" "Device authentication failed"
    API_TOKEN=""
fi

# Test 7: Device Sync (with authentication)
echo -e "\n${YELLOW}📡 Test 7: Device Synchronization${NC}"
echo "-----------------------------------"

if [ -n "$API_TOKEN" ]; then
    SYNC_DATA="{\"sensorData\":[{\"zoneId\":1,\"soilMoisture\":45.5,\"temperature\":22.3,\"humidity\":65.2,\"pressure\":1013.2,\"lightLevel\":450}],\"irrigationStatus\":{\"1\":{\"isIrrigating\":false,\"duration\":0,\"reason\":\"none\"}}}"
    
    if test_api "POST" "/devices/sync" "$SYNC_DATA" "Authorization: Bearer $API_TOKEN" "200"; then
        print_test "PASS" "Device synchronization successful"
    else
        print_test "FAIL" "Device synchronization failed"
    fi
else
    print_test "FAIL" "Cannot test sync - no authentication token"
fi

# Test 8: Device List
echo -e "\n${YELLOW}📱 Test 8: Device List${NC}"
echo "------------------------"

if test_api "GET" "/devices" "" "" "200"; then
    print_test "PASS" "Device list endpoint working"
else
    print_test "FAIL" "Device list endpoint failed"
fi

# Test 9: Device Latest Data
echo -e "\n${YELLOW}📊 Test 9: Device Latest Data${NC}"
echo "-------------------------------"

if test_api "GET" "/devices/$DEVICE_ID/latest" "" "" "200"; then
    print_test "PASS" "Device latest data endpoint working"
else
    print_test "FAIL" "Device latest data endpoint failed"
fi

# Test 10: Manual Command
echo -e "\n${YELLOW}🎛️  Test 10: Manual Command${NC}"
echo "-----------------------------"

COMMAND_DATA="{\"zoneId\":1,\"commandType\":\"irrigate\",\"parameters\":{\"duration\":300,\"force\":true}}"

if test_api "POST" "/devices/$DEVICE_ID/command" "$COMMAND_DATA" "" "200"; then
    print_test "PASS" "Manual command endpoint working"
else
    print_test "FAIL" "Manual command endpoint failed"
fi

# Test 11: ESP32 Simulator Test
echo -e "\n${YELLOW}🤖 Test 11: ESP32 Simulator Test${NC}"
echo "----------------------------------"

# Start simulator in background for 15 seconds
timeout 15s npm run simulator $DEVICE_ID $API_URL > simulator.log 2>&1 &
SIMULATOR_PID=$!

sleep 5

if ps -p $SIMULATOR_PID > /dev/null 2>&1; then
    print_test "PASS" "ESP32 simulator started successfully"
    
    # Wait a bit more for simulator to sync
    sleep 5
    
    # Check if device appears in device list
    DEVICE_COUNT=$(curl -s "$API_URL/devices" | grep -o "\"deviceId\":\"$DEVICE_ID\"" | wc -l)
    if [ "$DEVICE_COUNT" -gt 0 ]; then
        print_test "PASS" "Simulator device registered in system"
    else
        print_test "WARN" "Simulator device not found in system (may need more time)"
    fi
    
    # Stop simulator
    kill $SIMULATOR_PID 2>/dev/null || true
else
    print_test "FAIL" "ESP32 simulator failed to start"
fi

# Test 12: Frontend Build Test
echo -e "\n${YELLOW}🏗️  Test 12: Frontend Build${NC}"
echo "-----------------------------"

if npm run build > build.log 2>&1; then
    print_test "PASS" "Frontend build successful"
    
    # Check if build directory exists
    if [ -d "client/build" ]; then
        BUILD_SIZE=$(du -sh client/build | cut -f1)
        print_test "PASS" "Build directory created (Size: $BUILD_SIZE)"
    else
        print_test "FAIL" "Build directory not found"
    fi
else
    print_test "FAIL" "Frontend build failed"
    echo "Check build.log for details"
fi

# Cleanup
echo -e "\n${YELLOW}🧹 Cleanup${NC}"
echo "----------"

# Stop server
if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
    print_test "INFO" "Backend server stopped"
fi

# Clean up log files
rm -f server.log simulator.log build.log

print_test "INFO" "Cleanup completed"

# Test Summary
echo -e "\n${BLUE}📋 Test Summary${NC}"
echo "================"

TOTAL_TESTS=12
PASSED_TESTS=$(grep -c "✅ PASS" <<< "$(cat)")
FAILED_TESTS=$(grep -c "❌ FAIL" <<< "$(cat)")

echo -e "📊 Total Tests: $TOTAL_TESTS"
echo -e "✅ Passed: $PASSED_TESTS"
echo -e "❌ Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! System is ready for deployment.${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Deploy to AWS: npm run deploy"
    echo "2. Configure production environment variables"
    echo "3. Set up MongoDB Atlas with production credentials"
    echo "4. Configure domain and SSL certificates"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please fix issues before deployment.${NC}"
    echo -e "\n${BLUE}Troubleshooting:${NC}"
    echo "1. Check environment variables: npm run validate-env"
    echo "2. Verify MongoDB connection"
    echo "3. Check server logs for errors"
    echo "4. Ensure all dependencies are installed"
    exit 1
fi