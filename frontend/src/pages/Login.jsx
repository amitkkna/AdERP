import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdViewQuilt, MdEmail, MdLock } from 'react-icons/md';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-gradient-to-br from-primary-600 via-primary-700 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <MdViewQuilt className="text-2xl text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AdERP</span>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Manage your billboard empire with ease
          </h2>
          <p className="text-primary-200 text-base leading-relaxed">
            Complete ERP solution for billboard, unipole, and hoarding management across Chhattisgarh. Track assets, bookings, invoices, and revenue in one place.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { value: '500+', label: 'Assets Managed' },
              { value: '150+', label: 'Active Clients' },
              { value: '98%', label: 'Occupancy Rate' },
              { value: '8', label: 'Cities Covered' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.08] backdrop-blur-sm rounded-xl p-3">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-primary-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-300/50 relative">Chhattisgarh Outdoor Advertising Solutions</p>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <MdViewQuilt className="text-2xl text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">AdERP</span>
            </div>
            <p className="text-sm text-gray-500">Billboard & Unipole Management</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Email Address</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 h-11"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Create one
            </Link>
          </p>

          <div className="mt-8 p-3 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-xs text-primary-700 font-medium text-center">
              Demo: admin@advertiserp.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
