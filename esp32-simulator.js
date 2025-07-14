const axios = require("axios")
require("dotenv").config()

class ESP32Simulator {
  constructor(deviceId, serverUrl) {
    // Use environment variables with command line arguments as fallback
    this.deviceId = deviceId || process.env.SIMULATOR_DEVICE_ID || "ESP32-temara"
    this.serverUrl = serverUrl || process.env.SIMULATOR_SERVER_URL || "http://localhost:5000/api"
    this.token = null
    this.isRunning = false
    this.syncInterval = parseInt(process.env.SIMULATOR_SYNC_INTERVAL) || 10000 // 10 seconds
    this.configuration = null
    this.apiTimeout = parseInt(process.env.API_TIMEOUT) || 10000
    this.retryAttempts = parseInt(process.env.API_RETRY_ATTEMPTS) || 3

    // Simulated sensor state
    this.sensorState = {
      1: {
        // Zone 1
        soilMoisture: this.randomBetween(20, 80),
        temperature: this.randomBetween(18, 35),
        humidity: this.randomBetween(40, 90),
        pressure: this.randomBetween(1000, 1030),
        lightLevel: this.randomBetween(0, 1000),
      },
      2: {
        // Zone 2
        soilMoisture: this.randomBetween(20, 80),
        temperature: this.randomBetween(18, 35),
        humidity: this.randomBetween(40, 90),
        pressure: this.randomBetween(1000, 1030),
        lightLevel: this.randomBetween(0, 1000),
      },
      3: {
        // Zone 3
        soilMoisture: this.randomBetween(20, 80),
        temperature: this.randomBetween(18, 35),
        humidity: this.randomBetween(40, 90),
        pressure: this.randomBetween(1000, 1030),
        lightLevel: this.randomBetween(0, 1000),
      },
    }

    // Irrigation state
    this.irrigationState = {
      1: { isIrrigating: false, duration: 0, reason: "none", startTime: null },
      2: { isIrrigating: false, duration: 0, reason: "none", startTime: null },
      3: { isIrrigating: false, duration: 0, reason: "none", startTime: null },
    }
  }

  randomBetween(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100
  }

  // Simulate realistic sensor variations
  updateSensorData() {
    Object.keys(this.sensorState).forEach((zoneId) => {
      const zone = this.sensorState[zoneId]
      const irrigation = this.irrigationState[zoneId]

      // Soil moisture changes based on irrigation and evaporation
      if (irrigation.isIrrigating) {
        zone.soilMoisture = Math.min(100, zone.soilMoisture + this.randomBetween(2, 8))
      } else {
        // Natural evaporation
        zone.soilMoisture = Math.max(0, zone.soilMoisture - this.randomBetween(0.1, 1.5))
      }

      // Temperature variation (±2°C)
      zone.temperature += this.randomBetween(-2, 2)
      zone.temperature = Math.max(10, Math.min(45, zone.temperature))

      // Humidity variation (±5%)
      zone.humidity += this.randomBetween(-5, 5)
      zone.humidity = Math.max(20, Math.min(100, zone.humidity))

      // Pressure variation (±3 hPa)
      zone.pressure += this.randomBetween(-3, 3)
      zone.pressure = Math.max(980, Math.min(1050, zone.pressure))

      // Light level variation (simulating day/night cycle)
      const hour = new Date().getHours()
      if (hour >= 6 && hour <= 18) {
        zone.lightLevel = this.randomBetween(200, 1000) // Daylight
      } else {
        zone.lightLevel = this.randomBetween(0, 50) // Night
      }
    })
  }

  // Process irrigation commands
  processIrrigationState() {
    Object.keys(this.irrigationState).forEach((zoneId) => {
      const irrigation = this.irrigationState[zoneId]

      if (irrigation.isIrrigating && irrigation.startTime) {
        const elapsed = (Date.now() - irrigation.startTime) / 1000
        if (elapsed >= irrigation.duration) {
          // Stop irrigation
          irrigation.isIrrigating = false
          irrigation.duration = 0
          irrigation.reason = "none"
          irrigation.startTime = null
          console.log(`Zone ${zoneId}: Irrigation completed`)
        }
      }
    })
  }

  async authenticate() {
    try {
      console.log(`Authenticating ESP32 device: ${this.deviceId}`)

      const response = await axios.post(`${this.serverUrl}/devices/authenticate`, {
        deviceId: this.deviceId,
        name: `Smart Irrigation ESP32 - ${this.deviceId}`,
        location: "Garden Area A",
      })

      if (response.data.success) {
        this.token = response.data.token
        this.configuration = response.data.configuration
        this.syncInterval = this.configuration.syncInterval || 10000

        console.log("✅ Authentication successful")
        console.log(`📡 Sync interval: ${this.syncInterval}ms`)
        console.log(`🌱 Zones configured: ${this.configuration.zones.length}`)

        return true
      }
    } catch (error) {
      console.error("❌ Authentication failed:", error.response?.data?.error || error.message)
      return false
    }
  }

