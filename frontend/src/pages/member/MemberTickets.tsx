import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, CheckCircle, Clock, AlertTriangle, Trash2, Edit2, ChevronDown, Clock3, CheckCheck } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { Report } from '../../types';
import { useAuth } from '../../context/AuthContext';

const AccordionTicketCard: React.FC<{
  ticket: Report;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ ticket, onEdit, onDelete }) => {
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
        aria-expanded={isExpanded}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          {getStatusIcon(ticket.status, ticket.accepted)}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-gray-900">
                {ticket.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusClass(ticket.status)}`}>
                {ticket.status}
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
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-transform transition-colors ${
            isExpanded ? 'rotate-180 bg-gray-100 text-gray-700' : 'bg-white'
          }`}
        >
          <ChevronDown size={18} />
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
            <p className="text-xs text-gray-400">
              Created on {new Date(ticket.createdAt).toLocaleString()}
            </p>
            {ticket.status === 'open' && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MemberTickets: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Report | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    priority: 'medium',
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['member-tickets'],
    queryFn: reportService.getMemberReports,
    enabled: !!user,
  });

  const ticketStats = React.useMemo(() => ({
    open: tickets?.filter((ticket) => ticket.status === 'open').length ?? 0,
    inProgress: tickets?.filter((ticket) => ticket.status === 'in_progress').length ?? 0,
    resolved: tickets?.filter((ticket) => ticket.status === 'resolved').length ?? 0,
  }), [tickets]);

  const createMutation = useMutation({
    mutationFn: (data: any) => reportService.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tickets'] });
      closeModal();
      alert('Ticket submitted successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to submit ticket.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; ticket: any }) =>
      reportService.updateReport(data.id, data.ticket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tickets'] });
      closeModal();
      alert('Ticket updated successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update ticket.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-tickets'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete ticket.');
    },
  });

  const openModal = (ticket?: Report) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
      });
    } else {
      setEditingTicket(null);
      setFormData({ title: '', description: '', priority: 'medium' });
      setSelectedFile(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTicket(null);
    setFormData({ title: '', description: '', priority: 'medium' });
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTicket) {
      updateMutation.mutate({ id: editingTicket.id, ticket: formData });
    } else {
      createMutation.mutate({ ...formData, attachment: selectedFile });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Submit and track tickets to your organization</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
        >
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={18} />
            <span className="text-xs font-bold uppercase">Open</span>
          </div>
          <p className="text-3xl font-black text-rose-700 mt-3">{ticketStats.open}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock3 size={18} />
            <span className="text-xs font-bold uppercase">In Progress</span>
          </div>
          <p className="text-3xl font-black text-amber-700 mt-3">{ticketStats.inProgress}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCheck size={18} />
            <span className="text-xs font-bold uppercase">Resolved</span>
          </div>
          <p className="text-3xl font-black text-emerald-700 mt-3">{ticketStats.resolved}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : tickets?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No tickets yet. Submit your first ticket!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets?.map((ticket) => (
            <AccordionTicketCard
              key={ticket.id}
              ticket={ticket}
              onEdit={() => openModal(ticket)}
              onDelete={() => {
                if (confirm('Are you sure you want to delete this ticket?')) {
                  deleteMutation.mutate(ticket.id);
                }
              }}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">
                {editingTicket ? 'Edit Ticket' : 'Submit New Ticket'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  placeholder="Brief description of the issue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-y"
                  placeholder="Describe the issue in detail..."
                />
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
              {!editingTicket && (
                <div>
                  <label htmlFor="attachment" className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Attachment (Optional)
                  </label>
                  <input
                    id="attachment"
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
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500"
                >
                  {editingTicket ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTickets;
