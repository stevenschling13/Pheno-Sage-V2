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
Do not fabricate a confident diagnosis from poor media. 
If the media quality is inadequate for analysis (e.g., blurry, out of focus, poor lighting/too dark, camera too far away, or plant is obstructed), set 'isFallback' to true.
Provide a specific, detailed, and user-friendly 'fallbackReason' describing exactly why the media cannot be analyzed and MUST include a clear suggestion on how to improve the media for re-analysis (e.g. "The image is too blurry to identify leaf details. Please try taking another photo in a brighter area with the camera held steady and closer to the affected leaves.", "The lighting is too dim to accurately assess color. Please turn on grow lights or use the flash and take another photo.").`,
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
      model: "gemini-2.5-flash",
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
    let errorMessage = error.message || "Failed to analyze plant";
    let statusCode = 500;

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = "RATE LIMIT EXCEEDED. The analysis engine quota has been reached. Please wait and try again shortly.";
      statusCode = 429;
    }

    res.status(statusCode).json({ error: errorMessage });
  }
});

app.post("/api/copilot", async (req, res) => {
  try {
    const { input, history } = req.body;
    
    // We expect input string and history array
    if (!input) {
      return res.status(400).json({ error: "Missing input" });
    }
    
    // Aggregate high-frequency data points into chronological 4-hour interval structures
    let aggregatedHistory = history;
    if (Array.isArray(history) && history.length > 0) {
       const buckets = new Map();
       for (const entry of history) {
           // Fallback to grouping by date if timestamp is missing from mock data
           const time = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
           const bucketKey = time > 0 
               ? Math.floor(time / (4 * 60 * 60 * 1000)) * (4 * 60 * 60 * 1000) 
               : entry.date; 
           
           if (!buckets.has(bucketKey)) {
               buckets.set(bucketKey, { count: 0, vpd: 0, temp: 0, ec: 0, notes: [] });
           }
           const bucket = buckets.get(bucketKey);
           bucket.count += 1;
           if (entry.vpd) bucket.vpd += entry.vpd;
           // Also support temperature variants (temp or temperature)
           const temp = entry.temp || entry.temperature;
           if (temp) bucket.temp += temp;
           if (entry.ec) bucket.ec += entry.ec;
           if (entry.notes) bucket.notes.push(entry.notes);
       }
       
       aggregatedHistory = Array.from(buckets.entries()).map(([key, bucket]) => ({
           time: typeof key === 'number' ? new Date(key).toISOString() : key,
           avg_vpd: bucket.count && bucket.vpd ? Number((bucket.vpd / bucket.count).toFixed(2)) : undefined,
           avg_temp: bucket.count && bucket.temp ? Number((bucket.temp / bucket.count).toFixed(2)) : undefined,
           avg_ec: bucket.count && bucket.ec ? Number((bucket.ec / bucket.count).toFixed(2)) : undefined,
           events: bucket.notes.length > 0 ? bucket.notes.join('; ') : undefined
       }));
    }
    
    const textPart = {
      text: `You are a 'Predictive Analysis Ledger' in a cannabis cultivation OS (PhenoSage).
The user is providing an input or manual override (e.g., "increase humidity to 70%", or "feeding nutrient X at 5ml/gal").
You are provided with the following longitudinal history data for the current batch (aggregated in 4-hour blocks):
${JSON.stringify(aggregatedHistory, null, 2)}

Your directive:
Analyze the user's intent against the historical data. 
If the user's input contradicts the historical trend, could cause an issue based on the trends, or violates standard optimize protocols given the history (e.g. they want to raise humdity but history shows signs of PM or already high humidity), you MUST issue a "CRITICAL CORRECTION".
If the input is safe and aligns with the data, issue a "LEDGER_ENTRY" confirming the predictive outcome.

Output your response as JSON:`,
    };

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "'CRITICAL_CORRECTION' or 'LEDGER_ENTRY' or 'PREDICTIVE_INSIGHT'" },
        title: { type: Type.STRING },
        message: { type: Type.STRING, description: "Detailed analysis of the delta and predictive outcome." },
        metrics_impact: { 
          type: Type.ARRAY, 
          description: "Which metrics will be impacted and how (e.g. ['VPD: +5%', 'Temp: -2C'])",
          items: { type: Type.STRING } 
        }
      },
      required: ["type", "title", "message", "metrics_impact"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text;
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Copilot Error:", error);
    let errorMessage = error.message || "Failed to process copilot query";
    let statusCode = 500;

    if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
      errorMessage = "RATE LIMIT EXCEEDED. The analysis engine quota has been reached. Please wait and try again shortly.";
      statusCode = 429;
    }

    res.status(statusCode).json({ error: errorMessage });
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
