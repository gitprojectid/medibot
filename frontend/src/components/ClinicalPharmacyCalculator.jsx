import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calculator, Pill, AlertTriangle, ShieldCheck, CheckCircle, 
  Activity, Layers, RefreshCw, Zap, Scale, HeartPulse
} from 'lucide-react';

export default function ClinicalPharmacyCalculator() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [renalAudit, setRenalAudit] = useState(null);
  const [loading, setLoading] = useState(false);

  // Standalone CrCl Calculator State
  const [calcForm, setCalcForm] = useState({
    age: 68,
    weight_kg: 75,
    gender: 'Male',
    serum_creatinine_mg_dl: 1.8
  });
  const [calcResult, setCalcResult] = useState(null);

  // IV Infusion Calculator State
  const [ivForm, setIvForm] = useState({
    drug_name: 'Norepinephrine (Levophed)',
    patient_weight_kg: 75,
    desired_dose_mcg_kg_min: 0.08,
    bag_amount_mg: 4,
    bag_volume_ml: 250
  });
  const [ivResult, setIvResult] = useState(null);

  useEffect(() => {
    fetchPatients();
    handleCalculateRenal();
    handleCalculateIV();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientRenalAudit(selectedPatientId);
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

  const fetchPatientRenalAudit = async (patientId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/pharmacy/patient/${patientId}/renal-audit`);
      setRenalAudit(res.data);
    } catch (err) {
      console.error("Error fetching renal audit:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRenal = async () => {
    try {
      const res = await axios.post('/api/pharmacy/renal-calculator', calcForm);
      setCalcResult(res.data);
    } catch (err) {
      alert("Calculation failed: " + err.message);
    }
  };

  const handleCalculateIV = async () => {
    try {
      const res = await axios.post('/api/pharmacy/iv-infusion-calculator', ivForm);
      setIvResult(res.data);
    } catch (err) {
      alert("IV calculation failed: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Clinical Pharmacy, Renal Dosing & IV Infusion Calculator</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                PATIENT SAFETY & DOSING
              </span>
            </div>
            <p className="text-xs text-slate-500">Cockcroft-Gault CrCl calculations, automated inpatient renal medication dose audits, and smart IV drip pump rates</p>
          </div>
        </div>

        <button
          onClick={() => fetchPatientRenalAudit(selectedPatientId)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Audit Medications</span>
        </button>
      </div>

      {/* Patient Selector for Inpatient Renal Audit */}
      <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Audit Inpatient Medication Chart:</span>
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
      </div>

      {/* Inpatient Renal Safety Audit Card */}
      {renalAudit && (
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Active Renal Dosing Safety Audit — {renalAudit.patient_name}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Calculated CrCl: <strong className="text-slate-900 font-mono">{renalAudit.renal_profile?.cockcroft_gault_crcl_ml_min} mL/min</strong> ({renalAudit.renal_profile?.ckd_stage})
              </p>
            </div>

            <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
              renalAudit.renal_dosing_alerts?.some(a => a.adjustment_needed) 
                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {renalAudit.renal_dosing_alerts?.filter(a => a.adjustment_needed).length} Dose Adjustments Advised
            </span>
          </div>

          <div className="space-y-3">
            {(renalAudit.renal_dosing_alerts || []).map((alert, ai) => (
              <div 
                key={ai}
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  alert.adjustment_needed 
                    ? 'bg-amber-50/80 border-amber-300 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm">{alert.medication}</span>
                    <span className="ml-2 text-slate-600">Current Dose: <strong>{alert.current_dosage}</strong></span>
                  </div>
                  {alert.adjustment_needed ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold font-mono text-[10px]">
                      ADJUSTMENT REQUIRED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold font-mono text-[10px]">
                      APPROPRIATE DOSE
                    </span>
                  )}
                </div>

                <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-teal-900 text-[11px]">Guideline Recommended Dosing (for CrCl {alert.crcl_calculated} mL/min):</div>
                  <p className="text-slate-800 font-semibold">{alert.guideline_recommended_dose}</p>
                </div>

                <p className="text-[11px] text-slate-500 font-mono"><strong>Monitoring:</strong> {alert.monitoring_parameters}</p>
              </div>
            ))}

            {(!renalAudit.renal_dosing_alerts || renalAudit.renal_dosing_alerts.length === 0) && (
              <div className="p-6 text-center text-slate-400 text-xs">
                No nephrotoxic or renally cleared medications currently prescribed for this patient.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Cockcroft-Gault Calculator & Smart IV Drip Pump Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Cockcroft-Gault Calculator */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Cockcroft-Gault Creatinine Clearance Calculator</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Age (Years)</label>
              <input
                type="number"
                value={calcForm.age}
                onChange={(e) => setCalcForm({ ...calcForm, age: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Actual Weight (kg)</label>
              <input
                type="number"
                value={calcForm.weight_kg}
                onChange={(e) => setCalcForm({ ...calcForm, weight_kg: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Biological Sex</label>
              <select
                value={calcForm.gender}
                onChange={(e) => setCalcForm({ ...calcForm, gender: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Male">Male (Factor 1.0)</option>
                <option value="Female">Female (Factor 0.85)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Serum Creatinine (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                value={calcForm.serum_creatinine_mg_dl}
                onChange={(e) => setCalcForm({ ...calcForm, serum_creatinine_mg_dl: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleCalculateRenal}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Compute Creatinine Clearance
          </button>

          {calcResult && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-1 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950">Estimated CrCl:</span>
                <span className="text-lg font-black text-indigo-700 font-mono">
                  {calcResult.cockcroft_gault_crcl_ml_min} mL/min
                </span>
              </div>
              <p className="text-indigo-900 font-semibold">{calcResult.ckd_stage}</p>
            </div>
          )}
        </div>

        {/* Right: Smart IV Infusion Titration Pump Calculator */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <HeartPulse className="w-4 h-4 text-pink-600" />
            <span>Smart IV Infusion Pump Titration Calculator</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Medication / Vasoactive Agent</label>
              <select
                value={ivForm.drug_name}
                onChange={(e) => setIvForm({ ...ivForm, drug_name: e.target.value })}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="Norepinephrine (Levophed)">Norepinephrine (Levophed) 4mg/250mL</option>
                <option value="Epinephrine Infusion">Epinephrine Infusion 4mg/250mL</option>
                <option value="Dopamine Infusion">Dopamine Infusion 400mg/250mL</option>
                <option value="Dobutamine Infusion">Dobutamine Infusion 250mg/250mL</option>
                <option value="Heparin Sodium Drip">Heparin Sodium Drip 25,000 units/250mL</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700">Weight (kg)</label>
                <input
                  type="number"
                  value={ivForm.patient_weight_kg}
                  onChange={(e) => setIvForm({ ...ivForm, patient_weight_kg: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Dose (mcg/kg/min)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ivForm.desired_dose_mcg_kg_min}
                  onChange={(e) => setIvForm({ ...ivForm, desired_dose_mcg_kg_min: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Bag Amount (mg)</label>
                <input
                  type="number"
                  value={ivForm.bag_amount_mg}
                  onChange={(e) => setIvForm({ ...ivForm, bag_amount_mg: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">Bag Vol (mL)</label>
                <input
                  type="number"
                  value={ivForm.bag_volume_ml}
                  onChange={(e) => setIvForm({ ...ivForm, bag_volume_ml: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCalculateIV}
            className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Compute Smart Pump Rate
          </button>

          {ivResult && (
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl space-y-1.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-pink-950">Pump Infusion Rate:</span>
                <span className="text-xl font-black text-pink-700 font-mono">
                  {ivResult.calculated_pump_rate_ml_hr} mL/hr
                </span>
              </div>
              <p className="text-[11px] text-pink-900 font-mono">{ivResult.double_check_formula}</p>
              <div className="text-[10px] text-slate-500 font-bold">⚠️ {ivResult.safety_verification}</div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
