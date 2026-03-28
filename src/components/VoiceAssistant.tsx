import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface VoiceAssistantProps {
  language: string;
  onSymptomsDetected: (symptoms: string[]) => void;
  translations: any;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ language, onSymptomsDetected, translations }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const startVoice = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a helpful medical assistant. Help the user identify their symptoms. 
          The user is speaking in ${language}. 
          If you detect symptoms like fever, cough, fatigue, headache, sore throat, nausea, or muscle pain, 
          acknowledge them and ask if there are more. 
          Respond concisely and professionally.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
        },
        callbacks: {
          onopen: () => {
            setIsListening(true);
            startStreaming();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binary = atob(base64Data);
              const buffer = new Int16Array(binary.length / 2);
              for (let i = 0; i < buffer.length; i++) {
                buffer[i] = (binary.charCodeAt(i * 2) & 0xFF) | (binary.charCodeAt(i * 2 + 1) << 8);
              }
              audioQueueRef.current.push(buffer);
              if (!isPlayingRef.current) playNextChunk();
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => setIsListening(false),
          onerror: (err) => setError(err.message),
        },
      });

      sessionRef.current = session;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startStreaming = async () => {
    if (!streamRef.current || !sessionRef.current) return;

    const source = audioContextRef.current!.createMediaStreamSource(streamRef.current);
    const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContextRef.current!.destination);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
      sessionRef.current.sendRealtimeInput({
        audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const chunk = audioQueueRef.current.shift()!;
    const float32Data = new Float32Array(chunk.length);
    for (let i = 0; i < chunk.length; i++) {
      float32Data[i] = chunk[i] / 0x7FFF;
    }

    const buffer = audioContextRef.current!.createBuffer(1, float32Data.length, 16000);
    buffer.getChannelData(0).set(float32Data);
    const source = audioContextRef.current!.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current!.destination);
    source.onended = playNextChunk;
    source.start();
  };

  const stopVoice = () => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    setIsListening(false);
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl">
      <button
        onClick={isListening ? stopVoice : startVoice}
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
          isListening ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]" : "bg-blue-600 hover:bg-blue-700"
        )}
      >
        {isListening ? <MicOff className="text-white w-8 h-8" /> : <Mic className="text-white w-8 h-8" />}
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
        )}
      </button>
      
      <div className="flex items-center gap-2 text-sm font-medium">
        {isListening ? (
          <span className="text-red-400 animate-pulse">{translations.voiceListening}</span>
        ) : (
          <span className="text-gray-400">{translations.voiceStart}</span>
        )}
        {isSpeaking && <Volume2 className="w-4 h-4 text-blue-400 animate-bounce" />}
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
};
