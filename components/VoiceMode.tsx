import React, { useEffect, useState, useRef } from 'react';
import { Mic, PhoneOff, Activity } from 'lucide-react';
import { connectLiveSession } from '../services/gemini';

const VoiceMode: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Ready to connect');
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
  }, []);

  const toggleConnection = async () => {
    if (isActive) {
      if (disconnectRef.current) {
        await disconnectRef.current();
        disconnectRef.current = null;
      }
      setIsActive(false);
      setStatus('Disconnected');
    } else {
      setStatus('Connecting...');
      try {
        const { disconnect } = await connectLiveSession(
          (audioBuffer) => {
            visualizeAudio(audioBuffer);
          },
          () => {
            setIsActive(false);
            setStatus('Disconnected');
          }
        );
        disconnectRef.current = disconnect;
        setIsActive(true);
        setStatus('Live Conversation');
      } catch (error) {
        console.error(error);
        setStatus('Connection Failed');
        setIsActive(false);
      }
    }
  };

  const visualizeAudio = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, amp);
    
    // Draw a cool wave
    ctx.strokeStyle = '#a5b4fc';
    ctx.lineWidth = 2;

    for (let i = 0; i < canvas.width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        // simple visualization
        const y = (1 + min) * amp;
        const h = Math.max(1, (max - min) * amp);
        ctx.fillStyle = `rgba(165, 180, 252, ${Math.min(1, h / 50)})`;
        ctx.fillRect(i, amp - h/2, 2, h);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-30' : 'opacity-0'}`}>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="z-10 flex flex-col items-center space-y-8">
         <div className="relative">
             <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-500/20 scale-110 shadow-[0_0_50px_rgba(99,102,241,0.5)]' : 'bg-white/5 border border-white/10'}`}>
                {isActive ? <Activity className="w-12 h-12 text-indigo-400 animate-bounce" /> : <Mic className="w-12 h-12 text-slate-400" />}
             </div>
             {isActive && (
                 <div className="absolute -inset-4 border border-indigo-500/30 rounded-full animate-ping opacity-20"></div>
             )}
         </div>

         <div className="text-center">
            <h2 className="text-2xl font-light text-white mb-2">{status}</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                {isActive 
                    ? "Listening... Speak naturally in English, Bengali or Banglish." 
                    : "Tap the microphone to start a real-time voice conversation."}
            </p>
         </div>

         <canvas ref={canvasRef} width={300} height={60} className="w-[300px] h-[60px]" />

         <button 
            onClick={toggleConnection}
            className={`px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 ${
                isActive 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 hover:bg-rose-500/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'
            }`}
         >
            {isActive ? <span className="flex items-center gap-2"><PhoneOff size={18}/> End Call</span> : "Start Voice Mode"}
         </button>
      </div>
    </div>
  );
};

export default VoiceMode;