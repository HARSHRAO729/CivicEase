import { AnalysisResult, ChatMessage } from "../types";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

// Convert file to base64
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Send document for analysis
export const analyzeDocument = async (
  file: File
): Promise<{ analysis: AnalysisResult; base64: string }> => {
  const fullDataUrl = await fileToBase64(file);

  const res = await fetch(`${BACKEND}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: fullDataUrl })
  });

  if (!res.ok) throw new Error("Backend analysis failed");

  return res.json();
};

// Continue chat
export const continueChat = async (
  imageBase64: string,
  history: ChatMessage[],
  userMessage: string
) => {
  const res = await fetch(`${BACKEND}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      history,
      message: userMessage
    })
  });

  if (!res.ok) throw new Error("Chat failed");

  return res.json();
};
