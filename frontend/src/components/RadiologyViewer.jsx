import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Scan, Layers, ShieldCheck, Check, Sparkles, AlertTriangle, 
  ChevronRight, Eye, RefreshCw, ZoomIn, Sun, Activity, Download
} from 'lucide-react';

export default function RadiologyViewer({ currentUser }) {
  const [studies, setStudies] = useState([]);
  const [selectedStudyId, setSelectedStudyId] = useState('study-rad-001');
  const [studyDetail, setStudyDetail] = useState(null);
  const [selectedSlice, setSelectedSlice] = useState(1);
  const [windowPreset, setWindowPreset] = useState('Lung');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [signStatus, setSignStatus] = useState('');

  useEffect(() => {
    fetchStudies();
  }, []);

  useEffect(() => {
    if (selectedStudyId) {
      fetchStudyDetail(selectedStudyId);
    }
  }, [selectedStudyId]);

  const fetchStudies = async () => {
    try {
      const res = await axios.get('/api/multimodal/studies');
      setStudies(res.data || []);
    } catch (err) {
      console.error("Error fetching studies:", err);
    }
  };

  const fetchStudyDetail = async (id) => {
    try {
      const res = await axios.get(`/api/multimodal/studies/${id}`);
      setStudyDetail(res.data);
      setSelectedSlice(1);
      setSignStatus('');
    } catch (err) {
      console.error("Error fetching study detail:", err);
    }
  };

  const handleVerifyReport = async () => {
    if (!studyDetail) return;
    setIsVerifying(true);
    try {
      const res = await axios.post('/api/multimodal/radiology/verify', {
        study_id: selectedStudyId,
        radiologist_name: currentUser?.full_name || 'Dr. Rachel Green, MD (Attending Radiologist)'
      });
      setSignStatus('Report verified and finalized by Radiologist.');
      fetchStudyDetail(selectedStudyId);
    } catch (err) {
      alert("Verification failed: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const currentSliceData = studyDetail?.image_slices?.find(s => s.slice_number === selectedSlice) || studyDetail?.image_slices?.[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-900 text-teal-400 rounded-2xl shadow-xs">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Multimodal Medical Imaging & DICOM PACS Intelligence</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                AI COMPUTER VISION
              </span>
            </div>
            <p className="text-xs text-slate-500">Automated pathology/radiology detection, anatomical localization, and radiologist-in-the-loop overread</p>
          </div>
        </div>

        <button
          onClick={() => fetchStudyDetail(selectedStudyId)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh PACS</span>
        </button>
      </div>

      {/* Study Selector Row */}
      <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Active Patient Imaging Studies ({studies.length}):</span>
        </span>
        <div className="flex flex-wrap gap-2.5">
          {studies.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudyId(s.id)}
              className={`p-3 rounded-2xl border text-left text-xs transition ${
                selectedStudyId === s.id 
                  ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-2xs' 
                  : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between space-x-3">
                <span className="font-extrabold text-slate-900">{s.modality} — {s.patient_name}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                  s.urgency_tier.includes('CRITICAL') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {s.urgency_tier}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{s.study_description} • {s.accession_number}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Radiology Grid: Left Simulated DICOM Viewer & Right AI Findings & Impression */}
      {studyDetail && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: DICOM PACS Canvas Viewport (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-3xl shadow-card border border-slate-800 text-white space-y-4 flex flex-col justify-between">
            
            {/* Viewport Header Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <div>
                <span className="font-bold text-teal-400 font-mono">{studyDetail.modality}</span>
                <span className="text-slate-400 ml-2 font-mono">{studyDetail.accession_number}</span>
              </div>

              {/* Window Presets & Overlay Toggle */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                  {(studyDetail.window_presets || []).map((wp) => (
                    <button
                      key={wp}
                      onClick={() => setWindowPreset(wp)}
                      className={`px-2.5 py-1 rounded-lg transition ${windowPreset === wp ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      {wp}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition flex items-center space-x-1 ${
                    showBoundingBoxes ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>AI Bounding Box</span>
                </button>
              </div>
            </div>

            {/* Simulated High-Resolution DICOM Viewport Box */}
            <div className="relative w-full h-80 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Grid Background Pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Synthetic Anatomical Rendering Shape */}
              <div className="relative text-center space-y-2 select-none">
                <div className="w-48 h-48 mx-auto border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center p-4 bg-slate-950/60">
                  <div className="text-xs text-slate-500 font-mono">
                    <Scan className="w-12 h-12 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <div>[DICOM HIGH-RES VIEWPORT]</div>
                    <div className="text-[10px] text-teal-400 mt-1">{currentSliceData?.view}</div>
                  </div>
                </div>
              </div>

              {/* AI Bounding Box Overlays */}
              {showBoundingBoxes && currentSliceData?.ai_bounding_boxes && (
                <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
                  {currentSliceData.ai_bounding_boxes.map((box, bi) => (
                    <div 
                      key={bi}
                      className="border-2 border-dashed border-red-500 bg-red-500/10 p-2 rounded-xl text-left pointer-events-auto backdrop-blur-2xs transition hover:bg-red-500/20"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold font-mono text-red-300">
                        <span>🚨 {box.label}</span>
                        <span>Confidence: {Math.round(box.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Viewport Corner HUD Indicators */}
              <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-400">
                <div>Patient: {studyDetail.patient_name}</div>
                <div>Body Part: {studyDetail.body_part}</div>
              </div>
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400">
                <div>Window: {windowPreset}</div>
                <div>Slice: {selectedSlice} / {studyDetail.image_slices?.length || 1}</div>
              </div>
            </div>

            {/* Slice Selector Bar */}
            {studyDetail.image_slices && studyDetail.image_slices.length > 1 && (
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">Select Slice:</span>
                {studyDetail.image_slices.map((slice) => (
                  <button
                    key={slice.slice_number}
                    onClick={() => setSelectedSlice(slice.slice_number)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold transition ${
                      selectedSlice === slice.slice_number 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Slice {slice.slice_number}
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* RIGHT: AI Diagnostic Findings & Radiologist Verification (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* AI Findings & Impression Box */}
            <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>AI Preliminary Diagnostic Findings</span>
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold">
                  {studyDetail.status}
                </span>
              </div>

              {/* Structured Findings */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-slate-400 font-mono">Radiological Findings</div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {studyDetail.ai_findings.trim()}
                </div>
              </div>

              {/* Diagnostic Impression */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-teal-700 font-mono">Impression & Recommendations</div>
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl text-xs font-semibold text-teal-950 whitespace-pre-wrap leading-relaxed">
                  {studyDetail.ai_impression.trim()}
                </div>
              </div>

              {/* Verification Status */}
              {studyDetail.radiologist_verification ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Final Radiologist Sign-Off Complete</span>
                  </div>
                  <p className="text-emerald-700 font-mono text-[11px]">
                    Signed by {studyDetail.radiologist_verification.verified_by} at {studyDetail.radiologist_verification.timestamp.slice(0, 19)}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div>
                    <div className="text-xs font-bold">Human-in-the-Loop Radiologist Review</div>
                    <p className="text-[10px] text-slate-400">All AI-generated computer vision findings must be overread by an attending radiologist.</p>
                  </div>
                  <button
                    onClick={handleVerifyReport}
                    disabled={isVerifying}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isVerifying ? 'Signing Report...' : 'Approve & Sign Radiology Report'}</span>
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
