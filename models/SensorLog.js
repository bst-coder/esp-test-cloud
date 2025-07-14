const mongoose = require("mongoose")

const sensorLogSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  zoneId: { type: Number, required: true },
  sensorData: {
    soilMoisture: { type: Number, required: true }, // Percentage
    temperature: { type: Number, required: true }, // Celsius
    humidity: { type: Number, required: true }, // Percentage
    pressure: { type: Number, required: true }, // hPa
    lightLevel: { type: Number, default: 0 }, // Lux
  },
  irrigationStatus: {
    isIrrigating: { type: Boolean, default: false },
    duration: { type: Number, default: 0 }, // seconds
    reason: { type: String, enum: ["threshold", "manual", "schedule", "none"], default: "none" },
  },
  timestamp: { type: Date, default: Date.now },
})

// Index for efficient queries
sensorLogSchema.index({ deviceId: 1, timestamp: -1 })
sensorLogSchema.index({ deviceId: 1, zoneId: 1, timestamp: -1 })

module.exports = mongoose.model("SensorLog", sensorLogSchema)
