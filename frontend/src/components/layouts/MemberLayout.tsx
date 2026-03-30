import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  User,
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const nav = [
  { to: '/member', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/member/profile', label: 'Profile', icon: User },
  { to: '/member/events', label: 'Events', icon: Calendar },
  { to: '/member/blog', label: 'Blog', icon: FileText },
  { to: '/member/payments', label: 'Payments', icon: CreditCard },
];

const MemberLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex font-poppins">
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <Link
            to="/"
            title="Back to public home"
            className="text-lg font-black text-sky-600 hover:text-sky-500 transition-colors block"
          >
            OMMS
          </Link>
          <p className="text-xs text-gray-500 mt-1">Member Dashboard</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold ${
                  active ? 'bg-sky-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
              {user?.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500">Member</p>
            </div>
          </div>
          <Link to="/member/profile" className="text-xs font-bold text-sky-600 flex items-center justify-between">
            Edit Profile
            <ChevronRight size={12} />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 flex items-center gap-2 text-xs text-red-500"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-end items-center">
          <span className="text-sm font-bold text-gray-800">{user?.name}</span>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
