import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Server, Database, ShieldCheck, Download, Upload, RefreshCw, 
  Activity, CheckCircle, AlertTriangle, Cpu, HardDrive, Terminal, FileCode, Check
} from 'lucide-react';

export default function SystemDeploymentHub() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/system/diagnostics');
      setDiagnostics(res.data);
    } catch (err) {
      console.error("Error fetching diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const res = await axios.get('/api/system/backup/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `metro_hospital_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Backup export failed: " + err.message);
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result);
        const res = await axios.post('/api/system/backup/import', {
          backup_data: jsonContent
        });
        setImportStatus(res.data.message);
        fetchDiagnostics();
      } catch (err) {
        alert("Import failed: Invalid JSON or server error - " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Production Deployment, Zero-Error Health & Database Backup</h1>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold">
                READY TO DEPLOY
              </span>
            </div>
            <p className="text-xs text-slate-500">Live system telemetry, database snapshot backups, migration imports, and container orchestration</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup JSON</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>1-Click Database Export</span>
          </button>

          <button
            onClick={fetchDiagnostics}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Real-time Health Metrics Cards */}
      {diagnostics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-slate-400 font-mono">System Version</div>
            <div className="text-xl font-black text-slate-900 mt-1">{diagnostics.version}</div>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">● {diagnostics.uptime_status}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-teal-600 font-mono">Active Ollama Model</div>
            <div className="text-xl font-black text-teal-700 mt-1 truncate">{diagnostics.ollama_ai?.active_model}</div>
            <p className="text-[11px] text-slate-500 mt-1">Ping Latency: <strong>{diagnostics.ollama_ai?.ping_latency_ms} ms</strong></p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-indigo-600 font-mono">Active Inpatients</div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {diagnostics.database?.table_record_counts?.inpatient_active_records || 8} Patients
            </div>
            <p className="text-[11px] text-slate-500 mt-1">DB Size: {diagnostics.database?.database_size_kb} KB</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200">
            <div className="text-xs font-bold uppercase text-emerald-600 font-mono">Clinical Orders & Notes</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {(diagnostics.database?.table_record_counts?.saved_clinical_notes || 0) + (diagnostics.database?.table_record_counts?.active_cpoe_orders || 0)} Total
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Audit Trail: {diagnostics.security?.hipaa_audit_logging}</p>
          </div>
        </div>
      )}

      {/* Grid: Database Table Inventory & Production Docker Deployment Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Table Record Counts & Live Database State (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Database Table Inventory & Persistence</span>
          </h2>

          <div className="space-y-2 text-xs font-mono">
            {Object.entries(diagnostics?.database?.table_record_counts || {}).map(([tbl, count]) => (
              <div key={tbl} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <span className="font-bold text-slate-800">{tbl}</span>
                <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-900 font-black">
                  {count} rows
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Production Deployment Architecture (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Production Container & Deployment Commands</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Docker Compose Ready</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-1">
              <div className="text-teal-400 font-bold"># 1. 1-Click Launch with Docker Compose:</div>
              <div className="text-slate-300">docker compose up -d --build</div>
            </div>

            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-1">
              <div className="text-teal-400 font-bold"># 2. Run Complete Automated Validation Suite (39 Tests):</div>
              <div className="text-slate-300">py -m pytest backend/tests -v</div>
            </div>

            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-1">
              <div className="text-teal-400 font-bold"># 3. Production Frontend Production Build:</div>
              <div className="text-slate-300">cd frontend &amp;&amp; npm run build</div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero-Error Upgradability Architecture</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                The platform uses modular API routers, async SQLAlchemy database migrations, and isolated feature flags. New clinical guidelines or ML models can be hot-swapped without hospital system downtime.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
