import React, { useState, useEffect } from 'react';
import { deviceAPI, systemAPI } from '../services/api';
import DeviceCard from './DeviceCard';
import ZoneCard from './ZoneCard';
import CommandForm from './CommandForm';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCommandForm, setShowCommandForm] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Environment-based configuration
  const REFRESH_INTERVAL = parseInt(process.env.REACT_APP_REFRESH_INTERVAL) || 10000;

  // Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
    checkSystemHealth();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchDevices();
      if (selectedDevice) {
        fetchDeviceData(selectedDevice.deviceId);
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [REFRESH_INTERVAL]);

  // Fetch device data when selected device changes
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceData(selectedDevice.deviceId);
    }
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      setDevices(response.data);
      setError(null);
      setLastUpdate(new Date());
      
      // If no device is selected, select the first one
      if (!selectedDevice && response.data.length > 0) {
        setSelectedDevice(response.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceData = async (deviceId) => {
    try {
      const response = await deviceAPI.getDeviceLatest(deviceId);
      setDeviceData(response.data);
    } catch (err) {
      console.error('Error fetching device data:', err);
    }
  };

  const checkSystemHealth = async () => {
    try {
      const response = await systemAPI.healthCheck();
      setSystemStatus(response.data);
    } catch (err) {
      console.error('System health check failed:', err);
    }
  };

  const handleSendCommand = async (command) => {
    if (!selectedDevice) return;

    try {
      await deviceAPI.sendCommand(selectedDevice.deviceId, command);
      
      // Refresh device data after sending command
      setTimeout(() => {
        fetchDeviceData(selectedDevice.deviceId);
      }, 1000);
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error sending command:', err);
      throw err;
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDevices();
    if (selectedDevice) {
      fetchDeviceData(selectedDevice.deviceId);
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🌱 Smart Irrigation Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Status */}
              {systemStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStatus.database === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-gray-600">
                    {systemStatus.database === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              )}
              
              {/* Last Update */}
              <div className="text-sm text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                disabled={loading}
              >
                {loading ? '🔄' : '↻'} Refresh
              </button>
              
              {/* Manual Command Button */}
              {selectedDevice && (
                <button
                  onClick={() => setShowCommandForm(true)}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  📡 Send Command
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Connected Devices ({devices.length})
            </h2>
            
            {devices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-4xl mb-4">📱</div>
                <div className="text-gray-600 mb-2">No devices found</div>
                <div className="text-sm text-gray-500">
                  Start the ESP32 simulator to see devices here
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {devices.map(device => (
                  <DeviceCard
                    key={device.deviceId}
                    device={device}
                    onSelectDevice={setSelectedDevice}
                    isSelected={selectedDevice?.deviceId === device.deviceId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Device Details */}
          <div className="lg:col-span-2">
            {selectedDevice ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedDevice.name} - Zone Status
                  </h2>
                  <div className="text-sm text-gray-500">
                    Device: {selectedDevice.deviceId}
                  </div>
                </div>

                {deviceData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {deviceData.map(zone => (
                      <ZoneCard
                        key={zone.zoneId}
                        zone={zone}
                        onSendCommand={handleSendCommand}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <div className="text-gray-600">Loading zone data...</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-4xl mb-4">🌱</div>
                <div className="text-gray-600 mb-2">Select a device</div>
                <div className="text-sm text-gray-500">
                  Choose a device from the list to view its zones and sensor data
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Form Modal */}
      {showCommandForm && (
        <CommandForm
          device={selectedDevice}
          onSendCommand={handleSendCommand}
          onClose={() => setShowCommandForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;