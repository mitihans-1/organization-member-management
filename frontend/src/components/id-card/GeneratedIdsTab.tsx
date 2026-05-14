import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Download, Printer, RefreshCw, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';

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
  });

  const [selectedCard, setSelectedCard] = React.useState<any>(null);
  const [editCard, setEditCard] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    name: '', role: '', sex: '', phone: '', address: '', expiresAt: ''
  });

  const updateDetailsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/id-cards/${id}/details`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedCards'] });
      setEditCard(null);
      // Update selected card preview if it was the one edited
      if (selectedCard && editCard && selectedCard.id === editCard.id) {
        queryClient.invalidateQueries({ queryKey: ['generatedCards'] }); // Will refresh selected
      }
    },
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading cards...</div>;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="flex-1 overflow-x-auto border-r border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Card Number</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ver.</th>
              <th className="px-4 py-3">Prints</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cards.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No generated cards found.</td>
              </tr>
            ) : (
              cards.map((card: any) => (
                <tr key={card.id} className="hover:bg-gray-50/80 cursor-pointer" onClick={() => setSelectedCard(card)}>
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {card.user?.name}
                    <div className="text-xs text-gray-500 font-normal">{card.user?.email}</div>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">{card.cardNumber}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold ${card.status === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                      {card.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">v{card.version}</td>
                  <td className="px-4 py-4">{card.printCount}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {card.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); revokeMutation.mutate(card.id); }}
                            className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                          >
                            Revoke
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); regenerateMutation.mutate(card.id); }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold"
                          >
                            Regenerate
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
                                expiresAt: card.expiresAt ? new Date(card.expiresAt).toISOString().split('T')[0] : ''
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 text-xs font-bold"
                          >
                            Edit Details
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedCard(card); }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold"
                          >
                            Preview Card
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
      
      {/* Preview Section */}
      <div className="w-full md:w-80 p-6 bg-gray-50 flex flex-col items-center justify-start border-t md:border-t-0">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 w-full text-center">Card Preview</h4>
        
        {selectedCard ? (
          <div className="w-full flex flex-col items-center gap-4">
            {/* The ID Card Preview */}
            <div
              ref={printRef}
              className="w-full max-w-[280px] bg-white rounded-xl shadow-md border border-gray-200 p-4 flex flex-col items-center text-center relative overflow-hidden"
              style={{ minHeight: '400px' }}
            >
              <div className="absolute top-0 left-0 w-full h-24 bg-indigo-600"></div>
              
              <div className="z-10 mt-2 w-full flex justify-between items-center text-white font-bold text-xs px-2">
                <div className="flex items-center gap-1 w-full justify-center">
                  <span className="text-[10px] truncate">{selectedCard.organization?.name || 'Organization'}</span>
                  <span className="text-[10px] text-white/90 font-medium uppercase tracking-wider">Identification Card</span>
                </div>
              </div>

              <div className="w-20 h-20 rounded-full border-4 border-white bg-gray-200 z-10 mt-1 overflow-hidden">
                <img 
                  src={selectedCard.user?.profile_photo_path || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCard.user?.name || '')}&background=e0e7ff&color=3730a3`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="z-10 mt-3 w-full">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">NAME:</span>
                  {selectedCard.user?.name}
                </h3>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1">{selectedCard.user?.role}</p>
                
                <div className="flex flex-col items-center mt-3 text-[9px] text-gray-700 gap-0.5">
                  {selectedCard.user?.sex && <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">GENDER:</span> <span className="font-semibold uppercase">{selectedCard.user.sex}</span></div>}
                  {selectedCard.user?.address && <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">COUNTRY:</span> <span className="font-semibold uppercase">{selectedCard.user.address}</span></div>}
                  {selectedCard.user?.phone && <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">PHONE:</span> <span className="font-bold font-mono">{selectedCard.user.phone}</span></div>}
                  <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">GIVEN:</span> <span className="font-semibold uppercase">{new Date(selectedCard.generatedAt).toLocaleDateString()}</span></div>
                  <div className="flex gap-1.5">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">EXPIRES:</span> 
                    <span className="font-semibold uppercase">
                      {selectedCard.expiresAt ? new Date(selectedCard.expiresAt).toLocaleDateString() : new Date(new Date(selectedCard.generatedAt).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-2 bg-white rounded-lg">
                <QRCodeSVG
                  value={`${window.location.origin}/verify/${selectedCard.qrToken}`}
                  size={100}
                  level="H"
                />
              </div>

              <div className="mt-auto pt-4 w-full text-[10px] text-gray-400 font-mono flex justify-between items-end">
                <span>{selectedCard.cardNumber}</span>
                <span>v{selectedCard.version}</span>
              </div>
            </div>

            <div className="w-full flex gap-2 mt-2 flex-col">
              {selectedCard.printCount > 0 && (
                <div className="text-xs text-orange-600 font-bold text-center bg-orange-50 py-1.5 rounded-lg border border-orange-100">
                  Already printed ({selectedCard.printCount} times). Use Regenerate for replacements.
                </div>
              )}
              <button
                onClick={handlePrint}
                disabled={selectedCard.printCount > 0}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Select a card to preview
          </div>
        )}
      </div>
    </div>

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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Role</label>
              <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                <select value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
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
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Expiration Date</label>
              <input type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => setEditCard(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                updateDetailsMutation.mutate({ 
                  id: editCard.id, 
                  data: {
                    ...formData,
                    expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
                  }
                });
              }}
              disabled={updateDetailsMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 text-sm disabled:opacity-50"
            >
              Save Details
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
