import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, Users, Bed, Activity, AlertTriangle, Droplet, 
  TrendingUp, RefreshCw, Clock, Flame, Shield, CheckCircle, Zap, Radio, Bell,
  UserPlus, UserMinus, Plus
} from 'lucide-react';

export default function HospitalCommandCenter() {
  const [opsData, setOpsData] = useState(null);
  const [activityStream, setActivityStream] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLiveOps, setIsLiveOps] = useState(true);
  const [horizon, setHorizon] = useState('horizon_24h'); // 'horizon_6h' | 'horizon_24h' | 'horizon_7d'
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchOperations();
    fetchActivityStream();
  }, []);

  // Real-time operations polling (every 4 seconds)
  useEffect(() => {
    if (!isLiveOps) return;
    const interval = setInterval(() => {
      fetchOperations(true);
      fetchActivityStream();
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveOps]);

  const fetchOperations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get('/api/operations/dashboard');
      setOpsData(res.data);
    } catch (err) {
      console.error("Error fetching operations dashboard:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchActivityStream = async () => {
    try {
      const res = await axios.get('/api/operations/activity-stream');
      setActivityStream(res.data || []);
    } catch (err) {
      console.error("Error fetching activity stream:", err);
    }
  };

  const handleAdmitBed = async (deptId, deptName) => {
    try {
      await axios.post('/api/operations/admit', { department_id: deptId });
      setActionMessage(`Patient admitted to ${deptName}. Occupancy updated.`);
      setTimeout(() => setActionMessage(''), 3500);
      fetchOperations(true);
    } catch (err) {
      alert("Admission failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDischargeBed = async (deptId, deptName) => {
    try {
      await axios.post('/api/operations/discharge', { department_id: deptId });
      setActionMessage(`Patient discharged from ${deptName}. Bed released.`);
      setTimeout(() => setActionMessage(''), 3500);
      fetchOperations(true);
    } catch (err) {
      alert("Discharge failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const currentHorizon = opsData?.bed_forecast?.[horizon];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Multi-Hospital Command Center & Real-Time Operations</h1>
              <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE DATABASE CENSUS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">{opsData?.hospital_name || 'Metro Health Academic Medical Center'} • Real-time bed management, ED queues, and resource capacity forecasting</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLiveOps(!isLiveOps)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
              isLiveOps 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveOps ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isLiveOps ? 'Live Census: ACTIVE (4s)' : 'Live Census: PAUSED'}</span>
          </button>

          <button
            onClick={() => {
              fetchOperations();
              fetchActivityStream();
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Census Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
          <div className="text-xs font-bold uppercase text-slate-400 font-mono">Total Licensed Beds</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{opsData?.summary?.total_beds || 650} Beds</div>
          <p className="text-[11px] text-slate-500 mt-1">Available: <strong>{opsData?.summary?.available_beds || 0} Beds</strong></p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
          <div className="text-xs font-bold uppercase text-teal-600 font-mono">Hospital Occupancy Rate</div>
          <div className="text-2xl font-black text-teal-700 mt-1">{opsData?.summary?.occupancy_rate_pct || 88.0}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Admissions (24h): +{opsData?.summary?.admissions_last_24h || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
          <div className="text-xs font-bold uppercase text-red-500 font-mono">ICU Critical Occupancy</div>
          <div className="text-2xl font-black text-red-600 mt-1">{opsData?.summary?.icu_occupancy_pct || 88.9}%</div>
          <p className="text-[11px] text-slate-500 mt-1">40 / 45 ICU Beds Occupied</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
          <div className="text-xs font-bold uppercase text-indigo-600 font-mono">Emergency Dept Wait Time</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{opsData?.summary?.ed_average_wait_minutes || 24} min</div>
          <p className="text-[11px] text-slate-500 mt-1">Active Patients: {opsData?.summary?.ed_active_patients || 0}</p>
        </div>
      </div>

      {/* Multi-Horizon Predictive Bed Capacity Card */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Predictive Bed Capacity & Inflow/Outflow Forecaster</span>
            </h2>
            <p className="text-xs text-slate-500">AI forecasting model predicting admissions, planned discharges, and ICU demand over multiple horizons</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold space-x-1">
            <button
              onClick={() => setHorizon('horizon_6h')}
              className={`px-3 py-1 rounded-lg transition ${horizon === 'horizon_6h' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Next 6 Hours
            </button>
            <button
              onClick={() => setHorizon('horizon_24h')}
              className={`px-3 py-1 rounded-lg transition ${horizon === 'horizon_24h' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Next 24 Hours
            </button>
            <button
              onClick={() => setHorizon('horizon_7d')}
              className={`px-3 py-1 rounded-lg transition ${horizon === 'horizon_7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Next 7 Days
            </button>
          </div>
        </div>

        {currentHorizon && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Projected Admissions</div>
              <div className="text-lg font-black text-slate-900 mt-1">+{currentHorizon.projected_admissions} Patients</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Projected Discharges</div>
              <div className="text-lg font-black text-emerald-700 mt-1">-{currentHorizon.projected_discharges} Discharges</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Net Bed Balance</div>
              <div className="text-lg font-black text-teal-800 mt-1">{currentHorizon.net_bed_change}</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Predicted ICU Demand</div>
              <div className="text-lg font-black text-red-600 mt-1">{currentHorizon.icu_demand} Beds</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Surge Risk Level</div>
              <div className="text-lg font-black text-amber-600 mt-1">{currentHorizon.surge_risk}</div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Department Census & Live Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Department Census with Real Bed Allocation Actions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Bed className="w-4 h-4 text-indigo-600" />
              <span>Department Bed Census & Live Allocation</span>
            </h2>
            <span className="text-xs text-slate-400">Click actions to allocate/release beds live</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-2.5">Department</th>
                  <th className="pb-2.5">Beds (Occ / Tot)</th>
                  <th className="pb-2.5">Occupancy %</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Live Bed Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(opsData?.departments || []).map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-bold text-slate-800">{d.name}</td>
                    <td className="py-3 font-mono">{d.occupied} / {d.total_beds} ({d.available} free)</td>
                    <td className="py-3">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{d.occupancy_pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${d.occupancy_pct >= 90 ? 'bg-red-500' : (d.occupancy_pct >= 80 ? 'bg-amber-500' : 'bg-teal-500')}`} style={{ width: `${d.occupancy_pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        d.status === 'Surge Protocol' ? 'bg-red-50 text-red-700 border border-red-200' :
                        (d.status === 'Near Capacity' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleAdmitBed(d.id || d.name, d.name)}
                          disabled={d.available <= 0}
                          title="Admit Inpatient (+1 Bed Occupied)"
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                        >
                          <UserPlus className="w-3 h-3 text-teal-400" />
                          <span>Admit</span>
                        </button>

                        <button
                          onClick={() => handleDischargeBed(d.id || d.name, d.name)}
                          disabled={d.occupied <= 0}
                          title="Discharge Inpatient (-1 Bed Freed)"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                        >
                          <UserMinus className="w-3 h-3 text-emerald-600" />
                          <span>Discharge</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Real-time Live Operations Feed */}
        <div className="space-y-6">
          
          {/* Live Activity Feed */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <span>Live Hospital Activity Stream</span>
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Live Feed
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {activityStream.map((act) => (
                <div key={act.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{act.dept}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.time}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{act.message}</p>
                  <div className="flex items-center space-x-1.5 pt-0.5">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase font-mono ${
                      act.urgency === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      (act.urgency === 'URGENT' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')
                    }`}>
                      {act.type} • {act.urgency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blood Bank Quick View */}
          <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <Droplet className="w-4 h-4 text-red-500" />
                <span>Blood Bank Inventory</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Adequate</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {(opsData?.blood_bank?.inventory || []).slice(0, 4).map((b, bi) => (
                <div key={bi} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div className="font-extrabold text-slate-900">{b.group}</div>
                  <div className="font-mono text-slate-700 text-[11px] font-bold mt-0.5">{b.units_available} Units</div>
                  <div className="text-[10px] text-slate-400">{b.days_of_supply}d reserve</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
