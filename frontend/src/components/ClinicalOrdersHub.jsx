import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ClipboardList, CheckCircle, Clock, Zap, AlertTriangle, 
  Sparkles, RefreshCw, Layers, ShieldCheck, ChevronRight, Check
} from 'lucide-react';

export default function ClinicalOrdersHub({ currentUser }) {
  const [bundles, setBundles] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executingBundleId, setExecutingBundleId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchBundles();
    fetchPatients();
    fetchOrders();
  }, []);

  const fetchBundles = async () => {
    try {
      const res = await axios.get('/api/orders/bundles');
      setBundles(res.data || []);
    } catch (err) {
      console.error("Error fetching bundles:", err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/doctor/patients');
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/orders/all');
      setActiveOrders(res.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteBundle = async (bundleId, bundleName) => {
    if (!selectedPatientId) return;
    setExecutingBundleId(bundleId);
    try {
      const res = await axios.post('/api/orders/execute-bundle', {
        bundle_id: bundleId,
        patient_id: selectedPatientId,
        ordering_physician: currentUser?.full_name || 'Dr. Eleanor Rivera, MD (Attending)'
      });
      setSuccessMsg(`Executed ${res.data.orders_count} orders for ${bundleName}! Dispatched to Nursing & Pharmacy.`);
      setTimeout(() => setSuccessMsg(''), 4500);
      fetchOrders();
    } catch (err) {
      alert("Order execution failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setExecutingBundleId('');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.post('/api/orders/complete', {
        order_id: orderId,
        completed_by: currentUser?.full_name || 'Nurse Staff, RN'
      });
      fetchOrders();
    } catch (err) {
      alert("Failed to complete order: " + err.message);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Rapid Clinical Order Sets (CPOE) & Order Fulfillment</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                1-CLICK BUNDLE EXECUTION
              </span>
            </div>
            <p className="text-xs text-slate-500">Guideline-directed clinical order sets for immediate emergency and inpatient resuscitation</p>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Target Patient Selector */}
      <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Target Inpatient for Orders:</span>
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
              <p className="text-[11px] text-slate-500 mt-0.5">{p.mrn} • {p.ward} ({p.room_bed})</p>
            </button>
          ))}
        </div>
      </div>

      {/* Grid: 1-Click Order Bundles & Active Orders Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Guideline Order Bundles */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Guideline-Directed Clinical Order Sets</span>
          </h2>

          <div className="space-y-4">
            {bundles.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{b.name}</h3>
                    <p className="text-[11px] text-indigo-700 font-mono font-bold mt-0.5">{b.clinical_guideline}</p>
                    <p className="text-xs text-slate-500 mt-1">Indication: {b.indication}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono ${
                    b.urgency.includes('STAT') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {b.urgency}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 text-[11px] uppercase">Included Order Elements ({b.orders.length}):</div>
                  {b.orders.map((ord, oi) => (
                    <div key={oi} className="text-slate-600 flex items-start space-x-1.5">
                      <span className="text-teal-600 font-bold">•</span>
                      <span><strong>[{ord.type}]</strong> {ord.name} — <em className="text-slate-500">{ord.details}</em></span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleExecuteBundle(b.id, b.name)}
                  disabled={executingBundleId === b.id}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {executingBundleId === b.id 
                      ? 'Dispatching Orders...' 
                      : `1-Click Execute Bundle for ${selectedPatient?.name || 'Selected Patient'}`}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Dispatched Orders Queue */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-indigo-600" />
              <span>Active Dispatched Hospital Orders ({activeOrders.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Nursing eMAR Queue</span>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto">
            {activeOrders.map((ord) => {
              const isCompleted = ord.status === 'COMPLETED';
              return (
                <div 
                  key={ord.id}
                  className={`p-4 rounded-2xl border transition space-y-2 text-xs ${
                    isCompleted ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-teal-50/50 border-teal-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[9px] font-bold uppercase font-mono mr-1.5">
                        {ord.order_type}
                      </span>
                      <strong className="text-slate-900">{ord.order_name}</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Patient: <strong>{ord.patient_name}</strong> ({ord.patient_mrn}) • {ord.room_bed}
                      </p>
                    </div>

                    {isCompleted ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCompleteOrder(ord.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1"
                      >
                        <Check className="w-3 h-3 text-teal-400" />
                        <span>Mark Administered</span>
                      </button>
                    )}
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">{ord.clinical_details}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                    <span>Ordered: {ord.created_at.slice(11, 19)} by {ord.ordering_physician}</span>
                    {isCompleted && <span>By {ord.completed_by}</span>}
                  </div>
                </div>
              );
            })}

            {activeOrders.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active orders in hospital queue. Execute a bundle above to dispatch orders.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
