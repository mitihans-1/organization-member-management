import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, Users, Calendar, CreditCard, 
  Ticket, Filter, Printer, Mail, 
  FileSpreadsheet, Shield, Briefcase, ChevronDown, Search
} from 'lucide-react';
import { reportService } from '../services/reportService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const sectionToReport: Record<string, string> = {
  members: 'members',
  events: 'events',
  services: 'services',
  tickets: 'tickets',
  blogs: 'blogs',
  payments: 'payments',
  'id-cards': 'idcards',
};

const OrganiReport: React.FC = () => {
  const { section } = useParams<{ section: string }>();
  const activeReport = section ? (sectionToReport[section] ?? 'overview') : 'overview';

  const [dateRange, setDateRange] = useState('month');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Members filters
  const [memStatusFilter, setMemStatusFilter] = useState('all');
  const [memVerifiedFilter, setMemVerifiedFilter] = useState('all');
  const [memRoleFilter, setMemRoleFilter] = useState('all');
  const [memGenderFilter, setMemGenderFilter] = useState('all');

  // Events filters
  const [evtStatusFilter, setEvtStatusFilter] = useState('all');
  const [evtTypeFilter, setEvtTypeFilter] = useState('all');
  const [evtLocationFilter, setEvtLocationFilter] = useState('all');

  // Services filters
  const [svcStatusFilter, setSvcStatusFilter] = useState('all');
  const [svcCategoryFilter, setSvcCategoryFilter] = useState('all');

  // Tickets filters
  const [tkStatusFilter, setTkStatusFilter] = useState('all');
  const [tkPriorityFilter, setTkPriorityFilter] = useState('all');
  const [tkCategoryFilter, setTkCategoryFilter] = useState('all');
  const [tkEscalatedFilter, setTkEscalatedFilter] = useState('all');
  const [tkAssignedFilter, setTkAssignedFilter] = useState('all');

  // Blogs filters
  const [blogStatusFilter, setBlogStatusFilter] = useState('all');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [blogAuthorFilter, setBlogAuthorFilter] = useState('all');

  // Payments filters
  const [payStatusFilter, setPayStatusFilter] = useState('all');
  const [payMethodFilter, setPayMethodFilter] = useState('all');
  const [payTypeFilter, setPayTypeFilter] = useState('all');

  // ID Cards filters
  const [idStatusFilter, setIdStatusFilter] = useState('all');
  const [idVerificationFilter, setIdVerificationFilter] = useState('all');

  // Fetch report data dynamically
  const { data: reportData, isLoading } = useQuery({
    queryKey: [
      'org-analytics',
      activeReport,
      dateRange,
      searchQuery,
      memStatusFilter,
      memVerifiedFilter,
      memRoleFilter,
      memGenderFilter,
      evtStatusFilter,
      evtTypeFilter,
      evtLocationFilter,
      svcStatusFilter,
      svcCategoryFilter,
      tkStatusFilter,
      tkPriorityFilter,
      tkCategoryFilter,
      tkEscalatedFilter,
      tkAssignedFilter,
      blogStatusFilter,
      blogCategoryFilter,
      blogAuthorFilter,
      payStatusFilter,
      payMethodFilter,
      payTypeFilter,
      idStatusFilter,
      idVerificationFilter
    ],
    queryFn: () => reportService.getOrgAnalytics({
      tab: activeReport,
      dateRange,
      search: searchQuery,
      memStatus: memStatusFilter,
      memVerified: memVerifiedFilter,
      memRole: memRoleFilter,
      memGender: memGenderFilter,
      evtStatus: evtStatusFilter,
      evtType: evtTypeFilter,
      evtLocation: evtLocationFilter,
      svcStatus: svcStatusFilter,
      svcCategory: svcCategoryFilter,
      tkStatus: tkStatusFilter,
      tkPriority: tkPriorityFilter,
      tkCategory: tkCategoryFilter,
      tkEscalated: tkEscalatedFilter,
      tkAssigned: tkAssignedFilter,
      blogStatus: blogStatusFilter,
      blogCategory: blogCategoryFilter,
      blogAuthor: blogAuthorFilter,
      payStatus: payStatusFilter,
      payMethod: payMethodFilter,
      payType: payTypeFilter,
      idStatus: idStatusFilter,
      idVerification: idVerificationFilter
    })
  });

  const hasActiveFilters = (() => {
    if (searchQuery) return true;
    if (activeReport === 'members') return memStatusFilter !== 'all' || memVerifiedFilter !== 'all' || memRoleFilter !== 'all' || memGenderFilter !== 'all';
    if (activeReport === 'events') return evtStatusFilter !== 'all' || evtTypeFilter !== 'all' || evtLocationFilter !== 'all';
    if (activeReport === 'services') return svcStatusFilter !== 'all' || svcCategoryFilter !== 'all';
    if (activeReport === 'tickets') return tkStatusFilter !== 'all' || tkPriorityFilter !== 'all' || tkCategoryFilter !== 'all' || tkEscalatedFilter !== 'all' || tkAssignedFilter !== 'all';
    if (activeReport === 'blogs') return blogStatusFilter !== 'all' || blogCategoryFilter !== 'all' || blogAuthorFilter !== 'all';
    if (activeReport === 'payments') return payStatusFilter !== 'all' || payMethodFilter !== 'all' || payTypeFilter !== 'all';
    if (activeReport === 'idcards') return idStatusFilter !== 'all' || idVerificationFilter !== 'all';
    return false;
  })();

  const clearFilters = () => {
    setSearchQuery('');
    setMemStatusFilter('all'); setMemVerifiedFilter('all'); setMemRoleFilter('all'); setMemGenderFilter('all');
    setEvtStatusFilter('all'); setEvtTypeFilter('all'); setEvtLocationFilter('all');
    setSvcStatusFilter('all'); setSvcCategoryFilter('all');
    setTkStatusFilter('all'); setTkPriorityFilter('all'); setTkCategoryFilter('all'); setTkEscalatedFilter('all'); setTkAssignedFilter('all');
    setBlogStatusFilter('all'); setBlogCategoryFilter('all'); setBlogAuthorFilter('all');
    setPayStatusFilter('all'); setPayMethodFilter('all'); setPayTypeFilter('all');
    setIdStatusFilter('all'); setIdVerificationFilter('all');
  };

  const getQuickStats = () => {
    if (activeReport === 'overview' && reportData?.quickStats) {
      const statsIcons = [Users, Calendar, Briefcase, CreditCard];
      const statsBgs = ['bg-indigo-50', 'bg-emerald-50', 'bg-amber-50', 'bg-rose-50'];
      const statsColors = ['text-indigo-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500'];
      return reportData.quickStats.map((stat: any, idx: number) => ({
        label: stat.label,
        value: stat.value,
        icon: statsIcons[idx] || Briefcase,
        color: statsColors[idx] || 'text-rose-500',
        bg: statsBgs[idx] || 'bg-rose-50'
      }));
    }
    return [
      { label: 'Total Members', value: '...', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { label: 'Total Events', value: '...', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'Active Services', value: '...', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'Total Revenue', value: '...', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-50' },
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

  const selectClass = 'rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Organization Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and insights for your organization</p>
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

        {/* Date range */}
        <select title="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={selectClass}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        {/* ── Members filters ── */}
        {activeReport === 'members' && (
          <>
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
              <option value="guest">Guest</option>
            </select>
            <select title="Verified" value={memVerifiedFilter} onChange={(e) => setMemVerifiedFilter(e.target.value)} className={selectClass}>
              <option value="all">All</option>
              <option value="yes">Verified</option>
              <option value="no">Unverified</option>
            </select>
            <select title="Gender" value={memGenderFilter} onChange={(e) => setMemGenderFilter(e.target.value)} className={selectClass}>
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </>
        )}

        {/* ── Events filters ── */}
        {activeReport === 'events' && (
          <>
            <select title="Status" value={evtStatusFilter} onChange={(e) => setEvtStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select title="Type" value={evtTypeFilter} onChange={(e) => setEvtTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="social">Social</option>
            </select>
            <select title="Location" value={evtLocationFilter} onChange={(e) => setEvtLocationFilter(e.target.value)} className={selectClass}>
              <option value="all">All Locations</option>
              <option value="addis-ababa">Addis Ababa</option>
              <option value="online">Online</option>
              <option value="bole">Bole</option>
              <option value="meskel-square">Meskel Square</option>
            </select>
          </>
        )}

        {/* ── Services filters ── */}
        {activeReport === 'services' && (
          <>
            <select title="Status" value={svcStatusFilter} onChange={(e) => setSvcStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select title="Category" value={svcCategoryFilter} onChange={(e) => setSvcCategoryFilter(e.target.value)} className={selectClass}>
              <option value="all">All Categories</option>
              <option value="admin">Admin</option>
              <option value="events">Events</option>
              <option value="support">Support</option>
              <option value="education">Education</option>
            </select>
          </>
        )}

        {/* ── Tickets filters ── */}
        {activeReport === 'tickets' && (
          <>
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
              <option value="event">Event</option>
              <option value="general">General</option>
            </select>
            <select title="Escalated" value={tkEscalatedFilter} onChange={(e) => setTkEscalatedFilter(e.target.value)} className={selectClass}>
              <option value="all">All</option>
              <option value="yes">Escalated</option>
              <option value="no">Not Escalated</option>
            </select>
            <select title="Assigned To" value={tkAssignedFilter} onChange={(e) => setTkAssignedFilter(e.target.value)} className={selectClass}>
              <option value="all">All Assigned</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
              <option value="events-team">Events Team</option>
            </select>
          </>
        )}

        {/* ── Blogs filters ── */}
        {activeReport === 'blogs' && (
          <>
            <select title="Status" value={blogStatusFilter} onChange={(e) => setBlogStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select title="Category" value={blogCategoryFilter} onChange={(e) => setBlogCategoryFilter(e.target.value)} className={selectClass}>
              <option value="all">All Categories</option>
              <option value="announcement">Announcement</option>
              <option value="information">Information</option>
              <option value="events">Events</option>
              <option value="tutorial">Tutorial</option>
            </select>
            <select title="Author" value={blogAuthorFilter} onChange={(e) => setBlogAuthorFilter(e.target.value)} className={selectClass}>
              <option value="all">All Authors</option>
              <option value="admin">Admin</option>
              <option value="events-team">Events Team</option>
              <option value="support">Support</option>
            </select>
          </>
        )}

        {/* ── Payments filters ── */}
        {activeReport === 'payments' && (
          <>
            <select title="Status" value={payStatusFilter} onChange={(e) => setPayStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select title="Method" value={payMethodFilter} onChange={(e) => setPayMethodFilter(e.target.value)} className={selectClass}>
              <option value="all">All Methods</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe-birr">CBE Birr</option>
              <option value="chapa">Chapa</option>
              <option value="cash">Cash</option>
            </select>
            <select title="Type" value={payTypeFilter} onChange={(e) => setPayTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="membership">Membership</option>
              <option value="service">Service</option>
              <option value="event">Event</option>
            </select>
          </>
        )}

        {/* ── ID Cards filters ── */}
        {activeReport === 'idcards' && (
          <>
            <select title="Status" value={idStatusFilter} onChange={(e) => setIdStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <select title="Verification" value={idVerificationFilter} onChange={(e) => setIdVerificationFilter(e.target.value)} className={selectClass}>
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
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
          Loading report metrics...
        </div>
      ) : (
        <>
          {/* ── Overview ── */}
          {activeReport === 'overview' && reportData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Member Growth</h3>
                  <Users size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.memberStatsData || []}>
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                    <Line type="monotone" dataKey="new" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Ticket Categories</h3>
                  <Ticket size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={reportData.ticketCategoriesData || []} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {(reportData.ticketCategoriesData || []).map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Event Attendance</h3>
                  <Calendar size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.eventAttendanceData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                    <Bar dataKey="attendance" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="capacity" fill="#e0e7ff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-gray-900">Revenue Trend</h3>
                  <CreditCard size={20} className="text-indigo-500" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.paymentData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Members ── */}
          {activeReport === 'members' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Member Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">No members match the selected filters.</td></tr>
                    ) : reportData.map((member: any) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{member.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{member.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${member.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{member.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${member.verified === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{member.verified}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.gender}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.age}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.joined}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.lastLogin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Events ── */}
          {activeReport === 'events' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Event Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organizer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-400">No events match the selected filters.</td></tr>
                    ) : reportData.map((event: any) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{event.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{event.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${event.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : event.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{event.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">{event.attendance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.organizer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Services ── */}
          {activeReport === 'services' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Service Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Requests</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Approved</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No services match the selected filters.</td></tr>
                    ) : reportData.map((service: any) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{service.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{service.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.requests}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">{service.approved}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-bold">{service.rejected}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-bold">{service.pending}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${service.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{service.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.lastUpdated}</td>
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
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Escalated</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">No tickets match the selected filters.</td></tr>
                    ) : reportData.map((ticket: any) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{ticket.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{ticket.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={ticket.description}>{ticket.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${ticket.priority === 'High' ? 'bg-rose-100 text-rose-800' : ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{ticket.priority}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${ticket.status === 'Open' ? 'bg-rose-100 text-rose-800' : ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{ticket.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.lastUpdated}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${ticket.escalated === 'Yes' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'}`}>{ticket.escalated}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.assignedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Blogs ── */}
          {activeReport === 'blogs' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Blog & Announcement Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Excerpt</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Likes</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Comments</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-400">No blogs match the selected filters.</td></tr>
                    ) : reportData.map((blog: any) => (
                      <tr key={blog.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{blog.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={blog.excerpt}>{blog.excerpt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{blog.author}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{blog.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{blog.views.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">{blog.likes}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-bold">{blog.comments}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${blog.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{blog.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Payments ── */}
          {activeReport === 'payments' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">Payment Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No payments match the selected filters.</td></tr>
                    ) : reportData.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{payment.invoice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{payment.member}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{payment.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.method}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.transactionId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>{payment.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ID Cards ── */}
          {activeReport === 'idcards' && reportData && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-black text-gray-900">ID Card Reports</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Card Number</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Generated</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No ID cards match the selected filters.</td></tr>
                    ) : reportData.map((card: any) => (
                      <tr key={card.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{card.cardNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{card.member}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${card.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{card.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.generated}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.expires}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800`}>{card.verification}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrganiReport;

