import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "8mb" }));

interface StoredStudentRecord {
  studentId: string;
  token: string;
  state: unknown;
  updatedAt: string;
}

const DATA_DIR = path.join(__dirname, ".data");
const STORE_FILE = path.join(DATA_DIR, "student_records.json");

function loadStudentStore(): Record<string, StoredStudentRecord> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch {
    // Fallback to empty store if unreadable
  }
  return {};
}

function saveStudentStore(store: Record<string, StoredStudentRecord>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // Ignore disk write failure in read-only environments
  }
}

const studentStore: Record<string, StoredStudentRecord> = loadStudentStore();

function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const customHeader = req.headers["x-student-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

function hasConfiguredApiKey(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(
    apiKey &&
      apiKey !== "MY_GEMINI_API_KEY" &&
      apiKey.trim().length > 5
  );
}

function getGeminiClient(): GoogleGenAI | null {
  if (!hasConfiguredApiKey()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutError = new Error("REQUEST_TIMEOUT");
      reject(timeoutError);
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const SUPPORTED_TUTOR_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
] as const;

async function generateTutorContentWithRetry(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI["models"]["generateContent"]>[0], "model">,
  timeoutMs: number
) {
  let lastError: unknown = null;
  for (const modelName of SUPPORTED_TUTOR_MODELS) {
    try {
      return await withTimeout(
        ai.models.generateContent({
          ...params,
          model: modelName,
        }),
        timeoutMs
      );
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "REQUEST_TIMEOUT") {
        throw err;
      }
      // Try next supported flash model if rate-limited or model-unavailable
    }
  }
  throw lastError;
}

function getSubjectSpecificInstructions(subject?: string): string {
  const s = (subject || "").toLowerCase();
  if (s.includes("physics")) {
    return `SUBJECT BEHAVIOUR (Physics):
- Explain the physical intuition first (forces, fields, symmetry, conservation laws, or boundary conditions).
- State the governing formula clearly, define variables with SI units, and show how signs or vector directions work.
- For calculations, show intermediate substitutions and a quick dimensional or limiting-case check.`;
  }
  if (s.includes("chemistry")) {
    return `SUBJECT BEHAVIOUR (Chemistry):
- Explain the underlying chemical mechanism, electronic effect (inductive, resonance, steric), thermodynamic driver, or equilibrium shift.
- Highlight balanced chemical equations, oxidation states, or reaction conditions where relevant.
- Point out important NCERT or competitive-exam exceptions honestly when they apply.`;
  }
  if (s.includes("math")) {
    return `SUBJECT BEHAVIOUR (Mathematics):
- Explain each algebraic, trigonometric, or calculus step clearly and state WHY that transformation is chosen.
- Explicitly note domain restrictions, interval bounds, or symmetry conditions.
- Highlight common algebraic, sign, or boundary-value mistakes to avoid.`;
  }
  if (s.includes("bio")) {
    return `SUBJECT BEHAVIOUR (Biology):
- Explain physiological, cellular, genetic, or ecological processes step by step in accurate NCERT-aligned terminology.
- Clarify cause-and-effect relationships, directional shifts (e.g., dissociation curves, feedback loops), and how to read biological diagrams.`;
  }
  return `SUBJECT BEHAVIOUR:
- Explain concepts clearly from first principles with accurate definitions, formulas, and exam-relevant reasoning.`;
}

function getExplanationModeInstructions(mode?: string): string {
  switch (mode) {
    case "simple":
      return `EXPLANATION MODE ("Explain simply"):
- Start with an intuitive everyday analogy or plain-language explanation before introducing technical terms.
- Keep steps short, warm, and easy to follow without overwhelming algebra.
- Only include a practiceQuestion if the student explicitly asks to be tested.`;
    case "example":
      return `EXPLANATION MODE ("Give an example"):
- Anchor the explanation around a concrete, relatable worked example or numerical illustration suitable for the student's exam.
- Walk through the example step by step so the student sees how the concept works in practice.`;
    case "test-me":
      return `EXPLANATION MODE ("Test my understanding"):
- Briefly clarify the core concept in 1-2 short steps, and MUST include a well-crafted exam-style practiceQuestion (with 4 options A-D, the correctAnswer, and a clear hintOrSolution) so the student can immediately test their understanding.`;
    case "step-by-step":
    default:
      return `EXPLANATION MODE ("Show step by step"):
- Provide a clear mainIdea, followed by logical step-by-step reasoning, relevant formula/diagram guidance, a concise finalAnswer, and a commonMistake to avoid.
- Include an optional practiceQuestion when it genuinely helps reinforce the concept.`;
  }
}

function cleanMathString(str?: string): string | undefined {
  if (!str) return undefined;
  return str
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1) / ($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, "∫[$1 to $2]")
    .replace(/\\cdot/g, "·")
    .replace(/\\times/g, "×")
    .replace(/\$/g, "")
    .trim();
}

