import React from 'react';

const ZoneCard = ({ zone, onSendCommand }) => {
  const { zoneId, zoneName, threshold, isActive, latestData } = zone;
  
  const getMoistureColor = (moisture, threshold) => {
    if (!moisture) return 'text-gray-400';
    if (moisture < threshold) return 'text-red-600';
    if (moisture < threshold + 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTemperatureColor = (temp) => {
    if (!temp) return 'text-gray-400';
    if (temp < 15) return 'text-blue-600';
    if (temp > 35) return 'text-red-600';
    return 'text-green-600';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No data';
    return new Date(timestamp).toLocaleString();
  };

  const handleCommand = (commandType, parameters = {}) => {
    onSendCommand({
      zoneId,
      commandType,
      parameters
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {zoneName} (Zone {zoneId})
        </h3>
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}
            title={isActive ? 'Active' : 'Inactive'}
          ></div>
          <span className="text-sm text-gray-500">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {latestData ? (
        <div className="space-y-4">
          {/* Sensor Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Soil Moisture</div>
              <div className={`text-2xl font-bold ${getMoistureColor(latestData.sensorData.soilMoisture, threshold)}`}>
                {latestData.sensorData.soilMoisture?.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                Threshold: {threshold}%
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Temperature</div>
              <div className={`text-2xl font-bold ${getTemperatureColor(latestData.sensorData.temperature)}`}>
                {latestData.sensorData.temperature?.toFixed(1)}°C
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Humidity</div>
              <div className="text-2xl font-bold text-blue-600">
                {latestData.sensorData.humidity?.toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Pressure</div>
              <div className="text-2xl font-bold text-purple-600">
                {latestData.sensorData.pressure?.toFixed(0)} hPa
              </div>
            </div>
          </div>

          {/* Irrigation Status */}
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Irrigation Status</div>
                <div className={`text-lg font-semibold ${
                  latestData.irrigationStatus.isIrrigating ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {latestData.irrigationStatus.isIrrigating ? '💧 Irrigating' : '🚿 Stopped'}
                </div>
                {latestData.irrigationStatus.isIrrigating && (
                  <div className="text-sm text-gray-500">
                    Duration: {latestData.irrigationStatus.duration}s
                    {latestData.irrigationStatus.reason && (
                      <span> • Reason: {latestData.irrigationStatus.reason}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleCommand('irrigate', { duration: 300, force: true })}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
              disabled={!isActive}
            >
              💧 Irrigate (5min)
            </button>
            
            <button
              onClick={() => handleCommand('stop')}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              disabled={!isActive}
            >
              🛑 Stop
            </button>
          </div>

          {/* Last Update */}
          <div className="text-xs text-gray-500 text-center">
            Last update: {formatTimestamp(latestData.timestamp)}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <div>No sensor data available</div>
          <div className="text-sm">Waiting for ESP32 to sync...</div>
        </div>
      )}
    </div>
  );
};

export default ZoneCard;