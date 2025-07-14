const express = require("express")
const jwt = require("jsonwebtoken")
const Device = require("../models/Device")
const SensorLog = require("../models/SensorLog")
const Command = require("../models/Command")

const router = express.Router()

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000

// Validate JWT_SECRET
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET environment variable is required")
  process.exit(1)
}

// Middleware to verify JWT token
const authenticateDevice = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const device = await Device.findOne({ deviceId: decoded.deviceId })

    if (!device) {
      return res.status(401).json({ error: "Invalid device" })
    }

    req.device = device
    next()
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
}

// ESP32 Authentication Route
router.post("/authenticate", async (req, res) => {
  try {
    const { deviceId, name, location } = req.body

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" })
    }

    // Find or create device
    let device = await Device.findOne({ deviceId })

    if (!device) {
      // Create new device with default zones
      device = new Device({
        deviceId,
        name: name || `ESP32-${deviceId}`,
        location: location || "Unknown",
        zones: [
          { zoneId: 1, name: "Zone 1", moistureThreshold: 30 },
          { zoneId: 2, name: "Zone 2", moistureThreshold: 25 },
          { zoneId: 3, name: "Zone 3", moistureThreshold: 35 },
        ],
      })
      await device.save()
      console.log(`New device registered: ${deviceId}`)
    }

    // Update device status
    device.isOnline = true
    device.lastSeen = new Date()
    await device.save()

    // Generate JWT token
    const token = jwt.sign({ deviceId }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      success: true,
      token,
      configuration: {
        zones: device.zones,
        syncInterval: device.configuration.syncInterval,
        maxIrrigationTime: device.configuration.maxIrrigationTime,
        emergencyShutoff: device.configuration.emergencyShutoff,
      },
    })
  } catch (error) {
    console.error("Authentication error:", error)
    res.status(500).json({ error: "Authentication failed" })
  }
})

// ESP32 Sync Route
router.post("/sync", authenticateDevice, async (req, res) => {
  try {
    const { sensorData, irrigationStatus } = req.body
    const device = req.device

    // Update device last seen
    device.lastSeen = new Date()
    await device.save()

    // Process sensor data for each zone
    if (sensorData && Array.isArray(sensorData)) {
      for (const zoneData of sensorData) {
        const { zoneId, soilMoisture, temperature, humidity, pressure, lightLevel } = zoneData

        // Create sensor log entry
        const sensorLog = new SensorLog({
          deviceId: device.deviceId,
          zoneId,
          sensorData: {
            soilMoisture,
            temperature,
            humidity,
            pressure,
            lightLevel: lightLevel || 0,
          },
          irrigationStatus: irrigationStatus?.[zoneId] || { isIrrigating: false, duration: 0, reason: "none" },
        })

        await sensorLog.save()

        // Check if irrigation is needed based on threshold
        const zone = device.zones.find((z) => z.zoneId === zoneId)
        if (zone && soilMoisture < zone.moistureThreshold && zone.isActive) {
          // Create automatic irrigation command if none exists
          const existingCommand = await Command.findOne({
            deviceId: device.deviceId,
            zoneId,
            status: { $in: ["pending", "delivered"] },
          })

          if (!existingCommand) {
            const command = new Command({
              deviceId: device.deviceId,
              zoneId,
              commandType: "irrigate",
              parameters: {
                duration: zone.irrigationDuration,
                force: false,
              },
              createdBy: "system",
            })
            await command.save()
          }
        }
      }
    }

    // Get pending commands for this device
    const pendingCommands = await Command.find({
      deviceId: device.deviceId,
      status: "pending",
    }).sort({ createdAt: 1 })

    // Mark commands as delivered
    if (pendingCommands.length > 0) {
      await Command.updateMany(
        { _id: { $in: pendingCommands.map((cmd) => cmd._id) } },
        { status: "delivered", deliveredAt: new Date() },
      )
    }

    res.json({
      success: true,
      commands: pendingCommands.map((cmd) => ({
        commandId: cmd._id,
        zoneId: cmd.zoneId,
        commandType: cmd.commandType,
        parameters: cmd.parameters,
      })),
      configuration: device.configuration,
    })
  } catch (error) {
    console.error("Sync error:", error)
    res.status(500).json({ error: "Sync failed" })
  }
})

// Get all devices (for frontend)
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 })
    res.json(devices)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch devices" })
  }
})

// Get device sensor logs
router.get("/:deviceId/logs", async (req, res) => {
  try {
    const { deviceId } = req.params
    const { limit = 50, zoneId } = req.query

    const query = { deviceId }
    if (zoneId) query.zoneId = Number.parseInt(zoneId)

    const logs = await SensorLog.find(query).sort({ timestamp: -1 }).limit(Number.parseInt(limit))

    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" })
  }
})

// Get latest sensor data per zone
router.get("/:deviceId/latest", async (req, res) => {
  try {
    const { deviceId } = req.params

    const device = await Device.findOne({ deviceId })
    if (!device) {
      return res.status(404).json({ error: "Device not found" })
    }

    const latestData = []
    for (const zone of device.zones) {
      const latestLog = await SensorLog.findOne({
        deviceId,
        zoneId: zone.zoneId,
      }).sort({ timestamp: -1 })

      latestData.push({
        zoneId: zone.zoneId,
        zoneName: zone.name,
        threshold: zone.moistureThreshold,
        isActive: zone.isActive,
        latestData: latestLog || null,
      })
    }

    res.json(latestData)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch latest data" })
  }
})

// Send manual command
router.post("/:deviceId/command", async (req, res) => {
  try {
    const { deviceId } = req.params
    const { zoneId, commandType, parameters } = req.body

    const device = await Device.findOne({ deviceId })
    if (!device) {
      return res.status(404).json({ error: "Device not found" })
    }

    const command = new Command({
      deviceId,
      zoneId: Number.parseInt(zoneId),
      commandType,
      parameters: parameters || {},
      createdBy: "user",
    })

    await command.save()
    res.json({ success: true, commandId: command._id })
  } catch (error) {
    res.status(500).json({ error: "Failed to create command" })
  }
})

// Get commands
router.get("/:deviceId/commands", async (req, res) => {
  try {
    const { deviceId } = req.params
    const { status, limit = 20 } = req.query

    const query = { deviceId }
    if (status) query.status = status

    const commands = await Command.find(query).sort({ createdAt: -1 }).limit(Number.parseInt(limit))

    res.json(commands)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commands" })
  }
})

module.exports = router