app.get("/api/tutor/status", (_req, res) => {
  res.json({
    configured: hasConfiguredApiKey(),
  });
});

app.post("/api/tutor/doubt", async (req, res) => {
  const {
    question,
    explanationMode,
    subject,
    studentClass,
    targetExam,
    topicContext,
    attachment,
    history,
  } = req.body || {};

  const hasQuestionText = typeof question === "string" && question.trim().length > 0;
  const hasAttachment = Boolean(attachment && (attachment.base64Data || attachment.textContent));

  if (!hasQuestionText && !hasAttachment) {
    res.status(400).json({
      error: "Please enter a question or attach a question image/document so we can work through it together.",
      code: "INVALID_REQUEST",
    });
    return;
  }

  if (attachment && typeof attachment === "object") {
    const allowedMimeTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/markdown",
    ]);
    const mime = String(attachment.mimeType || "").toLowerCase();
    if (mime && !allowedMimeTypes.has(mime)) {
      res.status(400).json({
        error: "Unsupported file type. Please attach a PNG, JPG, WebP image, PDF, or text/markdown note.",
        code: "UNSUPPORTED_FILE_TYPE",
      });
      return;
    }
    if (
      typeof attachment.base64Data === "string" &&
      attachment.base64Data.length > 6 * 1024 * 1024
    ) {
      res.status(400).json({
        error: "Attached file is too large. Please upload a file smaller than 4 MB.",
        code: "FILE_TOO_LARGE",
      });
      return;
    }
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error:
        "Live AI Tutor responses require the AI service key to be configured for this environment. No synthetic or fake answer was generated. You can still use the Built-in Topic & Formula Reference alongside your study notes.",
      code: "CREDENTIALS_REQUIRED",
    });
    return;
  }

  try {
    const contextHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map(
            (m: { role: string; text: string }) =>
              `${m.role === "user" ? "Student" : "Tutor"}: ${m.text}`
          )
          .join("\n\n")
      : "";

    const sharedTopicContextText =
      topicContext && topicContext.title
        ? `CURRENT TOPIC CONTEXT PROVIDED BY STUDENT:
- Topic Title: ${topicContext.title}
- Topic Summary: ${topicContext.summary || ""}
- Key Formulas in Topic: ${
            Array.isArray(topicContext.formulas)
              ? topicContext.formulas.join(" ; ")
              : ""
          }`
        : `CURRENT TOPIC CONTEXT: No specific topic card attached; only the student's selected subject (${
            subject || "Science"
          }) and conversation messages below are shared.`;

    const systemInstruction = `You are the Vidyakshara Academic Tutor — a patient, knowledgeable teacher helping an Indian Class ${
      studentClass || "12"
    } student preparing for ${
      targetExam || "JEE Main, JEE Advanced, and NEET UG"
    }.

CORE PEDAGOGICAL & SAFEGUARD RULES:
1. Respect the target exam level (Class ${studentClass || "12"} · ${
      targetExam || "JEE/NEET"
    }). Keep explanations clear, encouraging, and age-appropriate (16–18 years old). Do not make answers unnecessarily advanced unless the question requires it.
2. ${getSubjectSpecificInstructions(subject)}
3. ${getExplanationModeInstructions(explanationMode)}
4. EDUCATIONAL SAFEGUARDS:
   - Never invent scientific facts, formulas, answer keys, or citations.
   - For calculations, show intermediate steps and unit substitutions so the result is checkable. Where any uncertainty exists (for example, if an uploaded image is partially unclear or a question statement is ambiguous), state that uncertainty transparently.
   - Do NOT claim you have access to the student's private notes, previous test scores, full syllabus, or other files unless they are explicitly included in this message.
5. MATHEMATICAL FORMATTING:
   - Never output raw LaTeX backslashes (such as \\frac, \\int, \\sqrt, or $...$).
   - Write readable mathematical notation using Unicode symbols and clear subscripts/superscripts: e.g. Φ = q_enclosed / ε_0, ∫[a to b] f(x) dx, v_top = u cos θ, E_cell = E°_cell − (0.0591 / n) log Q, x^2.
6. Match the response depth to the student's question: for a brief follow-up question, keep steps concise; for a full concept or numerical problem, provide the complete structured breakdown.`;

    const promptText = `${
      contextHistory ? `RECENT CONVERSATION CONTEXT:\n${contextHistory}\n\n` : ""
    }${sharedTopicContextText}

Subject: ${subject || "Science"} | Class: ${studentClass || "12"} | Target Exam: ${
      targetExam || "JEE/NEET"
    } | Requested Mode: ${explanationMode || "step-by-step"}
${
  attachment?.textContent
    ? `\nATTACHED STUDY DOCUMENT (${attachment.name}):\n${String(
        attachment.textContent
      ).slice(0, 8000)}\n`
    : ""
}
Student Question: ${
      hasQuestionText
        ? question.trim()
        : "Please explain and solve the question shown in the attached file step by step."
    }`;

    const parts: Array<
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (
      attachment &&
      typeof attachment.base64Data === "string" &&
      attachment.base64Data.length > 0 &&
      typeof attachment.mimeType === "string"
    ) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.base64Data,
        },
      });
    }

    parts.push({ text: promptText });

    const response = await generateTutorContentWithRetry(
      ai,
      {
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mainIdea: {
                type: Type.STRING,
                description:
                  "1. The main idea or intuitive core takeaway in 1-3 clear sentences.",
              },
              steps: {
                type: Type.ARRAY,
                description:
                  "2. Step-by-step reasoning or calculation steps. Keep concise for simple questions.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "Short heading for this step.",
                    },
                    explanation: {
                      type: Type.STRING,
                      description:
                        "Clear explanation of this step and the reason behind it.",
                    },
                    formula: {
                      type: Type.STRING,
                      description:
                        "Optional equation or mathematical expression used in this step (readable Unicode math, no raw LaTeX).",
                    },
                  },
                  required: ["title", "explanation"],
                },
              },
              formulaExpression: {
                type: Type.STRING,
                description:
                  "3a. Key formula or reaction equation to remember, if applicable (readable Unicode math, no raw LaTeX).",
              },
              formulaOrDiagramNote: {
                type: Type.STRING,
                description:
                  "3b. Explanation of variables, units, or how to sketch/interpret the relevant diagram.",
              },
              finalAnswer: {
                type: Type.STRING,
                description:
                  "4. Clear final answer or conclusion summarizing the result.",
              },
              commonMistake: {
                type: Type.STRING,
                description:
                  "5. One specific common exam mistake or conceptual trap to avoid.",
              },
              practiceQuestion: {
                type: Type.OBJECT,
                description:
                  "6. One optional similar practice question to check understanding.",
                properties: {
                  prompt: {
                    type: Type.STRING,
                    description: "The practice question stem.",
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                      "4 selectable options (e.g. 'A. ...', 'B. ...', 'C. ...', 'D. ...').",
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "The correct option or numerical answer.",
                  },
                  hintOrSolution: {
                    type: Type.STRING,
                    description:
                      "Short, checkable explanation of how to get the correct answer.",
                  },
                },
                required: ["prompt", "correctAnswer", "hintOrSolution"],
              },
              suggestedFollowUps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "2 to 3 natural follow-up questions the student might ask next.",
              },
            },
            required: ["mainIdea"],
          },
        },
      },
      25000
    );

    const rawText = response.text?.trim();
    if (!rawText) {
      res.status(502).json({
        error:
          "The AI tutor returned an empty response. Please try sending your question again.",
        code: "INVALID_RESPONSE",
      });
      return;
    }

    let parsed: {
      mainIdea?: string;
      steps?: { title: string; explanation: string; formula?: string }[];
      formulaExpression?: string;
      formulaOrDiagramNote?: string;
      finalAnswer?: string;
      commonMistake?: string;
      practiceQuestion?: {
        prompt: string;
        options?: string[];
        correctAnswer: string;
        hintOrSolution: string;
      };
      suggestedFollowUps?: string[];
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      res.status(502).json({
        error:
          "The AI tutor returned an unreadable response format. Please try asking your question again.",
        code: "INVALID_RESPONSE",
      });
      return;
    }

    if (!parsed || typeof parsed.mainIdea !== "string" || !parsed.mainIdea.trim()) {
      res.status(502).json({
        error:
          "The AI tutor could not complete a structured explanation for that input. Please rephrase or try again.",
        code: "INVALID_RESPONSE",
      });
      return;
    }

    const structured = {
      mainIdea: cleanMathString(parsed.mainIdea) || parsed.mainIdea,
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.map((s) => ({
            title: cleanMathString(s.title) || s.title,
            explanation: cleanMathString(s.explanation) || s.explanation,
            formula: cleanMathString(s.formula),
          }))
        : [],
      formulaExpression: cleanMathString(parsed.formulaExpression),
      formulaOrDiagramNote: cleanMathString(parsed.formulaOrDiagramNote),
      finalAnswer: cleanMathString(parsed.finalAnswer),
      commonMistake: cleanMathString(parsed.commonMistake),
      practiceQuestion:
        parsed.practiceQuestion && parsed.practiceQuestion.prompt
          ? {
              prompt:
                cleanMathString(parsed.practiceQuestion.prompt) ||
                parsed.practiceQuestion.prompt,
              options: Array.isArray(parsed.practiceQuestion.options)
                ? parsed.practiceQuestion.options.map(
                    (o) => cleanMathString(o) || o
                  )
                : undefined,
              correctAnswer:
                cleanMathString(parsed.practiceQuestion.correctAnswer) ||
                parsed.practiceQuestion.correctAnswer,
              hintOrSolution:
                cleanMathString(parsed.practiceQuestion.hintOrSolution) ||
                parsed.practiceQuestion.hintOrSolution,
            }
          : undefined,
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
        ? parsed.suggestedFollowUps.slice(0, 3)
        : undefined,
    };

    const summaryLines: string[] = [structured.mainIdea];
    if (structured.steps && structured.steps.length > 0) {
      summaryLines.push(
        structured.steps
          .map(
            (s, i) =>
              `${i + 1}. ${s.title}: ${s.explanation}${
                s.formula ? ` (${s.formula})` : ""
              }`
          )
          .join("\n")
      );
    }
    if (structured.finalAnswer) {
      summaryLines.push(`Final Answer: ${structured.finalAnswer}`);
    }
    if (structured.commonMistake) {
      summaryLines.push(`Common Mistake to Avoid: ${structured.commonMistake}`);
    }

    res.json({
      reply: summaryLines.join("\n\n"),
      structured,
      mode: "live-ai",
    });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);

    if (errMessage === "REQUEST_TIMEOUT") {
      res.status(504).json({
        error:
          "The tutor took too long to respond (request timed out). Please try asking a shorter question or retry in a moment.",
        code: "TIMEOUT",
      });
      return;
    }

    if (
      errMessage.includes("429") ||
      errMessage.toLowerCase().includes("quota") ||
      errMessage.toLowerCase().includes("rate")
    ) {
      res.status(429).json({
        error:
          "The AI tutor service is temporarily busy due to high request volume. Please wait a few seconds and try again.",
        code: "RATE_LIMIT",
      });
      return;
    }

    res.status(502).json({
      error:
        "We could not reach the AI tutor service right now. No fake response was shown — please retry your question in a moment.",
      code: "SERVICE_FAILURE",
    });
  }
});

