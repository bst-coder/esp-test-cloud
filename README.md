# 🌱 Smart Irrigation System

A complete MERN stack application that simulates communication between ESP32 devices and a server for intelligent irrigation management, with production deployment on AWS EC2.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [ESP32-to-Server Communication Flow](#esp32-to-server-communication-flow)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [ESP32 Simulator](#esp32-simulator)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## 🏗️ Architecture Overview

### Backend (Node.js + Express + MongoDB)
- **Express.js** server with secure JWT authentication
- **MongoDB Atlas** for data persistence
- **Mongoose** ODM with three main data models:
  - `Device.js`: ESP32 device configurations and zones
  - `SensorLog.js`: Environmental and irrigation data logs
  - `Command.js`: Override commands and system instructions
- **Security**: Helmet, rate limiting, CORS protection
- **Real-time**: RESTful API with polling-based updates

### Frontend (React Dashboard)
- **Single-page application** (SPA) built with React
- **Responsive design** using Tailwind CSS
- **Real-time monitoring** of device status and sensor data
- **Manual control interface** for irrigation override commands
- **Device management** with multi-zone support

### ESP32 Simulator
- **Standalone Node.js script** that mimics ESP32 behavior
- **Realistic sensor simulation** with environmental variations
- **JWT-based authentication** and secure communication
- **Automatic reconnection** and error handling
- **Configurable device parameters**

## ✨ Features

- 🔐 **Secure Authentication**: JWT-based device authentication
- 📊 **Real-time Monitoring**: Live sensor data and irrigation status
- 🎛️ **Manual Control**: Override irrigation commands via dashboard
- 🌡️ **Multi-sensor Support**: Soil moisture, temperature, humidity, pressure
- 🚿 **Smart Irrigation**: Threshold-based automatic irrigation
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔄 **Auto-sync**: Configurable sync intervals for ESP32 devices
- 🚨 **Emergency Controls**: Emergency stop functionality
- 📈 **Data Logging**: Historical sensor and irrigation data
- ☁️ **Cloud Ready**: Production deployment on AWS EC2

## 🔄 ESP32-to-Server Communication Flow

```mermaid
sequenceDiagram
    participant ESP32
    participant Server
    participant Database
    participant Dashboard

    ESP32->>Server: POST /api/devices/authenticate
    Note over ESP32,Server: Send deviceId, name, location
    Server->>Database: Find or create device
    Server->>ESP32: Return JWT token + configuration
    
    loop Every 10 seconds
        ESP32->>Server: POST /api/devices/sync
        Note over ESP32,Server: Send sensor data + irrigation status
        Server->>Database: Store sensor logs
        Server->>Database: Check for pending commands
        Server->>ESP32: Return commands + updated config
        ESP32->>ESP32: Process commands & update irrigation
    end
    
    Dashboard->>Server: GET /api/devices
    Server->>Dashboard: Return device list
    Dashboard->>Server: POST /api/devices/:id/command
    Server->>Database: Store manual command
    Note over Server,ESP32: Command delivered on next sync
```

## 🔌 API Endpoints

### Device Authentication
```http
POST /api/devices/authenticate
Content-Type: application/json

{
  "deviceId": "ESP32-001",
  "name": "Garden Controller",
  "location": "Backyard Zone A"
}
```

### Device Synchronization
```http
POST /api/devices/sync
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "sensorData": [
    {
      "zoneId": 1,
      "soilMoisture": 25.5,
      "temperature": 22.3,
      "humidity": 65.2,
      "pressure": 1013.2,
      "lightLevel": 450
    }
  ],
  "irrigationStatus": {
    "1": {
      "isIrrigating": false,
      "duration": 0,
      "reason": "none"
    }
  }
}
```

### Dashboard API
```http
GET /api/devices                    # Get all devices
GET /api/devices/:id/latest         # Get latest sensor data
GET /api/devices/:id/logs           # Get sensor logs
POST /api/devices/:id/command       # Send manual command
GET /api/devices/:id/commands       # Get command history
GET /api/health                     # System health check
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-irrigation-system
```

### 2. Install Backend Dependencies
```bash
npm install
```

### 3. Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### 4. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb+srv://bst-coder:YOUR_PASSWORD@cluster0.3tcrszs.mongodb.net/smart-irrigation?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
PORT=5000
NODE_ENV=development
```

**Important**: Replace `YOUR_PASSWORD` with your actual MongoDB Atlas password.

### 5. Validate Environment Configuration
```bash
npm run validate-env
```

This will check that all required environment variables are properly set and configured.

### 6. MongoDB Atlas Setup
1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster (the provided URI points to cluster0.3tcrszs.mongodb.net)
3. Create a database user with username `bst-coder`
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Replace `<db_password>` in the MONGODB_URI with your actual password

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
npm run dev
# Server runs on http://localhost:5000
```

2. **Start the Frontend (in a new terminal)**:
```bash
cd client
npm start
# React app runs on http://localhost:3000
```

3. **Start the ESP32 Simulator (in a new terminal)**:
```bash
node esp32-simulator.js ESP32-001 http://localhost:5000/api
```

### Production Mode

1. **Build the Frontend**:
```bash
npm run build
```

2. **Start the Production Server**:
```bash
NODE_ENV=production npm start
# Serves both API and React app on http://localhost:5000
```

## 🧪 ESP32 Simulator

The ESP32 simulator (`esp32-simulator.js`) is a standalone Node.js script that mimics real ESP32 behavior.

### Running the Simulator

```bash
# Basic usage
node esp32-simulator.js

# Custom device ID and server URL
node esp32-simulator.js ESP32-002 http://localhost:5000/api

# For production deployment
node esp32-simulator.js ESP32-001 https://your-ec2-domain.com/api
```

### Simulator Features

- **Realistic sensor data**: Simulates soil moisture, temperature, humidity, pressure, and light levels
- **Irrigation simulation**: Responds to irrigation commands and simulates water effects
- **Auto-reconnection**: Handles network failures and token expiration
- **Configurable zones**: Supports multiple irrigation zones per device
- **Command processing**: Executes irrigation, stop, and configuration commands
- **Status logging**: Provides detailed console output for monitoring

### Simulator Commands

The simulator responds to these command types:
- `irrigate`: Start irrigation for specified duration
- `stop`: Stop irrigation immediately
- `emergency_stop`: Stop all irrigation across all zones
- `config_update`: Update zone thresholds and settings

## ☁️ AWS EC2 Deployment

### 1. EC2 Instance Setup

Launch an Ubuntu EC2 instance:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx (optional but recommended)
sudo apt install nginx -y
```

### 2. Deploy Application

```bash
# Clone repository
git clone <your-repository-url>
cd smart-irrigation-system

# Install dependencies
npm install
npm run install-client

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Build frontend
npm run build

# Start with PM2
pm2 start server.js --name "irrigation-api"
pm2 startup
pm2 save
```

### 3. Nginx Configuration (Optional)

Create `/etc/nginx/sites-available/irrigation`:
```nginx
server {
    listen 80;
    server_name your-ec2-public-ip;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/irrigation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Security Group Configuration

Ensure your EC2 security group allows:
- **Port 22**: SSH access
- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic (if using SSL)

### 5. SSL Certificate (Recommended)

For production, set up SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📁 Project Structure

```
smart-irrigation-system/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js    # Main dashboard component
│   │   │   ├── DeviceCard.js   # Device list item
│   │   │   ├── ZoneCard.js     # Zone status display
│   │   │   └── CommandForm.js  # Manual command form
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
├── models/                     # Mongoose data models
│   ├── Device.js               # Device configuration
│   ├── SensorLog.js            # Sensor data logs
│   └── Command.js              # Irrigation commands
├── routes/                     # Express routes
│   └── deviceRoutes.js         # Device API endpoints
├── esp32-simulator.js          # ESP32 device simulator
├── server.js                   # Express server
├── package.json                # Backend dependencies
├── .env.example                # Environment template
└── README.md                   # This file
```

## 🔧 Environment Variables

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | No |
| `PORT` | Server port | `5000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` | No |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | - | No |
| `RATE_LIMIT_MAX` | Rate limit per 15 minutes | `100` | No |
| `HELMET_ENABLED` | Enable security headers | `true` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `DB_NAME` | Database name | `smart-irrigation` | No |
| `API_TIMEOUT` | API request timeout (ms) | `10000` | No |
| `API_RETRY_ATTEMPTS` | API retry attempts | `3` | No |

### ESP32 Simulator Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SIMULATOR_DEVICE_ID` | Default device ID | `ESP32-001` | No |
| `SIMULATOR_SERVER_URL` | Default server URL | `http://localhost:5000/api` | No |
| `SIMULATOR_SYNC_INTERVAL` | Sync interval (ms) | `10000` | No |

### React Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | API base URL | `http://localhost:5000/api` | No |
| `REACT_APP_API_TIMEOUT` | API timeout (ms) | `10000` | No |
| `REACT_APP_RETRY_ATTEMPTS` | API retry attempts | `3` | No |
| `REACT_APP_REFRESH_INTERVAL` | Dashboard refresh interval (ms) | `10000` | No |

### Example .env Configuration

```env
# Required
MONGODB_URI=mongodb+srv://bst-coder:YOUR_PASSWORD@cluster0.3tcrszs.mongodb.net/smart-irrigation?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Optional - Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_MAX=100

# Optional - Database
DB_NAME=smart-irrigation

# Optional - ESP32 Simulator
SIMULATOR_DEVICE_ID=ESP32-001
SIMULATOR_SERVER_URL=http://localhost:5000/api
SIMULATOR_SYNC_INTERVAL=10000

# Optional - React App (create client/.env for these)
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_REFRESH_INTERVAL=10000
```

## 🧪 Testing the System

### 1. Start All Services
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd client && npm start

# Terminal 3: ESP32 Simulator
node esp32-simulator.js ESP32-001
```

### 2. Access the Dashboard
Open http://localhost:3000 in your browser

### 3. Verify Communication
- Check that the ESP32 device appears in the dashboard
- Monitor real-time sensor data updates
- Test manual irrigation commands
- Verify automatic irrigation based on thresholds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue
- Check the troubleshooting section below

### Troubleshooting

**Common Issues:**

1. **MongoDB Connection Failed**
   - Verify MongoDB URI in `.env`
   - Check network connectivity
   - Ensure IP is whitelisted in MongoDB Atlas

2. **ESP32 Simulator Not Connecting**
   - Verify server URL is correct
   - Check if backend server is running
   - Ensure JWT_SECRET is set

3. **Frontend Not Loading Data**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check CORS configuration

4. **Commands Not Working**
   - Verify device is online and syncing
   - Check command format in API calls
   - Monitor server logs for errors

---

Built with ❤️ for smart agriculture and IoT enthusiasts.