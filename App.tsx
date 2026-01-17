
import React, { useState } from 'react';
import { analyzeResume } from './services/geminiService';
import { ResumeAnalysis, ExperienceLevel } from './types';
import { PREDEFINED_ROLES } from './constants';
import Dashboard from './components/Dashboard';
import { Upload, Cpu, Search, Briefcase, User, Loader2, Sparkles, ShieldCheck, FileText, AlertCircle, Trash2 } from 'lucide-react';

// External library declarations for the browser-loaded scripts
declare const mammoth: any;
declare const pdfjsLib: any;

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState(PREDEFINED_ROLES[0].title);
  const [customRole, setCustomRole] = useState('');
  const [expLevel, setExpLevel] = useState<ExperienceLevel>(ExperienceLevel.FRESHER);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const extractTextFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsParsing(true);
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPdf(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        text = await extractTextFromDocx(file);
      } else if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsText(file);
        });
      } else {
        throw new Error("Unsupported format. Please upload PDF, DOCX, TXT, or MD.");
      }

      if (!text.trim()) {
        throw new Error("The document appears to be empty.");
      }
      setResumeText(text);
    } catch (err: any) {
      setError(err.message || "Failed to process file.");
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const handleStartAnalysis = async () => {
    if (!resumeText.trim()) {
      setError("Please upload a resume or paste text into the field.");
      return;
    }
    
    setError(null);
    setStep('analyzing');
    
    try {
      const finalRole = customRole.trim() || targetRole;
      const result = await analyzeResume(resumeText, finalRole, expLevel);
      setAnalysis(result);
      setStep('result');
    } catch (err: any) {
      console.error("Analysis Error:", err);
      const msg = err.message || "Unknown error";
      
      if (msg.includes("403") || msg.toLowerCase().includes("api key")) {
        setError("AUTHENTICATION FAILED: Ensure you have a valid Gemini API key in your environment.");
      } else if (msg.includes("404") || msg.includes("model")) {
        setError("ENGINE UNAVAILABLE: The flash-preview model is not responding. Please check your project settings.");
      } else if (msg.includes("fetch")) {
        setError("NETWORK ERROR: Unable to reach the AI engine. Please check your connection.");
      } else {
        setError(msg);
      }
      setStep('upload');
    }
  };

  const reset = () => {
    setStep('upload');
    setAnalysis(null);
    setError(null);
  };

  if (step === 'result' && analysis) {
    return <Dashboard analysis={analysis} onReset={reset} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Cpu size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-none">Enterprise ATS</span>
              <span className="text-[10px] text-indigo-600 font-bold tracking-tighter uppercase">Recruiter AI v3.2</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-500" /> FAANG Verified
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-amber-500" /> Multi-Format Engine
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {step === 'upload' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3 mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Enterprise Resume Scorer</h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Evaluate your profile using Gemini-powered intelligence. Now supporting PDF, DOCX, and Text.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Briefcase size={16} /> Target Role
                </label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  {PREDEFINED_ROLES.map(role => (
                    <option key={role.id} value={role.title}>{role.title}</option>
                  ))}
                  <option value="Custom">Other (Specify Below)</option>
                </select>
                {targetRole === 'Custom' && (
                  <input 
                    type="text"
                    placeholder="Enter target job title..."
                    className="w-full mt-3 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User size={16} /> Experience Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(ExperienceLevel).map((level) => (
                    <button
                      key={level}
                      onClick={() => setExpLevel(level)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        expLevel === level 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-600" size={24} />
                  <h3 className="text-xl font-bold text-slate-800">Resume Content</h3>
                </div>
                <label className={`cursor-pointer px-4 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-all ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isParsing ? <Loader2 size={16} className="animate-spin text-indigo-600" /> : <Upload size={16} />}
                  <span>{isParsing ? 'Parsing...' : 'Upload PDF / DOCX'}</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.md" 
                    onChange={handleFileUpload} 
                    disabled={isParsing}
                  />
                </label>
              </div>

              <div className="relative">
                <textarea 
                  placeholder="Paste your resume content or upload a document above..."
                  className="w-full h-80 px-6 py-5 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-mono text-sm leading-relaxed text-slate-700 resize-none shadow-inner"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                {resumeText && (
                  <button 
                    onClick={() => setResumeText('')}
                    className="absolute bottom-4 right-4 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 p-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Trash2 size={14} /> Clear
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={20} /> 
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm">System Error</span>
                    <span className="text-xs leading-relaxed opacity-90">{error}</span>
                  </div>
                </div>
              )}

              <button 
                onClick={handleStartAnalysis}
                disabled={!resumeText || isParsing}
                className="w-full mt-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search size={24} className="group-hover:scale-110 transition-transform" />
                Trigger Analysis
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
            <div className="relative">
              <div className="w-40 h-40 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="text-indigo-600 animate-pulse" size={56} />
              </div>
            </div>
            <div className="space-y-4 max-w-sm">
              <h2 className="text-2xl font-bold text-slate-900">Engines Active</h2>
              <div className="flex flex-col gap-3 text-slate-500 font-medium">
                <div className="flex items-center gap-3 text-sm animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Processing text vectors...</span>
                </div>
                <div className="flex items-center gap-3 text-sm animate-pulse delay-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Simulating hiring manager review...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-xs font-medium uppercase tracking-widest">
          <p>© 2024 Enterprise Talent Systems Inc.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