app.post("/api/tutor/explain-mistake", async (req, res) => {
  const {
    questionText,
    selectedOption,
    correctOption,
    explanation,
    subject,
    targetExam,
  } = req.body || {};

  if (!questionText) {
    res.status(400).json({ error: "Question details are required." });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error:
        "Live AI mistake coaching requires the AI service credentials to be configured. Please refer to the verified step-by-step solution above.",
      code: "CREDENTIALS_REQUIRED",
    });
    return;
  }

  try {
    const response = await generateTutorContentWithRetry(
      ai,
      {
        contents: `A student preparing for ${targetExam || "JEE/NEET"} in ${
          subject || "Science"
        } attempted this question:
Question: ${questionText}
Student chose: ${selectedOption}
Correct answer: ${correctOption}
Verified explanation: ${explanation}

In 3 short, friendly points (using readable Unicode math, never raw LaTeX), explain:
1. Why the student's chosen answer is a tempting mistake.
2. The key physical/chemical/mathematical intuition that leads to the correct answer.
3. One quick memory hook for the exam.`,
        config: {
          temperature: 0.3,
        },
      },
      20000
    );

    const text = cleanMathString(response.text);
    if (!text) {
      res.status(502).json({
        error: "Could not generate an AI explanation right now. Please try again.",
      });
      return;
    }

    res.json({
      reply: text,
    });
  } catch {
    res.status(502).json({
      error:
        "The AI tutor service did not respond in time. Please review the verified step-by-step explanation above or try again.",
    });
  }
});

