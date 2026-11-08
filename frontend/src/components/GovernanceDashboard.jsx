import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, ShieldAlert, Cpu, Award, AlertTriangle, CheckCircle, 
  RefreshCw, Lock, Bug, FileText, Check, AlertCircle, Sparkles
} from 'lucide-react';

export default function GovernanceDashboard() {
  const [govData, setGovData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    reported_by: 'Dr. Eleanor Rivera, MD',
    incident_type: 'Model Hallucination Observation',
    details: '',
    severity: 'Low'
  });
  const [reportStatus, setReportStatus] = useState('');

  useEffect(() => {
    fetchGovernance();
  }, []);

  const fetchGovernance = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/governance/status');
      setGovData(res.data);
    } catch (err) {
      console.error("Error fetching governance status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.details.trim()) return;
    try {
      await axios.post('/api/governance/incidents', incidentForm);
      setReportStatus('AI Incident report filed successfully to Clinical Governance Committee.');
      setIncidentForm({ ...incidentForm, details: '' });
      fetchGovernance();
    } catch (err) {
      alert("Incident reporting failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Clinical AI Governance, Model Cards & Red-Teaming</h1>
            <p className="text-xs text-slate-500">NIST AI Risk Management Framework, Model Card specifications, automated adversarial safety benchmarks</p>
          </div>
        </div>

        <button
          onClick={fetchGovernance}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Governance</span>
        </button>
      </div>

      {/* Compliance Standards Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-teal-400 font-mono font-bold">Regulatory & Safety Compliance</span>
          <h2 className="text-sm font-bold mt-1">{govData?.governance_framework || 'Enterprise Healthcare AI Framework'}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            {(govData?.compliance_standards || []).map((std, i) => (
              <span key={i} className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700 text-xs font-mono font-bold">
                ✓ {std}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3.5 bg-slate-800 rounded-2xl border border-slate-700 text-xs space-y-1">
          <div className="text-emerald-400 font-bold flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>Failsafe Mode Active</span>
          </div>
          <p className="text-[11px] text-slate-400">Deterministic emergency rules always enforced without LLM dependency.</p>
        </div>
      </div>

      {/* Model Cards Registry */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Cpu className="w-4 h-4 text-indigo-600" />
          <span>Clinical AI Model Cards Registry (Local Deployment)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {(govData?.model_cards || []).map((card) => (
            <div key={card.model_id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-900 font-mono">{card.name}</div>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 mt-1 inline-block">
                    {card.clinical_tier}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  {card.status}
                </span>
              </div>

              {card.intended_use && (
                <div className="space-y-1 text-xs">
                  <strong className="text-slate-700 text-[11px]">Approved Intended Use:</strong>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
                    {card.intended_use.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
              )}

              {card.prohibited_use && (
                <div className="space-y-1 text-xs">
                  <strong className="text-red-700 text-[11px]">Prohibited Use:</strong>
                  <ul className="list-disc list-inside text-red-600 space-y-0.5 text-[11px]">
                    {card.prohibited_use.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Adversarial Red-Team Benchmark Suite */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Bug className="w-4 h-4 text-red-600" />
              <span>Automated Adversarial Red-Team Benchmark Suite</span>
            </h2>
            <p className="text-xs text-slate-500">Continuous testing against prompt injection, jailbreaks, PII leakage, and unauthorized prescribing</p>
          </div>

          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300">
            {govData?.adversarial_benchmark?.pass_rate_pct || 100}% Pass Rate ({govData?.adversarial_benchmark?.passed_tests}/{govData?.adversarial_benchmark?.total_tests} Tests Passed)
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {(govData?.adversarial_benchmark?.test_cases || []).map((test) => (
            <div key={test.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[10px]">
                  {test.category}
                </span>
                <span className="inline-flex items-center text-emerald-600 font-bold">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Passed
                </span>
              </div>

              <div className="text-slate-700">
                <strong>Adversarial Attack Prompt:</strong> <span className="font-mono text-slate-600">"{test.prompt}"</span>
              </div>

              <div className="text-slate-600 pt-1 border-t border-slate-200">
                <strong>Safety Defense Mechanism:</strong> {test.expected_behavior}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Reporting & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Report Form */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Report AI Observation / Incident</span>
          </h3>

          {reportStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reportStatus}</span>
            </div>
          )}

          <form onSubmit={handleReportIncident} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Reported By</label>
              <input
                type="text"
                value={incidentForm.reported_by}
                onChange={(e) => setIncidentForm({ ...incidentForm, reported_by: e.target.value })}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Incident Category</label>
              <select
                value={incidentForm.incident_type}
                onChange={(e) => setIncidentForm({ ...incidentForm, incident_type: e.target.value })}
                className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="Model Hallucination Observation">Model Hallucination Observation</option>
                <option value="Adversarial Injection Blocked">Adversarial Injection Blocked</option>
                <option value="Entity Extraction Inaccuracy">Entity Extraction Inaccuracy</option>
                <option value="Clinical Rule Suggestion">Clinical Rule Suggestion</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Details & Clinical Context</label>
              <textarea
                rows={3}
                required
                placeholder="Describe what occurred, input prompt, and expected clinical behavior..."
                value={incidentForm.details}
                onChange={(e) => setIncidentForm({ ...incidentForm, details: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Submit Governance Incident Report
            </button>
          </form>
        </div>

        {/* Incidents Stream */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>AI Incident Audit Stream</span>
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(govData?.incidents || []).map((inc) => (
              <div key={inc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{inc.incident_type}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{inc.timestamp}</span>
                </div>
                <p className="text-slate-600">{inc.details}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Reported by: <strong>{inc.reported_by}</strong></span>
                  <span className="text-emerald-700 font-semibold">{inc.resolution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
