const mongoose = require("mongoose")

const commandSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  zoneId: { type: Number, required: true },
  commandType: {
    type: String,
    enum: ["irrigate", "stop", "config_update", "emergency_stop"],
    required: true,
  },
  parameters: {
    duration: { type: Number, default: 0 }, // seconds
    force: { type: Boolean, default: false },
    newThreshold: { type: Number, default: null },
  },
  status: {
    type: String,
    enum: ["pending", "delivered", "executed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date, default: null },
  executedAt: { type: Date, default: null },
  createdBy: { type: String, default: "system" }, // 'system' or 'user'
})

// Index for efficient queries
commandSchema.index({ deviceId: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model("Command", commandSchema)
