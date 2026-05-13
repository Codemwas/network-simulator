// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Wifi,
  AlertTriangle,
  Activity,
  Users,
  Clock,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConnectedDevices from '../components/ConnectedDevices';
import NetworkSpeedGauge from '../components/NetworkSpeedGauge';

const API_BASE = '/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    bandwidth: 0,
    latency: 0,
    packetLoss: 0,
    totalConnections: 0,
    activeConnections: 0
  });
  const [bandwidthHistory, setBandwidthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const initializedRef = useRef(false);

   // SSE connection for real-time metrics
   const connectSSE = useCallback(() => {
     if (eventSourceRef.current) {
       eventSourceRef.current.close();
       eventSourceRef.current = null;
     }
     if (pollingIntervalRef.current) {
       clearInterval(pollingIntervalRef.current);
       pollingIntervalRef.current = null;
     }

     const es = new EventSource(`${API_BASE}/stream`);
     eventSourceRef.current = es;

     es.onopen = () => {
       setIsConnected(true);
       setError(null);
     };

     es.onmessage = (event) => {
       try {
         const data = JSON.parse(event.data);
         if (data.error) {
           throw new Error(data.error);
         }
         setMetrics(prev => ({ ...prev, ...data }));
         setError(null);
       } catch (err) {
         console.error('SSE parse error:', err);
       }
     };

     es.onerror = () => {
       setIsConnected(false);
       es.close();

       // Fallback to polling after brief delay
       setTimeout(() => {
         setError(prev => prev ? `${prev} (Using polling fallback)` : 'Real-time connection lost. Using polling fallback...');
         // Start polling every 5 seconds
         pollingIntervalRef.current = setInterval(() => {
           fetchMetrics().catch(console.error);
         }, 5000);
         // Immediate fetch
         fetchMetrics().catch(console.error);
       }, 2000);
     };
   }, []);

   const fetchMetrics = useCallback(async () => {
     try {
       const controller = new AbortController();
       const timeout = setTimeout(() => controller.abort(), 5000);
       const res = await fetch(`${API_BASE}/metrics`, { signal: controller.signal });
       clearTimeout(timeout);
       if (!res.ok) throw new Error(`HTTP ${res.status}`);
       const data = await res.json();
       setMetrics(prev => ({ ...prev, ...data }));
       return true;
     } catch (err) {
       console.error('Failed to load metrics:', err);
       return false;
     }
   }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE}/bandwidth-history`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.history) {
        setBandwidthHistory(data.history);
      }
      return true;
    } catch (err) {
      console.error('Failed to load bandwidth history:', err);
      return false;
    }
  }, []);

  // Initial data load
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      const [metricsOk, historyOk] = await Promise.all([
        fetchMetrics(),
        fetchHistory()
      ]);

      if (mounted) {
        setLoading(false);
        if (!metricsOk && !historyOk) {
          setError('Unable to connect to server. Please check that the API server is running on port 3000.');
        } else if (!metricsOk) {
          setError('Metrics failed to load. Some features may be limited.');
        } else if (!historyOk) {
          // History failure is less critical, just log
          console.error('Bandwidth history failed to load');
        } else {
          setError(null);
        }
      }
    };

    loadInitialData();

    return () => { mounted = false; };
  }, [fetchMetrics, fetchHistory]);

   // SSE real-time connection (starts after initial load)
   useEffect(() => {
     if (loading) return; // Wait until initial load finishes

     connectSSE();

     return () => {
       if (eventSourceRef.current) {
         eventSourceRef.current.close();
       }
       if (pollingIntervalRef.current) {
         clearInterval(pollingIntervalRef.current);
       }
     };
   }, [loading, connectSSE]);

   // Update bandwidth history in real-time (last 24 points sliding window)
  useEffect(() => {
    if (metrics.bandwidth > 0) {
      setBandwidthHistory(prev => {
        const now = new Date();
        const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const newPoint = { time: timeLabel, bandwidth: metrics.bandwidth };

        const updated = [...prev, newPoint];
        return updated.slice(-24); // Keep last 24 points
      });
    }
  }, [metrics.bandwidth]);

   // Derived stats
  const stats = [
    {
      title: 'Active Devices',
      value: String(metrics.activeConnections || 0),
      icon: Server,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      change: metrics.totalConnections > 0
        ? `+${Math.round((metrics.activeConnections / metrics.totalConnections) * 100)}%`
        : '0%'
    },
    {
      title: 'Network Health',
      value: `${(100 - metrics.packetLoss).toFixed(1)}%`,
      icon: Wifi,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      change: metrics.packetLoss < 5 ? '+Good' : '-Degraded'
    },
    {
      title: 'Active Alerts',
      value: String(Math.max(0, Math.ceil(metrics.packetLoss / 10) || 0)),
      icon: AlertTriangle,
      color: metrics.packetLoss > 10 ? 'text-red-500' : 'text-yellow-500',
      bg: metrics.packetLoss > 10 ? 'bg-red-500/10' : 'bg-yellow-500/10',
      change: metrics.packetLoss > 10 ? '+Critical' : '-Normal'
    },
    {
      title: 'Live Sessions',
      value: String(Math.floor(metrics.activeConnections * 10) || 0),
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      change: '+Simulated'
    },
  ];

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="flex justify-between">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error && bandwidthHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
        <p className="text-red-500 font-medium mb-2">Failed to load dashboard</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Network Dashboard</h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            {isConnected ? 'Live' : 'Reconnecting...'}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>Real-time Monitoring</span>
        </div>
      </div>

      {/* Stats Grid with Network Speed Gauge integrated */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Network Speed Gauge (spanning 2 cards worth) */}
        <div className="md:col-span-2 lg:col-span-2">
          <NetworkSpeedGauge value={metrics.bandwidth} max={1000} label="Current Bandwidth" />
        </div>

        {stats.map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="text-sm font-semibold text-green-500">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Error Banner */}
      {error && bandwidthHistory.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="text-yellow-500" size={20} />
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              {error}
            </p>
          </div>
          <button
            onClick={connectSSE}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-700 dark:text-yellow-400 transition"
          >
            <RefreshCw size={14} />
            Reconnect
          </button>
        </div>
      )}

      {/* Connected Devices Section */}
      <ConnectedDevices />

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Bandwidth Usage (Mbps)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={bandwidthHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
              <Area type="monotone" dataKey="bandwidth" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Real-Time Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Bandwidth Usage</span>
                <span>{metrics.bandwidth} Mbps</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (metrics.bandwidth / 1000) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Latency</span>
                <span>{metrics.latency} ms</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(100, metrics.latency / 2)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Packet Loss</span>
                <span>{metrics.packetLoss}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${metrics.packetLoss}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Recent Network Events</h3>
        <div className="space-y-3">
          {bandwidthHistory.length > 0 && [
            {
              time: 'Just now',
              event: `Current bandwidth: ${bandwidthHistory[bandwidthHistory.length - 1]?.bandwidth || metrics.bandwidth} Mbps`,
              type: 'info'
            },
            {
              time: 'Real-time',
              event: `Latency: ${metrics.latency}ms | Packet loss: ${metrics.packetLoss}%`,
              type: metrics.packetLoss > 5 ? 'warning' : 'success'
            },
            {
              time: 'Connections',
              event: `${metrics.activeConnections} of ${metrics.totalConnections} devices active`,
              type: 'info'
            },
            {
              time: 'Status',
              event: isConnected ? 'Real-time feed active' : 'Using polling fallback',
              type: isConnected ? 'success' : 'warning'
            },
          ].map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <Activity size={16} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm">{event.event}</p>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                event.type === 'warning' ? 'bg-yellow-500/20 text-yellow-600' :
                event.type === 'critical' ? 'bg-red-500/20 text-red-600' :
                event.type === 'success' ? 'bg-green-500/20 text-green-600' :
                'bg-blue-500/20 text-blue-600'
              }`}>
                {event.type}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
