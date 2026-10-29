import katex from "katex";
import "katex/contrib/mhchem";
import {
  DoubtMessage,
  QuestionDiagramType,
  StudentLearningState,
  StructuredTutorResponse,
  TutorPracticeQuestion,
} from "../types/domain";

/**
 * Shared Mathematical & Educational Content Contract for Vidyakshara.
 * Used across server-side AI tutor generation, mistake coaching, lesson content,
 * question-answer pipelines, and client-side rendering.
 */
export const MATH_CONTENT_CONTRACT_VERSION = "2.1.0";

export const MATH_CONTENT_CONTRACT_PROMPT = `
MATHEMATICAL & SCIENTIFIC NOTATION CONTRACT (MANDATORY):
1. PROSE & DELIMITERS:
   - Write explanatory prose in clean Markdown.
   - Use $...$ for ALL inline mathematical expressions, variables, symbols, chemical species with charges/states, and numbers with units (e.g., $v_y = 0$, $q_{\\text{enc}}$, $\\Delta H^\\circ < 0$, $9.8\\text{ m s}^{-2}$).
   - Use $$...$$ on its own line for standalone display equations, key laws, matrices, determinants, and multi-line derivations.
   - Never wrap LaTeX equations inside Markdown code fences (\`\`\`latex or \`\`\`math) or backticks (\`$x$\`).
   - Never leave raw LaTeX commands (like \\frac, \\sqrt, \\int, \\theta, \\vec, \\Delta, \\ce) outside $...$ or $$...$$ delimiters.
   - Inside $...$ or $$...$$, never use Markdown italics/bold (* or _) for formatting; use standard LaTeX subscripts/superscripts (x_1, v^2) and \\mathbf{...} or \\text{...}.

2. MULTI-LINE DERIVATIONS, MATRICES & ALIGNMENT:
   - For multi-step algebraic or calculus derivations inside a single display block, use \\begin{aligned} ... \\end{aligned} inside $$...$$, aligning at relational operators (&= , &\\approx, &\\le) and separating lines with \\\\:
     $$\\begin{aligned}
     R &= \\frac{u^2 \\sin 2\\theta}{g} \\\\
     &= \\frac{u^2 (2 \\sin\\theta \\cos\\theta)}{g}
     \\end{aligned}$$
   - For matrices and determinants, use \\begin{pmatrix}...\\end{pmatrix}, \\begin{bmatrix}...\\end{bmatrix}, or \\begin{vmatrix}...\\end{vmatrix} inside $$...$$.
   - For piecewise functions or conditional laws, use \\begin{cases} ... \\end{cases} inside $$...$$.

3. SUBJECT-SPECIFIC NOTATION (MATHEMATICS, PHYSICS & CHEMISTRY):
   - Mathematics: Render equations, matrices, determinants, coordinate notation $(x_0, y_0, z_0)$, vectors ($\\vec{a}, \\hat{i}, \\hat{j}, \\hat{k}$), limits ($\\lim_{x \\to a}$), derivatives ($\\frac{dy}{dx}$), integrals ($\\int_a^b f(x)\\,dx$), probability ($P(A \\mid B)$, $\\binom{n}{r}$), and sequences/series ($\\sum_{k=1}^n a_k$) in proper LaTeX.
   - Physics: Distinguish vector quantities ($\\vec{E}, \\vec{v}, \\vec{p}, \\vec{F}, d\\vec{A}$) from scalar magnitudes ($E, v, p, F, \\Phi$). Format all SI units in upright Roman font using \\text{...} or \\pu{...} (e.g., $20\\text{ m s}^{-1}$, $\\text{N m}^2\\text{ C}^{-1}$, $\\text{J kg}^{-1}\\text{ K}^{-1}$).
   - Chemistry: Use KaTeX mhchem ($\\ce{...}$) or explicit LaTeX chemical notation for chemical formulas, subscripts, superscripts, ionic charges ($\\ce{Zn^{2+}(aq)}$, $\\ce{SO4^{2-}}$), reversible reactions ($\\ce{N2(g) + 3H2(g) <=> 2NH3(g)}$ or $\\rightleftharpoons$), reaction conditions above/below arrows ($\\ce{->[\\text{V}_2\\text{O}_5][700\\text{ K}]}$ or $\\xrightarrow[\\text{condition}]{\\text{catalyst}}$), and stoichiometric equations.
   - Distinguish strictly between exact equality ($=$) and numerical approximation ($\\approx$).
`.trim();

/**
 * Known LaTeX command stems that start with letters corresponding to JSON escape sequences:
 * \b (0x08 backspace), \t (0x09 tab), \n (0x0A newline), \f (0x0C formfeed), \r (0x0D carriage return).
 * When an LLM emits single-escaped "\frac" or "\theta" inside raw JSON or malformed strings,
 * JSON.parse turns "\f" + "rac" into "\x0crac".
 */
const CONTROL_CHAR_LATEX_REPAIRS: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  // \f (0x0c) -> \frac, \forall, \flat, \fbox
  {
    pattern: /\x0c(rac|orall|lat|box)\b/g,
    replacement: "\\f$1",
  },
  // \t (0x09) -> \theta, \tau, \times, \text, \textbf, \textit, \textrm, \tan, \tanh, \to, \triangle, \tilde, \top
  {
    pattern:
      /\x09(heta|au|imes|extbf|extit|extrm|ext|anh|an|riangle|ilde|op|o)\b/g,
    replacement: "\\t$1",
  },
  // \b (0x08) -> \beta, \begin, \bar, \binom, \mathbf, \mathbb, \bigcap, \bigcup, \bigoplus, \big, \Big, \bot, \bullet, \boxed, \breve, \backslash
  {
    pattern:
      /\x08(eta|egin|inom|ar|igcap|igcup|igoplus|ig|ot|ullet|oxed|reve|ackslash)\b/g,
    replacement: "\\b$1",
  },
  // \r (0x0d) -> \right, \rightarrow, \Rightarrow, \rho, \mathrm, \rangle, \rceil, \rfloor, \rVert, \rvert
  {
    pattern:
      /\x0d(ightarrow|ight|ho|angle|ceil|floor|Vert|vert)/g,
    replacement: "\\r$1",
  },
];

