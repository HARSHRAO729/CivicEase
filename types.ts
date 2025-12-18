export enum UrgencyLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  UNKNOWN = 'Unknown'
}

export interface AnalysisResult {
  summary: string;
  urgency: UrgencyLevel;
  action_steps: string[];
  draft_reply: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StoredDocument {
  id: string;
  timestamp: number;
  fileName: string;
  imageBase64: string; // Storing image inline for local persistence
  analysis: AnalysisResult;
  chatHistory: ChatMessage[];
}

export interface DocumentState {
  file: File | null;
  previewUrl: string | null;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
}