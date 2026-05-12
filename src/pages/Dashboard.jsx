// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Wifi, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const stats = [
  { title: 'Active Devices', value: '24', icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10', change: '+12%' },
  { title: 'Network Health', value: '98.5%', icon: Wifi, color: 'text-green-500', bg: 'bg-green-500/10', change: '+2.3%' },
  { title: 'Active Alerts', value: '3', icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', change: '-2' },
  { title: 'Live Sessions', value: '156', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', change: '+18%' },
];

export default function Dashboard() {
  const [bandwidthData, setBandwidthData] = useState([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState({ bandwidth: 0, latency: 0, packetLoss: 0 });

  useEffect(() => {
    // Generate demo bandwidth data
    const generateData = () => {
      const data = [];
      for (let i = 0; i < 24; i++) {
        data.push({ time: `${i}:00`, bandwidth: Math.floor(Math.random() * 100) + 20 });
      }
      setBandwidthData(data);
    };
    generateData();

    // Load metrics from MariaDB-backed API
    const loadMetrics = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/metrics');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRealtimeMetrics({
          bandwidth: Number(data.bandwidth ?? 0),
          latency: Number(data.latency ?? 0),
          packetLoss: Number(data.packetLoss ?? 0),
        });
      } catch (err) {
        // Keep defaults on failure (avoid blank screen)
        console.error('Failed to load metrics', err);
      }
    };

    void loadMetrics();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Network Dashboard</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>Live Updates: Real-time</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Bandwidth Usage (Mbps)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={bandwidthData}>
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
                <span>{realtimeMetrics.bandwidth} Mbps</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${realtimeMetrics.bandwidth}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Latency</span>
                <span>{realtimeMetrics.latency} ms</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(100, realtimeMetrics.latency / 2)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Packet Loss</span>
                <span>{realtimeMetrics.packetLoss}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${realtimeMetrics.packetLoss}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Recent Network Events</h3>
        <div className="space-y-3">
          {[
            { time: '2 min ago', event: 'Packet loss detected on Router-01', type: 'warning' },
            { time: '5 min ago', event: 'New device connected: PC-Office-12', type: 'info' },
            { time: '12 min ago', event: 'Firewall blocked suspicious traffic', type: 'critical' },
            { time: '30 min ago', event: 'Backup completed successfully', type: 'success' },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
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
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
