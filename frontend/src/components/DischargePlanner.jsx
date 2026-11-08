import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileCheck, Sparkles, CheckCircle, Clock, ShieldCheck, 
  Layers, ChevronRight, Check, HeartPulse, AlertTriangle, Download, RefreshCw
} from 'lucide-react';

export default function DischargePlanner({ currentUser }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [dischargePackage, setDischargePackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signedMsg, setSignedMsg] = useState('');
  const [disposition, setDisposition] = useState('Home with Self Care');
  const [followUpDays, setFollowUpDays] = useState(7);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      setDischargePackage(null);
      setSignedMsg('');
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/doctor/patients');
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const handleGenerateDischarge = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    setSignedMsg('');
    try {
      const res = await axios.post('/api/discharge/generate', {
        patient_id: selectedPatientId,
        attending_physician: currentUser?.full_name || 'Dr. Robert Chen, MD (Attending)',
        discharge_disposition: disposition,
        follow_up_days: parseInt(followUpDays) || 7
      });
      setDischargePackage(res.data);
    } catch (err) {
      alert("Failed to generate discharge package: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignDischarge = async () => {
    if (!dischargePackage) return;
    try {
      const res = await axios.post('/api/discharge/finalize', {
        discharge_id: dischargePackage.id,
        signed_by: currentUser?.full_name || 'Dr. Robert Chen, MD'
      });
      setSignedMsg(res.data.message);
    } catch (err) {
      alert("Signing failed: " + err.message);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">AI Automated Discharge Summaries & Care Instructions</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold">
                READMISSION PREVENTION
              </span>
            </div>
            <p className="text-xs text-slate-500">1-click synthesis of physician discharge summaries and patient-friendly care instructions</p>
          </div>
        </div>

        <button
          onClick={handleGenerateDischarge}
          disabled={loading || !selectedPatientId}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{loading ? 'Synthesizing with Qwen LLM...' : 'Generate Discharge Package'}</span>
        </button>
      </div>

      {/* Patient & Disposition Options */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 border-b border-slate-100 pb-2.5">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Select Inpatient for Discharge:</span>
        </span>

        <div className="flex flex-wrap gap-2.5">
          {patients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPatientId(p.id)}
              className={`p-3 rounded-2xl border text-left text-xs transition ${
                selectedPatientId === p.id 
                  ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-2xs' 
                  : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="font-extrabold text-slate-900">{p.name} ({p.age}yo)</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{p.mrn} • {p.ward}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-700">Discharge Destination</label>
            <select
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
            >
              <option value="Home with Self Care">Home with Self Care</option>
              <option value="Home with Home Health Nurse">Home with Home Health Nurse</option>
              <option value="Subacute Skilled Nursing Facility (SNF)">Subacute Skilled Nursing Facility (SNF)</option>
              <option value="Inpatient Rehabilitation">Inpatient Rehabilitation</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Primary Care Follow-up (Days)</label>
            <input
              type="number"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {signedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{signedMsg}</span>
        </div>
      )}

      {/* Discharge Package Output Grid */}
      {dischargePackage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
          
          {/* Left: Formal Physician Summary */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800">1. Formal Inpatient Discharge Summary</h3>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-mono font-bold">
                  FOR MEDICAL RECORDS
                </span>
              </div>
              <pre className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans mt-3">
                {dischargePackage.formal_summary}
              </pre>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">Attending: {dischargePackage.attending_physician}</span>
              <button
                onClick={handleSignDischarge}
                disabled={signedMsg !== ''}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{signedMsg ? 'Finalized & Locked' : 'Sign Discharge Summary'}</span>
              </button>
            </div>
          </div>

          {/* Right: Patient-Friendly Instructions */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800">2. Patient & Caregiver Instructions</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-mono font-bold">
                PATIENT HANDOUT
              </span>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {dischargePackage.patient_instructions}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
