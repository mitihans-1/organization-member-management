import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { defaultPathForRole } from '../lib/roleRoutes';
import { User, Mail, Lock, Building, Briefcase, UserPlus } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization_name: '',
    organization_type: 'business',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', formData);
      login(response.data.token, response.data.user);
      navigate(defaultPathForRole(response.data.user?.role), { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
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
          This form registers you as an <span className="font-semibold text-gray-700">organization administrator</span> for your org.
          You&apos;ll be signed in and taken to the <span className="font-semibold text-gray-700">org admin dashboard</span>.
          <span className="block mt-1">Member and super-admin accounts are issued by an admin—not via this page.</span>
        </p>
        <p className="mt-4 text-center text-sm text-brand-deep font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-medium hover:text-brand-light transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl sm:rounded-[2.5rem] border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100">{error}</div>}
            
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-brand-medium/50" />
                </div>
                <input
                  name="name"
                  type="text"
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
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-12 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Organization</label>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Type</label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-brand-medium/50" />
                  </div>
                  <select
                  title='organizatin type'
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-brand-medium hover:bg-brand-light focus:outline-none transition-all disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <UserPlus className="ml-2 h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
