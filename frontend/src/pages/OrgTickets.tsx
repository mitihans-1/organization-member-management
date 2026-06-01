import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertTriangle, Edit2, Filter, Plus, MessageSquare, Check } from 'lucide-react';
import { reportService } from '../services/reportService';
import { Report } from '../types';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';

const AccordionTicketCard: React.FC<{
  ticket: any;
  activeTab: 'member' | 'org';
  onManage: () => void;
  onAccept: () => void;
  onReply: () => void;
}> = ({ ticket, activeTab, onManage, onAccept, onReply }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string, accepted: boolean) => {
    if (accepted) {
      return <CheckCircle size={16} className="text-emerald-500" />;
    }
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-amber-500" />;
      default:
        return <AlertTriangle size={16} className="text-rose-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-rose-100 text-rose-800';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          {getStatusIcon(ticket.status, ticket.accepted)}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-gray-900">
                {activeTab === 'member' 
                  ? ticket.member?.name || 'Unknown Sender'
                  : 'Ticket to Super Admin'}
              </h3>
              <span className="text-sm text-gray-600 truncate max-w-xs">
                - {ticket.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusClass(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPriorityClass(ticket.priority)}`}>
                {ticket.priority}
              </span>
              {ticket.accepted && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Accepted
              </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-200 p-5">
          <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
          {ticket.attachment && (
            <a
              href={`http://localhost:5000/${ticket.attachment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-500 underline mb-3 block"
            >
              View Attachment
            </a>
          )}
          {ticket.response && (
            <div className="mt-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-3">
              <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Response</p>
              <p className="text-sm text-emerald-900">{ticket.response}</p>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {activeTab === 'member' && (
                <>
                  <span>From: {ticket.member?.name || 'Unknown'}</span>
                  <span>•</span>
                </>
              )}
              <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            {activeTab === 'member' && (
              <div className="flex gap-2">
                <button
                onClick={(e) => { e.stopPropagation(); onManage(); }}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <Edit2 size={16} />
                Manage
              </button>
              {!ticket.accepted && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAccept(); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
                >
                  <Check size={16} />
                  Accept
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onReply(); }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
              >
                <MessageSquare size={16} />
                Reply
              </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const OrgTickets: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [editingMemberTicket, setEditingMemberReport] = useState<Report | null>(null);
  const [replyingTicket, setReplyingReport] = useState<Report | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replyText, setReplyText] = useState('');
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved';
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
  });
  const [orgFormData, setOrgFormData] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'member' | 'org'>('member');

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['org-tickets'],
    queryFn: reportService.getOrgReports,
    enabled: !!user,
  });

  const memberTickets = ticketsData?.memberReports || [];
  const orgTickets = ticketsData?.orgReports || [];
  const currentTickets = activeTab === 'member' ? memberTickets : orgTickets;

  const filteredTickets = React.useMemo(() => {
    if (!currentTickets) return [];
    if (filterStatus === 'all') return currentTickets;
    return currentTickets.filter((ticket: Report) => ticket.status === filterStatus);
  }, [currentTickets, filterStatus]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; ticket: any }) =>
      reportService.updateReport(data.id, data.ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-tickets'] });
      closeAllModals();
      alert('Ticket updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update ticket.');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-tickets'] });
      closeAllModals();
      alert('Ticket sent to Super Admin successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to send ticket.');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => reportService.acceptReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-tickets'] });
      alert('Ticket accepted!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to accept ticket.');
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: { id: string; response: string }) =>
      reportService.replyToReport(data.id, data.response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-tickets'] });
      closeAllModals();
      alert('Reply sent!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to send reply.');
    },
  });

  const openMemberModal = (ticket: Report) => {
    setEditingMemberReport(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as any,
      priority: ticket.priority,
    });
    setIsMemberModalOpen(true);
  };

  const openOrgModal = () => {
    setOrgFormData({ title: '', description: '', priority: 'medium' });
    setSelectedFile(null);
    setIsOrgModalOpen(true);
  };

  const openReplyModal = (ticket: Report) => {
    setReplyingReport(ticket);
    setReplyText(ticket.response || '');
    setIsReplyModalOpen(true);
  };

  const closeAllModals = () => {
    setIsMemberModalOpen(false);
    setIsOrgModalOpen(false);
    setIsReplyModalOpen(false);
    setEditingMemberReport(null);
    setReplyingReport(null);
    setFormData({ title: '', description: '', status: 'open', priority: 'medium' });
    setOrgFormData({ title: '', description: '', priority: 'medium' });
    setSelectedFile(null);
    setReplyText('');
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMemberTicket) {
      updateMutation.mutate({ id: editingMemberTicket.id, ticket: formData });
    }
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...orgFormData, reportType: 'org_to_superadmin', attachment: selectedFile });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyingTicket) {
      replyMutation.mutate({ id: replyingTicket.id, response: replyText });
    }
  };

  const getStatusIcon = (status: string, accepted: boolean) => {
    if (accepted) {
      return <CheckCircle size={16} className="text-emerald-500" />;
    }
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'in_progress':
        return <Clock size={16} className="text-amber-500" />;
      default:
        return <AlertTriangle size={16} className="text-rose-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-rose-100 text-rose-800';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const stats = React.useMemo(() => {
    const allTickets = [...memberTickets, ...orgTickets];
    return {
      total: allTickets.length,
      open: allTickets.filter((r) => r.status === 'open').length,
      inProgress: allTickets.filter((r) => r.status === 'in_progress').length,
      resolved: allTickets.filter((r) => r.status === 'resolved').length,
    };
  }, [memberTickets, orgTickets]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <OrgAdminPageHeader
        title="Tickets Management"
        subtitle="Manage member Tickets and send Tickets to Super Admin"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase">Total Tickets</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-rose-500 uppercase">Open</p>
          <p className="text-3xl font-black text-rose-600 mt-2">{stats.open}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase">In Progress</p>
          <p className="text-3xl font-black text-amber-600 mt-2">{stats.inProgress}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase">Resolved</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">{stats.resolved}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('member'); setFilterStatus('all'); }}
          className={`px-6 py-4 font-bold transition-colors ${
            activeTab === 'member'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Member Tickets({memberTickets.length})
        </button>
        <button
          onClick={() => { setActiveTab('org'); setFilterStatus('all'); }}
          className={`px-6 py-4 font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'org'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Tickets to Super Admin ({orgTickets.length})
        </button>
        {activeTab === 'org' && (
          <button
            onClick={openOrgModal}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 my-2"
          >
            <Plus size={16} />
            New Report
          </button>
        )}
      </div>

      {activeTab === 'member' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-2 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          </div>
          {['all', 'open', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">
            {activeTab === 'member' ? 'No member tickets found.' : 'No tickets sent to Super Admin yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket: Report) => (
            <AccordionTicketCard 
              key={ticket.id} 
              ticket={ticket} 
              activeTab={activeTab}
              onManage={() => openMemberModal(ticket)}
              onAccept={() => acceptMutation.mutate(ticket.id)}
              onReply={() => openReplyModal(ticket)}
            />
          ))}
        </div>
      )}

      {isMemberModalOpen && editingMemberTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">Manage Ticket</h3>
              <button onClick={closeAllModals} className="p-2 rounded-lg hover:bg-gray-100">
                <div className="h-5 w-5 flex items-center justify-center">×</div>
              </button>
            </div>
            <form onSubmit={handleMemberSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Member</label>
                <p className="text-sm text-gray-700 py-2">{editingMemberTicket.member?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    aria-label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    aria-label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReplyModalOpen && replyingTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">Reply to Ticket</h3>
              <button onClick={closeAllModals} className="p-2 rounded-lg hover:bg-gray-100">
                <div className="h-5 w-5 flex items-center justify-center">×</div>
              </button>
            </div>
            <form onSubmit={handleReplySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Report</label>
                <p className="text-sm font-bold text-gray-900 mb-2">{replyingTicket.title}</p>
              </div>
              <div>
                <label htmlFor="reply" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Your Reply
                </label>
                <textarea
                  id="reply"
                  required
                  rows={6}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-y"
                  placeholder="Write your reply here..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500"
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isOrgModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">Send Ticket to Super Admin</h3>
              <button onClick={closeAllModals} className="p-2 rounded-lg hover:bg-gray-100">
                <div className="h-5 w-5 flex items-center justify-center">×</div>
              </button>
            </div>
            <form onSubmit={handleOrgSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={orgFormData.title}
                  onChange={(e) => setOrgFormData({ ...orgFormData, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  placeholder="Ticket title..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={6}
                  value={orgFormData.description}
                  onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-y"
                  placeholder="Describe your ticket in detail..."
                />
              </div>
              <div>
                <label htmlFor="orgPriority" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Priority
                </label>
                <select
                  id="orgPriority"
                  aria-label="Priority"
                  value={orgFormData.priority}
                  onChange={(e) => setOrgFormData({ ...orgFormData, priority: e.target.value as any })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="orgAttachment" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Attachment (Optional)
                </label>
                <input
                  id="orgAttachment"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Sending...' : 'Send Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgTickets;
