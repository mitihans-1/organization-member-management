import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, XCircle, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const VerifyLicense = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['verifyLicense', token],
    queryFn: () => api.get(`/licenses/verify/${token}`).then(res => res.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-poppins">
        <div className="animate-pulse text-gray-400 font-bold">Verifying License...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-poppins">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Invalid License</h2>
          <p className="text-gray-500 mt-2 text-sm">This QR code does not match any valid license in our system. It may be fake or incorrectly scanned.</p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700">
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-poppins py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Status Header */}
        <div className={`p-6 text-center ${data.status === 'ACTIVE' ? 'bg-violet-500' : 'bg-red-500'}`}>
          <div className="flex justify-center mb-3">
            {data.status === 'ACTIVE' ? (
              <ShieldCheck size={48} className="text-white" />
            ) : (
              <ShieldAlert size={48} className="text-white" />
            )}
          </div>
          <h2 className="text-white font-black text-2xl tracking-tight uppercase">
            {data.status === 'ACTIVE' ? 'Verified & Active' : `License ${data.status}`}
          </h2>
        </div>

        {/* Member Info */}
        <div className="p-8 flex flex-col items-center relative">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 shadow-xl -mt-16 overflow-hidden relative z-10">
            <img 
              src={data.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=ede9fe&color=4c1d95`} 
              alt={data.name} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center mt-6 w-full">
            <h3 className="text-2xl font-black text-gray-900">{data.name}</h3>
            <p className="text-violet-600 font-bold uppercase tracking-widest text-sm mt-1">{data.role}</p>
          </div>

          <div className="w-full mt-8 space-y-4">
            <div className="flex bg-violet-50 p-4 rounded-xl border border-violet-100 text-center items-center justify-center gap-1.5">
              <span className="font-black text-violet-900 text-lg leading-tight">{data.organization}</span>
              <span className="font-bold text-violet-500 text-lg uppercase tracking-wider">License</span>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">License No</span>
                <span className="font-mono text-sm text-gray-900 mt-0.5">{data.licenseNumber}</span>
              </div>
              <div className="w-24 flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Version</span>
                <span className="font-semibold text-gray-900 mt-0.5">v{data.version}</span>
              </div>
            </div>
            
            {data.expiresAt && (
              <div className="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valid Until</span>
                <span className="font-semibold text-gray-900 mt-0.5">{new Date(data.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pb-8 text-center">
          <Link to="/" className="text-sm font-bold text-gray-400 hover:text-gray-600">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyLicense;
