// src/pages/Settings.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Save, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const { darkMode, setDarkMode } = useTheme();

  const [profile, setProfile] = useState({
    displayName: user?.displayName || 'User',
    email: user?.email || '',
    notifications: true,
    emailAlerts: true,
    securityAlerts: true,
    weeklyReports: false
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    // Simulate saving profile
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.success(`${!darkMode ? 'Dark' : 'Light'} mode enabled`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <User className="text-primary-500" size={24} />
          <h2 className="text-xl font-semibold">Profile Information</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <h3 className="font-medium">Appearance</h3>
              <p className="text-sm text-gray-500">Toggle dark/light mode</p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </form>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-yellow-500" size={24} />
          <h2 className="text-xl font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-500">Receive in-app notifications</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, notifications: !profile.notifications })}
              className={`relative w-14 h-7 rounded-full transition-colors ${profile.notifications ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.notifications ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Email Alerts</h3>
              <p className="text-sm text-gray-500">Get email updates about network status</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, emailAlerts: !profile.emailAlerts })}
              className={`relative w-14 h-7 rounded-full transition-colors ${profile.emailAlerts ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.emailAlerts ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Security Alerts</h3>
              <p className="text-sm text-gray-500">Critical security notifications</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, securityAlerts: !profile.securityAlerts })}
              className={`relative w-14 h-7 rounded-full transition-colors ${profile.securityAlerts ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.securityAlerts ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Weekly Reports</h3>
              <p className="text-sm text-gray-500">Receive weekly network summary</p>
            </div>
            <button
              onClick={() => setProfile({ ...profile, weeklyReports: !profile.weeklyReports })}
              className={`relative w-14 h-7 rounded-full transition-colors ${profile.weeklyReports ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${profile.weeklyReports ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Shield className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold">Security & Privacy</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Two-Factor Authentication</h3>
              <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-600 rounded">Not Enabled</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account</p>
            <button className="text-sm text-primary-500 hover:underline">Enable 2FA</button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Active Sessions</h3>
              <span className="px-2 py-1 text-xs bg-green-500/20 text-green-600 rounded">1 Active</span>
            </div>
            <p className="text-sm text-gray-500">Current session: Localhost - Chrome</p>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 mb-3">Permanently delete your account and all data</p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">
              Delete Account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
