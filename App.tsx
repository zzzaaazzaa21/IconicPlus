import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import VoiceMode from './components/VoiceMode';
import Studio from './components/Studio';
import MCQMode from './components/MCQMode';
import { AppMode, ChatSession, ChatMessage, User } from './types';
import { MessageSquare, Mic, Palette, LogOut, Menu, X, BookOpenCheck, PanelLeftClose, PanelLeftOpen, Sun, Moon, Plus, Trash2 } from 'lucide-react';
import { supabase } from './utils/supabase';

const LogoIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M192 128H320C373.019 128 416 170.981 416 224C416 277.019 373.019 320 320 320H256V448H192V128Z" fill="white" />
    <path d="M192 128V448M160 160H128M160 224H128M160 288H128" stroke="white" strokeWidth="12" strokeLinecap="round" />
    <circle cx="128" cy="160" r="8" fill="white" />
    <circle cx="128" cy="224" r="8" fill="white" />
    <circle cx="128" cy="288" r="8" fill="white" />
    <path d="M140 400C140 433.137 256 460 256 460C256 460 372 433.137 372 400C372 366.863 256 340 256 340C256 340 140 366.863 140 400Z" stroke="white" strokeWidth="8" />
    <path d="M330 200L340 210M340 200L330 210" stroke="white" strokeWidth="4" />
    <path d="M440 360L450 370M450 360L440 370" stroke="white" strokeWidth="4" />
    <path d="M100 320L110 330M110 320L100 330" stroke="white" strokeWidth="4" />
  </svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Shared Chat Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.email,
          provider: session.user.app_metadata.provider as any,
          avatar: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`
        };
        setUser(user);
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.email,
          provider: session.user.app_metadata.provider as any,
          avatar: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`
        };
        setUser(user);
      } else {
        setUser(null);
      }
    });

    const savedSessions = localStorage.getItem('iconic_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    } else if (user) {
      handleCreateNewSession();
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('iconic_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (sessions.length === 0) {
      handleCreateNewSession();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMode(AppMode.CHAT);
  };

  const handleCreateNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [], // Initialize empty to trigger dashboard in ChatInterface
      lastModified: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMode(AppMode.CHAT);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (id === activeSessionId && filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else if (filtered.length === 0) {
        return [];
      }
      return filtered;
    });
  };

  // Watch for empty sessions to auto-create
  useEffect(() => {
    if (user && sessions.length === 0) {
      handleCreateNewSession();
    }
  }, [sessions, user]);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const NavItem = ({ m, icon: Icon, label }: { m: AppMode; icon: any; label: string }) => (
    <button
      onClick={() => {
        setMode(m);
        setSidebarOpen(false);
      }}
      title={isCollapsed ? label : ''}
      className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
        isCollapsed ? 'justify-center' : 'space-x-3'
      } ${
        mode === m 
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <Icon size={20} className="flex-shrink-0" />
      {!isCollapsed && <span className="font-medium truncate">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden relative selection:bg-indigo-500/30 bg-black">
      
      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-lg text-slate-300 hover:text-white"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 glass-panel border-r transition-all duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64 w-64'}
      `}>
        <div className="p-4 flex flex-col h-full overflow-hidden">
          {/* Sidebar Header with Logo */}
          <div className={`flex items-start mb-8 shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex flex-col">
              <div className={`flex items-center transition-opacity duration-300`}>
                <LogoIcon className={isCollapsed ? "w-8 h-8" : "w-10 h-10"} />
                {!isCollapsed && (
                  <div className="ml-3">
                    <span className="text-lg font-black holographic-text tracking-tighter italic">IconicPlus</span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="mt-1.5 ml-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500/80">
                    Dev-Ahammadullah Zahid
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
          </div>
          
          <nav className="space-y-1.5 mb-8 shrink-0">
            <NavItem m={AppMode.CHAT} icon={MessageSquare} label="Chat" />
            <NavItem m={AppMode.MCQ} icon={BookOpenCheck} label="MCQ Test Mode" />
            <NavItem m={AppMode.VOICE} icon={Mic} label="Voice Mode" />
            <NavItem m={AppMode.STUDIO} icon={Palette} label="Creative Studio" />
          </nav>

          {/* Chat History Section */}
          {!isCollapsed && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">History</span>
                <button 
                  onClick={handleCreateNewSession}
                  className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-indigo-400 transition-colors"
                  title="New Conversation"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {sessions.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => {
                      setMode(AppMode.CHAT);
                      setActiveSessionId(s.id);
                    }}
                    className={`group relative flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${
                      activeSessionId === s.id && mode === AppMode.CHAT
                        ? 'bg-white/5 border-white/10 text-indigo-300' 
                        : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-300'
                    }`}
                  >
                    <MessageSquare size={14} className="shrink-0 mr-3 opacity-50" />
                    <span className="text-xs font-medium truncate flex-1">{s.title}</span>
                    <button 
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-white/5 space-y-4 shrink-0 mt-auto">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white font-black text-lg select-none">
                  {user.name.trim().charAt(0).toUpperCase()}
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-inherit truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase tracking-widest font-bold">Neural ID: {user.id.slice(0, 8)}</p>
                </div>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center text-slate-500 hover:text-rose-400 transition-colors text-sm ${isCollapsed ? 'justify-center' : 'space-x-2'}`}
            >
              <LogOut size={16} className="flex-shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-inherit">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-40 left-20 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <main className="flex-1 overflow-hidden relative z-10">
          {mode === AppMode.CHAT && (
            <ChatInterface 
              sessions={sessions} 
              activeSessionId={activeSessionId} 
              setSessions={setSessions}
              setActiveSessionId={setActiveSessionId}
            />
          )}
          {mode === AppMode.MCQ && <MCQMode />}
          {mode === AppMode.VOICE && <VoiceMode />}
          {mode === AppMode.STUDIO && <Studio />}
        </main>
      </div>
      
    </div>
  );
};

export default App;