import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Link as LinkIcon, Users, Settings as SettingsIcon, LogOut, Bell, Crown } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = () => signOut(auth);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Premium Requests', path: '/premium-requests', icon: Crown },
    { name: 'Manage Links', path: '/links', icon: LinkIcon },
    { name: 'Manage Users', path: '/users', icon: Users },
    { name: 'Push Notifications', path: '/notify', icon: Bell },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-white h-full shadow-lg flex flex-col border-r border-gray-100">
      <div className="p-6">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">WP BOOSTUP</h1>
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Admin Workspace</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-semibold text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-red-500 w-full p-3 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} strokeWidth={2.5} />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
