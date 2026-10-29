import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import {
  MATH_CONTENT_CONTRACT_PROMPT,
  formatStructuredTutorMarkdown,
  normalizeMathContent,
  normalizeStructuredTutorResponse,
  parseTutorJsonSafely,
} from "./src/utils/mathContentContract";
import { validateAICareerNarrative } from "./src/utils/careerScoringEngine";
import { CareerAssessmentStore } from "./src/utils/careerServerService";
import {
  RateLimiter,
  StudentRecordStore,
  createPostgresPoolFromEnv,
  initializeCareerStorePostgres,
} from "./src/utils/productionDatabase";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const parsedPort = Number.parseInt(process.env.PORT || "3000", 10);
const PORT = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Production security headers & API cache prevention
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  }
  next();
});

app.use(express.json({ limit: "8mb" }));

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, ".data");
const STORE_FILE = path.join(DATA_DIR, "student_records.json");
const CAREER_ATTEMPTS_FILE = path.join(DATA_DIR, "career_attempts.json");

const studentRecordStore = new StudentRecordStore(STORE_FILE);
const careerAttemptStore = new CareerAssessmentStore(CAREER_ATTEMPTS_FILE);
let activeStorageMode: "postgresql" | "disk" = "disk";

const aiRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 30 });
const apiRateLimiter = new RateLimiter({ windowMs: 60_000, maxRequests: 120 });

function enforceRateLimit(
  limiter: RateLimiter,
  bucketPrefix: string
): express.RequestHandler {
  return (req, res, next) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const check = limiter.check(`${bucketPrefix}:${clientIp}`);
    res.setHeader("X-RateLimit-Remaining", String(check.remaining));
    if (!check.allowed) {
      res.setHeader("Retry-After", String(check.retryAfterSeconds));
      res.status(429).json({
        error: "Too many requests from this IP address. Please wait a moment and try again.",
        code: "RATE_LIMIT",
      });
      return;
    }
    next();
  };
}

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
  return normalizeMathContent(str);
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    storageMode: activeStorageMode,
    aiConfigured: hasConfiguredApiKey(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/tutor/status", (_req, res) => {
  res.json({
    configured: hasConfiguredApiKey(),
  });
});

