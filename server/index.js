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

    const imageData = imageBase64.split(",")[1];

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: "image/png"
        }
      },
      "Analyze this civic document and extract key info"
    ]);

    res.json({
      analysis: {
        summary: result.response.text()
      },
      base64: imageBase64
    });
  } catch (err) {
    console.error(err);
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});
