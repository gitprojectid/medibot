import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Stethoscope, AlertTriangle, CheckCircle, FileText, Activity, 
  User, RefreshCw, Send, Sparkles, ChevronRight, Clock, Shield
} from 'lucide-react';

export default function ClinicianDashboard({ currentUser }) {
  const [escalations, setEscalations] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetail, setCaseDetail] = useState(null);
  const [summary, setSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [clinicianNote, setClinicianNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/clinician/escalations');
      setEscalations(res.data);
      if (res.data.length > 0 && !selectedCase) {
        setSelectedCase(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching escalations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetail = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/clinician/cases/${id}`);
      setCaseDetail(res.data);
      setSummary('');
    } catch (err) {
      console.error("Case detail error:", err);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  useEffect(() => {
    if (selectedCase) {
      fetchCaseDetail(selectedCase);
    }
  }, [selectedCase]);

  const handleGenerateSummary = async (format = 'soap') => {
    if (!selectedCase) return;
    setGeneratingSummary(true);
    try {
      const res = await axios.post(`/api/clinician/cases/${selectedCase}/summarize?format_type=${format}`);
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Summary generation error:", err);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedCase || !clinicianNote.trim()) return;
    setSavingNote(true);
    try {
      await axios.post(`/api/clinician/cases/${selectedCase}/notes`, {
        note_content: clinicianNote,
        resolved: true
      });
      setClinicianNote('');
      fetchEscalations();
      fetchCaseDetail(selectedCase);
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-sky-400 rounded-2xl shadow-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Physician Review & Clinical Triage Portal</h1>
            <p className="text-xs text-slate-500">Supervisory review queue for high-risk triage cases, transcripts, and AI SOAP clinical documentation</p>
          </div>
        </div>

        <button
          onClick={fetchEscalations}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-1 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Escalations Queue */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Pending Escalations ({escalations.length})</span>
            </h2>
            <span className="text-[10px] font-bold uppercase text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              Active Triage
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {escalations.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  selectedCase === c.id 
                    ? 'bg-sky-50/70 border-sky-400 shadow-xs' 
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    c.triage_level >= 4 ? 'bg-red-100 text-red-800' :
                    (c.triage_level === 3 ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800')
                  }`}>
                    Level {c.triage_level} Triage
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-800">{c.patient_name}</div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{c.reason}</p>
              </div>
            ))}

            {escalations.length === 0 && !loading && (
              <div className="p-8 text-center text-xs text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No active escalations requiring physician review.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Case Details, AI SBAR/SOAP Scribe, and Notes */}
        <div className="lg:col-span-2 space-y-6">
          {caseDetail ? (
            <div className="space-y-6">
              
              {/* Patient Snapshot Banner */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">{caseDetail.patient?.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Age: {caseDetail.patient?.age || 'N/A'} • Sex: {caseDetail.patient?.sex || 'N/A'} • Case ID: {caseDetail.escalation?.id?.slice(0, 8)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                    Triage Level {caseDetail.escalation?.triage_level}
                  </span>
                </div>

                {/* Clinical Context Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Conditions</span>
                    <div className="font-semibold text-slate-800 mt-0.5 truncate">
                      {caseDetail.patient?.conditions?.join(', ') || 'None'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Medications</span>
                    <div className="font-semibold text-slate-800 mt-0.5 truncate">
                      {caseDetail.patient?.medications?.join(', ') || 'None'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Allergies</span>
                    <div className="font-semibold text-slate-800 mt-0.5 truncate">
                      {caseDetail.patient?.allergies?.join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Clinical Summary (SOAP Format) */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-800">AI SOAP / SBAR Medical Scribe</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGenerateSummary('soap')}
                      disabled={generatingSummary}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      {generatingSummary ? 'Synthesizing...' : 'Generate SOAP Summary'}
                    </button>
                    <button
                      onClick={() => handleGenerateSummary('sbar')}
                      disabled={generatingSummary}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                    >
                      Generate SBAR Note
                    </button>
                  </div>
                </div>

                {summary ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs whitespace-pre-wrap font-mono leading-relaxed text-slate-800">
                    {summary}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Click above to have Ollama 3B automatically generate a standardized SOAP (Subjective, Objective, Assessment, Plan) summary from this consultation.
                  </div>
                )}
              </div>

              {/* Consultation Transcript & Clinician Action */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Patient Chat Transcript</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  {caseDetail.transcript?.map((m, i) => (
                    <div key={i} className={`p-2.5 rounded-xl ${m.role === 'user' ? 'bg-teal-50 text-teal-900' : 'bg-white text-slate-800 border border-slate-200'}`}>
                      <span className="font-bold uppercase text-[10px] opacity-75">{m.role}: </span>
                      <span>{m.content}</span>
                    </div>
                  ))}
                </div>

                {/* Clinician Resolution Form */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700">Physician Clinical Orders & Notes</label>
                  <textarea
                    rows="3"
                    value={clinicianNote}
                    onChange={(e) => setClinicianNote(e.target.value)}
                    placeholder="Enter physician assessment, direct care instructions, or disposition note..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !clinicianNote.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    {savingNote ? 'Recording Note...' : 'Record Note & Resolve Escalation'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl shadow-card border border-slate-200 text-center text-xs text-slate-400">
              Select an escalation case from the queue on the left to inspect patient details and generate clinical summaries.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
