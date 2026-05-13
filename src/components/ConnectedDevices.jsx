import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Wifi,
  Router,
  Network,
  Monitor,
  Shield,
  Power,
  Settings,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  Activity,
  Check,
  Ban,
  ShieldCheck,
  PowerOff,
  X,
  ShieldOff
} from 'lucide-react';

const API_BASE = '/api';

const deviceIcons = {
  router: Router,
  switch: Network,
  server: Server,
  client: Monitor,
  firewall: Shield
};

const deviceColors = {
  router: 'text-blue-500',
  switch: 'text-green-500',
  server: 'text-purple-500',
  client: 'text-orange-500',
  firewall: 'text-red-500'
};

export default function ConnectedDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [scanning, setScanning] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDevices(data.devices || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (action, device) => {
    switch (action) {
      case 'configure':
        setSelectedDevice(device);
        setShowDetailsModal(true);
        break;
      case 'reboot':
        if (confirm(`Reboot ${device.name}?`)) {
          alert(`${device.name} is rebooting...`);
          fetchDevices();
        }
        break;
      case 'disable':
        if (confirm(`Disable ${device.name}?`)) {
          alert(`${device.name} has been disabled.`);
          fetchDevices();
        }
        break;
      case 'delete':
        if (confirm(`Delete ${device.name} permanently?`)) {
          alert(`${device.name} deleted.`);
          fetchDevices();
        }
        break;
      case 'scan':
        setSelectedDevice(device);
        setShowDetailsModal(true);
        break;
      case 'remove':
        handleRemove(device);
        break;
      case 'toggleBlacklist':
        handleToggleBlacklist(device);
        break;
      case 'toggleWhitelist':
        handleToggleWhitelist(device);
        break;
      default:
        break;
    }
  };

  const handleRemove = async (device) => {
    if (!confirm(`Disconnect and remove ${device.name}? This will delete all connections involving this device.`)) return;

    try {
      const res = await fetch(`${API_BASE}/devices/${device.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to remove device')
      }
      alert(`${device.name} has been removed`);
      fetchDevices()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleToggleBlacklist = async (device) => {
    const isRemoving = device.isBlacklisted
    const confirmMsg = isRemoving
      ? `Remove ${device.name} from blacklist?`
      : `Add ${device.name} to blacklist? The device will be blocked from connecting.`

    if (!confirm(confirmMsg)) return;

    try {
      const method = isRemoving ? 'DELETE' : 'POST'
      const res = await fetch(`${API_BASE}/devices/${device.id}/blacklist`, { method, headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${isRemoving ? 'remove from blacklist' : 'blacklist'} device`)
      }
      alert(`${device.name} has been ${isRemoving ? 'removed from blacklist' : 'blacklisted'}`);
      fetchDevices()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleToggleWhitelist = async (device) => {
    const isRemoving = device.isWhitelisted
    const confirmMsg = isRemoving
      ? `Remove ${device.name} from whitelist?`
      : `Add ${device.name} to whitelist? This will override any existing blacklist.`

    if (!confirm(confirmMsg)) return;

    try {
      const method = isRemoving ? 'DELETE' : 'POST'
      const res = await fetch(`${API_BASE}/devices/${device.id}/whitelist`, { method, headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${isRemoving ? 'remove from whitelist' : 'whitelist'} device`)
      }
      alert(`${device.name} has been ${isRemoving ? 'removed from whitelist' : 'whitelisted'}`);
      fetchDevices()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const activeDevices = devices.filter(d => d.status === 'active');
  const inactiveDevices = devices.filter(d => d.status !== 'active');
  const activeCount = activeDevices.length;

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <p className="text-red-500 font-medium mb-2">Failed to load devices</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={fetchDevices}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Connected Devices</h2>
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (updated: {lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {activeCount} active / {devices.length} total devices
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
          >
            <Plus size={16} />
            Add Device
          </button>
        </div>
      </div>

      {/* No devices state */}
      {devices.length === 0 && !error && (
        <div className="text-center py-12 glass-card">
          <Server size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No devices configured yet.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            Add Your First Device
          </button>
        </div>
      )}

      {/* Active Devices */}
      {activeCount > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Active Devices
          </h3>
          <div className="grid gap-3">
            {activeDevices.map((device, index) => {
              const Icon = deviceIcons[device.type] || Server;
              const colorClass = deviceColors[device.type] || 'text-gray-500';

               return (
                 <motion.div
                   key={device.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: index * 0.05 }}
                   className="glass-card p-4"
                 >
                   <div className="flex items-start justify-between">
                     <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-xl bg-current/10 ${colorClass}`}>
                         <Icon size={24} />
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <h4 className="font-semibold">{device.name}</h4>
                           <span className={`px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-600 dark:text-green-400`}>
                             {device.type}
                           </span>
                           {device.isBlacklisted && (
                             <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-1">
                               <Ban size={12} /> Blacklisted
                             </span>
                           )}
                           {device.isWhitelisted && !device.isBlacklisted && (
                             <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                               <ShieldCheck size={12} /> Whitelisted
                             </span>
                           )}
                           {device.risk && (
                             <span className={`px-2 py-0.5 text-xs rounded-full ${
                               device.risk === 'high' ? 'bg-red-500/20 text-red-600' :
                               device.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                               'bg-green-500/20 text-green-600'
                             }`}>
                               {device.risk}
                             </span>
                           )}
                         </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                          <p>IP: {device.ip || 'N/A'} {device.mac && `• MAC: ${device.mac}`}</p>
                          <p>{device.vendor} {device.model && `• ${device.model}`}</p>
                          <p>OS: {device.os || 'Unknown'}</p>
                          <p className="truncate max-w-[200px]">Ports: {device.openPorts?.join(', ') || 'None'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleAction('configure', device)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Configure"
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => handleAction('reboot', device)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                        title="Reboot"
                      >
                        <Power size={18} />
                      </button>
                      <button
                        onClick={() => handleAction('disable', device)}
                        className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition"
                        title="Disable"
                      >
                        <Wifi size={18} />
                      </button>
                      <button
                        onClick={() => handleAction('remove', device)}
                        className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition"
                        title="Remove/Disconnect"
                      >
                        <PowerOff size={18} />
                      </button>
                      <button
                        onClick={() => handleAction('toggleBlacklist', device)}
                        className={`p-2 rounded-lg transition ${device.isBlacklisted ? 'bg-red-500/10 text-red-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title={device.isBlacklisted ? 'Remove from Blacklist' : 'Add to Blacklist'}
                      >
                        {device.isBlacklisted ? <X size={18} /> : <Ban size={18} />}
                      </button>
                      <button
                        onClick={() => handleAction('toggleWhitelist', device)}
                        className={`p-2 rounded-lg transition ${device.isWhitelisted ? 'bg-blue-500/10 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title={device.isWhitelisted ? 'Remove from Whitelist' : 'Add to Whitelist'}
                      >
                        {device.isWhitelisted ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                      </button>
                      <button
                        onClick={() => handleAction('delete', device)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive Devices */}
      {inactiveDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Inactive Devices
          </h3>
          <div className="grid gap-3">
            {inactiveDevices.map((device, index) => {
              const Icon = deviceIcons[device.type] || Server;
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-4 opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gray-500/10 text-gray-500">
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{device.name}</h4>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-600">
                            {device.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">IP: {device.ip || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
       )}

      {/* Device Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{selectedDevice.name}</h3>
                  <p className="text-sm text-gray-500">{selectedDevice.type} • {selectedDevice.status}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Network Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">IP Address</span>
                          <span className="font-mono">{selectedDevice.ip || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">MAC Address</span>
                          <span className="font-mono text-xs">{selectedDevice.mac || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Connections</span>
                          <span>{selectedDevice.connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Latency</span>
                          <span>{selectedDevice.latency} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Max Bandwidth</span>
                          <span>{selectedDevice.bandwidth} Mbps</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Device Identity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Vendor</span>
                          <span>{selectedDevice.vendor || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Model</span>
                          <span>{selectedDevice.model || 'Generic'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Operating System</span>
                          <span>{selectedDevice.os || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            selectedDevice.risk === 'high' ? 'bg-red-500/20 text-red-600' :
                            selectedDevice.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-green-500/20 text-green-600'
                          }`}>
                            {selectedDevice.risk?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security & Access Control */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Access Control</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Blacklist Status</span>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                            selectedDevice.isBlacklisted
                              ? 'bg-red-500/20 text-red-600'
                              : 'bg-gray-500/20 text-gray-600'
                          }`}>
                            {selectedDevice.isBlacklisted ? <><Ban size={12} /> Blacklisted</> : 'Not Blacklisted'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Whitelist Status</span>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                            selectedDevice.isWhitelisted
                              ? 'bg-blue-500/20 text-blue-600'
                              : 'bg-gray-500/20 text-gray-600'
                          }`}>
                            {selectedDevice.isWhitelisted ? <><ShieldCheck size={12} /> Whitelisted</> : 'Not Whitelisted'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">MAC Address</span>
                          <span className="font-mono text-xs">{selectedDevice.mac || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                {/* Open Ports */}
                <div>
                  <h4 className="font-semibold mb-2">Open Ports & Services</h4>
                  <div className="space-y-2">
                    {selectedDevice.openPorts && selectedDevice.openPorts.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedDevice.openPorts.map(port => {
                          const service = {
                            22: 'SSH',
                            23: 'Telnet',
                            25: 'SMTP',
                            53: 'DNS',
                            80: 'HTTP',
                            110: 'POP3',
                            143: 'IMAP',
                            443: 'HTTPS',
                            3306: 'MySQL',
                            8080: 'HTTP-Alt',
                            9200: 'Elasticsearch',
                            161: 'SNMP',
                            199: 'Cisco SNMP',
                            514: 'Syslog',
                            3978: 'Palo Alto',
                            444: 'PAN-OS'
                          }[port] || 'Unknown';

                          const riskColor = port === 23 || port === 22 ? 'text-yellow-600' : 'text-gray-600';

                          return (
                            <div key={port} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                              <span className="font-mono text-sm">{port}</span>
                              <span className={`text-xs ${riskColor}`}>{service}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No open ports detected</p>
                    )}
                   </div>

                   {/* Security Scan Section */}
                   <div className="mt-6">
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="font-semibold">Security Scan</h4>
                       <button
                         onClick={() => {
                           // Simulate vulnerability scan
                           setScanning(true);
                           setTimeout(() => setScanning(false), 2000);
                         }}
                         disabled={scanning}
                         className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-600 rounded-lg text-sm hover:bg-red-500/30 disabled:opacity-50"
                       >
                         {scanning ? (
                           <>
                             <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                             Scanning...
                           </>
                         ) : (
                           <>
                             <Activity size={14} /> Scan Now
                           </>
                        )}
                       </button>
                     </div>

                     {scanning ? (
                       <div className="text-center py-8">
                         <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-3" />
                         <p className="text-sm text-gray-600 dark:text-gray-400">Scanning {selectedDevice.name} for vulnerabilities...</p>
                       </div>
                     ) : (
                       <div className="space-y-2">
                         {/* Simulated vulnerabilities based on risk */}
                         {selectedDevice.risk === 'high' && (
                           <>
                             <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                               <span className="text-red-700 dark:text-red-400">Critical: Telnet enabled on port 23</span>
                               <button className="text-red-600 underline text-xs">Fix</button>
                             </div>
                             <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                               <span className="text-red-700 dark:text-red-400">Default credentials detected</span>
                               <button className="text-red-600 underline text-xs">Fix</button>
                             </div>
                           </>
                         )}
                         {selectedDevice.risk === 'medium' && (
                           <>
                             <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                               <span className="text-yellow-700 dark:text-yellow-400">Outdated software version</span>
                               <button className="text-yellow-600 underline text-xs">Update</button>
                             </div>
                             <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                               <span className="text-blue-700 dark:text-blue-400">SSH root login allowed</span>
                               <button className="text-blue-600 underline text-xs">Configure</button>
                             </div>
                           </>
                         )}
                         {selectedDevice.risk === 'low' && (
                           <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                             <span className="text-green-700 dark:text-green-400">No vulnerabilities found</span>
                             <Check size={16} className="text-green-600" />
                           </div>
                         )}
                       </div>
                     )}
                    </div>
                </div>

                     {/* Quick Actions */}
                    <div className="mt-6">
                     <h4 className="font-semibold mb-2">Quick Actions</h4>
                     <div className="flex flex-wrap gap-2">
                       <button
                         onClick={() => { setShowDetailsModal(false); handleAction('reboot', selectedDevice); }}
                         className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-600 rounded-lg text-sm hover:bg-blue-500/30"
                       >
                         <Power size={14} /> Reboot
                       </button>
                       <button
                         onClick={() => { setShowDetailsModal(false); handleAction('disable', selectedDevice); }}
                         className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-600 rounded-lg text-sm hover:bg-yellow-500/30"
                       >
                         <Wifi size={14} /> Disable
                       </button>
                       <button
                         onClick={() => { setShowDetailsModal(false); handleAction('remove', selectedDevice); }}
                         className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/20 text-orange-600 rounded-lg text-sm hover:bg-orange-500/30"
                       >
                         <PowerOff size={14} /> Remove
                       </button>
                       <button
                         onClick={() => { setShowDetailsModal(false); handleAction('toggleBlacklist', selectedDevice); }}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                           selectedDevice.isBlacklisted
                             ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
                             : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                         }`}
                       >
                          {selectedDevice.isBlacklisted ? <X size={14} /> : <Ban size={14} />}
                         {selectedDevice.isBlacklisted ? 'Unblacklist' : 'Blacklist'}
                       </button>
                       <button
                         onClick={() => { setShowDetailsModal(false); handleAction('toggleWhitelist', selectedDevice); }}
                         className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                           selectedDevice.isWhitelisted
                             ? 'bg-blue-500/20 text-blue-600 hover:bg-blue-500/30'
                             : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
                         }`}
                       >
                         {selectedDevice.isWhitelisted ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                         {selectedDevice.isWhitelisted ? 'Unwhitelist' : 'Whitelist'}
                       </button>
                       <button
                         onClick={() => { setShowDetailsModal(false); handleAction('delete', selectedDevice); }}
                         className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-600 rounded-lg text-sm hover:bg-red-500/30"
                       >
                         <Trash2 size={14} /> Delete
                       </button>
                     </div>
                    </div>
                 </div>
                </div>

               <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">Add New Device</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Device Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Server-2"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Device Type</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="router">Router</option>
                    <option value="switch">Switch</option>
                    <option value="server">Server</option>
                    <option value="client">Client</option>
                    <option value="firewall">Firewall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IP Address</label>
                  <input
                    type="text"
                    placeholder="e.g., 192.168.1.100"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Device added (simulation mode)');
                      setShowAddModal(false);
                      fetchDevices();
                    }}
                    className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
                  >
                    Add Device
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
