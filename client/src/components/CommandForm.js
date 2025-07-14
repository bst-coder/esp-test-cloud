import React, { useState } from 'react';

const CommandForm = ({ device, onSendCommand, onClose }) => {
  const [formData, setFormData] = useState({
    zoneId: device?.zones?.[0]?.zoneId || 1,
    commandType: 'irrigate',
    duration: 300,
    newThreshold: 30,
    force: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const command = {
        zoneId: parseInt(formData.zoneId),
        commandType: formData.commandType,
        parameters: {}
      };

      // Add parameters based on command type
      if (formData.commandType === 'irrigate') {
        command.parameters.duration = parseInt(formData.duration);
        command.parameters.force = formData.force;
      } else if (formData.commandType === 'config_update') {
        command.parameters.newThreshold = parseInt(formData.newThreshold);
      }

      await onSendCommand(command);
      onClose();
    } catch (error) {
      console.error('Failed to send command:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!device) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Send Manual Command
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device Info */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600">Device</div>
            <div className="font-semibold">{device.name}</div>
            <div className="text-sm text-gray-500">{device.deviceId}</div>
          </div>

          {/* Zone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone
            </label>
            <select
              name="zoneId"
              value={formData.zoneId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {device.zones?.map(zone => (
                <option key={zone.zoneId} value={zone.zoneId}>
                  Zone {zone.zoneId} - {zone.name}
                </option>
              ))}
            </select>
          </div>

          {/* Command Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Command Type
            </label>
            <select
              name="commandType"
              value={formData.commandType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="irrigate">💧 Start Irrigation</option>
              <option value="stop">🛑 Stop Irrigation</option>
              <option value="config_update">⚙️ Update Threshold</option>
              <option value="emergency_stop">🚨 Emergency Stop All</option>
            </select>
          </div>

          {/* Conditional Parameters */}
          {formData.commandType === 'irrigate' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="30"
                  max="3600"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {Math.floor(formData.duration / 60)}m {formData.duration % 60}s
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="force"
                  checked={formData.force}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Force irrigation (ignore moisture threshold)
                </label>
              </div>
            </>
          )}

          {formData.commandType === 'config_update' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Moisture Threshold (%)
              </label>
              <input
                type="number"
                name="newThreshold"
                value={formData.newThreshold}
                onChange={handleChange}
                min="10"
                max="80"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Current threshold: {device.zones?.find(z => z.zoneId === parseInt(formData.zoneId))?.moistureThreshold}%
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Command'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommandForm;