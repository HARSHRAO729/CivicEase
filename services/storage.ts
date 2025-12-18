import { StoredDocument, ChatMessage } from '../types';

const STORAGE_KEY = 'civicease_library_v1';

export const saveDocument = (doc: StoredDocument): void => {
  try {
    const existing = getDocuments();
    // Check if we are updating an existing one or adding new
    const index = existing.findIndex(d => d.id === doc.id);
    
    if (index >= 0) {
      existing[index] = doc;
    } else {
      existing.unshift(doc); // Add to top
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Failed to save to library. Storage might be full.", error);
    // Optional: Handle quota exceeded error
  }
};

export const getDocuments = (): StoredDocument[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load library", error);
    return [];
  }
};

export const deleteDocument = (id: string): void => {
  const existing = getDocuments();
  const filtered = existing.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateChatHistory = (id: string, history: ChatMessage[]): void => {
  const existing = getDocuments();
  const doc = existing.find(d => d.id === id);
  if (doc) {
    doc.chatHistory = history;
    saveDocument(doc);
  }
};