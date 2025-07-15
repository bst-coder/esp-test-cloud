# 🚀 Complete Deployment Guide - Smart Irrigation System

This guide covers everything you need to run the Smart Irrigation System locally and deploy it to AWS EC2, based on real-world testing and troubleshooting.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Common Issues & Solutions](#common-issues--solutions)
- [Testing & Verification](#testing--verification)
- [Remote ESP32 Simulation](#remote-esp32-simulation)

## 🔧 Prerequisites

### Required Software
- **Node.js** (v16 or higher)
- **Git**
- **MongoDB Atlas** account (free tier works)
- **AWS Account** with EC2 access

### Required Knowledge
- Basic command line usage
- Basic understanding of environment variables
- AWS EC2 instance management

## 🏠 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bst-coder/esp-test-cloud.git
cd esp-test-cloud
```

### 2. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your MongoDB credentials
nano .env
```

**Required .env configuration:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-irrigation?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
PORT=5000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-client
```

### 4. Start Development Servers

**Option A: Start services separately**
```bash
# Terminal 1: Backend API
npm run dev

# Terminal 2: Frontend Dashboard
npm run client

# Terminal 3: ESP32 Simulator
node esp32-simulator.js ESP32-001
```

**Option B: Start everything at once**
```bash
# Terminal 1: Backend + Frontend
npm run dev:full

# Terminal 2: ESP32 Simulator
node esp32-simulator.js ESP32-001
```

### 5. Access the Application

- **Dashboard:** http://localhost:3000
- **API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## ☁️ AWS EC2 Deployment

### 1. EC2 Instance Setup

**Launch Ubuntu EC2 Instance:**
- **AMI:** Ubuntu Server 22.04 LTS
- **Instance Type:** t2.micro (free tier eligible)
- **Security Group:** Allow ports 22 (SSH), 80 (HTTP), 5000 (Custom)

**Connect to your instance:**
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install git -y

# Verify installations
node --version
npm --version
git --version
```

### 3. Deploy the Application

```bash
# Clone your repository
git clone https://github.com/bst-coder/esp-test-cloud.git
cd esp-test-cloud

# Set up environment
cp .env.example .env
nano .env  # Edit with your production MongoDB URI and JWT secret
```

**Production .env configuration:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-irrigation?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
PORT=5000
NODE_ENV=production
```

### 4. Install Dependencies and Build

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-client

# Build frontend for production
npm run build
```

### 5. Start Production Server

**Option A: Direct start**
```bash
NODE_ENV=production node server.js
```

**Option B: Using PM2 (recommended)**
```bash
# Start with PM2
pm2 start server.js --name "irrigation-api" --env production

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### 6. Configure Security Group

Ensure your EC2 security group allows:
- **Port 22:** SSH access (your IP only)
- **Port 5000:** HTTP access (0.0.0.0/0 for public access)

### 7. Access Your Deployed Application

- **Dashboard:** http://your-ec2-public-ip:5000
- **API:** http://your-ec2-public-ip:5000/api
- **Health Check:** http://your-ec2-public-ip:5000/api/health

## 🐛 Common Issues & Solutions

### Issue 1: `react-scripts: not found`

**Cause:** Frontend dependencies not installed or corrupted by `npm audit fix --force`

**Solution:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
cd ..
```

**Prevention:** Never run `npm audit fix --force` on React projects

### Issue 2: Dashboard Shows No Devices (Development Mode)

**Cause:** Frontend trying to connect to `localhost` from browser when server is on EC2

**Solution:** Use production mode instead of development mode on EC2:
```bash
npm run build
NODE_ENV=production node server.js
```

### Issue 3: API Connection Errors in Production

**Cause:** Incorrect API URL configuration

**Solution:** The frontend is configured to use relative URLs (`/api`) in production mode, which automatically resolves to the correct server.

### Issue 4: MongoDB Connection Failed

**Cause:** Incorrect MongoDB URI or network restrictions

**Solution:**
1. Verify MongoDB URI in `.env`
2. Ensure IP whitelist includes your EC2 instance IP (or use 0.0.0.0/0)
3. Check MongoDB Atlas network access settings

### Issue 5: Permission Denied for Global npm Packages

**Cause:** Installing global packages without sudo on EC2

**Solution:**
```bash
sudo npm install -g package-name
```

### Issue 6: PM2 Process Not Starting

**Cause:** Environment variables not loaded or syntax errors

**Solution:**
```bash
# Check PM2 logs
pm2 logs irrigation-api

# Restart with environment
pm2 restart irrigation-api --update-env

# Check process status
pm2 status
```

## ✅ Testing & Verification

### 1. Health Check

```bash
# Test API health
curl http://your-ec2-ip:5000/api/health

# Expected response:
{
  "status": "OK",
  "timestamp": "2024-07-14T21:00:00.000Z",
  "environment": "production",
  "database": "connected"
}
```

### 2. Device Registration

```bash
# Start ESP32 simulator
node esp32-simulator.js ESP32-TEST http://your-ec2-ip:5000/api

# Check if device appears in dashboard
# Visit: http://your-ec2-ip:5000
```

### 3. Database Verification

```bash
# Check MongoDB Atlas dashboard
# Verify collections: devices, sensorlogs, commands
```

## 🌐 Remote ESP32 Simulation

### Using the Remote Simulator Script

On any machine with Node.js and the project files:

```bash
# Clone the repository
git clone https://github.com/bst-coder/esp-test-cloud.git
cd esp-test-cloud

# Run remote simulator (connects to your EC2 server)
./simulate-remote.sh

# Or with custom device ID
./simulate-remote.sh MY-DEVICE-NAME
```

### Manual Remote Simulation

```bash
# Run simulator with custom server URL
node esp32-simulator.js DEVICE-ID http://your-ec2-ip:5000/api

# Example:
node esp32-simulator.js ESP32-OFFICE http://54.81.217.131:5000/api
```

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
# View process status
pm2 status

# View logs
pm2 logs irrigation-api

# Restart application
pm2 restart irrigation-api

# Stop application
pm2 stop irrigation-api

# Monitor in real-time
pm2 monit
```

### Application Logs

```bash
# View server logs
pm2 logs irrigation-api --lines 100

# Follow logs in real-time
pm2 logs irrigation-api -f
```

### System Resources

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

## 🔒 Security Best Practices

### 1. Environment Variables

- Never commit `.env` files to Git
- Use strong, unique JWT secrets
- Rotate secrets regularly

### 2. MongoDB Security

- Use MongoDB Atlas with IP whitelisting
- Create dedicated database users with minimal permissions
- Enable MongoDB authentication

### 3. EC2 Security

- Restrict SSH access to your IP only
- Use key-based authentication
- Keep system updated
- Consider using a reverse proxy (Nginx) for production

### 4. Application Security

- Enable rate limiting (already configured)
- Use HTTPS in production (consider Let's Encrypt)
- Regularly update dependencies

## 🚀 Quick Start Scripts

### Local Development

```bash
#!/bin/bash
# local-start.sh
npm install
npm run install-client
npm run dev:full
```

### Production Deployment

```bash
#!/bin/bash
# deploy.sh
git pull
npm install
npm run install-client
npm run build
pm2 restart irrigation-api || pm2 start server.js --name irrigation-api
```

## 📞 Troubleshooting Checklist

When something goes wrong, check these in order:

1. **Environment Variables**
   ```bash
   cat .env
   ```

2. **Dependencies**
   ```bash
   npm list --depth=0
   cd client && npm list --depth=0
   ```

3. **Build Status**
   ```bash
   ls -la client/build/
   ```

4. **Server Status**
   ```bash
   pm2 status
   pm2 logs irrigation-api
   ```

5. **Network Connectivity**
   ```bash
   curl http://localhost:5000/api/health
   ```

6. **Database Connection**
   ```bash
   # Check MongoDB Atlas dashboard
   # Verify network access and user permissions
   ```

## 🎯 Success Indicators

Your deployment is successful when:

- ✅ Health check returns status "OK"
- ✅ Dashboard loads at http://your-ec2-ip:5000
- ✅ ESP32 simulator connects and registers devices
- ✅ Real-time data appears on dashboard
- ✅ Manual irrigation commands work
- ✅ PM2 shows process as "online"

## 📝 Final Notes

- Always test locally before deploying to EC2
- Use PM2 for production process management
- Monitor logs regularly for issues
- Keep backups of your `.env` configuration
- Document any custom modifications

This guide covers all the real-world issues encountered during development and deployment. Following these steps should result in a fully functional Smart Irrigation System running on AWS EC2.