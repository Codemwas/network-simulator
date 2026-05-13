import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, Upload, Download, Play, Check, X } from 'lucide-react';

export default function SpeedTest() {
  const [testing, setTesting] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle, download, upload, complete
  const [results, setResults] = useState({ download: 0, upload: 0, latency: 0 });
  const [progress, setProgress] = useState(0);

  const startTest = async () => {
    setTesting(true);
    setPhase('download');
    setResults({ download: 0, upload: 0, latency: 0 });
    setProgress(0);

    // Simulate latency check
    await wait(500);
    const latency = Math.floor(Math.random() * 30) + 10; // 10-40ms
    setResults(prev => ({ ...prev, latency }));

    // Simulate download
    let dl = 0;
    const targetDl = Math.floor(Math.random() * 200) + 300; // 300-500 Mbps
    const dlSteps = 40;
    for (let i = 0; i <= dlSteps; i++) {
      await wait(60);
      dl = Math.round(targetDl * easeOutQuad(i / dlSteps));
      setProgress(Math.round((i / dlSteps) * 50));
      setResults(prev => ({ ...prev, download: dl }));
    }

    // Simulate upload
    setPhase('upload');
    let up = 0;
    const targetUp = Math.floor(Math.random() * 100) + 150; // 150-250 Mbps
    const upSteps = 30;
    for (let i = 0; i <= upSteps; i++) {
      await wait(80);
      up = Math.round(targetUp * easeOutQuad(i / upSteps));
      setProgress(50 + Math.round((i / upSteps) * 50));
      setResults(prev => ({ ...prev, upload: up }));
    }

    setPhase('complete');
    setTesting(false);
    setProgress(100);
  };

  const wait = ms => new Promise(r => setTimeout(r, ms));

  const easeOutQuad = t => t * (2 - t);

  const getLatencyRating = (ms) => {
    if (ms < 20) return { text: 'Excellent', color: 'text-green-500' };
    if (ms < 50) return { text: 'Good', color: 'text-blue-500' };
    if (ms < 100) return { text: 'Fair', color: 'text-yellow-500' };
    return { text: 'Poor', color: 'text-red-500' };
  };

  const getSpeedRating = (speed, type) => {
    if (type === 'download') {
      if (speed > 300) return 'Excellent';
      if (speed > 100) return 'Good';
      return 'Fair';
    } else {
      if (speed > 150) return 'Excellent';
      if (speed > 50) return 'Good';
      return 'Fair';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Internet Speed Test</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test your network's download, upload speeds and latency.
          </p>
        </div>

        {/* Speed Gauge */}
        <div className="relative">
          <div className="w-64 h-32 mx-auto overflow-hidden">
            <div className="absolute inset-0 border-b-8 border-gray-200 dark:border-gray-700 rounded-b-full" />
            <motion.div
              className="absolute inset-0 border-b-8 rounded-b-full"
              style={{
                borderColor: phase === 'download' ? '#3b82f6' : phase === 'upload' ? '#8b5cf6' : '#22c55e',
                transformOrigin: 'center bottom',
                transform: `rotate(${Math.min(90, Math.max(-90, (results.download / 500) * 180 - 90))}deg)`
              }}
              animate={{
                rotate: phase === 'download' ? (results.download / 500) * 180 - 90
                         : phase === 'upload' ? (results.upload / 300) * 180 - 90
                         : 0
              }}
              transition={{ type: 'spring', damping: 15 }}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 dark:bg-gray-200 rounded-full border-4 border-white dark:border-gray-800 z-10" />
          </div>
          <div className="mt-6">
            <div className="text-4xl font-bold text-blue-600">{results.download}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mbps Download</div>
            {phase === 'download' && <div className="text-xs text-blue-500 mt-1">Testing download...</div>}
          </div>
        </div>

        {/* Progress Bar */}
        {testing && (
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {phase === 'download' ? 'Downloading test file...' : 'Uploading test data...'}
            </p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-3 gap-6 max-w-2xl mx-auto"
            >
              <div className="glass-card p-6 text-center">
                <Download className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{results.download}</div>
                <div className="text-xs text-gray-500">Mbps Down</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {getSpeedRating(results.download, 'download')}
                </div>
              </div>
              <div className="glass-card p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{results.upload}</div>
                <div className="text-xs text-gray-500">Mbps Up</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {getSpeedRating(results.upload, 'upload')}
                </div>
              </div>
              <div className="glass-card p-6 text-center">
                <Gauge className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{results.latency}</div>
                <div className="text-xs text-gray-500">ms Ping</div>
                <div className={`text-xs mt-1 ${getLatencyRating(results.latency).color}`}>
                  {getLatencyRating(results.latency).text}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        {!testing && (
          <button
            onClick={startTest}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition"
          >
            <Play size={20} />
            Start Speed Test
          </button>
        )}

        {/* Stop button during test */}
        {testing && (
          <button
            onClick={() => setTesting(false)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
          >
            <X size={20} />
            Cancel
          </button>
        )}
      </motion.div>
    </div>
  );
}
