import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, User, Pill, Stethoscope, Shield, HeartPulse, 
  Activity, AlertTriangle, CheckCircle, Lock, LogOut, Database,
  Building2, FileText, ShieldCheck, Scan, Globe, Users, Sliders,
  Bell, ClipboardList, FileCheck, BadgeDollarSign, Calculator, Flame, Server, Brain,
  ChevronRight, Sparkles, Menu, X
} from 'lucide-react';

import ChatInterface from './components/ChatInterface';
import PatientProfile from './components/PatientProfile';
import MedicationChecker from './components/MedicationChecker';
import ClinicianDashboard from './components/ClinicianDashboard';
import DoctorCopilot from './components/DoctorCopilot';
import NurseCopilot from './components/NurseCopilot';
import HospitalCommandCenter from './components/HospitalCommandCenter';
import DocumentAI from './components/DocumentAI';
import GovernanceDashboard from './components/GovernanceDashboard';
import RadiologyViewer from './components/RadiologyViewer';
import VoiceTranslator from './components/VoiceTranslator';
import ResearchCohortExplorer from './components/ResearchCohortExplorer';
import AdaptiveSettings from './components/AdaptiveSettings';
import ClinicalAlertsCenter from './components/ClinicalAlertsCenter';
import ClinicalOrdersHub from './components/ClinicalOrdersHub';
import DischargePlanner from './components/DischargePlanner';
import BillingCodingHub from './components/BillingCodingHub';
import ClinicalPharmacyCalculator from './components/ClinicalPharmacyCalculator';
import RapidResponseHub from './components/RapidResponseHub';
import SystemDeploymentHub from './components/SystemDeploymentHub';
import MLModelStudio from './components/MLModelStudio';
import AdminDashboard from './components/AdminDashboard';
import LoginScreen from './components/LoginScreen';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user_info');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null; // Shows LoginScreen if not authenticated
  });

  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [patientContext, setPatientContext] = useState({
    age: 45,
    sex: 'female',
    is_pregnant: false,
    conditions: ['Hypertension', 'Mild Asthma'],
    medications: ['Lisinopril'],
    allergies: ['Penicillin']
  });

  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [activeModel, setActiveModel] = useState('qwen2.5-coder:3b');
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Check Ollama status & Alert counter
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get('/api/admin/ollama/status');
        if (res.data.status === 'connected') {
          setOllamaConnected(true);
          setActiveModel(res.data.active_model);
        } else {
          setOllamaConnected(false);
        }
      } catch (e) {
        setOllamaConnected(false);
      }

      // Check unacknowledged alerts count
      try {
        const alertsRes = await axios.get('/api/alerts/active');
        const unack = (alertsRes.data || []).filter(a => !a.is_acknowledged).length;
        setActiveAlertsCount(unack);
      } catch (e) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userInfo) => {
    setCurrentUser(userInfo);
    if (userInfo.role === 'admin') setActiveTab('admin');
    else if (userInfo.role === 'clinician') setActiveTab('doctor');
    else setActiveTab('chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setCurrentUser(null);
    setActiveTab('chat');
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const role = currentUser.role || 'patient';
  const roleBadges = {
    admin: { label: 'Administrator', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    clinician: { label: 'Attending MD / Clinician', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    patient: { label: 'Patient', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  const currentBadge = roleBadges[role] || roleBadges.patient;

  // Sidebar navigation menu items grouped into logical hospital sections
  const navSections = [
    {
      title: "Clinical Care",
      items: [
        { id: 'chat', label: 'Patient AI Chat', icon: MessageSquare, show: true, color: 'text-teal-400' },
        { id: 'doctor', label: 'Doctor Copilot', icon: Stethoscope, show: role === 'clinician' || role === 'admin', color: 'text-indigo-400' },
        { id: 'nurse', label: 'Nurse Copilot', icon: HeartPulse, show: role === 'clinician' || role === 'admin', color: 'text-pink-400' },
        { id: 'rapid_response', label: 'Code & Rapid Response', icon: Flame, show: role === 'clinician' || role === 'admin', color: 'text-red-400', badge: 'ACLS' },
        { id: 'alerts', label: 'Clinical Alerts Hub', icon: Bell, show: role === 'clinician' || role === 'admin', color: 'text-amber-400', count: activeAlertsCount }
      ]
    },
    {
      title: "Orders & Pharmacotherapy",
      items: [
        { id: 'orders', label: 'CPOE Rapid Orders', icon: ClipboardList, show: role === 'clinician' || role === 'admin', color: 'text-teal-400' },
        { id: 'pharmacy', label: 'Renal & IV Dosing', icon: Calculator, show: role === 'clinician' || role === 'admin', color: 'text-indigo-400' },
        { id: 'medications', label: 'Medicine Safety', icon: Pill, show: true, color: 'text-emerald-400' },
        { id: 'discharge', label: 'Discharge AI Planner', icon: FileCheck, show: role === 'clinician' || role === 'admin', color: 'text-indigo-400' },
        { id: 'billing', label: 'ICD-10 & DRG Billing', icon: BadgeDollarSign, show: role === 'clinician' || role === 'admin', color: 'text-emerald-400' }
      ]
    },
    {
      title: "Diagnostics & AI Hub",
      items: [
        { id: 'radiology', label: 'Imaging & PACS', icon: Scan, show: role === 'clinician' || role === 'admin', color: 'text-indigo-400' },
        { id: 'voice', label: 'Voice & Language', icon: Globe, show: true, color: 'text-teal-400' },
        { id: 'documents', label: 'Document AI', icon: FileText, show: true, color: 'text-indigo-400' },
        { id: 'ml_studio', label: 'ML & RL Studio', icon: Brain, show: role === 'clinician' || role === 'admin', color: 'text-purple-400', badge: 'XAI' }
      ]
    },
    {
      title: "Operations & Research",
      items: [
        { id: 'operations', label: 'Hospital Operations', icon: Building2, show: role === 'clinician' || role === 'admin', color: 'text-sky-400' },
        { id: 'research', label: 'Research Trials', icon: Users, show: role === 'clinician' || role === 'admin', color: 'text-indigo-400' }
      ]
    },
    {
      title: "Governance & Administration",
      items: [
        { id: 'deployment', label: 'Deploy & DB Backup', icon: Server, show: role === 'admin', color: 'text-teal-400' },
        { id: 'governance', label: 'AI Governance', icon: ShieldCheck, show: true, color: 'text-red-400' },
        { id: 'adaptive', label: 'System Config', icon: Sliders, show: role === 'admin', color: 'text-indigo-400' },
        { id: 'admin', label: 'Admin & ML Hub', icon: Shield, show: role === 'admin', color: 'text-amber-400' }
      ]
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen w-screen flex bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* ================= LEFT SIDEBAR NAVIGATION ================= */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Top Header Logo */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-xl flex items-center justify-center shadow-inner">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">Metro Health AI</span>
                <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[9px] font-mono font-bold rounded">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Academic Medical Center</p>
            </div>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navSections.map((sec, si) => {
            const visibleItems = sec.items.filter(item => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={si} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  {sec.title}
                </div>

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition
                          ${isActive 
                            ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs font-bold' 
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
                        `}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : item.color}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.count !== undefined && item.count > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-mono font-bold animate-pulse">
                            {item.count}
                          </span>
                        )}

                        {item.badge && (
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-mono font-bold">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Sidebar User Profile & Ollama Status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5">
          {/* Ollama Status Pill */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px]">
            <div className="flex items-center space-x-1.5 truncate">
              <div className={`w-2 h-2 rounded-full ${ollamaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-mono truncate">{activeModel}</span>
            </div>
            <span className={`font-bold ${ollamaConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {ollamaConnected ? 'READY' : 'OFFLINE'}
            </span>
          </div>

          {/* User Profile Bar */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {currentUser.full_name?.charAt(0) || 'U'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-slate-100 truncate">
                  {currentUser.full_name}
                </div>
                <div className={`text-[9px] font-mono px-1.5 py-0.2 rounded border inline-block ${currentBadge.bg}`}>
                  {currentBadge.label}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900">
        
        {/* Top Minimal Workspace Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <span className="text-slate-400">Workspace /</span>
              <span className="text-slate-900 capitalize font-extrabold">{activeTab.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] font-medium">
              <Lock className="w-3 h-3 text-teal-600" />
              <span>HIPAA Compliant • Active Session</span>
            </div>

            {activeAlertsCount > 0 && (
              <button
                onClick={() => setActiveTab('alerts')}
                className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center space-x-1 animate-bounce"
              >
                <Bell className="w-3.5 h-3.5 text-red-500" />
                <span>{activeAlertsCount} Alerts</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Scrollable View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'chat' && (
            <ChatInterface currentUser={currentUser} patientContext={patientContext} activeModel={activeModel} />
          )}
          {activeTab === 'doctor' && (
            <DoctorCopilot currentUser={currentUser} />
          )}
          {activeTab === 'rapid_response' && (
            <RapidResponseHub currentUser={currentUser} />
          )}
          {activeTab === 'alerts' && (
            <ClinicalAlertsCenter currentUser={currentUser} />
          )}
          {activeTab === 'orders' && (
            <ClinicalOrdersHub currentUser={currentUser} />
          )}
          {activeTab === 'pharmacy' && (
            <ClinicalPharmacyCalculator />
          )}
          {activeTab === 'discharge' && (
            <DischargePlanner currentUser={currentUser} />
          )}
          {activeTab === 'billing' && (
            <BillingCodingHub />
          )}
          {activeTab === 'ml_studio' && (
            <MLModelStudio />
          )}
          {activeTab === 'nurse' && (
            <NurseCopilot currentUser={currentUser} />
          )}
          {activeTab === 'medications' && (
            <MedicationChecker patientContext={patientContext} />
          )}
          {activeTab === 'radiology' && (
            <RadiologyViewer currentUser={currentUser} />
          )}
          {activeTab === 'voice' && (
            <VoiceTranslator />
          )}
          {activeTab === 'operations' && (
            <HospitalCommandCenter />
          )}
          {activeTab === 'research' && (
            <ResearchCohortExplorer />
          )}
          {activeTab === 'documents' && (
            <DocumentAI />
          )}
          {activeTab === 'deployment' && role === 'admin' && (
            <SystemDeploymentHub />
          )}
          {activeTab === 'governance' && (
            <GovernanceDashboard />
          )}
          {activeTab === 'adaptive' && role === 'admin' && (
            <AdaptiveSettings />
          )}
          {activeTab === 'admin' && role === 'admin' && (
            <AdminDashboard currentUser={currentUser} onModelChanged={(m) => setActiveModel(m)} />
          )}
        </main>

      </div>

    </div>
  );
}
