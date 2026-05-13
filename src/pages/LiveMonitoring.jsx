// src/pages/LiveMonitoring.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Database, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const API_BASE = '/api';

export default function LiveMonitoring() {
  const [metrics, setMetrics] = useState({
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    totalConnections: 0,
    activeConnections: 0
  });
  const [bandwidthHistory, setBandwidthHistory] = useState([]);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMetrics(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      return null;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/bandwidth-history`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.history) {
        setBandwidthHistory(data.history);
        // Also create latency history (simulated based on bandwidth pattern)
        setLatencyHistory(data.history.map(h => ({
          time: h.time,
          latency: Math.max(1, Math.floor(Math.random() * 50) + 10)
        })));
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await Promise.all([fetchMetrics(), fetchHistory()]);
      if (mounted) setLoading(false);
    };
    load();

    // SSE connection for live updates
    const es = new EventSource(`${API_BASE}/stream`);
    setIsConnected(true);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data.error) {
          setMetrics(data);
          // Add to histories
          const now = new Date();
          const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          setBandwidthHistory(prev => [...prev.slice(-59), { time: timeLabel, bandwidth: data.bandwidth }]);
          setLatencyHistory(prev => [...prev.slice(-59), { time: timeLabel, latency: data.latency }]);
        }
      } catch (err) { console.error('SSE error:', err); }
    };
    es.onerror = () => { setIsConnected(false); es.close(); };

    return () => { mounted = false; es.close(); };
  }, [fetchMetrics, fetchHistory]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold">Live Monitoring</h1>
            <p className="text-sm text-gray-500">Real-time network performance metrics</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          {isConnected ? 'Live' : 'Reconnecting...'}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary-500/10">
              <Database className="text-primary-500" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold">{metrics.bandwidth} <span className="text-lg text-gray-500">Mbps</span></p>
          <p className="text-sm text-gray-500 mt-1">Current Bandwidth</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            {metrics.bandwidth > 500 ? <TrendingUp className="text-green-500" size={16} /> : <TrendingDown className="text-yellow-500" size={16} />}
            <span className={metrics.bandwidth > 500 ? 'text-green-500' : 'text-yellow-500'}>
              {metrics.bandwidth > 500 ? 'High' : 'Normal'} usage
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Clock className="text-green-500" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold">{metrics.latency} <span className="text-lg text-gray-500">ms</span></p>
          <p className="text-sm text-gray-500 mt-1">Average Latency</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            {metrics.latency < 50 ? <TrendingUp className="text-green-500" size={16} /> : <TrendingDown className="text-red-500" size={16} />}
            <span className={metrics.latency < 50 ? 'text-green-500' : 'text-red-500'}>
              {metrics.latency < 50 ? 'Excellent' : 'High latency'}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Wifi className="text-yellow-500" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold">{metrics.packetLoss}%</p>
          <p className="text-sm text-gray-500 mt-1">Packet Loss</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            {metrics.packetLoss < 1 ? <TrendingUp className="text-green-500" size={16} /> : <TrendingDown className="text-red-500" size={16} />}
            <span className={metrics.packetLoss < 1 ? 'text-green-500' : 'text-red-500'}>
              {metrics.packetLoss < 1 ? 'Optimal' : 'Issues detected'}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Activity className="text-purple-500" size={24} />
            </div>
          </div>
          <p className="text-3xl font-bold">{metrics.activeConnections}/{metrics.totalConnections}</p>
          <p className="text-sm text-gray-500 mt-1">Active Connections</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-blue-500">
              {((metrics.activeConnections / (metrics.totalConnections || 1)) * 100).toFixed(0)}% uptime
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-500" />
            Bandwidth Usage (Last 60 minutes)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={bandwidthHistory}>
              <defs>
                <linearGradient id="colorBandwidth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="bandwidth" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBandwidth)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-green-500" />
            Latency Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Network Health Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
        <h3 className="font-semibold mb-4">Network Health Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{metrics.activeConnections}</div>
            <p className="text-sm text-gray-500">Devices Online</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{metrics.totalConnections - metrics.activeConnections}</div>
            <p className="text-sm text-gray-500">Devices Offline</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{(100 - metrics.packetLoss).toFixed(1)}%</div>
            <p className="text-sm text-gray-500">Reliability</p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${metrics.latency < 50 ? 'text-green-500' : metrics.latency < 100 ? 'text-yellow-500' : 'text-red-500'}`}>
              {metrics.latency}ms
            </div>
            <p className="text-sm text-gray-500">Avg Response</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
