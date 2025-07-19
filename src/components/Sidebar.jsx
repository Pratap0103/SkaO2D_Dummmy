import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Package,
  LogIn,
  Scale,
  Truck,
  TruckIcon,
  Weight,
  CheckCircle,
  Receipt,
  LogOut as LogOutIcon,
  X
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/sauda-form', icon: FileText, label: 'Sauda Form' },
    { path: '/do-generate', icon: Package, label: 'DO Generate' },
    { path: '/gate-in', icon: LogIn, label: 'Gate IN' },
    { path: '/tyre-weight', icon: Scale, label: 'Tyre Weight' },
    { path: '/get-loading-1st', icon: Truck, label: 'Get Loading 1st' },
    { path: '/get-loading-2nd', icon: TruckIcon, label: 'Get Loading 2nd' },
    { path: '/final-weight', icon: Weight, label: 'Final Weight' },
    { path: '/qc', icon: CheckCircle, label: 'QC' },
    { path: '/make-invoice', icon: Receipt, label: 'Make Invoice' },
    { path: '/get-out', icon: LogOutIcon, label: 'Get Out' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-indigo-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <Package size={24} />
          <span>O2D System</span>
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path} 
            className={({ isActive }) => 
              `flex items-center py-2.5 px-4 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-800 text-white' 
                  : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
              }`
            }
            onClick={onClose}
          >
            <item.icon className="mr-3" size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="flex items-center py-2.5 px-4 rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white cursor-pointer transition-colors w-full"
        >
          <LogOutIcon className="mr-3" size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;