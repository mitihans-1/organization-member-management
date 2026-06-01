import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, CreditCard, UploadCloud, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrintPage1Back, PrintPage2Front } from '../../components/id-card/IdCardTemplates';

export const MyLicense = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [reason, setReason] = useState('Lost');
  const [paymentMethod, setPaymentMethod] = useState('Will Pay In Office');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const [phone, setPhone] = useState('');
  const [sex, setSex] = useState('Male');
  const [address, setAddress] = useState('');
  const [requestType, setRequestType] = useState('FIRST_TIME');

  const { data, isLoading } = useQuery({
    queryKey: ['myLicense'],
    queryFn: () => api.get('/licenses/my-license').then(res => res.data),
  });

  const { data: availablePlans } = useQuery({
    queryKey: ['licensePlans', requestType, user?.organizationId],
    queryFn: () => api.get(`/license-plans/organization/${user?.organizationId}?licenseType=${requestType}`).then(res => res.data),
    enabled: !!user?.organizationId,
  });

  const requestMutation = useMutation({
    mutationFn: (reqData: any) => api.post('/licenses/request', reqData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myLicense'] }),
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/payments/member-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLicense'] });
      alert('Payment receipt uploaded successfully. Awaiting admin verification.');
    }
  });

  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'My_License',
    pageStyle: `@page { size: auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`,
    onAfterPrint: () => {
      if (data?.license) {
        api.post('/licenses/print-log', { licenseId: data.license.id }).catch(console.error);
      }
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading your License data...</div>;

  const license = data?.license;
  const activeRequest = data?.activeRequest;

  // Render PENDING Request State
  if (activeRequest && activeRequest.requestStatus === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <CreditCard size={48} className="mx-auto text-indigo-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Request Pending Approval</h2>
        <p className="text-gray-500 mt-2">Your License request has been submitted and is waiting for your Organization Admin to approve and generate it.</p>
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
        <p className="text-gray-500 mt-2">Your License request requires payment verification.</p>
        
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
              formData.append('reason', 'LICENSE_REPLACEMENT');
              formData.append('payment_method', 'telebirr');
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

  // Render NO License State
  if (!license) {
    const isMissingInfo = !user?.phone || !user?.sex || !user?.address;

    return (
      <div className="max-w-5xl mx-auto mt-12 p-8">
        <div className="text-center mb-8">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">No License Generated</h2>
          <p className="text-gray-500 mt-2">You do not have an active License. Select a plan to request your first one.</p>
        </div>
        
        {isMissingInfo && (
          <div className="mb-8 bg-orange-50 border border-orange-100 p-6 rounded-2xl text-left max-w-2xl mx-auto">
            <h3 className="text-sm font-bold text-orange-800 mb-4">Complete Your Profile</h3>
            <p className="text-xs text-orange-600 mb-4">Please provide the following required information to generate your license.</p>
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

        <div className="mb-6 max-w-2xl mx-auto">
          <select 
            title="request type"
            value={requestType}
            onChange={(e) => {
              setRequestType(e.target.value);
              setSelectedPlanId(null);
            }}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm mb-4"
          >
            <option value="FIRST_TIME">New License</option>
            <option value="RENEWAL">Renewal</option>
            <option value="REPLACEMENT">Replacement (Lost/Damaged)</option>
            <option value="UPGRADE">Upgrade</option>
          </select>
        </div>

        {availablePlans && availablePlans.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {availablePlans.map((plan: any) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`bg-white rounded-2xl border-2 p-6 shadow-sm cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <h3 className="text-lg font-black text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{plan.description}</p>

                <div className="mb-4">
                  <p className="text-3xl font-black text-indigo-600">
                    {plan.currency} {plan.price.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-sm">Duration: {plan.durationDays} days</p>
                </div>

                {plan.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={() => {
              if (isMissingInfo && (!phone || !address)) return alert('Please fill in all missing information.');
              if (availablePlans && availablePlans.length > 0 && !selectedPlanId) return alert('Please select a license plan.');
              requestMutation.mutate({ requestType, phone, sex, address, licensePlanId: selectedPlanId });
            }}
            disabled={requestMutation.isPending}
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
          >
            {requestMutation.isPending ? 'Submitting...' : 'Request License'}
          </button>
        </div>
      </div>
    );
  }

  // Render GENERATED License
  return (
    <div className="max-w-6xl mx-auto mt-8 flex flex-col xl:flex-row gap-8">
      {/* Left side: License Preview */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center overflow-hidden">
        
        <div className="w-full flex justify-between items-center mb-6 max-w-[648px]">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Official License</h4>
          <button 
            onClick={handlePrintAction}
            disabled={license.printCount > 0}
            className="bg-indigo-600 text-white border-none font-bold py-2 px-4 rounded-xl hover:bg-indigo-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Printer size={16} /> {license.printCount > 0 ? 'Already Printed' : 'Print License'}
          </button>
        </div>

        {license.printCount > 0 && (
          <div className="w-full max-w-[648px] mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm font-bold flex items-center justify-center">
            You have already printed your license. Request a replacement if lost.
          </div>
        )}

        <div className="w-full overflow-x-auto pb-8 flex justify-center custom-scrollbar">
          {/* Wrapper for scaling on smaller screens without affecting print */}
          <div className="transform scale-[0.5] sm:scale-[0.6] md:scale-75 lg:scale-90 xl:scale-100 origin-top">
            <div ref={printRef} className="flex flex-col gap-[30px] print:gap-0">
              <div className="relative group">
                <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 print:hidden">PAGE 1 (BACK SIDE)</div>
                <PrintPage1Back card={license} />
              </div>
              <div className="relative group mt-8 print:mt-0">
                <div className="absolute -top-6 left-0 text-xs font-bold text-gray-400 print:hidden">PAGE 2 (FRONT SIDE)</div>
                <PrintPage2Front card={license} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Request Options */}
      <div className="w-full md:w-96 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-6">Need Another License?</h3>
        <p className="text-xs text-gray-500 mb-6">Request renewal, replacement, or upgrade.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Request Type</label>
            <select 
              title="request type"
              value={requestType}
              onChange={(e) => {
                setRequestType(e.target.value);
                setSelectedPlanId(null);
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="RENEWAL">Renewal</option>
              <option value="REPLACEMENT">Replacement</option>
              <option value="UPGRADE">Upgrade</option>
            </select>
          </div>
          
          {requestType === 'REPLACEMENT' && (
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
          )}
          
          {availablePlans && availablePlans.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Plan</label>
              <div className="space-y-2">
                {availablePlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">{plan.name}</span>
                      <span className="text-sm font-bold text-indigo-600">{plan.currency} {plan.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => {
              if (availablePlans && availablePlans.length > 0 && !selectedPlanId) return alert('Please select a license plan.');
              requestMutation.mutate({ requestType, reason, licensePlanId: selectedPlanId });
            }}
            disabled={requestMutation.isPending}
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50"
          >
            {requestMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
