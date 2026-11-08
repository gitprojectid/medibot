import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Pill, AlertTriangle, CheckCircle, ShieldAlert, Zap, Plus, Trash2, 
  ArrowRight, Heart, Sparkles, BookOpen, AlertCircle, RefreshCw,
  Search, Shield, Check, Info, Apple, Activity, Flame
} from 'lucide-react';

const PRESET_COMBOS = [
  {
    name: 'Warfarin + Aspirin (Major Hemorrhage)',
    meds: ['Warfarin', 'Aspirin'],
    conditions: ['Hypertension'],
    allergies: [],
    pregnant: false,
    severity: 'major'
  },
  {
    name: 'Sildenafil + Nitroglycerin (Fatal Hypotension)',
    meds: ['Sildenafil', 'Nitroglycerin'],
    conditions: ['Angina'],
    allergies: [],
    pregnant: false,
    severity: 'contraindicated'
  },
  {
    name: 'Lisinopril + Spironolactone (Severe Hyperkalemia)',
    meds: ['Lisinopril', 'Spironolactone'],
    conditions: ['Hypertension', 'Heart Failure'],
    allergies: [],
    pregnant: false,
    severity: 'major'
  },
  {
    name: 'Penicillin Allergy vs Amoxicillin (Cross-Reactivity)',
    meds: ['Amoxicillin'],
    conditions: [],
    allergies: ['Penicillin'],
    pregnant: false,
    severity: 'contraindicated'
  },
  {
    name: 'Propranolol in Asthma (Bronchospasm Risk)',
    meds: ['Propranolol'],
    conditions: ['Asthma'],
    allergies: [],
    pregnant: false,
    severity: 'high'
  },
  {
    name: 'Lisinopril in Pregnancy (Teratogen Risk)',
    meds: ['Lisinopril'],
    conditions: ['Hypertension'],
    allergies: [],
    pregnant: true,
    severity: 'contraindicated'
  },
  {
    name: 'Simvastatin + Clarithromycin (Rhabdomyolysis)',
    meds: ['Simvastatin', 'Clarithromycin'],
    conditions: ['Hypercholesterolemia'],
    allergies: [],
    pregnant: false,
    severity: 'major'
  },
  {
    name: 'Safe Combination (Acetaminophen + Lisinopril)',
    meds: ['Acetaminophen', 'Lisinopril'],
    conditions: ['Hypertension'],
    allergies: [],
    pregnant: false,
    severity: 'safe'
  }
];

const COMMON_DRUGS = [
  'Warfarin', 'Aspirin', 'Lisinopril', 'Spironolactone', 'Sertraline', 
  'Tramadol', 'Metformin', 'Atorvastatin', 'Amoxicillin', 'Propranolol', 
  'Ibuprofen', 'Nitroglycerin', 'Sildenafil', 'Clopidogrel', 'Digoxin'
];

const COMMON_CONDITIONS = [
  'Hypertension', 'Asthma', 'Peptic Ulcer Disease', 'Chronic Kidney Disease', 
  'Heart Failure', 'Type 2 Diabetes', 'Coronary Artery Disease'
];

const COMMON_ALLERGIES = [
  'Penicillin', 'Sulfa Antibiotics', 'Aspirin / NSAIDs', 'Cephalosporins'
];

