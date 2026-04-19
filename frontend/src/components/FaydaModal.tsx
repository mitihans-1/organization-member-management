import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Fingerprint, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import faydaService, { FaydaProfile } from '../services/faydaService';

interface FaydaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

const FaydaModal: React.FC<FaydaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle');
  const [faydaId, setFaydaId] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<FaydaProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setFaydaId('');
      setError('');
      setProfile(null);
    }
  }, [isOpen]);

  const handleStartScan = async () => {
    if (!faydaId.trim()) {
      setError('Please enter your Fayda ID or Scan your card');
      return;
    }

    // Clean input (remove spaces, hyphens, and uppercase)
    const cleanId = faydaId.replace(/[\s-]/g, '').toUpperCase();
    
    // Fayda FIN is exactly a 12-digit number (e.g. 1234 5678 9012)
    // Fayda FAN is exactly 16 alphanumeric characters.
    const isFin = /^\d{12}$/.test(cleanId);
    const isFan = /^[A-Z0-9]{16}$/.test(cleanId);

    if (!isFin && !isFan) {
      setError('Invalid format. Please enter a valid 12-digit FIN or 16-character FAN.');
      return;
    }

    setError('');
    setStep('scanning');

    // Simulate scanning for 2 seconds
    setTimeout(async () => {
      setStep('verifying');
      try {
        const result = await faydaService.verify(faydaId);
        setProfile(result);
        setStep('success');
        
        // Finalize login after a short delay to show success state
        setTimeout(async () => {
          const authData = await faydaService.login(result);
          onSuccess(authData);
        }, 1500);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Verification failed. Please try again.');
        setStep('error');
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-brand-dark w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Full Modal Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: 'url("/asset/fayda-btn-bg.png")' }}
        ></div>
        <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"></div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors z-20"
        >
          <X className="h-6 w-6 text-white/60" />
        </button>

        <div className="relative p-8 sm:p-10 z-10">
          <div className="text-center mb-8">
            <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/10">
              <ShieldCheck className="h-10 w-10 text-brand-medium brightness-150" />
            </div>
            <h3 className="text-3xl font-black text-white">Fayda ID</h3>
            <p className="text-white/60 mt-2 font-medium">National Identity Verification</p>
          </div>

          <div className="space-y-6">
            {step === 'idle' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="relative bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center group hover:border-white/30 transition-all cursor-pointer overflow-hidden backdrop-blur-sm">
                  <Fingerprint className="relative h-12 w-12 text-brand-medium brightness-150 mb-4 group-hover:scale-110 transition-transform" />
                  <p className="relative text-sm font-bold text-white">Secure Digital Verification</p>
                  <p className="relative text-xs text-white/40 mt-1">Place your Fayda card or enter ID below</p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter 12-digit FIN or 16-character FAN"
                    value={faydaId}
                    onChange={(e) => setFaydaId(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-bold placeholder:text-white/30 text-white"
                  />
                  {error && <p className="text-red-400 text-xs font-bold ml-2">{error}</p>}
                </div>

                <button
                  onClick={handleStartScan}
                  className="w-full bg-brand-medium text-white py-4 rounded-2xl font-black shadow-lg hover:bg-brand-light hover:shadow-xl transition-all flex items-center justify-center"
                >
                  Verify Now
                </button>
              </div>
            )}

            {step === 'scanning' && (
              <div className="py-12 flex flex-col items-center animate-in fade-in duration-500">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-brand-medium/40 rounded-full animate-ping"></div>
                  <div 
                    className="absolute inset-0 rounded-full bg-cover bg-center border-4 border-brand-medium/50 shadow-xl opacity-60 animate-pulse"
                    style={{ backgroundImage: 'url("/asset/fayda-btn-bg.png")' }}
                  ></div>
                  <div className="relative bg-brand-medium rounded-full p-6 shadow-2xl">
                    <Fingerprint className="h-10 w-10 text-white animate-pulse" />
                  </div>
                </div>
                <div className="mt-10 text-center">
                  <p className="text-xl font-black text-white uppercase tracking-tight">Scanning Identity...</p>
                  <p className="text-sm text-white/60 mt-2 font-medium italic">Establishing secure channel</p>
                </div>
              </div>
            )}

            {step === 'verifying' && (
              <div className="py-12 flex flex-col items-center animate-in fade-in duration-500">
                <Loader2 className="h-16 w-16 text-brand-medium animate-spin mb-8 brightness-150" />
                <div className="text-center">
                  <p className="text-xl font-black text-white">Verifying with Fayda</p>
                  <p className="text-sm text-white/60 mt-2 font-medium">Connecting to National Gateway</p>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="bg-green-500/20 rounded-full p-6 mb-8 border border-green-500/20 backdrop-blur-xl">
                  <CheckCircle2 className="h-16 w-16 text-green-400" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-black text-white">Verified Successfully!</p>
                  <p className="text-lg font-bold text-brand-medium brightness-150">{profile?.fullName}</p>
                  <p className="text-sm text-white/40 font-medium">Redirecting to Dashboard...</p>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="py-8 flex flex-col items-center animate-in shake duration-500">
                <AlertCircle className="h-16 w-16 text-red-400 mb-6" />
                <div className="text-center">
                  <p className="text-xl font-black text-white">Verification Failed</p>
                  <p className="text-sm text-red-400 mt-2 font-bold">{error}</p>
                  <button
                    onClick={() => setStep('idle')}
                    className="mt-8 text-brand-medium brightness-150 font-black hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-center space-x-3 opacity-50">
             <img src="/asset/image.png" alt="OMMS" className="h-4 brightness-0 invert" />
             <div className="w-1 h-1 bg-white/40 rounded-full"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Protocol v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaydaModal;
