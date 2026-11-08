import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Brain, Cpu, Sparkles, TrendingUp, RefreshCw, CheckCircle, 
  AlertTriangle, ThumbsUp, ThumbsDown, Zap, Sliders, Activity, 
  BarChart3, ShieldCheck, Layers, Play
} from 'lucide-react';

export default function MLModelStudio() {
  const [mlRlStatus, setMlRlStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState('');

  // Interactive Live Prediction Form
  const [textInput, setTextInput] = useState('Severe crushing chest pain radiating to left arm with cold sweat and shortness of breath.');
  const [vitals, setVitals] = useState({
    hr: 118,
    sbp: 88,
    temp: 98.6,
    rr: 26,
    spo2: 91
  });
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // RL Reward Feedback
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  useEffect(() => {
    fetchStatus();
    handleRunPrediction();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/ml-rl/status');
      setMlRlStatus(res.data);
    } catch (err) {
      console.error("Error fetching ML/RL status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    setPredicting(true);
    try {
      const res = await axios.post('/api/admin/ml/predict', {
        text: textInput,
        vitals: vitals
      });
      setPrediction(res.data);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setPredicting(false);
    }
  };

  const handleRetrainModel = async () => {
    setRetraining(true);
    try {
      const res = await axios.post('/api/admin/ml/retrain', { epochs: 150, learning_rate: 0.18 });
      setRetrainSuccess(res.data.message);
      setTimeout(() => setRetrainSuccess(''), 6000);
      fetchStatus();
      handleRunPrediction();
    } catch (err) {
      alert("Retraining failed: " + err.message);
    } finally {
      setRetraining(false);
    }
  };

  const handleSendRLFeedback = async (isPositive, actionName) => {
    try {
      const res = await axios.post('/api/admin/ml-rl/feedback', {
        is_positive: isPositive,
        triage_level: prediction?.predicted_triage_level || 0,
        action: actionName || "COMPREHENSIVE_GUIDELINES",
        comment: isPositive ? "Clinician validated optimal protocol" : "Clinician penalized sub-optimal guidance"
      });
      setFeedbackSuccess(res.data.message);
      setTimeout(() => setFeedbackSuccess(''), 5000);
      fetchStatus();
    } catch (err) {
      alert("RL Feedback failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Multi-Task ML & Reinforcement Learning (RLCF) Studio</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                CORE AI & XAI ATTR
              </span>
            </div>
            <p className="text-xs text-slate-500">Supervised multi-task risk classification, XAI factor contributions, and Q-learning policy adaptation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRetrainModel}
            disabled={retraining}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Play className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? 'Retraining...' : '1-Click Model Retraining'}</span>
          </button>

          <button
            onClick={fetchStatus}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {retrainSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <Zap className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Grid: Multi-Task ML Workbench (7 Cols) & RL Policy Optimizer (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (7 Cols): Multi-Task Supervised ML Workbench */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Multi-Task Clinical Risk Workbench & Live Simulator</span>
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-700">Patient Symptoms / Chief Complaint NLP Text</label>
              <textarea
                rows={2}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
            </div>

            {/* Physiological Vitals Sliders */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <div className="text-[11px] font-bold text-slate-600">HR (bpm)</div>
                <div className="text-sm font-black text-slate-900 font-mono">{vitals.hr}</div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={vitals.hr}
                  onChange={(e) => setVitals({ ...vitals, hr: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600">SBP (mmHg)</div>
                <div className="text-sm font-black text-slate-900 font-mono">{vitals.sbp}</div>
                <input
                  type="range"
                  min="60"
                  max="220"
                  value={vitals.sbp}
                  onChange={(e) => setVitals({ ...vitals, sbp: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600">RR (/min)</div>
                <div className="text-sm font-black text-slate-900 font-mono">{vitals.rr}</div>
                <input
                  type="range"
                  min="8"
                  max="45"
                  value={vitals.rr}
                  onChange={(e) => setVitals({ ...vitals, rr: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600">Temp (°F)</div>
                <div className="text-sm font-black text-slate-900 font-mono">{vitals.temp}</div>
                <input
                  type="range"
                  min="95"
                  max="105"
                  step="0.1"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: parseFloat(e.target.value) })}
                  className="w-full h-1.5 accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-600">SpO2 (%)</div>
                <div className="text-sm font-black text-slate-900 font-mono">{vitals.spo2}%</div>
                <input
                  type="range"
                  min="75"
                  max="100"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: parseInt(e.target.value) })}
                  className="w-full h-1.5 accent-teal-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleRunPrediction}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Compute Multi-Task Ensemble Inference</span>
            </button>
          </div>

          {/* Multi-Task Results Grid */}
          {prediction && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-card">
                  <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Predicted Triage</div>
                  <div className="text-xl font-black text-slate-900 mt-1">Level {prediction.predicted_triage_level}</div>
                  <p className="text-[11px] text-teal-700 font-bold mt-1">{Math.round(prediction.confidence * 100)}% Confidence</p>
                </div>

                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-card">
                  <div className="text-[10px] font-bold uppercase text-red-600 font-mono">Sepsis Risk P(Sepsis)</div>
                  <div className="text-xl font-black text-red-700 mt-1">
                    {Math.round((prediction.multitask_predictions?.sepsis_deterioration_risk || 0) * 100)}%
                  </div>
                  <p className="text-[11px] text-red-600 font-bold mt-1">
                    {prediction.multitask_predictions?.sepsis_risk_level}
                  </p>
                </div>

                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-card">
                  <div className="text-[10px] font-bold uppercase text-indigo-600 font-mono">ICU Readmit (48h)</div>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {Math.round((prediction.multitask_predictions?.icu_readmission_48h_probability || 0) * 100)}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">LACE Proxied</p>
                </div>

                <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-card">
                  <div className="text-[10px] font-bold uppercase text-amber-600 font-mono">Mortality Proxy (30d)</div>
                  <div className="text-xl font-black text-amber-700 mt-1">
                    {Math.round((prediction.multitask_predictions?.mortality_risk_proxy_30d || 0) * 100)}%
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">APACHE-II Proxy</p>
                </div>
              </div>

              {/* Explainable AI (XAI) Factor Attribution */}
              <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Explainable AI (XAI) Feature Attribution</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">SHAP / Feature Weights</span>
                </div>

                <div className="space-y-2">
                  {(prediction.explainable_ai_factors || []).map((factor, fi) => (
                    <div key={fi} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                      <div>
                        <strong className="text-slate-900">{factor.feature}</strong>
                        <span className="text-slate-500 text-[10px] ml-2">Activation: {factor.feature_activation}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        factor.direction === 'INCREASES_RISK' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {factor.shap_contribution > 0 ? `+${factor.shap_contribution}` : factor.shap_contribution} ({factor.direction})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right (5 Cols): Reinforcement Learning Policy Optimizer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Reinforcement Learning Policy (Q-Learning / RLCF)</span>
              </h2>
            </div>

            {mlRlStatus?.rl_agent && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total RL Episodes</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">{mlRlStatus.rl_agent.total_episodes}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Exploration (Epsilon)</div>
                    <div className="text-lg font-black text-indigo-700 mt-0.5">
                      {mlRlStatus.rl_agent.current_exploration_epsilon || mlRlStatus.rl_agent.exploration_epsilon}
                    </div>
                  </div>
                </div>

                {/* Interactive Clinician Reward Feedback Tuning */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="font-bold text-indigo-950 text-xs">
                    Inject Real Clinician Reinforcement Reward:
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    Reward optimal guideline actions or penalize sub-optimal responses to adapt the online Q-table policy in real time:
                  </p>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSendRLFeedback(true, "COMPREHENSIVE_GUIDELINES")}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>+3.0 Positive</span>
                    </button>

                    <button
                      onClick={() => handleSendRLFeedback(false, "COMPREHENSIVE_GUIDELINES")}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>-6.0 Penalty</span>
                    </button>
                  </div>
                </div>

                {/* Sample Q-Table State-Action Values */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-800 text-xs">Sample State-Action Q(s, a) Matrix:</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(mlRlStatus.rl_agent.sample_q_table || []).map((row, ri) => (
                      <div key={ri} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{row.state}</span>
                          <span className="text-teal-700 font-bold">Best: {row.optimal_action}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Q-Values: {Object.entries(row.q_values || {}).map(([k, v]) => `${k.slice(0, 8)}:${v}`).join(' | ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