/* ============================================================================
 * SERVER-SIDE STUDENT PERSISTENCE & USER-SPECIFIC ACCESS CONTROL
 * ========================================================================== */

app.post("/api/student/session", (req, res) => {
  const { studentId, existingToken, initialState } = req.body || {};

  if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
    res.status(400).json({
      error: "A valid studentId is required to initialise a session.",
      code: "INVALID_STUDENT_ID",
    });
    return;
  }

  const cleanId = studentId.trim();
  const existingRecord = studentStore[cleanId];

  if (!existingRecord) {
    const newToken = crypto.randomBytes(24).toString("hex");
    const newRecord: StoredStudentRecord = {
      studentId: cleanId,
      token: newToken,
      state: initialState || null,
      updatedAt: new Date().toISOString(),
    };
    studentStore[cleanId] = newRecord;
    saveStudentStore(studentStore);

    res.json({
      studentId: cleanId,
      sessionToken: newToken,
      state: newRecord.state,
      updatedAt: newRecord.updatedAt,
    });
    return;
  }

  // Enforce user-specific access control: cannot claim an existing studentId without its token
  if (!existingToken || existingToken !== existingRecord.token) {
    res.status(403).json({
      error:
        "Access denied: You do not have permission to access another student's private records.",
      code: "FORBIDDEN",
    });
    return;
  }

  res.json({
    studentId: cleanId,
    sessionToken: existingRecord.token,
    state: existingRecord.state,
    updatedAt: existingRecord.updatedAt,
  });
});

