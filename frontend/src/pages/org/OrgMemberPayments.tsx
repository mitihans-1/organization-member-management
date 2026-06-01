
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, CheckCircle, XCircle, FileText } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OrgMemberPayments: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['orgMemberPayments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
    enabled: !!user,
  });

  const memberPayments = payments?.filter((p: any) => p.reference_type === 'member_subscription');

  const confirmPaymentMutation = useMutation({
    mutationFn: (id: string) => api.put(`/payments/member-to-org/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMemberPayments'] });
      setIsModalOpen(false);
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.put(`/payments/member-to-org/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMemberPayments'] });
      setIsModalOpen(false);
      setRejectReason('');
    },
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      <div>
        <h2 className="text-xl font-black text-slate-900">Member Subscription Payments</h2>
        <p className="text-slate-500 text-sm">Review and confirm member subscription payments</p>
      </div>

      {loadingPayments ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : memberPayments?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-slate-500 text-lg">No member subscription payments yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600">Member</th>
                  <th className="text-left p-4 font-bold text-slate-600">Amount</th>
                  <th className="text-left p-4 font-bold text-slate-600">Payment Method</th>
                  <th className="text-left p-4 font-bold text-slate-600">Transaction ID</th>
                  <th className="text-left p-4 font-bold text-slate-600">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberPayments?.map((payment: any) => (
                  <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{payment.user?.name}</div>
                      <div className="text-xs text-slate-500">{payment.user?.email}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      {payment.currency || 'ETB'} {payment.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-700">{payment.payment_method}</td>
                    <td className="p-4 text-slate-700">{payment.transaction_id}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(
                          payment.status
                        )}`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsModalOpen(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => confirmPaymentMutation.mutate(payment.id)}
                              disabled={confirmPaymentMutation.isPending}
                              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition"
                              title="Confirm Payment"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsModalOpen(true);
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                              title="Reject Payment"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Payment Details</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setRejectReason('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Member</p>
                  <p className="font-semibold text-slate-900">{selectedPayment.user?.name}</p>
                  <p className="text-xs text-slate-500">{selectedPayment.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="text-2xl font-black text-sky-600">
                    {selectedPayment.currency || 'ETB'} {selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Payment Method</p>
                  <p className="font-semibold text-slate-900">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Transaction ID</p>
                  <p className="font-semibold text-slate-900 font-mono">{selectedPayment.transaction_id}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                    selectedPayment.status
                  )}`}
                >
                  {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                </span>
              </div>

              {selectedPayment.receipt_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Receipt</p>
                  <img
                    src={`http://localhost:5000/${selectedPayment.receipt_url}`}
                    alt="Payment Receipt"
                    className="w-full rounded-lg border border-slate-200"
                  />
                </div>
              )}

              {selectedPayment.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Rejection Reason (optional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setRejectReason('');
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => rejectPaymentMutation.mutate({ id: selectedPayment.id, reason: rejectReason })}
                      disabled={rejectPaymentMutation.isPending}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition disabled:opacity-50"
                    >
                      Reject Payment
                    </button>
                    <button
                      onClick={() => confirmPaymentMutation.mutate(selectedPayment.id)}
                      disabled={confirmPaymentMutation.isPending}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition disabled:opacity-50"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgMemberPayments;
