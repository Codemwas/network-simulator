// src/pages/Troubleshooting.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle, XCircle, RefreshCw, Network, Server, Wifi } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = '/api';

export default function Troubleshooting() {
  const [devices, setDevices] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices`);
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  const runDiagnostics = () => {
    setRunning(true);
    setDiagnostics([]);

    setTimeout(() => {
      const issues = [];
      const activeDevices = devices.filter(d => d.status === 'active');
      const inactiveDevices = devices.filter(d => d.status !== 'active');

      // Check for offline devices
      if (inactiveDevices.length > 0) {
        issues.push({
          id: 1,
          severity: 'high',
          title: 'Devices offline',
          description: `${inactiveDevices.length} device(s) are not responding: ${inactiveDevices.map(d => d.name).join(', ')}`,
            fix: 'Check power, network connectivity, and device status'
        });
      }

      // Check high latency devices
      const highLatency = activeDevices.filter(d => d.latency > 100);
      if (highLatency.length > 0) {
        issues.push({
          id: 2,
          severity: 'medium',
          title: 'High latency detected',
          description: `The following devices have latency >100ms: ${highLatency.map(d => `${d.name} (${d.latency}ms)`).join(', ')}`,
          fix: 'Check network congestion, QoS settings, and physical connections'
        });
      }

      // Check devices with open risky ports
      const riskyPorts = activeDevices.filter(d => d.openPorts?.includes(23) || d.openPorts?.includes(3389));
      if (riskyPorts.length > 0) {
        issues.push({
          id: 3,
          severity: 'critical',
          title: 'Security risk: exposed services',
          description: `Devices with dangerous open ports: ${riskyPorts.map(d => d.name).join(', ')}. Ports: 23 (Telnet), 3389 (RDP)`,
          fix: 'Close or firewall these ports, use VPN/SSH for remote access'
        });
      }

      // Check bandwidth saturation
      const busyDevices = activeDevices.filter(d => d.bandwidth > 800);
      if (busyDevices.length > 0) {
        issues.push({
          id: 4,
          severity: 'medium',
          title: 'Bandwidth saturation',
          description: `Some devices are near max bandwidth: ${busyDevices.map(d => `${d.name} (${d.bandwidth} Mbps)`).join(', ')}`,
          fix: 'Consider load balancing, QoS, or upgrading links'
        });
      }

      // If no issues
      if (issues.length === 0) {
        issues.push({
          id: 5,
          severity: 'low',
          title: 'All systems operational',
          description: 'No issues detected. All devices are performing within normal parameters.',
          fix: 'Continue monitoring'
        });
      }

      setDiagnostics(issues);
      setLastScan(new Date());
      setRunning(false);
      toast.success(`Diagnostics complete: ${issues.length} issue(s) found`);
    }, 2000);
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="text-red-500" size={20} />;
      case 'high': return <AlertTriangle className="text-orange-500" size={20} />;
      case 'medium': return <Wifi className="text-yellow-500" size={20} />;
      default: return <CheckCircle className="text-green-500" size={20} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-red-500 bg-red-500/10';
      case 'high': return 'border-l-orange-500 bg-orange-500/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/10';
      default: return 'border-l-green-500 bg-green-500/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Troubleshooting</h1>
            <p className="text-sm text-gray-500">Automated network diagnostics and issue resolution</p>
          </div>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={running}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50"
        >
          {running ? <RefreshCw className="animate-spin" size={18} /> : <Wrench size={18} />}
          {running ? 'Scanning...' : 'Run Diagnostics'}
        </button>
      </div>

      {!running && diagnostics.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {diagnostics.map((issue, i) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 border-l-4 ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-current/10">
                  {getSeverityIcon(issue.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{issue.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                      issue.severity === 'critical' ? 'bg-red-500/20 text-red-600' :
                      issue.severity === 'high' ? 'bg-orange-500/20 text-orange-600' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                      'bg-green-500/20 text-green-600'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{issue.description}</p>
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm"><span className="font-semibold">Recommended fix:</span> {issue.fix}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {running && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {!running && diagnostics.length === 0 && (
        <div className="text-center py-16 glass-card">
          <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">No diagnostics run yet</p>
          <p className="text-sm text-gray-500 mt-1">Click "Run Diagnostics" to analyze your network</p>
        </div>
      )}

      {lastScan && (
        <p className="text-xs text-gray-500 text-center">
          Last scan: {lastScan.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
