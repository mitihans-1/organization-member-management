import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { defaultPathForRole } from '../lib/roleRoutes';
import { User, Mail, Lock, Building, Briefcase, UserPlus, Users, Search, X } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

type RegisterRole = 'orgAdmin' | 'member';

type OrgOption = { id: string; name: string };

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramOrg = searchParams.get('org');

  const [activeTab, setActiveTab] = useState<RegisterRole>(paramOrg ? 'member' : 'orgAdmin');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization_name: '',
    organization_type: 'business',
    organization_id: paramOrg || '',
  });
  
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP States
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab !== 'member') return;
    let cancelled = false;
    setOrgsLoading(true);
    api
      .get<OrgOption[]>('/organizations')
      .then((res) => {
        if (!cancelled) setOrgs(res.data);
      })
      .catch(() => {
        if (!cancelled) setOrgs([]);
      })
      .finally(() => {
        if (!cancelled) setOrgsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Filter organizations based on search term
  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: Record<string, unknown> = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: activeTab,
    };

    if (activeTab === 'orgAdmin') {
      payload.organization_name = formData.organization_name;
      payload.organization_type = formData.organization_type;
    } else {
      payload.organization_id = formData.organization_id;
    }

    try {
      const response = await api.post('/auth/register', payload);

      if (response.data.requiresOtp) {
        setRegisteredEmail(response.data.email);
        setStep('otp');
      } else {
        // Fallback if OTP is disabled
        login(response.data.token, response.data.user);
        navigate(defaultPathForRole(response.data.user?.role), { replace: true });
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to register';
      setError(message);
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
        email: registeredEmail,
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
      await api.post('/auth/resend-otp', { email: registeredEmail });
      alert('A new OTP has been sent to your email.');
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-poppins">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-8">
          <img src="/asset/image.png" alt="logo" className="h-16 w-auto mx-auto" />
        </Link>
        <h2 className="text-4xl font-black text-brand-dark tracking-tight">Join OMMS</h2>
        <p className="mt-3 text-center text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Register as an <span className="font-semibold text-gray-700">organization administrator</span> to create
          your organization, or as a <span className="font-semibold text-gray-700">member</span> to join an existing
          one.
        </p>

      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl sm:rounded-[2.5rem] border border-gray-100">

          {step === 'otp' ? (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Check your email</h3>
                <p className="text-sm text-gray-500 mt-2">
                  We sent a 6-digit code to <span className="font-semibold text-gray-700">{registeredEmail}</span>
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
                className="w-full flex justify-center py-3.5 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-sm text-indigo-600 font-bold hover:text-indigo-500 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('member')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                    activeTab === 'member'
                      ? 'bg-white text-brand-medium shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    Member
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('orgAdmin')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                    activeTab === 'orgAdmin'
                      ? 'bg-white text-brand-medium shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building className="w-4 h-4" />
                    Organization
                  </div>
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-brand-medium/50" />
                    </div>
                    <input
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-12 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Email address</label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brand-medium/50" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-12 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Password</label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-brand-medium/50" />
                    </div>
                    <input
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-12 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Organization Admin Form */}
                {activeTab === 'orgAdmin' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                        Organization name
                      </label>
                      <div className="relative rounded-2xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building className="h-5 w-5 text-brand-medium/50" />
                        </div>
                        <input
                          name="organization_name"
                          type="text"
                          required
                          value={formData.organization_name}
                          onChange={handleChange}
                          className="block w-full pl-12 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium text-sm"
                          placeholder="Company Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                        Organization type
                      </label>
                      <div className="relative rounded-2xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Briefcase className="h-5 w-5 text-brand-medium/50" />
                        </div>
                        <select
                          title="Organization type"
                          name="organization_type"
                          value={formData.organization_type}
                          onChange={handleChange}
                          className="block w-full pl-12 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium text-sm appearance-none"
                        >
                          <option value="business">Business</option>
                          <option value="nonprofit">Non-Profit</option>
                          <option value="government">Government</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Member Registration - Organization Selection */}
                {activeTab === 'member' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                      Select Organization
                    </label>
                    
                    {/* Search Input */}
                    <div className="relative rounded-2xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 bg-white rounded-2xl focus:border-brand-medium focus:ring-0 transition-all text-sm"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Organization List */}
                    <div className="max-h-60 overflow-y-auto border-2 border-gray-100 rounded-2xl">
                      {orgsLoading ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                          Loading organizations…
                        </div>
                      ) : filteredOrgs.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-500">
                          {searchTerm ? 'No organizations found' : 'No organizations available yet'}
                        </div>
                      ) : (
                        filteredOrgs.map((org) => (
                          <div
                            key={org.id}
                            onClick={() => setFormData(prev => ({ ...prev, organization_id: org.id }))}
                            className={`p-4 cursor-pointer transition-all border-b last:border-0 hover:bg-gray-50 ${
                              formData.organization_id === org.id
                                ? 'bg-brand-medium/10 border-l-4 border-brand-medium'
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                formData.organization_id === org.id
                                  ? 'bg-brand-medium'
                                  : 'bg-gray-300'
                              }`} />
                              <span className="text-sm font-medium text-gray-800">
                                {org.name}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || (activeTab === 'member' && !formData.organization_id)}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-brand-medium hover:bg-brand-light focus:outline-none transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                    {!loading && <UserPlus className="ml-2 h-5 w-5" />}
                  </button>
                  <p className="mt-4 text-center text-sm text-brand-deep font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-brand-medium hover:text-brand-light transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-brand-deep/40 font-bold uppercase tracking-widest text-[10px]">Or register with</span>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse: CredentialResponse) => {
                  setLoading(true);
                  setError('');
                  try {
                    const response = await api.post('/auth/google-register', {
                      token: credentialResponse.credential,
                      role: activeTab,
                      organization_name: formData.organization_name,
                      organization_type: formData.organization_type,
                      organization_id: formData.organization_id,
                    });
                    login(response.data.token, response.data.user);
                    navigate(defaultPathForRole(response.data.user?.role), { replace: true });
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Google registration failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => setError('Google sign-up failed')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
