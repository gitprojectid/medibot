import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Mail, User, Shield, Stethoscope, HeartPulse, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('user_info', JSON.stringify(res.data));
        onAuthSuccess(res.data);
        onClose();
      } else {
        const res = await axios.post('/api/auth/register', {
          email,
          password,
          full_name: fullName,
          role
        });
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('user_info', JSON.stringify(res.data));
        onAuthSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">{isLogin ? 'Sign In to Healthcare AI' : 'Create New Account'}</h2>
              <p className="text-xs text-slate-400">Stored in SQLite (.db) with RBAC security</p>
            </div>
          </div>
        </div>

        {/* Quick Demo Logins */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Auto-Fill (Default Seeded Accounts):
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@healthcare.ai', 'password123')}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 flex flex-col items-center space-y-0.5 transition shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('doctor@healthcare.ai', 'password123')}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 flex flex-col items-center space-y-0.5 transition shadow-2xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Clinician</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('patient@healthcare.ai', 'password123')}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 flex flex-col items-center space-y-0.5 transition shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patient</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="mt-1 relative">
              <input
                type="email"
                required
                placeholder="name@healthcare.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="mt-1 relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-700">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              >
                <option value="patient">Patient (Health Consultation & Vitals)</option>
                <option value="clinician">Clinician (Doctor / Medical Reviewer)</option>
                <option value="admin">Administrator (System & User Management)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center pt-2 text-xs text-slate-500">
            {isLogin ? (
              <span>Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className="font-bold text-sky-600 hover:underline"
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); }}
                  className="font-bold text-sky-600 hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
