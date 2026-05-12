// src/components/Layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx.jsx';
import Header from './Header.jsx.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx.jsx';

export default function Layout() {
  const { user } = useAuth();
  
  if (!user) return <Outlet />;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}