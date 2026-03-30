import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Building2, UserCog, Users, DollarSign, TrendingUp } from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });

  const stats = data?.stats ?? [];

  const kpis = [
    { label: 'Total Organizations', value: stats.find((s: any) => s.label?.includes('Organization'))?.value ?? '—', sub: '+ from last month', icon: Building2 },
    { label: 'Active OrgAdmins', value: stats.find((s: any) => s.label?.includes('Organization'))?.value ?? '—', sub: null, icon: UserCog },
    { label: 'Active Members', value: stats.find((s: any) => s.label?.includes('Members'))?.value ?? '—', sub: null, icon: Users },
    { label: 'Monthly Revenue', value: stats.find((s: any) => s.label?.includes('Revenue'))?.value ?? '—', sub: 'Platform-wide', icon: DollarSign },
  ];

  const health = [
    { label: 'CPU Usage', pct: 63 },
    { label: 'Memory Usage', pct: 59 },
    { label: 'Disk Space', pct: 20 },
    { label: 'Network Load', pct: 23 },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Welcome back, Super Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Platform-wide overview and system health</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{k.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-1">
                    {k.value}
                    <TrendingUp size={16} className="text-emerald-500" />
                  </p>
                  {k.sub && <p className="text-[11px] text-slate-400 mt-1">{k.sub}</p>}
                </div>
                <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                  <k.icon size={22} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Financial snapshot</h2>
        <p className="text-sm text-slate-500 mb-4">Revenue and expenses aggregated across organizations</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-500 font-medium">Total Revenue</p>
            <p className="text-xl font-black text-slate-900 mt-1">{stats.find((s: any) => s.label?.includes('Revenue'))?.value ?? '—'}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-500 font-medium">Total Expenses</p>
            <p className="text-xl font-black text-slate-900 mt-1">—</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50">
            <p className="text-slate-500 font-medium">Profit margin</p>
            <p className="text-xl font-black text-emerald-600 mt-1">—</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-4">System health</h2>
        <div className="space-y-4 max-w-xl">
          {health.map((h) => (
            <div key={h.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{h.label}</span>
                <span className="text-slate-500">{h.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all"
                  style={{ width: `${h.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-6 text-right">Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
