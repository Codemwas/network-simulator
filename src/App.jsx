import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Topology from './pages/Topology';
import SpeedTest from './pages/SpeedTest';
import VulnerabilityScanner from './pages/VulnerabilityScanner';
import NetworkBuilder from './pages/NetworkBuilder';
import Layout from './components/Layout/Layout';

// Lazy load placeholder pages (create these files next)
import LiveMonitoring from './pages/LiveMonitoring';
import Troubleshooting from './pages/Troubleshooting';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import CLITerminal from './pages/CLITerminal';
import Settings from './pages/Settings';
import RouterAdmin from './pages/RouterAdmin';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />
        {/* Auth pages */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
        {/* Protected routes wrapped in Layout (Header+Sidebar) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/builder" element={<NetworkBuilder />} />
          <Route path="/monitoring" element={<LiveMonitoring />} />
          <Route path="/troubleshoot" element={<Troubleshooting />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/terminal" element={<CLITerminal />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/topology" element={<Topology />} />
          <Route path="/speed-test" element={<SpeedTest />} />
          <Route path="/vulnerabilities" element={<VulnerabilityScanner />} />
          <Route path="/admin" element={<RouterAdmin />} />
        </Route>
      </Routes>
    </DndProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;