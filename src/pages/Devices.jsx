import { motion } from 'framer-motion';
import ConnectedDevices from '../components/ConnectedDevices';

export default function Devices() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Device Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Comprehensive list of all discovered devices on the network.
          </p>
        </div>
        <ConnectedDevices />
      </motion.div>
    </div>
  );
}
