import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64.split(",")[1],
          mimeType: "image/png"
        }
      },
      "Analyze this civic document"
    ]);

    res.json({
      analysis: { summary: result.response.text() }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { history, message } = req.body;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);

    res.json({
      reply: result.response.text()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat failed" });
  }
});

app.listen(3000, () => console.log("Backend running"));
