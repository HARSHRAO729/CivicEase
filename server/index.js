import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Schema
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    urgency: { type: Type.STRING },
    action_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    draft_reply: { type: Type.STRING }
  },
  required: ["summary", "urgency", "action_steps", "draft_reply"]
};

// Analyze document
app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const cleanBase64 = imageBase64.split(",")[1];

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-pro",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
          { text: "Analyze this document. Identify the core message, urgency, required actions, and write a draft reply." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const analysis = JSON.parse(result.text);
    res.json({ analysis, base64: imageBase64 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// Continue chat
app.post("/api/chat", async (req, res) => {
  try {
    const { imageBase64, history, message } = req.body;

    const cleanBase64 = imageBase64.split(",")[1];

    const chat = genAI.chats.create({
      model: "gemini-1.5-pro",
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))
    });

    const result = await chat.sendMessage([
      { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
      { text: message }
    ]);

    res.json({ reply: result.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat failed" });
  }
});

app.listen(3000, () => console.log("Backend running on port 3000"));
