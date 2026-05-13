import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';

export default function NetworkSpeedGauge({ value, max = 1000, label = "Network Speed" }) {
  const percentage = Math.min(100, (value / max) * 100);
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  const getColor = () => {
    if (percentage < 50) return '#22c55e'; // green
    if (percentage < 80) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col items-center p-4 glass-card">
      <div className="relative w-40 h-20 overflow-hidden">
        {/* Gauge background arc */}
        <div className="absolute inset-0 border-b-8 border-gray-200 dark:border-gray-700 rounded-b-full" />

        {/* Gauge fill arc */}
        <motion.div
          className="absolute inset-0 border-b-8 rounded-b-full"
          style={{
            borderColor: getColor(),
            transformOrigin: 'center bottom',
            transform: `rotate(${Math.min(90, Math.max(-90, rotation))}deg)`
          }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        />

        {/* Needle center pivot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 dark:bg-gray-200 rounded-full border-4 border-white dark:border-gray-800 z-10" />

        {/* Needle */}
        <motion.div
          className="absolute bottom-2 left-1/2 w-1 h-16 bg-gray-800 dark:bg-gray-200 origin-bottom rounded-full z-0"
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        />
      </div>

      <div className="mt-4 text-center">
        <div className="text-3xl font-bold" style={{ color: getColor() }}>
          {value}
          <span className="text-lg text-gray-500 dark:text-gray-400"> Mbps</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</div>
      </div>

      <div className="flex justify-between w-full mt-2 px-2 text-xs text-gray-500">
        <span>0</span>
        <span>{max / 2}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
