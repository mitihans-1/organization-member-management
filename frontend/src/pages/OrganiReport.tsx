import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, TrendingUp, Users, Calendar, CreditCard, 
  Ticket, FileText as BlogIcon, Filter, ArrowRight, Printer, Mail, 
  FileSpreadsheet, Shield, Briefcase, ChevronDown, Search
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const OrganiReport: React.FC = () => {
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roleFilter, setRoleFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const memberStatsData = [
    { name: 'Jan', new: 40, active: 380 },
    { name: 'Feb', new: 30, active: 350 },
    { name: 'Mar', new: 50, active: 400 },
    { name: 'Apr', new: 35, active: 385 },
    { name: 'May', new: 45, active: 420 },
    { name: 'Jun', new: 55, active: 460 },
  ];

  const eventAttendanceData = [
    { name: 'Tech Summit', attendance: 120, capacity: 150 },
    { name: 'Workshop', attendance: 80, capacity: 100 },
    { name: 'Networking', attendance: 200, capacity: 200 },
    { name: 'Webinar', attendance: 150, capacity: 200 },
  ];

  const ticketCategoriesData = [
    { name: 'Technical', value: 45 },
    { name: 'Billing', value: 30 },
    { name: 'General', value: 80 },
    { name: 'Event', value: 25 },
  ];

  const paymentData = [
    { name: 'Jan', amount: 2400 },
    { name: 'Feb', amount: 1398 },
    { name: 'Mar', amount: 9800 },
    { name: 'Apr', amount: 3908 },
    { name: 'May', amount: 4800 },
  ];

  const memberTableData = [
    { id: 1, name: 'Abel Tekle', email: 'abel@example.com', phone: '+251 911 001 001', role: 'Member', status: 'Active', verified: 'Yes', gender: 'Male', age: 28, joined: '2024-01-20', lastLogin: '2024-06-10' },
    { id: 2, name: 'Sara Ahmed', email: 'sara@example.com', phone: '+251 911 002 002', role: 'Admin', status: 'Active', verified: 'Yes', gender: 'Female', age: 32, joined: '2024-02-25', lastLogin: '2024-06-10' },
    { id: 3, name: 'Daniel Kebede', email: 'daniel@example.com', phone: '+251 911 003 003', role: 'Member', status: 'Inactive', verified: 'No', gender: 'Male', age: 45, joined: '2023-11-15', lastLogin: '2024-05-20' },
    { id: 4, name: 'Hana Mekonnen', email: 'hana@example.com', phone: '+251 911 004 004', role: 'Moderator', status: 'Active', verified: 'Yes', gender: 'Female', age: 29, joined: '2024-03-10', lastLogin: '2024-06-09' },
    { id: 5, name: 'Yonas Tesfaye', email: 'yonas@example.com', phone: '+251 911 005 005', role: 'Member', status: 'Active', verified: 'Yes', gender: 'Male', age: 35, joined: '2024-04-18', lastLogin: '2024-06-08' },
  ];

  const eventTableData = [
    { id: 1, name: 'Tech Summit 2025', type: 'Conference', status: 'Upcoming', date: '2024-07-15', time: '09:00 AM', attendance: 0, capacity: 150, location: 'Addis Ababa', organizer: 'Events Team' },
    { id: 2, name: 'Web Development Workshop', type: 'Workshop', status: 'Completed', date: '2024-06-01', time: '02:00 PM', attendance: 80, capacity: 100, location: 'Online', organizer: 'Tech Team' },
    { id: 3, name: 'Networking Event', type: 'Social', status: 'Completed', date: '2024-05-20', time: '06:00 PM', attendance: 200, capacity: 200, location: 'Bole', organizer: 'Admin' },
    { id: 4, name: 'Digital Marketing Webinar', type: 'Seminar', status: 'Upcoming', date: '2024-06-25', time: '11:00 AM', attendance: 0, capacity: 200, location: 'Online', organizer: 'Marketing Team' },
    { id: 5, name: 'AI & ML Conference', type: 'Conference', status: 'Completed', date: '2024-04-10', time: '10:00 AM', attendance: 120, capacity: 150, location: 'Meskel Square', organizer: 'Tech Team' },
  ];

  const serviceTableData = [
    { id: 1, name: 'ID Card Printing', category: 'Admin', requests: 45, approved: 42, rejected: 3, pending: 0, status: 'Active', lastUpdated: '2024-06-10' },
    { id: 2, name: 'Event Booking', category: 'Events', requests: 32, approved: 28, rejected: 4, pending: 0, status: 'Active', lastUpdated: '2024-06-09' },
    { id: 3, name: 'Consultation', category: 'Support', requests: 28, approved: 25, rejected: 3, pending: 0, status: 'Active', lastUpdated: '2024-06-08' },
    { id: 4, name: 'Training', category: 'Education', requests: 19, approved: 15, rejected: 4, pending: 0, status: 'Inactive', lastUpdated: '2024-05-15' },
  ];

  const ticketTableData = [
    { id: 'TK-001', title: 'Login not working', description: 'Cannot access admin dashboard after password reset', category: 'Technical', priority: 'High', status: 'Open', created: '2024-06-10', lastUpdated: '2024-06-10', escalated: 'No', assignedTo: 'Admin' },
    { id: 'TK-002', title: 'Payment failed', description: 'Subscription payment not going through with Telebirr', category: 'Billing', priority: 'Medium', status: 'In Progress', created: '2024-06-09', lastUpdated: '2024-06-09', escalated: 'No', assignedTo: 'Support' },
    { id: 'TK-003', title: 'Event registration', description: 'Need help registering for upcoming Tech Summit', category: 'Event', priority: 'Low', status: 'Resolved', created: '2024-06-05', lastUpdated: '2024-06-06', escalated: 'No', assignedTo: 'Events Team' },
    { id: 'TK-004', title: 'Need help with profile', description: 'Profile picture not updating correctly', category: 'General', priority: 'Medium', status: 'Resolved', created: '2024-06-03', lastUpdated: '2024-06-04', escalated: 'Yes', assignedTo: 'Support' },
  ];

  const blogTableData = [
    { id: 1, title: 'Welcome to OMMS', excerpt: 'Introduction to our organization management system', author: 'Admin', category: 'Announcement', views: 1245, likes: 45, comments: 12, status: 'Published', date: '2024-06-01' },
    { id: 2, title: 'Membership Benefits', excerpt: 'Learn about all the benefits of being a member', author: 'Admin', category: 'Information', views: 890, likes: 32, comments: 8, status: 'Published', date: '2024-05-20' },
    { id: 3, title: 'Upcoming Events', excerpt: 'Check out our exciting events for this month', author: 'Events Team', category: 'Events', views: 567, likes: 28, comments: 5, status: 'Published', date: '2024-05-15' },
    { id: 4, title: 'How to use ID Card', excerpt: 'Complete guide to using your digital ID card', author: 'Support', category: 'Tutorial', views: 423, likes: 18, comments: 3, status: 'Draft', date: '2024-06-08' },
  ];

  const paymentTableData = [
    { id: 1, member: 'Abel Tekle', invoice: 'INV-001', amount: 'ETB 500', method: 'Telebirr', type: 'Membership', status: 'Completed', date: '2024-06-01', transactionId: 'TXN-001' },
    { id: 2, member: 'Sara Ahmed', invoice: 'INV-002', amount: 'ETB 1,000', method: 'CBE Birr', type: 'Service', status: 'Completed', date: '2024-06-02', transactionId: 'TXN-002' },
    { id: 3, member: 'Daniel Kebede', invoice: 'INV-003', amount: 'ETB 500', method: 'Chapa', type: 'Membership', status: 'Pending', date: '2024-06-03', transactionId: 'TXN-003' },
    { id: 4, member: 'Hana Mekonnen', invoice: 'INV-004', amount: 'ETB 750', method: 'Cash', type: 'Event', status: 'Completed', date: '2024-06-04', transactionId: 'TXN-004' },
  ];

  const idCardTableData = [
    { id: 1, member: 'Abel Tekle', cardNumber: 'OMMS-0001', status: 'Active', generated: '2024-01-20', expires: '2025-01-20', verification: 'Verified', lastRenewed: '2024-01-20' },
    { id: 2, member: 'Sara Ahmed', cardNumber: 'OMMS-0002', status: 'Active', generated: '2024-02-25', expires: '2025-02-25', verification: 'Verified', lastRenewed: '2024-02-25' },
    { id: 3, member: 'Daniel Kebede', cardNumber: 'OMMS-0003', status: 'Expired', generated: '2023-11-15', expires: '2024-11-15', verification: 'Pending', lastRenewed: '2023-11-15' },
    { id: 4, member: 'Hana Mekonnen', cardNumber: 'OMMS-0004', status: 'Active', generated: '2024-03-10', expires: '2025-03-10', verification: 'Verified', lastRenewed: '2024-03-10' },
  ];

  const reportCategories = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'blogs', label: 'Blogs', icon: BlogIcon },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'idcards', label: 'ID Cards', icon: Shield },
  ];

  const quickStats = [
    { label: 'Total Members', value: '456', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Total Events', value: '24', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active Services', value: '12', icon: Briefcase, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Total Revenue', value: 'ETB 45,600', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-50' },
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
          <h1 className="text-2xl font-black text-gray-900">Organization Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Analytics and insights for your organization</p>
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

        {activeReport === 'members' && (
          <>
            <select
              title="Select member status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              title="Select verified status"
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="yes">Verified</option>
              <option value="no">Unverified</option>
            </select>
          </>
        )}

        {activeReport === 'events' && (
          <>
            <select
              title="Select event status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
            <select
              title="Select assigned to"
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </>
        )}

        {activeReport === 'blogs' && (
          <select
            title="Select blog status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
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

        {activeReport === 'idcards' && (
          <select
            title="Select ID card status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
          </select>
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

        {activeReport === 'members' && (
          <select
            title="Select member role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="guest">Guest</option>
          </select>
        )}

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

        {(activeReport === 'services' || activeReport === 'blogs') && (
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

        {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || paymentMethodFilter !== 'all' || eventTypeFilter !== 'all' || verifiedFilter !== 'all' || assignedFilter !== 'all' || sortBy !== 'default' || roleFilter !== 'all' || locationFilter !== 'all' || categoryFilter !== 'all' || minAmount || maxAmount) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPriorityFilter('all');
              setPaymentMethodFilter('all');
              setEventTypeFilter('all');
              setVerifiedFilter('all');
              setAssignedFilter('all');
              setSortBy('default');
              setSortOrder('asc');
              setRoleFilter('all');
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
              <h3 className="text-lg font-black text-gray-900">Member Growth</h3>
              <Users size={20} className="text-indigo-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={memberStatsData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  dataKey="active" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ r: 4 }} 
                />
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
                <Pie
                  data={ticketCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ticketCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
              <BarChart data={eventAttendanceData}>
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
              <LineChart data={paymentData}>
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
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#f59e0b' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'members' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Member Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                {memberTableData.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{member.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        member.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        member.verified === 'Yes' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.verified}
                      </span>
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
                {eventTableData.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{event.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{event.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        event.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 
                        event.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Requests</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rejected</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceTableData.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{service.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.requests}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">{service.approved}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 font-bold">{service.rejected}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-bold">{service.pending}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        service.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.lastUpdated}</td>
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Escalated</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        ticket.escalated === 'Yes' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.escalated}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.assignedTo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'blogs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">Blog & Announcement Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
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
                {blogTableData.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{blog.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={blog.excerpt}>{blog.excerpt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{blog.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{blog.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">{blog.views.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold">{blog.likes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-bold">{blog.comments}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        blog.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.date}</td>
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
                {paymentTableData.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{payment.invoice}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{payment.member}</div>
                    </td>
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

      {activeReport === 'idcards' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-black text-gray-900">ID Card Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Card Number</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Generated</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Verification</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Renewed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {idCardTableData.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{card.cardNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{card.member}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        card.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 
                        card.status === 'Expired' ? 'bg-rose-100 text-rose-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {card.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.generated}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.expires}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                        card.verification === 'Verified' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {card.verification}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{card.lastRenewed}</td>
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

export default OrganiReport;
