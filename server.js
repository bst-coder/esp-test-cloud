const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const deviceRoutes = require("./routes/deviceRoutes")

const app = express()

// Environment variables with defaults
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || "development"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100
const HELMET_ENABLED = process.env.HELMET_ENABLED !== "false"
const LOG_LEVEL = process.env.LOG_LEVEL || "info"

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required")
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is required")
  process.exit(1)
}

// Security middleware
if (HELMET_ENABLED) {
  app.use(helmet({
    contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: NODE_ENV === "production"
  }))
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: RATE_LIMIT_MAX,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use("/api/", limiter)

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === "production" 
    ? [FRONTEND_URL, process.env.ALLOWED_ORIGINS?.split(",") || []].flat().filter(Boolean)
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = process.env.DB_NAME || "smart-irrigation"

// Log MongoDB connection attempt
console.log(`🔗 Connecting to MongoDB...`)
console.log(`📊 Database: ${DB_NAME}`)
console.log(`🌍 Environment: ${NODE_ENV}`)

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: DB_NAME,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).catch(err => {
  console.error(`❌ Initial MongoDB connection failed: ${err.message}`);
})

mongoose.connection.on("connected", () => {
  console.log("✅ Connected to MongoDB")
  console.log(`📊 Database: ${mongoose.connection.name}`)
})

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err)
})

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected")
})

// API Routes
app.use("/api/devices", deviceRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  })
})

// Serve static files from React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")))
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"))
  })
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack)
  res.status(500).json({ 
    error: process.env.NODE_ENV === "production" 
      ? "Something went wrong!" 
      : err.message 
  })
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error("❌ Unhandled Promise Rejection:", err.message)
  // Close server & exit process
  process.exit(1)
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message)
  process.exit(1)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...")
  mongoose.connection.close(() => {
    console.log("📊 MongoDB connection closed.")
    process.exit(0)
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
})
