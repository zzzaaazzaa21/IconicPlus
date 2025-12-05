import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, MapPin, Search, BrainCircuit, Mic, Loader2, Volume2, ChevronUp } from 'lucide-react';
import { generateChatResponse, speakMessage } from '../services/gemini';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mode, setMode] = useState<'flash' | 'pro' | 'thinking'>('flash');
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || isProcessing) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      images: selectedImage ? [selectedImage] : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setSelectedImage(null);
    setIsProcessing(true);
    setIsSettingsOpen(false);

    // Create a placeholder AI message immediately
    const aiMsgId = (Date.now() + 1).toString();
    const newAiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      text: '', // Start empty for typing effect
      groundingUrls: []
    };
    setMessages(prev => [...prev, newAiMsg]);

    try {
      // Prepare history
      const history = messages.map(m => ({
        role: m.role,
        parts: m.images && m.images.length > 0 
           ? [{ text: m.text } as any] // Simplified history
           : [{ text: m.text }]
      }));

      // Get Location if Maps is enabled
      let location;
      if (useMaps && navigator.geolocation) {
         try {
           const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
             navigator.geolocation.getCurrentPosition(resolve, reject);
           });
           location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
         } catch (e) {
           console.warn("Location denied");
         }
      }

      const stream = await generateChatResponse(
        history,
        newUserMsg.text,
        newUserMsg.images,
        mode,
        useSearch,
        useMaps,
        location
      );

      let accumulatedText = '';
      const accumulatedGrounding: any[] = [];

      for await (const chunk of stream) {
        // Extract text
        if (chunk.text) {
          accumulatedText += chunk.text;
        }

        // Extract grounding chunks if available in this chunk
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
          groundingChunks.forEach((c: any) => {
            if (c.web?.uri) {
                if (!accumulatedGrounding.find(g => g.uri === c.web.uri)) {
                    accumulatedGrounding.push({ title: c.web.title, uri: c.web.uri });
                }
            }
            if (c.maps?.uri) { // Support Maps URLs too
                 if (!accumulatedGrounding.find(g => g.uri === c.maps.uri)) {
                    accumulatedGrounding.push({ title: c.maps.title || "Maps Location", uri: c.maps.uri });
                }
            }
          });
        }

        // Update UI with accumulated content
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, text: accumulatedText, groundingUrls: accumulatedGrounding.length > 0 ? accumulatedGrounding : undefined }
            : msg
        ));
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, text: "I encountered an error processing your request. Please try again." }
          : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeak = async (text: string, id: string) => {
      if (!text) return;
      setLoadingAudioId(id);
      try {
          await speakMessage(text);
      } catch (e) {
          console.error("TTS Error", e);
      } finally {
          setLoadingAudioId(null);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-6 relative">
                     <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 rounded-full"></div>
                     <BrainCircuit size={64} className="relative z-10 text-indigo-400/80 mb-2" />
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 leading-tight">
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 drop-shadow-sm">
                     Hello I'am IconicPlus.
                   </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-light">
                    How can I assist you today?
                </p>
            </div>
        )}
        {messages.map((msg, index) => {
          const isLastModelMsg = msg.role === 'model' && index === messages.length - 1 && isProcessing;
          
          return (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 relative group/message ${
              msg.role === 'user' 
                ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-tr-sm' 
                : 'glass-panel text-slate-200 rounded-tl-sm'
            }`}>
              {msg.images && msg.images.map((img, idx) => (
                <img key={idx} src={img} alt="User upload" className="max-h-60 rounded-lg mb-2 border border-white/10" />
              ))}
              
              {msg.text ? (
                <div className={`prose prose-invert prose-sm ${isLastModelMsg ? 'typing-cursor' : ''}`}>
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                 /* Improved Typing indicator / Placeholder */
                 <div className="flex items-center gap-2 py-1">
                    <BrainCircuit size={16} className="text-indigo-400 animate-pulse" />
                    <span className="text-xs font-medium text-indigo-300/70 animate-pulse">Thinking...</span>
                 </div>
              )}
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-3 pt-2 border-t border-white/10 grid grid-cols-1 gap-1">
                    <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Sources</span>
                    {msg.groundingUrls.map((source, idx) => (
                        <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 truncate hover:underline flex items-center gap-1">
                             <Search size={10} /> {source.title || source.uri}
                        </a>
                    ))}
                </div>
              )}

              {/* TTS Button for AI Messages */}
              {msg.role === 'model' && msg.text && (
                  <button 
                    onClick={() => handleSpeak(msg.text, msg.id)}
                    disabled={loadingAudioId === msg.id}
                    className="absolute -bottom-6 left-0 p-1 text-slate-500 hover:text-indigo-400 transition-colors opacity-0 group-hover/message:opacity-100"
                    title="Speak response"
                  >
                      {loadingAudioId === msg.id ? <Loader2 size={14} className="animate-spin" /> : <Volume2 size={14} />}
                  </button>
              )}
            </div>
          </div>
        )})}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pt-0 relative z-20">
         {/* Expandable Settings Menu */}
        <div className={`absolute bottom-full left-4 right-4 mb-2 glass-panel rounded-xl p-3 transition-all duration-300 origin-bottom ${isSettingsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Mode</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setMode('flash')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${mode === 'flash' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-white/5 hover:bg-white/5 text-slate-400'}`}
                    >
                        Fast (Flash)
                    </button>
                    <button 
                        onClick={() => setMode('pro')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${mode === 'pro' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'border-white/5 hover:bg-white/5 text-slate-400'}`}
                    >
                        Pro (Reasoning)
                    </button>
                    <button 
                        onClick={() => setMode('thinking')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border ${mode === 'thinking' ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'border-white/5 hover:bg-white/5 text-slate-400'}`}
                    >
                        Thinking
                    </button>
                </div>

                <div className="h-px bg-white/5 my-1"></div>

                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Grounding</span>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setUseSearch(!useSearch)} 
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border flex items-center justify-center gap-2 ${useSearch ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'border-white/5 hover:bg-white/5 text-slate-400'}`}
                    >
                        <Search size={14} /> Google Search
                    </button>
                    <button 
                        onClick={() => setUseMaps(!useMaps)} 
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border flex items-center justify-center gap-2 ${useMaps ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'border-white/5 hover:bg-white/5 text-slate-400'}`}
                    >
                        <MapPin size={14} /> Google Maps
                    </button>
                </div>
            </div>
        </div>

        <div className="glass-panel p-2 rounded-2xl flex flex-col space-y-2 relative group focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            {selectedImage && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/80 rounded-lg border border-white/10">
                    <img src={selectedImage} alt="Preview" className="h-20 rounded" />
                    <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white text-xs">✕</button>
                </div>
            )}
            
            <div className="flex items-start gap-2">
                 <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`mt-1 p-1.5 rounded-lg transition-colors ${isSettingsOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                    <ChevronUp size={20} className={`transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                 </button>

                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={`Message IconicPlus (${mode})...`}
                    className="w-full bg-transparent border-none focus:ring-0 outline-none text-slate-200 resize-none max-h-32 min-h-[40px] px-2 py-2"
                    rows={1}
                />
            </div>
            
            <div className="flex justify-between items-center px-1 pl-10">
                <div className="flex space-x-1">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors">
                        <ImageIcon size={18} />
                    </button>
                </div>
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() && !selectedImage}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;