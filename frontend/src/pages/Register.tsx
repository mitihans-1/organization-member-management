import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { defaultPathForRole } from '../lib/roleRoutes';
import { User, Mail, Lock, Building, Briefcase, UserPlus, Users } from 'lucide-react';

type RegisterRole = 'orgAdmin' | 'member';

type OrgOption = { id: string; name: string };

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'orgAdmin' as RegisterRole,
    organization_name: '',
    organization_type: 'business',
    organization_id: '',
  });
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.role !== 'member') return;
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
  }, [formData.role]);

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
      role: formData.role,
    };

    if (formData.role === 'orgAdmin') {
      payload.organization_name = formData.organization_name;
      payload.organization_type = formData.organization_type;
    } else {
      payload.organization_id = formData.organization_id;
    }

    try {
      const response = await api.post('/auth/register', payload);
      login(response.data.token, response.data.user);
      navigate(defaultPathForRole(response.data.user?.role), { replace: true });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const isOrganAdmin = formData.role === 'orgAdmin';

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
          one. SuperAdmin accounts are created manually—not through this page.
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
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                Register as
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-brand-medium/50" />
                </div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium text-sm appearance-none"
                >
                  <option value="orgAdmin">Organization Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>

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

            {isOrganAdmin && (
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

            {!isOrganAdmin && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">
                  Select Organization
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-brand-medium/50" />
                  </div>
                  <select
                    name="organization_id"
                    required
                    value={formData.organization_id}
                    onChange={handleChange}
                    disabled={orgsLoading}
                    className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-50 bg-gray-50 rounded-2xl focus:border-brand-medium focus:ring-0 transition-all font-medium text-sm appearance-none disabled:opacity-60"
                  >
                    <option value="">
                      {orgsLoading ? 'Loading organizations…' : 'Choose an organization'}
                    </option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!orgsLoading && orgs.length === 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    No organizations are available yet. An organization admin must register first.
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || (!isOrganAdmin && orgs.length === 0 && !orgsLoading)}
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
