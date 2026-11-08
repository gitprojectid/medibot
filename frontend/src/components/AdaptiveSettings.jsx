import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sliders, Shield, Cpu, RefreshCw, CheckCircle, AlertTriangle, 
  Layers, Lock, Server, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function AdaptiveSettings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingFlag, setSavingFlag] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/adaptive/config');
      setConfig(res.data);
    } catch (err) {
      console.error("Error fetching adaptive config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (flagName, currentValue) => {
    setSavingFlag(flagName);
    try {
      await axios.post('/api/adaptive/flags/toggle', {
        flag_name: flagName,
        enabled: !currentValue
      });
      fetchConfig();
    } catch (err) {
      alert("Failed to toggle flag: " + err.message);
    } finally {
      setSavingFlag('');
    }
  };

  const handleSetEnvironment = async (envName) => {
    try {
      await axios.post('/api/adaptive/environment/set', {
        environment_name: envName
      });
      fetchConfig();
    } catch (err) {
      alert("Failed to set environment: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Adaptive System Configuration & Feature Flags</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                SYSTEM MLOPS
              </span>
            </div>
            <p className="text-xs text-slate-500">Modular capability toggling, deployment environment level routing, and fail-safe safety controls</p>
          </div>
        </div>

        <button
          onClick={fetchConfig}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Config</span>
        </button>
      </div>

      {/* Deployment Environment Tier Selector */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Server className="w-4 h-4 text-teal-600" />
              <span>Deployment Environment Level</span>
            </h2>
            <p className="text-xs text-slate-500">Controls data boundaries, synthetic vs production EHR routing, and clinical safety thresholds</p>
          </div>
          <span className="px-3 py-1 bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-mono font-black">
            CURRENT: {config?.deployment_environment || 'CLINICAL-SANDBOX'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {["DEVELOPMENT", "TEST", "STAGING", "CLINICAL-SANDBOX", "PILOT", "PRODUCTION"].map((env) => {
            const isSelected = config?.deployment_environment === env;
            return (
              <button
                key={env}
                onClick={() => handleSetEnvironment(env)}
                className={`p-3 rounded-2xl border text-center text-xs font-bold transition font-mono ${
                  isSelected 
                    ? 'bg-slate-900 text-teal-300 border-slate-800 shadow-md ring-2 ring-teal-500/20' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {env}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Feature Flags Grid */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Adaptive AI Feature Flags ({config?.total_active_features || 0} Active)</span>
            </h2>
            <p className="text-xs text-slate-500">High-risk AI features can be enabled or disabled modularly without downtime</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {Object.entries(config?.flags || {}).map(([flag, isEnabled]) => (
            <div 
              key={flag}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 font-mono text-[11px]">{flag}</div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isEnabled ? 'Module Active in inference pipeline' : 'Disabled / Offline'}
                </p>
              </div>

              <button
                onClick={() => handleToggleFlag(flag, isEnabled)}
                disabled={savingFlag === flag}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono text-[10px] transition border ${
                  isEnabled 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                    : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}
              >
                {isEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
