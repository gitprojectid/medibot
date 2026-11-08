import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, Sparkles, CheckCircle, AlertTriangle, ShieldCheck, 
  RefreshCw, Check, ArrowRight, Eye, Layers, BookOpen, AlertCircle,
  Upload, FileUp, Download
} from 'lucide-react';

export default function DocumentAI() {
  const [sampleDocs, setSampleDocs] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [extractionResult, setExtractionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await axios.get('/api/documents/samples');
      setSampleDocs(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedText(res.data[0].raw_text.trim());
        setFileName(res.data[0].title);
      }
    } catch (err) {
      console.error("Error fetching sample docs:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setSelectedText(content);
        setExtractionResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRunExtraction = async () => {
    if (!selectedText.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/documents/extract', {
        document_text: selectedText
      });
      setExtractionResult(res.data);
    } catch (err) {
      alert("Extraction failed: " + err.message);
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-800">Medical Document Intelligence & Clinical NLP Pipeline</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold">
                REAL FILE INGESTION
              </span>
            </div>
            <p className="text-xs text-slate-500">Upload clinical notes, discharge summaries, or prescriptions for entity extraction and strict negation parsing</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.json,.csv,.rtf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Real File</span>
          </button>

          <button
            onClick={handleRunExtraction}
            disabled={loading || !selectedText.trim()}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{loading ? 'Extracting Entities...' : 'Extract Clinical Entities'}</span>
          </button>
        </div>
      </div>

      {/* Preset Document Switcher */}
      <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-3">
        <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
          <BookOpen className="w-3.5 h-3.5 text-teal-600" />
          <span>Preset Sample Clinical Records:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedText(doc.raw_text.trim());
                setFileName(doc.title);
                setExtractionResult(null);
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 rounded-xl text-xs font-bold transition text-slate-700"
            >
              📄 {doc.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Document Editor & Extraction Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Document Raw Text Editor */}
        <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Clinical Document Content</h2>
              {fileName && <p className="text-[11px] text-teal-700 font-mono font-bold mt-0.5">{fileName}</p>}
            </div>
            <span className="text-xs text-slate-400">{selectedText.length} characters</span>
          </div>

          <textarea
            rows={18}
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
            placeholder="Paste clinical progress note, discharge summary, or scanned medical text..."
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed text-slate-800"
          />
        </div>

        {/* Right: Structured Entity Extractions */}
        <div className="space-y-6">
          
          {extractionResult ? (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Negations Highlight Box */}
              {extractionResult.negations && extractionResult.negations.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 p-5 rounded-3xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Strict Clinical Negations Intercepted ({extractionResult.negations.length}):</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    The NLP pipeline detected phrases explicitly ruling out conditions or symptoms. These will <strong>NOT</strong> be added as active diagnoses.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {extractionResult.negations.map((n, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 text-xs font-mono font-bold rounded-lg">
                        ⛔ "{n.negated_phrase}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Conditions */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Identified Conditions & ICD-10 Mappings</span>
                </h3>

                <div className="space-y-2">
                  {(extractionResult.conditions || []).map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900">{c.name}</strong>
                        <span className="ml-2 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-600">
                          ICD-10: {c.icd10}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-teal-700 font-mono font-bold">
                          Conf: {Math.round(c.confidence * 100)}%
                        </span>
                        {c.is_negated ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">Ruled Out</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted Medications */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Extracted Discharge Medications & Dosages</span>
                </h3>

                <div className="space-y-2">
                  {(extractionResult.medications || []).map((m, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900">{m.name}</strong> — {m.dosage} ({m.route}) {m.frequency}
                      </div>
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded text-[10px] font-bold">
                        Validated
                      </span>
                    </div>
                  ))}
                  {(!extractionResult.medications || extractionResult.medications.length === 0) && (
                    <div className="text-xs text-slate-400 py-2">No medications found in document text.</div>
                  )}
                </div>
              </div>

              {/* Document Allergies */}
              {extractionResult.allergies && extractionResult.allergies.length > 0 && (
                <div className="bg-white p-5 rounded-3xl shadow-card border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-red-700">Documented Allergies:</div>
                  <div className="flex flex-wrap gap-2">
                    {extractionResult.allergies.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl">
                        🚨 {a.allergen} ({a.reaction})
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-200 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Click <strong>Extract Clinical Entities</strong> or upload your own real medical text file to run entity mapping, negation filtering, and confidence scoring.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
