import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Library } from './components/Library';
import { analyzeDocument } from './services/gemini';
import { saveDocument, getDocuments, deleteDocument, updateChatHistory } from './services/storage';
import { DocumentState, StoredDocument, ChatMessage } from './types';
import { Sparkles, AlertCircle, RefreshCcw, ArrowRight } from 'lucide-react';

type ViewMode = 'home' | 'library' | 'result';

export default function App() {
  const [view, setView] = useState<ViewMode>('home');
  const [libraryDocs, setLibraryDocs] = useState<StoredDocument[]>([]);
  
  // Active document state
  const [state, setState] = useState<DocumentState>({
    file: null,
    previewUrl: null,
    isAnalyzing: false,
    result: null,
    error: null,
  });

  // Extra state for active document metadata that might come from storage
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeBase64, setActiveBase64] = useState<string | null>(null);
  const [activeChatHistory, setActiveChatHistory] = useState<ChatMessage[]>([]);

  // Load library on mount
  useEffect(() => {
    refreshLibrary();
  }, []);

  const refreshLibrary = () => {
    setLibraryDocs(getDocuments());
  };

  const handleNavigate = (newView: 'home' | 'library') => {
    if (newView === 'home') {
      handleClear(); // Reset scan state
    }
    if (newView === 'library') {
      refreshLibrary();
    }
    setView(newView);
  };

  const handleFileSelect = (file: File) => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      file,
      previewUrl: url,
      result: null,
      error: null
    }));
  };

  const handleClear = () => {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({
      file: null,
      previewUrl: null,
      isAnalyzing: false,
      result: null,
      error: null
    });
    setActiveDocId(null);
    setActiveBase64(null);
    setActiveChatHistory([]);
    setView('home');
  };

  const handleAnalyze = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const { analysis, base64 } = await analyzeDocument(state.file);
      
      // Save to library immediately
      const newDoc: StoredDocument = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: state.file.name,
        imageBase64: base64,
        analysis: analysis,
        chatHistory: []
      };
      
      saveDocument(newDoc);
      refreshLibrary();

      // Set active state
      setActiveDocId(newDoc.id);
      setActiveBase64(base64);
      setActiveChatHistory([]);
      setState(prev => ({ ...prev, result: analysis, isAnalyzing: false }));
      setView('result');

    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (errorMessage.includes("API key")) {
          errorMessage = "Invalid or missing API Key. Please check your environment configuration.";
        }
      }
      setState(prev => ({ ...prev, error: errorMessage, isAnalyzing: false }));
    }
  };

  const handleSelectFromLibrary = (doc: StoredDocument) => {
    setActiveDocId(doc.id);
    setActiveBase64(doc.imageBase64);
    setActiveChatHistory(doc.chatHistory);
    
    // We don't have the original File object, but we have the result and base64
    setState({
      file: null, // File object is lost, but we use base64 for display/logic
      previewUrl: null, // Not needed as we use base64
      isAnalyzing: false,
      result: doc.analysis,
      error: null
    });
    
    setView('result');
  };

  const handleDeleteFromLibrary = (id: string) => {
    deleteDocument(id);
    refreshLibrary();
    // If deleted current doc, go back to library
    if (activeDocId === id) {
       setView('library');
    }
  };

  const handleChatUpdate = (history: ChatMessage[]) => {
    if (activeDocId) {
      updateChatHistory(activeDocId, history);
      setActiveChatHistory(history);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-x-hidden">
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-100/50 rounded-[100%] blur-3xl opacity-60 mix-blend-multiply"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
            <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-teal-100/30 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

      <Header currentView={view === 'result' ? 'home' : (view as 'home' | 'library')} onNavigate={handleNavigate} />

      <main className="relative z-10 flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 space-y-12">
        
        {/* Library View */}
        {view === 'library' && (
          <Library 
            documents={libraryDocs}
            onSelect={handleSelectFromLibrary}
            onDelete={handleDeleteFromLibrary}
          />
        )}

        {/* Home / Upload View */}
        {view === 'home' && (
          <>
            <div className="text-center space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-sm font-medium mb-4">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Ready to analyze
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight font-serif leading-tight">
                Turn bureaucracy into <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">actionable steps</span>
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                Upload any official letter, form, or notice. CivicEase uses AI to explain it simply and draft your response instantly.
                </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
                <div className="transition-all duration-300 transform">
                    <UploadZone 
                        onFileSelect={handleFileSelect} 
                        selectedFile={state.file}
                        previewUrl={state.previewUrl}
                        onClear={handleClear}
                        isAnalyzing={state.isAnalyzing}
                    />
                </div>

                {state.file && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={handleAnalyze}
                            disabled={state.isAnalyzing}
                            className={`group relative w-full py-5 rounded-2xl font-bold text-lg text-white shadow-xl shadow-indigo-200 transition-all duration-300 overflow-hidden
                                ${state.isAnalyzing 
                                ? 'bg-slate-800 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-2xl hover:shadow-indigo-300 hover:scale-[1.01] active:scale-[0.99]'
                                }`}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            <span className="relative flex items-center justify-center gap-3">
                                {state.isAnalyzing ? (
                                    <span>Processing Document...</span>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Analyze Document
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                        {state.isAnalyzing && (
                            <p className="text-center text-slate-400 text-sm mt-4 animate-pulse">
                                This usually takes about 5-10 seconds...
                            </p>
                        )}
                    </div>
                )}
                 {/* Error Display */}
                {state.error && (
                    <div className="animate-in slide-in-from-top-2 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 text-red-800 shadow-sm">
                        <div className="p-2 bg-red-100 rounded-full shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">Analysis Failed</h4>
                            <p className="text-red-700 mt-1 leading-relaxed">{state.error}</p>
                            <button 
                                onClick={handleAnalyze}
                                className="mt-3 text-sm font-semibold text-red-700 underline hover:text-red-900"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </>
        )}

        {/* Results View */}
        {(view === 'result' || (view === 'home' && state.result)) && state.result && activeBase64 && (
          <div className="max-w-5xl mx-auto">
             <ResultsDisplay 
               result={state.result} 
               imageBase64={activeBase64} 
               initialChatHistory={activeChatHistory}
               onChatUpdate={handleChatUpdate}
             />
             
             <div className="flex justify-center pt-16 pb-12">
                <button
                    onClick={handleClear}
                    className="group px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-2 text-slate-600 hover:text-indigo-600"
                >
                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-medium">Scan new document</span>
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}