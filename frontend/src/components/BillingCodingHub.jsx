import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BadgeDollarSign, FileText, CheckCircle, TrendingUp, Sparkles, 
  Layers, RefreshCw, AlertTriangle, ShieldCheck, DollarSign, Award
} from 'lucide-react';

export default function BillingCodingHub() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchBillingSummary(selectedPatientId);
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

  const fetchBillingSummary = async (patientId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/billing/summary/${patientId}`);
      setBillingData(res.data);
    } catch (err) {
      console.error("Error fetching billing summary:", err);
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
            <BadgeDollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Automated Clinical Coding, ICD-10/CPT & MS-DRG Billing</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                REVENUE CYCLE & CDI
              </span>
            </div>
            <p className="text-xs text-slate-500">Automated diagnosis-to-billing extraction, Medicare HCC risk adjustment, and documentation improvement tips</p>
          </div>
        </div>

        <button
          onClick={() => fetchBillingSummary(selectedPatientId)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Analyze</span>
        </button>
      </div>

      {/* Patient Selector */}
      <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Select Inpatient Case:</span>
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

      {/* Financial & DRG Metrics Banner */}
      {billingData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-slate-400 font-mono">Assigned MS-DRG</div>
            <div className="text-xl font-black text-slate-900 mt-1">{billingData.drg_classification?.ms_drg}</div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{billingData.drg_classification?.title}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-teal-600 font-mono">Estimated Reimbursement</div>
            <div className="text-2xl font-black text-teal-700 mt-1">{billingData.drg_classification?.estimated_reimbursement}</div>
            <p className="text-[11px] text-slate-500 mt-1">Relative Weight: <strong>{billingData.drg_classification?.relative_weight}</strong></p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-indigo-600 font-mono">Medicare HCC Score</div>
            <div className="text-2xl font-black text-indigo-700 mt-1">{billingData.drg_classification?.total_hcc_score}</div>
            <p className="text-[11px] text-slate-500 mt-1">Risk Adjusted Mortality & Complexity</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-emerald-600 font-mono">Documentation Score</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{billingData.compliance_audit?.documentation_integrity_score}%</div>
            <p className="text-[11px] text-slate-500 mt-1">{billingData.compliance_audit?.upcoding_risk}</p>
          </div>
        </div>
      )}

      {/* Main Grid: ICD-10 Codes, CPT Procedures & CDI Opportunities */}
      {billingData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: ICD-10 Diagnoses & CPT (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* ICD-10 Diagnoses */}
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Auto-Extracted ICD-10-CM Diagnosis Codes ({billingData.icd10_diagnoses?.length || 0})</span>
                </h3>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  Billable Diagnoses
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(billingData.icd10_diagnoses || []).map((code, ci) => (
                  <div key={ci} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-teal-300 font-mono font-bold rounded text-[11px]">
                          {code.code}
                        </span>
                        <strong className="text-slate-900">{code.description}</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Category: {code.category} • HCC Weight: {code.hcc_weight}</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg shrink-0">
                      Validated
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CPT Procedures */}
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Suggested CPT Procedural Codes & RVU Schedule</span>
                </h3>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(billingData.cpt_procedures || []).map((cpt, cpti) => (
                  <div key={cpti} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded text-[11px] border border-indigo-200">
                          CPT {cpt.code}
                        </span>
                        <strong className="text-slate-900">{cpt.description}</strong>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Relative Value Units (RVU): {cpt.rvu}</p>
                    </div>
                    <span className="font-black text-slate-900 text-xs shrink-0">
                      {cpt.fee_est}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: CDI Documentation Improvement (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Clinical Documentation Improvement (CDI)</span>
                </h3>
              </div>

              <div className="space-y-3">
                {(billingData.cdi_opportunities || []).map((cdi, cdii) => (
                  <div key={cdii} className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5 text-xs">
                    <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{cdi.query}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">{cdi.rationale}</p>
                    <div className="text-[10px] font-bold text-teal-800 bg-white p-2 rounded-xl border border-amber-200 mt-1">
                      💰 Impact: {cdi.impact}
                    </div>
                  </div>
                ))}

                {(!billingData.cdi_opportunities || billingData.cdi_opportunities.length === 0) && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    Documentation is fully specific with zero undercoding flags.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
