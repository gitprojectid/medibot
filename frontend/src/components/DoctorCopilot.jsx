import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Stethoscope, User, Activity, FileText, CheckCircle, Clock, 
  AlertTriangle, BookOpen, RefreshCw, ChevronRight, Shield, HeartPulse,
  Sparkles, Check, Download, Layers, TrendingUp, Radio, Zap, Plus, UserPlus
} from 'lucide-react';

export default function DoctorCopilot({ currentUser }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-001');
  const [patientDetail, setPatientDetail] = useState(null);
  const [soapDraft, setSoapDraft] = useState(null);
  const [physicianNotes, setPhysicianNotes] = useState('');
  const [generatingSoap, setGeneratingSoap] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [signedStatus, setSignedStatus] = useState('');
  const [fhirBundle, setFhirBundle] = useState(null);
  const [activeTab, setActiveTab] = useState('soap'); // 'soap' | 'timeline' | 'labs' | 'fhir' | 'chart_vitals' | 'add_patient'
  
  // Real-time live telemetry state
  const [isLiveTelemetry, setIsLiveTelemetry] = useState(true);
  const [liveTelemetry, setLiveTelemetry] = useState(null);

  // New Patient Form State
  const [newPatientForm, setNewPatientForm] = useState({
    full_name: '',
    age: 55,
    gender: 'Male',
    dob: '1971-05-15',
    blood_type: 'O+',
    ward: 'dept-cardio',
    room_bed: 'Room 304-A',
    chief_complaint: 'Chest heaviness and dyspnea on exertion'
  });

  // Bedside Vitals Form State
  const [vitalsForm, setVitalsForm] = useState({
    heart_rate: 88,
    systolic_bp: 135,
    diastolic_bp: 82,
    respiration_rate: 20,
    spo2: 96,
    temperature: 37.1,
    o2_flow: 'Room Air',
    consciousness: 'Alert'
  });
  const [vitalsSuccess, setVitalsSuccess] = useState('');

  // Lab Test Form State
  const [labForm, setLabForm] = useState({
    test_name: 'Troponin I (High Sensitivity)',
    value: '0.04',
    unit: 'ng/mL',
    reference_range: '< 0.03',
    status: 'High'
  });
  const [labSuccess, setLabSuccess] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetail(selectedPatientId);
      fetchLiveTelemetry(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Live telemetry polling (every 3 seconds when enabled)
  useEffect(() => {
    if (!isLiveTelemetry || !selectedPatientId) return;
    const interval = setInterval(() => {
      fetchLiveTelemetry(selectedPatientId);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLiveTelemetry, selectedPatientId]);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/doctor/patients');
      setPatients(res.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  };

  const fetchPatientDetail = async (id) => {
    try {
      const res = await axios.get(`/api/doctor/patients/${id}`);
      setPatientDetail(res.data);
      setSoapDraft(null);
      setSignedStatus('');
      setFhirBundle(null);
      setVitalsSuccess('');
      setLabSuccess('');
    } catch (err) {
      console.error("Error fetching patient detail:", err);
    }
  };

  const fetchLiveTelemetry = async (id) => {
    try {
      const res = await axios.get(`/api/doctor/patients/${id}/telemetry/live`);
      setLiveTelemetry(res.data);
    } catch (err) {
      console.error("Error fetching live telemetry:", err);
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    if (!newPatientForm.full_name || !newPatientForm.chief_complaint) {
      alert("Please provide patient name and chief complaint.");
      return;
    }
    try {
      const res = await axios.post('/api/doctor/patients/create', newPatientForm);
      alert(`Patient ${res.data.full_name} (${res.data.mrn}) created successfully!`);
      await fetchPatients();
      setSelectedPatientId(res.data.id);
      setActiveTab('soap');
    } catch (err) {
      alert("Patient creation failed: " + err.message);
    }
  };

  const handleRecordVitals = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/doctor/vitals/record', {
        patient_id: selectedPatientId,
        ...vitalsForm
      });
      setVitalsSuccess(`Vitals recorded! Calculated NEWS2 Score: ${res.data.news2.total_score} (${res.data.news2.risk_tier} Risk)`);
      fetchPatientDetail(selectedPatientId);
      fetchLiveTelemetry(selectedPatientId);
    } catch (err) {
      alert("Vitals recording failed: " + err.message);
    }
  };

  const handleRecordLab = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/doctor/labs/record', {
        patient_id: selectedPatientId,
        ...labForm
      });
      setLabSuccess(`Lab result "${labForm.test_name}" added to patient record.`);
      fetchPatientDetail(selectedPatientId);
    } catch (err) {
      alert("Lab recording failed: " + err.message);
    }
  };

  const handleGenerateSOAP = async () => {
    if (!selectedPatientId) return;
    setGeneratingSoap(true);
    setSignedStatus('');
    setGenerationStage('Extracting longitudinal vitals & lab panels...');

    setTimeout(() => setGenerationStage('Retrieving AHA/ACC & GINA clinical practice guidelines...'), 800);
    setTimeout(() => setGenerationStage('Prompting local Ollama Qwen model for SOAP synthesis...'), 1600);

    try {
      const res = await axios.post('/api/doctor/soap/draft', {
        patient_id: selectedPatientId,
        physician_notes: physicianNotes || undefined
      });
      setSoapDraft(res.data);
    } catch (err) {
      alert("Failed to generate SOAP note draft: " + (err.response?.data?.detail || err.message));
    } finally {
      setGeneratingSoap(false);
      setGenerationStage('');
    }
  };

  const handleSignSOAP = async () => {
    if (!soapDraft || !soapDraft.soap) return;
    try {
      const res = await axios.post('/api/doctor/soap/verify', {
        patient_id: selectedPatientId,
        physician_name: currentUser?.full_name || 'Dr. Robert Chen, MD (Attending)',
        soap_content: soapDraft.soap
      });
      setSignedStatus(res.data.status);
      fetchPatientDetail(selectedPatientId);
    } catch (err) {
      alert("Signing failed: " + err.message);
    }
  };

  const fetchFHIRBundle = async () => {
    try {
      const res = await axios.get(`/api/fhir/Patient/${selectedPatientId}/$everything`);
      setFhirBundle(res.data);
    } catch (err) {
      console.error("Error fetching FHIR:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Doctor AI Copilot & Clinical Decision Support</h1>
              <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>REAL-TIME TELEMETRY</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">Longitudinal patient records, real-time vitals charting, lab anomaly tracking, and Ollama LLM SOAP drafting</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Live Telemetry Stream Toggle */}
          <button
            onClick={() => setIsLiveTelemetry(!isLiveTelemetry)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
              isLiveTelemetry 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveTelemetry ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isLiveTelemetry ? 'Live Stream: ACTIVE (3s)' : 'Live Stream: PAUSED'}</span>
          </button>

          <button
            onClick={() => setActiveTab('add_patient')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-400" />
            <span>Register New Patient</span>
          </button>

          <button
            onClick={() => {
              fetchPatientDetail(selectedPatientId);
              fetchLiveTelemetry(selectedPatientId);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Real-time Physiological Telemetry Stream Bar */}
      {liveTelemetry?.telemetry && (
        <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-card border border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in">
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold flex items-center justify-between">
              <span>Heart Rate</span>
              <HeartPulse className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {liveTelemetry.telemetry.heart_rate_bpm} <span className="text-xs font-normal text-slate-400">bpm</span>
            </div>
            <div className="text-[10px] text-teal-400 font-mono mt-0.5 truncate">{liveTelemetry.telemetry.cardiac_rhythm}</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Blood Pressure</div>
            <div className="text-xl font-black text-white mt-1">
              {liveTelemetry.telemetry.systolic_bp}/{liveTelemetry.telemetry.diastolic_bp}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">MAP: {liveTelemetry.telemetry.mean_arterial_pressure_map} mmHg</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Oxygen Saturation</div>
            <div className="text-xl font-black text-teal-300 mt-1">
              {liveTelemetry.telemetry.spo2_percent}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{liveTelemetry.telemetry.oxygen_device}</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Respiration Rate</div>
            <div className="text-xl font-black text-white mt-1">
              {liveTelemetry.telemetry.respiratory_rate} <span className="text-xs font-normal text-slate-400">/min</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Spontaneous</div>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Temperature</div>
            <div className="text-xl font-black text-white mt-1">
              {liveTelemetry.telemetry.temperature_celsius}°C
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Core Bedside Sensor</div>
          </div>

          <div className={`p-3 rounded-2xl border ${
            liveTelemetry.news2_realtime?.risk_tier === 'HIGH' ? 'bg-red-950/80 border-red-500 text-red-200' :
            (liveTelemetry.news2_realtime?.risk_tier === 'MEDIUM' ? 'bg-amber-950/80 border-amber-500 text-amber-200' : 'bg-emerald-950/80 border-emerald-500 text-emerald-200')
          }`}>
            <div className="text-[10px] uppercase font-mono font-bold">Live NEWS2 Score</div>
            <div className="text-xl font-black mt-1">
              {liveTelemetry.news2_realtime?.total_score} / 20
            </div>
            <div className="text-[10px] font-bold font-mono mt-0.5">{liveTelemetry.news2_realtime?.risk_tier} RISK</div>
          </div>
        </div>
      )}

      {/* Main Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Patient Queue */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>Assigned Inpatient Census ({patients.length})</span>
              </h2>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto">
              {patients.map((p) => {
                const isSelected = selectedPatientId === p.id;
                const news2 = p.latest_news2;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      if (activeTab === 'add_patient') setActiveTab('soap');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                      isSelected 
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs' 
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{p.name}</div>
                        <p className="text-[11px] text-slate-500 font-mono">{p.mrn} • {p.age}yo {p.gender} • {p.room_bed}</p>
                      </div>

                      {news2 && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          news2.risk_tier === 'HIGH' ? 'bg-red-100 text-red-800 border-red-300' :
                          (news2.risk_tier === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                        }`}>
                          NEWS2: {news2.total_score}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      <strong>CC:</strong> {p.chief_complaint}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Patient Clinical Workspace */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB: REGISTER NEW PATIENT */}
          {activeTab === 'add_patient' && (
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Register & Admit New Inpatient Record</span>
                </h2>
                <button onClick={() => setActiveTab('soap')} className="text-xs text-slate-400 hover:text-slate-700">Cancel</button>
              </div>

              <form onSubmit={handleCreatePatient} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Patient Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Margaret Jane Smith"
                      value={newPatientForm.full_name}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, full_name: e.target.value })}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Date of Birth</label>
                    <input
                      type="date"
                      value={newPatientForm.dob}
                      onChange={(e) => setNewPatientForm({ ...newPatientForm, dob: e.target.value })}
                      className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Age & Gender</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        value={newPatientForm.age}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, age: parseInt(e.target.value) || 0 })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                      <select
                        value={newPatientForm.gender}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Blood Type & Bed</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <select
                        value={newPatientForm.blood_type}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, blood_type: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Bed (Room 302-A)"
                        value={newPatientForm.room_bed}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, room_bed: e.target.value })}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Chief Complaint & Presenting Symptoms</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Progressive exertional shortness of breath, 2-pillow orthopnea, bilateral lower limb edema..."
                    value={newPatientForm.chief_complaint}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, chief_complaint: e.target.value })}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Create & Admit Patient Record
                </button>
              </form>
            </div>
          )}

          {/* ACTIVE PATIENT WORKSPACE */}
          {patientDetail && activeTab !== 'add_patient' && (
            <div className="space-y-6">
              
              {/* Patient Banner */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-card border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-black">{patientDetail.full_name}</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-teal-300 rounded text-[10px] font-mono font-bold">
                      {patientDetail.mrn}
                    </span>
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-bold">
                      {patientDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {patientDetail.age}yo {patientDetail.gender} • DOB: {patientDetail.dob} • Blood: {patientDetail.blood_type} • Bed: <strong className="text-white">{patientDetail.room_bed}</strong>
                  </p>
                </div>

                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold space-x-1 flex-wrap">
                  <button
                    onClick={() => setActiveTab('soap')}
                    className={`px-3 py-1 rounded-lg transition ${activeTab === 'soap' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    SOAP Note AI
                  </button>
                  <button
                    onClick={() => setActiveTab('chart_vitals')}
                    className={`px-3 py-1 rounded-lg transition ${activeTab === 'chart_vitals' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    + Chart Vitals
                  </button>
                  <button
                    onClick={() => setActiveTab('labs')}
                    className={`px-3 py-1 rounded-lg transition ${activeTab === 'labs' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Labs ({patientDetail.recent_labs?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-3 py-1 rounded-lg transition ${activeTab === 'timeline' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('fhir');
                      fetchFHIRBundle();
                    }}
                    className={`px-3 py-1 rounded-lg transition ${activeTab === 'fhir' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    FHIR JSON
                  </button>
                </div>
              </div>

              {/* TAB: CHART BEDSIDE VITALS */}
              {activeTab === 'chart_vitals' && (
                <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>Chart Real Physiological Vitals for {patientDetail.full_name}</span>
                  </h2>

                  {vitalsSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{vitalsSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleRecordVitals} className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700">Heart Rate (bpm)</label>
                        <input
                          type="number"
                          value={vitalsForm.heart_rate}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: parseInt(e.target.value) || 0 })}
                          className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">Systolic BP (mmHg)</label>
                        <input
                          type="number"
                          value={vitalsForm.systolic_bp}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, systolic_bp: parseInt(e.target.value) || 0 })}
                          className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">Diastolic BP (mmHg)</label>
                        <input
                          type="number"
                          value={vitalsForm.diastolic_bp}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, diastolic_bp: parseInt(e.target.value) || 0 })}
                          className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">Respiration Rate (/min)</label>
                        <input
                          type="number"
                          value={vitalsForm.respiration_rate}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, respiration_rate: parseInt(e.target.value) || 0 })}
                          className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">Oxygen Saturation (%)</label>
                        <input
                          type="number"
                          value={vitalsForm.spo2}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: parseFloat(e.target.value) || 0 })}
                          className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">Temperature (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={vitalsForm.temperature}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: parseFloat(e.target.value) || 0 })}
                          className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Save Vitals & Recalculate NEWS2
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 1: SOAP NOTE DRAFTER */}
              {activeTab === 'soap' && (
                <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>Automated Clinical SOAP Note Drafter (Local Ollama Qwen LLM)</span>
                      </h2>
                      <p className="text-xs text-slate-500">Synthesizes vitals time-series, lab abnormalities, and guideline best-practices into an editable clinical note</p>
                    </div>

                    <button
                      onClick={handleGenerateSOAP}
                      disabled={generatingSoap}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{generatingSoap ? 'Synthesizing with Qwen...' : 'Draft Note with AI'}</span>
                    </button>
                  </div>

                  {/* Generation Progress Indicator */}
                  {generatingSoap && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs space-y-2 animate-pulse">
                      <div className="flex items-center space-x-2 text-teal-900 font-bold">
                        <Zap className="w-4 h-4 text-teal-600" />
                        <span>Real-Time Clinical AI Synthesis in Progress...</span>
                      </div>
                      <p className="text-teal-700 font-mono">{generationStage}</p>
                    </div>
                  )}

                  {/* Physician Notes Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Add Attending Physician Interview Notes / Exam Observations (Optional):</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Patient ambulated 50 feet without dizziness. S3 gallop absent on auscultation today. Lungs clear to mid-zones."
                      value={physicianNotes}
                      onChange={(e) => setPhysicianNotes(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {signedStatus && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{signedStatus}: Official note signed and stored into Electronic Health Record.</span>
                    </div>
                  )}

                  {/* SOAP Note Output Container */}
                  {soapDraft?.soap && (
                    <div className="space-y-4 pt-2 animate-in fade-in">
                      
                      {/* Provenance Badge */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          <span>Status: <strong className="text-indigo-900 font-mono">{soapDraft.status}</strong> • Model: <strong>{soapDraft.provenance?.model_engine}</strong></span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{soapDraft.provenance?.generated_at}</span>
                      </div>

                      {/* SOAP Sections */}
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <div className="text-[11px] font-bold uppercase text-teal-700 font-mono">S — Subjective</div>
                          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{soapDraft.soap.subjective}</div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <div className="text-[11px] font-bold uppercase text-teal-700 font-mono">O — Objective (Vitals & Labs)</div>
                          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{soapDraft.soap.objective}</div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <div className="text-[11px] font-bold uppercase text-teal-700 font-mono">A — Assessment & Guidelines</div>
                          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{soapDraft.soap.assessment}</div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <div className="text-[11px] font-bold uppercase text-teal-700 font-mono">P — Plan & Monitoring</div>
                          <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{soapDraft.soap.plan}</div>
                        </div>
                      </div>

                      {/* Physician Review & Sign-off Action Bar */}
                      <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold">Human-in-the-Loop Clinical Verification</div>
                          <p className="text-[10px] text-slate-400">Attending physician must review and approve AI-generated documentation before permanent signing.</p>
                        </div>
                        <button
                          onClick={handleSignSOAP}
                          disabled={signedStatus !== ''}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>{signedStatus ? 'Signed & Verified' : 'Verify & Electronically Sign'}</span>
                        </button>
                      </div>

                    </div>
                  )}

                  {!soapDraft && !generatingSoap && (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>Click <strong>Draft Note with AI</strong> to synthesize patient vitals, active labs, and guideline management protocols.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LONGITUDINAL TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>Longitudinal Clinical Timeline & Major Encounters</span>
                  </h2>

                  <div className="space-y-4 pt-2">
                    {(patientDetail.timeline_events || []).map((ev, i) => (
                      <div key={i} className="flex items-start space-x-3 text-xs">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg font-bold font-mono shrink-0">
                          {ev.date}
                        </span>
                        <div className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                          <div className="font-bold text-slate-900">{ev.title}</div>
                          <p className="text-slate-600 leading-relaxed">{ev.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: LAB TRENDS & RECORD LAB FORM */}
              {activeTab === 'labs' && (
                <div className="space-y-6">
                  
                  {/* Record New Lab Form */}
                  <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                      <Plus className="w-4 h-4 text-teal-600" />
                      <span>Record New Laboratory Test Result</span>
                    </h3>

                    {labSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{labSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleRecordLab} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                      <input
                        type="text"
                        placeholder="Test Name (e.g. BNP, Troponin)"
                        value={labForm.test_name}
                        onChange={(e) => setLabForm({ ...labForm, test_name: e.target.value })}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Result Value"
                        value={labForm.value}
                        onChange={(e) => setLabForm({ ...labForm, value: e.target.value })}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Unit (e.g. mg/dL)"
                        value={labForm.unit}
                        onChange={(e) => setLabForm({ ...labForm, unit: e.target.value })}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                      />
                      <select
                        value={labForm.status}
                        onChange={(e) => setLabForm({ ...labForm, status: e.target.value })}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Critical High">Critical High</option>
                        <option value="Low">Low</option>
                      </select>
                      <button
                        type="submit"
                        className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                      >
                        Log Lab Result
                      </button>
                    </form>
                  </div>

                  {/* Labs Table */}
                  <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-teal-600" />
                          <span>Laboratory Panels & Anomaly Screening</span>
                        </h2>
                        <p className="text-xs text-slate-500">Real-time biochemical panels, reference ranges, and critical anomaly flags</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                        {patientDetail.recent_labs?.length || 0} Panels Tested
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold">
                            <th className="pb-2.5">Test Name</th>
                            <th className="pb-2.5">Result</th>
                            <th className="pb-2.5">Reference Range</th>
                            <th className="pb-2.5">Status & Trend</th>
                            <th className="pb-2.5">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(patientDetail.recent_labs || []).map((lab, i) => {
                            const statusStr = String(lab.status || '');
                            const isCritical = statusStr.includes("Critical") || statusStr.includes("High") || statusStr.includes("Low") || statusStr.includes("Positive");
                            const isNormal = statusStr.includes("Normal") || statusStr.includes("Negative") || statusStr.includes("Improving");

                            return (
                              <tr key={i} className="hover:bg-slate-50 transition">
                                <td className="py-3 font-bold text-slate-800 flex items-center space-x-2">
                                  <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                  <span>{lab.test}</span>
                                </td>
                                <td className="py-3 font-mono font-bold text-slate-900">{lab.value} {lab.unit}</td>
                                <td className="py-3 text-slate-500 font-mono">{lab.ref}</td>
                                <td className="py-3">
                                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase font-mono border ${
                                    statusStr.includes("Critical") ? 'bg-red-100 text-red-800 border-red-300' :
                                    (statusStr.includes("High") || statusStr.includes("Elevated") ? 'bg-amber-100 text-amber-800 border-amber-300' : 
                                    (isNormal ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-200'))
                                  }`}>
                                    {statusStr.includes("High") ? '▲ ' : (statusStr.includes("Low") ? '▼ ' : '')}{lab.status}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-400 font-mono">{lab.date ? String(lab.date).slice(0, 10) : 'Recent'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: FHIR JSON BUNDLE */}
              {activeTab === 'fhir' && (
                <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-sm font-bold text-slate-800 font-mono">HL7 FHIR R4 JSON Bundle (Interoperability Standard)</h2>
                    <span className="text-xs text-slate-400 font-mono">{fhirBundle?.total || 0} Resources</span>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-96 leading-relaxed">
                    {fhirBundle ? JSON.stringify(fhirBundle, null, 2) : 'Loading FHIR R4 Bundle...'}
                  </pre>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
