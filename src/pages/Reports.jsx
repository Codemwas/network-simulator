// src/pages/Reports.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Printer, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = '/api';

export default function Reports() {
  const [devices, setDevices] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [devRes, metRes] = await Promise.all([
        fetch(`${API_BASE}/devices`),
        fetch(`${API_BASE}/metrics`)
      ]);
      const devData = await devRes.json();
      const metData = await metRes.json();
      setDevices(devData.devices || []);
      setMetrics(metData);
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'active').length,
        totalBandwidth: metrics.bandwidth || 0,
        avgLatency: metrics.latency || 0,
        packetLoss: metrics.packetLoss || 0
      },
      devices: devices.map(d => ({
        name: d.name,
        type: d.type,
        status: d.status,
        ip: d.ip,
        bandwidth: d.bandwidth,
        latency: d.latency,
        risk: d.risk
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netsim-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  const printReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-3">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeCount = devices.filter(d => d.status === 'active').length;
  const highRiskCount = devices.filter(d => d.risk === 'high' || d.risk === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-gray-500">Generate and export network analytics reports</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <Printer size={18} /> Print
          </button>
          <button onClick={generateReport} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
            <Download size={18} /> Export JSON
          </button>
        </div>
      </div>

      {/* Report Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Devices</span>
            <BarChart3 className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold">{devices.length}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active</span>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">{((activeCount / (devices.length || 1)) * 100).toFixed(0)}% online</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Current Bandwidth</span>
            <PieChart className="text-purple-500" size={20} />
          </div>
          <p className="text-3xl font-bold">{metrics.bandwidth || 0} <span className="text-lg text-gray-500">Mbps</span></p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Risk Alerts</span>
            <FileText className="text-red-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-red-600">{highRiskCount}</p>
          <p className="text-xs text-gray-500 mt-1">Requires attention</p>
        </motion.div>
      </div>

      {/* Report Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Network Inventory Report</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} />
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Device</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">IP Address</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Bandwidth</th>
                <th className="text-left py-3 px-4">Latency</th>
                <th className="text-left py-3 px-4">Risk</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, i) => (
                <motion.tr
                  key={device.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4 font-medium">{device.name}</td>
                  <td className="py-3 px-4 capitalize">{device.type}</td>
                  <td className="py-3 px-4 font-mono text-sm">{device.ip}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${device.status === 'active' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{device.bandwidth} Mbps</td>
                  <td className="py-3 px-4">{device.latency} ms</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      device.risk === 'low' ? 'bg-green-500/20 text-green-600' :
                      device.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                      'bg-red-500/20 text-red-600'
                    }`}>
                      {device.risk}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