export default function MedicationChecker({ patientContext }) {
  const [medications, setMedications] = useState(patientContext?.medications || ['Lisinopril', 'Warfarin']);
  const [conditions, setConditions] = useState(patientContext?.conditions || ['Hypertension']);
  const [allergies, setAllergies] = useState(patientContext?.allergies || ['Penicillin']);
  const [isPregnant, setIsPregnant] = useState(patientContext?.is_pregnant || false);

  const [inputMed, setInputMed] = useState('');
  const [inputCond, setInputCond] = useState('');
  const [inputAllergy, setInputAllergy] = useState('');

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drugDatabase, setDrugDatabase] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDrugDatabase();
    runSafetyCheck(medications, conditions, allergies, isPregnant);
  }, []);

  const fetchDrugDatabase = async () => {
    try {
      const res = await axios.get('/api/medications/database');
      setDrugDatabase(res.data?.catalog || []);
    } catch (err) {
      console.error("Error fetching drug database:", err);
    }
  };

  const runSafetyCheck = async (meds = medications, conds = conditions, alls = allergies, preg = isPregnant) => {
    if (!meds || meds.length === 0) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/medications/check', {
        medications: meds,
        conditions: conds,
        allergies: alls,
        is_pregnant: preg
      });
      setResults(res.data);
    } catch (err) {
      console.error("Safety check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = (medName) => {
    const val = (medName || inputMed).trim();
    if (!val || medications.some(m => m.toLowerCase() === val.toLowerCase())) return;
    const updated = [...medications, val];
    setMedications(updated);
    setInputMed('');
    runSafetyCheck(updated, conditions, allergies, isPregnant);
  };

  const removeMedication = (index) => {
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated);
    runSafetyCheck(updated, conditions, allergies, isPregnant);
  };

  const addCondition = (condName) => {
    const val = (condName || inputCond).trim();
    if (!val || conditions.some(c => c.toLowerCase() === val.toLowerCase())) return;
    const updated = [...conditions, val];
    setConditions(updated);
    setInputCond('');
    runSafetyCheck(medications, updated, allergies, isPregnant);
  };

  const removeCondition = (index) => {
    const updated = conditions.filter((_, i) => i !== index);
    setConditions(updated);
    runSafetyCheck(medications, updated, allergies, isPregnant);
  };

  const addAllergy = (allergyName) => {
    const val = (allergyName || inputAllergy).trim();
    if (!val || allergies.some(a => a.toLowerCase() === val.toLowerCase())) return;
    const updated = [...allergies, val];
    setAllergies(updated);
    setInputAllergy('');
    runSafetyCheck(medications, conditions, updated, isPregnant);
  };

  const removeAllergy = (index) => {
    const updated = allergies.filter((_, i) => i !== index);
    setAllergies(updated);
    runSafetyCheck(medications, conditions, updated, isPregnant);
  };

  const togglePregnancy = () => {
    const updated = !isPregnant;
    setIsPregnant(updated);
    runSafetyCheck(medications, conditions, allergies, updated);
  };

  const applyPreset = (preset) => {
    setMedications(preset.meds);
    setConditions(preset.conditions);
    setAllergies(preset.allergies);
    setIsPregnant(preset.pregnant || false);
    runSafetyCheck(preset.meds, preset.conditions, preset.allergies, preset.pregnant || false);
  };

  const alerts = results?.alerts || [];
  const foodInteractions = results?.food_interactions || [];
  const hasMajorConflict = results?.has_major_conflict || false;
  const hasAlerts = results?.has_alerts || false;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Pharmacology & Medication Safety Engine</h1>
            <p className="text-xs text-slate-500">Multi-drug interaction matrix, allergy cross-reactivities, disease contraindications, and dietary warnings</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => runSafetyCheck()}
            disabled={loading || medications.length === 0}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing Pharmacology...' : 'Re-run Safety Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Preset High-Risk Clinical Combinations */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">1-Click Clinical Test Presets</h2>
          </div>
          <span className="text-xs text-slate-400">Click any scenario to test deterministic pharmacovigilance</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {PRESET_COMBOS.map((combo, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(combo)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs ${
                combo.severity === 'contraindicated' 
                  ? 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200' 
                  : (combo.severity === 'major' || combo.severity === 'high' 
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200')
              }`}
            >
              <Zap className="w-3 h-3 shrink-0" />
              <span>{combo.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Safety Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Medication, Condition, Allergy Selectors */}
        <div className="space-y-6">
          
          {/* Active Medications Manager */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Active Medications ({medications.length})</span>
              </h2>
            </div>

            {/* Input + Add */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. Warfarin, Aspirin, Lisinopril..."
                value={inputMed}
                onChange={(e) => setInputMed(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMedication()}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
              <button
                onClick={() => addMedication()}
                disabled={!inputMed.trim()}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 transition shadow-2xs"
                title="Add Medication"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Active Medication Chips */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {medications.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl text-xs font-bold text-teal-900">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span>{m}</span>
                  </div>
                  <button
                    onClick={() => removeMedication(idx)}
                    className="text-teal-400 hover:text-red-600 transition p-1"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {medications.length === 0 && (
                <div className="text-center py-4 text-slate-400 text-xs font-medium">No medications added.</div>
              )}
            </div>

            {/* Quick Add Pills */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Quick Add:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COMMON_DRUGS.filter(d => !medications.some(m => m.toLowerCase() === d.toLowerCase())).slice(0, 7).map((d) => (
                  <button
                    key={d}
                    onClick={() => addMedication(d)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-teal-100 text-slate-700 text-[11px] font-semibold rounded-md border border-slate-200 transition"
                  >
                    + {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Health Profile: Conditions, Allergies, Pregnancy */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Clinical Profile & Contraindication Filters</span>
            </h2>

            {/* Pregnancy Toggle */}
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-pink-900">Patient Is Currently Pregnant</span>
                <p className="text-[10px] text-pink-700">Screens for FDA Teratogens and fetal toxicity</p>
              </div>
              <button
                onClick={togglePregnancy}
                className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                  isPregnant ? 'bg-pink-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            {/* Documented Allergies */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                <span>Documented Drug Allergies</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa..."
                  value={inputAllergy}
                  onChange={(e) => setInputAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                  className="flex-1 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <button
                  onClick={() => addAllergy()}
                  disabled={!inputAllergy.trim()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allergies.map((a, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-lg flex items-center space-x-1">
                    <span>{a}</span>
                    <button onClick={() => removeAllergy(idx)} className="hover:text-red-950 font-bold ml-1">✕</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Diagnosed Conditions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Heart className="w-3.5 h-3.5 text-amber-500" />
                <span>Known Medical Conditions</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Asthma, Peptic Ulcer, CKD..."
                  value={inputCond}
                  onChange={(e) => setInputCond(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCondition()}
                  className="flex-1 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
                <button
                  onClick={() => addCondition()}
                  disabled={!inputCond.trim()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl disabled:opacity-50 text-xs font-bold"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {conditions.map((c, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg flex items-center space-x-1">
                    <span>{c}</span>
                    <button onClick={() => removeCondition(idx)} className="hover:text-amber-950 font-bold ml-1">✕</button>
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (2 COLUMNS SPAN): Comprehensive Pharmacology Safety Report */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Status Header Banner */}
          <div className={`p-6 rounded-3xl border shadow-card transition ${
            hasMajorConflict
              ? 'bg-red-500 text-white border-red-600'
              : (hasAlerts 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-emerald-600 text-white border-emerald-700')
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-white/20 rounded-2xl">
                  {hasMajorConflict ? <AlertTriangle className="w-7 h-7 animate-bounce" /> : (hasAlerts ? <AlertCircle className="w-7 h-7" /> : <CheckCircle className="w-7 h-7" />)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold opacity-80 font-mono">Pharmacological Safety Status</div>
                  <h2 className="text-lg font-black mt-0.5">
                    {hasMajorConflict 
                      ? `CRITICAL CONFLICTS DETECTED (${alerts.length} Warnings)` 
                      : (hasAlerts 
                        ? `MODERATE CLINICAL PRECAUTIONS (${alerts.length} Alerts)` 
                        : 'SAFE PHARMACOLOGICAL PROFILE (0 Conflicts)')}
                  </h2>
                  <p className="text-xs opacity-90 mt-1">
                    {hasMajorConflict 
                      ? 'Severe pharmacokinetic/pharmacodynamic conflicts identified. Do NOT co-administer without physician intervention.' 
                      : (hasAlerts 
                        ? 'Potential interactions or contraindications present. Clinical monitoring recommended.' 
                        : 'No direct drug-drug interactions, allergy conflicts, or disease contraindications detected for this combination.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conflict Alert Cards Stream */}
          {alerts.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span>Identified Clinical Conflicts & Pharmacological Warnings</span>
              </h3>

              <div className="space-y-4 pt-1">
                {alerts.map((alert, idx) => {
                  const isSevere = alert.severity === 'contraindicated' || alert.severity === 'major' || alert.severity === 'high';
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border transition space-y-2.5 ${
                        isSevere 
                          ? 'bg-red-50/70 border-red-200' 
                          : 'bg-amber-50/70 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase font-mono border ${
                          isSevere ? 'bg-red-600 text-white border-red-700' : 'bg-amber-600 text-white border-amber-700'
                        }`}>
                          {alert.type} • {alert.severity}
                        </span>
                        {alert.drugs && (
                          <div className="flex space-x-1">
                            {alert.drugs.map((d, di) => (
                              <span key={di} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 text-[10px] font-bold rounded-md">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900 leading-snug">{alert.message}</div>

                      {alert.recommendation && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                          <strong className="text-teal-700 flex items-center space-x-1 font-bold text-[11px]">
                            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                            <span>Clinical Mitigation & Guidance:</span>
                          </strong>
                          <p className="leading-relaxed">{alert.recommendation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Food, Diet & Dietary Supplement Warnings */}
          {foodInteractions.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Apple className="w-4 h-4 text-emerald-600" />
                <span>Food, Dietary & Lifestyle Interaction Safeguards</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {foodInteractions.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-900">{item.drug}</strong>
                      <span className="text-[10px] text-slate-400 font-medium">{item.class}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong className="text-amber-800">Dietary Note:</strong> {item.food_interaction}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <strong>Clinical Monitoring:</strong> {item.monitoring}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Pharmacology Reference Cards */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Active Drug Pharmacology Profiles ({medications.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Lexicomp / FDA Reference Catalog</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {medications.map((medName) => {
                const drugMeta = drugDatabase.find(d => d.name.toLowerCase() === medName.toLowerCase());
                return (
                  <div key={medName} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">{medName}</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 font-mono">
                        {drugMeta?.class || 'Standard Agent'}
                      </span>
                    </div>

                    {drugMeta ? (
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <p><strong>Indications:</strong> {drugMeta.indications?.join(', ')}</p>
                        <p><strong>Monitoring:</strong> {drugMeta.monitoring}</p>
                        {drugMeta.common_brands && (
                          <p className="text-[11px] text-slate-400">Brand Names: {drugMeta.common_brands.join(', ')}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Clinical profile active in pharmacology checking matrix.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
