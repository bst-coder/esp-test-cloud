const mongoose = require("mongoose")

const zoneSchema = new mongoose.Schema({
  zoneId: { type: Number, required: true },
  name: { type: String, required: true },
  moistureThreshold: { type: Number, default: 30 }, // Percentage
  isActive: { type: Boolean, default: true },
  lastIrrigation: { type: Date, default: null },
  irrigationDuration: { type: Number, default: 300 }, // seconds
})

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, default: "" },
  zones: [zoneSchema],
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  configuration: {
    syncInterval: { type: Number, default: 10000 }, // milliseconds
    maxIrrigationTime: { type: Number, default: 600 }, // seconds
    emergencyShutoff: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

deviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model("Device", deviceSchema)
