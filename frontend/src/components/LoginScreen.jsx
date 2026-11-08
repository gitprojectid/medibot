import React, { useState } from 'react';
import axios from 'axios';
import { 
  HeartPulse, Shield, Stethoscope, User, Lock, Mail, 
  ArrowRight, AlertCircle, CheckCircle, Sparkles 
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', { email, password });
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('user_info', JSON.stringify(res.data));
        onLoginSuccess(res.data);
      } else {
        const res = await axios.post('/api/auth/register', {
          email,
          password,
          full_name: fullName,
          role
        });
        localStorage.setItem('auth_token', res.data.access_token);
        localStorage.setItem('user_info', JSON.stringify(res.data));
        onLoginSuccess(res.data);
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 text-center relative">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-500 to-sky-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-3">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Healthcare AI Assistant</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Safety-First Clinical AI Platform with Local Ollama & Role-Based Access Control
          </p>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-[11px] font-medium text-sky-300 mt-4 border border-white/10">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>SQLite SQL Database • RBAC Protected</span>
          </div>
        </div>

        {/* 1-Click Quick Demo Accounts */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Quick Login by Role:</span>
            <span className="text-[10px] text-sky-600 lowercase font-mono">1-click auto-fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@healthcare.ai', 'password123')}
              className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center space-y-1 shadow-2xs ${
                email === 'admin@healthcare.ai' 
                  ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/20' 
                  : 'bg-white border-slate-200 hover:border-amber-300 text-slate-700'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Admin</span>
              <span className="text-[10px] text-slate-400 font-normal">Full Control</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('doctor@healthcare.ai', 'password123')}
              className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center space-y-1 shadow-2xs ${
                email === 'doctor@healthcare.ai' 
                  ? 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-400/20' 
                  : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>Clinician</span>
              <span className="text-[10px] text-slate-400 font-normal">Doctor Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('patient@healthcare.ai', 'password123')}
              className={`p-2 rounded-xl text-xs font-bold border transition flex flex-col items-center space-y-1 shadow-2xs ${
                email === 'patient@healthcare.ai' 
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400/20' 
                  : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Patient</span>
              <span className="text-[10px] text-slate-400 font-normal">AI Consultation</span>
            </button>
          </div>
        </div>

        {/* Login / Register Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none font-medium"
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs font-bold text-slate-700">Account Access Level</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              >
                <option value="patient">Patient (Consultation, Vitals & Medication Checking)</option>
                <option value="clinician">Clinician (Doctor Escalation Queue & Scribe)</option>
                <option value="admin">Administrator (User Management & Telemetry)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : (isLogin ? 'Sign In & Launch Workspace' : 'Create Account & Sign In')}</span>
            <ArrowRight className="w-4 h-4 text-sky-400" />
          </button>

          <div className="text-center pt-2 text-xs text-slate-500">
            {isLogin ? (
              <span>New patient or doctor?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); }}
                  className="font-bold text-sky-600 hover:underline"
                >
                  Create account
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
