// src/pages/NetworkBuilder.jsx
import { useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { Plus, Save, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

const deviceTypes = [
  { type: 'router', name: 'Router', icon: '🌐', color: 'bg-blue-500' },
  { type: 'switch', name: 'Switch', icon: '🔌', color: 'bg-green-500' },
  { type: 'pc', name: 'PC', icon: '💻', color: 'bg-purple-500' },
  { type: 'server', name: 'Server', icon: '🗄️', color: 'bg-red-500' },
  { type: 'firewall', name: 'Firewall', icon: '🛡️', color: 'bg-yellow-500' },
  { type: 'ap', name: 'Access Point', icon: '📡', color: 'bg-indigo-500' },
];

export default function NetworkBuilder() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'DEVICE',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();
      if (canvasRect && offset) {
        const x = offset.x - canvasRect.left;
        const y = offset.y - canvasRect.top;
        addDevice(item.type, { x, y });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const addDevice = (type, position) => {
    const newDevice = {
      id: Date.now(),
      type,
      name: `${type}-${devices.length + 1}`,
      position,
      config: {
        ip: `192.168.1.${devices.length + 10}`,
        mac: `00:1A:2B:3C:${Math.floor(Math.random() * 100)}`,
        status: 'online',
      },
    };
    setDevices([...devices, newDevice]);
    toast.success(`${type} added to canvas`);
  };

  const saveTopology = async () => {
    try {
      await addDoc(collection(db, 'topologies'), {
        devices,
        createdAt: new Date(),
        name: `Topology-${Date.now()}`,
      });
      toast.success('Topology saved successfully');
    } catch (error) {
      toast.error('Failed to save topology');
    }
  };

  const exportAsImage = () => {
    toast.success('Export feature coming soon');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Network Builder</h1>
        <div className="flex gap-3">
          <button onClick={saveTopology} className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition">
            <Save size={18} /> Save
          </button>
          <button onClick={exportAsImage} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <Download size={18} /> Export
          </button>
          <button onClick={() => setDevices([])} className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition">
            <Trash2 size={18} /> Clear
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Device Palette */}
        <div className="w-64 space-y-2">
          <h3 className="font-semibold mb-3">Devices</h3>
          {deviceTypes.map((device) => (
            <div
              key={device.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', device.type);
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-lg transition"
            >
              <div className={`w-10 h-10 ${device.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {device.icon}
              </div>
              <div>
                <p className="font-medium">{device.name}</p>
                <p className="text-xs text-gray-500">Drag to canvas</p>
              </div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          id="canvas"
          ref={drop}
          className={`flex-1 min-h-[600px] bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed transition-all ${
            isOver ? 'border-primary-500 bg-primary-500/5' : 'border-gray-300 dark:border-gray-600'
          }`}
          style={{ position: 'relative' }}
        >
          {devices.map((device) => (
            <motion.div
              key={device.id}
              drag
              dragMomentum={false}
              style={{ position: 'absolute', left: device.position.x, top: device.position.y }}
              className="absolute cursor-move"
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedDevice(device)}
            >
              <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600">
                <div className="text-2xl mb-1">
                  {deviceTypes.find(d => d.type === device.type)?.icon}
                </div>
                <p className="text-xs font-medium">{device.name}</p>
                <p className="text-xs text-gray-500">{device.config.ip}</p>
              </div>
            </motion.div>
          ))}
          {devices.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Plus size={48} className="mx-auto mb-2 opacity-50" />
                <p>Drag devices here to build your network</p>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedDevice && (
          <div className="w-80 glass-card p-4">
            <h3 className="font-semibold mb-4">Device Properties</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Hostname</label>
                <input
                  type="text"
                  value={selectedDevice.name}
                  onChange={(e) => {
                    const updated = devices.map(d => 
                      d.id === selectedDevice.id ? { ...d, name: e.target.value } : d
                    );
                    setDevices(updated);
                    setSelectedDevice({ ...selectedDevice, name: e.target.value });
                  }}
                  className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">IP Address</label>
                <input
                  type="text"
                  value={selectedDevice.config.ip}
                  onChange={(e) => {
                    const updated = devices.map(d =>
                      d.id === selectedDevice.id ? { ...d, config: { ...d.config, ip: e.target.value } } : d
                    );
                    setDevices(updated);
                  }}
                  className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={selectedDevice.config.status}
                  onChange={(e) => {
                    const updated = devices.map(d =>
                      d.id === selectedDevice.id ? { ...d, config: { ...d.config, status: e.target.value } } : d
                    );
                    setDevices(updated);
                  }}
                  className="w-full mt-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                  <option value="congested">Congested</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}