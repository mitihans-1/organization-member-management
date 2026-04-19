import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { defaultPathForRole } from '../lib/roleRoutes';
import { Mail, Lock, LogIn, Fingerprint } from 'lucide-react';
import FaydaModal from '../components/FaydaModal';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFaydaModalOpen, setIsFaydaModalOpen] = useState(false);
  
  // OTP States
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate(defaultPathForRole(response.data.user?.role), { replace: true });
    } catch (err: any) {
      if (err.response?.data?.requiresOtp) {
          setUnverifiedEmail(err.response.data.email);
          setStep('otp');
          // Automatically trigger resend so they get a fresh OTP
          api.post('/auth/resend-otp', { email: err.response.data.email }).catch(console.error);
      } else {
          setError(err.response?.data?.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOtpError('');

    try {
      const response = await api.post('/auth/verify-otp', {
        email: unverifiedEmail,
        otp_code: otpCode
      });
      login(response.data.token, response.data.user);
      navigate(defaultPathForRole(response.data.user?.role), { replace: true });
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/resend-otp', { email: unverifiedEmail });
      alert('A new OTP has been sent to your email.');
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleFaydaSuccess = (data: any) => {
    setIsFaydaModalOpen(false);
    login(data.token, data.user);
    navigate(defaultPathForRole(data.user?.role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-poppins">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-8">
          <img src="/asset/image.png" alt="logo" className="h-16 w-auto mx-auto" />
        </Link>
        <h2 className="text-4xl font-black text-brand-dark tracking-tight">Sign in</h2>
        <p className="mt-4 text-center text-sm text-brand-deep font-medium">
          Or{' '}
          <Link to="/register" className="font-bold text-brand-medium hover:text-brand-light transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl sm:rounded-[2rem] border border-gray-100">
          {step === 'otp' ? (
             <form className="space-y-6" onSubmit={handleVerifyOtp}>
               <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                 <p className="text-sm text-gray-500 mt-2">
                   We sent a 6-digit code to <span className="font-semibold text-gray-700">{unverifiedEmail}</span>
                 </p>
               </div>

               {otpError && (
                 <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100 text-center">
                   {otpError}
                 </div>
               )}

               <div>
                 <input
                   type="text"
                   required
                   maxLength={6}
                   value={otpCode}
                   onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                   placeholder="000000"
                   className="block w-full text-center text-3xl tracking-[0.5em] py-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-gray-800"
                 />
               </div>

               <button
                 type="submit"
                 disabled={loading || otpCode.length < 6}
                 className="w-full flex justify-center py-3.5 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-brand-medium hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-medium disabled:opacity-50 transition-all"
               >
                 {loading ? 'Verifying...' : 'Verify Account'}
               </button>

               <div className="text-center">
                 <button
                   type="button"
                   onClick={handleResendOtp}
                   disabled={resendLoading}
                   className="text-sm text-brand-medium font-bold hover:text-brand-light transition-colors disabled:opacity-50"
                 >
                   {resendLoading ? 'Sending...' : 'Resend Code'}
                 </button>
               </div>
             </form>
          ) : (
          <>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100">{error}</div>}
            <div className="space-y-2">
              <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Email address</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-brand-medium/50" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 py-4 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Password</label>
                <div className="text-xs">
                  <Link to="/forgot-password" title="Reset password" className="font-bold text-brand-medium hover:text-brand-light">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-medium/50" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 py-4 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-brand-medium hover:bg-brand-light focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <LogIn className="ml-2 h-5 w-5" />}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-brand-deep/40 font-bold uppercase tracking-widest text-[10px]">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse: CredentialResponse) => {
                    setLoading(true);
                    setError('');
                    try {
                      const response = await api.post('/auth/google-login', {
                        token: credentialResponse.credential,
                      });
                      login(response.data.token, response.data.user);
                      navigate(defaultPathForRole(response.data.user?.role), { replace: true });
                    } catch (err: any) {
                      if (err.response?.status === 404) {
                        navigate('/register');
                      } else {
                        setError(err.response?.data?.message || 'Google validation failed');
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => setError('Google sign-in failed')}
                  useOneTap
                />
              </div>

              <button
                type="button"
                onClick={() => setIsFaydaModalOpen(true)}
                className="group relative w-full h-16 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Background Image with Overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: 'url("/asset/fayda-btn-bg.png")' }}
                ></div>
                <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-[2px] transition-colors group-hover:bg-brand-dark/40"></div>
                
                {/* Button Content */}
                <div className="relative flex items-center justify-center h-full text-white">
                  <Fingerprint className="mr-3 h-6 w-6 text-brand-medium brightness-150" />
                  <span className="font-black text-lg tracking-wide uppercase">Sign in with Fayda ID</span>
                </div>
              </button>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      <FaydaModal 
        isOpen={isFaydaModalOpen} 
        onClose={() => setIsFaydaModalOpen(false)} 
        onSuccess={handleFaydaSuccess}
      />
    </div>
  );
};

export default Login;
