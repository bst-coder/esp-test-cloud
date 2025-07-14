#!/bin/bash

# Smart Irrigation System - AWS EC2 Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
APP_NAME="smart-irrigation"
PM2_APP_NAME="irrigation-api"

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env

if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI is not set in .env file"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is not set in .env file"
    exit 1
fi

if [[ "$MONGODB_URI" == *"<db_password>"* ]]; then
    echo "❌ Please replace <db_password> in MONGODB_URI with your actual MongoDB password"
    exit 1
fi

echo "✅ Environment variables validated"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Build frontend for production
echo "🏗️ Building frontend..."
npm run build

# Stop existing PM2 process if running
echo "🛑 Stopping existing PM2 process..."
pm2 stop $PM2_APP_NAME 2>/dev/null || echo "No existing process found"

# Start the application with PM2
echo "▶️ Starting application with PM2..."
NODE_ENV=$ENVIRONMENT pm2 start server.js --name $PM2_APP_NAME --update-env

# Save PM2 configuration
pm2 save

# Show status
echo "📊 Application status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be running on the configured port"
echo "📝 Check logs with: pm2 logs $PM2_APP_NAME"
echo "🔄 Restart with: pm2 restart $PM2_APP_NAME"
echo "🛑 Stop with: pm2 stop $PM2_APP_NAME"