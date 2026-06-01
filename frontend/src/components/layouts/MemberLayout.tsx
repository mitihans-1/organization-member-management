import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { relativeTime } from '../../lib/relativeTime';
import {
  LayoutGrid,
  User,
  Calendar,
  FileText,
  CreditCard,
  ChevronRight,
  LogOut,
  Menu,
  X as CloseIcon,
  Briefcase,
  MessageSquare,
  Bell,
  Inbox,
  Loader2,
  ChevronDown,
  User as UserIcon,
  Search,
} from 'lucide-react';

const navItems = [
  { to: '/member/dashboard', label: 'Overview', icon: LayoutGrid, end: true, color: 'text-sky-500' },
  { to: '/member/profile', label: 'Profile', icon: User, color: 'text-indigo-500' },
  { to: '/member/events', label: 'Events', icon: Calendar, color: 'text-green-500' },
  { to: '/member/services', label: 'Services', icon: Briefcase, color: 'text-amber-500' },
  { to: '/member/blog', label: 'Blog', icon: FileText, color: 'text-orange-500' },
  { to: '/member/subscriptions', label: 'Subscriptions', icon: CreditCard, color: 'text-sky-600' },
  { to: '/member/tickets', label: 'Tickets', icon: Inbox, color: 'text-slate-600' },
  { to: '/member/chat', label: 'Chat', icon: MessageSquare, color: 'text-violet-500' },
];

const reportsSubmenu = [
  { to: '/member/reports', label: 'Overview', color: 'text-sky-500' },
  { to: '/member/reports/membership', label: 'Membership Report', color: 'text-indigo-500' },
  { to: '/member/reports/events', label: 'Event Reports', color: 'text-blue-500' },
  { to: '/member/reports/services', label: 'Service Reports', color: 'text-emerald-500' },
  { to: '/member/reports/tickets', label: 'Ticket Reports', color: 'text-amber-500' },
  { to: '/member/reports/payments', label: 'Payment Reports', color: 'text-rose-500' },
];

const otherNavItems = [
  { to: '/member/id-card', label: 'My ID Card', icon: CreditCard, color: 'text-purple-500' },
  { to: '/member/license', label: 'My License', icon: CreditCard, color: 'text-violet-500' },
  { to: '/member/payments', label: 'Payments', icon: CreditCard, color: 'text-emerald-500' },
];

const MemberLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  type ApiNotification = { id: string; title: string; read: boolean; createdAt: string; link?: string };
  type Panel = 'notifications' | 'user' | null;

  const [open, setOpen] = useState<Panel>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const queryClient = useQueryClient();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const { data: notifications = [], isLoading: notifsLoading, isError: notifsError } = useQuery({
    queryKey: ['member-notifications'],
    queryFn: async () => {
      const { data } = await api.get<ApiNotification[]>('/notifications');
      return data;
    },
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-notifications'] }),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-notifications'] }),
  });

  const unread = notifications.filter((n) => !n.read).length;

  const close = useCallback(() => setOpen(null), []);
  const toggle = useCallback((panel: Exclude<Panel, null>) => {
    setOpen((prev) => (prev === panel ? null : panel));
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [close]);

  // Scroll main content area to top on every navigation
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleLogout = () => {
    close();
    logout();
    navigate('/login', { replace: true });
  };

  const iconBtn =
    'inline-flex shrink-0 items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-gray-600 transition-colors hover:bg-gray-100 active:bg-gray-200 sm:min-h-[40px] sm:min-w-[40px] sm:rounded-lg';

  const panelClass =
    'absolute right-0 z-50 mt-1 max-h-[min(70vh,24rem)] w-[min(calc(100vw-1.5rem),20rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 sm:max-h-[min(80vh,22rem)] sm:w-80';

  const notifId = `${baseId}-notifications`;
  const userId = `${baseId}-user`;

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex font-poppins relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[50] w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <Link
              to="/"
              title="Back to public home"
              className="text-lg font-black text-sky-600 hover:text-sky-500 transition-colors block"
            >
              OMMS
            </Link>
            <p className="text-xs text-gray-500 mt-1">Member Dashboard</p>
          </div>
          <button 
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  active ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className={active ? '' : (item as any).color} />
                <span className={active ? 'text-white' : 'text-gray-600'}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Reports Collapsible Menu */}
          <div>
            <button
              onClick={() => setIsReportsOpen(!isReportsOpen)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                location.pathname.startsWith('/member/reports')
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={18}
                  className={
                    location.pathname.startsWith('/member/reports') ? '' : 'text-rose-500'
                  }
                />
                <span
                  className={
                    location.pathname.startsWith('/member/reports')
                      ? 'text-white'
                      : 'text-gray-600'
                  }
                >
                  Reports
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${isReportsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isReportsOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {reportsSubmenu.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        active ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={active ? 'text-indigo-700' : item.color}>•</span>
                      <span className={active ? 'text-indigo-700' : 'text-gray-600'}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {otherNavItems.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  active ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className={active ? '' : (item as any).color} />
                <span className={active ? 'text-white' : 'text-gray-600'}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs border border-sky-200 overflow-hidden">
              {user?.profile_photo_path ? (
                <img 
                  src={`http://localhost:5000/${user.profile_photo_path.replace(/\\/g, '/')}`} 
                  alt="" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                user?.name?.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500">Member</p>
            </div>
          </div>
          <Link to="/member/profile" onClick={closeSidebar} className="text-xs font-bold text-sky-600 flex items-center justify-between hover:underline">
            Edit Profile
            <ChevronRight size={12} />
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-3 flex items-center gap-2 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-[30]">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 mx-4 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search events, services, blogs..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4" ref={containerRef}>
            <div className="relative">
                {open === 'notifications' ? (
                  <button
                    title="notifications"
                    type="button"
                    className={`${iconBtn} relative`}
                    aria-label="Notifications"
                    aria-expanded="true"
                    aria-haspopup="true"
                    aria-controls={notifId}
                    id={`${notifId}-trigger`}
                    onClick={() => toggle('notifications')}
                  >
                    <Bell size={20} />
                    {unread > 0 ? (
                      <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white sm:right-1.5 sm:top-1.5">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </button>
                ) : (
                  <button
                    title="notifications"
                    type="button"
                    className={`${iconBtn} relative`}
                    aria-label="Notifications"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-controls={notifId}
                    id={`${notifId}-trigger`}
                    onClick={() => toggle('notifications')}
                  >
                    <Bell size={20} />
                    {unread > 0 ? (
                      <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white sm:right-1.5 sm:top-1.5">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    ) : null}
                  </button>
                )}

              {open === 'notifications' ? (
                <div
                  id={notifId}
                  role="region"
                  aria-labelledby={`${notifId}-trigger`}
                  className={panelClass}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    {unread > 0 && !notifsLoading ? (
                      <button
                        type="button"
                        onClick={() => markAllMut.mutate()}
                        disabled={markAllMut.isPending}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                      >
                        {markAllMut.isPending ? '…' : 'Mark all read'}
                      </button>
                    ) : null}
                  </div>

                  <ul className="max-h-[min(50vh,18rem)] divide-y divide-gray-50 overflow-y-auto overscroll-contain">
                    {notifsLoading ? (
                      <li className="flex justify-center px-4 py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-label="Loading" />
                      </li>
                    ) : notifsError ? (
                      <li className="px-4 py-8 text-center text-sm text-red-600">
                        Could not load notifications.
                      </li>
                    ) : notifications.length === 0 ? (
                      <li className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-gray-500">
                        <Inbox className="h-8 w-8 text-gray-300" aria-hidden />
                        No notifications
                      </li>
                    ) : (
                      notifications.map((n: ApiNotification) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (!n.read) markReadMut.mutate(n.id);
                              if (n.link) {
                                close();
                                navigate(n.link);
                              }
                            }}
                            disabled={markReadMut.isPending}
                            className={`flex w-full gap-3 px-3 py-3 text-left text-sm transition hover:bg-gray-50 disabled:opacity-60 ${
                              n.read ? 'opacity-75' : 'bg-indigo-50/40'
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                n.read ? 'bg-gray-300' : 'bg-indigo-500'
                              }`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-slate-800">{n.title}</span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                {relativeTime(n.createdAt)}
                              </span>
                            </span>
                            {n.link && (
                              <ChevronDown className="mt-1.5 h-4 w-4 shrink-0 text-gray-400 rotate-[-90deg]" />
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="relative">
              {open === 'user' ? (
                <button
                  title="user menu"
                  type="button"
                  className="inline-flex items-center gap-3 text-sm font-bold text-gray-800 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors"
                  aria-expanded="true"
                  aria-haspopup="true"
                  aria-controls={userId}
                  id={`${userId}-trigger`}
                  onClick={() => toggle('user')}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img
                      src={
                        user?.profile_photo_path 
                          ? `http://localhost:5000/${user.profile_photo_path.replace(/\\/g, '/')}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=e0e7ff&color=3730a3`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                  <ChevronDown
                    size={16}
                    className="text-gray-400 transition-transform rotate-180"
                  />
                </button>
              ) : (
                <button
                  title="user menu"
                  type="button"
                  className="inline-flex items-center gap-3 text-sm font-bold text-gray-800 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors"
                  aria-expanded="false"
                  aria-haspopup="true"
                  aria-controls={userId}
                  id={`${userId}-trigger`}
                  onClick={() => toggle('user')}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img
                      src={
                        user?.profile_photo_path 
                          ? `http://localhost:5000/${user.profile_photo_path.replace(/\\/g, '/')}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=e0e7ff&color=3730a3`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="hidden sm:inline">{user?.name}</span>
                  <ChevronDown
                    size={16}
                    className="text-gray-400 transition-transform"
                  />
                </button>
              )}

              {open === 'user' ? (
                <div
                  title="user menu"
                  id={userId}
                  role="menu"
                  aria-labelledby={`${userId}-trigger`}
                  className={`${panelClass} max-h-none`}
                >
                  <div className="border-b border-gray-100 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>

                  <div className="py-1" role="none">
                    <Link
                      to="/member/profile"
                      role="menuitem"
                      onClick={close}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                      Profile
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 p-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                      Log out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main ref={mainRef} className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
