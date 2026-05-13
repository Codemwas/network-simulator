// src/pages/NetworkBuilder.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Download, Trash2, RefreshCw, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const deviceTypes = [
  { type: 'router', name: 'Router', icon: '🌐', color: 'bg-blue-500' },
  { type: 'switch', name: 'Switch', icon: '🔌', color: 'bg-green-500' },
  { type: 'server', name: 'Server', icon: '🗄️', color: 'bg-red-500' },
  { type: 'firewall', name: 'Firewall', icon: '🛡️', color: 'bg-yellow-500' },
  { type: 'pc', name: 'PC', icon: '💻', color: 'bg-purple-500' },
  { type: 'ap', name: 'Access Point', icon: '📡', color: 'bg-indigo-500' },
];

const DEVICE_LABELS = {
  router: 'Router',
  switch: 'Switch',
  server: 'Server',
  firewall: 'Firewall',
  pc: 'PC',
  ap: 'Access Point',
};

export default function NetworkBuilder() {
  const [devices, setDevices] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('network-builder-devices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDevices(parsed);
      }
      const savedConn = localStorage.getItem('network-builder-connections');
      if (savedConn) {
        const parsed = JSON.parse(savedConn);
        if (Array.isArray(parsed)) setConnections(parsed);
      }
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
  }, []);

  // Save to localStorage whenever devices/connections change
  useEffect(() => {
    try {
      localStorage.setItem('network-builder-devices', JSON.stringify(devices));
    } catch (e) { /* ignore */ }
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem('network-builder-connections', JSON.stringify(connections));
    } catch (e) { /* ignore */ }
  }, [connections]);

  const getCanvasRect = useCallback(() => {
    return canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
  }, []);

  const addDevice = useCallback((type, clientX, clientY) => {
    const canvasRect = getCanvasRect();
    const x = clientX - canvasRect.left - 40;
    const y = clientY - canvasRect.top - 30;

    const newDevice = {
      id: Date.now() + Math.random(),
      type,
      name: `${DEVICE_LABELS[type] || type}-${devices.length + 1}`,
      x: Math.max(0, x),
      y: Math.max(0, y),
      status: 'online',
      ip: `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`,
      mac: `00:1A:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 256).toString(16).padStart(2, '0')}`,
    };
    setDevices(prev => [...prev, newDevice]);
    toast.success(`${DEVICE_LABELS[type] || type} added to canvas`);
  }, [devices.length, getCanvasRect]);

  const removeDevice = useCallback((deviceId) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    setConnections(prev => prev.filter(c => c.source !== deviceId && c.target !== deviceId));
    if (selectedDevice?.id === deviceId) setSelectedDevice(null);
    toast.success('Device removed');
  }, [selectedDevice]);

  const clearAll = useCallback(() => {
    setDevices([]);
    setConnections([]);
    setSelectedDevice(null);
    setConnectingFrom(null);
    setConnectionMode(false);
    toast.success('Canvas cleared');
  }, []);

  // Handle native drag events on the canvas
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (type && deviceTypes.find(d => d.type === type)) {
      addDevice(type, e.clientX, e.clientY);
    }
  }, [addDevice]);

  // Device dragging within the canvas
  const handleDeviceMouseDown = useCallback((deviceId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasRect = getCanvasRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    const startDeviceX = device.x;
    const startDeviceY = device.y;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setDevices(prev => prev.map(d =>
        d.id === deviceId
          ? { ...d, x: Math.max(0, startDeviceX + dx), y: Math.max(0, startDeviceY + dy) }
          : d
      ));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [devices, getCanvasRect]);

  const toggleConnectionMode = () => {
    setConnectionMode(prev => !prev);
    setConnectingFrom(null);
    toast.info(connectionMode ? 'Connection mode off' : 'Click a device to start a connection');
  };

  const handleDeviceClickForConnection = (device) => {
    if (!connectionMode) {
      setSelectedDevice(device);
      return;
    }

    if (!connectingFrom) {
      setConnectingFrom(device.id);
      toast.info('Now click another device to complete the connection');
    } else if (connectingFrom !== device.id) {
      // Check if connection already exists
      const exists = connections.some(
        c => (c.source === connectingFrom && c.target === device.id) ||
             (c.source === device.id && c.target === connectingFrom)
      );
      if (!exists) {
        const newConnection = {
          id: Date.now(),
          source: connectingFrom,
          target: device.id,
          bandwidth: Math.floor(Math.random() * 800) + 100,
          latency: Math.floor(Math.random() * 30) + 1,
          status: 'up',
        };
        setConnections(prev => [...prev, newConnection]);
        toast.success('Connection created');
      } else {
        toast.error('Connection already exists');
      }
      setConnectingFrom(null);
    }
  };

  const removeConnection = (connId) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
    toast.info('Connection removed');
  };

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      setSelectedDevice(null);
    }
  };

  // Track mouse for temporary connection line while in connection mode
  useEffect(() => {
    if (!connectionMode) return;

    const handleMouseMove = (e) => {
      const rect = getCanvasRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [connectionMode, getCanvasRect]);

  const getDeviceCenter = (device) => ({
    x: device.x + 40,
    y: device.y + 30,
  });

  const renderConnections = () => {
    return connections.map((conn) => {
      const sourceDevice = devices.find(d => d.id === conn.source);
      const targetDevice = devices.find(d => d.id === conn.target);
      if (!sourceDevice || !targetDevice) return null;

      const sourceCenter = getDeviceCenter(sourceDevice);
      const targetCenter = getDeviceCenter(targetDevice);
      const isHighlighted = selectedDevice && (selectedDevice.id === conn.source || selectedDevice.id === conn.target);
      const isActive = conn.status === 'up';

      return (
        <g key={conn.id}>
          <line
            x1={sourceCenter.x}
            y1={sourceCenter.y}
            x2={targetCenter.x}
            y2={targetCenter.y}
            stroke={isHighlighted ? '#3b82f6' : isActive ? '#6b7280' : '#ef4444'}
            strokeWidth={isHighlighted ? 3 : 2}
            strokeDasharray={isActive ? '0' : '6,4'}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Remove this connection?')) {
                removeConnection(conn.id);
              }
            }}
          />
          {/* Bandwidth label on the connection line */}
          <text
            x={(sourceCenter.x + targetCenter.x) / 2}
            y={(sourceCenter.y + targetCenter.y) / 2 - 8}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={10}
            fontFamily="monospace"
          >
            {conn.bandwidth} Mbps / {conn.latency}ms
          </text>
        </g>
      );
    });
  };

  // Temporary line from connecting device to mouse cursor
  const renderTempConnection = () => {
    if (!connectingFrom || !connectionMode) return null;
    const sourceDevice = devices.find(d => d.id === connectingFrom);
    if (!sourceDevice) return null;
    const sourceCenter = getDeviceCenter(sourceDevice);

    return (
      <line
        x1={sourceCenter.x}
        y1={sourceCenter.y}
        x2={mousePos.x}
        y2={mousePos.y}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="5,5"
        className="opacity-60"
      />
    );
  };

  const getDeviceColor = (type) => {
    const map = {
      router: '#3b82f6',
      switch: '#10b981',
      server: '#8b5cf6',
      firewall: '#f59e0b',
      pc: '#f97316',
      ap: '#6366f1',
    };
    return map[type] || '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Network Builder</h1>
          <span className="text-sm text-gray-500">
            {devices.length} device{devices.length !== 1 ? 's' : ''} · {connections.length} link{connections.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleConnectionMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              connectionMode
                ? 'bg-primary-500 text-white'
                : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <LinkIcon size={16} />
            {connectionMode ? 'Connecting...' : 'Connect Devices'}
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <Trash2 size={16} /> Clear All
          </button>
          <button
            onClick={() => {
              const data = { devices, connections };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `network-topology-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success('Topology exported as JSON');
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Download size={16} /> Export JSON
          </button>
        </div>
      </div>

      {/* Device Palette */}
      <div className="flex gap-4 flex-wrap">
        {deviceTypes.map((device) => (
          <div
            key={device.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', device.type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onTouchStart={(e) => {
              // Mobile support: get ready to add on touch
              const touch = e.touches[0];
              const canvasRect = getCanvasRect();
              addDevice(device.type, touch.clientX, touch.clientY);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-grab hover:shadow-md transition-all hover:scale-105 active:cursor-grabbing select-none"
          >
            <div className={`w-9 h-9 ${device.color} rounded-lg flex items-center justify-center text-white text-lg`}>
              {device.icon}
            </div>
            <div>
              <p className="font-medium text-sm">{device.name}</p>
              <p className="text-xs text-gray-400">drag to canvas</p>
            </div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        className={`relative w-full min-h-[500px] rounded-2xl border-2 transition-all overflow-hidden ${
          connectionMode
            ? 'border-primary-500 bg-primary-500/5'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
        }`}
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      >
        {/* SVG layer for connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {renderConnections()}
          {renderTempConnection()}
        </svg>

        {/* Device nodes */}
        {devices.map((device) => {
          const isSelected = selectedDevice?.id === device.id;
          const isConnecting = connectingFrom === device.id;
          const isConnected = connections.some(
            c => c.source === device.id || c.target === device.id
          );

          return (
            <motion.div
              key={device.id}
              className="absolute cursor-move select-none"
              style={{
                left: device.x,
                top: device.y,
                zIndex: isSelected ? 50 : isConnected ? 10 : 1,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onMouseDown={(e) => {
                if (!connectionMode) {
                  handleDeviceMouseDown(device.id, e);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (connectionMode) {
                  handleDeviceClickForConnection(device);
                } else {
                  setSelectedDevice(device);
                }
              }}
            >
              {/* Connection mode highlight ring */}
              {connectionMode && (
                <motion.div
                  className="absolute -inset-2 rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: isConnecting ? 0.6 : 0.2 }}
                  style={{
                    border: `3px solid ${isConnecting ? '#3b82f6' : getDeviceColor(device.type)}`,
                    backgroundColor: isConnecting ? `${getDeviceColor(device.type)}20` : 'transparent',
                  }}
                />
              )}

              {/* Node card */}
              <div
                className={`p-3 rounded-xl shadow-lg border-2 transition-all min-w-[120px] text-center ${
                  isSelected
                    ? 'border-blue-500 bg-white dark:bg-gray-700 ring-2 ring-blue-500/30'
                    : connectionMode
                    ? 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xl'
                }`}
              >
                <div className="text-2xl mb-1">
                  {deviceTypes.find(d => d.type === device.type)?.icon}
                </div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {device.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {device.ip}
                </p>
                {isConnected && (
                  <div className="mt-1 text-[9px] font-medium text-green-500">
                    ● {connections.filter(c => c.source === device.id || c.target === device.id).length} link{connections.filter(c => c.source === device.id || c.target === device.id).length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Delete button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeDevice(device.id);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
              >
                ✕
              </button>
            </motion.div>
          );
        })}

        {/* Empty state */}
        {devices.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
            <Plus size={64} className="opacity-30 mb-4" />
            <p className="text-lg font-medium">Drag devices here to build your network</p>
            <p className="text-sm mt-1">Or click a device type above to add it</p>
            {connectionMode && (
              <p className="text-primary-500 mt-4 text-sm font-medium animate-pulse">
                ↑ Click devices to connect them
              </p>
            )}
          </div>
        )}
      </div>

      {/* Properties Panel */}
      {selectedDevice && (
        <div className="glass-card p-6 max-w-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg">Device Properties</h3>
            <button
              onClick={() => setSelectedDevice(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Name</label>
              <input
                type="text"
                value={selectedDevice.name}
                onChange={(e) => {
                  setDevices(prev =>
                    prev.map(d => d.id === selectedDevice.id ? { ...d, name: e.target.value } : d)
                  );
                  setSelectedDevice(prev => ({ ...prev, name: e.target.value }));
                }}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">IP Address</label>
              <input
                type="text"
                value={selectedDevice.ip}
                onChange={(e) => {
                  setDevices(prev =>
                    prev.map(d => d.id === selectedDevice.id ? { ...d, ip: e.target.value } : d)
                  );
                  setSelectedDevice(prev => ({ ...prev, ip: e.target.value }));
                }}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Status</label>
              <select
                value={selectedDevice.status}
                onChange={(e) => {
                  setDevices(prev =>
                    prev.map(d => d.id === selectedDevice.id ? { ...d, status: e.target.value } : d)
                  );
                  setSelectedDevice(prev => ({ ...prev, status: e.target.value }));
                }}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400">
                MAC: <span className="font-mono">{selectedDevice.mac}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Type: {DEVICE_LABELS[selectedDevice.type] || selectedDevice.type}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Connected Links: {connections.filter(c => c.source === selectedDevice.id || c.target === selectedDevice.id).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}