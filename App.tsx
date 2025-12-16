import React, { useState } from 'react';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import VoiceMode from './components/VoiceMode';
import Studio from './components/Studio';
import { AppMode } from './types';
import { MessageSquare, Mic, Palette, LogOut, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const NavItem = ({ m, icon: Icon, label }: { m: AppMode; icon: any; label: string }) => (
    <button
      onClick={() => {
        setMode(m);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        mode === m 
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-lg"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-white/10 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="mb-8 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 p-3 rounded-lg shadow-lg shadow-purple-500/20">
            <h1 className="text-2xl font-extrabold text-white tracking-tighter">IconicPlus</h1>
          </div>
          
          <nav className="space-y-2">
            <NavItem m={AppMode.CHAT} icon={MessageSquare} label="Chat" />
            <NavItem m={AppMode.VOICE} icon={Mic} label="Voice Mode" />
            <NavItem m={AppMode.STUDIO} icon={Palette} label="Creative Studio" />
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/5">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 p-[1px]">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold">IP</div>
            </div>
            <div>
              <p className="text-sm font-medium text-white">User Name</p>
              <p className="text-xs text-slate-500">Premium Plan</p>
            </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center space-x-2 text-slate-500 hover:text-rose-400 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050505] to-[#050505]">
        {/* Decorative ambient lights */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 left-20 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <main className="flex-1 overflow-hidden relative z-10">
          {mode === AppMode.CHAT && <ChatInterface />}
          {mode === AppMode.VOICE && <VoiceMode />}
          {mode === AppMode.STUDIO && <Studio />}
        </main>
      </div>
      
    </div>
  );
};

export default App;