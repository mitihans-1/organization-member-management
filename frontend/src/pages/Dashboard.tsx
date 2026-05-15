import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Users, Calendar, FileText, CreditCard, AlertCircle, Briefcase, Settings, UserPlus, Database, Lock, Terminal, BarChart, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';

const platformFeatures = [
  { title: 'Community Tools', desc: 'Powerful tools for member interaction and engagement.', icon: UserPlus },
  { title: 'Secure Database', desc: 'Industry-standard encryption and security protocols.', icon: Database },
  { title: 'Admin Controls', desc: 'Granular control over member roles and permissions.', icon: Settings },
  { title: 'Global Access', desc: 'Cloud-based infrastructure for worldwide availability.', icon: Globe },
  { title: 'Real-time Analytics', desc: 'Deep insights into your organization’s health and growth.', icon: BarChart },
  { title: 'Smart Integration', desc: 'Easily connect with your existing workflows and APIs.', icon: Terminal },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((res) => res.data),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then((res) => res.data),
    enabled: user?.role === 'orgAdmin' || user?.role === 'SuperAdmin',
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((res) => res.data),
    enabled: user?.role === 'orgAdmin' || user?.role === 'member',
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((res) => res.data),
    enabled: user?.role === 'orgAdmin' || user?.role === 'member',
  });

  const { data: blogs } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => api.get('/blogs').then((res) => res.data),
    enabled: user?.role === 'orgAdmin',
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((res) => res.data),
    enabled: user?.role === 'orgAdmin',
  });

  const statsCards = useMemo(() => {
    const stats = dashboardData?.stats ?? [];
    const find = (needle: string) =>
      stats.find((s: { label: string }) => s.label?.toLowerCase().includes(needle.toLowerCase()));
    const memberVal = find('member')?.value ?? members?.length ?? '—';
    const eventVal = find('event')?.value ?? events?.length ?? '—';
    const serviceVal = services?.length ?? '—';
    const blogVal = find('blog')?.value ?? blogs?.length ?? '—';
    const paidSum =
      payments?.reduce((a: number, p: { amount?: number }) => a + (p.amount || 0), 0) ?? 0;

    return [
      {
        label: 'Total Members',
        value: String(memberVal),
        sub: <span className="text-emerald-600 font-semibold">↑ +12 this month</span>,
        icon: Users,
      },
      {
        label: 'Active Events',
        value: String(eventVal),
        sub: <span className="text-gray-500">upcoming this week</span>,
        icon: Calendar,
      },
      {
        label: 'Active Services',
        value: String(serviceVal),
        sub: <span className="text-blue-500 font-semibold">available for members</span>,
        icon: Briefcase,
      },
      {
        label: 'Total blogs',
        value: String(blogVal),
        sub: <span className="text-rose-600 font-semibold">+12 Blogs</span>,
        icon: FileText,
      },
      {
        label: 'Total Paid Payments',
        value: `ETB ${paidSum.toLocaleString()}`,
        sub: <span className="text-rose-600 font-semibold">Total paid this week</span>,
        icon: CreditCard,
      },
    ];
  }, [dashboardData, members, events, services, blogs, payments]);

  const upcoming = events?.slice(0, 3) ?? [];
  const firstEvent = upcoming[0];
  const activeServices = services?.filter((s: any) => s.status === 'Active' || s.status === 'published').slice(0, 3) ?? [];
  const firstService = activeServices[0];
  const reminders = useMemo(() => {
    const items: { key: string; title: string; description: string; ctaLabel: string; to: string }[] = [];

    if (blogs?.length) {
      items.push({
        key: 'blogs',
        title: 'Blog Post Review',
        description: `You have ${blogs.length} blog${blogs.length === 1 ? '' : 's'} that may need review.`,
        ctaLabel: 'Review Blogs',
        to: '/org-admin/blogs',
      });
    }

    if (events?.length) {
      items.push({
        key: 'events',
        title: 'Event Venue Confirmation',
        description: `${events.length} upcoming event${events.length === 1 ? '' : 's'} need planning updates.`,
        ctaLabel: 'Open Events',
        to: '/org-admin/events',
      });
    }

    if (services?.length) {
      items.push({
        key: 'services',
        title: 'Service Management',
        description: `${services.length} active service${services.length === 1 ? '' : 's'} available.`,
        ctaLabel: 'Manage Services',
        to: '/org-admin/services',
      });
    }

    if (dashboardData?.expiry) {
      items.push({
        key: 'plan',
        title: 'Subscription Check',
        description: `Plan expiry: ${new Date(dashboardData.expiry).toLocaleDateString()}.`,
        ctaLabel: 'Manage Plan',
        to: '/org-admin/upgrade',
      });
    }

    return items.slice(0, 3);
  }, [blogs, events, services, dashboardData]);

  return (
    <div className="space-y-8 font-poppins">
      <OrgAdminPageHeader title="Dashboard" />

      {user?.role !== 'SuperAdmin' && dashboardData?.expiry && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-indigo-600 shrink-0" size={22} />
            <p className="text-sm text-gray-800 font-semibold">
              Your{' '}
              <span className="text-indigo-600">{dashboardData.plan?.name}</span> plan expires on{' '}
              {new Date(dashboardData.expiry).toLocaleDateString()}
            </p>
          </div>
          <Link
            to="/org-admin/upgrade"
            className="inline-flex justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{card.label}</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{card.value}</p>
                  <div className="text-xs mt-2">{card.sub}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Icon size={22} strokeWidth={2} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Events and Services Separate Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Dashboard */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Events Dashboard
            </h2>
            <Link to="/org-admin/events" className="text-sm font-bold text-indigo-600 hover:underline">
              View All Events
            </Link>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Calendar-based, activity-oriented event management
          </p>
          {firstEvent ? (
            <div className="rounded-xl border border-gray-100 bg-blue-50/30 p-5">
              <p className="text-sm text-gray-600">
                {new Date(firstEvent.date).toLocaleDateString()} {new Date(firstEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                — <span className="font-bold text-gray-900">{firstEvent.title}</span>
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link
                  to="/org-admin/events"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
                >
                  Manage Events
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming events.</p>
          )}
        </div>

        {/* Services Dashboard */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Briefcase size={20} className="text-green-600" />
              Services Dashboard
            </h2>
            <Link to="/org-admin/services" className="text-sm font-bold text-green-600 hover:underline">
              View All Services
            </Link>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Operational, administrative service management
          </p>
          {firstService ? (
            <div className="rounded-xl border border-gray-100 bg-green-50/30 p-5">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{firstService.title}</span>
                {' '}— {firstService.status || 'Active'}
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link
                  to="/org-admin/services"
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-500"
                >
                  Manage Services
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active services.</p>
          )}
        </div>
      </div>

      {/* Reminders Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900">Reminders</h2>
          <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5">
            {reminders.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-6">Items requiring your attention</p>
        {reminders.length ? (
          <div className="space-y-4">
            {reminders.map((item) => (
              <div key={item.key} className="rounded-xl border border-gray-100 p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {item.title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    <Link
                      to={item.to}
                      className="mt-4 inline-flex w-full sm:w-auto justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
                    >
                      {item.ctaLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">No reminders right now.</p>
          </div>
        )}
      </div>

      {/* Platform Features Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Platform Features</h2>
        </div>
        <p className="text-sm text-gray-500 mb-8">Powerful capabilities to manage your organization</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
