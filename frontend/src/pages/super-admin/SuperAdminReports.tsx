import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertTriangle, Filter, MessageSquare, Check } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { Report, ReportStatus, ReportType } from '../../types';
import { useAuth } from '../../context/AuthContext';

const AccordionReportCard: React.FC<{
  report: Report;
  onAccept: () => void;
  onReply: () => void;
  onUpdateStatus: (status: ReportStatus) => void;
  onUpdatePriority: (priority: string) => void;
}> = ({ report, onAccept, onReply, onUpdateStatus, onUpdatePriority }) => {
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

  const getReportTypeClass = (type: string) => {
    switch (type) {
      case 'org_to_superadmin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-indigo-100 text-indigo-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          {getStatusIcon(report.status, report.accepted)}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-bold text-gray-900">
                {report.member ? report.member.name : report.organization?.name || 'Unknown Sender'}
              </h3>
              <span className="text-sm text-gray-600 truncate max-w-xs">
                - {report.title}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusClass(report.status)}`}>
                {report.status.replace('_', ' ')}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPriorityClass(report.priority)}`}>
                {report.priority}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getReportTypeClass(report.reportType)}`}>
                {report.reportType.replace('_', ' → ')}
              </span>
              {report.accepted && (
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
          <p className="text-sm text-gray-600 mb-3">{report.description}</p>
          {report.attachment && (
            <a
              href={`http://localhost:5000/${report.attachment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-500 underline mb-3 block"
            >
              View Attachment
            </a>
          )}
          {report.response && (
            <div className="mt-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-3">
              <p className="text-xs font-bold text-emerald-800 uppercase mb-2">Response</p>
              <p className="text-sm text-emerald-900">{report.response}</p>
            </div>
          )}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span>Org: {report.organization?.name || 'Unknown'}</span>
              <span>•</span>
              {report.member ? (
                <>
                  <span>From: {report.member.name}</span>
                  <span>•</span>
                </>
              ) : null}
              <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-2 min-w-[320px]">
              <select
                title="Update report status"
                value={report.status}
                onChange={(e) => onUpdateStatus(e.target.value as ReportStatus)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                title="Update report priority"
                value={report.priority}
                onChange={(e) => onUpdatePriority(e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {!report.accepted && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAccept(); }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <Check size={14} />
                  Accept
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onReply(); }}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                <MessageSquare size={14} />
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SuperAdminReports: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ReportType | 'all'>('all');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyingReport, setReplyingReport] = useState<Report | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['superadmin-reports'],
    queryFn: reportService.getSuperAdminReports,
    enabled: !!user,
  });

  const filteredReports = React.useMemo(() => {
    if (!reports) return [];
    let result = [...reports];
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    if (filterType !== 'all') {
      result = result.filter(r => r.reportType === filterType);
    }
    return result;
  }, [reports, filterStatus, filterType]);

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: ReportStatus }) =>
      reportService.updateReportStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-reports'] });
      alert('Report status updated!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update status.');
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (data: { id: string; priority: string }) =>
      reportService.updateReportPriority(data.id, data.priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-reports'] });
      alert('Report priority updated!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update priority.');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => reportService.acceptReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-reports'] });
      alert('Report accepted!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to accept report.');
    },
  });

  const replyMutation = useMutation({
    mutationFn: (data: { id: string; response: string }) =>
      reportService.replyToReport(data.id, data.response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-reports'] });
      closeReplyModal();
      alert('Reply sent!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to send reply.');
    },
  });

  const openReplyModal = (report: Report) => {
    setReplyingReport(report);
    setReplyText(report.response || '');
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setReplyingReport(null);
    setReplyText('');
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyingReport) {
      replyMutation.mutate({ id: replyingReport.id, response: replyText });
    }
  };

  const stats = React.useMemo(() => {
    if (!reports) return {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      memberToOrg: 0,
      orgToSuperAdmin: 0
    };
    return {
      total: reports.length,
      open: reports.filter(r => r.status === 'open').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      memberToOrg: reports.filter(r => r.reportType === 'member_to_org').length,
      orgToSuperAdmin: reports.filter(r => r.reportType === 'org_to_superadmin').length,
    };
  }, [reports]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Platform Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all reports across the platform</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
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
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-indigo-500 uppercase">Member → Org</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{stats.memberToOrg}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-purple-500 uppercase">Org → SuperAdmin</p>
          <p className="text-3xl font-black text-purple-600 mt-2">{stats.orgToSuperAdmin}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Status:</span>
        </div>
        {['all', 'open', 'in_progress', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
        <div className="w-px h-6 bg-gray-200 mx-2" />
        <span className="text-sm font-medium text-gray-700">Type:</span>
        {['all', 'member_to_org', 'org_to_superadmin'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filterType === type
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All' : type.replace('_', ' → ')}
          </button>
        ))}
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
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <AccordionReportCard
              key={report.id}
              report={report}
              onAccept={() => acceptMutation.mutate(report.id)}
              onReply={() => openReplyModal(report)}
              onUpdateStatus={(status) => updateStatusMutation.mutate({ id: report.id, status })}
              onUpdatePriority={(priority) => updatePriorityMutation.mutate({ id: report.id, priority })}
            />
          ))}
        </div>
      )}

      {isReplyModalOpen && replyingReport && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">Reply to Report</h3>
              <button onClick={closeReplyModal} className="p-2 rounded-lg hover:bg-gray-100">
                <div className="h-5 w-5 flex items-center justify-center">×</div>
              </button>
            </div>
            <form onSubmit={handleReplySubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Report</label>
                <p className="text-sm font-bold text-gray-900 mb-2">{replyingReport.title}</p>
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
                  onClick={closeReplyModal}
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
    </div>
  );
};

export default SuperAdminReports;
