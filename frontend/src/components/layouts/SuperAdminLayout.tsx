import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Users,
  CreditCard,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const nav = [
  { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super-admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/super-admin/org-admins', label: 'OrgAdmins', icon: UserCog },
  { to: '/super-admin/members', label: 'Members', icon: Users },
  { to: '/super-admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/super-admin/system-config', label: 'System Config', icon: Settings },
];

const SuperAdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex font-poppins">
      <aside className="w-64 shrink-0 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <Link
            to="/"
            title="Back to public home"
            className="text-lg font-black tracking-tight text-white hover:text-sky-300 transition-colors block"
          >
            OMMS
          </Link>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Super Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-2"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search…"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-bold text-gray-800"
            >
              {user?.name}
              <ChevronDown size={16} className="text-gray-400" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
