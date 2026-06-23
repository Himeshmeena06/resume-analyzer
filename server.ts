import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize the Gemini API client using the server-side environment variable
// Always include the 'aistudio-build' User-Agent header in httpOptions for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json({ limit: "10mb" }));

// Endpoint to analyze the resume using the Gemini API
app.post("/api/analyze", async (req, res) => {
  try {
    const { resumeText, roastMode } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: "Resume text is required." });
    }

    const mode = roastMode || "Friendly Roast";

    const prompt = `
Analyze the following resume text.
Provide:
1. An ATS Score out of 100.
2. Strengths of the resume (at least 3 key points).
3. Weaknesses of the resume (at least 3 key points).
4. Missing critical skills that are standard for this industry/role but absent in the resume (at least 3-5 skills).
5. Actionable improvement suggestions (at least 3 points, with clear "Before" and "After" comparisons showing how to rewrite weak points).
6. A funny, witty, but highly constructive roast based on the selected mode: "${mode}".
   - "Friendly Roast": Playful, light-hearted, and encouraging.
   - "Recruiter Roast": From the perspective of a tired, cynical recruiter who spends only 6 seconds scanning a resume.
   - "Brutal Roast": Hilariously blunt, roasting the resume's visual/content flaws, but still ending on a helpful note.

Never use offensive, abusive, or highly discouraging language in any roast. Keep the humor high but constructive.

Resume Text:
${resumeText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Resume Reviewer, Career Coach, and ATS (Applicant Tracking System) Specialist. Your goal is to analyze the user's resume and return a highly detailed, accurate, and professional analysis in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: {
              type: Type.INTEGER,
              description: "A calculated score out of 100 based on ATS readability, structure, and keyword density.",
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of core strengths found in the resume.",
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of weaknesses, formatting issues, or content gaps.",
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of technical or professional skills missing from the resume based on target roles.",
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable suggestions formatted as 'Before: [original text] | After: [improved text]'.",
            },
            roast: {
              type: Type.STRING,
              description: "The custom roast message matching the requested style.",
            },
          },
          required: ["atsScore", "strengths", "weaknesses", "missingSkills", "suggestions", "roast"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini API.");
    }

    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({
      error: "Failed to analyze resume. Please try again later.",
      details: error.message || error,
    });
  }
});

// Setup Vite or static serving
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
