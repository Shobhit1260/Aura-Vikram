import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Thermometer, Wind, AlertCircle, ChevronRight, Languages, History, Info, Heart } from 'lucide-react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { TRANSLATIONS, Language, RELATED_SYMPTOMS } from '@/src/constants';
import { analyzeSymptoms } from '@/src/services/gemini';
import { VoiceAssistant } from '@/src/components/VoiceAssistant';
import { WomenHealth } from '@/src/components/WomenHealth';
import ReactMarkdown from 'react-markdown';

const PRIMARY_SYMPTOMS = ['fever', 'cough', 'fatigue', 'headache', 'nausea', 'rash'];

function MainSymptomChecker({ lang, t }: { lang: Language, t: any }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ symptoms: string[], result: string, date: string }[]>([]);

  const getVisibleSymptoms = () => {
    const visible = new Set([...PRIMARY_SYMPTOMS, ...selectedSymptoms]);
    selectedSymptoms.forEach(s => {
      if (RELATED_SYMPTOMS[s]) {
        RELATED_SYMPTOMS[s].forEach(rel => visible.add(rel));
      }
    });
    return Array.from(visible);
  };

  const toggleSymptom = (symptomKey: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomKey)) {
        return prev.filter(s => s !== symptomKey);
      } else {
        return [...prev, symptomKey];
      }
    });
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) return;
    setIsAnalyzing(true);
    try {
      const symptomNames = selectedSymptoms.map(s => t.symptoms[s]);
      const analysis = await analyzeSymptoms(symptomNames, lang);
      setResult(analysis);
      setHistory(prev => [{ symptoms: symptomNames, result: analysis, date: new Date().toLocaleString() }, ...prev]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-8 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <p className="text-gray-500 text-lg leading-relaxed">{t.subtitle}</p>
      </motion.div>

      {/* Voice Section */}
      <section className="mb-12">
        <VoiceAssistant 
          language={lang} 
          onSymptomsDetected={() => {}} 
          translations={t}
        />
      </section>

      {/* Manual Selection */}
      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {t.selectSymptoms}
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {getVisibleSymptoms().map((key) => (
              <motion.button
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => toggleSymptom(key)}
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all duration-300 text-left flex flex-col gap-3",
                  selectedSymptoms.includes(key)
                    ? "bg-blue-50 border-blue-600 shadow-md"
                    : "bg-white border-transparent hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  selectedSymptoms.includes(key) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  {key === 'fever' && <Thermometer className="w-5 h-5" />}
                  {key === 'cough' && <Wind className="w-5 h-5" />}
                  {!['fever', 'cough'].includes(key) && <Activity className="w-5 h-5" />}
                </div>
                <span className="font-semibold text-sm">{t.symptoms[key]}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Action Button */}
      <div className="fixed bottom-8 left-0 right-0 px-6 max-w-md mx-auto">
        <button
          onClick={handleAnalyze}
          disabled={selectedSymptoms.length === 0 || isAnalyzing}
          className={cn(
            "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl",
            selectedSymptoms.length > 0 
              ? "bg-[#1A1A1A] text-white hover:scale-[1.02] active:scale-[0.98]" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.analyzing}
            </div>
          ) : (
            <>
              {t.analyze}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 rounded-2xl">
                  <AlertCircle className="text-red-600 w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold">{t.result}</h3>
              </div>

              <div className="prose prose-sm prose-slate max-w-none mb-8">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <p className="text-xs text-gray-500 italic leading-relaxed">
                  {t.disclaimer}
                </p>
              </div>

              <button
                onClick={() => setResult(null)}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl font-bold transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">History</h3>
                <button onClick={() => setShowHistory(false)} className="text-gray-400">Close</button>
              </div>

              <div className="space-y-4">
                {history.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">No previous analysis found.</p>
                ) : (
                  history.map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>{item.date}</span>
                      </div>
                      <p className="font-semibold text-sm mb-1">{item.symptoms.join(", ")}</p>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        <ReactMarkdown>{item.result}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  const [lang, setLang] = useState<Language>('hi');
  const location = useLocation();
  const isWomenRoute = location.pathname === '/women';
  const t = TRANSLATIONS[lang];

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-blue-100 transition-colors duration-500",
      isWomenRoute ? "bg-[#FFF5F7] text-[#4A1D24]" : "bg-[#F5F5F5] text-[#1A1A1A]"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between transition-colors duration-500",
        isWomenRoute ? "bg-white/80 border-pink-100" : "bg-white/80 border-gray-200"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500",
            isWomenRoute ? "bg-pink-500 shadow-pink-200" : "bg-blue-600 shadow-blue-200"
          )}>
            {isWomenRoute ? <Heart className="text-white w-6 h-6" /> : <Activity className="text-white w-6 h-6" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {isWomenRoute ? t.women.title : t.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to={isWomenRoute ? "/" : "/women"}
            className={cn(
              "p-2 rounded-full transition-all",
              isWomenRoute ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"
            )}
          >
            {isWomenRoute ? <Activity className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
          </Link>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Language)}
            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
          >
            <option value="hi">हिन्दी</option>
            <option value="en">English</option>
            <option value="bn">বাংলা</option>
            <option value="te">తెలుగు</option>
          </select>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<MainSymptomChecker lang={lang} t={t} />} />
        <Route path="/women" element={<WomenHealth lang={lang} />} />
      </Routes>
    </div>
  );
}
