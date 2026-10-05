/**
 * aiService.js
 * Central AI gateway. Now uses Google Gemini for free-tier access.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "dummy");
const MODEL_NAME = process.env.AI_MODEL || "gemini-3.5-flash-lite";

const LANGUAGE_INSTRUCTIONS = {
  english: "Respond in clear, natural English.",
  hindi: "Respond in Hindi (Devanagari script).",
  hinglish: "Respond in Hinglish (Hindi + English mixed, written in Roman/Latin script), the way young Indian users casually type.",
};

async function complete(messages, options = {}) {
  const {
    system = "You are a helpful, accurate AI assistant.",
    language = "english",
    model: customModel = null,
  } = options;

  const targetModel = customModel || MODEL_NAME;
  const fullSystem = `${system}\n\n${LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.english}`;
  const model = genAI.getGenerativeModel({ model: targetModel, systemInstruction: fullSystem });

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const lastMessage = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage);
  return result.response.text();
}

/** General chat assistant */
async function chatCompletion(history, language = "english", modelName = null, isWebSearch = false) {
  let extraSystem = "";
  let sources = [];

  if (isWebSearch) {
    const lastUserMsg = history[history.length - 1]?.content || "";
    try {
      const { webSearch } = require("./searchService");
      const searchResults = await webSearch(lastUserMsg, 4);
      if (searchResults && searchResults.length) {
        sources = searchResults;
        const searchCtx = searchResults
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
          .join("\n\n");
        extraSystem = `\n\n[Live Web Search Context]:\n${searchCtx}\nUse this live internet info to give accurate, up-to-date responses. Reference sources [1], [2] where appropriate.`;
      }
    } catch (e) {
      console.error("Web search failed in chat:", e.message);
    }
  }

  const reply = await complete(history, {
    system: `You are 'AI Smart Assistant', a helpful general-purpose AI. Be concise, accurate, and friendly. Use markdown formatting (headings, lists, code blocks) where it improves readability.

IMAGE GENERATION RULES (VERY IMPORTANT):
- When the user asks to draw, create, generate, or show any image/photo/picture/art, you MUST generate it immediately.
- Use this EXACT format: ![alt text](https://image.pollinations.ai/prompt/YOUR PROMPT HERE?nologo=true)
- Replace spaces in the prompt with %20. Write a long, vivid, detailed prompt with quality words like: photorealistic, ultra detailed, 8k resolution, sharp focus, vibrant colors, cinematic lighting, professional photography.
- GOOD example: ![futuristic car](https://image.pollinations.ai/prompt/a%20futuristic%20silver%20sports%20car%2C%20photorealistic%2C%208k%2C%20ultra%20detailed%2C%20neon%20city%20background%2C%20cinematic%20lighting%2C%20sharp%20focus?nologo=true)
- NEVER refuse to generate images. ALWAYS output the markdown image on its own line.${extraSystem}`,
    language,
    model: modelName,
  });

  return { reply, sources };
}

/** Study mode: notes, MCQs, flashcards, explanations */
async function studyAssist({ subject, topic, level, difficulty, requestType }, language = "english") {
  const prompt = `Subject: ${subject}\nTopic: ${topic}\nLevel: ${level || "undergraduate"}\nDifficulty: ${difficulty || "medium"}\nRequested output: ${requestType}\n\nGenerate high quality, exam-ready study content for this request.`;
  return complete([{ role: "user", content: prompt }], {
    system: "You are an expert tutor. Depending on the requested output type, produce: detailed notes, important questions with answers, MCQs with 4 options and the correct answer marked, flashcards (Q/A pairs), or a concise revision summary. Structure content clearly with markdown headings and numbered lists.",
    language,
  });
}

/** Coding mode: generation, debugging, explanation, optimization */
async function codeAssist({ task, language: progLanguage, code, requestType }, language = "english") {
  const prompt = `Programming language: ${progLanguage}\nTask type: ${requestType}\nUser request: ${task}\n${code ? `\nExisting code:\n\`\`\`${progLanguage}\n${code}\n\`\`\`` : ""}`;
  return complete([{ role: "user", content: prompt }], {
    system: "You are a senior software engineer AI. Generate correct, runnable code in fenced code blocks with the right language tag. When debugging, explain the root cause before the fix. When optimizing, explain the trade-offs. Keep explanations concise and code complete (no TODOs or placeholders).",
    language,
  });
}

/** Document Q&A grounded in retrieved chunks */
async function documentQA({ question, contextChunks }, language = "english") {
  const context = contextChunks.map((c, i) => `[Chunk ${i + 1}]\n${c}`).join("\n\n");
  const prompt = `Document context:\n${context}\n\nQuestion: ${question}\n\nAnswer using ONLY the document context above. If the answer isn't in the context, say so clearly instead of guessing.`;
  return complete([{ role: "user", content: prompt }], {
    system: "You are a document analysis assistant. Ground every answer strictly in the provided context chunks. Never invent facts not present in the document.",
    language,
  });
}

/** Resume content generation */
async function generateResumeContent(resumeData, section) {
  const prompt = `Resume data (JSON):\n${JSON.stringify(resumeData, null, 2)}\n\nGenerate: ${section}`;
  return complete([{ role: "user", content: prompt }], {
    system: "You are a professional resume writer specializing in ATS-friendly resumes for students and early-career developers. Be specific, quantify impact where plausible, and avoid generic filler. Return plain text or markdown only, no commentary.",
  });
}

/** Report generation */
async function generateReport({ topic, type, notes }) {
  const prompt = `Report topic: ${topic}\nReport type: ${type}\nAdditional notes/context from user: ${notes || "none"}\n\nGenerate a complete academic/professional report with these sections: Introduction, Objectives, Methodology, Analysis, Findings, Conclusion, Future Scope. Return the result as JSON with keys: introduction, objectives, methodology, analysis, findings, conclusion, futureScope. Respond with ONLY valid JSON, no markdown fences, no commentary.`;
  const raw = await complete([{ role: "user", content: prompt }], {
    system: "You are an academic/technical report writer. Always respond with strictly valid JSON matching the requested schema, and nothing else.",
  });
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return {
      introduction: cleaned, objectives: "", methodology: "", analysis: "", findings: "", conclusion: "", futureScope: ""
    };
  }
}

/** Vision / image understanding */
async function analyzeImage({ base64Image, mimeType, question }, language = "english") {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME, systemInstruction: `You are an AI vision assistant. Describe and analyze images accurately. ${LANGUAGE_INSTRUCTIONS[language] || ""}` });
  
  const imageParts = [{
    inlineData: {
      data: base64Image,
      mimeType
    }
  }];

  const result = await model.generateContent([question || "Describe and explain what is shown in this image.", ...imageParts]);
  return result.response.text();
}

module.exports = {
  complete,
  chatCompletion,
  studyAssist,
  codeAssist,
  documentQA,
  generateResumeContent,
  generateReport,
  analyzeImage,
};
