// src/components/Layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Activity, 
  Wrench, 
  FileText, 
  Settings, 
  Shield,
  Bot,
  Terminal 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/builder', icon: Network, label: 'Network Builder' },
  { path: '/monitoring', icon: Activity, label: 'Live Monitoring' },
  { path: '/troubleshoot', icon: Wrench, label: 'Troubleshooting' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/assistant', icon: Bot, label: 'AI Assistant' },
  { path: '/terminal', icon: Terminal, label: 'CLI Terminal' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { role } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 z-30">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-blue-600 bg-clip-text text-transparent">
            NetSim Pro
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enterprise Network Platform</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-active' : 'text-gray-600 dark:text-gray-300'}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          {role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-active' : 'text-gray-600 dark:text-gray-300'}`
              }
            >
              <Shield size={20} />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            © 2024 NetSim Pro<br/>Real-Time Simulation
          </div>
        </div>
      </div>
    </aside>
  );
}