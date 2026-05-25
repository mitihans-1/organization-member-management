import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Building2, Users, DollarSign, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useCountAnimation from '../../hooks/useCountAnimation';
import { useAuth } from '../../context/AuthContext';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  growth?: number | null;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, color, growth }) => {
  const safeValue = value ?? 0;
  const animatedValue = useCountAnimation(safeValue);
  
  const colorClasses: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  const safeGrowth = growth ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-1">
            {animatedValue}
          </p>
          {growth !== null && growth !== undefined && (
            <p className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${safeGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {safeGrowth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(safeGrowth)}% from last month
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => api.get('/dashboard/analytics').then((r) => r.data),
  });

  const stats = statsData?.stats ?? [];
  const isLoading = statsLoading || analyticsLoading;

  const kpis = [
    { 
      label: 'Total Organizations', 
      value: analyticsData?.totalOrganizations ?? '—', 
      icon: Building2,
      color: 'sky',
      growth: null
    },
    { 
      label: 'Total Members', 
      value: analyticsData?.totalMembers ?? '—', 
      icon: Users,
      color: 'emerald',
      growth: null
    },
    { 
      label: 'Monthly Revenue', 
      value: `${analyticsData?.monthlyRevenue ?? 0} ETB`, 
      icon: DollarSign,
      color: 'indigo',
      growth: analyticsData?.revenueGrowth ?? 0
    },
    { 
      label: 'Monthly Registrations', 
      value: analyticsData?.monthlyRegistrations ?? '—', 
      icon: Activity,
      color: 'orange',
      growth: analyticsData?.registrationGrowth ?? 0
    },
    { 
      label: 'Churn Rate', 
      value: `${analyticsData?.churnRate ?? 0}%`, 
      icon: TrendingDown,
      color: 'red',
      growth: null
    },
  ];

  return (
    <div className="max-w-5xl space-y-8 font-poppins">
      <div className="rounded-2xl bg-sky-600 text-white px-8 py-10 shadow-lg">
        <h1 className="text-2xl font-black">Welcome back, {user?.name}!</h1>
        <p className="mt-2 text-sky-100 text-sm">Here&apos;s your platform overview for today.</p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.slice(0, 4).map((k) => (
            <KPICard key={k.label} {...k} />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" />
                Revenue Trend (Last 12 Months)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value: any) => [`${value} ETB`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Registrations (Last 12 Months)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData?.registrationChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value: any) => [value, 'Registrations']}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {analyticsData?.topOrganizations?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-sky-600" />
                Top Organizations by Revenue
              </h3>
              <div className="space-y-3">
                {analyticsData.topOrganizations.map((org: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-slate-900">{org.name}</span>
                        <span className="text-sm font-bold text-indigo-600">{org.revenue} ETB</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (org.revenue / (analyticsData.topOrganizations[0]?.revenue || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
