import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Activity, AlertCircle, Pill, Heart, Shield, Plus, Trash2, 
  CheckCircle, Gauge, Thermometer, Droplet, HeartPulse, Sparkles
} from 'lucide-react';

export default function PatientProfile({ currentUser, onUpdateContext }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  // Form states for adding items
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '' });
  const [newVital, setNewVital] = useState({ type: 'bp_systolic', value: '', unit: 'mmHg' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/patient/profile');
      setProfile(res.data);
      if (onUpdateContext) {
        onUpdateContext({
          age: res.data.age,
          sex: res.data.sex,
          is_pregnant: res.data.is_pregnant,
          conditions: res.data.conditions?.map(c => c.name) || [],
          allergies: res.data.allergies?.map(a => a.allergen) || [],
          medications: res.data.medications?.map(m => m.generic_name) || []
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/patient/profile', {
        age: profile.age,
        sex: profile.sex,
        is_pregnant: profile.is_pregnant,
        pregnancy_weeks: profile.pregnancy_weeks,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        notes: profile.notes
      });
      setSaveMessage('Clinical demographics updated in database!');
      setTimeout(() => setSaveMessage(''), 3000);
      fetchProfile();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;
    await axios.post('/api/patient/conditions', { condition_name: newCondition });
    setNewCondition('');
    fetchProfile();
  };

  const handleDeleteCondition = async (id) => {
    await axios.delete(`/api/patient/conditions/${id}`);
    fetchProfile();
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    await axios.post('/api/patient/allergies', { allergen_name: newAllergy, severity: 'severe' });
    setNewAllergy('');
    fetchProfile();
  };

  const handleDeleteAllergy = async (id) => {
    await axios.delete(`/api/patient/allergies/${id}`);
    fetchProfile();
  };

  const handleAddMedication = async () => {
    if (!newMed.name.trim()) return;
    await axios.post('/api/patient/medications', {
      generic_name: newMed.name,
      dosage: newMed.dosage || 'Standard dose',
      frequency: newMed.frequency || 'Daily'
    });
    setNewMed({ name: '', dosage: '', frequency: '' });
    fetchProfile();
  };

  const handleDeleteMedication = async (id) => {
    await axios.delete(`/api/patient/medications/${id}`);
    fetchProfile();
  };

  const handleAddVital = async () => {
    if (!newVital.value) return;
    await axios.post('/api/patient/vitals', {
      vital_type: newVital.type,
      value: parseFloat(newVital.value),
      unit: newVital.unit
    });
    setNewVital({ ...newVital, value: '' });
    fetchProfile();
  };

  const getVitalStatus = (type, val) => {
    if (type === 'bp_systolic') {
      if (val < 120) return { label: 'Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      if (val <= 129) return { label: 'Elevated', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      return { label: 'High (Stage 1/2)', color: 'text-red-700 bg-red-50 border-red-200' };
    }
    if (type === 'heart_rate') {
      if (val >= 60 && val <= 100) return { label: 'Normal (60-100)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      return { label: 'Abnormal', color: 'text-orange-700 bg-orange-50 border-orange-200' };
    }
    if (type === 'spo2') {
      if (val >= 95) return { label: 'Optimal (>=95%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      return { label: 'Hypoxia Warning', color: 'text-red-700 bg-red-50 border-red-200' };
    }
    return { label: 'Recorded', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  };

  if (loading && !profile) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading patient records from SQLite database...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Patient Header Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-teal-600 to-teal-400 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
            {profile?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800">{profile?.full_name || 'Patient Profile'}</h1>
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 text-[11px] font-bold rounded-full border border-teal-200">
                Verified Patient
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.email} • Database ID: {profile?.id?.slice(0, 8)}...</p>
          </div>
        </div>

        {saveMessage && (
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 shadow-2xs animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* Vital Signs Live Gauges */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Vital Signs & Clinical Telemetry</h2>
          </div>
          <span className="text-xs text-slate-400">Clinical Reference Range Evaluator</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {profile?.vitals?.slice(-4).map(v => {
            const status = getVitalStatus(v.type, v.value);
            return (
              <div key={v.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold uppercase">
                  <span>{v.type.replace('_', ' ')}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-800">
                  {v.value} <span className="text-xs font-normal text-slate-400">{v.unit}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Logged: {new Date(v.timestamp).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Vital Sign Entry Row */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-bold text-slate-700 shrink-0">Log New Reading:</span>
          <select
            value={newVital.type}
            onChange={(e) => {
              const t = e.target.value;
              let u = 'mmHg';
              if (t === 'heart_rate') u = 'bpm';
              if (t === 'spo2') u = '%';
              if (t === 'temperature') u = '°F';
              if (t === 'blood_glucose') u = 'mg/dL';
              setNewVital({ ...newVital, type: t, unit: u });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="bp_systolic">Blood Pressure (Systolic)</option>
            <option value="bp_diastolic">Blood Pressure (Diastolic)</option>
            <option value="heart_rate">Heart Rate (Pulse)</option>
            <option value="spo2">Oxygen Saturation (SpO2)</option>
            <option value="temperature">Body Temperature</option>
            <option value="blood_glucose">Blood Glucose</option>
          </select>
          <input
            type="number"
            step="0.1"
            placeholder="Measurement Value"
            value={newVital.value}
            onChange={(e) => setNewVital({ ...newVital, value: e.target.value })}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500 flex-1"
          />
          <button
            onClick={handleAddVital}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0"
          >
            Record Vital Sign
          </button>
        </div>
      </div>

      {/* 2-Column: Demographics and Medical History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Demographics & Obstetric Status */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-teal-600" />
            <span>Demographics & Emergency Contacts</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Age</label>
                <input
                  type="number"
                  value={profile?.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Biological Sex</label>
                <select
                  value={profile?.sex || 'unspecified'}
                  onChange={(e) => setProfile({ ...profile, sex: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-2xl flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="pregnantCheck"
                checked={profile?.is_pregnant || false}
                onChange={(e) => setProfile({ ...profile, is_pregnant: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
              <label htmlFor="pregnantCheck" className="text-xs font-bold text-teal-900 cursor-pointer">
                Currently Pregnant (Triggers Obstetric Triage Safety Checks)
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Emergency Contact</label>
              <input
                type="text"
                placeholder="Full Name & Relation (e.g. Spouse)"
                value={profile?.emergency_contact_name || ''}
                onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                placeholder="Emergency Contact Phone"
                value={profile?.emergency_contact_phone || ''}
                onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Diagnosed Conditions & Allergies */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-6">
          
          {/* Medical Conditions */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Known Medical Conditions</span>
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.conditions?.map(c => (
                <span key={c.id} className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
                  {c.name}
                  <button onClick={() => handleDeleteCondition(c.id)} className="ml-2 text-red-400 hover:text-red-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2 mt-3">
              <input
                type="text"
                placeholder="Add condition (e.g. Type 2 Diabetes, Asthma)"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button onClick={handleAddCondition} className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Drug & Allergen Sensitivities</span>
            </h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.allergies?.map(a => (
                <span key={a.id} className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200">
                  {a.allergen} ({a.reaction || 'severe'})
                  <button onClick={() => handleDeleteAllergy(a.id)} className="ml-2 text-amber-400 hover:text-amber-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2 mt-3">
              <input
                type="text"
                placeholder="Add allergy (e.g. Penicillin, Sulfa, Aspirin)"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button onClick={handleAddAllergy} className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Active Medications List */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Pill className="w-4 h-4 text-emerald-600" />
          <span>Active Prescription & Daily Medications</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {profile?.medications?.map(m => (
            <div key={m.id} className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-emerald-900 text-sm">{m.generic_name}</div>
                <div className="text-emerald-700 text-xs mt-0.5">{m.dosage} • {m.frequency}</div>
              </div>
              <button onClick={() => handleDeleteMedication(m.id)} className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <input
            type="text"
            placeholder="Generic Drug Name (e.g. Lisinopril)"
            value={newMed.name}
            onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Dosage (e.g. 10mg)"
            value={newMed.dosage}
            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            placeholder="Frequency (e.g. Once daily)"
            value={newMed.frequency}
            onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={handleAddMedication}
            className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Add Medication
          </button>
        </div>
      </div>

    </div>
  );
}
