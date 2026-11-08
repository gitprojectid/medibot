import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, AlertTriangle, PhoneCall, ShieldCheck, BookOpen, User, Bot, 
  Stethoscope, Globe, Download, RefreshCw, ChevronRight, Activity, 
  ArrowUpRight, Copy, Check, Sparkles, HeartPulse, Pill, Zap, AlertCircle,
  ThumbsUp, ThumbsDown, TrendingUp, Cpu, Plus, MessageSquare, Trash2, 
  Clock, PanelLeftClose, PanelLeftOpen, Shield
} from 'lucide-react';

const TRIAGE_CONFIG = {
  0: { label: 'Level 0 • Informational', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  1: { label: 'Level 1 • Low Concern', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  2: { label: 'Level 2 • Needs Evaluation', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  3: { label: 'Level 3 • Urgent Care', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  4: { label: 'Level 4 • Emergency', bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' }
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
];

const HEALTH_PROMPT_PRESETS = [
  { icon: '❤️', label: 'Chest Pressure', prompt: 'I have severe crushing chest pressure radiating to my left arm with cold sweat.' },
  { icon: '🤒', label: 'High Fever & Cough', prompt: 'I have a high fever of 102°F and a productive cough since yesterday.' },
  { icon: '💊', label: 'Drug Interaction Check', prompt: 'Can I take aspirin safely while taking warfarin daily?' },
  { icon: '🫁', label: 'Shortness of Breath', prompt: 'I am experiencing shortness of breath after minor exertion.' },
  { icon: '🤕', label: 'Sudden Weakness / Speech', prompt: 'My family member has sudden facial drooping and slurred speech.' },
  { icon: '🩺', label: 'Blood Pressure Guidelines', prompt: 'What are the official AHA guidelines and thresholds for Stage 2 hypertension?' }
];

export default function ChatInterface({ currentUser, patientContext, activeModel = 'qwen2.5-coder:3b' }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your **Healthcare AI Clinical Assistant** powered by Supervised Machine Learning (ML) risk stratification and Reinforcement Learning (RLCF) policy optimization.\n\nI can help explore symptoms, check drug-drug interactions, and provide in-depth clinical guidelines. How can I assist you today?",
      triage_level: 0,
      is_emergency: false,
      ml_risk_score: 0.05,
      rl_action: 'COMPREHENSIVE_GUIDELINES',
      symptoms: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggested_follow_ups: [
        "What are the clinical guidelines for borderline hypertension?",
        "I have abdominal pain on my lower right side with fever",
        "Can I take ibuprofen if I have asthma?"
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [escalationStatus, setEscalationStatus] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/chat/conversations');
      setSessions(res.data || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (activeSessionId === sessionId) return;
    setActiveSessionId(sessionId);
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/chat/conversations/${sessionId}`);
      const data = res.data;
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([
          {
            id: 'welcome-' + sessionId,
            role: 'assistant',
            content: `**Consultation Session**: ${data.title}\n\nYou can continue asking medical questions or updating symptoms for this session.`,
            triage_level: 0,
            is_emergency: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Error loading session history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const res = await axios.post('/api/chat/conversations');
      const newSession = res.data;
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([
        {
          id: 'welcome-' + newSession.id,
          role: 'assistant',
          content: "Started a new **Health Consultation Session**.\n\nDescribe your symptoms, query clinical guidelines, or check medication safety.",
          triage_level: 0,
          is_emergency: false,
          ml_risk_score: 0.05,
          rl_action: 'COMPREHENSIVE_GUIDELINES',
          symptoms: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggested_follow_ups: [
            "Explain the difference between Stage 1 and Stage 2 hypertension",
            "I have chest tightness and cold sweat",
            "Can I take aspirin with warfarin?"
          ]
        }
      ]);
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat session history from the database?")) return;
    try {
      await axios.delete(`/api/chat/conversations/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: "Session deleted. Click **+ New Session** or select a previous chat from the sidebar to continue.",
            triage_level: 0,
            is_emergency: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId, isPositive, triageLevel, rlAction) => {
    try {
      await axios.post('/api/admin/ml-rl/feedback', {
        is_positive: isPositive,
        conversation_id: activeSessionId,
        triage_level: triageLevel,
        action: rlAction,
        comment: isPositive ? 'Patient / Clinician upvoted AI clinical response' : 'User flagged response'
      });
      setFeedbackState(prev => ({ ...prev, [msgId]: isPositive ? 'up' : 'down' }));
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleSend = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text || !text.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        conversation_id: activeSessionId,
        message: text.trim(),
        language: language,
        patient_context: patientContext
      };

      const res = await axios.post('/api/chat', payload);
      const data = res.data;

      if (!activeSessionId && data.conversation_id) {
        setActiveSessionId(data.conversation_id);
      }

      const botMsg = {
        id: data.message_id || (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        triage_level: data.triage_level,
        triage_label: data.triage_label,
        is_emergency: data.is_emergency,
        emergency_details: data.emergency_details,
        symptoms: data.structured_symptoms || [],
        differential: data.differential_considerations || [],
        missing_info: data.missing_information || [],
        suggested_follow_ups: data.suggested_follow_ups || [],
        medication_alerts: data.medication_alerts || [],
        escalation_offered: data.escalation_offered,
        evidence_grounding: data.evidence_grounding,
        ml_risk_score: data.ml_risk_score,
        ml_predicted_triage: data.ml_predicted_triage,
        rl_action: data.rl_action,
        rl_expected_q: data.rl_expected_q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      fetchSessions(); // Refresh sidebar session list
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "⚠️ **System Communication Warning**: A connection error occurred with the AI service. If you are experiencing a life-threatening medical emergency, please call **911** or visit an emergency room immediately.",
        triage_level: 0,
        is_emergency: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalateToClinician = async () => {
    if (!activeSessionId) return;
    try {
      await axios.post(`/api/escalation/trigger/${activeSessionId}`);
      setEscalationStatus('Supervisory Physician consultation requested. A clinician will review your case.');
    } catch (err) {
      setEscalationStatus('Consultation request sent to supervisor triage queue.');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto flex h-[calc(100vh-8.5rem)] min-h-[600px] bg-white rounded-3xl shadow-card border border-slate-200 overflow-hidden">
      
      {/* SIDEBAR: Session-Based Chat History (Left Drawer) */}
      <div className={`${sidebarOpen ? 'w-72 md:w-80' : 'w-0'} bg-slate-900 text-white transition-all duration-300 flex flex-col border-r border-slate-800 shrink-0 overflow-hidden`}>
        
        {/* Sidebar Header: New Session Button */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              <span>Chat Sessions ({sessions.length})</span>
            </span>
            <button
              onClick={fetchSessions}
              className="text-slate-400 hover:text-white p-1 rounded transition"
              title="Refresh Sessions"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCreateNewSession}
            className="w-full py-2.5 px-3.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/50">
          {sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`p-3 rounded-2xl cursor-pointer transition group flex items-start justify-between space-x-2 ${
                  isActive 
                    ? 'bg-teal-500/20 border border-teal-500/40 text-white' 
                    : 'hover:bg-slate-800/80 text-slate-300 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    {session.is_emergency ? (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-teal-400' : 'bg-slate-600'}`} />
                    )}
                    <span className="text-xs font-bold truncate block">{session.title}</span>
                  </div>

                  {session.last_message && (
                    <p className="text-[11px] text-slate-400 truncate leading-relaxed">{session.last_message}</p>
                  )}

                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-0.5 font-mono">
                    <span>{session.message_count || 0} messages</span>
                    <span>•</span>
                    <span>{session.updated_at ? new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition shrink-0"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <Clock className="w-6 h-6 mx-auto text-slate-600" />
              <p>No saved sessions yet.</p>
              <p className="text-[10px]">Start chatting to automatically save your session history in SQLite.</p>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 truncate">
            <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="truncate">{currentUser?.full_name || 'Patient'} ({currentUser?.role || 'Guest'})</span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-teal-300">SQLite DB</span>
        </div>

      </div>

      {/* MAIN CHAT AREA (Right Container) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Top Header Bar */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
              title={sidebarOpen ? "Collapse Session Sidebar" : "Expand Session Sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold text-white tracking-tight">Clinical Healthcare AI</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  <span>Session Active</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Model: <strong className="text-teal-300 font-mono">{activeModel}</strong> • Stored in <code className="text-slate-300 font-mono">healthcare_ai.db</code>
              </p>
            </div>
          </div>

          {/* Right Tools */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer font-medium"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportPDF}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Export Consultation Record"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleCreateNewSession}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="New Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Escalation Notification Banner */}
        {escalationStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-900 font-semibold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{escalationStatus}</span>
            </div>
            <button onClick={() => setEscalationStatus(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
          </div>
        )}

        {/* Main Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const triage = TRIAGE_CONFIG[m.triage_level || 0] || TRIAGE_CONFIG[0];
            const feedback = feedbackState[m.id];

            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}>
                
                {/* Message Header */}
                <div className="flex items-center space-x-2 px-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isUser ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white shadow-2xs'
                  }`}>
                    {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    {isUser ? (currentUser?.full_name || 'Patient') : 'Clinical AI Assistant'}
                  </span>
                </div>

                {/* Message Body Container */}
                <div className="max-w-3xl space-y-2.5">
                  
                  {/* Emergency Red Banner */}
                  {m.is_emergency && (
                    <div className="bg-red-500 text-white p-4 rounded-2xl shadow-md border border-red-600 space-y-2 animate-in fade-in">
                      <div className="flex items-center space-x-2 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
                        <span>CRITICAL RED-FLAG EMERGENCY DETECTED</span>
                      </div>
                      <p className="text-xs text-red-50 leading-relaxed font-medium">
                        Call <strong>911</strong> or <strong>988</strong> immediately. Emergency protocol has been engaged.
                      </p>
                    </div>
                  )}

                  {/* Main Bubble Content */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-teal-600 text-white rounded-tr-none shadow-sm' 
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-card'
                  }`}>
                    <div className="whitespace-pre-wrap font-normal leading-relaxed text-xs">
                      {m.content}
                    </div>

                    {/* Assistant Message Footer Tag */}
                    {!isUser && m.triage_level !== undefined && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        
                        {/* Left: Triage & ML/RL Badges */}
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${triage.bg} ${triage.text} ${triage.border}`}>
                            {triage.label}
                          </span>

                          {m.ml_risk_score !== undefined && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                              ML Risk: {Math.round(m.ml_risk_score * 100)}%
                            </span>
                          )}

                          {m.rl_action && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                              RL: {m.rl_action}
                            </span>
                          )}
                        </div>
                        
                        {/* Right: Copy & RL Feedback Buttons */}
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <button
                            onClick={() => handleFeedback(m.id, true, m.triage_level, m.rl_action)}
                            className={`p-1 rounded transition ${feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'hover:text-slate-700'}`}
                            title="RL Reward (+3.0): Helpful clinical guidance"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(m.id, false, m.triage_level, m.rl_action)}
                            className={`p-1 rounded transition ${feedback === 'down' ? 'text-red-600 bg-red-50' : 'hover:text-slate-700'}`}
                            title="RL Penalty (-6.0): Needs clinical adjustment"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[10px] text-slate-300 pl-1">|</span>
                          <button
                            onClick={() => handleCopy(m.id, m.content)}
                            className="hover:text-slate-700 p-1 rounded transition"
                            title="Copy response"
                          >
                            {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extracted Clinical Symptoms Chips */}
                  {m.symptoms && m.symptoms.length > 0 && (
                    <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="font-bold text-sky-900 flex items-center space-x-1.5 text-[11px]">
                        <Activity className="w-3.5 h-3.5 text-sky-600" />
                        <span>Identified Symptoms & Features:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.symptoms.map((s, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 bg-white border border-sky-200 rounded-md text-sky-800 font-semibold text-[11px]">
                            {s.name} {s.severity && `(Score: ${s.severity}/10)`} {s.onset && `• ${s.onset}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up question suggestion pills */}
                  {m.suggested_follow_ups && m.suggested_follow_ups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggested_follow_ups.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="text-[11px] bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs transition text-left flex items-center space-x-1"
                        >
                          <span>💬</span>
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Clinician Escalation Offer Button */}
                  {m.escalation_offered && (
                    <div className="pt-1">
                      <button
                        onClick={handleEscalateToClinician}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                        <span>Request Supervisory Physician Review</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-2 animate-in fade-in">
              <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">
                <Bot className="w-3 h-3" />
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-card text-xs text-slate-500 flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="font-medium text-slate-600">
                  Executing ML Risk Scoring & Clinical Guidelines Inference on <strong className="font-mono text-teal-700">{activeModel}</strong>...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Clinical Presets Strip */}
        <div className="px-6 py-2 bg-slate-100 border-t border-slate-200/80 flex items-center space-x-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            <span>Quick Prompts:</span>
          </span>
          {HEALTH_PROMPT_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p.prompt)}
              className="text-[11px] bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 shrink-0 font-medium transition shadow-2xs flex items-center space-x-1"
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-3"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Describe symptoms, query medical guidelines, or check medication interactions..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition text-slate-800 font-medium placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-2xl shadow-md transition shrink-0 flex items-center justify-center"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
            Healthcare AI Safety Platform • Session Persisted in SQLite • In emergencies call <strong>911</strong> or <strong>988</strong>
          </p>
        </div>

      </div>

    </div>
  );
}
