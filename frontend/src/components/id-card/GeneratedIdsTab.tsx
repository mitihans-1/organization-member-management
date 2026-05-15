import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Download, Printer, RefreshCw, XCircle, Shield } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { PrintPage1Back, PrintPage2Front } from './IdCardTemplates';

export const GeneratedIdsTab = () => {
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['generatedCards'],
    queryFn: () => api.get('/id-cards/generated').then(res => res.data),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/id-cards/${id}/revoke`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['generatedCards'] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/id-cards/${id}/regenerate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['generatedCards'] }),
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Member_ID_Card',
    pageStyle: `@page { size: auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`
  });

  const [selectedCard, setSelectedCard] = React.useState<any>(null);
  const [editCard, setEditCard] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    name: '', role: '', sex: '', phone: '', address: '', expiresAt: '',
    cardNumber: '', generatedAt: ''
  });

  const updateDetailsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/id-cards/${id}/details`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedCards'] });
      setEditCard(null);
      if (selectedCard && editCard && selectedCard.id === editCard.id) {
        queryClient.invalidateQueries({ queryKey: ['generatedCards'] });
      }
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading cards...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Card Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ver.</th>
                <th className="px-6 py-4">Prints</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No generated cards found.</td>
                </tr>
              ) : (
                cards.map((card: any) => (
                  <tr 
                    key={card.id} 
                    className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${selectedCard?.id === card.id ? 'bg-indigo-50/50' : ''}`} 
                    onClick={() => setSelectedCard(card)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {card.user?.name}
                      <div className="text-xs text-gray-500 font-normal">{card.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{card.cardNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${card.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {card.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">v{card.version}</td>
                    <td className="px-6 py-4">{card.printCount}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {card.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); revokeMutation.mutate(card.id); }}
                              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                            >
                              Revoke
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); regenerateMutation.mutate(card.id); }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold transition-colors"
                            >
                              Regen
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditCard(card); 
                                setFormData({
                                  name: card.user?.name || '',
                                  role: card.user?.role || '',
                                  sex: card.user?.sex || '',
                                  phone: card.user?.phone || '',
                                  address: card.user?.address || '',
                                  expiresAt: card.expiresAt ? new Date(card.expiresAt).toISOString().split('T')[0] : '',
                                  cardNumber: card.cardNumber || '',
                                  generatedAt: card.generatedAt ? new Date(card.generatedAt).toISOString().split('T')[0] : ''
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 text-xs font-bold transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold transition-colors"
                            >
                              Preview
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Preview Section */}
      <div className="bg-gray-100/50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col p-8 items-center min-h-[600px]">
        <div className="w-full flex justify-between items-center mb-8 max-w-4xl">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Two-Sided Print Preview</h4>
          {selectedCard && (
            <button
              onClick={handlePrint}
              disabled={selectedCard.printCount > 0}
              className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm hover:bg-indigo-500 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer size={18} /> Print Cards
            </button>
          )}
        </div>

        {selectedCard?.printCount > 0 && (
          <div className="w-full max-w-4xl mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-bold flex items-center gap-3">
            <XCircle size={20} className="text-orange-500" />
            This card has already been printed ({selectedCard.printCount} times). Use the Regenerate action if a replacement is needed.
          </div>
        )}
        
        {selectedCard ? (
          <div className="w-full overflow-x-auto pb-8 flex justify-center custom-scrollbar">
            {/* Wrapper for scaling on smaller screens without affecting print */}
            <div className="transform scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 origin-top">
              <div ref={printRef} className="flex flex-col gap-[30px] print:gap-0">
                <div className="relative group">
                  <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 print:hidden">PAGE 1 (BACK SIDE)</div>
                  <PrintPage1Back card={selectedCard} />
                </div>
                <div className="relative group mt-8 print:mt-0">
                  <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 print:hidden">PAGE 2 (FRONT SIDE)</div>
                  <PrintPage2Front card={selectedCard} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4 mt-20">
            <div className="w-16 h-16 rounded-full bg-gray-200/50 flex items-center justify-center">
              <Shield size={32} className="text-gray-400" />
            </div>
            <p>Select a member from the list to preview their ID cards</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md my-8">
            <h3 className="text-lg font-black text-gray-900 mb-2">Edit Card Details</h3>
            <p className="text-sm text-gray-500 mb-6">Update the information for {editCard.user?.name}. This will also update their main profile.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role / Title</label>
                <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                  <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Address / Country</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date of Issue</label>
                  <input type="date" value={formData.generatedAt} onChange={e => setFormData({...formData, generatedAt: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiration Date</label>
                  <input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Member ID / Card No.</label>
                <input type="text" value={formData.cardNumber} onChange={e => setFormData({...formData, cardNumber: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditCard(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateDetailsMutation.mutate({ 
                    id: editCard.id, 
                    data: {
                      ...formData,
                      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
                      generatedAt: formData.generatedAt ? new Date(formData.generatedAt).toISOString() : null
                    }
                  });
                }}
                disabled={updateDetailsMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 text-sm disabled:opacity-50 transition-colors"
              >
                {updateDetailsMutation.isPending ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

