import React, { useRef } from 'react';
import { Upload, FileImage, X, ScanEye } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  onClear: () => void;
  isAnalyzing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onFileSelect, 
  selectedFile, 
  previewUrl, 
  onClear,
  isAnalyzing 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnalyzing) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith('image/')) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (isAnalyzing) return;
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  if (selectedFile && previewUrl) {
    return (
      <div className="relative group rounded-2xl overflow-hidden bg-white shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-500 hover:shadow-2xl">
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors z-10" />
        
        {/* Document Header Bar simulation */}
        <div className="h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            <div className="ml-auto text-[10px] text-slate-400 font-mono">IMG_SCAN_001.JPG</div>
        </div>

        <div className="p-8 bg-slate-50/50 flex justify-center items-center min-h-[300px]">
           <img 
            src={previewUrl} 
            alt="Document Preview" 
            className="max-w-full max-h-[400px] object-contain shadow-md rounded-sm transform group-hover:scale-[1.01] transition-transform duration-500"
          />
        </div>

        {!isAnalyzing && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-12 right-4 z-20 p-2.5 bg-white text-slate-700 rounded-full shadow-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        {/* Analyzing Overlay */}
        {isAnalyzing && (
            <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                    <div className="bg-white p-4 rounded-full shadow-xl border border-blue-100 relative">
                        <ScanEye className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Analyzing Document</h3>
                <p className="text-slate-500 text-sm">Deciphering bureaucracy...</p>
            </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden
        ${isAnalyzing 
            ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 group bg-white'
        }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept="image/*" 
        className="hidden" 
        disabled={isAnalyzing}
      />
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />

      <div className="relative flex flex-col items-center justify-center gap-5">
        <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm border border-indigo-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
          <Upload className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Drag and drop your letter, form, or notice here. 
            <br/><span className="text-indigo-600 font-medium group-hover:underline">Or click to browse files</span>
          </p>
        </div>
        <div className="flex gap-3 mt-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">JPG</span>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">PNG</span>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">WEBP</span>
        </div>
      </div>
    </div>
  );
};