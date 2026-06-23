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

  let extractedText = "";
  let loadingInterval = null;

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
  analyzeBtn.addEventListener("click", async () => {
    const textToAnalyze = resumeTextarea.value.trim();
    if (!textToAnalyze) {
      alert("Please upload a PDF resume or paste your resume text to begin.");
      return;
    }

    const roastMode = roastModeSelect.value;
    startLoader();

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

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze resume.");
      }

      const report = await response.json();
      renderReport(report, roastMode);
      
      // Scroll smoothly to results
      resultsSection.classList.remove("hidden");
      resultsSection.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(`Error during analysis: ${error.message || error}`);
    } finally {
      stopLoader();
    }
  });

  // 4. RESET PAGE
  clearBtn.addEventListener("click", () => {
    resultsSection.classList.add("hidden");
    resetFileSelection();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

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