app.post(
  "/api/tutor/doubt",
  enforceRateLimit(aiRateLimiter, "tutor-doubt"),
  async (req, res) => {
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

  if (hasQuestionText && question.trim().length > 4000) {
    res.status(400).json({
      error: "Question text is too long (maximum 4,000 characters). Please shorten your question.",
      code: "QUESTION_TOO_LONG",
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

CORE PEDAGOGICAL & SAFEGUARDS RULES:
1. Respect the target exam level (Class ${studentClass || "12"} · ${
      targetExam || "JEE/NEET"
    }). Keep explanations clear, encouraging, and age-appropriate (16–18 years old). Do not make answers unnecessarily advanced unless the question requires it.
2. ${getSubjectSpecificInstructions(subject)}
3. ${getExplanationModeInstructions(explanationMode)}
4. EDUCATIONAL SAFEGUARDS:
   - Never invent scientific facts, formulas, answer keys, or citations.
   - For calculations, show intermediate steps and unit substitutions so the result is checkable. Where any uncertainty exists (for example, if an uploaded image is partially unclear or a question statement is ambiguous), state that uncertainty transparently.
   - Do NOT claim you have access to the student's private notes, previous test scores, full syllabus, or other files unless they are explicitly included in this message.
5. ${MATH_CONTENT_CONTRACT_PROMPT}
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
                  "1. The main idea or intuitive core takeaway in 1-3 clear sentences (use $...$ for inline LaTeX math).",
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
                        "Clear explanation of this step and the reason behind it (use $...$ for inline LaTeX math).",
                    },
                    formula: {
                      type: Type.STRING,
                      description:
                        "Optional display equation or mathematical expression used in this step (LaTeX math, e.g. $$\\Phi = \\frac{q}{\\varepsilon_0}$$).",
                    },
                  },
                  required: ["title", "explanation"],
                },
              },
              formulaExpression: {
                type: Type.STRING,
                description:
                  "3a. Key formula or reaction equation to remember, if applicable (LaTeX math).",
              },
              formulaOrDiagramNote: {
                type: Type.STRING,
                description:
                  "3b. Explanation of variables, units, or how to sketch/interpret the relevant diagram.",
              },
              finalAnswer: {
                type: Type.STRING,
                description:
                  "4. Clear final answer or conclusion summarizing the result (with LaTeX math where applicable).",
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
                    description: "The practice question stem (with $...$ LaTeX math).",
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

    const parsed = parseTutorJsonSafely<Record<string, unknown>>(rawText);
    const structured = parsed
      ? normalizeStructuredTutorResponse(parsed, {
          topicTitle: topicContext?.title,
          subjectName: subject,
        })
      : normalizeStructuredTutorResponse(
          {
            mainIdea: rawText,
          },
          {
            topicTitle: topicContext?.title,
            subjectName: subject,
          }
        );

    if (!structured || !structured.mainIdea) {
      res.status(502).json({
        error:
          "The AI tutor could not complete a structured explanation for that input. Please rephrase or try again.",
        code: "INVALID_RESPONSE",
      });
      return;
    }

    res.json({
      reply: formatStructuredTutorMarkdown(structured),
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

app.post(
  "/api/tutor/explain-mistake",
  enforceRateLimit(aiRateLimiter, "tutor-mistake"),
  async (req, res) => {
  const {
    questionText,
    selectedOption,
    correctOption,
    explanation,
    subject,
    targetExam,
  } = req.body || {};

  if (!questionText || typeof questionText !== "string" || !questionText.trim()) {
    res.status(400).json({ error: "Question details are required." });
    return;
  }
  if (questionText.length > 4000) {
    res.status(400).json({ error: "Question text exceeds maximum allowed length." });
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

In 3 short, friendly points (using Markdown for prose, $...$ for inline formulas, and $$...$$ for display equations), explain:
1. Why the student's chosen answer is a tempting mistake.
2. The key physical/chemical/mathematical intuition and derivation step that leads to the correct answer.
3. One quick memory hook for the exam.`,
        config: {
          systemInstruction: `You are the Vidyakshara Academic Tutor helping a student review a mistake in ${
            subject || "Science"
          } (${targetExam || "JEE/NEET"}).\n\n${MATH_CONTENT_CONTRACT_PROMPT}`,
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

app.post(
  "/api/career/personalize-report",
  enforceRateLimit(aiRateLimiter, "career-ai"),
  async (req, res) => {
  const {
    dimensionScores,
    leadingCombinations,
    recommendedClusters,
    workStyleSummary,
  } = req.body || {};

  if (!Array.isArray(dimensionScores) || dimensionScores.length === 0) {
    res.status(400).json({
      error: "Deterministic assessment scores are required.",
      code: "INVALID_REQUEST",
    });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error:
        "AI narrative commentary is not configured in this environment. Your complete free deterministic report is displayed in full.",
      code: "CREDENTIALS_REQUIRED",
    });
    return;
  }

  try {
    const scoreSummary = dimensionScores
      .map(
        (d: { shortLabel?: string; normalizedScore?: number; levelLabel?: string }) =>
          `${d.shortLabel || "Dimension"}: ${d.normalizedScore ?? 0}/100 (${d.levelLabel || ""})`
      )
      .join(", ");

    const comboSummary = Array.isArray(leadingCombinations)
      ? leadingCombinations
          .map(
            (c: { combinationCode?: string; title?: string }) =>
              `${c.combinationCode || ""}: ${c.title || ""}`
          )
          .join(" | ")
      : "";

    const clusterSummary = Array.isArray(recommendedClusters)
      ? recommendedClusters
          .slice(0, 5)
          .map(
            (m: { cluster?: { title?: string }; alignmentScore?: number }) =>
              `${m.cluster?.title || "Cluster"} (${m.alignmentScore ?? 0}/100)`
          )
          .join(", ")
      : "";

    const systemInstruction = `You are a thoughtful, encouraging career-exploration advisor for Indian secondary and senior-secondary students (Classes 9–12).
Your task is to turn a student's deterministic career-interest assessment scores into clear, personal commentary.

STRICT ETHICAL & CONTENT GUARDRAILS:
1. Base your explanation strictly on the provided interest scores, combinations, and work-style preferences.
2. Use accessible, warm English suitable for Indian students.
3. Acknowledge uncertainty and remind the student that interests can evolve over time.
4. NEVER invent biographical facts, academic marks, abilities, achievements, or psychological traits.
5. NEVER claim to predict income, admission success, future happiness, or professional success.
6. NEVER label a student as incapable or unfit for any field.
7. NEVER suggest that one career stream (such as Engineering or Medicine) is inherently more prestigious or valuable than another.`;

    const response = await generateTutorContentWithRetry(
      ai,
      {
        contents: `Student's 6-Dimension Interest Profile:
${scoreSummary}

Leading Combinations:
${comboSummary}

Top Recommended Career Clusters:
${clusterSummary}

Work & Learning Preferences:
Environment: ${workStyleSummary?.preferredEnvironment || ""}
Learning Approach: ${workStyleSummary?.learningApproach || ""}
Collaboration: ${workStyleSummary?.collaborationStyle || ""}

Return a JSON object with:
1. personalizedOverview: 2–3 encouraging sentences synthesizing what their overall pattern of interests suggests without making fixed predictions.
2. combinationCommentary: 2–3 sentences explaining how their top two interest dimensions complement each other in real-world projects.
3. encouragementNote: 1–2 practical, reassuring sentences encouraging curiosity and small experiments.`,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              personalizedOverview: {
                type: Type.STRING,
                description:
                  "2-3 encouraging sentences explaining the student's interest pattern.",
              },
              combinationCommentary: {
                type: Type.STRING,
                description:
                  "2-3 sentences explaining how their leading interest dimensions work together.",
              },
              encouragementNote: {
                type: Type.STRING,
                description:
                  "1-2 reassuring sentences encouraging low-cost real-world exploration.",
              },
            },
            required: [
              "personalizedOverview",
              "combinationCommentary",
              "encouragementNote",
            ],
          },
        },
      },
      18000
    );

    const rawText = response.text?.trim();
    const parsed = rawText
      ? parseTutorJsonSafely<Record<string, unknown>>(rawText)
      : null;
    const validated = validateAICareerNarrative(parsed);

    if (!validated) {
      res.status(502).json({
        error:
          "AI commentary could not be validated. Your complete deterministic report remains available.",
        code: "INVALID_AI_NARRATIVE",
      });
      return;
    }

    res.json({
      narrative: validated,
      mode: "ai-enhanced",
    });
  } catch {
    res.status(502).json({
      error:
        "AI commentary service is temporarily unavailable. Your complete deterministic report remains available.",
      code: "SERVICE_UNAVAILABLE",
    });
  }
});

/* ============================================================================
 * SERVER-SIDE STUDENT PERSISTENCE & USER-SPECIFIC ACCESS CONTROL
 * ========================================================================== */

app.post(
  "/api/student/session",
  enforceRateLimit(apiRateLimiter, "student-session"),
  (req, res) => {
    const { studentId, existingToken, initialState } = req.body || {};
    const result = studentRecordStore.createOrVerifySession({
      studentId,
      existingToken,
      initialState,
    });

    if (result.status === "invalid_student_id") {
      res.status(400).json({
        error: "A valid studentId is required to initialise a session.",
        code: "INVALID_STUDENT_ID",
      });
      return;
    }

    if (result.status === "forbidden" || !result.record) {
      res.status(403).json({
        error:
          "Access denied: You do not have permission to access another student's private records.",
        code: "FORBIDDEN",
      });
      return;
    }

    res.json({
      studentId: result.record.studentId,
      sessionToken: result.record.token,
      state: result.record.state,
      updatedAt: result.record.updatedAt,
    });
  }
);

app.get(
  "/api/student/:studentId/state",
  enforceRateLimit(apiRateLimiter, "student-state"),
  (req, res) => {
    const token = extractBearerToken(req);
    const result = studentRecordStore.getAuthorizedState(
      req.params.studentId,
      token
    );

    if (result.status === "not_found") {
      res.status(404).json({
        error: "Student record not found.",
        code: "NOT_FOUND",
      });
      return;
    }

    if (result.status !== "ok" || !result.record) {
      res.status(403).json({
        error:
          "Access denied: You cannot read another student's private learning records.",
        code: "FORBIDDEN",
      });
      return;
    }

    res.json({
      studentId: result.record.studentId,
      state: result.record.state,
      updatedAt: result.record.updatedAt,
    });
  }
);

app.put(
  "/api/student/:studentId/state",
  enforceRateLimit(apiRateLimiter, "student-state"),
  (req, res) => {
    const token = extractBearerToken(req);
    const { state } = req.body || {};
    const result = studentRecordStore.updateAuthorizedState(
      req.params.studentId,
      token,
      state
    );

    if (result.status === "not_found") {
      res.status(404).json({
        error: "Student record not found.",
        code: "NOT_FOUND",
      });
      return;
    }

    if (result.status === "forbidden") {
      res.status(403).json({
        error:
          "Access denied: You cannot modify another student's private learning records.",
        code: "FORBIDDEN",
      });
      return;
    }

    if (result.status !== "ok" || !result.record) {
      res.status(400).json({
        error: "Valid student learning state payload is required.",
        code: "INVALID_STATE",
      });
      return;
    }

    res.json({
      ok: true,
      studentId: result.record.studentId,
      updatedAt: result.record.updatedAt,
    });
  }
);

function extractCareerAccessToken(req: express.Request): string | null {
  const bearer = extractBearerToken(req);
  if (bearer) return bearer;
  if (typeof req.query?.accessToken === "string" && req.query.accessToken.trim()) {
    return req.query.accessToken.trim();
  }
  if (
    req.body &&
    typeof req.body.accessToken === "string" &&
    req.body.accessToken.trim()
  ) {
    return req.body.accessToken.trim();
  }
  return null;
}

/* =========================================================================
 * CAREER INTELLIGENCE TEST: ATTEMPT PERSISTENCE & TOKEN ACCESS
 * ======================================================================= */
app.post(
  "/api/career/attempts",
  enforceRateLimit(apiRateLimiter, "career-attempts"),
  (req, res) => {
    const { attemptId, studentDetails, responses, aiNarrative } = req.body || {};
    const accessToken = extractCareerAccessToken(req) || undefined;

    const result = careerAttemptStore.upsertAttempt({
      attemptId: typeof attemptId === "string" ? attemptId : undefined,
      accessToken,
      studentDetails,
      responses,
      aiNarrative,
    });

    if (result.status === "validation_error") {
      res.status(400).json({
        error: "Please review and complete the highlighted student details.",
        code: "VALIDATION_ERROR",
        fieldErrors: result.errors,
      });
      return;
    }

    if (result.status === "unauthorized" || !result.record) {
      res.status(403).json({
        error:
          "Access denied: Invalid or expired access token for this career assessment attempt.",
        code: "FORBIDDEN",
      });
      return;
    }

    res.json({
      ok: true,
      attemptId: result.record.attemptId,
      accessToken: result.record.accessToken,
      expiresAt: result.record.expiresAt,
      studentDetails: result.record.studentDetails,
      responses: result.record.responses,
      completedReport: result.record.completedReport,
      updatedAt: result.record.updatedAt,
    });
  }
);

app.get(
  "/api/career/attempts/:attemptId",
  enforceRateLimit(apiRateLimiter, "career-attempts"),
  (req, res) => {
    const attemptId = (req.params.attemptId || "").trim();
    const accessToken = extractCareerAccessToken(req);

    const result = careerAttemptStore.getAuthorizedAttempt(
      attemptId,
      accessToken
    );

    if (result.status === "not_found") {
      res.status(404).json({
        error: "Career assessment attempt not found.",
        code: "NOT_FOUND",
      });
      return;
    }

    if (result.status === "expired") {
      res.status(403).json({
        error: "This report access link has expired.",
        code: "EXPIRED_TOKEN",
      });
      return;
    }

    if (result.status !== "ok" || !result.record) {
      res.status(403).json({
        error:
          "Access denied: A valid access token is required to view this student's Career Intelligence Report.",
        code: "FORBIDDEN",
      });
      return;
    }

    res.json({
      ok: true,
      attemptId: result.record.attemptId,
      expiresAt: result.record.expiresAt,
      studentDetails: result.record.studentDetails,
      responses: result.record.responses,
      completedReport: result.record.completedReport,
      completedAt: result.record.completedAt,
      updatedAt: result.record.updatedAt,
    });
  }
);

app.delete(
  "/api/career/attempts/:attemptId",
  enforceRateLimit(apiRateLimiter, "career-attempts"),
  (req, res) => {
    const attemptId = (req.params.attemptId || "").trim();
    const accessToken = extractCareerAccessToken(req);

    const result = careerAttemptStore.deleteAuthorizedAttempt(
      attemptId,
      accessToken
    );

    if (result.status === "not_found") {
      res.status(404).json({
        error: "Career assessment attempt not found.",
        code: "NOT_FOUND",
      });
      return;
    }

    if (result.status !== "ok") {
      res.status(403).json({
        error: "Access denied: Valid access token required to delete data.",
        code: "FORBIDDEN",
      });
      return;
    }

    res.json({
      ok: true,
      deletedAttemptId: attemptId,
    });
  }
);

// Ensure unmatched /api/* routes always return 404 JSON rather than falling through to SPA index.html
app.all("/api/*", (_req, res) => {
  res.status(404).json({
    error: "API endpoint not found.",
    code: "NOT_FOUND",
  });
});

async function startServer() {
  const pgPool = createPostgresPoolFromEnv();
  if (pgPool) {
    studentRecordStore.attachPostgresPool(pgPool);
    const [studentsInitialized, careerInitialized] = await Promise.all([
      studentRecordStore.initializePostgresSchemaAndHydrate(),
      initializeCareerStorePostgres(careerAttemptStore, pgPool),
    ]);
    if (studentsInitialized && careerInitialized) {
      activeStorageMode = "postgresql";
      console.log(
        `Vidyakshara persistent storage: PostgreSQL connected (${studentRecordStore.getRecordCount()} student profiles, ${careerAttemptStore.getRecordCount()} career attempts loaded)`
      );
    }
  } else {
    console.log(
      `Vidyakshara persistent storage: Local disk mode (${DATA_DIR})`
    );
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    const assetsPath = path.join(distPath, "assets");
    if (fs.existsSync(assetsPath)) {
      app.use(
        "/assets",
        express.static(assetsPath, {
          maxAge: "1y",
          immutable: true,
        })
      );
    }
    app.use(
      express.static(distPath, {
        index: false,
        maxAge: "1h",
      })
    );
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        res.status(404).json({
          error: "API endpoint not found.",
          code: "NOT_FOUND",
        });
        return;
      }
      const indexFile = path.join(distPath, "index.html");
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexFile);
    });
  }

  const httpServer = app.listen(PORT, HOST, () => {
    console.log(
      `Vidyakshara server listening on http://${HOST}:${PORT} (mode: ${
        process.env.NODE_ENV || "development"
      }, storage: ${activeStorageMode})`
    );
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down Vidyakshara server...`);
    httpServer.close(() => {
      if (pgPool) {
        void pgPool.end().finally(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
