#!/bin/bash

# Script to run the ESP32 simulator and connect to the remote production server

# Server configuration
SERVER_URL="http://54.81.217.131:5000/api"

# Use the first argument as the device ID, or default to a unique remote ID
DEVICE_ID=${1:-ESP32-REMOTE-$RANDOM}

echo "🚀 Starting ESP32 Simulator for remote server..."
echo "- Device ID: $DEVICE_ID"
echo "- Server URL: $SERVER_URL"

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Error: Node.js is not installed. Please install it to run the simulator."
    exit 1
fi

# Check if the simulator script exists
if [ ! -f esp32-simulator.js ]; then
    echo "❌ Error: esp32-simulator.js not found. Make sure you are in the project root directory."
    exit 1
fi

# Run the simulator
node esp32-simulator.js "$DEVICE_ID" "$SERVER_URL"
