import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Flame, ShieldAlert, HeartPulse, CheckCircle, Clock, 
  Activity, RefreshCw, AlertTriangle, Users, Check, ChevronRight, Zap
} from 'lucide-react';

export default function RapidResponseHub({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [eventType, setEventType] = useState('RAPID_RESPONSE_DETERIORATION');
  const [triggerReason, setTriggerReason] = useState('Acute physiological deterioration: NEWS2 score 8, SpO2 88% on 4L nasal cannula, SBP 86 mmHg.');
  const [loading, setLoading] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [resolveModalEvent, setResolveModalEvent] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('Patient stabilized at bedside with 30 mL/kg LR bolus and 100% Non-Rebreather mask. Transferred to Medical ICU Bed 04.');

  useEffect(() => {
    fetchEvents();
    fetchPatients();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/rapid-response/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error("Error fetching emergency events:", err);
    } finally {
      setLoading(false);
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

  const handleTriggerEmergency = async () => {
    if (!selectedPatientId || !triggerReason.trim()) return;
    try {
      const res = await axios.post('/api/rapid-response/trigger', {
        patient_id: selectedPatientId,
        event_type: eventType,
        caller_name: currentUser?.full_name || 'Staff RN Sarah Connor',
        trigger_reason: triggerReason
      });
      setBroadcastMsg(res.data.broadcast_message);
      setTimeout(() => setBroadcastMsg(''), 6000);
      fetchEvents();
    } catch (err) {
      alert("Emergency dispatch failed: " + err.message);
    }
  };

  const handleResolveEvent = async (eventId) => {
    try {
      await axios.post('/api/rapid-response/resolve', {
        event_id: eventId,
        resolved_by: currentUser?.full_name || 'Dr. Eleanor Rivera, MD',
        outcome_status: 'STABILIZED_AND_TRANSFERRED',
        outcome_notes: resolveNotes
      });
      setResolveModalEvent(null);
      fetchEvents();
    } catch (err) {
      alert("Failed to resolve event: " + err.message);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-red-400 rounded-2xl shadow-xs">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Rapid Response Team (RRT), Code Blue & Emergency Dispatch</h1>
              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[10px] font-mono font-bold">
                RESUSCITATION & PROTOCOLS
              </span>
            </div>
            <p className="text-xs text-slate-500">1-click emergency team activation, live ACLS/Sepsis resuscitation checklists, and ICU transfer tracking</p>
          </div>
        </div>

        <button
          onClick={fetchEvents}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {broadcastMsg && (
        <div className="p-4 bg-red-600 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 animate-bounce shadow-lg">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{broadcastMsg}</span>
        </div>
      )}

      {/* Grid: 1-Click Activation Panel & Active Emergency Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (5 Cols): Emergency Activation Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>1-Click Emergency Dispatch Trigger</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700">Target Inpatient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrn}) — {p.ward} ({p.room_bed})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Emergency Protocol Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="RAPID_RESPONSE_DETERIORATION">🚨 Rapid Response Team (RRT) — Acute Deterioration</option>
                <option value="CODE_BLUE_CARDIAC_ARREST">⚡ Code Blue — Cardiac / Respiratory Arrest</option>
                <option value="CODE_SEPSIS_BUNDLE">🦠 Code Sepsis — Severe Sepsis / Septic Shock</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Clinical Deterioration Reason & Bedside Vitals</label>
              <textarea
                rows={4}
                value={triggerReason}
                onChange={(e) => setTriggerReason(e.target.value)}
                placeholder="Describe acute vitals decline or nurse bedside concern..."
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500 leading-relaxed text-slate-800"
              />
            </div>
          </div>

          <button
            onClick={handleTriggerEmergency}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>DISPATCH RESUSCITATION TEAM NOW</span>
          </button>
        </div>

        {/* Right (7 Cols): Active Emergency Tickets & Checklists */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Emergency Resuscitation Tickets & Live Checklists ({events.length})</span>
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {events.map((ev) => {
              const isActive = ev.status === 'DISPATCHED_ACTIVE';
              return (
                <div 
                  key={ev.id}
                  className={`p-5 rounded-3xl border transition space-y-3 ${
                    isActive ? 'bg-red-50/80 border-red-400 shadow-md ring-2 ring-red-400/20' : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900">{ev.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          isActive ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ev.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Patient: <strong>{ev.patient_name}</strong> ({ev.mrn}) • Location: <strong>{ev.ward} ({ev.room_bed})</strong>
                      </p>
                    </div>

                    {isActive ? (
                      <button
                        onClick={() => setResolveModalEvent(ev)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                        <span>Log Bedside Resolution</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-800 font-bold">Resolved ({ev.resolved_at?.slice(11, 19)})</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-200/80">
                    <strong>Trigger Reason:</strong> {ev.trigger_reason} (Called by {ev.caller_name} at {ev.dispatched_at.slice(11, 19)})
                  </p>

                  {/* Resuscitation Checklist */}
                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-teal-400 text-[11px] uppercase flex items-center justify-between">
                      <span>Standard ACLS / Resuscitation Checklist:</span>
                      <span className="text-[10px] text-slate-400 font-mono">Team: {ev.team_dispatched.join(', ')}</span>
                    </div>
                    <div className="space-y-1 text-slate-300 text-[11px]">
                      {(ev.checklist || []).map((step, si) => (
                        <div key={si} className="leading-relaxed">{step}</div>
                      ))}
                    </div>
                  </div>

                  {ev.outcome_summary && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-semibold">
                      🏁 {ev.outcome_summary}
                    </div>
                  )}
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200 text-xs">
                No active emergency events or code tickets. Hospital floor is clear.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Resolution Modal */}
      {resolveModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Emergency Bedside Resolution</h3>
                <p className="text-xs text-slate-500">{resolveModalEvent.title} — {resolveModalEvent.patient_name}</p>
              </div>
              <button onClick={() => setResolveModalEvent(null)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Clinical Outcome & Transfer Notes:</label>
              <textarea
                rows={3}
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setResolveModalEvent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveEvent(resolveModalEvent.id)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
