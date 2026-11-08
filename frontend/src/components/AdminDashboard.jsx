import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Server, Activity, AlertTriangle, Users, MessageSquare, 
  Database, RefreshCw, UserPlus, Trash2, CheckCircle, Lock, Mail, 
  Cpu, Sparkles, ArrowRight, Play, Check, Zap, HardDrive, Layers,
  TrendingUp, Award, GitBranch, ThumbsUp, ThumbsDown
} from 'lucide-react';

export default function AdminDashboard({ currentUser, onModelChanged }) {
  const [activeTab, setActiveTab] = useState('ml-rl'); // 'ml-rl' | 'models' | 'users' | 'telemetry'
  const [metrics, setMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [modelsData, setModelsData] = useState({ active_model: 'qwen2.5-coder:3b', available_models: [], base_url: 'http://localhost:11434' });
  const [mlRlData, setMlRlData] = useState(null);
  const [customModel, setCustomModel] = useState('');
  const [switchingModel, setSwitchingModel] = useState(false);
  const [modelSwitchStatus, setModelSwitchStatus] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);

  // Model Testing State
  const [testPrompt, setTestPrompt] = useState('Explain the difference between Type 1 and Type 2 diabetes in two clear sentences.');
  const [testResult, setTestResult] = useState('');
  const [testingModel, setTestingModel] = useState(false);

  // Admin user creation form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'patient'
  });
  const [creationStatus, setCreationStatus] = useState('');
  const [creationError, setCreationError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const res = await axios.get('/api/admin/models');
      setModelsData(res.data);
    } catch (err) {
      console.error("Error fetching models:", err);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchMlRlStatus = async () => {
    try {
      const res = await axios.get('/api/admin/ml-rl/status');
      setMlRlData(res.data);
    } catch (err) {
      console.error("Error fetching ML/RL status:", err);
    }
  };

  const fetchData = async () => {
    fetchModels();
    fetchMlRlStatus();

    try {
      const mRes = await axios.get('/api/admin/metrics');
      setMetrics(mRes.data);
    } catch (e) { console.error(e); }

    try {
      const uRes = await axios.get('/api/admin/users');
      setUsersList(uRes.data);
    } catch (e) { console.error(e); }

    try {
      const aRes = await axios.get('/api/admin/audit-logs');
      setAuditLogs(aRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSwitchModel = async (targetModelName) => {
    const selected = targetModelName || customModel.trim();
    if (!selected) return;

    setSwitchingModel(true);
    setModelSwitchStatus('');
    try {
      const res = await axios.post('/api/admin/models/switch', { model_name: selected });
      setModelsData(prev => ({ ...prev, active_model: res.data.active_model }));
      setModelSwitchStatus(res.data.message);
      if (onModelChanged) {
        onModelChanged(res.data.active_model);
      }
      setCustomModel('');
      fetchModels();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to switch model");
    } finally {
      setSwitchingModel(false);
    }
  };

  const handleRunModelTest = async () => {
    if (!testPrompt.trim()) return;
    setTestingModel(true);
    setTestResult('');
    try {
      const res = await axios.post('/api/admin/models/test', { prompt: testPrompt });
      setTestResult(res.data.response);
    } catch (err) {
      setTestResult(`Error testing model: ${err.response?.data?.detail || err.message}`);
    } finally {
      setTestingModel(false);
    }
  };

  const handleSimulateRlReward = async (isPositive) => {
    try {
      await axios.post('/api/admin/ml-rl/feedback', {
        is_positive: isPositive,
        triage_level: 2,
        action: 'COMPREHENSIVE_GUIDELINES',
        comment: isPositive ? 'Clinician approved comprehensive guideline structure' : 'Clinician requested adjustment'
      });
      fetchMlRlStatus();
    } catch (err) {
      alert('Error updating RL policy');
    }
  };

  const handleAdminCreateUser = async (e) => {
    e.preventDefault();
    setCreationError('');
    setCreationStatus('');
    setCreatingUser(true);

    try {
      const res = await axios.post('/api/admin/users', newUser);
      setCreationStatus(`User '${newUser.full_name}' created successfully in SQLite database!`);
      setNewUser({ email: '', password: '', full_name: '', role: 'patient' });
      fetchData();
    } catch (err) {
      setCreationError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user '${userName}' from the database?`)) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const rawAvailable = modelsData.available_models || [];
  const normalizedModels = rawAvailable.map(m => {
    if (typeof m === 'string') {
      return {
        name: m,
        parameter_size: m.includes('3b') ? '3.1B' : (m.includes('8b') ? '8.2B' : 'Standard'),
        size_gb: m.includes('3b') ? '1.80 GB' : (m.includes('8b') ? '4.87 GB' : 'Installed'),
        family: m.includes('qwen') ? 'Qwen' : 'LLM'
      };
    }
    return m;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-amber-400 rounded-2xl shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Administrator Control & AI Intelligence Center</h1>
            <p className="text-xs text-slate-500">Supervised Machine Learning, Reinforcement Learning (RLCF), LLM Switching & Database Persistence</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
          {/* Sub-nav switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('ml-rl')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'ml-rl' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>ML & RL Engine</span>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'models' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              <span>LLM Models ({normalizedModels.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Users ({usersList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                activeTab === 'telemetry' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Telemetry
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* VIEW: ML & REINFORCEMENT LEARNING INTELLIGENCE */}
      {activeTab === 'ml-rl' && (
        <div className="space-y-6">
          
          {/* Top RL Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase text-indigo-700 font-mono">RL Algorithm</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-sm font-extrabold text-slate-800 mt-2">Contextual Q-Learning (RLCF)</div>
              <p className="text-[10px] text-slate-500 mt-1">Reward Optimization via Clinician Feedback</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase text-emerald-700 font-mono">Total Cumulative Rewards</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-2">
                +{mlRlData?.rl_agent?.total_rewards_earned || '0.00'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Episodes Trained: {mlRlData?.rl_agent?.total_episodes || 0}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase text-teal-700 font-mono">Supervised ML Model</span>
                <Layers className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-sm font-extrabold text-slate-800 mt-2">Clinical Risk Stratifier</div>
              <p className="text-[10px] text-slate-500 mt-1">Features: {mlRlData?.ml_classifier?.total_features || 0} Dimensions (NLP + Vitals)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase text-amber-700 font-mono">Online Policy Feedback</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => handleSimulateRlReward(true)}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>Reward +3.0</span>
                </button>
                <button
                  onClick={() => handleSimulateRlReward(false)}
                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span>Penalty -6.0</span>
                </button>
              </div>
            </div>
          </div>

          {/* Q-Table Policy Matrix & Action Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: RL Q-Table Matrix */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-indigo-600" />
                    <span>Reinforcement Learning Policy Q-Matrix (States & Actions)</span>
                  </h2>
                  <p className="text-xs text-slate-500">Live Q-values learned from clinical interactions, safety validation, and clinician feedback</p>
                </div>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 font-bold">
                  α={mlRlData?.rl_agent?.learning_rate || 0.15}, γ={mlRlData?.rl_agent?.discount_factor || 0.9}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                      <th className="pb-2">Clinical State</th>
                      <th className="pb-2">Optimal Policy Action</th>
                      <th className="pb-2 text-right">Guidelines Q</th>
                      <th className="pb-2 text-right">Interview Q</th>
                      <th className="pb-2 text-right">Emergency Q</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {(mlRlData?.rl_agent?.sample_q_table || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 font-bold text-slate-700">{row.state}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-md font-bold text-[10px]">
                            {row.optimal_action}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-teal-700">
                          {row.q_values?.COMPREHENSIVE_GUIDELINES?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {row.q_values?.STRUCTURED_SYMPTOM_INTERVIEW?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-2.5 text-right font-bold text-red-600">
                          {row.q_values?.EMERGENCY_FIRST_AID_OVERRIDE?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Supervised ML Features & Explainability */}
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Supervised ML Classifier Weights</span>
              </h2>

              <div className="space-y-3 pt-1">
                <div className="text-xs text-slate-600">
                  <strong>Input Dimensions:</strong> {mlRlData?.ml_classifier?.total_features || 0} NLP TF-IDF Tokens + Physiological Vitals (HR, SBP, Temp, Emergency Keyword Density).
                </div>

                <div className="text-xs font-bold text-slate-700 pt-2">Top Activated Feature Weights:</div>
                <div className="space-y-1.5">
                  {(mlRlData?.ml_classifier?.top_features || []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-mono text-slate-700">{f}</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Feature #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Live RL Learning Logs */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Real-Time RL Policy Updates Stream</span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
              {(mlRlData?.rl_agent?.recent_policy_updates || []).map((u, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">Episode #{u.episode}</span> • State: <span className="text-indigo-700">{u.state}</span> • Action: <span className="text-teal-700">{u.action}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold ${u.reward >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Reward: {u.reward > 0 ? `+${u.reward}` : u.reward}
                    </span>
                    <span className="text-slate-500 font-medium">New Q: {u.updated_q}</span>
                  </div>
                </div>
              ))}
              {(!mlRlData?.rl_agent?.recent_policy_updates || mlRlData?.rl_agent?.recent_policy_updates.length === 0) && (
                <div className="text-slate-400 text-xs py-4 text-center">Policy initialized. Interactions and feedback will stream updates here.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: LLM MODEL SWITCHER & PERSISTENCE */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          
          {/* Active Model Status Card */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Currently Active & Persisted LLM Model</div>
                <div className="text-xl font-extrabold text-white mt-0.5 flex items-center space-x-2">
                  <span className="font-mono">{modelsData.active_model}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30 font-medium">
                    Active in Memory & DB
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ollama Base URL: <code className="text-teal-300 font-mono">{modelsData.base_url || 'http://localhost:11434'}</code> • Saved in <code className="text-slate-300 font-mono">healthcare_ai.db</code>
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 font-mono">
                {normalizedModels.length} Local Models Detected
              </span>
            </div>
          </div>

          {modelSwitchStatus && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{modelSwitchStatus}</span>
            </div>
          )}

          {/* Installed Local Models Grid */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Installed Local Ollama Models</h2>
                <p className="text-xs text-slate-500">Click any detected model card below to switch the platform to that model and persist it</p>
              </div>
              <button
                onClick={fetchModels}
                className="text-xs text-teal-600 font-bold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rescan Ollama</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {normalizedModels.map((m) => {
                const isActive = modelsData.active_model === m.name;
                return (
                  <div
                    key={m.name}
                    className={`p-5 rounded-2xl border transition relative flex flex-col justify-between space-y-4 ${
                      isActive 
                        ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-md' 
                        : 'bg-slate-50/70 border-slate-200 hover:border-teal-300 hover:bg-white shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          {m.family || 'Model Tag'}
                        </span>
                        {isActive ? (
                          <span className="px-2.5 py-0.5 bg-teal-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider shadow-2xs flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Currently Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Available</span>
                        )}
                      </div>

                      <div className="text-base font-extrabold text-slate-800 mt-2 font-mono">{m.name}</div>

                      {/* Technical Specs Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {m.parameter_size && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                            Params: {m.parameter_size}
                          </span>
                        )}
                        {m.size_gb && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                            Disk: {m.size_gb}
                          </span>
                        )}
                        {m.quantization && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md">
                            {m.quantization}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                        {m.name.includes('3b') 
                          ? 'Optimized for high-speed local inference, rapid symptom extraction, and deterministic clinical triage.' 
                          : (m.name.includes('8b') 
                            ? 'Higher reasoning capacity, comprehensive clinical explanations, and detailed medical SOAP scribing.' 
                            : 'Local Ollama LLM provider model.')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleSwitchModel(m.name)}
                      disabled={isActive || switchingModel}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        isActive 
                          ? 'bg-teal-700 text-white cursor-default shadow-xs' 
                          : 'bg-slate-900 hover:bg-teal-600 text-white shadow-xs'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Model</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Select & Activate Model</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {normalizedModels.length === 0 && !loadingModels && (
                <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                  <Cpu className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No models returned from Ollama. Make sure Ollama is running at <code className="font-mono">http://localhost:11434</code>.</p>
                </div>
              )}
            </div>

            {/* Custom Model Input */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs font-bold text-slate-700 shrink-0">Switch to Any Other Installed Tag:</span>
              <input
                type="text"
                placeholder="e.g. llama3:8b, mistral:7b, medllama2"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-mono flex-1"
              />
              <button
                onClick={() => handleSwitchModel(customModel)}
                disabled={switchingModel || !customModel.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
              >
                {switchingModel ? 'Saving...' : 'Switch & Persist in DB'}
              </button>
            </div>
          </div>

          {/* Model Inference Latency & Output Tester */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800">Live Model Inference & Latency Tester</h3>
              </div>
              <span className="text-xs text-slate-400">Testing active model: <strong className="text-slate-700 font-mono">{modelsData.active_model}</strong></span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Test Clinical Prompt</label>
                <input
                  type="text"
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={handleRunModelTest}
                disabled={testingModel || !testPrompt.trim()}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{testingModel ? 'Running Inference with ' + modelsData.active_model + '...' : 'Run Test Prompt'}</span>
              </button>

              {testResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-in fade-in">
                  <div className="text-[10px] font-bold text-teal-700 uppercase font-mono">Response from {modelsData.active_model}:</div>
                  <div className="text-xs text-slate-800 leading-relaxed font-normal">{testResult}</div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Create User Form */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-4 h-4 text-sky-600" />
              <span>Create New User (by Admin)</span>
            </h2>

            {creationStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{creationStatus}</span>
              </div>
            )}

            {creationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{creationError}</span>
              </div>
            )}

            <form onSubmit={handleAdminCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Robert Chen"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. robert@healthcare.ai"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">System Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                >
                  <option value="patient">Patient (Consultation Access)</option>
                  <option value="clinician">Clinician (Doctor / Triage Queue)</option>
                  <option value="admin">Administrator (Full System Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 mt-2 flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>{creatingUser ? 'Creating...' : 'Create & Save to SQL DB'}</span>
              </button>
            </form>
          </div>

          {/* Right: Users Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Database Users (healthcare_ai.db)</h2>
                <p className="text-xs text-slate-500">Persistent users stored in SQLite SQL database</p>
              </div>
              <span className="px-2.5 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-lg">
                Total: {usersList.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="pb-2.5">User</th>
                    <th className="pb-2.5">Email</th>
                    <th className="pb-2.5">Role</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Created</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-bold text-slate-800 flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-800' : (u.role === 'clinician' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800')
                        }`}>
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <span>{u.full_name}</span>
                      </td>
                      <td className="py-3 text-slate-600">{u.email}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          u.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                          (u.role === 'clinician' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                          Active
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        {u.email !== 'admin@healthcare.ai' ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Default</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: TELEMETRY & SYSTEM METRICS */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <Users className="w-5 h-5 text-sky-600" />
                <span className="text-[11px] font-semibold uppercase">Total Users</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-2">{metrics?.summary?.total_patients || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span className="text-[11px] font-semibold uppercase">Consultations</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-2">{metrics?.summary?.total_conversations || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <Activity className="w-5 h-5 text-teal-600" />
                <span className="text-[11px] font-semibold uppercase">Messages</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-2">{metrics?.summary?.total_messages || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-[11px] font-semibold uppercase">Emergencies</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mt-2">{metrics?.summary?.emergency_detections || 0}</div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="flex items-center justify-between text-slate-400">
                <Shield className="w-5 h-5 text-amber-500" />
                <span className="text-[11px] font-semibold uppercase">Escalations</span>
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-2">{metrics?.summary?.total_escalations || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-800">Triage Risk Distribution</h2>
              <div className="space-y-3 pt-2">
                {[
                  { level: 4, name: 'Level 4: Emergency', color: 'bg-red-500' },
                  { level: 3, name: 'Level 3: Urgent', color: 'bg-orange-500' },
                  { level: 2, name: 'Level 2: Evaluation', color: 'bg-amber-500' },
                  { level: 1, name: 'Level 1: Low Concern', color: 'bg-emerald-500' },
                  { level: 0, name: 'Level 0: Informational', color: 'bg-blue-500' }
                ].map(item => {
                  const count = metrics?.triage_distribution?.[item.level] || 0;
                  const total = Object.values(metrics?.triage_distribution || {}).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={item.level} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold text-slate-700">
                        <span>{item.name}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <h2 className="text-sm font-bold text-slate-800">Security & Audit Event Stream</h2>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-teal-700">{log.action}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        User: {log.user_id ? log.user_id.slice(0, 8) + '...' : 'Anonymous / System'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs">No audit logs recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
