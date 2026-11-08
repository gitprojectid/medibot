import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, AlertTriangle, ShieldAlert, CheckCircle, Clock, 
  Activity, RefreshCw, Radio, Check, ChevronRight, Zap
} from 'lucide-react';

export default function ClinicalAlertsCenter({ currentUser }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [ackModalAlert, setAckModalAlert] = useState(null);
  const [actionNote, setActionNote] = useState('Attending reviewed at bedside. Therapy adjusted.');

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Poll alerts every 3 seconds
  useEffect(() => {
    if (!isLivePolling) return;
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLivePolling]);

  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get('/api/alerts/active');
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.post('/api/alerts/acknowledge', {
        alert_id: alertId,
        clinician_name: currentUser?.full_name || 'Dr. Attending Physician, MD',
        action_taken: actionNote
      });
      setAckModalAlert(null);
      fetchAlerts(true);
    } catch (err) {
      alert("Acknowledgement failed: " + err.message);
    }
  };

  const unackCount = alerts.filter(a => !a.is_acknowledged).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-red-400 rounded-2xl shadow-xs">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Hospital-Wide Real-Time Clinical Alerts & Rapid Response</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                unackCount > 0 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {unackCount} ACTIVE UNACKNOWLEDGED
              </span>
            </div>
            <p className="text-xs text-slate-500">Real-time physiological deterioration (NEWS2 ≥ 5), critical lab alerts, and rapid clinical escalation</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
              isLivePolling 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLivePolling ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isLivePolling ? 'Real-Time Stream (3s): ACTIVE' : 'Stream: PAUSED'}</span>
          </button>

          <button
            onClick={() => fetchAlerts(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts Stream List */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isAck = alert.is_acknowledged;

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-3xl border transition space-y-3 ${
                !isAck
                  ? (isCritical ? 'bg-red-50/70 border-red-400 shadow-md ring-2 ring-red-400/20' : 'bg-amber-50/70 border-amber-400 shadow-xs')
                  : 'bg-white border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl ${isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-slate-900">{alert.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                        isCritical ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Patient: <strong className="text-slate-900">{alert.patient_name}</strong> ({alert.mrn}) • Location: <strong>{alert.ward} ({alert.room_bed})</strong>
                    </p>
                  </div>
                </div>

                {isAck ? (
                  <div className="text-right text-xs text-emerald-800 flex items-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Acknowledged by {alert.acknowledged_by} ({alert.acknowledged_at?.slice(11, 19)})</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setAckModalAlert(alert)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>1-Click Acknowledge & Act</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/80 rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-700">Clinical Presentation / Findings:</div>
                  <p className="text-slate-600 font-mono text-[11px]">{alert.description}</p>
                </div>

                <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-1">
                  <div className="font-bold text-teal-900 flex items-center space-x-1">
                    <Zap className="w-3.5 h-3.5 text-teal-600" />
                    <span>Evidence-Based Immediate Protocol:</span>
                  </div>
                  <p className="text-teal-950 font-semibold">{alert.recommended_action}</p>
                </div>
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs">No active critical alerts across hospital wards. All patients clinically stable.</p>
          </div>
        )}
      </div>

      {/* Acknowledgment Modal */}
      {ackModalAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Acknowledge & Record Bedside Action</h3>
                <p className="text-xs text-slate-500">{ackModalAlert.title} — {ackModalAlert.patient_name}</p>
              </div>
              <button onClick={() => setAckModalAlert(null)} className="text-slate-400 hover:text-slate-700 text-xs">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Bedside Clinical Intervention Taken:</label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setAckModalAlert(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAcknowledge(ackModalAlert.id)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Confirm Acknowledgment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
