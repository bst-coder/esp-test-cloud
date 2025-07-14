# 🚀 AWS Deployment Checklist

## ✅ Local Testing Results (COMPLETED)

### Core System Tests
- ✅ Environment validation: PASSED
- ✅ MongoDB Atlas connection: CONNECTED
- ✅ Server health check: OK
- ✅ JWT token generation: WORKING
- ✅ Device authentication: WORKING
- ✅ Device synchronization: WORKING
- ✅ ESP32 simulator: WORKING
- ✅ All API endpoints: WORKING
- ✅ Manual irrigation commands: WORKING
- ✅ Frontend build: SUCCESSFUL (808K)

### Database Status
- ✅ MongoDB URI: `mongodb+srv://bst-coder:***@cluster0.3tcrszs.mongodb.net/smart-irrigation`
- ✅ Database name: `smart-irrigation`
- ✅ Connection: ACTIVE
- ✅ Test devices registered: 2

### API Endpoints Tested
- ✅ `GET /api/health` - Server health check
- ✅ `POST /api/devices/authenticate` - Device authentication
- ✅ `POST /api/devices/sync` - Device synchronization
- ✅ `GET /api/devices` - Get all devices
- ✅ `GET /api/devices/:id/latest` - Get latest sensor data
- ✅ `POST /api/devices/:id/command` - Send manual commands
- ✅ `GET /api/devices/:id/commands` - Get command history

## 🔧 Pre-Deployment Setup

### 1. AWS EC2 Instance Requirements
- [ ] Ubuntu 20.04+ LTS
- [ ] t2.micro or larger
- [ ] Security group allowing ports 22, 80, 443
- [ ] Elastic IP (recommended)

### 2. Environment Configuration
- [ ] Copy `.env` to production server
- [ ] Update `NODE_ENV=production`
- [ ] Generate strong JWT secret for production
- [ ] Update `FRONTEND_URL` to production domain

### 3. MongoDB Atlas Configuration
- [ ] Whitelist EC2 instance IP address
- [ ] Verify connection string works from EC2
- [ ] Ensure database user has read/write permissions

## 🚀 Deployment Commands

### On Local Machine
```bash
# Final validation
npm run validate-env

# Commit changes
git add .
git commit -m "Ready for AWS deployment"
git push origin main
```

### On EC2 Instance
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <your-repo-url>
cd smart-irrigation-system

# Install dependencies
npm install
npm run install-client

# Set up environment
cp .env.example .env
nano .env  # Configure production values

# Build frontend
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

### Optional: Nginx Setup
```bash
# Install Nginx
sudo apt install nginx -y

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/irrigation

# Enable site
sudo ln -s /etc/nginx/sites-available/irrigation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🧪 Post-Deployment Testing

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

### 2. API Testing
```bash
# Run API tests against production
./test-api.sh https://your-domain.com
```

### 3. ESP32 Simulator Test
```bash
# Test with production server
node esp32-simulator.js ESP32-PROD-001 https://your-domain.com/api
```

### 4. Frontend Access
- [ ] Access dashboard at `https://your-domain.com`
- [ ] Verify device list loads
- [ ] Test manual irrigation commands
- [ ] Check real-time data updates

## 🔒 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] MongoDB IP whitelist configured
- [ ] HTTPS enabled (SSL certificate)
- [ ] Rate limiting active
- [ ] Security headers enabled (Helmet)
- [ ] Environment variables secured
- [ ] No sensitive data in logs

## 📊 Monitoring Setup

- [ ] PM2 monitoring active
- [ ] Server logs accessible: `pm2 logs irrigation-api`
- [ ] MongoDB Atlas monitoring enabled
- [ ] Health check endpoint responding
- [ ] Error tracking configured

## 🚨 Troubleshooting Commands

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs irrigation-api

# Restart application
pm2 restart irrigation-api

# Check system resources
htop
df -h

# Test MongoDB connection
npm run validate-env

# Test API endpoints
npm run health
```

## 📝 Production Environment Variables

```env
# Production .env template
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://bst-coder:PASSWORD@cluster0.3tcrszs.mongodb.net/smart-irrigation?retryWrites=true&w=majority
JWT_SECRET=your_production_jwt_secret_32_chars_minimum
FRONTEND_URL=https://your-domain.com
RATE_LIMIT_MAX=1000
HELMET_ENABLED=true
```

---

## ✅ Ready for Deployment!

All local tests have passed successfully. The system is ready for AWS EC2 deployment.

**Next Command:** `npm run deploy` (after setting up EC2 instance)