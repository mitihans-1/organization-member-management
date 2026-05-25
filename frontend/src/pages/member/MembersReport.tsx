import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, TrendingUp, Calendar, CreditCard, 
  Ticket, FileText as BlogIcon, Filter, ArrowRight, Printer, Mail, 
  FileSpreadsheet, Shield, Briefcase, Users, Activity, ChevronDown, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const MembersReport: React.FC = () => {
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [sortOrder, setSortOrder] = useState('asc');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

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

  const reportCategories = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'membership', label: 'Membership', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Your activity and membership details</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
            <ChevronDown
              size={14}
              className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`}
            />
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
            <p className="text-indigo-100 text-lg">
              View your membership activity and statistics
            </p>
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

      <div className="flex flex-wrap gap-2">
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveReport(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeReport === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
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

        <select
          title="Select date range"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        {activeReport === 'events' && (
          <>
            <select
              title="Select event status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="attended">Attended</option>
              <option value="missed">Missed</option>
            </select>
            <select
              title="Select event type"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="conference">Conference</option>
              <option value="social">Social Event</option>
            </select>
          </>
        )}

        {activeReport === 'services' && (
          <select
            title="Select service status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}

        {activeReport === 'tickets' && (
          <>
            <select
              title="Select ticket status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              title="Select ticket priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </>
        )}

        {activeReport === 'payments' && (
          <>
            <select
              title="Select payment status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              title="Select payment method"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Methods</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe-birr">CBE Birr</option>
              <option value="chapa">Chapa</option>
              <option value="cash">Cash</option>
            </select>
          </>
        )}

        <select
          title="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="default">Default</option>
          <option value="date">Date</option>
          <option value="name">Name</option>
          <option value="amount">Amount</option>
          <option value="status">Status</option>
        </select>

        <select
          title="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        {activeReport === 'events' && (
          <select
            title="Select location"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All Locations</option>
            <option value="addis-ababa">Addis Ababa</option>
            <option value="bahir-dar">Bahir Dar</option>
            <option value="hawassa">Hawassa</option>
            <option value="dire-dawa">Dire Dawa</option>
            <option value="mekele">Mekele</option>
            <option value="online">Online</option>
          </select>
        )}

        {activeReport === 'services' && (
          <select
            title="Select category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="training">Training</option>
            <option value="consulting">Consulting</option>
            <option value="support">Support</option>
            <option value="marketing">Marketing</option>
            <option value="technology">Technology</option>
          </select>
        )}

        {activeReport === 'payments' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Amount:</span>
            <input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="rounded-xl border border-gray-200 px-2 py-2 text-sm w-20"
            />
            <span className="text-sm text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="rounded-xl border border-gray-200 px-2 py-2 text-sm w-20"
            />
          </div>
        )}

        {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || paymentMethodFilter !== 'all' || eventTypeFilter !== 'all' || sortBy !== 'default' || locationFilter !== 'all' || categoryFilter !== 'all' || minAmount || maxAmount) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setPaymentMethodFilter('all');
              setEventTypeFilter('all');
              setSortBy('default');
              setSortOrder('asc');
              setLocationFilter('all');
              setCategoryFilter('all');
              setMinAmount('');
              setMaxAmount('');
            }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl"
          >
            Clear Filters
          </button>
        )}
      </div>

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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEvents)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="services" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ r: 4 }} 
                />
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
                <Pie
                  data={eventAttendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px'
                  }} 
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
                    <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-emerald-600">January 15, 2026</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                      Yes
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'events' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Event Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                {eventTableData.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{event.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{event.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        event.status === 'Attended' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
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

      {activeReport === 'services' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Service Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                {serviceTableData.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{service.name}</div>
                    </td>
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

      {activeReport === 'tickets' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Ticket Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                {ticketTableData.map((ticket) => (
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

      {activeReport === 'payments' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Payment Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                {paymentTableData.map((payment) => (
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
