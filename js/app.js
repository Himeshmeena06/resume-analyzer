// Ensure Lucide is initialized on startup
document.addEventListener("DOMContentLoaded", () => {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
  setupApp();
});

function setupApp() {
  // DOM Elements
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("pdf-file-input");
  const fileInfo = document.getElementById("file-info");
  const fileNameSpan = document.getElementById("file-name");
  const removeFileBtn = document.getElementById("remove-file-btn");
  const dropZoneContent = document.getElementById("drop-zone-content");
  
  const resumeTextarea = document.getElementById("resume-textarea");
  const roastModeSelect = document.getElementById("roast-mode-select");
  const analyzeBtn = document.getElementById("analyze-btn");
  
  const loadingSection = document.getElementById("loading-section");
  const loadingStatusText = document.getElementById("loading-status-text");
  
  const resultsSection = document.getElementById("results-section");
  const clearBtn = document.getElementById("clear-btn");
  
  const atsCircle = document.getElementById("ats-circle");
  const atsScoreText = document.getElementById("ats-score-text");
  const atsBadge = document.getElementById("ats-badge");
  const atsFeedbackText = document.getElementById("ats-feedback-text");
  
  const roastBadge = document.getElementById("roast-badge");
  const roastContentText = document.getElementById("roast-content-text");
  
  const strengthsList = document.getElementById("strengths-list");
  const weaknessesList = document.getElementById("weaknesses-list");
  const skillsContainer = document.getElementById("skills-container");
  const suggestionsContainer = document.getElementById("suggestions-container");

  // Client-side API key and warning elements
  const apiSettingsToggleBtn = document.getElementById("api-settings-toggle-btn");
  const apiSettingsCard = document.getElementById("api-settings-card");
  const closeApiSettingsBtn = document.getElementById("close-api-settings-btn");
  const clientApiKeyInput = document.getElementById("client-api-key-input");
  const saveApiKeyBtn = document.getElementById("save-api-key-btn");
  const clearApiKeyBtn = document.getElementById("clear-api-key-btn");
  const apiKeyStatus = document.getElementById("api-key-status");
  
  const staticWarningAlert = document.getElementById("static-warning-alert");
  const alertConfigureKeyBtn = document.getElementById("alert-configure-key-btn");
  const closeStaticWarningBtn = document.getElementById("close-static-warning-btn");

  // Resume Builder UI bindings
  const tabAnalyzer = document.getElementById("tab-analyzer");
  const tabBuilder = document.getElementById("tab-builder");
  const analyzerViewWrapper = document.getElementById("analyzer-view-wrapper");
  const builderViewWrapper = document.getElementById("builder-view-wrapper");

  const builderFullName = document.getElementById("builder-fullname");
  const builderEmail = document.getElementById("builder-email");
  const builderPhone = document.getElementById("builder-phone");
  const builderLinkedIn = document.getElementById("builder-linkedin");
  const builderGitHub = document.getElementById("builder-github");
  const builderEducation = document.getElementById("builder-education");
  const builderSkills = document.getElementById("builder-skills");
  const builderProjects = document.getElementById("builder-projects");
  const builderExperience = document.getElementById("builder-experience");
  const builderCertifications = document.getElementById("builder-certifications");
  
  const generateResumeBtn = document.getElementById("generate-resume-btn");
  const builderLoadingSection = document.getElementById("builder-loading-section");
  const builderResultsSection = document.getElementById("builder-results-section");
  const copyResumeBtn = document.getElementById("copy-resume-btn");
  const downloadResumeBtn = document.getElementById("download-resume-btn");
  const resumeDocumentContent = document.getElementById("resume-document-content");

  let extractedText = "";
  let loadingInterval = null;
  let currentGeneratedResume = null;

  // Local Storage and API Key Utilities
  const LOCAL_STORAGE_KEY = "client_gemini_api_key";

  function getClientApiKey() {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
  }

  function saveClientApiKey(key) {
    if (key.trim()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
      updateApiKeyUI();
    }
  }

  function clearClientApiKey() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    clientApiKeyInput.value = "";
    updateApiKeyUI();
  }

  function updateApiKeyUI() {
    const key = getClientApiKey();
    if (key) {
      clientApiKeyInput.value = "••••••••••••••••••••••••";
      apiKeyStatus.innerHTML = `<span class="text-emerald-400 flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> Custom Gemini API Key is configured and ready.</span>`;
    } else {
      clientApiKeyInput.value = "";
      apiKeyStatus.innerHTML = `<span class="text-slate-500 flex items-center gap-1"><i data-lucide="info" class="w-3.5 h-3.5"></i> Custom Key not configured. Using standard backend if online.</span>`;
    }
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  function showStaticHostingWarning() {
    staticWarningAlert.classList.remove("hidden");
    staticWarningAlert.scrollIntoView({ behavior: "smooth" });
  }

  // Bind API Key Action Listeners
  if (apiSettingsToggleBtn) {
    apiSettingsToggleBtn.addEventListener("click", () => {
      apiSettingsCard.classList.toggle("hidden");
    });
  }

  if (closeApiSettingsBtn) {
    closeApiSettingsBtn.addEventListener("click", () => {
      apiSettingsCard.classList.add("hidden");
    });
  }

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener("click", () => {
      const key = clientApiKeyInput.value.trim();
      if (key && !key.startsWith("••••")) {
        saveClientApiKey(key);
        alert("Custom API Key saved successfully!");
      } else if (!key) {
        alert("Please enter a valid key first.");
      }
    });
  }

  if (clearApiKeyBtn) {
    clearApiKeyBtn.addEventListener("click", () => {
      clearClientApiKey();
      alert("Custom API Key cleared.");
    });
  }

  if (alertConfigureKeyBtn) {
    alertConfigureKeyBtn.addEventListener("click", () => {
      apiSettingsCard.classList.remove("hidden");
      apiSettingsCard.scrollIntoView({ behavior: "smooth" });
      clientApiKeyInput.focus();
    });
  }

  if (closeStaticWarningBtn) {
    closeStaticWarningBtn.addEventListener("click", () => {
      staticWarningAlert.classList.add("hidden");
    });
  }

  // Initialize API Key UI on load
  updateApiKeyUI();

  // Tab Switcher Logic
  if (tabAnalyzer && tabBuilder && analyzerViewWrapper && builderViewWrapper) {
    tabAnalyzer.addEventListener("click", () => {
      // Set active styles for tabAnalyzer
      tabAnalyzer.className = "px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/10 focus:outline-none";
      // Set inactive styles for tabBuilder
      tabBuilder.className = "px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all duration-300 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 focus:outline-none";
      
      // Toggle visibility
      analyzerViewWrapper.classList.remove("hidden");
      builderViewWrapper.classList.add("hidden");
    });

    tabBuilder.addEventListener("click", () => {
      // Set active styles for tabBuilder
      tabBuilder.className = "px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/10 focus:outline-none";
      // Set inactive styles for tabAnalyzer
      tabAnalyzer.className = "px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all duration-300 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 focus:outline-none";
      
      // Toggle visibility
      builderViewWrapper.classList.remove("hidden");
      analyzerViewWrapper.classList.add("hidden");
      
      // Scroll to top of builder form smoothly
      builderViewWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // List of engaging status messages to cycle through during analysis
  const loadingMessages = [
    "Extracting resume text and scanning headers...",
    "Structuring resume sections and scanning formatting...",
    "Running ATS compatibility index heuristics...",
    "Cross-referencing tech stacks and industry standards...",
    "Calculating strength and weakness keyword matches...",
    "Formulating actionable recommendations with Before/After metrics...",
    "Whispering custom roasts with our AI models...",
    "Preparing your interactive analysis report..."
  ];

  // 1. PDF FILE HANDLING (Upload & Drag-and-Drop)
  
  // Click drop-zone to trigger hidden file input
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // Drag over drop-zone style changes
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("border-purple-500", "bg-purple-950/10");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("border-purple-500", "bg-purple-950/10");
    }, false);
  });

  // Handle file drop
  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // Handle manual file input selection
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Remove uploaded file
  removeFileBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetFileSelection();
  });

  // Main file selection pipeline
  async function handleFileSelection(file) {
    if (file.type !== "application/pdf") {
      alert("Please upload a valid PDF file.");
      return;
    }

    // Display file badge in UI
    fileNameSpan.textContent = file.name;
    dropZoneContent.classList.add("hidden");
    fileInfo.classList.remove("hidden");

    // Start extraction loader
    try {
      analyzeBtn.disabled = true;
      resumeTextarea.placeholder = "Reading text from PDF. Please wait...";
      
      const parsedText = await extractTextFromPDF(file);
      extractedText = parsedText;
      resumeTextarea.value = parsedText;
      
      // Dispatch input event to notify textarea of changes
      resumeTextarea.dispatchEvent(new Event("input"));
    } catch (error) {
      console.error("PDF Parsing error:", error);
      alert("Failed to parse PDF file. You can still paste your resume text manually in the text area below.");
      resetFileSelection();
    } finally {
      analyzeBtn.disabled = false;
      resumeTextarea.placeholder = "Paste your resume's text here... (formatting doesn't matter, our AI will parse it perfectly)";
    }
  }

  function resetFileSelection() {
    fileInput.value = "";
    dropZoneContent.classList.remove("hidden");
    fileInfo.classList.add("hidden");
    resumeTextarea.value = "";
    extractedText = "";
  }

  // Client-side PDF text extraction using PDF.js
  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    
    // Check if pdfjsLib is loaded
    const pdfjs = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
    if (!pdfjs) {
      throw new Error("PDF.js library is not loaded.");
    }

    // Set worker source URL
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
    
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  }

  // 2. LOADING STATE MANAGER
  function startLoader() {
    loadingSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    
    let messageIndex = 0;
    loadingStatusText.textContent = loadingMessages[0];
    
    loadingInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      loadingStatusText.textContent = loadingMessages[messageIndex];
    }, 2500);

    // Disable action buttons
    analyzeBtn.disabled = true;
    clearBtn.disabled = true;
  }

  function stopLoader() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
    loadingSection.classList.add("hidden");
    analyzeBtn.disabled = false;
    clearBtn.disabled = false;
  }

  // 3. TRIGGER RESUME ANALYSIS VIA API
  async function callClientSideGemini(resumeText, roastMode, apiKey) {
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

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Direct API call attempting model: ${modelName}`);
        const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const payload = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                atsScore: {
                  type: "INTEGER",
                  description: "A calculated score out of 100 based on ATS readability, structure, and keyword density."
                },
                strengths: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of core strengths found in the resume."
                },
                weaknesses: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of weaknesses, formatting issues, or content gaps."
                },
                missingSkills: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "List of technical or professional skills missing from the resume based on target roles."
                },
                suggestions: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Actionable suggestions formatted as 'Before: [original text] | After: [improved text]'."
                },
                roast: {
                  type: "STRING",
                  description: "The custom roast message matching the requested style."
                }
              },
              required: ["atsScore", "strengths", "weaknesses", "missingSkills", "suggestions", "roast"]
            }
          }
        };

        const response = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
          throw new Error(`Direct API failed for ${modelName}: ${errMsg}`);
        }

        const resData = await response.json();
        const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error(`No output candidate returned from ${modelName}`);
        }

        return JSON.parse(candidateText.trim());
      } catch (err) {
        console.warn(`Direct API call failed for ${modelName}:`, err);
        lastError = err;
      }
    }

    throw lastError || new Error("All client-side fallback models failed.");
  }

  analyzeBtn.addEventListener("click", async () => {
    const textToAnalyze = resumeTextarea.value.trim();
    if (!textToAnalyze) {
      alert("Please upload a PDF resume or paste your resume text to begin.");
      return;
    }

    const roastMode = roastModeSelect.value;
    startLoader();

    // Check if we should use user-configured client-side Gemini key directly
    const customKey = getClientApiKey();
    let report = null;

    if (customKey) {
      try {
        console.log("Using user-configured client-side Gemini key directly.");
        report = await callClientSideGemini(textToAnalyze, roastMode, customKey);
      } catch (clientError) {
        console.warn("Client-side Gemini call failed, falling back to server:", clientError);
        alert(`Direct client-side API Call failed: ${clientError.message}. Attempting to run via the backend server instead...`);
      }
    }

    // Fallback to server call if direct client-side report wasn't generated
    if (!report) {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeText: textToAnalyze,
            roastMode: roastMode,
          }),
        });

        // Detect if the server responded with an HTML page instead of JSON (e.g. Vercel static router/404)
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const rawText = await response.text();
          if (rawText.trim().startsWith("<") || rawText.includes("The page c") || rawText.includes("404")) {
            showStaticHostingWarning();
            throw new Error("The backend server returned an HTML page instead of JSON. This application is likely hosted on a static host (like Vercel or GitHub Pages) where the Express backend cannot run.");
          }
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "Server-side error occurred." }));
          throw new Error(errData.error || "Failed to analyze resume.");
        }

        report = await response.json();
      } catch (error) {
        console.error("Backend Analysis failed:", error);
        
        // Show static warning alert if it was likely a static environment 404 / parsing error
        if (error.message && (error.message.includes("HTML page") || error.message.includes("Unexpected token") || error.message.includes("is not valid JSON"))) {
          showStaticHostingWarning();
        }
        
        alert(`Analysis Error: ${error.message || error}`);
      }
    }

    // Render results if analysis succeeded
    if (report) {
      renderReport(report, roastMode);
      
      // Scroll smoothly to results
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }

    stopLoader();
  });

  // 4. RESET PAGE
  clearBtn.addEventListener("click", () => {
    resultsSection.classList.add("hidden");
    resetFileSelection();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 4b. AI RESUME BUILDER LOGIC
  async function callClientSideResumeBuilder(formData, apiKey) {
    const prompt = `
Take the following raw professional candidate inputs and compile a pristine, high-impact, ATS-optimized resume. Ensure all achievements use strong action verbs and include metrics/results where plausible.

Raw Inputs:
- Full Name: ${formData.fullName}
- Email: ${formData.email}
- Phone: ${formData.phone}
- LinkedIn: ${formData.linkedIn}
- GitHub: ${formData.gitHub}
- Education: ${formData.education}
- Skills: ${formData.skills}
- Projects: ${formData.projects}
- Experience: ${formData.experience}
- Certifications: ${formData.certifications}
`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Direct API resume builder call attempting model: ${modelName}`);
        const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const payload = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                fullName: { type: "STRING" },
                contactInfo: {
                  type: "OBJECT",
                  properties: {
                    email: { type: "STRING" },
                    phone: { type: "STRING" },
                    linkedin: { type: "STRING" },
                    github: { type: "STRING" }
                  },
                  required: ["email", "phone"]
                },
                professionalSummary: { type: "STRING" },
                education: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      degree: { type: "STRING" },
                      school: { type: "STRING" },
                      duration: { type: "STRING" },
                      details: { type: "STRING" }
                    },
                    required: ["degree", "school"]
                  }
                },
                skills: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      category: { type: "STRING" },
                      items: { type: "ARRAY", items: { type: "STRING" } }
                    },
                    required: ["category", "items"]
                  }
                },
                projects: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      technologies: { type: "STRING" },
                      descriptionBullets: { type: "ARRAY", items: { type: "STRING" } }
                    },
                    required: ["title", "descriptionBullets"]
                  }
                },
                experience: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      role: { type: "STRING" },
                      company: { type: "STRING" },
                      location: { type: "STRING" },
                      duration: { type: "STRING" },
                      accomplishments: { type: "ARRAY", items: { type: "STRING" } }
                    },
                    required: ["role", "company", "accomplishments"]
                  }
                },
                certifications: {
                  type: "ARRAY",
                  items: { type: "STRING" }
                }
              },
              required: ["fullName", "contactInfo", "professionalSummary", "education", "skills", "projects", "experience", "certifications"]
            }
          }
        };

        const response = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;
          throw new Error(`Direct API failed for ${modelName}: ${errMsg}`);
        }

        const resData = await response.json();
        const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error(`No output candidate returned from ${modelName}`);
        }

        return JSON.parse(candidateText.trim());
      } catch (err) {
        console.warn(`Direct API call failed for ${modelName}:`, err);
        lastError = err;
      }
    }

    throw lastError || new Error("All client-side fallback models failed to build resume.");
  }

  function renderResumeDocument(data) {
    if (!data) return "";
    
    let html = "";
    
    // Header Section
    html += `
      <div class="text-center space-y-2 border-b border-slate-300 pb-5 mb-6">
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">${data.fullName || "John Doe"}</h1>
        <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
          ${data.contactInfo?.email ? `<span>${data.contactInfo.email}</span>` : ""}
          ${data.contactInfo?.phone ? `<span class="text-slate-300">•</span><span>${data.contactInfo.phone}</span>` : ""}
          ${data.contactInfo?.linkedin ? `<span class="text-slate-300">•</span><a href="${data.contactInfo.linkedin}" target="_blank" rel="noopener noreferrer" class="hover:underline text-slate-800">${data.contactInfo.linkedin.replace(/https?:\/\/(www\.)?/, "")}</a>` : ""}
          ${data.contactInfo?.github ? `<span class="text-slate-300">•</span><a href="${data.contactInfo.github}" target="_blank" rel="noopener noreferrer" class="hover:underline text-slate-800">${data.contactInfo.github.replace(/https?:\/\/(www\.)?/, "")}</a>` : ""}
        </div>
      </div>
    `;
    
    // Professional Summary Section
    if (data.professionalSummary) {
      html += `
        <div class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">Professional Summary</h2>
          <p class="text-xs text-slate-700 leading-relaxed">${data.professionalSummary}</p>
        </div>
      `;
    }
    
    // Technical Skills Section
    if (data.skills && data.skills.length > 0) {
      html += `
        <div class="space-y-3 mt-6">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">Technical Skills</h2>
          <div class="space-y-1.5 text-xs text-slate-700">
            ${data.skills.map(skillGroup => `
              <div>
                <strong class="text-slate-900 font-bold">${skillGroup.category || "Skills"}:</strong> 
                <span>${Array.isArray(skillGroup.items) ? skillGroup.items.join(", ") : skillGroup.items}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    // Professional Experience Section
    if (data.experience && data.experience.length > 0) {
      html += `
        <div class="space-y-4 mt-6">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">Professional Experience</h2>
          <div class="space-y-4">
            ${data.experience.map(exp => `
              <div class="space-y-1.5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <h3 class="text-xs font-bold text-slate-900">${exp.role || "Software Engineer"}</h3>
                    <div class="text-xs text-slate-600 font-medium">${exp.company || "Company"}${exp.location ? `, ${exp.location}` : ""}</div>
                  </div>
                  ${exp.duration ? `<div class="text-xs text-slate-500 font-mono text-right shrink-0">${exp.duration}</div>` : ""}
                </div>
                ${exp.accomplishments && exp.accomplishments.length > 0 ? `
                  <ul class="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                    ${exp.accomplishments.map(bullet => `
                      <li class="leading-relaxed">${bullet}</li>
                    `).join("")}
                  </ul>
                ` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
    
    // Key Projects Section
    if (data.projects && data.projects.length > 0) {
      html += `
        <div class="space-y-4 mt-6">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">Key Projects</h2>
          <div class="space-y-4">
            ${data.projects.map(proj => `
              <div class="space-y-1.5">
                <div class="flex items-start justify-between gap-4">
                  <h3 class="text-xs font-bold text-slate-900">${proj.title || "Project Title"}</h3>
                  ${proj.technologies ? `<div class="text-xs font-mono text-slate-500 font-medium text-right bg-slate-100 px-2 py-0.5 rounded">${proj.technologies}</div>` : ""}
                </div>
                ${proj.descriptionBullets && proj.descriptionBullets.length > 0 ? `
                  <ul class="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
                    ${proj.descriptionBullets.map(bullet => `
                      <li class="leading-relaxed">${bullet}</li>
                    `).join("")}
                  </ul>
                ` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
    
    // Education Section
    if (data.education && data.education.length > 0) {
      html += `
        <div class="space-y-3 mt-6">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">Education</h2>
          <div class="space-y-2.5">
            ${data.education.map(edu => `
              <div class="flex items-start justify-between gap-4 text-xs">
                <div>
                  <h3 class="font-bold text-slate-900">${edu.degree || "Degree"}</h3>
                  <div class="text-slate-600 font-medium">${edu.school || "School"}</div>
                  ${edu.details ? `<div class="text-slate-500 mt-0.5 text-[11px]">${edu.details}</div>` : ""}
                </div>
                ${edu.duration ? `<div class="text-slate-500 font-mono text-right shrink-0">${edu.duration}</div>` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }
    
    // Certifications & Awards Section
    if (data.certifications && data.certifications.length > 0) {
      html += `
        <div class="space-y-2 mt-6">
          <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">Certifications & Awards</h2>
          <ul class="list-disc list-outside pl-4 space-y-1 text-xs text-slate-700">
            ${data.certifications.map(cert => `
              <li class="leading-relaxed">${cert}</li>
            `).join("")}
          </ul>
        </div>
      `;
    }
    
    return html;
  }

  function compileResumeText(data) {
    if (!data) return "";
    let txt = "";
    
    txt += `${data.fullName || "John Doe"}\n`;
    txt += `${data.contactInfo?.email || ""} | ${data.contactInfo?.phone || ""} | ${data.contactInfo?.linkedin || ""} | ${data.contactInfo?.github || ""}\n\n`;
    
    if (data.professionalSummary) {
      txt += `PROFESSIONAL SUMMARY\n`;
      txt += `====================\n`;
      txt += `${data.professionalSummary}\n\n`;
    }
    
    if (data.skills && data.skills.length > 0) {
      txt += `TECHNICAL SKILLS\n`;
      txt += `================\n`;
      data.skills.forEach(s => {
        txt += `* ${s.category}: ${Array.isArray(s.items) ? s.items.join(", ") : s.items}\n`;
      });
      txt += `\n`;
    }

    if (data.experience && data.experience.length > 0) {
      txt += `PROFESSIONAL EXPERIENCE\n`;
      txt += `=======================\n`;
      data.experience.forEach(exp => {
        txt += `${exp.role} - ${exp.company} (${exp.duration || ""})\n`;
        if (exp.location) txt += `Location: ${exp.location}\n`;
        if (exp.accomplishments && exp.accomplishments.length > 0) {
          exp.accomplishments.forEach(b => {
            txt += `* ${b}\n`;
          });
        }
        txt += `\n`;
      });
    }
    
    if (data.projects && data.projects.length > 0) {
      txt += `KEY PROJECTS\n`;
      txt += `============\n`;
      data.projects.forEach(p => {
        txt += `${p.title} (${p.technologies || ""})\n`;
        if (p.descriptionBullets && p.descriptionBullets.length > 0) {
          p.descriptionBullets.forEach(b => {
            txt += `* ${b}\n`;
          });
        }
        txt += `\n`;
      });
    }
    
    if (data.education && data.education.length > 0) {
      txt += `EDUCATION\n`;
      txt += `=========\n`;
      data.education.forEach(e => {
        txt += `${e.degree} - ${e.school} (${e.duration || ""})\n`;
        if (e.details) txt += `${e.details}\n`;
        txt += `\n`;
      });
    }
    
    if (data.certifications && data.certifications.length > 0) {
      txt += `CERTIFICATIONS & AWARDS\n`;
      txt += `=======================\n`;
      data.certifications.forEach(c => {
        txt += `* ${c}\n`;
      });
      txt += `\n`;
    }
    
    return txt;
  }

  // Bind Generate Resume Action
  if (generateResumeBtn) {
    generateResumeBtn.addEventListener("click", async () => {
      // Validate Name and Email
      const fullNameVal = builderFullName.value.trim();
      const emailVal = builderEmail.value.trim();
      
      if (!fullNameVal || !emailVal) {
        alert("Full Name and Email Address are required to build your professional resume.");
        return;
      }
      
      // Package Form Data
      const formData = {
        fullName: fullNameVal,
        email: emailVal,
        phone: builderPhone.value.trim(),
        linkedIn: builderLinkedIn.value.trim(),
        gitHub: builderGitHub.value.trim(),
        education: builderEducation.value.trim(),
        skills: builderSkills.value.trim(),
        projects: builderProjects.value.trim(),
        experience: builderExperience.value.trim(),
        certifications: builderCertifications.value.trim()
      };
      
      // Reset UI state
      builderLoadingSection.classList.remove("hidden");
      builderResultsSection.classList.add("hidden");
      builderLoadingSection.scrollIntoView({ behavior: "smooth" });
      
      const customKey = getClientApiKey();
      let resumeData = null;
      
      // Try direct client API fallback if configured
      if (customKey) {
        try {
          console.log("Generating resume via client-side direct API fallback...");
          resumeData = await callClientSideResumeBuilder(formData, customKey);
        } catch (clientError) {
          console.warn("Direct client resume builder call failed:", clientError);
          alert(`Direct API call failed: ${clientError.message}. Retrying generation via backend server instead...`);
        }
      }
      
      // Call backend route if direct call didn't yield results
      if (!resumeData) {
        try {
          const response = await fetch("/api/generate-resume", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
          });
          
          const contentType = response.headers.get("content-type") || "";
          if (!contentType.includes("application/json")) {
            const rawText = await response.text();
            if (rawText.trim().startsWith("<") || rawText.includes("The page c") || rawText.includes("404")) {
              showStaticHostingWarning();
              throw new Error("The backend server is offline (Static Hosting Detected). Please configure a Gemini API key at the top to proceed.");
            }
          }
          
          if (!response.ok) {
            const errData = await response.json().catch(() => ({ error: "Server-side error occurred." }));
            throw new Error(errData.error || "Failed to generate resume.");
          }
          
          resumeData = await response.json();
        } catch (error) {
          console.error("Backend resume build failed:", error);
          if (error.message && (error.message.includes("HTML page") || error.message.includes("Unexpected token") || error.message.includes("is not valid JSON"))) {
            showStaticHostingWarning();
          }
          alert(`Generation Error: ${error.message || error}`);
        }
      }
      
      // Render Output
      if (resumeData) {
        currentGeneratedResume = resumeData;
        resumeDocumentContent.innerHTML = renderResumeDocument(resumeData);
        
        // Hide loader and present results
        builderLoadingSection.classList.add("hidden");
        builderResultsSection.classList.remove("hidden");
        
        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
        
        builderResultsSection.scrollIntoView({ behavior: "smooth" });
      } else {
        builderLoadingSection.classList.add("hidden");
      }
    });
  }

  // Copy plain text to clipboard
  if (copyResumeBtn) {
    copyResumeBtn.addEventListener("click", () => {
      if (!currentGeneratedResume) return;
      const textToCopy = compileResumeText(currentGeneratedResume);
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert("Pristine executive resume copied as plain-text Markdown successfully!");
      }).catch(err => {
        console.error("Clipboard write failed:", err);
        alert("Failed to copy automatically. Please select and copy the text manually.");
      });
    });
  }

  // Download / Print PDF trigger
  if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // 5. REPORT RENDERING
  function renderReport(report, roastMode) {
    // A. Animate ATS Score Card
    const targetScore = report.atsScore || 0;
    
    // Animate Circular Progress stroke dashoffset
    // Stroke Dash circumference is ~440 (r=70)
    const circumference = 440;
    const targetOffset = circumference - (targetScore / 100) * circumference;
    
    // Restart circular transition
    atsCircle.style.strokeDashoffset = circumference;
    setTimeout(() => {
      atsCircle.style.strokeDashoffset = targetOffset;
    }, 100);

    // Incrementing score text count-up
    let currentScore = 0;
    const duration = 1000; // 1s
    const startTime = performance.now();

    function updateScore(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      currentScore = Math.floor(progress * targetScore);
      atsScoreText.textContent = currentScore;

      if (progress < 1) {
        requestAnimationFrame(updateScore);
      } else {
        atsScoreText.textContent = targetScore;
      }
    }
    requestAnimationFrame(updateScore);

    // Style ATS Badge based on score
    atsBadge.className = "px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-3 shadow-sm";
    if (targetScore >= 85) {
      atsBadge.textContent = "🚀 Highly Competitive";
      atsBadge.classList.add("bg-emerald-950/40", "border", "border-emerald-800/40", "text-emerald-300");
      atsFeedbackText.textContent = "Excellent work! Your resume is highly competitive and properly calibrated for Applicant Tracking Systems.";
    } else if (targetScore >= 70) {
      atsBadge.textContent = "👍 Good Match";
      atsBadge.classList.add("bg-indigo-950/40", "border", "border-indigo-800/40", "text-indigo-300");
      atsFeedbackText.textContent = "A very solid profile. With a few subtle additions of recommended keywords, your resume will score even higher.";
    } else {
      atsBadge.textContent = "⚠️ Needs Improvement";
      atsBadge.classList.add("bg-amber-950/40", "border", "border-amber-800/40", "text-amber-300");
      atsFeedbackText.textContent = "Your resume has critical formatting or keyword gaps that might trigger automated filter rejections. Follow suggestions below!";
    }

    // B. Render Roast Mode & Roast Content
    roastBadge.textContent = roastMode;
    roastContentText.textContent = report.roast || "Your resume has successfully evaded our roast generator. Try again with a different model!";

    // C. Render Strengths List
    strengthsList.innerHTML = "";
    if (report.strengths && report.strengths.length > 0) {
      report.strengths.forEach(strength => {
        const li = document.createElement("li");
        li.className = "flex items-start gap-2.5 bg-emerald-950/10 border border-emerald-900/10 rounded-xl p-3";
        li.innerHTML = `
          <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
          <span class="text-slate-300 leading-relaxed">${strength}</span>
        `;
        strengthsList.appendChild(li);
      });
    } else {
      strengthsList.innerHTML = `<li class="text-slate-500 italic">No particular strengths detected.</li>`;
    }

    // D. Render Weaknesses List
    weaknessesList.innerHTML = "";
    if (report.weaknesses && report.weaknesses.length > 0) {
      report.weaknesses.forEach(weakness => {
        const li = document.createElement("li");
        li.className = "flex items-start gap-2.5 bg-amber-950/10 border border-amber-900/10 rounded-xl p-3";
        li.innerHTML = `
          <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>
          <span class="text-slate-300 leading-relaxed">${weakness}</span>
        `;
        weaknessesList.appendChild(li);
      });
    } else {
      weaknessesList.innerHTML = `<li class="text-slate-500 italic">No critical weaknesses detected.</li>`;
    }

    // E. Render Missing Skills
    skillsContainer.innerHTML = "";
    if (report.missingSkills && report.missingSkills.length > 0) {
      report.missingSkills.forEach(skill => {
        const badge = document.createElement("span");
        badge.className = "bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 font-mono text-xs rounded-full px-3 py-1.5 shadow-sm hover:border-indigo-500/30 transition-all cursor-default";
        badge.textContent = skill;
        skillsContainer.appendChild(badge);
      });
    } else {
      skillsContainer.innerHTML = `<p class="text-slate-500 italic text-sm">No critical missing keywords or tools detected.</p>`;
    }

    // F. Render Actionable Suggestions (Before / After Comparison)
    suggestionsContainer.innerHTML = "";
    if (report.suggestions && report.suggestions.length > 0) {
      report.suggestions.forEach(suggestion => {
        const item = document.createElement("div");
        item.className = "bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-3";
        
        // Try parsing the "Before: | After:" comparison
        const parsed = parseSuggestion(suggestion);
        if (parsed) {
          item.innerHTML = `
            <div class="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
              <i data-lucide="arrow-right-left" class="w-3.5 h-3.5 text-indigo-400"></i> Suggestion Comparison
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div class="bg-red-950/15 border border-red-900/20 rounded-lg p-3 text-red-300/90 text-xs leading-relaxed flex flex-col gap-1.5">
                <span class="font-bold text-[10px] uppercase font-mono text-red-400 flex items-center gap-1"><i data-lucide="x" class="w-3 h-3"></i> Before:</span>
                <span>"${parsed.before}"</span>
              </div>
              <div class="bg-emerald-950/15 border border-emerald-900/20 rounded-lg p-3 text-emerald-300/90 text-xs leading-relaxed flex flex-col gap-1.5">
                <span class="font-bold text-[10px] uppercase font-mono text-emerald-400 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> After:</span>
                <span>"${parsed.after}"</span>
              </div>
            </div>
          `;
        } else {
          // Fallback if not matching the Before/After standard pattern
          item.innerHTML = `
            <div class="flex items-start gap-2.5">
              <i data-lucide="sparkles" class="w-4 h-4 text-teal-400 shrink-0 mt-0.5"></i>
              <p class="text-slate-300 text-sm leading-relaxed">${suggestion}</p>
            </div>
          `;
        }
        suggestionsContainer.appendChild(item);
      });
    } else {
      suggestionsContainer.innerHTML = `<p class="text-slate-500 italic text-sm">All set! No additional suggestions required.</p>`;
    }

    // Call Lucide to apply dynamic icons for newly injected tags
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  // Parse suggestion texts into structured 'before' and 'after'
  function parseSuggestion(text) {
    let before = "";
    let after = "";

    // Pattern 1: Splitting by pipe symbol
    if (text.includes("|")) {
      const parts = text.split("|");
      before = parts[0].replace(/Before:\s*/i, "").trim();
      after = parts[1].replace(/After:\s*/i, "").trim();
    } 
    // Pattern 2: Explicit Before & After strings
    else if (text.match(/before:/i) && text.match(/after:/i)) {
      const parts = text.split(/after:/i);
      before = parts[0].replace(/Before:\s*/i, "").trim();
      after = parts[1].trim();
    }

    if (before && after) {
      // Strip outer quotes if any
      before = before.replace(/^['"]|['"]$/g, "");
      after = after.replace(/^['"]|['"]$/g, "");
      return { before, after };
    }
    return null;
  }
}
