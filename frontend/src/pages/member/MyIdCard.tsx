import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, CreditCard, UploadCloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MyIdCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('Lost');
  const [paymentMethod, setPaymentMethod] = useState('Will Pay In Office');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState('Male');
  const [address, setAddress] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['myIdCard'],
    queryFn: () => api.get('/id-cards/my-card').then(res => res.data),
  });

  const requestMutation = useMutation({
    mutationFn: (reqData: any) => api.post('/id-cards/request', reqData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myIdCard'] }),
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/payments/member-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myIdCard'] });
      alert('Payment receipt uploaded successfully. Awaiting admin verification.');
    }
  });

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      if (data?.card) {
        api.post('/id-cards/print-log', { idCardId: data.card.id }).catch(console.error);
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading your ID Card data...</div>;

  const card = data?.card;
  const activeRequest = data?.activeRequest;

  // Render PENDING Request State
  if (activeRequest && activeRequest.requestStatus === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <CreditCard size={48} className="mx-auto text-indigo-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Request Pending Approval</h2>
        <p className="text-gray-500 mt-2">Your ID Card request has been submitted and is waiting for your Organization Admin to approve and generate it.</p>
      </div>
    );
  }

  // Render PAYMENT REQUIRED State
  if (activeRequest && activeRequest.requestStatus === 'PENDING_PAYMENT_VERIFICATION') {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-orange-100 text-center">
        <UploadCloud size={48} className="mx-auto text-orange-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Payment Required</h2>
        <p className="text-gray-500 mt-2">Your replacement ID card request requires payment verification.</p>
        
        <div className="mt-8 text-left space-y-4 bg-gray-50 p-6 rounded-xl">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload Receipt</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Upload a screenshot of your Telebirr or CBE Birr transfer.</p>
          </div>
          <button 
            onClick={() => {
              if (!receiptFile) return alert('Please select a receipt image.');
              const formData = new FormData();
              formData.append('receipt', receiptFile);
              formData.append('reason', 'ID_CARD_REPLACEMENT');
              formData.append('payment_method', 'telebirr'); // Assuming default or let user choose
              uploadReceiptMutation.mutate(formData);
            }}
            disabled={!receiptFile || uploadReceiptMutation.isPending}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
          >
            {uploadReceiptMutation.isPending ? 'Uploading...' : 'Submit Payment Receipt'}
          </button>
        </div>
      </div>
    );
  }

  // Render NO ID State
  if (!card) {
    const isMissingInfo = !user?.phone || !user?.sex || !user?.address;

    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">No ID Card Generated</h2>
        <p className="text-gray-500 mt-2 mb-8">You do not have an active ID Card. Request your first one for free.</p>
        
        {isMissingInfo && (
          <div className="mb-8 bg-orange-50 border border-orange-100 p-6 rounded-2xl text-left">
            <h3 className="text-sm font-bold text-orange-800 mb-4">Complete Your Profile</h3>
            <p className="text-xs text-orange-600 mb-4">Please provide the following required information to generate your ID card.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm" placeholder="e.g. +251..." required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Country / Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm" placeholder="e.g. Ethiopia" required />
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => {
            if (isMissingInfo && (!phone || !address)) return alert('Please fill in all missing information.');
            requestMutation.mutate({ requestType: 'FIRST_TIME', phone, sex, address });
          }}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-500"
        >
          Request ID Card
        </button>
      </div>
    );
  }

  // Render GENERATED Card
  return (
    <div className="max-w-4xl mx-auto mt-8 flex flex-col md:flex-row gap-8">
      {/* Left side: Card Preview */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
        <div
          ref={printRef}
          className="w-full max-w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 flex flex-col items-center text-center relative overflow-hidden"
          style={{ minHeight: '480px' }}
        >
          {/* Header Banner */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
          
          <div className="z-10 mt-3 w-full flex justify-between items-center text-white font-bold px-2 gap-2">
            <div className="flex items-center gap-1.5 w-full">
              <span className="text-[11px] truncate">{card.organization?.name}</span>
              <span className="text-[11px] text-white/90 font-medium uppercase tracking-wider whitespace-nowrap">Identification Card</span>
            </div>
            <span className="bg-white/20 px-2 py-0.5 text-[10px] rounded-full border border-white/30 backdrop-blur-sm shrink-0">v{card.version}</span>
          </div>

          <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-200 z-10 mt-6 overflow-hidden shadow-lg">
            <img 
              src={card.user?.profile_photo_path || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.user?.name || '')}&background=e0e7ff&color=3730a3`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="z-10 mt-4 w-full">
            <h3 className="font-black text-gray-900 text-xl tracking-tight leading-tight">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-0.5">NAME:</span> 
              {card.user?.name}
            </h3>
            <p className="text-sm text-indigo-600 font-bold uppercase tracking-widest mt-1">{card.user?.role}</p>
            
            <div className="flex flex-col items-center mt-3 text-[10px] text-gray-700 gap-0.5">
              {card.user?.sex && <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">GENDER:</span> <span className="font-semibold uppercase">{card.user.sex}</span></div>}
              {card.user?.address && <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">COUNTRY:</span> <span className="font-semibold uppercase">{card.user.address}</span></div>}
              {card.user?.phone && <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">PHONE:</span> <span className="font-bold font-mono">{card.user.phone}</span></div>}
              <div className="flex gap-1.5"><span className="font-bold text-gray-400 uppercase tracking-widest">GIVEN:</span> <span className="font-semibold uppercase">{new Date(card.generatedAt).toLocaleDateString()}</span></div>
              <div className="flex gap-1.5">
                <span className="font-bold text-gray-400 uppercase tracking-widest">EXPIRES:</span> 
                <span className="font-semibold uppercase">
                  {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : new Date(new Date(card.generatedAt).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-3 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100">
            <QRCodeSVG
              value={`${window.location.origin}/verify/${card.qrToken}`}
              size={120}
              level="H"
            />
          </div>

          <div className="mt-auto pt-6 w-full text-xs text-gray-400 font-mono flex justify-center items-end tracking-widest">
            {card.cardNumber}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-8 w-full max-w-[320px]">
          {card.printCount > 0 && (
            <div className="text-xs text-orange-600 font-bold text-center bg-orange-50 py-2 rounded-xl border border-orange-100">
              Already printed. Request a replacement if lost.
            </div>
          )}
          <button 
            onClick={handlePrintAction}
            disabled={card.printCount > 0}
            className="w-full bg-white border-2 border-indigo-100 text-indigo-600 font-bold py-3 px-4 rounded-xl hover:bg-indigo-50 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={18} /> Print Card
          </button>
        </div>
      </div>

      {/* Right side: Replacement Request */}
      <div className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-6">Need a Replacement?</h3>
        <p className="text-xs text-gray-500 mb-6">If your card is lost or damaged, you can request a replacement. Reprints require payment.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>Lost</option>
              <option>Damaged</option>
              <option>Information Correction</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>Will Pay In Office</option>
              <option>Upload Receipt</option>
            </select>
          </div>
          
          <button 
            onClick={() => requestMutation.mutate({ requestType: 'REPLACEMENT', reason })}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800"
          >
            Request Replacement
          </button>
        </div>
      </div>
    </div>
  );
};