/**
 * Repairs control characters that were accidentally produced when JSON.parse
 * interpreted \f, \t, \b, or \r at the start of a LaTeX command.
 */
export function repairCorruptedLatexControlChars(input: string): string {
  if (!input) return "";
  let out = input;
  for (const { pattern, replacement } of CONTROL_CHAR_LATEX_REPAIRS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Protects single-escaped LaTeX commands inside raw JSON string literals BEFORE JSON.parse.
 * Handles cases where an LLM outputs raw JSON with `"\frac{a}{b}"` or `"\sqrt{x}"` instead of `"\\frac{a}{b}"`.
 */
export function sanitizeRawJsonLatexEscapes(rawJson: string): string {
  if (!rawJson) return "";

  // Process character-by-character inside JSON string literals so we only fix unescaped
  // LaTeX backslashes inside "..." strings without breaking structural JSON quotes or "\\n" newlines.
  let result = "";
  let inString = false;
  let i = 0;

  while (i < rawJson.length) {
    const ch = rawJson[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
      }
      result += ch;
      i++;
      continue;
    }

    // Inside a JSON string literal
    if (ch === '"') {
      inString = false;
      result += ch;
      i++;
      continue;
    }

    if (ch === "\\") {
      const next = rawJson[i + 1];
      if (next === undefined) {
        result += "\\\\";
        i++;
        continue;
      }

      // Already escaped backslash `\\` -> keep both and advance by 2
      if (next === "\\") {
        result += "\\\\";
        i += 2;
        continue;
      }

      // Standard structural JSON escapes: \" \/ \uXXXX
      if (next === '"' || next === "/") {
        result += "\\" + next;
        i += 2;
        continue;
      }
      if (next === "u" && /^[0-9a-fA-F]{4}/.test(rawJson.slice(i + 2, i + 6))) {
        result += rawJson.slice(i, i + 6);
        i += 6;
        continue;
      }

      // Ambiguous escapes (\b, \f, \n, \r, \t): check if followed by letters that form a LaTeX command!
      // e.g., \frac, \forall, \theta, \tau, \times, \text, \tan, \to, \triangle, \beta, \begin, \bar, \binom,
      // \right, \rho, \rightarrow, \neq, \nu, \nabla, \not, \natural, \mathbb, etc.
      const rest = rawJson.slice(i + 1);
      if (
        /^(frac|forall|flat|fbox|theta|tau|times|textbf|textit|textrm|text|tanh|tan|triangle|tilde|top|to|beta|egin|begin|binom|bar|bigcap|bigcup|bigoplus|big|bot|bullet|boxed|breve|backslash|rightarrow|right|rho|rangle|rceil|rfloor|rVert|rvert|neq|nabla|not|natural|nu|nless|ngtr|nmid|nparallel)\b/.test(
          rest
        )
      ) {
        result += "\\\\";
        i++;
        continue;
      }

      // Keep genuine \n, \r, \t, \b, \f JSON escapes when not starting a LaTeX command
      if (
        next === "n" ||
        next === "r" ||
        next === "t" ||
        next === "b" ||
        next === "f"
      ) {
        result += "\\" + next;
        i += 2;
        continue;
      }

      // Any other `\x` (such as `\sqrt`, `\int`, `\sum`, `\alpha`, `\Delta`, `\left`, `\cdot`, `\,`, `\;`, `\{`, `\}`)
      // is invalid in raw JSON unless doubled to `\\x`.
      result += "\\\\";
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

/**
 * Strips outer Markdown code fences (e.g. ```json ... ``` or ``` ... ```) from an AI response
 * and safely parses the JSON while preserving all LaTeX backslashes.
 */
export function parseTutorJsonSafely<T = Record<string, unknown>>(
  rawText: string
): T | null {
  if (!rawText || typeof rawText !== "string") return null;

  let cleaned = rawText.trim();

  // Strip outer ```json ... ``` or ``` ... ``` fence if present
  const fenceMatch = cleaned.match(/^```(?:json|JSON)?\s*\r?\n([\s\S]*?)\r?\n?```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "").trim();
  }

  // Extract first JSON object if surrounded by extra text
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // First attempt: sanitize unescaped LaTeX backslashes in raw JSON, then parse
  try {
    const sanitized = sanitizeRawJsonLatexEscapes(cleaned);
    return JSON.parse(sanitized) as T;
  } catch {
    // Second attempt: direct JSON.parse
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Repairs accidental double-escaped LaTeX commands (`\\frac` -> `\frac`, `\\sqrt` -> `\sqrt`)
 * while preserving `\\` line breaks inside `\begin{aligned}...\end{aligned}`, `\begin{cases}...\end{cases}`,
 * and matrix environments.
 */
export function repairDoubleEscapedLatex(input: string): string {
  if (!input) return "";
  // Replace `\\command` where `command` is at least 2 letters (e.g. \\frac, \\theta, \\begin, \\text)
  // only when NOT preceded by a newline/space-after-content that represents a row break `\\` followed by a command on the same line.
  // Specifically, in LaTeX, a row break is `\\` followed by whitespace/newline, whereas accidental double-escaping
  // is `\\frac{...}`, `\\sqrt{...}`, `\\left(`, `\\right)`, `\\alpha`, etc.
  const KNOWN_DOUBLE_ESCAPED_COMMANDS =
    /\\\\(ce|pu|frac|dfrac|tfrac|sqrt|int|oint|iint|sum|prod|lim|infty|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|pm|mp|times|div|cdot|ast|star|circ|bullet|oplus|ominus|otimes|oslash|odot|leq|le|geq|ge|neq|ne|approx|equiv|cong|sim|simeq|propto|ll|gg|subset|subseteq|supset|supseteq|in|notin|cup|cap|setminus|emptyset|varnothing|forall|exists|nexists|nabla|partial|prime|ell|hbar|Im|Re|wp|aleph|leftarrow|rightarrow|leftrightarrow|Leftarrow|Rightarrow|Leftrightarrow|longleftarrow|longrightarrow|mapsto|to|gets|uparrow|downarrow|updownarrow|rightleftharpoons|leftrightharpoons|xrightleftharpoons|xlongequal|xrightarrow|xleftarrow|left|right|big|Big|bigg|Bigg|langle|rangle|lceil|rceil|lfloor|rfloor|vec|hat|bar|tilde|dot|ddot|overline|underline|overbrace|underbrace|overrightarrow|overleftarrow|widehat|widetilde|mathbf|mathbb|mathcal|mathfrak|mathrm|mathsf|mathtt|textbf|textit|textrm|text|operatorname|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log|exp|deg|det|dim|gcd|hom|inf|ker|lg|max|min|Pr|sup|bmod|pmod|binom|tbinom|dbinom|choose|begin|end|boxed|cancel|bcancel|xcancel|phantom|hphantom|vphantom|quad|qquad|enspace|thinspace|hspace|vspace|not|mid|parallel|perp|angle|triangle|square|diamond|backslash)(?![a-zA-Z])/g;

  return input.replace(KNOWN_DOUBLE_ESCAPED_COMMANDS, "\\$1");
}

/**
 * Unicode symbols mapped to standard LaTeX commands when appearing inside math delimiters.
 */
const UNICODE_TO_LATEX_IN_MATH: Array<[RegExp, string]> = [
  [/×/g, " \\times "],
  [/÷/g, " \\div "],
  [/≤/g, " \\le "],
  [/≥/g, " \\ge "],
  [/≠/g, " \\ne "],
  [/±/g, " \\pm "],
  [/∓/g, " \\mp "],
  [/≈/g, " \\approx "],
  [/≡/g, " \\equiv "],
  [/∝/g, " \\propto "],
  [/∞/g, "\\infty"],
  [/⇌/g, " \\rightleftharpoons "],
  [/→/g, " \\rightarrow "],
  [/←/g, " \\leftarrow "],
  [/⇒/g, " \\implies "],
  [/⇔/g, " \\iff "],
  [/∂/g, "\\partial "],
  [/∇/g, "\\nabla "],
  [/∆/g, "\\Delta "],
  [/Δ/g, "\\Delta "],
  [/α/g, "\\alpha "],
  [/β/g, "\\beta "],
  [/γ/g, "\\gamma "],
  [/δ/g, "\\delta "],
  [/ε/g, "\\varepsilon "],
  [/θ/g, "\\theta "],
  [/λ/g, "\\lambda "],
  [/μ/g, "\\mu "],
  [/ν/g, "\\nu "],
  [/π/g, "\\pi "],
  [/ρ/g, "\\rho "],
  [/σ/g, "\\sigma "],
  [/τ/g, "\\tau "],
  [/φ/g, "\\phi "],
  [/ω/g, "\\omega "],
  [/Ω/g, "\\Omega "],
  [/Φ/g, "\\Phi "],
  [/⁰/g, "^{0}"],
  [/¹/g, "^{1}"],
  [/²/g, "^{2}"],
  [/³/g, "^{3}"],
  [/⁴/g, "^{4}"],
  [/⁵/g, "^{5}"],
  [/⁶/g, "^{6}"],
  [/⁷/g, "^{7}"],
  [/⁸/g, "^{8}"],
  [/⁹/g, "^{9}"],
  [/⁺/g, "^{+}"],
  [/⁻/g, "^{-}"],
  [/₀/g, "_{0}"],
  [/₁/g, "_{1}"],
  [/₂/g, "_{2}"],
  [/₃/g, "_{3}"],
  [/₄/g, "_{4}"],
  [/₅/g, "_{5}"],
  [/₆/g, "_{6}"],
  [/₇/g, "_{7}"],
  [/₈/g, "_{8}"],
  [/₉/g, "_{9}"],
];

export function normalizeUnicodeInsideMath(mathContent: string): string {
  let out = mathContent;
  for (const [pattern, replacement] of UNICODE_TO_LATEX_IN_MATH) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Determines whether a `$ ... $` match is actually two currency amounts with prose between them
 * (e.g., "The book costs $25 and the calculator costs $40" -> match is `25 and the calculator costs `).
 */
function isCurrencyFalsePositiveMatch(inner: string): boolean {
  // Starts with a number (like 25 or 1,200.50) followed by ordinary English words and ends with spaces/words
  // before the next currency `$` sign.
  if (!/^\d[\d,.]*(\s|$)/.test(inner)) {
    return false;
  }
  // Legitimate math starting with digits: `$10^5$`, `$10\text{ m/s}$`, `$25\%$`, `$2x + 3 = 7$`, `$10 \times 10^{-3}$`
  if (/[\\^_{}=<>+\-*/]/.test(inner)) {
    return false;
  }
  // If it contains a space followed by plain words (e.g., "25 and the kit costs "), it's prose between currency signs!
  if (/^\d[\d,.]*\s+[a-zA-Z]{2,}/.test(inner)) {
    return true;
  }
  return false;
}

/**
 * Escapes standalone currency dollar signs (e.g. `$25`, `$100`) so they are not misinterpreted
 * as LaTeX math delimiters when multiple currency figures appear in the same paragraph.
 */
export function disambiguateCurrencyDollars(input: string): string {
  if (!input || !input.includes("$")) return input;

  // Process line-by-line outside `$$...$$` display blocks
  const displayParts = input.split(/(\$\$[\s\S]*?\$\$)/g);
  return displayParts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return part;
      }

      // First check if any `$ ... $` pair on a line is a false-positive span between two currency numbers
      let lineFixed = part.replace(
        /(?<![\\$])\$(?!\$)([^$\n]+?)(?<![\\$])\$(?!\$)/g,
        (fullMatch, inner: string) => {
          if (isCurrencyFalsePositiveMatch(inner)) {
            // Escape the leading `$` of the first currency amount; the trailing `$` actually belongs to the second currency amount!
            return `\\$${inner}\\$`;
          }
          return fullMatch;
        }
      );

      // Also escape any single unmatched currency `$` followed by digits and a word boundary (when total unescaped `$` count in line is odd)
      const lines = lineFixed.split("\n");
      return lines
        .map((line) => {
          const unescapedDollars = line.match(/(?<![\\$])\$(?!\$)/g);
          if (unescapedDollars && unescapedDollars.length % 2 === 1) {
            return line.replace(
              /(?<![\\$])\$(\d[\d,.]*)(?=\s|[.,;!?)]|$)/g,
              "\\$$1"
            );
          }
          return line;
        })
        .join("\n");
    })
    .join("");
}

/**
 * Normalizes mathematical content in Markdown prose while preserving code blocks,
 * multi-line derivations (`\begin{aligned}`), currency signs, and legacy raw LaTeX.
 *
 * IMPORTANT: Does NOT silently invent or mutate invalid LaTeX formulas (no blind brace appending).
 */
export function normalizeMathContent(
  raw: string,
  options?: { expandDisplayBlocks?: boolean }
): string {
  if (!raw) return "";
  const expandDisplayBlocks = options?.expandDisplayBlocks ?? true;

  // Step 1: Repair control characters (\f -> \frac, \t -> \theta, \b -> \beta, \r -> \right)
  let text = repairCorruptedLatexControlChars(raw);

  // Step 2: Convert ```latex / ```math / ```tex fenced blocks directly into $$...$$ display math
  text = text.replace(
    /```(?:latex|math|tex)\s*\r?\n([\s\S]*?)\r?\n?```/gi,
    (_m, body: string) => {
      const trimmed = body.trim();
      if (trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
        return `\n\n${trimmed}\n\n`;
      }
      return `\n\n$$\n${trimmed}\n$$\n\n`;
    }
  );

  // Step 3: Temporarily protect remaining non-math fenced code blocks (```python ... ```)
  const protectedBlocks: string[] = [];
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    const token = `@@VIDYA_CODE_BLOCK_${protectedBlocks.length}@@`;
    protectedBlocks.push(match);
    return token;
  });

  // Step 4: Unwrap inline backticks if the backticked span is actually a LaTeX math expression
  // e.g. `$\frac{1}{2}$` -> $\frac{1}{2}$, or `\frac{a}{b}` -> $\frac{a}{b}$
  // Protect genuine code spans (`console.log`, `array[i]`)
  const protectedInlineCode: string[] = [];
  text = text.replace(/`([^`\n]+)`/g, (match, inner: string) => {
    const trimmed = inner.trim();
    if (
      (trimmed.startsWith("$") && trimmed.endsWith("$")) ||
      (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) ||
      (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
    ) {
      return trimmed;
    }
    if (
      /\\(ce|pu|frac|dfrac|sqrt|int|sum|prod|lim|vec|hat|binom|Delta|theta|alpha|beta|gamma|omega|pi|mu|sigma|lambda|phi|approx|neq|leq|geq|times|cdot|rightleftharpoons|xrightarrow|begin)\b/.test(
        trimmed
      )
    ) {
      return `$${trimmed}$`;
    }
    const token = `@@VIDYA_INLINE_CODE_${protectedInlineCode.length}@@`;
    protectedInlineCode.push(match);
    return token;
  });

  // Step 5: Repair accidental double-escaped LaTeX (`\\frac` -> `\frac`)
  text = repairDoubleEscapedLatex(text);

  // Step 6: Convert \[ ... \] to $$ ... $$ and \( ... \) to $ ... $
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => {
    return expandDisplayBlocks
      ? `\n\n$$\n${inner.trim()}\n$$\n\n`
      : `$\\displaystyle ${inner.trim()}$`;
  });
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) => {
    return `$${inner.trim()}$`;
  });

  // Step 7: Normalize \begin{align*}...\end{align*} or \begin{align}...\end{align} to \begin{aligned}...\end{aligned}
  text = text.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    "\\begin{aligned}$1\\end{aligned}"
  );
  text = text.replace(
    /\\begin\{eqnarray\*?\}([\s\S]*?)\\end\{eqnarray\*?\}/g,
    "\\begin{aligned}$1\\end{aligned}"
  );

  // Step 8: Wrap standalone \begin{aligned}...\end{aligned} or \begin{cases}...\end{cases}
  // that are NOT already inside $$...$$ or $...$
  text = wrapStandaloneMathEnvironments(text, expandDisplayBlocks);

  // Step 9: Disambiguate currency `$` signs vs. math `$` delimiters
  text = disambiguateCurrencyDollars(text);

  // Step 10: Legacy raw LaTeX compatibility outside existing $...$ and $$...$$ segments
  text = wrapLegacyUndelimitedLatexSegments(text);

  // Step 11: Normalize Unicode symbols inside $...$ and $$...$$ blocks and format display blocks cleanly
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner: string) => {
    const cleanInner = normalizeUnicodeInsideMath(inner.trim());
    if (!expandDisplayBlocks) {
      return `$\\displaystyle ${cleanInner}$`;
    }
    return `\n\n$$\n${cleanInner}\n$$\n\n`;
  });

  text = text.replace(
    /(?<![\\$])\$(?!\$)([^$\n]+?)(?<![\\$])\$(?!\$)/g,
    (_m, inner: string) => {
      const cleanInner = normalizeUnicodeInsideMath(inner.trim());
      return `$${cleanInner}$`;
    }
  );

  // Collapse excessive blank lines around display math
  if (expandDisplayBlocks) {
    text = text.replace(/\n{3,}/g, "\n\n");
  }

  // Restore inline code spans and fenced code blocks
  text = text.replace(
    /@@VIDYA_INLINE_CODE_(\d+)@@/g,
    (_m, idx) => protectedInlineCode[Number(idx)] || ""
  );
  text = text.replace(
    /@@VIDYA_CODE_BLOCK_(\d+)@@/g,
    (_m, idx) => protectedBlocks[Number(idx)] || ""
  );

  return text.trim();
}

/**
 * Wraps standalone `\begin{aligned}...\end{aligned}`, `\begin{cases}...\end{cases}`,
 * `\begin{pmatrix}...\end{pmatrix}`, `\begin{bmatrix}...\end{bmatrix}` in `$$...$$`
 * if they appear outside existing `$...$` or `$$...$$` math blocks.
 */
function wrapStandaloneMathEnvironments(
  input: string,
  expandDisplayBlocks: boolean
): string {
  const segments = input.split(/(\$\$[\s\S]*?\$\$|(?<![\\$])\$(?!\$)[^$\n]+?(?<![\\$])\$(?!\$))/g);
  return segments
    .map((seg) => {
      if (seg.startsWith("$")) return seg;
      return seg.replace(
        /\\begin\{(aligned|cases|pmatrix|bmatrix|vmatrix|Bmatrix|Vmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/g,
        (fullEnv) => {
          return expandDisplayBlocks
            ? `\n\n$$\n${fullEnv.trim()}\n$$\n\n`
            : `$\\displaystyle ${fullEnv.trim()}$`;
        }
      );
    })
    .join("");
}

/**
 * Safely wraps legacy undelimited LaTeX expressions (e.g., `\frac{a}{b}`, `E = \frac{1}{2}mv^2`)
 * in `$...$` when they occur in plain text outside existing math delimiters.
 */
function wrapLegacyUndelimitedLatexSegments(input: string): string {
  const segments = input.split(
    /(\$\$[\s\S]*?\$\$|(?<![\\$])\$(?!\$)[^$\n]+?(?<![\\$])\$(?!\$))/g
  );

  const RAW_LATEX_DETECTOR =
    /\\(ce|pu|frac|dfrac|tfrac|sqrt|int|oint|sum|prod|lim|binom|vec|hat|bar|overline|underline|overrightarrow|mathbf|mathrm|mathcal|mathbb|text|Delta|Theta|Lambda|Pi|Sigma|Phi|Psi|Omega|alpha|beta|gamma|delta|epsilon|varepsilon|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|varphi|omega|infty|partial|nabla|pm|mp|times|cdot|div|neq|ne|leq|le|geq|ge|approx|equiv|propto|to|rightarrow|leftarrow|Rightarrow|Leftarrow|implies|iff|rightleftharpoons|leftrightharpoons|xrightleftharpoons|xrightarrow|xleftarrow|sin|cos|tan|cot|sec|csc|ln|log)\b/;

  return segments
    .map((seg) => {
      if (seg.startsWith("$")) return seg;
      if (!RAW_LATEX_DETECTOR.test(seg)) return seg;

      // Process line by line so we never wrap across paragraphs or Markdown headings/lists
      return seg
        .split("\n")
        .map((line) => {
          if (!RAW_LATEX_DETECTOR.test(line)) return line;

          const trimmed = line.trim();
          // Preserve markdown list/heading prefix if the entire line is a standalone formula
          const prefixMatch = line.match(/^(\s*(?:[-*+]|\d+\.|#{1,4})\s+)(.*)$/);
          const prefix = prefixMatch ? prefixMatch[1] : "";
          const content = prefixMatch ? prefixMatch[2] : trimmed;

          // Check if the entire line content is a pure formula (no 4+ letter English prose words outside \text{...})
          const withoutLatexCommands = content
            .replace(/\\text\{[^}]*\}/g, "")
            .replace(/\\[a-zA-Z]+/g, "");
          const proseWords =
            withoutLatexCommands.match(/\b[a-zA-Z]{4,}\b/g) || [];

          if (proseWords.length === 0 && content.length > 0) {
            return prefix ? `${prefix}$${content}$` : `$${content}$`;
          }

          // Otherwise wrap individual LaTeX command expressions inline (including balanced {...} arguments and immediate = / + / - / ^ / _ attachments)
          return wrapInlineRawLatexTokens(line);
        })
        .join("\n");
    })
    .join("");
}

/**
 * Scans a plain-text line and wraps contiguous LaTeX command sequences
 * (e.g. `\Phi_{\text{net}} = \frac{q_{\text{enc}}}{\varepsilon_0}`, `E = \frac{1}{2}mv^2`)
 * in `$...$` using balanced-brace scanning while leaving surrounding English words untouched.
 */
function wrapInlineRawLatexTokens(line: string): string {
  // Split line into whitespace-delimited tokens, merging tokens that are inside balanced { ... } braces
  const rawParts = line.split(/(\s+)/);
  const mergedTokens: string[] = [];
  let buffer = "";
  let braceDepth = 0;

  for (const part of rawParts) {
    if (braceDepth > 0) {
      buffer += part;
      for (const ch of part) {
        if (ch === "{") braceDepth++;
        else if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
      }
      if (braceDepth === 0) {
        mergedTokens.push(buffer);
        buffer = "";
      }
    } else {
      for (const ch of part) {
        if (ch === "{") braceDepth++;
        else if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
      }
      if (braceDepth > 0) {
        buffer = part;
      } else {
        mergedTokens.push(part);
      }
    }
  }
  if (buffer) {
    mergedTokens.push(buffer);
  }

  // Classify each non-whitespace token as "math" or "prose"
  const isMathToken = (tok: string): boolean => {
    const t = tok.replace(/[.,;:!?)]+$/, "");
    if (!t) return false;
    // Contains a LaTeX command, brace, subscript, or superscript
    if (/\\[a-zA-Z]+|[{}_^]/.test(t)) return true;
    // Mathematical relational or binary operator
    if (/^([=<>+\-*/±×÷≈≠≤≥→⇌]+|\d+(\.\d+)?)$/.test(t)) return true;
    // Short variable/function token like v, x, mv^2, f(x), 2g
    if (/^[a-zA-Z0-9()+\-*/]{1,3}$/.test(t) && !/^(is|in|on|at|to|of|or|by|as|an|be|if|it|no|so|we|do|go|up|for|the|and|are|not|but|can|all|any|has|was|one|two|out|see|now|how|why|who)$/.test(t.toLowerCase())) {
      return true;
    }
    return false;
  };

  const hasLatexCommand = (tok: string): boolean => /\\[a-zA-Z]+/.test(tok);

  // Find spans of math tokens that contain at least one `hasLatexCommand` token
  const n = mergedTokens.length;
  const inMathSpan = new Array<boolean>(n).fill(false);

  for (let i = 0; i < n; i++) {
    if (hasLatexCommand(mergedTokens[i])) {
      inMathSpan[i] = true;
      // Expand left across whitespace and math tokens (e.g. `E = `)
      let left = i - 1;
      while (left >= 0) {
        if (/^\s+$/.test(mergedTokens[left])) {
          if (left - 1 >= 0 && isMathToken(mergedTokens[left - 1])) {
            inMathSpan[left] = true;
            inMathSpan[left - 1] = true;
            left -= 2;
            continue;
          }
          break;
        } else if (isMathToken(mergedTokens[left])) {
          inMathSpan[left] = true;
          left--;
        } else {
          break;
        }
      }
      // Expand right across whitespace and math tokens
      let right = i + 1;
      while (right < n) {
        if (/^\s+$/.test(mergedTokens[right])) {
          if (right + 1 < n && isMathToken(mergedTokens[right + 1])) {
            inMathSpan[right] = true;
            inMathSpan[right + 1] = true;
            right += 2;
            continue;
          }
          break;
        } else if (isMathToken(mergedTokens[right])) {
          inMathSpan[right] = true;
          right++;
        } else {
          break;
        }
      }
    }
  }

  // Reconstruct the line, wrapping contiguous `inMathSpan` runs in `$...$`
  let result = "";
  let idx = 0;
  while (idx < n) {
    if (!inMathSpan[idx]) {
      result += mergedTokens[idx];
      idx++;
      continue;
    }
    let span = "";
    while (idx < n && inMathSpan[idx]) {
      span += mergedTokens[idx];
      idx++;
    }
    // Strip trailing sentence punctuation (.,;:) outside the closing `$`
    const punctMatch = span.match(/^(.*?)([.,;:!?]+)?$/s);
    const core = (punctMatch ? punctMatch[1] : span).trim();
    const trailingPunct = punctMatch && punctMatch[2] ? punctMatch[2] : "";
    result += `$${core}$${trailingPunct}`;
  }

  return result;
}

export interface LatexValidationResult {
  isValid: boolean;
  raw: string;
  cleanedLatex: string;
  renderedHtml?: string;
  errorMessage?: string;
}

/**
 * Validates a single LaTeX expression using KaTeX without silently inventing or altering
 * broken syntax. If invalid, returns `isValid: false` along with the preserved original raw content.
 */
export function validateLatexExpression(
  expression: string,
  displayMode: boolean = false
): LatexValidationResult {
  const raw = expression ?? "";
  let cleaned = repairCorruptedLatexControlChars(raw).trim();
  cleaned = repairDoubleEscapedLatex(cleaned);

  // Strip outer delimiters if passed directly to MathRenderer
  if (cleaned.startsWith("$$") && cleaned.endsWith("$$") && cleaned.length >= 4) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (
    cleaned.startsWith("$") &&
    cleaned.endsWith("$") &&
    cleaned.length >= 2 &&
    !cleaned.slice(1, -1).includes("$")
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  } else if (cleaned.startsWith("\\[") && cleaned.endsWith("\\]")) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith("\\(") && cleaned.endsWith("\\)")) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  cleaned = cleaned.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    "\\begin{aligned}$1\\end{aligned}"
  );
  cleaned = normalizeUnicodeInsideMath(cleaned);

  if (!cleaned) {
    return {
      isValid: true,
      raw,
      cleanedLatex: "",
      renderedHtml: "",
    };
  }

  try {
    const html = katex.renderToString(cleaned, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false,
    });
    return {
      isValid: true,
      raw,
      cleanedLatex: cleaned,
      renderedHtml: html,
    };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message.replace(/^KaTeX parse error:\s*/i, "")
        : "Invalid mathematical notation";
    return {
      isValid: false,
      raw,
      cleanedLatex: cleaned,
      errorMessage: msg,
    };
  }
}

/**
 * Scans normalized Markdown content for `$...$` and `$$...$$` segments.
 * Any segment with invalid LaTeX syntax is extracted so the renderer can display
 * a graceful fallback while retaining the exact original raw notation.
 */
export interface InvalidMathFallbackEntry {
  placeholder: string;
  raw: string;
  displayMode: boolean;
  errorMessage: string;
}

export function guardInvalidMathInMarkdown(normalizedMarkdown: string): {
  safeMarkdown: string;
  invalidEntries: InvalidMathFallbackEntry[];
} {
  const invalidEntries: InvalidMathFallbackEntry[] = [];

  // 1. Check display math $$...$$
  let safeMarkdown = normalizedMarkdown.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (fullMatch, inner: string) => {
      const check = validateLatexExpression(inner, true);
      if (check.isValid) {
        return fullMatch;
      }
      const idx = invalidEntries.length;
      const placeholder = `@@VIDYA_INVALID_MATH_${idx}@@`;
      invalidEntries.push({
        placeholder,
        raw: inner.trim(),
        displayMode: true,
        errorMessage: check.errorMessage || "Invalid display equation syntax",
      });
      return `\n\n\`${placeholder}\`\n\n`;
    }
  );

  // 2. Check inline math $...$
  safeMarkdown = safeMarkdown.replace(
    /(?<![\\$])\$(?!\$)([^$\n]+?)(?<![\\$])\$(?!\$)/g,
    (fullMatch, inner: string) => {
      const check = validateLatexExpression(inner, false);
      if (check.isValid) {
        return fullMatch;
      }
      const idx = invalidEntries.length;
      const placeholder = `@@VIDYA_INVALID_MATH_${idx}@@`;
      invalidEntries.push({
        placeholder,
        raw: inner.trim(),
        displayMode: false,
        errorMessage: check.errorMessage || "Invalid inline formula syntax",
      });
      return `\`${placeholder}\``;
    }
  );

  return { safeMarkdown, invalidEntries };
}

