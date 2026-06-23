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

    // Ordered list of models to try in case of transient 503 or high demand errors
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
    let responseText = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting analysis with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
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

        if (response.text) {
          responseText = response.text;
          console.log(`Analysis succeeded using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or was overloaded. Error: ${err.message || err}`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All fallback models failed to generate content.");
    }

    const parsedResult = JSON.parse(responseText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({
      error: "Failed to analyze resume. Please try again later.",
      details: error.message || error,
    });
  }
});

// Resume Builder API Endpoint
app.post("/api/generate-resume", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      linkedIn,
      gitHub,
      education,
      skills,
      projects,
      experience,
      certifications
    } = req.body;

    const prompt = `
You are a highly skilled Professional Resume Writer and Executive Career Coach. 
Your task is to take the raw, draft-level input provided by a candidate and synthesize it into a pristine, high-impact, ATS-optimized professional resume.

CRITICAL DIRECTIVES:
- Ensure all descriptions use action verbs (e.g., " Spearheaded", "Architected", "Engineered", "Optimized") and incorporate quantifiable metrics or results where plausible.
- Categorize skills logically.
- Return the compiled resume strictly adhering to the JSON response schema.

Raw Candidate Inputs:
- Full Name: ${fullName || "John Doe"}
- Email: ${email || ""}
- Phone: ${phone || ""}
- LinkedIn: ${linkedIn || ""}
- GitHub: ${gitHub || ""}
- Education Input: ${education || ""}
- Skills/Technologies: ${skills || ""}
- Projects Input: ${projects || ""}
- Experience Input: ${experience || ""}
- Certifications/Awards: ${certifications || ""}
`;

    // Try multiple models for high resilience against transient 503 load errors
    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
    let responseText = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting resume building with model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: "You are an elite executive resume writer. Take the candidate's raw data and return a fully fleshed out, professional, ATS-optimized resume in JSON format.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                contactInfo: {
                  type: Type.OBJECT,
                  properties: {
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    linkedin: { type: Type.STRING },
                    github: { type: Type.STRING }
                  },
                  required: ["email", "phone"]
                },
                professionalSummary: { 
                  type: Type.STRING, 
                  description: "A compelling 3-4 sentence summary of professional background, key expertise, and value proposition." 
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      degree: { type: Type.STRING },
                      school: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      details: { type: Type.STRING }
                    },
                    required: ["degree", "school"]
                  }
                },
                skills: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING, description: "e.g., Languages, Frameworks, Developer Tools" },
                      items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["category", "items"]
                  }
                },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      technologies: { type: Type.STRING, description: "e.g., React, Node.js, WebSockets" },
                      descriptionBullets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-impact achievements/descriptions using action verbs." }
                    },
                    required: ["title", "descriptionBullets"]
                  }
                },
                experience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      role: { type: Type.STRING },
                      company: { type: Type.STRING },
                      location: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      accomplishments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "High-impact bullets stating actions taken and metrics/results achieved." }
                    },
                    required: ["role", "company", "accomplishments"]
                  }
                },
                certifications: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["fullName", "contactInfo", "professionalSummary", "education", "skills", "projects", "experience", "certifications"]
            }
          }
        });

        if (response.text) {
          responseText = response.text;
          console.log(`Resume successfully built using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} failed during resume build: ${err.message || err}`);
        lastError = err;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All fallback models failed to build resume.");
    }

    const parsedResult = JSON.parse(responseText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error generating resume:", error);
    res.status(500).json({
      error: "Failed to generate professional resume. Please try again later.",
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
