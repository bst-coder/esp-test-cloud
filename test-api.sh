#!/bin/bash

# Smart Irrigation System - API Testing Script
# Quick API endpoint testing

set -e

# Configuration
SERVER_URL=${1:-"http://localhost:5000"}
API_URL="$SERVER_URL/api"
DEVICE_ID="ESP32-API-TEST"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔌 Smart Irrigation API Test Suite${NC}"
echo "=================================="
echo "Server: $SERVER_URL"
echo "Device ID: $DEVICE_ID"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi

# Test 2: Device Authentication
echo "2. Testing Device Authentication..."
AUTH_DATA="{\"deviceId\":\"$DEVICE_ID\",\"name\":\"API Test Device\",\"location\":\"Test Lab\"}"
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/devices/authenticate" \
    -H "Content-Type: application/json" \
    -d "$AUTH_DATA")

TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

# Test 3: Device Sync
echo "3. Testing Device Sync..."
SYNC_DATA="{\"sensorData\":[{\"zoneId\":1,\"soilMoisture\":35.5,\"temperature\":24.1,\"humidity\":68.3,\"pressure\":1015.2,\"lightLevel\":520}],\"irrigationStatus\":{\"1\":{\"isIrrigating\":false,\"duration\":0,\"reason\":\"none\"}}}"

SYNC_RESPONSE=$(curl -s -X POST "$API_URL/devices/sync" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$SYNC_DATA")

if echo "$SYNC_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Device sync successful${NC}"
else
    echo -e "${RED}❌ Device sync failed${NC}"
    echo "Response: $SYNC_RESPONSE"
fi

# Test 4: Get Devices
echo "4. Testing Get Devices..."
DEVICES_RESPONSE=$(curl -s "$API_URL/devices")
if echo "$DEVICES_RESPONSE" | grep -q "$DEVICE_ID"; then
    echo -e "${GREEN}✅ Device list contains test device${NC}"
else
    echo -e "${RED}❌ Test device not found in device list${NC}"
fi

# Test 5: Get Latest Data
echo "5. Testing Get Latest Data..."
LATEST_RESPONSE=$(curl -s "$API_URL/devices/$DEVICE_ID/latest")
if echo "$LATEST_RESPONSE" | grep -q "zoneId"; then
    echo -e "${GREEN}✅ Latest data retrieved${NC}"
else
    echo -e "${RED}❌ Failed to get latest data${NC}"
fi

# Test 6: Send Command
echo "6. Testing Send Command..."
COMMAND_DATA="{\"zoneId\":1,\"commandType\":\"irrigate\",\"parameters\":{\"duration\":180,\"force\":true}}"
COMMAND_RESPONSE=$(curl -s -X POST "$API_URL/devices/$DEVICE_ID/command" \
    -H "Content-Type: application/json" \
    -d "$COMMAND_DATA")

if echo "$COMMAND_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Command sent successfully${NC}"
else
    echo -e "${RED}❌ Failed to send command${NC}"
fi

echo ""
echo -e "${BLUE}🎉 API testing completed!${NC}"