import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, LayoutDashboard, Server, GitBranch, Gauge, Shield, User } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/devices', icon: Server, label: 'Devices' },
  { path: '/topology', icon: GitBranch, label: 'Topology' },
  { path: '/speed-test', icon: Gauge, label: 'Speed Test' },
  { path: '/vulnerabilities', icon: Shield, label: 'Security' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Network className="w-6 h-6 text-primary-500" />
            </div>
            <span className="font-bold text-xl">NetSim Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary-500/10 rounded-lg"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User menu placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`p-2 rounded-lg ${
                  isActive ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
