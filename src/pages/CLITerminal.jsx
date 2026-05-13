// src/pages/CLITerminal.jsx
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Play, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = '/api';

const COMMANDS = {
  help: 'Show available commands',
  devices: 'List all network devices',
  metrics: 'Show current network metrics',
  ping: 'Ping all devices (simulated)',
  scan: 'Run security scan',
  clear: 'Clear terminal',
  whoami: 'Display current user',
  version: 'Show NetSim Pro version',
  uptime: 'Show system uptime'
};

export default function CLITerminal() {
  const [history, setHistory] = useState([
    { type: 'output', content: 'NetSim Pro CLI Terminal v1.0.0\nType "help" for available commands.\n' }
  ]);
  const [command, setCommand] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = async (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    const args = trimmed.split(' ');
    const baseCmd = args[0];

    // Add command to history
    setHistory(prev => [...prev, { type: 'command', content: cmd }]);

    // Execute command
    let result = '';

    switch (baseCmd) {
      case 'help':
        result = 'Available commands:\n' + Object.entries(COMMANDS).map(([k, v]) => `  ${k.padEnd(12)} - ${v}`).join('\n');
        break;

      case 'devices':
        try {
          const res = await fetch(`${API_BASE}/devices`);
          const data = await res.json();
          result = data.devices?.map(d => `${d.name} (${d.type}): ${d.ip} | ${d.status} | ${d.bandwidth}Mbps | ${d.latency}ms`).join('\n') || 'No devices found';
        } catch (err) {
          result = 'Error: Unable to fetch devices. Is the API server running?';
        }
        break;

      case 'metrics':
        try {
          const res = await fetch(`${API_BASE}/metrics`);
          const data = await res.json();
          result = `Bandwidth: ${data.bandwidth} Mbps\nLatency: ${data.latency} ms\nPacket Loss: ${data.packetLoss}%\nConnections: ${data.activeConnections}/${data.totalConnections}`;
        } catch (err) {
          result = 'Error: Unable to fetch metrics.';
        }
        break;

      case 'ping':
        result = 'Pinging all devices...\n\n';
        try {
          const res = await fetch(`${API_BASE}/devices`);
          const data = await res.json();
          data.devices?.forEach(d => {
            const latency = Math.floor(Math.random() * 30) + 10;
            result += `${d.ip}: reply time=${latency}ms TTL=64\n`;
          });
        } catch {
          result += 'Error: Device list unavailable.\n';
        }
        break;

      case 'scan':
        result = 'Starting security scan...\n\n';
        try {
          const res = await fetch(`${API_BASE}/devices`);
          const data = await res.json();
          const risky = data.devices?.filter(d => d.openPorts?.includes(23) || d.openPorts?.includes(3389));
          if (risky?.length) {
            result += `⚠️  Found ${risky.length} device(s) with security risks:\n\n`;
            risky.forEach(d => {
              const badPorts = d.openPorts?.filter(p => [23, 3389].includes(p));
              result += `  ${d.name}: Ports ${badPorts?.join(', ')} exposed\n`;
            });
          } else {
            result += '✅ No obvious security risks detected.\n';
          }
        } catch {
          result += 'Error: Scan failed.\n';
        }
        break;

      case 'clear':
        setHistory([{ type: 'output', content: 'NetSim Pro CLI Terminal v1.0.0\n' }]);
        return;

      case 'whoami':
        result = 'admin (role: admin)';
        break;

      case 'version':
        result = 'NetSim Pro CLI v1.0.0 (Build 2026.05.13)';
        break;

      case 'uptime':
        result = 'System uptime: 24 days, 3 hours, 12 minutes';
        break;

      default:
        if (baseCmd === '') return;
        result = `Command not found: "${baseCmd}". Type "help" for available commands.`;
    }

    setHistory(prev => [...prev, { type: 'output', content: result }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    executeCommand(command);
    setCommand('');
    inputRef.current?.focus();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearTerminal = () => {
    setHistory([{ type: 'output', content: 'Terminal cleared.\n' }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold">CLI Terminal</h1>
            <p className="text-sm text-gray-500">Command-line interface for network operations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={clearTerminal} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <Trash2 size={18} /> Clear
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        className="flex-1 glass-card p-4 font-mono text-sm overflow-y-auto mb-4"
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-1 ${line.type === 'command' ? 'text-primary-400' : 'text-gray-300'}`}
          >
            {line.type === 'command' ? (
              <div className="flex items-center gap-2">
                <span className="text-green-500">$</span>
                <span>{line.content}</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{line.content}</pre>
            )}
          </motion.div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Command Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter command... (type 'help' for list)"
            className="w-full pl-10 pr-4 py-3 bg-gray-900 dark:bg-black border border-gray-700 rounded-xl text-green-400 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2"
        >
          <Play size={18} /> Run
        </button>
      </form>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2 mt-3">
        {Object.keys(COMMANDS).map(cmd => (
          <button
            key={cmd}
            onClick={() => setCommand(cmd)}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full font-mono transition"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
