import { GoogleGenAI, Type, Schema, Chat, Content } from "@google/genai";
import { AnalysisResult, UrgencyLevel, ChatMessage } from '../types';

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to get Base64 string from File or Blob
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Return full data URI or just base64 depending on usage. 
      // API needs pure base64, HTML img needs data URI.
      // We will extract pure base64 for API calls.
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { 
      type: Type.STRING, 
      description: "A clear, simple summary of what the document is about." 
    },
    urgency: { 
      type: Type.STRING, 
      enum: [UrgencyLevel.HIGH, UrgencyLevel.MEDIUM, UrgencyLevel.LOW],
      description: "The urgency level of the document."
    },
    action_steps: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "A list of specific, actionable steps the user needs to take."
    },
    draft_reply: { 
      type: Type.STRING,
      description: "A polite and professional draft response or email based on the document's context."
    }
  },
  required: ["summary", "urgency", "action_steps", "draft_reply"]
};

// Returns Analysis Result AND the base64 string so we can store it
export const analyzeDocument = async (file: File): Promise<{ analysis: AnalysisResult, base64: string }> => {
  try {
    const client = getGeminiClient();
    const fullDataUrl = await fileToBase64(file);
    const base64Data = fullDataUrl.split(',')[1];
    const mimeType = file.type;

    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this document. Identify the core message, urgency, required actions, and write a draft reply." }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: "You are CivicEase, an expert assistant for understanding bureaucratic documents. Your goal is to simplify complex official language into clear, actionable advice. When listing action steps, keep them simple, sequential, and easy for a non-technical person to understand.",
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini");
    }

    const analysis = JSON.parse(response.text) as AnalysisResult;
    return { analysis, base64: fullDataUrl };
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const createDocumentChat = async (imageBase64: string, previousHistory: ChatMessage[] = []): Promise<Chat> => {
  const client = getGeminiClient();
  
  // Clean base64 string if it contains data URI header
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  // Guess mime type from header if present, otherwise default (simplified for prototype)
  const mimeType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';

  const imagePart = {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType
    }
  };

  // Convert simplified ChatMessage[] to Gemini SDK Content[]
  // Note: We only pass the image in the very first user message of the history
  let history: Content[] = [];

  if (previousHistory.length > 0) {
    history = previousHistory.map((msg, index) => {
      if (index === 0 && msg.role === 'user') {
        // Re-attach image to the first message context
        return {
          role: 'user',
          parts: [imagePart, { text: msg.text }]
        };
      }
      return {
        role: msg.role,
        parts: [{ text: msg.text }]
      };
    });
  } else {
    // New chat initialization
    history = [
      {
        role: 'user',
        parts: [
          imagePart,
          { text: "I've uploaded this document. Please answer any questions I have about it." }
        ]
      },
      {
        role: 'model',
        parts: [{ text: "I've analyzed the document. What would you like to know?" }]
      }
    ];
  }
  
  return client.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a helpful assistant analyzing a document for a user. Keep your answers short, concise, and to the point. Use bullet points or numbered lists for structure. Avoid long paragraphs. Explain things simply."
    },
    history: history
  });
};