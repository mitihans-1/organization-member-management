import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, CreditCard, UploadCloud, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrintPage1Back, PrintPage2Front } from '../../components/id-card/IdCardTemplates';

export const MyIdCard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
    documentTitle: 'My_ID_Card',
    pageStyle: `@page { size: auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-bold">Back</span>
        </button>
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
                <select title='gender' value={sex} onChange={(e) => setSex(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm">
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
    <div className="max-w-6xl mx-auto mt-8 flex flex-col xl:flex-row gap-8">
      {/* Left side: Card Preview */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center overflow-hidden">
        
        <div className="w-full flex justify-between items-center mb-6 max-w-[648px]">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Official ID Card</h4>
          <button 
            onClick={handlePrintAction}
            disabled={card.printCount > 0}
            className="bg-indigo-600 text-white border-none font-bold py-2 px-4 rounded-xl hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Printer size={16} /> {card.printCount > 0 ? 'Already Printed' : 'Print Card'}
          </button>
        </div>

        {card.printCount > 0 && (
          <div className="w-full max-w-[648px] mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-bold flex items-center justify-center">
            You have already printed your ID card. Request a replacement if lost.
          </div>
        )}

        <div className="w-full overflow-x-auto pb-8 flex justify-center custom-scrollbar">
          {/* Wrapper for scaling on smaller screens without affecting print */}
          <div className="transform scale-[0.5] sm:scale-[0.6] md:scale-75 lg:scale-90 xl:scale-100 origin-top">
            <div ref={printRef} className="flex flex-col gap-[30px] print:gap-0">
              <div className="relative group">
                <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 print:hidden">PAGE 1 (BACK SIDE)</div>
                <PrintPage1Back card={card} />
              </div>
              <div className="relative group mt-8 print:mt-0">
                <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 print:hidden">PAGE 2 (FRONT SIDE)</div>
                <PrintPage2Front card={card} />
              </div>
            </div>
          </div>
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
            title='reason'
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
            title='payment'
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
