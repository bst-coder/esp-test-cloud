# 🚀 Quick Start Guide

Get your Smart Irrigation System up and running in 5 minutes!

## Prerequisites

- Node.js (v16+)
- MongoDB Atlas account (free tier works)
- Git

## 1. Setup Environment

```bash
# Clone and enter directory
git clone <repository-url>
cd smart-irrigation-system

# Copy environment template
cp .env.example .env
```

Edit `.env` with your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-irrigation
JWT_SECRET=your_super_secret_key_here
```

## 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install-client
```

## 3. Start Development

**Option A: Start services separately**
```bash
# Terminal 1: Backend API
npm run dev

# Terminal 2: Frontend Dashboard  
npm run client

# Terminal 3: ESP32 Simulator
npm run simulator
```

**Option B: Start everything at once**
```bash
# Start backend + frontend together
npm run dev:full

# In another terminal: Start simulator
npm run simulator ESP32-001
```

## 4. Access the Dashboard

Open http://localhost:3000 in your browser

You should see:
- ✅ ESP32-001 device connected
- 📊 Real-time sensor data
- 🎛️ Manual irrigation controls

## 5. Test the System

1. **Monitor Data**: Watch sensor values update every 10 seconds
2. **Manual Control**: Click "Send Command" to test irrigation
3. **Automatic Irrigation**: Lower moisture thresholds to trigger auto-irrigation

## 🔧 Troubleshooting

**MongoDB Connection Issues:**
```bash
# Test connection
npm run health
```

**ESP32 Not Connecting:**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Restart simulator with debug
node esp32-simulator.js ESP32-001 http://localhost:5000/api
```

**Frontend Not Loading:**
- Check browser console for errors
- Verify backend is running on port 5000
- Clear browser cache

## 📱 Production Deployment

For AWS EC2 deployment:
```bash
# Build for production
npm run build

# Deploy with PM2
npm run deploy
```

See [README.md](README.md) for detailed deployment instructions.

## 🆘 Need Help?

- Check the [full README](README.md)
- Review server logs: `npm run logs`
- Test system health: `npm run health`
- Check PM2 status: `npm run status`

Happy irrigating! 🌱💧