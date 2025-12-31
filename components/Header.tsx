import React from 'react';
import { Sparkles, ShieldCheck, Library as LibraryIcon, Plus } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'library' | 'result';
  onNavigate: (view: 'home' | 'library') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-slate-200/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-4">
        
        {/* Logo Area */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onNavigate('home')}
        >
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/10 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">CivicEase</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Intelligent Document Assistant</p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
           {currentView === 'library' ? (
             <button 
               onClick={() => onNavigate('home')}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-semibold shadow-md shadow-indigo-200 transition-all hover:scale-105"
             >
               <Plus className="w-4 h-4" />
               <span className="hidden sm:inline">New Scan</span>
             </button>
           ) : (
             <button 
                onClick={() => onNavigate('library')}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-sm font-semibold transition-all hover:border-indigo-200 hover:text-indigo-600"
             >
                <LibraryIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Library</span>
             </button>
           )}
           
           <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100 ml-2">
             <Sparkles className="w-3.5 h-3.5" />
             <span>AI Powered</span>
           </div>
        </div>
      </div>
    </header>
  );
};
