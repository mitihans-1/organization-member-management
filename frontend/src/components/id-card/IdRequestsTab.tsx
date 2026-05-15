import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Eye, ShieldAlert, X } from 'lucide-react';

export const IdRequestsTab = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [configModalRequest, setConfigModalRequest] = useState<any>(null);
  const [formatConfig, setFormatConfig] = useState({
    prefix: 'ID-',
    length: 6,
    includeNumbers: true,
    includeLetters: true,
    includeHyphens: false,
    suffix: ''
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['idCardRequests'],
    queryFn: () => api.get('/id-cards/requests').then(res => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, formatConfig }: { id: string; formatConfig: any }) => 
      api.post(`/id-cards/requests/${id}/approve`, { formatConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idCardRequests'] });
      queryClient.invalidateQueries({ queryKey: ['generatedCards'] });
      alert('Request approved and ID Card generated.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Error approving request.');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/id-cards/requests/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idCardRequests'] });
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (id: string) => api.post(`/id-cards/requests/${id}/verify-payment`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idCardRequests'] });
      alert('Payment verified. You can now approve this request.');
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading requests...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No requests found.</td>
              </tr>
            ) : (
              requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {req.user?.name}
                    <div className="text-xs text-gray-500 font-normal">{req.user?.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${req.requestType === 'FIRST_TIME' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {req.requestType.replace('_', ' ')}
                    </span>
                    {req.reason && <div className="text-xs text-gray-500 mt-1">{req.reason}</div>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold ${req.paymentStatus === 'COMPLETED' ? 'text-green-600' : req.paymentStatus === 'NOT_REQUIRED' ? 'text-gray-500' : 'text-orange-500'}`}>
                      {req.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-700">{req.requestStatus.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-bold flex items-center gap-1"
                        title="View Details"
                      >
                        <Eye size={14} /> View
                      </button>
                      
                      {req.requestStatus === 'PENDING_PAYMENT_VERIFICATION' && (
                        <button
                          onClick={() => verifyPaymentMutation.mutate(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 text-xs font-bold border border-blue-200"
                        >
                          <ShieldAlert size={14} /> Verify Payment
                        </button>
                      )}
                      {req.requestStatus === 'PENDING' && (
                        <button
                          onClick={() => setConfigModalRequest(req)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold"
                        >
                          Approve
                        </button>
                      )}
                      {(req.requestStatus === 'PENDING' || req.requestStatus === 'PENDING_PAYMENT_VERIFICATION') && (
                        <button
                          onClick={() => rejectMutation.mutate(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-900">Request Details</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm shrink-0">
                  <img 
                    src={selectedRequest.user?.profile_photo_path || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedRequest.user?.name || '')}&background=e0e7ff&color=3730a3`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-black text-xl text-gray-900">{selectedRequest.user?.name}</h4>
                  <p className="text-sm text-gray-500">{selectedRequest.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedRequest.user?.phone || 'N/A'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedRequest.user?.sex || 'N/A'}</span>
                </div>
                <div className="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Country / Address</span>
                  <span className="text-sm font-semibold text-gray-800">{selectedRequest.user?.address || 'N/A'}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Request Type</span>
                  <span className="text-sm font-bold text-gray-900">{selectedRequest.requestType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Payment Status</span>
                  <span className={`text-sm font-bold ${selectedRequest.paymentStatus === 'COMPLETED' ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {selectedRequest.paymentStatus}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</span>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">{selectedRequest.reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 text-sm"
              >
                Close
              </button>
              
              {selectedRequest.requestStatus === 'PENDING' && (
                <button
                  onClick={() => {
                    setConfigModalRequest(selectedRequest);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 text-sm shadow-sm"
                >
                  Approve ID
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {configModalRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-900">Configure ID Format</h3>
              <button onClick={() => setConfigModalRequest(null)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <p className="text-xs text-gray-500 font-medium">Define the format for {configModalRequest.user?.name}'s new ID card number.</p>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Prefix (Optional)</label>
                <input 
                  type="text" 
                  value={formatConfig.prefix} 
                  onChange={e => setFormatConfig({...formatConfig, prefix: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  placeholder="e.g. ORG-"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Random String Length: {formatConfig.length}</label>
                <input 
                  type="range" 
                  min="4" max="12" 
                  value={formatConfig.length} 
                  onChange={e => setFormatConfig({...formatConfig, length: parseInt(e.target.value)})}
                  className="w-full accent-indigo-600" 
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formatConfig.includeNumbers} onChange={e => setFormatConfig({...formatConfig, includeNumbers: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700">Include Numbers (0-9)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formatConfig.includeLetters} onChange={e => setFormatConfig({...formatConfig, includeLetters: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700">Include Letters (A-Z)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formatConfig.includeHyphens} onChange={e => setFormatConfig({...formatConfig, includeHyphens: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                  <span className="text-sm font-semibold text-gray-700">Format with Hyphens</span>
                </label>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Suffix (Optional)</label>
                <input 
                  type="text" 
                  value={formatConfig.suffix} 
                  onChange={e => setFormatConfig({...formatConfig, suffix: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                  placeholder="e.g. -2026"
                />
              </div>
              
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-indigo-400 block mb-1 uppercase tracking-wider">Preview Example</span>
                <span className="text-lg font-black text-indigo-900 tracking-widest font-mono">
                  {formatConfig.prefix}
                  {Array.from({ length: formatConfig.length }, () => {
                    const c = formatConfig.includeLetters ? 'A' : (formatConfig.includeNumbers ? '1' : 'X');
                    return c;
                  }).join('').match(new RegExp(`.{1,${formatConfig.includeHyphens ? 4 : formatConfig.length}}`, 'g'))?.join(formatConfig.includeHyphens ? '-' : '')}
                  {formatConfig.suffix}
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button 
                onClick={() => setConfigModalRequest(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  approveMutation.mutate({ id: configModalRequest.id, formatConfig });
                  setConfigModalRequest(null);
                }}
                disabled={approveMutation.isPending || (!formatConfig.includeLetters && !formatConfig.includeNumbers)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 text-sm shadow-sm disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Generating...' : 'Confirm & Generate ID'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
