import React from 'react';
import { StoredDocument, UrgencyLevel } from '../types';
import { Clock, Trash2, ArrowRight, FileText, Calendar } from 'lucide-react';

interface LibraryProps {
  documents: StoredDocument[];
  onSelect: (doc: StoredDocument) => void;
  onDelete: (id: string) => void;
}

const UrgencyDot: React.FC<{ level: UrgencyLevel }> = ({ level }) => {
  const colors = {
    [UrgencyLevel.HIGH]: 'bg-red-500',
    [UrgencyLevel.MEDIUM]: 'bg-amber-500',
    [UrgencyLevel.LOW]: 'bg-emerald-500',
    [UrgencyLevel.UNKNOWN]: 'bg-slate-300',
  };
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[level]}`} title={`${level} Priority`} />;
};

export const Library: React.FC<LibraryProps> = ({ documents, onSelect, onDelete }) => {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 font-serif mb-2">Your library is empty</h3>
        <p className="text-slate-500 max-w-sm">
          Documents you analyze will automatically appear here so you can revisit them anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 font-serif">Saved Documents</h2>
        <span className="text-sm font-medium text-slate-500">{documents.length} items</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => onSelect(doc)}
            className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
          >
            {/* Card Header with Image Preview */}
            <div className="h-32 bg-slate-100 relative overflow-hidden">
                <img 
                    src={doc.imageBase64} 
                    alt="Document thumbnail" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute top-3 right-3">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm shadow-sm
                        ${doc.analysis.urgency === UrgencyLevel.HIGH ? 'text-red-600' : 'text-slate-700'}`}>
                        <UrgencyDot level={doc.analysis.urgency} />
                        {doc.analysis.urgency}
                     </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-3">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(doc.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 font-serif group-hover:text-indigo-600 transition-colors">
                {doc.analysis.summary}
              </h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                    className="p-2 -ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete document"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
                 <span className="flex items-center gap-1 text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    View 
                    <ArrowRight className="w-4 h-4" />
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