  async syncWithServer() {
    if (!this.token) {
      console.log("No token available, re-authenticating...")
      const authenticated = await this.authenticate()
      if (!authenticated) return
    }

    try {
      // Update sensor data and irrigation state
      this.updateSensorData()
      this.processIrrigationState()

      // Prepare sensor data payload
      const sensorData = Object.keys(this.sensorState).map((zoneId) => ({
        zoneId: Number.parseInt(zoneId),
        ...this.sensorState[zoneId],
      }))

      // Prepare irrigation status
      const irrigationStatus = {}
      Object.keys(this.irrigationState).forEach((zoneId) => {
        irrigationStatus[zoneId] = {
          isIrrigating: this.irrigationState[zoneId].isIrrigating,
          duration: this.irrigationState[zoneId].duration,
          reason: this.irrigationState[zoneId].reason,
        }
      })

      const response = await axios.post(
        `${this.serverUrl}/devices/sync`,
        {
          sensorData,
          irrigationStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      )

      if (response.data.success) {
        // Process any commands received
        if (response.data.commands && response.data.commands.length > 0) {
          console.log(`📨 Received ${response.data.commands.length} command(s)`)
          this.processCommands(response.data.commands)
        }

        // Update configuration if changed
        if (response.data.configuration) {
          this.configuration = response.data.configuration
        }

        // Log current status
        this.logStatus()
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("🔑 Token expired, re-authenticating...")
        this.token = null
      } else {
        console.error("❌ Sync failed:", error.response?.data?.error || error.message)
      }
    }
  }

  processCommands(commands) {
    commands.forEach((command) => {
      const { commandId, zoneId, commandType, parameters } = command

      console.log(`🎛️  Processing command: ${commandType} for Zone ${zoneId}`)

      switch (commandType) {
        case "irrigate":
          this.irrigationState[zoneId] = {
            isIrrigating: true,
            duration: parameters.duration || 300,
            reason: parameters.force ? "manual" : "threshold",
            startTime: Date.now(),
          }
          console.log(`💧 Zone ${zoneId}: Starting irrigation for ${parameters.duration}s`)
          break

        case "stop":
          this.irrigationState[zoneId] = {
            isIrrigating: false,
            duration: 0,
            reason: "none",
            startTime: null,
          }
          console.log(`🛑 Zone ${zoneId}: Irrigation stopped`)
          break

        case "emergency_stop":
          Object.keys(this.irrigationState).forEach((zId) => {
            this.irrigationState[zId] = {
              isIrrigating: false,
              duration: 0,
              reason: "none",
              startTime: null,
            }
          })
          console.log("🚨 Emergency stop: All irrigation stopped")
          break

        case "config_update":
          if (parameters.newThreshold) {
            console.log(`⚙️  Zone ${zoneId}: Threshold updated to ${parameters.newThreshold}%`)
          }
          break
      }
    })
  }

  logStatus() {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`\n📊 Status Update [${timestamp}]`)
    console.log("─".repeat(50))

    Object.keys(this.sensorState).forEach((zoneId) => {
      const sensor = this.sensorState[zoneId]
      const irrigation = this.irrigationState[zoneId]

      console.log(`Zone ${zoneId}:`)
      console.log(`  💧 Moisture: ${sensor.soilMoisture.toFixed(1)}%`)
      console.log(`  🌡️  Temp: ${sensor.temperature.toFixed(1)}°C`)
      console.log(`  💨 Humidity: ${sensor.humidity.toFixed(1)}%`)
      console.log(`  📊 Pressure: ${sensor.pressure.toFixed(1)} hPa`)
      console.log(`  ☀️  Light: ${sensor.lightLevel.toFixed(0)} lux`)

      if (irrigation.isIrrigating) {
        const elapsed = irrigation.startTime ? (Date.now() - irrigation.startTime) / 1000 : 0
        console.log(`  🚿 Irrigating: ${elapsed.toFixed(0)}s / ${irrigation.duration}s (${irrigation.reason})`)
      } else {
        console.log(`  🚿 Irrigation: OFF`)
      }
      console.log("")
    })
  }

  async start() {
    console.log("🚀 Starting ESP32 Irrigation Simulator")
    console.log(`📱 Device ID: ${this.deviceId}`)
    console.log(`🌐 Server: ${this.serverUrl}`)
    console.log("")

    // Initial authentication
    const authenticated = await this.authenticate()
    if (!authenticated) {
      console.log("❌ Failed to authenticate. Exiting...")
      return
    }

    this.isRunning = true
    console.log("✅ Simulator started. Press Ctrl+C to stop.\n")

    // Start sync loop
    const syncLoop = async () => {
      if (this.isRunning) {
        await this.syncWithServer()
        setTimeout(syncLoop, this.syncInterval)
      }
    }

    syncLoop()
  }

  stop() {
    console.log("\n🛑 Stopping ESP32 simulator...")
    this.isRunning = false
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  if (simulator) {
    simulator.stop()
  }
  process.exit(0)
})

process.on("SIGTERM", () => {
  if (simulator) {
    simulator.stop()
  }
  process.exit(0)
})

// Start the simulator
const deviceId = process.argv[2] || "ESP32-001"
const serverUrl = process.argv[3] || "http://localhost:5000/api"

const simulator = new ESP32Simulator(deviceId, serverUrl)
simulator.start()
