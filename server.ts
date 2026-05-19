import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' })); // Support large images

app.post("/api/analyze-plant", async (req, res) => {
  try {
    const { mediaBase64, mimeType, isVideo } = req.body;
    
    // We expect a base64 encoded media string
    if (!mediaBase64 || !mimeType) {
      return res.status(400).json({ error: "Missing media data" });
    }
    
    // Since we're not providing firebase admin access, the client sends base64.
    // That could be large. But acceptable for images.
    // For video it might be an issue. If it's a video, they need to upload and maybe we get URL?
    // Wait, the client can just pass the base64 or downloadUrl.
    // Wait, Gemini API `inlineData` requires base64. To use URL it needs to be accessible by Gemini or use File API.
    // If it's a base64 string, we can just pass it to `inlineData`.
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: mediaBase64,
      },
    };
    
    const textPart = {
      text: `You are a professional cannabis cultivation AI operating system. 
Analyze the provided plant media and provide a structured JSON response.
Do not fabricate a confident diagnosis from poor media. Provide a fallback if necessary.`,
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isFallback: { type: Type.BOOLEAN, description: "True if media quality is inadequate." },
        fallbackReason: { type: Type.STRING },
        overallHealthScore: { type: Type.NUMBER, description: "0-100 score" },
        confidenceScore: { type: Type.NUMBER, description: "0-1" },
        estimatedStage: { type: Type.STRING },
        stageConfidence: { type: Type.NUMBER },
        imageQuality: { type: Type.STRING },
        visualObservations: { type: Type.ARRAY, items: { type: Type.STRING } },
        diagnosticHypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
        findings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              severity: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              title: { type: Type.STRING },
              recommendation: { type: Type.STRING },
            }
          }
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
        safetyCaveats: { type: Type.STRING },
      },
      required: [
        "isFallback",
        "overallHealthScore",
        "confidenceScore",
        "estimatedStage",
        "stageConfidence",
        "imageQuality",
        "visualObservations",
        "diagnosticHypotheses",
        "findings",
        "recommendations",
        "suggestedTasks",
        "safetyCaveats"
      ]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze plant" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
