import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Users, Award, FileText, CheckCircle, Clock, 
  Sparkles, Filter, ChevronRight, RefreshCw, Layers
} from 'lucide-react';

export default function ResearchCohortExplorer() {
  const [trials, setTrials] = useState([]);
  const [cohortResults, setCohortResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conditionFilter, setConditionFilter] = useState('Heart Failure');
  const [medFilter, setMedFilter] = useState('');
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(85);

  useEffect(() => {
    fetchTrials();
    handleSearchCohort();
  }, []);

  const fetchTrials = async () => {
    try {
      const res = await axios.get('/api/research/trials');
      setTrials(res.data || []);
    } catch (err) {
      console.error("Error fetching trials:", err);
    }
  };

  const handleSearchCohort = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/research/cohort-query', {
        condition_keyword: conditionFilter || undefined,
        medication_keyword: medFilter || undefined,
        min_age: parseInt(minAge) || undefined,
        max_age: parseInt(maxAge) || undefined
      });
      setCohortResults(res.data);
    } catch (err) {
      alert("Cohort search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Clinical Research & Retrospective Cohort Explorer</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                CLINICAL TRIALS
              </span>
            </div>
            <p className="text-xs text-slate-500">Synthetic clinical trial protocol screening, cohort analytics, and eligibility matching</p>
          </div>
        </div>

        <button
          onClick={handleSearchCohort}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Execute Query</span>
        </button>
      </div>

      {/* Query Filters Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>Cohort Search Parameters</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700">Condition Filter</label>
            <input
              type="text"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              placeholder="e.g. Heart Failure, Appendicitis..."
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Medication Filter</label>
            <input
              type="text"
              value={medFilter}
              onChange={(e) => setMedFilter(e.target.value)}
              placeholder="e.g. Lisinopril, Empagliflozin..."
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Min Age (Years)</label>
            <input
              type="number"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Max Age (Years)</label>
            <input
              type="number"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Cohort Matches & Active Clinical Trials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 Cols): Matched Patients Cohort */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-800">
              Matched Cohort Patients ({cohortResults?.total_matches || 0})
            </h3>
            <span className="text-xs text-slate-400 font-mono">HIPAA De-identified</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(cohortResults?.cohort || []).map((p) => (
              <div key={p.patient_id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{p.name} ({p.age}yo {p.gender})</span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded font-mono text-[10px] font-bold">
                    {p.mrn}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {p.conditions.map((c, ci) => (
                    <span key={ci} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="text-slate-600 text-[11px]">
                  <strong>Medications:</strong> {p.medications.join(', ') || 'None'}
                </div>
              </div>
            ))}
            {(!cohortResults?.cohort || cohortResults.cohort.length === 0) && (
              <div className="p-8 text-center text-slate-400 text-xs">No patients matching current criteria.</div>
            )}
          </div>
        </div>

        {/* Right (1 Col): Active Clinical Trials */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Active Hospital Clinical Trials</span>
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trials.map((t) => (
              <div key={t.trial_id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                <div className="font-bold text-slate-900">{t.title}</div>
                <div className="text-[10px] text-indigo-700 font-mono font-bold">{t.phase} • {t.trial_id}</div>
                <p className="text-[11px] text-slate-500">{t.sponsor}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>Enrolled: {t.current_enrolled} / {t.target_enrollment}</span>
                  <span className="text-emerald-700 font-bold">Recruiting</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
