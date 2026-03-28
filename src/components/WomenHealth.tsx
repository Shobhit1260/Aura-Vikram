import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, User, Ruler, Weight, Calendar, Baby, ChevronRight, MessageCircle, Send, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { TRANSLATIONS, Language } from '@/src/constants';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface WomenHealthProps {
  lang: Language;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const WomenHealth: React.FC<WomenHealthProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang].women;
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [condition, setCondition] = useState<'none' | 'period' | 'pregnancy' | 'menopause'>('none');
  const [lastPeriod, setLastPeriod] = useState('');
  const [pregnancyWeek, setPregnancyWeek] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Chat states
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatMode) scrollToBottom();
  }, [messages, chatMode]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `
        Analyze women's health for a user with the following biological data:
        Age: ${age}
        Height: ${height} cm
        Weight: ${weight} kg
        Blood Pressure: ${systolic}/${diastolic} mmHg
        Heart Rate: ${heartRate} bpm
        Current Condition: ${condition}
        ${condition === 'period' ? `Last Period Date: ${lastPeriod}` : ''}
        ${condition === 'pregnancy' ? `Pregnancy Week: ${pregnancyWeek}` : ''}
        
        Provide personalized health advice, potential concerns to watch for, and lifestyle recommendations in ${lang}.
        Focus on ${condition} specific advice if applicable.
        Keep it professional and include a strong medical disclaimer.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setResult(response.text);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const systemInstruction = `
        You are a specialized women's health assistant. 
        The user has provided the following biological data:
        Age: ${age}
        Height: ${height} cm
        Weight: ${weight} kg
        Blood Pressure: ${systolic}/${diastolic} mmHg
        Heart Rate: ${heartRate} bpm
        Current Condition: ${condition}
        ${condition === 'period' ? `Last Period Date: ${lastPeriod}` : ''}
        ${condition === 'pregnancy' ? `Pregnancy Week: ${pregnancyWeek}` : ''}

        Context: The user is currently in the ${condition} state.
        Your goal is to provide helpful, empathetic, and medically accurate (but with disclaimers) advice based ONLY on this context and women's health.
        Respond in ${lang}.
        If the user asks something unrelated to health or their condition, politely redirect them to health topics.
        Always maintain a supportive and professional tone.
      `;

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date() }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (chatMode) {
    return (
      <div className="fixed inset-0 bg-[#FFF5F7] z-[70] flex flex-col">
        {/* Chat Header */}
        <header className="p-6 bg-white border-b border-pink-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setChatMode(false)}
              className="p-2 hover:bg-pink-50 rounded-xl transition-colors text-pink-600"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h3 className="font-bold text-lg">{t.chatTitle}</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-pink-500 font-medium uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <Heart className="text-pink-500 w-5 h-5" />
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-pink-500 w-8 h-8" />
              </div>
              <p className="text-pink-600/60 font-medium">{t.chatPlaceholder}</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col w-full",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl shadow-sm",
                msg.role === 'user' 
                  ? "bg-pink-600 text-white rounded-tr-none" 
                  : "bg-white text-[#4A1D24] rounded-tl-none border border-pink-50"
              )}>
                <div className="prose prose-sm prose-pink max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
              <span className="text-[10px] text-pink-400 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
          {isChatLoading && (
            <div className="flex flex-col items-start gap-2">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-pink-50 flex gap-1">
                <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-pink-300 rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] text-pink-400 animate-pulse px-1">
                {t.chatTitle} is typing...
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-white border-t border-pink-100 pb-10">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.chatPlaceholder}
              className="flex-1 p-4 pr-14 bg-pink-50 rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isChatLoading}
              className={cn(
                "absolute right-2 p-3 rounded-xl transition-all",
                inputMessage.trim() && !isChatLoading
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                  : "bg-pink-100 text-pink-300"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#4A1D24] font-sans selection:bg-pink-100 pb-32">
      <main className="max-w-md mx-auto px-6 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex justify-between items-start"
        >
          <div>
            <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-200 mb-4">
              <Heart className="text-white w-7 h-7" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">{t.title}</h2>
            <p className="text-pink-600/70 text-lg leading-relaxed">{t.subtitle}</p>
          </div>
          {age && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setChatMode(true)}
              className="p-4 bg-white rounded-2xl shadow-lg shadow-pink-100 border border-pink-50 text-pink-600 flex flex-col items-center gap-1"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t.chatStart}</span>
            </motion.button>
          )}
        </motion.div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                <User className="w-3 h-3" /> {t.age}
              </label>
              <input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                placeholder="25"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> {t.height}
              </label>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(e.target.value)}
                className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                placeholder="165"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                <Weight className="w-3 h-3" /> {t.weight}
              </label>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)}
                className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                placeholder="60"
              />
            </div>
          </div>

          {/* Vitals Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                <Heart className="w-3 h-3" /> {t.systolic}
              </label>
              <input 
                type="number" 
                value={systolic} 
                onChange={(e) => setSystolic(e.target.value)}
                className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                <Heart className="w-3 h-3 opacity-50" /> {t.diastolic}
              </label>
              <input 
                type="number" 
                value={diastolic} 
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                placeholder="80"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400" /> {t.heartRate}
              </label>
              <input 
                type="number" 
                value={heartRate} 
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                placeholder="72"
              />
            </div>
          </div>

          {/* Condition Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
              {t.condition}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['none', 'period', 'pregnancy', 'menopause'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all duration-300 text-left flex items-center gap-3",
                    condition === c
                      ? "bg-pink-100 border-pink-500 shadow-md"
                      : "bg-white border-transparent hover:border-pink-100"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    condition === c ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-300"
                  )}>
                    {c === 'none' && <User className="w-5 h-5" />}
                    {c === 'period' && <Calendar className="w-5 h-5" />}
                    {c === 'pregnancy' && <Baby className="w-5 h-5" />}
                    {c === 'menopause' && <Heart className="w-5 h-5" />}
                  </div>
                  <span className="font-semibold text-sm">{t[c]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Inputs */}
          <AnimatePresence mode="wait">
            {condition === 'period' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  {t.lastPeriod}
                </label>
                <input 
                  type="date" 
                  value={lastPeriod} 
                  onChange={(e) => setLastPeriod(e.target.value)}
                  className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                />
              </motion.div>
            )}
            {condition === 'pregnancy' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  {t.pregnancyWeek}
                </label>
                <input 
                  type="number" 
                  value={pregnancyWeek} 
                  onChange={(e) => setPregnancyWeek(e.target.value)}
                  className="w-full p-4 bg-white rounded-2xl border-2 border-transparent focus:border-pink-300 focus:outline-none transition-all"
                  placeholder="12"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <div className="fixed bottom-8 left-0 right-0 px-6 max-w-md mx-auto">
          <button
            onClick={handleAnalyze}
            disabled={!age || isAnalyzing}
            className={cn(
              "w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-pink-200",
              age 
                ? "bg-pink-600 text-white hover:scale-[1.02] active:scale-[0.98]" 
                : "bg-pink-200 text-pink-400 cursor-not-allowed"
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
              className="fixed inset-0 z-[60] bg-pink-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
              onClick={() => setResult(null)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 max-h-[85vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-pink-100 rounded-full mx-auto mb-8" />
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-pink-100 rounded-2xl">
                    <Heart className="text-pink-600 w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">{t.result}</h3>
                </div>

                <div className="prose prose-sm prose-pink max-w-none mb-8">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>

                <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 mb-8">
                  <p className="text-xs text-pink-600 italic leading-relaxed">
                    {t.disclaimer}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 py-4 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-2xl font-bold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setChatMode(true);
                    }}
                    className="flex-1 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t.chatStart}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