/**
 * Normalizes a standalone formula field (such as `step.formula` or `formulaExpression`
 * passed directly to `<MathRenderer expression={...} />`), repairing control chars and
 * double-escaped commands without altering valid or invalid formula semantics.
 */
export function normalizeFormulaField(expr?: unknown): string | undefined {
  if (typeof expr !== "string") return undefined;
  let cleaned = repairCorruptedLatexControlChars(expr).trim();
  if (!cleaned) return undefined;
  cleaned = repairDoubleEscapedLatex(cleaned);

  // Strip outer markdown latex fence if present
  const fenceMatch = cleaned.match(/^```(?:latex|math|tex)?\s*\r?\n([\s\S]*?)\r?\n?```$/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Strip outer $$...$$, \[...\], \(...\), or single $...$ if enclosing the whole expression
  if (cleaned.startsWith("$$") && cleaned.endsWith("$$") && cleaned.length >= 4) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith("\\[") && cleaned.endsWith("\\]")) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith("\\(") && cleaned.endsWith("\\)")) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (
    cleaned.startsWith("$") &&
    cleaned.endsWith("$") &&
    cleaned.length >= 2 &&
    !cleaned.slice(1, -1).includes("$")
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  cleaned = cleaned.replace(
    /\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g,
    "\\begin{aligned}$1\\end{aligned}"
  );
  cleaned = normalizeUnicodeInsideMath(cleaned);
  return cleaned.trim() || undefined;
}

