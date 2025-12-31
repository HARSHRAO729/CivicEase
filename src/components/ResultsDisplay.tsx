import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, UrgencyLevel, ChatMessage } from '../types';
import { AlertTriangle, CheckCircle2, Clock, Copy, Check, ClipboardList, PenTool, Send, Bot, User, Sparkles } from 'lucide-react';
import { createDocumentChat } from '../services/gemini';

interface ResultsDisplayProps {
  result: AnalysisResult;
  imageBase64: string; // Changed from File to base64 string to support stored docs
  initialChatHistory?: ChatMessage[];
  onChatUpdate?: (history: ChatMessage[]) => void;
}

const UrgencyBadge: React.FC<{ level: UrgencyLevel }> = ({ level }) => {
  const styles = {
    [UrgencyLevel.HIGH]: 'bg-red-50 text-red-700 border-red-200 ring-red-100',
    [UrgencyLevel.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
    [UrgencyLevel.LOW]: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    [UrgencyLevel.UNKNOWN]: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-100',
  };

  const icons = {
    [UrgencyLevel.HIGH]: AlertTriangle,
    [UrgencyLevel.MEDIUM]: Clock,
    [UrgencyLevel.LOW]: CheckCircle2,
    [UrgencyLevel.UNKNOWN]: Clock,
  };

  const Icon = icons[level];

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ring-4 text-sm font-bold shadow-sm transition-all ${styles[level]}`}>
      <Icon className="w-4 h-4" />
      <span>{level} Priority</span>
    </div>
  );
};

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  result, 
  imageBase64, 
  initialChatHistory = [],
  onChatUpdate 
}) => {
  const [copied, setCopied] = useState(false);
  
  // Chat State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatHistory);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat when component mounts or image changes
  useEffect(() => {
    const initChat = async () => {
      try {
        const chat = await createDocumentChat(imageBase64, initialChatHistory);
        setChatSession(chat);
        // Only set messages if we haven't already (prevents overwriting if re-rendering)
        if (messages.length === 0 && initialChatHistory.length > 0) {
           setMessages(initialChatHistory);
        }
      } catch (e) {
        console.error("Failed to initialize chat", e);
      }
    };
    initChat();
  }, [imageBase64]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.draft_reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSession || isSending) return;

    const userMsg = input.trim();
    setInput('');
    
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userMsg }];
    setMessages(newMessages);
    setIsSending(true);

    // Notify parent immediately
    if (onChatUpdate) onChatUpdate(newMessages);

    try {
      const response = await chatSession.sendMessage({ message: userMsg });
      const text = response.text || "I couldn't generate a response.";
      
      const updatedMessages: ChatMessage[] = [...newMessages, { role: 'model', text }];
      setMessages(updatedMessages);
      if (onChatUpdate) onChatUpdate(updatedMessages);

    } catch (error) {
      const errorMsg: ChatMessage = { role: 'model', text: "Sorry, I encountered an error answering that." };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      if (onChatUpdate) onChatUpdate(updatedMessages);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      
      {/* Summary Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full opacity-50 -mr-8 -mt-8" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-serif">Executive Summary</h2>
            <p className="text-slate-600 leading-relaxed text-lg max-w-2xl">
              {result.summary}
            </p>
          </div>
          <div className="flex-shrink-0">
             <UrgencyBadge level={result.urgency} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Action Plan */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                    <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Action Checklist</h3>
            </div>
            
            <ul className="space-y-6 flex-grow">
            {result.action_steps.map((step, idx) => (
                <li key={idx} className="flex gap-5">
                    <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold text-sm shadow-sm">
                            {idx + 1}
                        </div>
                    </div>
                    <span className="text-slate-700 text-lg font-medium leading-relaxed pt-0.5">{step}</span>
                </li>
            ))}
            </ul>
        </div>

        {/* Draft Reply */}
        <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-xl shadow-slate-900/20 overflow-hidden flex flex-col h-full ring-4 ring-slate-100">
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg">
                    <PenTool className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-bold text-sm tracking-wide uppercase text-slate-400">Draft Response</h3>
                </div>
            </div>
            <button
                onClick={handleCopy}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-all text-xs font-bold text-white shadow-lg shadow-indigo-900/20"
            >
                {copied ? (
                <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                </>
                ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                </>
                )}
            </button>
            </div>
            <div className="p-8 font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap flex-grow bg-gradient-to-b from-slate-900 to-slate-800/80">
                {result.draft_reply}
            </div>
        </div>
      </div>

      {/* Chat Bot Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">Ask AI about this document</h3>
            <p className="text-sm text-slate-500">Need clarification? Chat with the assistant.</p>
          </div>
        </div>

        <div className="h-96 flex flex-col">
          <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 my-10 space-y-2">
                <Bot className="w-12 h-12 mx-auto opacity-20" />
                <p>Ask a question to start the conversation.</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-200' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
            {isSending && (
               <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: What is the deadline mentioned?"
                className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                disabled={isSending}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isSending}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
