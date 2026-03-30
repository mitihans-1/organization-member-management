import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { defaultPathForRole } from '../lib/roleRoutes';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError(err.response?.data?.message || 'Failed to login');
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
        </div>
      </div>
    </div>
  );
};

export default Login;
