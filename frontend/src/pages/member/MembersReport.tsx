import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, Calendar, CreditCard, 
  Ticket, Filter, Printer, Mail, 
  FileSpreadsheet, Briefcase, Users, Activity, ChevronDown, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const memberSectionToReport: Record<string, string> = {
  membership: 'membership',
  events: 'events',
  services: 'services',
  tickets: 'tickets',
  payments: 'payments',
};

const MembersReport: React.FC = () => {
  const { user } = useAuth();
  const { section } = useParams<{ section: string }>();
  const activeReport = section ? (memberSectionToReport[section] ?? 'overview') : 'overview';

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

  // Membership filters
  const [membershipTypeFilter, setMembershipTypeFilter] = useState('all');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  // Events filters
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [organizerFilter, setOrganizerFilter] = useState('all');

  // Services filters
  const [serviceStatusFilter, setServiceStatusFilter] = useState('all');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');

  // Tickets filters
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('all');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');

  // Payments filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');

  const activityData = [
    { name: 'Jan', events: 2, services: 1, tickets: 1 },
    { name: 'Feb', events: 3, services: 2, tickets: 0 },
    { name: 'Mar', events: 1, services: 3, tickets: 2 },
    { name: 'Apr', events: 4, services: 1, tickets: 1 },
    { name: 'May', events: 2, services: 2, tickets: 0 },
    { name: 'Jun', events: 3, services: 1, tickets: 1 },
  ];

  const eventAttendanceData = [
    { name: 'Attended', value: 15 },
    { name: 'Registered', value: 5 },
  ];

  const paymentHistoryData = [
    { name: 'Jan', amount: 500 },
    { name: 'Feb', amount: 500 },
    { name: 'Mar', amount: 750 },
    { name: 'Apr', amount: 500 },
    { name: 'May', amount: 1000 },
    { name: 'Jun', amount: 500 },
  ];

  const eventTableData = [
    { id: 1, name: 'Tech Summit 2025', type: 'Conference', date: '2024-07-15', time: '09:00 AM', status: 'Registered', location: 'Addis Ababa', organizer: 'Events Team', registrationDate: '2024-06-01' },
    { id: 2, name: 'Web Development Workshop', type: 'Workshop', date: '2024-06-01', time: '02:00 PM', status: 'Attended', location: 'Online', organizer: 'Tech Team', registrationDate: '2024-05-15' },
    { id: 3, name: 'Networking Event', type: 'Social', date: '2024-05-20', time: '06:00 PM', status: 'Attended', location: 'Bole', organizer: 'Admin', registrationDate: '2024-05-01' },
    { id: 4, name: 'Digital Marketing Webinar', type: 'Seminar', date: '2024-06-25', time: '11:00 AM', status: 'Registered', location: 'Online', organizer: 'Marketing Team', registrationDate: '2024-06-10' },
    { id: 5, name: 'AI & ML Conference', type: 'Conference', date: '2024-04-10', time: '10:00 AM', status: 'Attended', location: 'Meskel Square', organizer: 'Tech Team', registrationDate: '2024-03-20' },
  ];

  const serviceTableData = [
    { id: 1, name: 'ID Card Printing', category: 'Admin', requestDate: '2024-01-20', approvedDate: '2024-01-22', completedDate: '2024-01-25', status: 'Completed' },
    { id: 2, name: 'Event Booking', category: 'Events', requestDate: '2024-05-18', approvedDate: '2024-05-19', completedDate: '2024-05-19', status: 'Approved' },
    { id: 3, name: 'Consultation', category: 'Support', requestDate: '2024-04-10', approvedDate: '2024-04-11', completedDate: '2024-04-15', status: 'Completed' },
    { id: 4, name: 'Training', category: 'Education', requestDate: '2024-06-05', approvedDate: null, completedDate: null, status: 'Pending' },
  ];

  const ticketTableData = [
    { id: 'TK-001', title: 'Login not working', description: 'Cannot log in after password reset', category: 'Technical', priority: 'High', status: 'Open', created: '2024-06-10', lastUpdated: '2024-06-10', assignedTo: 'Support' },
    { id: 'TK-002', title: 'Payment failed', description: 'Event registration payment not processing', category: 'Billing', priority: 'Medium', status: 'Resolved', created: '2024-06-05', lastUpdated: '2024-06-06', assignedTo: 'Admin' },
    { id: 'TK-003', title: 'Event registration', description: 'Need help with Tech Summit registration', category: 'Event', priority: 'Low', status: 'Resolved', created: '2024-05-18', lastUpdated: '2024-05-19', assignedTo: 'Events Team' },
  ];

  const paymentTableData = [
    { id: 1, invoice: 'INV-001', amount: 'ETB 500', method: 'Telebirr', type: 'Membership', status: 'Completed', transactionId: 'TXN-001', date: '2024-06-01' },
    { id: 2, invoice: 'INV-002', amount: 'ETB 1,000', method: 'CBE Birr', type: 'Event', status: 'Completed', transactionId: 'TXN-002', date: '2024-05-20' },
    { id: 3, invoice: 'INV-003', amount: 'ETB 750', method: 'Chapa', type: 'Service', status: 'Completed', transactionId: 'TXN-003', date: '2024-04-10' },
    { id: 4, invoice: 'INV-004', amount: 'ETB 500', method: 'Cash', type: 'Membership', status: 'Completed', transactionId: 'TXN-004', date: '2024-03-01' },
  ];

  // --- Filtered data ---
  const filteredEvents = eventTableData.filter((e) => {
    const q = searchQuery.toLowerCase();
    if (q && !e.name.toLowerCase().includes(q) && !e.organizer.toLowerCase().includes(q)) return false;
    if (eventStatusFilter !== 'all' && e.status.toLowerCase() !== eventStatusFilter) return false;
    if (eventTypeFilter !== 'all' && e.type.toLowerCase() !== eventTypeFilter) return false;
    if (locationFilter !== 'all' && e.location.toLowerCase().replace(' ', '-') !== locationFilter) return false;
    if (organizerFilter !== 'all' && e.organizer.toLowerCase().replace(' ', '-') !== organizerFilter) return false;
    return true;
  });

  const filteredServices = serviceTableData.filter((s) => {
    const q = searchQuery.toLowerCase();
    if (q && !s.name.toLowerCase().includes(q)) return false;
    if (serviceStatusFilter !== 'all' && s.status.toLowerCase() !== serviceStatusFilter) return false;
    if (serviceCategoryFilter !== 'all' && s.category.toLowerCase() !== serviceCategoryFilter) return false;
    return true;
  });

  const filteredTickets = ticketTableData.filter((t) => {
    const q = searchQuery.toLowerCase();
    if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
    if (ticketStatusFilter !== 'all' && t.status.toLowerCase().replace(' ', '-') !== ticketStatusFilter) return false;
    if (ticketPriorityFilter !== 'all' && t.priority.toLowerCase() !== ticketPriorityFilter) return false;
    if (ticketCategoryFilter !== 'all' && t.category.toLowerCase() !== ticketCategoryFilter) return false;
    if (assignedToFilter !== 'all' && t.assignedTo.toLowerCase().replace(' ', '-') !== assignedToFilter) return false;
    return true;
  });

  const filteredPayments = paymentTableData.filter((p) => {
    const q = searchQuery.toLowerCase();
    if (q && !p.invoice.toLowerCase().includes(q) && !p.transactionId.toLowerCase().includes(q)) return false;
    if (paymentStatusFilter !== 'all' && p.status.toLowerCase() !== paymentStatusFilter) return false;
    if (paymentMethodFilter !== 'all' && p.method.toLowerCase().replace(' ', '-') !== paymentMethodFilter) return false;
    if (paymentTypeFilter !== 'all' && p.type.toLowerCase() !== paymentTypeFilter) return false;
    return true;
  });

  const hasActiveFilters = (() => {
    if (searchQuery) return true;
    if (activeReport === 'membership') return membershipTypeFilter !== 'all' || membershipStatusFilter !== 'all' || verifiedFilter !== 'all';
    if (activeReport === 'events') return eventStatusFilter !== 'all' || eventTypeFilter !== 'all' || locationFilter !== 'all' || organizerFilter !== 'all';
    if (activeReport === 'services') return serviceStatusFilter !== 'all' || serviceCategoryFilter !== 'all';
    if (activeReport === 'tickets') return ticketStatusFilter !== 'all' || ticketPriorityFilter !== 'all' || ticketCategoryFilter !== 'all' || assignedToFilter !== 'all';
    if (activeReport === 'payments') return paymentStatusFilter !== 'all' || paymentMethodFilter !== 'all' || paymentTypeFilter !== 'all';
    return false;
  })();

  const clearFilters = () => {
    setSearchQuery('');
    setMembershipTypeFilter('all');
    setMembershipStatusFilter('all');
    setVerifiedFilter('all');
    setEventStatusFilter('all');
    setEventTypeFilter('all');
    setLocationFilter('all');
    setOrganizerFilter('all');
    setServiceStatusFilter('all');
    setServiceCategoryFilter('all');
    setTicketStatusFilter('all');
    setTicketPriorityFilter('all');
    setTicketCategoryFilter('all');
    setAssignedToFilter('all');
    setPaymentStatusFilter('all');
    setPaymentMethodFilter('all');
    setPaymentTypeFilter('all');
  };

  const quickStats = [
    { label: 'Events Attended', value: '15', icon: Calendar, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Services Requested', value: '10', icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Tickets Submitted', value: '5', icon: Ticket, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Total Paid', value: 'ETB 3,750', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const exportOptions = [
    { label: 'Export PDF', icon: FileText },
    { label: 'Export Excel', icon: FileSpreadsheet },
    { label: 'Export CSV', icon: Download },
    { label: 'Print Report', icon: Printer },
    { label: 'Email Report', icon: Mail },
  ];

  const selectClass = 'rounded-xl border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Your activity and membership details</p>
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
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    onClick={() => setIsExportOpen(false)}
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-2">Hi, {user?.name?.split(' ')[0] || 'Member'}!</h1>
            <p className="text-indigo-100 text-lg">View your membership activity and statistics</p>
          </div>
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

        {/* Search — shown for all table views */}
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

        {/* ── Membership filters ── */}
        {activeReport === 'membership' && (
          <>
            {/* Status column */}
            <select title="Membership status" value={membershipStatusFilter} onChange={(e) => setMembershipStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
            {/* Membership Type column */}
            <select title="Membership type" value={membershipTypeFilter} onChange={(e) => setMembershipTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
              <option value="basic">Basic</option>
              <option value="trial">Trial</option>
            </select>
            {/* Verified column */}
            <select title="Verified" value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)} className={selectClass}>
              <option value="all">All</option>
              <option value="yes">Verified</option>
              <option value="no">Unverified</option>
            </select>
          </>
        )}

        {/* ── Events filters ── */}
        {activeReport === 'events' && (
          <>
            {/* Status column */}
            <select title="Event status" value={eventStatusFilter} onChange={(e) => setEventStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="attended">Attended</option>
              <option value="missed">Missed</option>
            </select>
            {/* Type column */}
            <select title="Event type" value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="conference">Conference</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="social">Social</option>
            </select>
            {/* Location column */}
            <select title="Location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={selectClass}>
              <option value="all">All Locations</option>
              <option value="addis-ababa">Addis Ababa</option>
              <option value="online">Online</option>
              <option value="bole">Bole</option>
              <option value="meskel-square">Meskel Square</option>
            </select>
            {/* Organizer column */}
            <select title="Organizer" value={organizerFilter} onChange={(e) => setOrganizerFilter(e.target.value)} className={selectClass}>
              <option value="all">All Organizers</option>
              <option value="events-team">Events Team</option>
              <option value="tech-team">Tech Team</option>
              <option value="admin">Admin</option>
              <option value="marketing-team">Marketing Team</option>
            </select>
          </>
        )}

        {/* ── Services filters ── */}
        {activeReport === 'services' && (
          <>
            {/* Status column */}
            <select title="Service status" value={serviceStatusFilter} onChange={(e) => setServiceStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            {/* Category column */}
            <select title="Category" value={serviceCategoryFilter} onChange={(e) => setServiceCategoryFilter(e.target.value)} className={selectClass}>
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
            {/* Status column */}
            <select title="Ticket status" value={ticketStatusFilter} onChange={(e) => setTicketStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            {/* Priority column */}
            <select title="Priority" value={ticketPriorityFilter} onChange={(e) => setTicketPriorityFilter(e.target.value)} className={selectClass}>
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {/* Category column */}
            <select title="Ticket category" value={ticketCategoryFilter} onChange={(e) => setTicketCategoryFilter(e.target.value)} className={selectClass}>
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="event">Event</option>
              <option value="general">General</option>
            </select>
            {/* Assigned To column */}
            <select title="Assigned to" value={assignedToFilter} onChange={(e) => setAssignedToFilter(e.target.value)} className={selectClass}>
              <option value="all">All Assigned</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="events-team">Events Team</option>
            </select>
          </>
        )}

        {/* ── Payments filters ── */}
        {activeReport === 'payments' && (
          <>
            {/* Status column */}
            <select title="Payment status" value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            {/* Method column */}
            <select title="Payment method" value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className={selectClass}>
              <option value="all">All Methods</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe-birr">CBE Birr</option>
              <option value="chapa">Chapa</option>
              <option value="cash">Cash</option>
            </select>
            {/* Type column */}
            <select title="Payment type" value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All Types</option>
              <option value="membership">Membership</option>
              <option value="event">Event</option>
              <option value="service">Service</option>
            </select>
          </>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ── Overview ── */}
      {activeReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900">Activity Trend</h3>
              <Activity size={20} className="text-indigo-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="events" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEvents)" />
                <Line type="monotone" dataKey="services" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="tickets" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900">Event Attendance</h3>
              <Calendar size={20} className="text-indigo-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={eventAttendanceData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {eventAttendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900">Payment History</h3>
              <CreditCard size={20} className="text-indigo-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Membership ── */}
      {activeReport === 'membership' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Membership Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Membership Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Registration Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Renewal Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-900">{user?.organization_name || 'Your Org'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-indigo-600">Premium Member</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-900">January 15, 2025</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Active</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-emerald-600">January 15, 2026</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">Yes</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Events ── */}
      {activeReport === 'events' && (
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Registration Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">No events match the selected filters.</td></tr>
                ) : filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{event.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{event.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${event.status === 'Attended' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.organizer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.registrationDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Services ── */}
      {activeReport === 'services' && (
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Approved Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Completed Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No services match the selected filters.</td></tr>
                ) : filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{service.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.requestDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.approvedDate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.completedDate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        service.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        service.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        service.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {service.status}
                      </span>
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
            <table className="w-full min-w-[1000px]">
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-400">No tickets match the selected filters.</td></tr>
                ) : filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{ticket.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{ticket.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={ticket.description}>{ticket.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        ticket.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                        ticket.priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        ticket.status === 'Open' ? 'bg-rose-100 text-rose-800' :
                        ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.created}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.lastUpdated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payments ── */}
      {activeReport === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Payment Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">No payments match the selected filters.</td></tr>
                ) : filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{payment.invoice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">{payment.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.transactionId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        payment.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        payment.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date}</td>
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

export default MembersReport;
