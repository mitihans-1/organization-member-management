import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  CreditCard,
  ArrowUpCircle,
  Settings,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const nav = [
  { to: '/org', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/org/members', label: 'Members', icon: Users },
  { to: '/org/events', label: 'Events', icon: Calendar },
  { to: '/org/blogs', label: 'Blog', icon: FileText },
  { to: '/org/payments', label: 'Payments', icon: CreditCard },
  { to: '/org/upgrade', label: 'Upgrade Plan', icon: ArrowUpCircle },
  { to: '/org/settings', label: 'Settings', icon: Settings },
];

const OrgAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const orgLabel = user?.organization_name || 'Your organization';

  return (
    <div className="min-h-screen bg-gray-50 flex font-poppins">
      <aside className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <Link
            to="/"
            title="Back to public home"
            className="text-xl font-black text-sky-600 hover:text-sky-500 transition-colors block"
          >
            OMMS
          </Link>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1 truncate" title={orgLabel}>
            {orgLabel}
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-sky-50 text-sky-700 border border-sky-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className={active ? 'text-sky-600' : 'text-gray-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500">Organization Administrator</p>
            </div>
          </div>
          <Link
            to="/org/profile"
            className="flex items-center justify-between text-xs font-bold text-sky-600 hover:underline"
          >
            Edit Profile
            <ChevronRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 flex items-center gap-2 text-sm text-red-500 hover:text-red-600 w-full"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-end gap-4 sticky top-0 z-20">
          <button type="button" className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hidden sm:block">
            <HelpCircle size={20} />
          </button>
          <span className="text-sm font-bold text-gray-800">{user?.name}</span>
        </header>
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default OrgAdminLayout;
