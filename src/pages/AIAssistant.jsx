// src/pages/AIAssistant.jsx
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = '/api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your NetSim Pro AI assistant. I can help you analyze network data, troubleshoot issues, and provide recommendations. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Fetch current network data to provide context-aware responses
      const [devRes, metRes] = await Promise.all([
        fetch(`${API_BASE}/devices`),
        fetch(`${API_BASE}/metrics`)
      ]);
      const devData = await devRes.json();
      const metData = await metRes.json();
      const devices = devData.devices || [];
      const metrics = metData;

      // Generate intelligent response based on network state
      const response = generateResponse(userMsg.toLowerCase(), devices, metrics);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error accessing network data. Please ensure the API server is running.' }]);
    } finally {
      setLoading(false);
    }
  };

  const generateResponse = (query, devices, metrics) => {
    const activeDevices = devices.filter(d => d.status === 'active');
    const highLatency = devices.filter(d => d.latency > 100);
    const riskyPorts = devices.filter(d => d.openPorts?.includes(23) || d.openPorts?.includes(3389));
    const bandwidth = metrics.bandwidth || 0;

    // Keyword-based intelligent responses
    if (query.includes('status') || query.includes('health')) {
      return `Network Status Summary:\n\n• ${activeDevices.length}/${devices.length} devices online\n• Current bandwidth: ${bandwidth} Mbps\n• ${highLatency.length} device(s) with high latency (>100ms)\n• ${riskyPorts.length} device(s) with security risks (Telnet/RDP open)\n\nOverall: ${highLatency.length === 0 && riskyPorts.length === 0 ? '✅ Healthy' : '⚠️ Attention required'}`;
    }

    if (query.includes('latency') || query.includes('slow')) {
      if (highLatency.length === 0) {
        return 'Good news! All devices are showing normal latency (<100ms). Your network is performing well.';
      }
      return `I've identified ${highLatency.length} device(s) with high latency:\n\n${highLatency.map(d => `• ${d.name}: ${d.latency}ms`).join('\n')}\n\nRecommendations:\n1. Check physical connections\n2. Review QoS settings\n3. Monitor for network congestion`;
    }

    if (query.includes('security') || query.includes('vulnerability') || query.includes('risk')) {
      if (riskyPorts.length === 0) {
        return 'No immediate security risks detected based on open ports. All devices appear properly configured.';
      }
      return `Security Alert: ${riskyPorts.length} device(s) have exposed services:\n\n${riskyPorts.map(d => `• ${d.name}: Ports ${d.openPorts?.filter(p => [23, 3389].includes(p)).join(', ')}`).join('\n')}\n\nAction needed:\n• Disable Telnet (port 23) - use SSH instead\n• Disable RDP (port 3389) from external access or use VPN`;
    }

    if (query.includes('bandwidth') || query.includes('traffic')) {
      return `Current network bandwidth: ${bandwidth} Mbps\n\n${bandwidth > 800 ? '⚠️ High usage detected - consider load balancing' : bandwidth < 200 ? '💡 Low usage - network is underutilized' : '✅ Bandwidth within normal range'}`;
    }

    if (query.includes('device') || query.includes('list')) {
      return `Connected Devices (${devices.length} total):\n\n${devices.map(d => `• ${d.name} (${d.type}) - ${d.status} - IP: ${d.ip}`).join('\n')}`;
    }

    if (query.includes('recommend') || query.includes('help')) {
      return `Here's what I can help you with:\n\n1. **Network Status** - Overall health summary\n2. **Latency Issues** - Identify slow connections\n3. **Security Scan** - Find exposed services\n4. **Bandwidth Analysis** - Usage patterns\n5. **Device Inventory** - List all devices\n\nTry asking: "What's my network status?" or "Show me security risks"`;
    }

    return `I understand you're asking about "${query}". Based on current data:\n\n• Active devices: ${activeDevices.length}\n• Avg latency: ${(devices.reduce((a, b) => a + b.latency, 0) / (devices.length || 1)).toFixed(0)}ms\n• Bandwidth: ${bandwidth} Mbps\n\nFor specific help, ask about "status", "latency", "security", or "devices".`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-sm text-gray-500">Intelligent network analysis and troubleshooting</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-primary-500/20 text-primary-600">
          <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          Online
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 glass-card p-6 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-primary-500" />
              </div>
            )}
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Bot size={16} className="text-primary-500" />
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-none">
              <Loader2 className="animate-spin text-primary-500" size={20} />
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your network... (e.g., 'What's the status?')"
          className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={18} />
          Send
        </button>
      </form>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {['Network status', 'Security risks', 'High latency', 'Device list'].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(`What's the ${suggestion}?`)}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
