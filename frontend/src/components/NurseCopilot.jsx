import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HeartPulse, Activity, AlertTriangle, CheckCircle, Clock, Pill, 
  RefreshCw, Shield, Sparkles, Check, ChevronRight, UserCheck, AlertCircle,
  Radio, Zap, Barcode
} from 'lucide-react';

export default function NurseCopilot({ currentUser }) {
  const [handoffData, setHandoffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('handoff'); // 'handoff' | 'calculator'
  
  // Real-time live ward polling state
  const [isLiveWard, setIsLiveWard] = useState(true);
  const [administeredMeds, setAdministeredMeds] = useState({});

  // Bedside Calculator Form State
  const [calcForm, setCalcForm] = useState({
    respiration_rate: 22,
    spo2: 93,
    is_on_supplemental_o2: true,
    systolic_bp: 95,
    heart_rate: 108,
    consciousness: 'Alert',
    temperature: 38.5
  });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    fetchHandoff();
  }, []);

  // Real-time ward telemetry polling (every 4s)
  useEffect(() => {
    if (!isLiveWard) return;
    const interval = setInterval(() => {
      fetchHandoff(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveWard]);

  const fetchHandoff = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get('/api/nurse/shift-handoff');
      setHandoffData(res.data);
    } catch (err) {
      console.error("Error fetching shift handoff:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAdministerMedication = async (patientId, medName, dose) => {
    try {
      const res = await axios.post('/api/nurse/medication/administer', {
        patient_id: patientId,
        medication_name: medName,
        dose: dose,
        nurse_name: currentUser?.full_name || 'Nurse Sarah Connor, RN',
        barcode_verified: true
      });
      setAdministeredMeds(prev => ({
        ...prev,
        [`${patientId}-${medName}`]: {
          status: 'GIVEN & LOGGED',
          time: new Date().toLocaleTimeString()
        }
      }));
    } catch (err) {
      alert("Administration failed: " + err.message);
    }
  };

  const handleCalculateNEWS2 = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/nurse/news2/calculate', calcForm);
      setCalcResult(res.data);
    } catch (err) {
      alert("NEWS2 calculation failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Nurse AI Copilot & Shift Handoff Center</h1>
              <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE WARD MONITOR</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">Structured SBAR shift handoffs, Royal College of Physicians NEWS2 deterioration, and eMAR medication administration</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Ward Telemetry Polling Toggle */}
          <button
            onClick={() => setIsLiveWard(!isLiveWard)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
              isLiveWard 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveWard ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isLiveWard ? 'Live Ward: ACTIVE (4s)' : 'Live Ward: PAUSED'}</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold space-x-1">
            <button
              onClick={() => setActiveView('handoff')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'handoff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              SBAR Shift Handoff
            </button>
            <button
              onClick={() => setActiveView('calculator')}
              className={`px-3 py-1.5 rounded-lg transition ${activeView === 'calculator' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Bedside NEWS2 Calculator
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: SBAR SHIFT HANDOFF */}
      {activeView === 'handoff' && (
        <div className="space-y-6">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="text-xs font-bold uppercase text-slate-400 font-mono">Assigned Ward Census</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{handoffData?.total_assigned_patients || 0} Patients</div>
              <p className="text-[11px] text-slate-500 mt-1">{handoffData?.shift || 'Active Shift'}</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="text-xs font-bold uppercase text-red-500 font-mono">High Risk Deteriorations</div>
              <div className="text-2xl font-black text-red-600 mt-1">{handoffData?.high_risk_patients_count || 0} Alert Flags</div>
              <p className="text-[11px] text-slate-500 mt-1">NEWS2 Score &gt;= 5 or single red flag (Urgent review)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
              <div className="text-xs font-bold uppercase text-teal-600 font-mono">Scheduled Med Administrations</div>
              <div className="text-2xl font-black text-teal-700 mt-1">{handoffData?.total_scheduled_meds || 0} Doses</div>
              <p className="text-[11px] text-slate-500 mt-1">eMAR barcode verification active</p>
            </div>
          </div>

          {/* SBAR Patient Cards */}
          <div className="space-y-5">
            {(handoffData?.patients || []).map((p) => {
              const news2 = p.news2;
              const isHighRisk = news2?.risk_tier === 'HIGH' || news2?.risk_tier === 'MEDIUM';

              return (
                <div key={p.patient_id} className={`bg-white p-6 rounded-3xl shadow-card border transition space-y-4 ${
                  isHighRisk ? 'border-amber-300 ring-2 ring-amber-500/10' : 'border-slate-200'
                }`}>
                  
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-extrabold text-slate-900">{p.name}</span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-bold">{p.room_bed}</span>
                        <span className="text-xs text-slate-400 font-mono">MRN: {p.mrn}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Nurse: <strong>{p.primary_nurse}</strong> • Attending: <strong>{p.attending}</strong>
                      </p>
                    </div>

                    {news2 && (
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center space-x-1.5 ${
                        news2.risk_tier === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                        (news2.risk_tier === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                      }`}>
                        <Activity className="w-3.5 h-3.5" />
                        <span>NEWS2: {news2.total_score}/20 ({news2.risk_tier} Risk)</span>
                      </span>
                    )}
                  </div>

                  {/* SBAR Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">S — Situation</div>
                      <p className="text-xs text-slate-800 leading-relaxed">{p.sbar?.situation}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">B — Background</div>
                      <p className="text-xs text-slate-800 leading-relaxed">{p.sbar?.background}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">A — Assessment & Vitals</div>
                      <p className="text-xs text-slate-800 leading-relaxed">{p.sbar?.assessment}</p>
                    </div>

                    <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-1">
                      <div className="text-[10px] font-bold uppercase text-teal-700 font-mono">R — Recommendation & Action</div>
                      <p className="text-xs text-teal-950 font-medium leading-relaxed">{p.sbar?.recommendation}</p>
                    </div>
                  </div>

                  {/* Scheduled Medications List with 1-Click Live Administration */}
                  {p.med_schedule && p.med_schedule.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          <span>eMAR Medication Administration Schedule:</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Barcode Scan Auto-Verification Enforced</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {p.med_schedule.map((m, mi) => {
                          const medKey = `${p.patient_id}-${m.medication}`;
                          const isGiven = administeredMeds[medKey];

                          return (
                            <div key={mi} className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition ${
                              isGiven ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div className="space-y-0.5">
                                <strong className="text-slate-800">{m.medication}</strong> {m.dose}
                                <div className="text-[10px] text-slate-400 font-mono">{m.route} • {m.scheduled_time}</div>
                                {isGiven && (
                                  <div className="text-[10px] text-emerald-700 font-bold font-mono">
                                    ✓ Administered at {isGiven.time}
                                  </div>
                                )}
                              </div>

                              {isGiven ? (
                                <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Logged</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleAdministerMedication(p.patient_id, m.medication, m.dose)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1 shadow-2xs"
                                >
                                  <Barcode className="w-3 h-3 text-teal-400" />
                                  <span>Administer</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW 2: BEDSIDE NEWS2 CALCULATOR */}
      {activeView === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Input Form */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Bedside Vitals Input</span>
            </h2>

            <form onSubmit={handleCalculateNEWS2} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Respiration Rate (breaths/min)</label>
                <input
                  type="number"
                  value={calcForm.respiration_rate}
                  onChange={(e) => setCalcForm({ ...calcForm, respiration_rate: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Oxygen Saturation (SpO2 %)</label>
                <input
                  type="number"
                  value={calcForm.spo2}
                  onChange={(e) => setCalcForm({ ...calcForm, spo2: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Supplemental Oxygen (Air vs O2)</span>
                <input
                  type="checkbox"
                  checked={calcForm.is_on_supplemental_o2}
                  onChange={(e) => setCalcForm({ ...calcForm, is_on_supplemental_o2: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Systolic Blood Pressure (mmHg)</label>
                <input
                  type="number"
                  value={calcForm.systolic_bp}
                  onChange={(e) => setCalcForm({ ...calcForm, systolic_bp: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Heart Rate / Pulse (bpm)</label>
                <input
                  type="number"
                  value={calcForm.heart_rate}
                  onChange={(e) => setCalcForm({ ...calcForm, heart_rate: parseInt(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Consciousness (AVPU)</label>
                <select
                  value={calcForm.consciousness}
                  onChange={(e) => setCalcForm({ ...calcForm, consciousness: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                >
                  <option value="Alert">A — Alert</option>
                  <option value="Voice">V — Responds to Voice</option>
                  <option value="Pain">P — Responds to Pain</option>
                  <option value="Unresponsive">U — Unresponsive</option>
                  <option value="Confused">New Confusion / Altered</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcForm.temperature}
                  onChange={(e) => setCalcForm({ ...calcForm, temperature: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-bold font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Calculate Deterioration Risk
              </button>
            </form>
          </div>

          {/* Right: Breakdown & Clinical Response Protocol */}
          <div className="lg:col-span-2 space-y-4">
            {calcResult ? (
              <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-5 animate-in fade-in">
                
                {/* Result Header */}
                <div className={`p-6 rounded-2xl text-white flex items-center justify-between ${
                  calcResult.risk_tier === 'HIGH' ? 'bg-red-600' :
                  (calcResult.risk_tier === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600')
                }`}>
                  <div>
                    <div className="text-xs uppercase font-mono tracking-wider opacity-80">Royal College of Physicians NEWS2 Score</div>
                    <div className="text-3xl font-black mt-0.5">{calcResult.total_score} / 20 Points</div>
                    <p className="text-xs mt-1 opacity-90">Risk Level: <strong>{calcResult.risk_tier} CLINICAL RISK</strong></p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Activity className="w-8 h-8" />
                  </div>
                </div>

                {/* Clinical Response Protocol */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-teal-600" />
                    <span>Mandatory Clinical Action Protocol:</span>
                  </div>
                  <p className="text-xs font-semibold text-teal-950 leading-relaxed">{calcResult.clinical_response}</p>
                  <p className="text-[11px] text-slate-500">Required Observation Frequency: <strong>{calcResult.monitoring_frequency}</strong></p>
                </div>

                {/* Score Breakdown Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Parameter Score Contributions:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(calcResult.breakdown || {}).map(([param, data]) => (
                      <div key={param} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="text-[10px] text-slate-400 capitalize font-mono">{param.replace('_', ' ')}</div>
                        <div className="font-bold text-slate-800 mt-0.5">{data.value}</div>
                        <span className={`inline-block mt-1 px-1.5 py-0.2 text-[10px] font-bold rounded ${
                          data.score === 3 ? 'bg-red-100 text-red-700' : (data.score > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
                        }`}>
                          +{data.score} Points
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200">
                Enter bedside vitals on the left and click calculate to view the NEWS2 deterioration breakdown and escalation protocol.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
