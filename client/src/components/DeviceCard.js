import React from 'react';

const DeviceCard = ({ device, onSelectDevice, isSelected }) => {
  const getStatusColor = (isOnline, lastSeen) => {
    if (!isOnline) return 'bg-red-500';
    
    const lastSeenTime = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenTime) / (1000 * 60);
    
    if (diffMinutes < 2) return 'bg-green-500';
    if (diffMinutes < 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatLastSeen = (lastSeen) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border border-gray-200'
      }`}
      onClick={() => onSelectDevice(device)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{device.name}</h3>
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${getStatusColor(device.isOnline, device.lastSeen)}`}
            title={device.isOnline ? 'Online' : 'Offline'}
          ></div>
          <span className="text-sm text-gray-500">
            {device.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Device ID:</span>
          <span className="font-mono text-gray-800">{device.deviceId}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Location:</span>
          <span className="text-gray-800">{device.location || 'Unknown'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Zones:</span>
          <span className="text-gray-800">{device.zones?.length || 0}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last Seen:</span>
          <span className="text-gray-800">{formatLastSeen(device.lastSeen)}</span>
        </div>
      </div>
      
      {device.configuration?.emergencyShutoff && (
        <div className="mt-3 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md">
          🚨 Emergency Shutoff Active
        </div>
      )}
    </div>
  );
};

export default DeviceCard;