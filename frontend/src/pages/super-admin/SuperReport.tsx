import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, TrendingUp, Users, Building2, CreditCard, 
  Ticket, Filter, Printer, Mail, FileSpreadsheet,
  Activity, ShieldCheck, ChevronDown, Search
} from 'lucide-react';
import { reportService } from '../../services/reportService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const superSectionToReport: Record<string, string> = {
  organizations: 'organizations',
  membership: 'membership',
  revenue: 'revenue',
  subscriptions: 'subscription',
  tickets: 'tickets',
  system: 'system',
};

const SuperReport: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const activeReport = section ? (superSectionToReport[section] ?? 'overview') : 'overview';

  const [dateRange, setDateRange] = useState('month');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const closeExportDropdown = useCallback(() => setIsExportOpen(false), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        closeExportDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeExportDropdown]);
  const [searchQuery, setSearchQuery] = useState('');

  // Organizations filters
  const [orgStatusFilter, setOrgStatusFilter] = useState('all');
  const [orgPlanFilter, setOrgPlanFilter] = useState('all');
  const [orgLocationFilter, setOrgLocationFilter] = useState('all');

  // Membership filters
  const [memOrgFilter, setMemOrgFilter] = useState('all');
  const [memStatusFilter, setMemStatusFilter] = useState('all');
  const [memRoleFilter, setMemRoleFilter] = useState('all');
  const [memVerifiedFilter, setMemVerifiedFilter] = useState('all');

  // Revenue filters
  const [revOrgFilter, setRevOrgFilter] = useState('all');
  const [revMethodFilter, setRevMethodFilter] = useState('all');
  const [revPlanFilter, setRevPlanFilter] = useState('all');
  const [revStatusFilter, setRevStatusFilter] = useState('all');

  // Subscription filters
  const [subOrgFilter, setSubOrgFilter] = useState('all');
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [subBillingFilter, setSubBillingFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subAutoRenewFilter, setSubAutoRenewFilter] = useState('all');

  // Tickets filters
  const [tkOrgFilter, setTkOrgFilter] = useState('all');
  const [tkStatusFilter, setTkStatusFilter] = useState('all');
  const [tkPriorityFilter, setTkPriorityFilter] = useState('all');
  const [tkCategoryFilter, setTkCategoryFilter] = useState('all');
  const [tkAssignedFilter, setTkAssignedFilter] = useState('all');

  // Fetch reports data from the backend
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      'superadmin-analytics',
      activeReport,
      dateRange,
      searchQuery,
      orgStatusFilter,
      orgPlanFilter,
      orgLocationFilter,
      memOrgFilter,
      memStatusFilter,
      memRoleFilter,
      memVerifiedFilter,
      revOrgFilter,
      revMethodFilter,
      revPlanFilter,
      revStatusFilter,
      subOrgFilter,
      subPlanFilter,
      subBillingFilter,
      subStatusFilter,
      subAutoRenewFilter,
      tkOrgFilter,
      tkStatusFilter,
      tkPriorityFilter,
      tkCategoryFilter,
      tkAssignedFilter
    ],
    queryFn: () => reportService.getSuperAdminAnalytics({
      tab: activeReport,
      dateRange,
      search: searchQuery,
      status: orgStatusFilter,
      plan: orgPlanFilter,
      location: orgLocationFilter,
      memOrg: memOrgFilter,
      memStatus: memStatusFilter,
      memRole: memRoleFilter,
      memVerified: memVerifiedFilter,
      revOrg: revOrgFilter,
      revMethod: revMethodFilter,
      revPlan: revPlanFilter,
      revStatus: revStatusFilter,
      subOrg: subOrgFilter,
      subPlan: subPlanFilter,
      subBilling: subBillingFilter,
      subStatus: subStatusFilter,
      subAutoRenew: subAutoRenewFilter,
      tkOrg: tkOrgFilter,
      tkStatus: tkStatusFilter,
      tkPriority: tkPriorityFilter,
      tkCategory: tkCategoryFilter,
      tkAssigned: tkAssignedFilter
    })
  });

  const hasActiveFilters = (() => {
    if (searchQuery) return true;
    if (activeReport === 'organizations') return orgStatusFilter !== 'all' || orgPlanFilter !== 'all' || orgLocationFilter !== 'all';
    if (activeReport === 'membership') return memOrgFilter !== 'all' || memStatusFilter !== 'all' || memRoleFilter !== 'all' || memVerifiedFilter !== 'all';
    if (activeReport === 'revenue') return revOrgFilter !== 'all' || revMethodFilter !== 'all' || revPlanFilter !== 'all' || revStatusFilter !== 'all';
    if (activeReport === 'subscription') return subOrgFilter !== 'all' || subPlanFilter !== 'all' || subBillingFilter !== 'all' || subStatusFilter !== 'all' || subAutoRenewFilter !== 'all';
    if (activeReport === 'tickets') return tkOrgFilter !== 'all' || tkStatusFilter !== 'all' || tkPriorityFilter !== 'all' || tkCategoryFilter !== 'all' || tkAssignedFilter !== 'all';
    return false;
  })();

  const clearFilters = () => {
    setSearchQuery('');
    setOrgStatusFilter('all'); setOrgPlanFilter('all'); setOrgLocationFilter('all');
    setMemOrgFilter('all'); setMemStatusFilter('all'); setMemRoleFilter('all'); setMemVerifiedFilter('all');
    setRevOrgFilter('all'); setRevMethodFilter('all'); setRevPlanFilter('all'); setRevStatusFilter('all');
    setSubOrgFilter('all'); setSubPlanFilter('all'); setSubBillingFilter('all'); setSubStatusFilter('all'); setSubAutoRenewFilter('all');
    setTkOrgFilter('all'); setTkStatusFilter('all'); setTkPriorityFilter('all'); setTkCategoryFilter('all'); setTkAssignedFilter('all');
  };

  const getQuickStats = () => {
    if (activeReport === 'overview' && reportData?.quickStats) {
      const statsIcons = [Building2, Users, CreditCard, ShieldCheck];
      const statsBgs = ['bg-indigo-50', 'bg-emerald-50', 'bg-amber-50', 'bg-rose-50'];
      const statsColors = ['text-indigo-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500'];
      return reportData.quickStats.map((stat: any, idx: number) => ({
        label: stat.label,
        value: stat.value,
        icon: statsIcons[idx] || ShieldCheck,
        color: statsColors[idx] || 'text-rose-500',
        bg: statsBgs[idx] || 'bg-rose-50'
      }));
    }
    return [
      { label: 'Total Organizations', value: '...', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { label: 'Total Members', value: '...', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Total Revenue', value: '...', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'Active Subscriptions', value: '...', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];
  };

  const quickStats = getQuickStats();

  const exportOptions = [
    { label: 'Export PDF', icon: FileText },
    { label: 'Export Excel', icon: FileSpreadsheet },
    { label: 'Export CSV', icon: Download },
    { label: 'Print Report', icon: Printer },
    { label: 'Email Report', icon: Mail },
  ];

  const orgOptions = [
    { value: 'tech-corp-ethiopia', label: 'Tech Corp Ethiopia' },
    { value: 'addis-innovations', label: 'Addis Innovations' },
    { value: 'lion-tech-solutions', label: 'Lion Tech Solutions' },
    { value: 'blue-nile-services', label: 'Blue Nile Services' },
    { value: 'ethiopian-digital-hub', label: 'Ethiopian Digital Hub' },
  ];

  const selectClass = 'rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive analytics for the entire platform</p>
        </div>
        <div className="relative" ref={exportDropdownRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
            <ChevronDown size={14} className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
          </button>
          {isExportOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[180px]">
              {exportOptions.map((option, idx) => {
                const Icon = option.icon;
                return (
                  <button key={idx} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl" onClick={() => setIsExportOpen(false)}>
                    <Icon size={16} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat: any, idx: number) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bg} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>

        {/* Search — all table views */}
        {activeReport !== 'overview' && (
          <div className="flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Date range — all views */}
        <select title="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={selectClass}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        {/* ── Organizations filters ── */}
        {activeReport === 'organizations' && (
          <>
            <select title="Status" value={orgStatusFilter} onChange={(e) => setOrgStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
            <select title="Plan" value={orgPlanFilter} onChange={(e) => setOrgPlanFilter(e.target.value)} className={selectClass}>
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select title="Location" value={orgLocationFilter} onChange={(e) => setOrgLocationFilter(e.target.value)} className={selectClass}>
              <option value="all">All Locations</option>
              <option value="addis-ababa">Addis Ababa</option>
              <option value="bahir-dar">Bahir Dar</option>
              <option value="hawassa">Hawassa</option>
              <option value="dire-dawa">Dire Dawa</option>
            </select>
          </>
        )}

        {/* ── Membership filters ── */}
        {activeReport === 'membership' && (
          <>
            <select title="Organization" value={memOrgFilter} onChange={(e) => setMemOrgFilter(e.target.value)} className={selectClass}>
              <option value="all">All Organizations</option>
              {orgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select title="Status" value={memStatusFilter} onChange={(e) => setMemStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select title="Role" value={memRoleFilter} onChange={(e) => setMemRoleFilter(e.target.value)} className={selectClass}>
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
            <select title="Verified" value={memVerifiedFilter} onChange={(e) => setMemVerifiedFilter(e.target.value)} className={selectClass}>
              <option value="all">All</option>
              <option value="yes">Verified</option>
              <option value="no">Unverified</option>
            </select>
          </>
        )}

        {/* ── Revenue filters ── */}
        {activeReport === 'revenue' && (
          <>
            <select title="Organization" value={revOrgFilter} onChange={(e) => setRevOrgFilter(e.target.value)} className={selectClass}>
              <option value="all">All Organizations</option>
              {orgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select title="Method" value={revMethodFilter} onChange={(e) => setRevMethodFilter(e.target.value)} className={selectClass}>
              <option value="all">All Methods</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe-birr">CBE Birr</option>
              <option value="chapa">Chapa</option>
              <option value="cash">Cash</option>
            </select>
            <select title="Plan" value={revPlanFilter} onChange={(e) => setRevPlanFilter(e.target.value)} className={selectClass}>
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select title="Status" value={revStatusFilter} onChange={(e) => setRevStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </>
        )}

        {/* ── Subscription filters ── */}
        {activeReport === 'subscription' && (
          <>
            <select title="Organization" value={subOrgFilter} onChange={(e) => setSubOrgFilter(e.target.value)} className={selectClass}>
              <option value="all">All Organizations</option>
              {orgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select title="Plan" value={subPlanFilter} onChange={(e) => setSubPlanFilter(e.target.value)} className={selectClass}>
              <option value="all">All Plans</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select title="Billing Cycle" value={subBillingFilter} onChange={(e) => setSubBillingFilter(e.target.value)} className={selectClass}>
              <option value="all">All Billing Cycles</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
            <select title="Status" value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
            <select title="Auto Renew" value={subAutoRenewFilter} onChange={(e) => setSubAutoRenewFilter(e.target.value)} className={selectClass}>
              <option value="all">All</option>
              <option value="yes">Auto-renew On</option>
              <option value="no">Auto-renew Off</option>
            </select>
          </>
        )}

        {/* ── Tickets filters ── */}
        {activeReport === 'tickets' && (
          <>
            <select title="Organization" value={tkOrgFilter} onChange={(e) => setTkOrgFilter(e.target.value)} className={selectClass}>
              <option value="all">All Organizations</option>
              {orgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select title="Status" value={tkStatusFilter} onChange={(e) => setTkStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select title="Priority" value={tkPriorityFilter} onChange={(e) => setTkPriorityFilter(e.target.value)} className={selectClass}>
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select title="Category" value={tkCategoryFilter} onChange={(e) => setTkCategoryFilter(e.target.value)} className={selectClass}>
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="feature">Feature</option>
              <option value="admin">Admin</option>
            </select>
            <select title="Assigned" value={tkAssignedFilter} onChange={(e) => setTkAssignedFilter(e.target.value)} className={selectClass}>
              <option value="all">All Assigned</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>
          </>
        )}

        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl bg-white hover:bg-gray-50">
            Clear Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 animate-pulse font-medium">
          Loading reports data...
        </div>
      ) : (
        <>
          {/* ── Overview ── */}
          {activeReport === 'overview' && reportData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Growth Trend</h3>
                  <TrendingUp size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.statsData || []}>
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="members" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Subscription Plans</h3>
                  <ShieldCheck size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={reportData.planData || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {(reportData.planData || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Ticket Status</h3>
                  <Ticket size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.ticketData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Payment Methods</h3>
                  <CreditCard size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={reportData.paymentMethodData || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {(reportData.paymentMethodData || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Organizations ── */}
          {activeReport === 'organizations' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Organization Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Members</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">No organizations match the selected filters.</td></tr>
                    ) : reportData.map((org: any) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{org.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${org.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : org.status === 'Suspended' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'}`}>{org.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.members}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.plan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{org.revenue}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.joined}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Membership ── */}
          {activeReport === 'membership' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Membership Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-400">No members match the selected filters.</td></tr>
                    ) : reportData.map((member: any) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.organization}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{member.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${member.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{member.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${member.verified === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{member.verified}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.joined}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.lastLogin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Revenue ── */}
          {activeReport === 'revenue' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Revenue Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No revenue records match the selected filters.</td></tr>
                    ) : reportData.map((rev: any) => (
                      <tr key={rev.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rev.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{rev.invoice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{rev.organization}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{rev.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rev.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rev.transactionId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rev.plan}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${rev.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : rev.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{rev.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Subscriptions ── */}
          {activeReport === 'subscription' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Subscription Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Billing Cycle</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Auto Renew</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No subscriptions match the selected filters.</td></tr>
                    ) : reportData.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{sub.organization}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sub.plan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.startDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.endDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sub.billingCycle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{sub.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${sub.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-800' : sub.status === 'Suspended' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'}`}>{sub.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${sub.autoRenew === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{sub.autoRenew}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tickets ── */}
          {activeReport === 'tickets' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Ticket Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">No tickets match the selected filters.</td></tr>
                    ) : reportData.map((ticket: any) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{ticket.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{ticket.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={ticket.description}>{ticket.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.organization}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${ticket.priority === 'High' ? 'bg-rose-100 text-rose-800' : ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{ticket.priority}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${ticket.status === 'Open' ? 'bg-rose-100 text-rose-800' : ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{ticket.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.assigned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── System ── */}
          {activeReport === 'system' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">System Reports</h3>
              </div>
              <div className="p-8 text-center text-sm text-gray-400">
                System health metrics are fully operational. All modules healthy.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SuperReport;