/**
 * Normalizes and validates a StructuredTutorResponse from the AI tutor or stored history.
 */
export function normalizeStructuredTutorResponse(
  rawParsed: Record<string, unknown> | StructuredTutorResponse | null | undefined,
  _fallbackContext?: {
    topicTitle?: string;
    subjectName?: string;
  }
): StructuredTutorResponse | null {
  if (!rawParsed || typeof rawParsed !== "object") return null;

  const p = rawParsed as Record<string, unknown>;
  const mainIdeaRaw = typeof p.mainIdea === "string" ? p.mainIdea.trim() : "";

  const rawSteps = Array.isArray(p.steps) ? p.steps : [];
  const normalizedSteps: NonNullable<StructuredTutorResponse["steps"]> = [];

  for (let i = 0; i < rawSteps.length; i++) {
    const item = rawSteps[i];
    if (typeof item === "string" && item.trim()) {
      normalizedSteps.push({
        title: `Step ${i + 1}`,
        explanation: normalizeMathContent(item.trim()),
      });
    } else if (item && typeof item === "object") {
      const st = item as Record<string, unknown>;
      const titleRaw =
        typeof st.title === "string" && st.title.trim()
          ? st.title.trim()
          : `Step ${i + 1}`;
      const explanationRaw =
        typeof st.explanation === "string" && st.explanation.trim()
          ? st.explanation.trim()
          : typeof st.detail === "string" && st.detail.trim()
          ? st.detail.trim()
          : "";
      const formulaClean = normalizeFormulaField(st.formula);

      if (explanationRaw || formulaClean) {
        normalizedSteps.push({
          title: normalizeMathContent(titleRaw, { expandDisplayBlocks: false }),
          explanation: normalizeMathContent(explanationRaw || titleRaw),
          formula: formulaClean,
        });
      }
    }
  }

  const finalAnswerRaw =
    typeof p.finalAnswer === "string" ? p.finalAnswer.trim() : "";

  if (!mainIdeaRaw && normalizedSteps.length === 0 && !finalAnswerRaw) {
    return null;
  }

  const mainIdea = normalizeMathContent(
    mainIdeaRaw || "Review the core principle and step-by-step derivation below."
  );

  const formulaExpression = normalizeFormulaField(p.formulaExpression);
  const formulaOrDiagramNote =
    typeof p.formulaOrDiagramNote === "string" && p.formulaOrDiagramNote.trim()
      ? normalizeMathContent(p.formulaOrDiagramNote.trim())
      : undefined;

  const validDiagramTypes = new Set<QuestionDiagramType>([
    "gaussian-cube",
    "projectile-apex",
    "equilibrium-vessel",
    "daniell-cell",
    "bohr-curve",
  ]);
  const diagramType =
    typeof p.diagramType === "string" &&
    validDiagramTypes.has(p.diagramType as QuestionDiagramType)
      ? (p.diagramType as QuestionDiagramType)
      : undefined;

  const finalAnswer = finalAnswerRaw
    ? normalizeMathContent(finalAnswerRaw)
    : undefined;

  const commonMistake =
    typeof p.commonMistake === "string" && p.commonMistake.trim()
      ? normalizeMathContent(p.commonMistake.trim())
      : undefined;

  let practiceQuestion: TutorPracticeQuestion | undefined = undefined;
  if (p.practiceQuestion && typeof p.practiceQuestion === "object") {
    const pq = p.practiceQuestion as Record<string, unknown>;
    if (typeof pq.prompt === "string" && pq.prompt.trim()) {
      practiceQuestion = {
        prompt: normalizeMathContent(pq.prompt.trim()),
        options: Array.isArray(pq.options)
          ? pq.options
              .filter((o) => typeof o === "string" && o.trim())
              .slice(0, 4)
              .map((o) =>
                normalizeMathContent(String(o).trim(), {
                  expandDisplayBlocks: false,
                })
              )
          : undefined,
        correctAnswer:
          typeof pq.correctAnswer === "string" && pq.correctAnswer.trim()
            ? normalizeMathContent(pq.correctAnswer.trim(), {
                expandDisplayBlocks: false,
              })
            : "Refer to solution below",
        hintOrSolution:
          typeof pq.hintOrSolution === "string" && pq.hintOrSolution.trim()
            ? normalizeMathContent(pq.hintOrSolution.trim())
            : "Apply the formula and step-by-step method shown above.",
      };
    }
  }

  const suggestedFollowUps =
    Array.isArray(p.suggestedFollowUps) && p.suggestedFollowUps.length > 0
      ? p.suggestedFollowUps
          .filter((f) => typeof f === "string" && f.trim())
          .slice(0, 3)
          .map((f) =>
            normalizeMathContent(String(f).trim(), {
              expandDisplayBlocks: false,
            })
          )
      : undefined;

  return {
    mainIdea,
    steps: normalizedSteps,
    formulaExpression,
    formulaOrDiagramNote,
    diagramType,
    finalAnswer,
    commonMistake,
    practiceQuestion,
    suggestedFollowUps,
  };
}

