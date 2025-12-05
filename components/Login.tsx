import React from 'react';
import { Chrome, Facebook, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505]">
      <div className="relative w-full max-w-md p-8 glass-panel rounded-2xl animate-float">
        {/* Glow effect */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tighter holographic-text mb-2">IconicPlus</h1>
            <p className="text-slate-400 text-sm">Experience the Future of AI Intelligence</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
            >
              <Chrome className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-slate-200">Continue with Google</span>
            </button>
            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
            >
              <Facebook className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-slate-200">Continue with Facebook</span>
            </button>
            <button 
              onClick={onLogin}
              className="w-full flex items-center justify-center space-x-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group"
            >
              <Mail className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-slate-200">Continue with Email</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-500">
              By logging in, you agree to our Terms of Luxury & Innovation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;