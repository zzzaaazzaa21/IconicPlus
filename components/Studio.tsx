import React, { useState, useRef } from 'react';
import { Video, Image as ImageIcon, Wand2, Key, Loader2, Download } from 'lucide-react';
import { generateImage, generateVideo, editImage } from '../services/gemini';

const Studio: React.FC = () => {
  const [tab, setTab] = useState<'create-image' | 'edit-image' | 'create-video'>('create-image');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Configs
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9'|'9:16'>('16:9');
  const [imgSize, setImgSize] = useState('1K');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey && window.aistudio.openSelectKey) {
              await window.aistudio.openSelectKey();
          }
      }
  };

  const handleGenerate = async () => {
      if (!prompt && !sourceImage) return;
      setLoading(true);
      setError(null);
      setResult(null);

      try {
          await checkKey(); // Ensure key is selected for paid features

          if (tab === 'create-image') {
              const res = await generateImage(prompt, aspectRatio, imgSize);
              setResult(res);
          } else if (tab === 'edit-image') {
              if (!sourceImage) throw new Error("Please upload an image to edit.");
              const res = await editImage(sourceImage, prompt);
              setResult(res);
          } else if (tab === 'create-video') {
              const res = await generateVideo(prompt, videoAspectRatio, sourceImage || undefined);
              setResult(res);
          }
      } catch (e: any) {
          console.error(e);
          setError(e.message || "Generation failed");
      } finally {
          setLoading(false);
      }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSourceImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Creative Studio</h2>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-white/10 pb-2">
            <button 
                onClick={() => { setTab('create-image'); setResult(null); }}
                className={`px-4 py-2 rounded-t-lg transition-colors ${tab === 'create-image' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <span className="flex items-center gap-2"><ImageIcon size={16}/> Create Image</span>
            </button>
            <button 
                onClick={() => { setTab('edit-image'); setResult(null); }}
                className={`px-4 py-2 rounded-t-lg transition-colors ${tab === 'edit-image' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <span className="flex items-center gap-2"><Wand2 size={16}/> Edit Image</span>
            </button>
            <button 
                onClick={() => { setTab('create-video'); setResult(null); }}
                className={`px-4 py-2 rounded-t-lg transition-colors ${tab === 'create-video' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <span className="flex items-center gap-2"><Video size={16}/> Veo Video</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    
                    {/* Source Image Input for Edit/Video */}
                    {(tab === 'edit-image' || tab === 'create-video') && (
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">
                                {tab === 'edit-image' ? 'Image to Edit' : 'Reference Image (Optional)'}
                            </label>
                            <div 
                                onClick={() => fileRef.current?.click()}
                                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/5 cursor-pointer transition-colors relative"
                            >
                                {sourceImage ? (
                                    <img src={sourceImage} className="max-h-32 mx-auto rounded" alt="Source" />
                                ) : (
                                    <div className="text-slate-500 text-sm">Click to upload image</div>
                                )}
                                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
                            </div>
                        </div>
                    )}

                    {/* Prompt */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32 resize-none"
                            placeholder={tab === 'edit-image' ? "Example: Add a retro filter..." : "Describe what you want to create..."}
                        />
                    </div>

                    {/* Settings */}
                    {tab === 'create-image' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Aspect Ratio</label>
                                <select 
                                    value={aspectRatio} 
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-slate-300"
                                >
                                    <option value="1:1">1:1 (Square)</option>
                                    <option value="16:9">16:9 (Landscape)</option>
                                    <option value="9:16">9:16 (Portrait)</option>
                                    <option value="4:3">4:3</option>
                                    <option value="3:4">3:4</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">Size</label>
                                <select 
                                    value={imgSize}
                                    onChange={(e) => setImgSize(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-slate-300"
                                >
                                    <option value="1K">1K</option>
                                    <option value="2K">2K</option>
                                    <option value="4K">4K</option>
                                </select>
                            </div>
                        </div>
                    )}
                     {tab === 'create-video' && (
                        <div>
                             <label className="block text-xs font-medium text-slate-400 mb-2">Aspect Ratio</label>
                             <select 
                                 value={videoAspectRatio} 
                                 onChange={(e) => setVideoAspectRatio(e.target.value as any)}
                                 className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-slate-300"
                             >
                                 <option value="16:9">16:9 (Landscape)</option>
                                 <option value="9:16">9:16 (Portrait)</option>
                             </select>
                         </div>
                    )}

                    <button 
                        onClick={handleGenerate}
                        disabled={loading || (!prompt && !sourceImage)}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-medium text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                    >
                        {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin"/> Generating...</span> : "Generate"}
                    </button>
                    <p className="text-xs text-center text-slate-500">
                        *Requires paid project API key selection
                    </p>
                </div>
            </div>

            {/* Results */}
            <div className="flex flex-col justify-center items-center glass-panel rounded-2xl min-h-[400px] p-4 border-2 border-dashed border-white/5">
                {error && (
                    <div className="text-rose-400 text-sm text-center bg-rose-500/10 p-4 rounded-lg">
                        {error}
                    </div>
                )}
                {loading && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 animate-pulse text-sm">Crafting your masterpiece...</p>
                        {tab === 'create-video' && <p className="text-slate-500 text-xs mt-2">Video generation takes a moment.</p>}
                    </div>
                )}
                {!loading && !result && !error && (
                    <div className="text-slate-600 text-center">
                        <Wand2 size={48} className="mx-auto mb-2 opacity-50"/>
                        <p>Result will appear here</p>
                    </div>
                )}
                {result && (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {tab === 'create-video' ? (
                            <video src={result} controls autoPlay loop className="max-w-full max-h-[500px] rounded-lg shadow-2xl" />
                        ) : (
                            <img src={result} alt="Generated" className="max-w-full max-h-[500px] rounded-lg shadow-2xl" />
                        )}
                        <a 
                            href={result} 
                            download={`iconicplus-${Date.now()}.${tab === 'create-video' ? 'mp4' : 'png'}`}
                            className="absolute bottom-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors backdrop-blur-sm"
                        >
                            <Download size={20} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Studio;