/**
 * Formats a normalized StructuredTutorResponse into clean Markdown (for note-saving and legacy `text` field).
 */
export function formatStructuredTutorMarkdown(
  structured: StructuredTutorResponse
): string {
  const sections: string[] = [structured.mainIdea];

  if (structured.steps && structured.steps.length > 0) {
    sections.push(
      structured.steps
        .map(
          (s, i) =>
            `${i + 1}. **${s.title}**: ${s.explanation}${
              s.formula ? `\n\n$$\n${s.formula}\n$$` : ""
            }`
        )
        .join("\n\n")
    );
  }

  if (structured.formulaExpression) {
    sections.push(`**Key Formula:**\n\n$$\n${structured.formulaExpression}\n$$`);
  }

  if (structured.formulaOrDiagramNote) {
    sections.push(`**Concept & Variable Note:** ${structured.formulaOrDiagramNote}`);
  }

  if (structured.finalAnswer) {
    sections.push(`**Final Answer:** ${structured.finalAnswer}`);
  }

  if (structured.commonMistake) {
    sections.push(`**Common Mistake to Avoid:** ${structured.commonMistake}`);
  }

  return sections.join("\n\n");
}

/**
 * Non-destructively migrates and normalizes existing conversation history (`doubtHistory`)
 * and saved student notes (`notes`) so previously stored content renders cleanly under the
 * unified mathematical content contract without losing or corrupting any student data.
 */
export function migrateLegacyStudentStateMath(
  state: StudentLearningState
): StudentLearningState {
  if (!state || typeof state !== "object") return state;

  const migratedHistory: DoubtMessage[] = Array.isArray(state.doubtHistory)
    ? state.doubtHistory.map((msg) => {
        if (!msg || typeof msg !== "object") return msg;
        const normalizedText =
          typeof msg.text === "string" ? normalizeMathContent(msg.text) : msg.text;
        const normalizedStructured = msg.structured
          ? normalizeStructuredTutorResponse(msg.structured, {
              topicTitle: msg.relatedTopicTitle,
            }) ?? msg.structured
          : undefined;
        return {
          ...msg,
          text: normalizedText,
          structured: normalizedStructured,
        };
      })
    : [];

  const migratedNotes = Array.isArray(state.notes)
    ? state.notes.map((note) => {
        if (!note || typeof note !== "object") return note;
        return {
          ...note,
          content:
            typeof note.content === "string"
              ? normalizeMathContent(note.content)
              : note.content,
        };
      })
    : [];

  return {
    ...state,
    doubtHistory: migratedHistory,
    notes: migratedNotes,
  };
}
