import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdViewQuilt, MdPerson, MdEmail, MdLock, MdPhone } from 'react-icons/md';

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <MdViewQuilt className="text-2xl text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">AdERP</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1">Get started with billboard management</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label-field">Email</label>
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
              <label className="label-field">Phone</label>
              <div className="relative">
                <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  className="input-field pl-10"
                  placeholder="Enter your phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
