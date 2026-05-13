// src/pages/RouterAdmin.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Router, Wifi, Shield, ShieldOff, Trash2,
  PowerOff, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Search, Sliders,
  Network, Server, Monitor, Ban
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = '/api';

const deviceTypeIcons = {
  router: Router,
  switch: Network,
  server: Server,
  pc: Monitor,
  firewall: Shield,
  ap: Wifi,
};

const deviceTypeLabels = {
  router: 'Router',
  switch: 'Switch',
  server: 'Server',
  pc: 'PC',
  firewall: 'Firewall',
  ap: 'Access Point',
};

export default function RouterAdmin() {
  const [devices, setDevices] = useState([]);
  const [routers, setRouters] = useState([]);
  const [selectedRouter, setSelectedRouter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/devices`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const allDevices = data.devices || [];
      setDevices(allDevices);

      // Extract routers from devices
      const routerDevices = allDevices.filter(d => d.type === 'router');
      setRouters(routerDevices);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      toast.error('Failed to load devices');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const performAction = async (deviceId, action, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;

    setActionLoading(prev => ({ ...prev, [deviceId]: action }));
    try {
      let res;
      switch (action) {
        case 'remove':
          res = await fetch(`${API_BASE}/devices/${deviceId}`, { method: 'DELETE' });
          break;
        case 'blacklist':
          res = await fetch(`${API_BASE}/devices/${deviceId}/blacklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Admin action' }),
          });
          break;
        case 'unblacklist':
          res = await fetch(`${API_BASE}/devices/${deviceId}/blacklist`, { method: 'DELETE' });
          break;
        case 'whitelist':
          res = await fetch(`${API_BASE}/devices/${deviceId}/whitelist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          break;
        case 'unwhitelist':
          res = await fetch(`${API_BASE}/devices/${deviceId}/whitelist`, { method: 'DELETE' });
          break;
        case 'disable':
        case 'enable':
          // Toggle status by removing and re-adding conceptually
          // We simulate via blacklist for disable, whitelist for enable
          if (action === 'disable') {
            res = await fetch(`${API_BASE}/devices/${deviceId}/blacklist`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Disabled by admin' }),
            });
          } else {
            res = await fetch(`${API_BASE}/devices/${deviceId}/blacklist`, { method: 'DELETE' });
          }
          break;
        default:
          return;
      }

      if (res && !res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Action failed: ${res.status}`);
      }

      toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} action completed`);
      fetchDevices();
    } catch (err) {
      toast.error(`Failed to ${action}: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [deviceId]: null }));
    }
  };

  // Filter connected devices for selected router
  const connectedDevices = selectedRouter === 'all'
    ? devices.filter(d => d.type !== 'router')
    : devices.filter(d => d.type !== 'router'); // In real scenario, filter by router association

  // Apply status filter
  const filteredByStatus = filterStatus === 'all'
    ? connectedDevices
    : connectedDevices.filter(d => d.status === filterStatus);

  // Apply search filter
  const filteredBySearch = filteredByStatus.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.mac?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const map = {
      active: { bg: 'bg-green-500/20 text-green-600 dark:text-green-400', icon: <CheckCircle size={12} /> },
      inactive: { bg: 'bg-red-500/20 text-red-600 dark:text-red-400', icon: <XCircle size={12} /> },
      warning: { bg: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400', icon: <AlertTriangle size={12} /> },
      critical: { bg: 'bg-red-600/20 text-red-500 dark:text-red-400', icon: <XCircle size={12} /> },
    };
    return map[status] || map.inactive;
  };

  const getRiskBadge = (risk) => {
    const map = {
      low: 'bg-green-500/20 text-green-600 dark:text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      high: 'bg-red-500/20 text-red-600 dark:text-red-400',
      critical: 'bg-red-600/20 text-red-500 dark:text-red-400',
    };
    return map[risk] || 'bg-gray-500/20 text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Router Admin Panel</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Manage devices connected to your routers — blacklist, whitelist, remove, or disable connections
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Devices</span>
            <Router className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-1">{devices.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Routers</span>
            <Network className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-1">{routers.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold mt-1">{devices.filter(d => d.status === 'active').length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Blacklisted</span>
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold mt-1">{devices.filter(d => d.isBlacklisted).length}</p>
        </div>
      </div>

      {/* Router Selector */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Router className="w-5 h-5 text-blue-500" />
            <label className="text-sm font-medium whitespace-nowrap">Select Router:</label>
          </div>
          <select
            value={selectedRouter}
            onChange={(e) => setSelectedRouter(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
          >
            <option value="all">All Routers ({routers.length})</option>
            {routers.map(router => (
              <option key={router.id} value={router.id}>
                {router.name} ({router.ip})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredBySearch.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 glass-card"
            >
              <Wifi className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {searchQuery || filterStatus !== 'all'
                  ? 'No devices match your filters'
                  : 'No devices found. Connect a router to get started.'}
              </p>
            </motion.div>
          ) : (
            filteredBySearch.map((device, index) => {
              const Icon = deviceTypeIcons[device.type] || Server;
              const statusBadge = getStatusBadge(device.status);
              const isLoading = actionLoading[device.id];

              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card p-5 border-l-4 transition-all ${
                    device.isBlacklisted
                      ? 'border-red-500 bg-red-500/5'
                      : device.status === 'active'
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {/* Device Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${
                        device.isBlacklisted
                          ? 'bg-red-500/10 text-red-500'
                          : device.status === 'active'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {device.name}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${statusBadge.bg}`}>
                            {statusBadge.icon} {device.status}
                          </span>
                          {device.isBlacklisted && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-1">
                              <Ban size={10} /> Blacklisted
                            </span>
                          )}
                          {device.isWhitelisted && !device.isBlacklisted && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Shield size={10} /> Whitelisted
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-mono">{device.ip}</span>
                          <span>•</span>
                          <span className="font-mono">{device.mac || 'N/A'}</span>
                          <span>•</span>
                          <span>{device.vendor || 'Unknown'} {device.model}</span>
                          <span>•</span>
                          <span>{device.type}</span>
                        </div>
                        {device.openPorts && (
                          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            Open Ports: <span className="font-mono">{device.openPorts.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-start gap-1 ml-4 flex-shrink-0">
                      {/* Blacklist / Unblacklist */}
                      {device.isBlacklisted ? (
                        <button
                          onClick={() => performAction(device.id, 'unblacklist', `Remove ${device.name} from blacklist?`)}
                          disabled={!!isLoading}
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition disabled:opacity-50"
                          title="Remove from Blacklist"
                        >
                          {isLoading === 'unblacklist' ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Unlock size={16} />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => performAction(device.id, 'blacklist', `Blacklist ${device.name}? This will block their connection.`)}
                          disabled={!!isLoading}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                          title="Blacklist Device"
                        >
                          {isLoading === 'blacklist' ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Ban size={16} />
                          )}
                        </button>
                      )}

                      {/* Whitelist / Unwhitelist */}
                      {device.isWhitelisted ? (
                        <button
                          onClick={() => performAction(device.id, 'unwhitelist', `Remove ${device.name} from whitelist?`)}
                          disabled={!!isLoading}
                          className="p-2 text-yellow-600 hover:bg-yellow-500/10 rounded-lg transition disabled:opacity-50"
                          title="Remove from Whitelist"
                        >
                          {isLoading === 'unwhitelist' ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <ShieldOff size={16} />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => performAction(device.id, 'whitelist', `Whitelist ${device.name}? This will allow their connection.`)}
                          disabled={!!isLoading}
                          className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition disabled:opacity-50"
                          title="Whitelist Device"
                        >
                          {isLoading === 'whitelist' ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Shield size={16} />
                          )}
                        </button>
                      )}

                      {/* Remove / Delete */}
                      <button
                        onClick={() => performAction(device.id, 'remove', `Permanently remove ${device.name} from the network? This will delete all connections.`)}
                        disabled={!!isLoading}
                        className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition disabled:opacity-50"
                        title="Remove Device"
                      >
                        {isLoading === 'remove' ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <PowerOff size={16} />
                        )}
                      </button>

                      {/* Delete (Permanent) */}
                      <button
                        onClick={() => performAction(device.id, 'delete', `Delete ${device.name} permanently? This cannot be undone.`)}
                        disabled={!!isLoading}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                        title="Delete Device"
                      >
                        {isLoading === 'delete' ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <h3 className="font-semibold mb-3 text-sm">Action Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Ban size={14} className="text-red-500" />
            <span>Blacklist — Blocks all connections</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-500" />
            <span>Whitelist — Allows connection</span>
          </div>
          <div className="flex items-center gap-2">
            <PowerOff size={14} className="text-orange-500" />
            <span>Remove — Disconnects from router</span>
          </div>
          <div className="flex items-center gap-2">
            <Trash2 size={14} className="text-red-600" />
            <span>Delete — Permanent removal</span>
          </div>
        </div>
      </div>
    </div>
  );
}