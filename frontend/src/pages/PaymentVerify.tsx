import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentVerify: React.FC = () => {
  const { tx_ref } = useParams<{ tx_ref: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await api.get(`/payments/verify/${tx_ref}`);
        if (response.data.status === 'success') {
          setStatus('success');
          setMessage(response.data.message || 'Welcome to the next level! Your plan has been upgraded successfully.');
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Transaction could not be verified. Please contact support.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        
        if (error.response?.status === 401) {
          setMessage('Your session has expired. Please log in again to complete the upgrade.');
        } else if (error.response?.status === 404) {
          setMessage('We couldn\'t find a record of this payment. If you were charged, please contact support.');
        } else {
          setMessage(error.response?.data?.message || 'An error occurred while verifying your payment with Chapa.');
        }
      }
    };

    if (tx_ref) {
      verify();
    }
  }, [tx_ref]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-indigo-100">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-10 text-center animate-fade-in">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center animate-pulse">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verifying Payment</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Please wait while we secure your transaction with Chapa...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center animate-bounce">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Successful!</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              {message}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verification Failed</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              {message}
            </p>
            <button
              onClick={() => navigate('/org/upgrade')}
              className="mt-4 w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentVerify;
