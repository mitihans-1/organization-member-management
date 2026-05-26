import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, TrendingUp, Users, Building2, CreditCard, 
  Ticket, Filter, Printer, Mail, FileSpreadsheet,
  Activity, ShieldCheck, ChevronDown, Search
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Organizations filters (columns: Organization, Email, Phone, Location, Status, Members, Plan, Revenue, Joined, Last Active)
  const [orgStatusFilter, setOrgStatusFilter] = useState('all');
  const [orgPlanFilter, setOrgPlanFilter] = useState('all');
  const [orgLocationFilter, setOrgLocationFilter] = useState('all');

  // Membership filters (columns: Member, Email, Phone, Organization, Role, Status, Verified, Joined, Last Login)
  const [memOrgFilter, setMemOrgFilter] = useState('all');
  const [memStatusFilter, setMemStatusFilter] = useState('all');
  const [memRoleFilter, setMemRoleFilter] = useState('all');
  const [memVerifiedFilter, setMemVerifiedFilter] = useState('all');

  // Revenue filters (columns: Date, Invoice, Organization, Amount, Method, Transaction ID, Plan, Status)
  const [revOrgFilter, setRevOrgFilter] = useState('all');
  const [revMethodFilter, setRevMethodFilter] = useState('all');
  const [revPlanFilter, setRevPlanFilter] = useState('all');
  const [revStatusFilter, setRevStatusFilter] = useState('all');

  // Subscription filters (columns: Organization, Plan, Start Date, End Date, Billing Cycle, Amount, Status, Auto Renew)
  const [subOrgFilter, setSubOrgFilter] = useState('all');
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [subBillingFilter, setSubBillingFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subAutoRenewFilter, setSubAutoRenewFilter] = useState('all');

  // Tickets filters (columns: Ticket ID, Title, Description, Organization, Priority, Category, Status, Created, Due Date, Assigned)
  const [tkOrgFilter, setTkOrgFilter] = useState('all');
  const [tkStatusFilter, setTkStatusFilter] = useState('all');
  const [tkPriorityFilter, setTkPriorityFilter] = useState('all');
  const [tkCategoryFilter, setTkCategoryFilter] = useState('all');
  const [tkAssignedFilter, setTkAssignedFilter] = useState('all');

  const statsData = [
    { name: 'Jan', members: 400, organizations: 24, revenue: 2400 },
    { name: 'Feb', members: 300, organizations: 13, revenue: 1398 },
    { name: 'Mar', members: 200, organizations: 98, revenue: 9800 },
    { name: 'Apr', members: 278, organizations: 39, revenue: 3908 },
    { name: 'May', members: 189, organizations: 48, revenue: 4800 },
    { name: 'Jun', members: 239, organizations: 38, revenue: 3800 },
  ];

  const planData = [
    { name: 'Basic', value: 400 },
    { name: 'Pro', value: 300 },
    { name: 'Enterprise', value: 300 },
    { name: 'Custom', value: 200 },
  ];

  const ticketData = [
    { name: 'Open', value: 40 },
    { name: 'In Progress', value: 30 },
    { name: 'Resolved', value: 100 },
  ];

  const paymentMethodData = [
    { name: 'Telebirr', value: 400 },
    { name: 'CBE Birr', value: 300 },
    { name: 'Chapa', value: 300 },
    { name: 'Cash', value: 200 },
  ];

  const organizationTableData = [
    { id: 1, name: 'Tech Corp Ethiopia', email: 'info@techcorp.com', phone: '+251 911 123 456', location: 'Addis Ababa', status: 'Active', members: 245, plan: 'Pro', revenue: 'ETB 45,000', joined: '2024-01-15', lastActive: '2024-06-10' },
    { id: 2, name: 'Addis Innovations', email: 'hello@addisinnovations.com', phone: '+251 922 234 567', location: 'Addis Ababa', status: 'Active', members: 189, plan: 'Enterprise', revenue: 'ETB 62,000', joined: '2024-02-20', lastActive: '2024-06-09' },
    { id: 3, name: 'Ethiopian Digital Hub', email: 'contact@digitalhub.et', phone: '+251 933 345 678', location: 'Bahir Dar', status: 'Suspended', members: 120, plan: 'Basic', revenue: 'ETB 12,000', joined: '2023-11-10', lastActive: '2024-05-15' },
    { id: 4, name: 'Lion Tech Solutions', email: 'info@liontech.com', phone: '+251 944 456 789', location: 'Hawassa', status: 'Active', members: 312, plan: 'Pro', revenue: 'ETB 58,000', joined: '2024-03-05', lastActive: '2024-06-10' },
    { id: 5, name: 'Blue Nile Services', email: 'support@bluenile.com', phone: '+251 955 567 890', location: 'Dire Dawa', status: 'Active', members: 156, plan: 'Basic', revenue: 'ETB 18,500', joined: '2024-04-12', lastActive: '2024-06-08' },
  ];

  const membershipTableData = [
    { id: 1, name: 'Abel Tekle', email: 'abel@example.com', phone: '+251 911 001 001', organization: 'Tech Corp Ethiopia', role: 'Member', status: 'Active', verified: 'Yes', joined: '2024-01-20', lastLogin: '2024-06-10' },
    { id: 2, name: 'Sara Ahmed', email: 'sara@example.com', phone: '+251 911 002 002', organization: 'Addis Innovations', role: 'Admin', status: 'Active', verified: 'Yes', joined: '2024-02-25', lastLogin: '2024-06-10' },
    { id: 3, name: 'Daniel Kebede', email: 'daniel@example.com', phone: '+251 911 003 003', organization: 'Ethiopian Digital Hub', role: 'Member', status: 'Inactive', verified: 'No', joined: '2023-11-15', lastLogin: '2024-05-20' },
    { id: 4, name: 'Hana Mekonnen', email: 'hana@example.com', phone: '+251 911 004 004', organization: 'Lion Tech Solutions', role: 'Moderator', status: 'Active', verified: 'Yes', joined: '2024-03-10', lastLogin: '2024-06-09' },
    { id: 5, name: 'Yonas Tesfaye', email: 'yonas@example.com', phone: '+251 911 005 005', organization: 'Blue Nile Services', role: 'Member', status: 'Active', verified: 'Yes', joined: '2024-04-18', lastLogin: '2024-06-08' },
  ];

  const revenueTableData = [
    { id: 1, date: '2024-06-01', organization: 'Tech Corp Ethiopia', invoice: 'INV-001', amount: 'ETB 15,000', method: 'Telebirr', transactionId: 'TXN-1234', plan: 'Pro', status: 'Completed' },
    { id: 2, date: '2024-06-02', organization: 'Addis Innovations', invoice: 'INV-002', amount: 'ETB 25,000', method: 'CBE Birr', transactionId: 'TXN-1235', plan: 'Enterprise', status: 'Completed' },
    { id: 3, date: '2024-06-03', organization: 'Lion Tech Solutions', invoice: 'INV-003', amount: 'ETB 15,000', method: 'Chapa', transactionId: 'TXN-1236', plan: 'Pro', status: 'Pending' },
    { id: 4, date: '2024-06-04', organization: 'Blue Nile Services', invoice: 'INV-004', amount: 'ETB 5,000', method: 'Cash', transactionId: 'TXN-1237', plan: 'Basic', status: 'Completed' },
    { id: 5, date: '2024-06-05', organization: 'Tech Corp Ethiopia', invoice: 'INV-005', amount: 'ETB 15,000', method: 'Telebirr', transactionId: 'TXN-1238', plan: 'Pro', status: 'Completed' },
  ];

  const subscriptionTableData = [
    { id: 1, organization: 'Tech Corp Ethiopia', plan: 'Pro', startDate: '2024-01-15', endDate: '2025-01-14', billingCycle: 'Monthly', amount: 'ETB 15,000', status: 'Active', autoRenew: 'Yes' },
    { id: 2, organization: 'Addis Innovations', plan: 'Enterprise', startDate: '2024-02-20', endDate: '2025-02-19', billingCycle: 'Quarterly', amount: 'ETB 62,000', status: 'Active', autoRenew: 'Yes' },
    { id: 3, organization: 'Ethiopian Digital Hub', plan: 'Basic', startDate: '2023-11-10', endDate: '2024-11-09', billingCycle: 'Monthly', amount: 'ETB 5,000', status: 'Suspended', autoRenew: 'No' },
    { id: 4, organization: 'Lion Tech Solutions', plan: 'Pro', startDate: '2024-03-05', endDate: '2025-03-04', billingCycle: 'Monthly', amount: 'ETB 15,000', status: 'Active', autoRenew: 'Yes' },
    { id: 5, organization: 'Blue Nile Services', plan: 'Basic', startDate: '2024-04-12', endDate: '2024-07-11', billingCycle: 'Monthly', amount: 'ETB 5,000', status: 'Expiring Soon', autoRenew: 'No' },
  ];

  const ticketTableData = [
    { id: 'TK-001', title: 'Login issues', description: 'Cannot log in to admin panel', organization: 'Tech Corp Ethiopia', priority: 'High', category: 'Technical', status: 'Open', created: '2024-06-10', assigned: 'Admin', dueDate: '2024-06-12' },
    { id: 'TK-002', title: 'Payment failed', description: 'Subscription payment not processing', organization: 'Addis Innovations', priority: 'Medium', category: 'Billing', status: 'In Progress', created: '2024-06-09', assigned: 'Support', dueDate: '2024-06-11' },
    { id: 'TK-003', title: 'Feature request', description: 'Need more report filters', organization: 'Lion Tech Solutions', priority: 'Low', category: 'Feature', status: 'Resolved', created: '2024-06-05', assigned: 'Admin', dueDate: '2024-06-15' },
    { id: 'TK-004', title: 'ID card not showing', description: 'Digital ID card not loading', organization: 'Blue Nile Services', priority: 'High', category: 'Technical', status: 'Open', created: '2024-06-08', assigned: 'Support', dueDate: '2024-06-10' },
    { id: 'TK-005', title: 'Member verification', description: 'New member needs verification', organization: 'Tech Corp Ethiopia', priority: 'Medium', category: 'Admin', status: 'Resolved', created: '2024-06-03', assigned: 'Admin', dueDate: '2024-06-06' },
  ];

  const systemTableData = [
    { id: 1, metric: 'Daily Logins', today: 2345, yesterday: 2100, weekAvg: 2200, change: '+11.7%' },
    { id: 2, metric: 'Active Users', today: 1234, yesterday: 1100, weekAvg: 1150, change: '+12.2%' },
    { id: 3, metric: 'Email Delivered', today: 5678, yesterday: 5200, weekAvg: 5400, change: '+9.2%' },
    { id: 4, metric: 'Notifications Sent', today: 11234, yesterday: 10500, weekAvg: 10800, change: '+7.0%' },
    { id: 5, metric: 'API Calls', today: 45678, yesterday: 42000, weekAvg: 43500, change: '+8.8%' },
  ];

  // --- Filtered data ---
  const filteredOrgs = organizationTableData.filter((o) => {
    const q = searchQuery.toLowerCase();
    if (q && !o.name.toLowerCase().includes(q) && !o.email.toLowerCase().includes(q)) return false;
    if (orgStatusFilter !== 'all' && o.status.toLowerCase() !== orgStatusFilter) return false;
    if (orgPlanFilter !== 'all' && o.plan.toLowerCase() !== orgPlanFilter) return false;
    if (orgLocationFilter !== 'all' && o.location.toLowerCase().replace(' ', '-') !== orgLocationFilter) return false;
    return true;
  });

  const filteredMembers = membershipTableData.filter((m) => {
    const q = searchQuery.toLowerCase();
    if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
    if (memOrgFilter !== 'all' && !m.organization.toLowerCase().replace(/ /g, '-').includes(memOrgFilter.replace(/-/g, ''))) return false;
    if (memStatusFilter !== 'all' && m.status.toLowerCase() !== memStatusFilter) return false;
    if (memRoleFilter !== 'all' && m.role.toLowerCase() !== memRoleFilter) return false;
    if (memVerifiedFilter !== 'all' && m.verified.toLowerCase() !== memVerifiedFilter) return false;
    return true;
  });

  const filteredRevenue = revenueTableData.filter((r) => {
    const q = searchQuery.toLowerCase();
    if (q && !r.invoice.toLowerCase().includes(q) && !r.transactionId.toLowerCase().includes(q)) return false;
    if (revOrgFilter !== 'all' && !r.organization.toLowerCase().replace(/ /g, '-').includes(revOrgFilter.replace(/-/g, ''))) return false;
    if (revMethodFilter !== 'all' && r.method.toLowerCase().replace(' ', '-') !== revMethodFilter) return false;
    if (revPlanFilter !== 'all' && r.plan.toLowerCase() !== revPlanFilter) return false;
    if (revStatusFilter !== 'all' && r.status.toLowerCase() !== revStatusFilter) return false;
    return true;
  });

  const filteredSubs = subscriptionTableData.filter((s) => {
    const q = searchQuery.toLowerCase();
    if (q && !s.organization.toLowerCase().includes(q)) return false;
    if (subOrgFilter !== 'all' && !s.organization.toLowerCase().replace(/ /g, '-').includes(subOrgFilter.replace(/-/g, ''))) return false;
    if (subPlanFilter !== 'all' && s.plan.toLowerCase() !== subPlanFilter) return false;
    if (subBillingFilter !== 'all' && s.billingCycle.toLowerCase() !== subBillingFilter) return false;
    if (subStatusFilter !== 'all' && s.status.toLowerCase().replace(' ', '-') !== subStatusFilter) return false;
    if (subAutoRenewFilter !== 'all' && s.autoRenew.toLowerCase() !== subAutoRenewFilter) return false;
    return true;
  });

  const filteredTickets = ticketTableData.filter((t) => {
    const q = searchQuery.toLowerCase();
    if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
    if (tkOrgFilter !== 'all' && !t.organization.toLowerCase().replace(/ /g, '-').includes(tkOrgFilter.replace(/-/g, ''))) return false;
    if (tkStatusFilter !== 'all' && t.status.toLowerCase().replace(' ', '-') !== tkStatusFilter) return false;
    if (tkPriorityFilter !== 'all' && t.priority.toLowerCase() !== tkPriorityFilter) return false;
    if (tkCategoryFilter !== 'all' && t.category.toLowerCase() !== tkCategoryFilter) return false;
    if (tkAssignedFilter !== 'all' && t.assigned.toLowerCase() !== tkAssignedFilter) return false;
    return true;
  });

  const filteredSystem = systemTableData.filter((s) => {
    if (searchQuery && !s.metric.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
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

  const quickStats = [
    { label: 'Total Organizations', value: '124', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Members', value: '12,450', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Revenue', value: 'ETB 1,245,000', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Active Subscriptions', value: '112', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

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

  const selectClass = 'rounded-xl border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive analytics for the entire platform</p>
        </div>
        <div className="relative">
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
        {quickStats.map((stat, idx) => {
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
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
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
        {/* Columns: Organization, Email, Phone, Location, Status, Members, Plan, Revenue, Joined, Last Active */}
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
        {/* Columns: Member, Email, Phone, Organization, Role, Status, Verified, Joined, Last Login */}
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
        {/* Columns: Date, Invoice, Organization, Amount, Method, Transaction ID, Plan, Status */}
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
        {/* Columns: Organization, Plan, Start Date, End Date, Billing Cycle, Amount, Status, Auto Renew */}
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
        {/* Columns: Ticket ID, Title, Description, Organization, Priority, Category, Status, Created, Due Date, Assigned */}
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
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Overview ── */}
      {activeReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900">Growth Trend</h3>
              <TrendingUp size={20} className="text-indigo-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={statsData}>
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
                <Pie data={planData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {planData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
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
              <BarChart data={ticketData}>
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
                <Pie data={paymentMethodData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {paymentMethodData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Organizations ── */}
      {activeReport === 'organizations' && (
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
                {filteredOrgs.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">No organizations match the selected filters.</td></tr>
                ) : filteredOrgs.map((org) => (
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
      {activeReport === 'membership' && (
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
                {filteredMembers.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-400">No members match the selected filters.</td></tr>
                ) : filteredMembers.map((member) => (
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
      {activeReport === 'revenue' && (
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
                {filteredRevenue.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No revenue records match the selected filters.</td></tr>
                ) : filteredRevenue.map((rev) => (
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
      {activeReport === 'subscription' && (
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
                {filteredSubs.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No subscriptions match the selected filters.</td></tr>
                ) : filteredSubs.map((sub) => (
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
      {activeReport === 'tickets' && (
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
                {filteredTickets.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-400">No tickets match the selected filters.</td></tr>
                ) : filteredTickets.map((ticket) => (
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Today</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Yesterday</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Week Avg</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSystem.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No metrics match the search.</td></tr>
                ) : filteredSystem.map((sys) => (
                  <tr key={sys.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{sys.metric}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sys.today.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sys.yesterday.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sys.weekAvg.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${sys.change.startsWith('+') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{sys.change}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperReport;