app.get("/api/student/:studentId/state", (req, res) => {
  const cleanId = (req.params.studentId || "").trim();
  const record = studentStore[cleanId];

  if (!record) {
    res.status(404).json({
      error: "Student record not found.",
      code: "NOT_FOUND",
    });
    return;
  }

  const token = extractBearerToken(req);
  if (!token || token !== record.token) {
    res.status(403).json({
      error:
        "Access denied: You cannot read another student's private learning records.",
      code: "FORBIDDEN",
    });
    return;
  }

  res.json({
    studentId: cleanId,
    state: record.state,
    updatedAt: record.updatedAt,
  });
});

app.put("/api/student/:studentId/state", (req, res) => {
  const cleanId = (req.params.studentId || "").trim();
  const record = studentStore[cleanId];

  if (!record) {
    res.status(404).json({
      error: "Student record not found.",
      code: "NOT_FOUND",
    });
    return;
  }

  const token = extractBearerToken(req);
  if (!token || token !== record.token) {
    res.status(403).json({
      error:
        "Access denied: You cannot modify another student's private learning records.",
      code: "FORBIDDEN",
    });
    return;
  }

  const { state } = req.body || {};
  if (!state || typeof state !== "object") {
    res.status(400).json({
      error: "Valid student learning state payload is required.",
      code: "INVALID_STATE",
    });
    return;
  }

  record.state = state;
  record.updatedAt = new Date().toISOString();
  saveStudentStore(studentStore);

  res.json({
    ok: true,
    studentId: cleanId,
    updatedAt: record.updatedAt,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vidyakshara server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
