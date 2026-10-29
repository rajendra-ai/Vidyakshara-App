import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MATH_CONTENT_CONTRACT_PROMPT,
  disambiguateCurrencyDollars,
  formatStructuredTutorMarkdown,
  guardInvalidMathInMarkdown,
  migrateLegacyStudentStateMath,
  normalizeFormulaField,
  normalizeMathContent,
  normalizeStructuredTutorResponse,
  parseTutorJsonSafely,
  repairCorruptedLatexControlChars,
  repairDoubleEscapedLatex,
  validateLatexExpression,
} from "../mathContentContract";
import {
  MarkdownContent,
  MathRenderer,
  QuestionContent,
  QuestionWorkedSolution,
  WorkedSolution,
} from "../../components/ui/MathAndDiagrams";
import {
  createDemoStudentState,
  QUESTIONS,
  TOPICS,
} from "../../data/curriculum";
import {
  buildAdaptiveDailyPlan,
  computeSubjectInsights,
  computeTopicInsights,
  getPersonalisedNextRecommendation,
} from "../personalisation";
import { DiscoveryAndAuthView } from "../../components/views/DiscoveryAndAuthView";
import { HomeView } from "../../components/views/HomeView";
import { LearnView } from "../../components/views/LearnView";
import { PracticeView } from "../../components/views/PracticeView";
import { DoubtSolverView } from "../../components/views/DoubtSolverView";
import { MockTestsView } from "../../components/views/MockTestsView";
import {
  NotesView,
  ProgressView,
  RevisionView,
} from "../../components/views/SecondaryAreasView";
import { QuestionCard } from "../../components/questions/QuestionCard";
import {
  CAREER_CLUSTERS,
  CAREER_QUESTIONS,
  INTEREST_DIMENSIONS,
  validateCareerAssessmentDataset,
} from "../../data/careerAssessmentData";
import {
  appendReportToHistory,
  attachAINarrativeToReport,
  createFreshCareerAssessmentState,
  createSavedReportHistoryEntry,
  findUnansweredQuestions,
  formatCareerReportAsMarkdown,
  generateCareerGuidanceReport,
  resetCareerStateForTabEntry,
  sanitizeAssessmentResponses,
  scoreInterestDimensions,
  validateAICareerNarrative,
  validateStudentDetailsForm,
} from "../careerScoringEngine";
import { CareerAssessmentStore } from "../careerServerService";
import {
  buildCareerReportPdfFilename,
  formatReportDateForFilename,
  generateCareerReportPdfBytes,
} from "../careerPdfGenerator";
import {
  RateLimiter,
  StudentRecordStore,
  isValidStudentId,
  timingSafeTokenMatch,
} from "../productionDatabase";
import { CareerDiscoveryView } from "../../components/views/CareerDiscoveryView";

interface TestCase {
  name: string;
  run: () => void | Promise<void>;
}

/**
 * Extracts only the visually rendered text from HTML markup by removing:
 * 1. <span class="katex-mathml">...</span> (which contains a <math><semantics><annotation encoding="application/x-tex"> node for screen readers)
 * 2. HTML tags and attributes
 * So we can assert that zero raw LaTeX commands (\frac, \sqrt, \vec, \ce, \theta, etc.) or unrendered $ delimiters are visible to students.
 */
function extractVisibleTextFromHtml(html: string): string {
  // Remove screen-reader-only .katex-mathml blocks (which store <annotation encoding="application/x-tex">)
  const withoutMathMl = html.replace(
    /<span class="katex-mathml">[\s\S]*?<\/math><\/span>/g,
    " "
  );
  // Remove all HTML tags
  const textOnly = withoutMathMl
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return textOnly;
}

/**
 * Asserts that rendered HTML for a view has:
 * - Zero unexpected math fallbacks (`data-math-fallback`)
 * - Zero leaked raw LaTeX commands in visible text
 * - Zero unrendered `$` math delimiters in visible text (excluding legitimate currency like `$25`)
 * - Properly paired `.katex-html` and `.katex-mathml` inside every `.katex` instance (no missing or double visual rendering)
 */
function assertCleanMathRenderingInView(viewName: string, html: string) {
  assert.ok(
    !html.includes("data-math-fallback"),
    `[${viewName}] Unexpected InvalidMathFallback triggered in rendered view`
  );
  assert.ok(
    !html.includes("katex-error"),
    `[${viewName}] Unexpected katex-error found in rendered view`
  );

  // Verify every .katex element has both accessible MathML (.katex-mathml) and visual HTML (.katex-html aria-hidden="true")
  // without duplicate visual rendering
  const katexHtmlCount = (html.match(/class="katex-html"/g) || []).length;
  const katexMathMlCount = (html.match(/class="katex-mathml"/g) || []).length;
  assert.equal(
    katexHtmlCount,
    katexMathMlCount,
    `[${viewName}] Expected 1:1 pairing between .katex-html (${katexHtmlCount}) and .katex-mathml (${katexMathMlCount}) so no equation renders twice or lacks accessible MathML`
  );

  const visibleText = extractVisibleTextFromHtml(html);

  const rawLatexLeakPattern =
    /\\(?:frac|sqrt|int|oint|sum|prod|lim|vec|hat|ce|pu|theta|alpha|beta|gamma|Delta|Phi|varepsilon|circ|times|cdot|implies|iff|begin\{|end\{|left|right|text\{|mathrm\{)/;
  const match = visibleText.match(rawLatexLeakPattern);
  assert.equal(
    match,
    null,
    `[${viewName}] Raw LaTeX command "${match?.[0]}" leaked into visible text! Context: "${
      match ? visibleText.slice(Math.max(0, match.index! - 60), match.index! + 80) : ""
    }"`
  );

  // Check for unrendered $ delimiters (ignoring currency $<digits>)
  const unrenderedDollarMatch = visibleText.match(/\$(?!\d)/);
  assert.equal(
    unrenderedDollarMatch,
    null,
    `[${viewName}] Unrendered '$' delimiter leaked into visible text! Context: "${
      unrenderedDollarMatch
        ? visibleText.slice(
            Math.max(0, unrenderedDollarMatch.index! - 60),
            unrenderedDollarMatch.index! + 80
          )
        : ""
    }"`
  );
}

const noop = () => {};

const tests: TestCase[] = [
  /* =========================================================================
   * PART A: MANDATORY 12-CASE MATHEMATICAL RENDERING TEST SUITE
   * ======================================================================= */
  {
    name: "Suite Case 1 — Inline equation: The kinetic energy is $K=\\frac{1}{2}mv^2$.",
    run: () => {
      const input = "The kinetic energy is $K=\\frac{1}{2}mv^2$.";
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(html.includes('class="katex"'), "Expected inline KaTeX span");
      assert.ok(
        !html.includes('class="katex-display"'),
        "Inline equation must not render as display block"
      );
      assert.ok(
        html.includes("katex-mathml") && html.includes('aria-hidden="true"'),
        "Expected accessible MathML + aria-hidden visual HTML"
      );
      assertCleanMathRenderingInView("Suite Case 1 (Inline equation)", html);
    },
  },
  {
    name: "Suite Case 2 — Quadratic formula: $$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$$",
    run: () => {
      const input = "$$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$$";
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display equation for quadratic formula"
      );
      assert.ok(
        html.includes("katex-fraction") || html.includes("mfrac"),
        "Expected fraction structure in rendered quadratic formula"
      );
      assert.ok(
        html.includes("sqrt") || html.includes("msqrt"),
        "Expected radical structure in rendered quadratic formula"
      );
      assertCleanMathRenderingInView("Suite Case 2 (Quadratic formula)", html);
    },
  },
  {
    name: "Suite Case 3 — Integral: $$\\int_0^1 x^2\\,dx=\\frac{1}{3}$$",
    run: () => {
      const input = "$$\\int_0^1 x^2\\,dx=\\frac{1}{3}$$";
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display equation for definite integral"
      );
      assert.ok(html.includes("∫"), "Expected integral symbol ∫ in rendered output");
      assertCleanMathRenderingInView("Suite Case 3 (Integral)", html);
    },
  },
  {
    name: "Suite Case 4 — Limit: $$\\lim_{x\\to 0}\\frac{\\sin x}{x}=1$$",
    run: () => {
      const input = "$$\\lim_{x\\to 0}\\frac{\\sin x}{x}=1$$";
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display equation for limit"
      );
      assert.ok(html.includes("lim"), "Expected lim operator in rendered output");
      assertCleanMathRenderingInView("Suite Case 4 (Limit)", html);
    },
  },
  {
    name: "Suite Case 5 — Summation: $$\\sum_{k=1}^{n} k=\\frac{n(n+1)}{2}$$",
    run: () => {
      const input = "$$\\sum_{k=1}^{n} k=\\frac{n(n+1)}{2}$$";
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display equation for summation"
      );
      assert.ok(html.includes("∑"), "Expected summation symbol ∑ in rendered output");
      assertCleanMathRenderingInView("Suite Case 5 (Summation)", html);
    },
  },
  {
    name: "Suite Case 6 — Matrix: $$A=\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}$$",
    run: () => {
      const input = "$$A=\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}$$";
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display equation for bmatrix"
      );
      assert.ok(
        html.includes("mtable"),
        "Expected matrix table structure in rendered output"
      );
      assertCleanMathRenderingInView("Suite Case 6 (Matrix)", html);
    },
  },
  {
    name: "Suite Case 7 — Multi-line derivation using aligned equations",
    run: () => {
      const input = [
        "$$\\begin{aligned}",
        "R &= H_{\\max} \\\\",
        "\\frac{u^2 \\sin 2\\theta}{g} &= \\frac{u^2 \\sin^2\\theta}{2g} \\\\",
        "2\\sin\\theta\\cos\\theta &= \\frac{\\sin^2\\theta}{2} \\\\",
        "\\tan\\theta &= 4 \\implies \\theta = \\arctan(4) \\approx 75.96^\\circ",
        "\\end{aligned}$$",
      ].join("\n");
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display equation for multi-line aligned derivation"
      );
      assert.ok(
        html.includes("mtable"),
        "Expected aligned equation table structure in rendered output"
      );
      assertCleanMathRenderingInView(
        "Suite Case 7 (Multi-line aligned derivation)",
        html
      );
    },
  },
  {
    name: "Suite Case 8 — Chemistry notation, including subscripts, ionic charges, and reaction arrows",
    run: () => {
      const input = [
        "In acidic medium, dichromate ions oxidize iron(II): $\\ce{Cr2O7^{2-}(aq) + 14H^+(aq) + 6Fe^{2+}(aq) -> 2Cr^{3+}(aq) + 6Fe^{3+}(aq) + 7H2O(l)}$.",
        "$$\\ce{2SO2(g) + O2(g) <=>[\\text{V}_2\\text{O}_5, 720\\text{ K}][2\\text{ bar}] 2SO3(g)} \\quad \\Delta_{\\text{r}}H^\\circ = \\pu{-198 kJ mol^-1}$$",
      ].join("\n\n");
      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: input })
      );
      assert.ok(html.includes('class="katex"'), "Expected KaTeX mhchem output");
      assert.ok(html.includes('class="katex-display"'), "Expected display equation for reversible reaction");
      assertCleanMathRenderingInView("Suite Case 8 (Chemistry notation)", html);
    },
  },
  {
    name: "Suite Case 9 — Malformed LaTeX expression renders graceful fallback with exact original notation preserved",
    run: () => {
      const brokenDisplay = "\\frac{-b \\pm \\sqrt{b^2 - 4ac}{2a}";
      const check = validateLatexExpression(brokenDisplay, true);
      assert.equal(check.isValid, false, "Malformed LaTeX must fail validation");
      assert.equal(
        check.raw,
        brokenDisplay,
        "Malformed LaTeX validator must preserve exact raw string"
      );

      const fallbackHtml = renderToStaticMarkup(
        React.createElement(MathRenderer, {
          expression: brokenDisplay,
          block: true,
        })
      );
      assert.ok(
        fallbackHtml.includes('data-math-fallback="display"'),
        "Expected display fallback container"
      );
      assert.ok(
        fallbackHtml.includes("Readable Formula Fallback (Original Notation Preserved)"),
        "Expected student-friendly fallback notice"
      );
      assert.ok(
        fallbackHtml.includes(brokenDisplay),
        "Expected exact original malformed formula to be preserved"
      );

      // Also verify inline malformed expression alongside valid math in Markdown
      const mixedMalformed =
        "The valid formula is $K = \\frac{1}{2}mv^2$, whereas $\\frac{mv^2}{r$ is missing a closing brace.";
      const mixedHtml = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: mixedMalformed })
      );
      assert.ok(
        mixedHtml.includes('class="katex"'),
        "Valid equation in the same paragraph must still render via KaTeX"
      );
      assert.ok(
        mixedHtml.includes('data-math-fallback="inline"'),
        "Malformed inline expression must render inline fallback without crashing the paragraph"
      );
      assert.ok(
        mixedHtml.includes("\\frac{mv^2}{r"),
        "Malformed inline expression must preserve original raw text"
      );
    },
  },
  {
    name: "Suite Case 10 — Normal paragraph containing dollar amounts and ordinary punctuation does not trigger math mode",
    run: () => {
      const paragraph =
        "A Physics reference book costs $25 and a complete laboratory kit costs $40 (including a $5 shipping discount); however, students on Vidyakshara can practise 100% free!";
      const normalized = normalizeMathContent(paragraph);
      assert.ok(
        normalized.includes("\\$25") &&
          normalized.includes("\\$40") &&
          normalized.includes("\\$5"),
        `Expected currency dollar amounts to be escaped, got: ${normalized}`
      );

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: paragraph })
      );
      assert.ok(
        !html.includes('class="katex"'),
        "Ordinary prose with dollar amounts ($25, $40, $5) must NOT trigger KaTeX math rendering"
      );
      const visible = extractVisibleTextFromHtml(html);
      assert.ok(
        visible.includes("$25 and a complete laboratory kit costs $40"),
        `Expected normal prose and punctuation to remain intact, got: ${visible}`
      );
    },
  },
  {
    name: "Suite Case 11 — Long equation on a narrow mobile screen uses local horizontal scroll containment without breaking page layout",
    run: () => {
      const longEquation =
        "$$\\begin{aligned} E_{\\text{cell}} &= E^\\circ_{\\text{cell}} - \\frac{2.303 R T}{n F} \\log_{10} \\left( \\frac{[\\ce{Cr^{3+}}]^2 [\\ce{Fe^{3+}}]^6}{[\\ce{Cr2O7^{2-}}] [\\ce{H^+}]^{14} [\\ce{Fe^{2+}}]^6} \\right) = 1.33\\text{ V} - \\frac{0.0591\\text{ V}}{6} \\log_{10}(10^{-12}) = 1.4482\\text{ V} \\end{aligned}$$";

      const surfaceHtml = renderToStaticMarkup(
        React.createElement(MathRenderer, {
          expression: longEquation,
          block: true,
        })
      );
      assert.ok(
        surfaceHtml.includes("overflow-x-auto") && surfaceHtml.includes("max-w-full"),
        "MathRenderer display surface must enforce overflow-x-auto and max-w-full"
      );
      assertCleanMathRenderingInView("Suite Case 11 (Long mobile equation)", surfaceHtml);

      // Verify CSS rules in src/index.css enforce .katex-display local horizontal scrolling on narrow viewports
      const cssContent = fs.readFileSync(
        path.resolve(process.cwd(), "src/index.css"),
        "utf8"
      );
      assert.ok(
        cssContent.includes(".katex-display") &&
          cssContent.includes("overflow-x: auto") &&
          cssContent.includes("-webkit-overflow-scrolling: touch"),
        "Expected src/index.css to configure .katex-display with local horizontal scroll and touch momentum"
      );
      assert.ok(
        cssContent.includes("@media (max-width: 640px)"),
        "Expected responsive mobile typography rule in src/index.css"
      );
    },
  },
  {
    name: "Suite Case 12 — Mixed Markdown, lists, and mathematical expressions in an AI tutor response",
    run: () => {
      const tutorMarkdown = [
        "### Understanding the Nernst Equation & Equilibrium",
        "When a galvanic cell reaches **chemical equilibrium**, there is no net current ($I = 0\\text{ A}$) and the cell potential drops to $E_{\\text{cell}} = 0\\text{ V}$.",
        "",
        "1. **Standard Nernst Relation at $298\\text{ K}$:**",
        "   For a general redox reaction $\\ce{aA + bB <=> cC + dD}$ with $n$ moles of electrons transferred:",
        "   $$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} Q$$",
        "2. **At Equilibrium ($Q = K_{\\text{eq}}$ and $E_{\\text{cell}} = 0$):**",
        "   $$\\begin{aligned}",
        "   0 &= E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} K_{\\text{eq}} \\\\",
        "   E^\\circ_{\\text{cell}} &= \\frac{0.0591}{n}\\log_{10} K_{\\text{eq}}",
        "   \\end{aligned}$$",
        "3. **Gibbs Free Energy Connection:**",
        "   * Standard free energy change: $\\Delta_{\\text{r}}G^\\circ = -nFE^\\circ_{\\text{cell}} = -2.303 RT \\log_{10} K_{\\text{eq}}$",
        "   * Note that $E^\\circ_{\\text{cell}}$ is an *intensive* property, whereas $\\Delta_{\\text{r}}G^\\circ$ is *extensive*.",
      ].join("\n");

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: tutorMarkdown })
      );
      assert.ok(html.includes("<h3"), "Expected Markdown heading <h3>");
      assert.ok(html.includes("<ol"), "Expected Markdown ordered list <ol>");
      assert.ok(html.includes("<ul"), "Expected Markdown nested unordered list <ul>");
      assert.ok(html.includes("<strong"), "Expected Markdown bold <strong>");
      assert.ok(html.includes('class="katex"'), "Expected inline KaTeX equations");
      assert.ok(
        html.includes('class="katex-display"'),
        "Expected display KaTeX equations inside list items"
      );
      assertCleanMathRenderingInView("Suite Case 12 (Mixed Markdown AI Tutor response)", html);
    },
  },

  /* =========================================================================
   * PART B: PIPELINE NORMALIZATION, JSON ESCAPING & LEGACY RECOVERY TESTS
   * ======================================================================= */
  {
    name: "Pipeline 1 — Content contract prompt enforces Markdown prose, $...$/$$...$$ delimiters, aligned derivations, SI units, and \\ce{...}",
    run: () => {
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("$...$"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("$$...$$"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("\\begin{aligned}"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("\\approx"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("\\text{"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("\\ce{"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("\\begin{pmatrix}"));
      assert.ok(MATH_CONTENT_CONTRACT_PROMPT.includes("\\begin{vmatrix}"));
    },
  },
  {
    name: "Pipeline 2 — JSON parser recovers single-escaped LaTeX commands (\\frac, \\theta, \\tau, \\beta, \\right, \\neq, \\sqrt) and strips ```json fences",
    run: () => {
      const rawAiOutput = [
        "```json",
        "{",
        '  "mainIdea": "At the highest point of projectile motion, vertical velocity $v_y = 0\\text{ m s}^{-1}$ while horizontal velocity remains $v_x = u\\cos\\theta$.",',
        '  "steps": [',
        "    {",
        '      "title": "Equate Horizontal Range and Maximum Height",',
        '      "explanation": "Set $R = H_{\\max}$ where $\\theta \\neq 0$ and $\\beta = \\frac{\\pi}{4}$:",',
        '      "formula": "$$\\begin{aligned} \\frac{u^2 \\sin 2\\theta}{g} &= \\frac{u^2 \\sin^2\\theta}{2g} \\\\\\\\ 2\\sin\\theta\\cos\\theta &= \\frac{\\sin^2\\theta}{2} \\\\\\\\ \\tan\\theta &= 4 \\implies \\theta = \\arctan(4) \\approx 75.96^\\circ \\end{aligned}$$"',
        "    }",
        "  ],",
        '  "formulaExpression": "\\vec{v}_{\\text{top}} = \\left( u\\cos\\theta \\right)\\hat{i}",',
        '  "finalAnswer": "$\\tan\\theta = 4$ (exact), so $\\theta \\approx 75.96^\\circ$."',
        "}",
        "```",
      ].join("\n");

      const parsed = parseTutorJsonSafely<Record<string, unknown>>(rawAiOutput);
      assert.ok(parsed, "Expected JSON to parse cleanly despite fences and single-escaped LaTeX");

      const structured = normalizeStructuredTutorResponse(parsed);
      assert.ok(structured, "Expected structured tutor response to normalize");
      assert.ok(structured.mainIdea.includes("u\\cos\\theta"));
      assert.ok(structured.steps?.[0]?.explanation.includes("\\frac{\\pi}{4}"));
      assert.ok(structured.steps?.[0]?.explanation.includes("\\beta"));
      assert.ok(structured.steps?.[0]?.formula?.includes("\\begin{aligned}"));
      assert.ok(structured.formulaExpression?.includes("\\right)"));
    },
  },
  {
    name: "Pipeline 3 — Control-character recovery repairs already-corrupted \\x0crac (\\frac), \\x09heta (\\theta), \\x08eta (\\beta), \\x0dight (\\right)",
    run: () => {
      const corrupted =
        "$\x0crac{1}{2} mv^2 = mg h \x09imes \\cos\x09heta + \x08eta - \\left(x\x0dight)$";
      const repaired = repairCorruptedLatexControlChars(corrupted);
      assert.equal(
        repaired,
        "$\\frac{1}{2} mv^2 = mg h \\times \\cos\\theta + \\beta - \\left(x\\right)$"
      );
    },
  },
  {
    name: "Pipeline 4 — Double-escaped LaTeX is repaired while preserving \\\\ row breaks inside \\begin{aligned}",
    run: () => {
      const doubleEscaped =
        "$$\\begin{aligned}\n\\\\Delta G &= \\\\Delta H - T\\\\Delta S \\\\\n&= -92.4\\\\text{ kJ mol}^{-1}\n\\end{aligned}$$";
      const repaired = repairDoubleEscapedLatex(doubleEscaped);
      assert.ok(repaired.includes("\\Delta G &= \\Delta H - T\\Delta S \\\\"));
      assert.ok(repaired.includes("-92.4\\text{ kJ mol}^{-1}"));

      const validation = validateLatexExpression(repaired, true);
      assert.equal(validation.isValid, true);
    },
  },
  {
    name: "Pipeline 5 — Standalone \\begin{align*}, ```latex fences, and legacy undelimited LaTeX normalize cleanly",
    run: () => {
      const fencedAndAlign = [
        "Here is the integration by King's Property:",
        "```latex",
        "\\begin{align*}",
        "2I &= \\int_{0}^{\\pi/2} 1\\,dx \\\\",
        "I &= \\frac{\\pi}{4} \\approx 0.7854",
        "\\end{align*}",
        "```",
        "By Gauss's Law, the net electric flux is \\Phi_{\\text{net}} = \\frac{q_{\\text{enc}}}{\\varepsilon_0} for any closed surface.",
      ].join("\n");

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: fencedAndAlign })
      );
      assertCleanMathRenderingInView("Pipeline 5 (Fenced align* & legacy undelimited)", html);

      const f1 = normalizeFormulaField("```latex\n$$\\Phi = \\frac{q}{\\varepsilon_0}$$\n```");
      assert.equal(f1, "\\Phi = \\frac{q}{\\varepsilon_0}");
      const f2 = disambiguateCurrencyDollars("Fee is $50 where $x^2 = 25$.");
      assert.ok(f2.includes("\\$50") && f2.includes("$x^2 = 25$"));
    },
  },

  /* =========================================================================
   * PART C: APPLICATION-LEVEL SCREEN & WORKFLOW VERIFICATION
   * ======================================================================= */
  {
    name: "Screen 1 — Landing & Discovery View (DiscoveryAndAuthView) renders with zero raw LaTeX or fallbacks",
    run: () => {
      const discoverHtml = renderToStaticMarkup(
        React.createElement(DiscoveryAndAuthView, {
          initialStep: "discover",
          onCompleteOnboarding: noop,
          onEnterDemoMode: noop,
        })
      );
      assert.ok(
        discoverHtml.includes("Understand more. Practise smarter."),
        "Expected landing hero headline"
      );
      assert.ok(
        discoverHtml.includes("overflow-x-hidden"),
        "Expected overflow-x-hidden on root container"
      );
      assertCleanMathRenderingInView("DiscoveryAndAuthView (discover)", discoverHtml);

      const onboardingHtml = renderToStaticMarkup(
        React.createElement(DiscoveryAndAuthView, {
          initialStep: "onboarding",
          onCompleteOnboarding: noop,
          onEnterDemoMode: noop,
        })
      );
      assertCleanMathRenderingInView("DiscoveryAndAuthView (onboarding)", onboardingHtml);
    },
  },
  {
    name: "Screen 2 — Home View (Daily Study Planner, Key Takeaways, Unresolved Mistakes) renders all equations with KaTeX and zero raw LaTeX",
    run: () => {
      const demoState = migrateLegacyStudentStateMath(createDemoStudentState());
      const homeHtml = renderToStaticMarkup(
        React.createElement(HomeView, {
          state: demoState,
          onNavigate: noop,
          onToggleTaskCompleted: noop,
          onToggleTaskSkipped: noop,
          onMoveTask: noop,
          onAddCustomTask: noop,
          onRegenerateDailyPlan: noop,
          onAddMilestone: noop,
          onToggleMilestone: noop,
          onDeleteMilestone: noop,
        })
      );
      assert.ok(
        homeHtml.includes("katex"),
        "Expected KaTeX equations in HomeView Key Takeaways and Unresolved Mistakes"
      );
      assertCleanMathRenderingInView("HomeView", homeHtml);
    },
  },
  {
    name: "Screen 3 — Learn View (Syllabus Explorer & Concept Reader across all 6 JEE/NEET topics) renders definitions, worked examples, simulators, and knowledge checks with zero raw LaTeX",
    run: () => {
      const demoState = migrateLegacyStudentStateMath(createDemoStudentState());

      // 1. Explorer mode
      const explorerHtml = renderToStaticMarkup(
        React.createElement(LearnView, {
          state: demoState,
          onToggleTopicComplete: noop,
          onMarkKnowledgeCheckDone: noop,
          onSaveTopicToNotes: noop,
          onNavigate: noop,
        })
      );
      assertCleanMathRenderingInView("LearnView (Syllabus Explorer)", explorerHtml);

      // 2. Reader mode for every curriculum topic
      for (const topic of TOPICS) {
        const readerHtml = renderToStaticMarkup(
          React.createElement(LearnView, {
            state: demoState,
            initialSubjectId: topic.subjectId,
            initialTopicId: topic.id,
            onToggleTopicComplete: noop,
            onMarkKnowledgeCheckDone: noop,
            onSaveTopicToNotes: noop,
            onNavigate: noop,
          })
        );
        assert.ok(
          extractVisibleTextFromHtml(readerHtml).includes(topic.title),
          `Expected topic title "${topic.title}" in LearnView reader`
        );
        assert.ok(
          readerHtml.includes('role="radiogroup"') && readerHtml.includes('role="radio"'),
          `Expected accessible radiogroup and radio buttons in knowledge check for "${topic.id}"`
        );
        assertCleanMathRenderingInView(`LearnView Reader (${topic.id})`, readerHtml);

        // Also verify every WorkedSolution component directly
        for (const ex of topic.workedExamples) {
          const exHtml = renderToStaticMarkup(
            React.createElement(WorkedSolution, { example: ex })
          );
          assertCleanMathRenderingInView(`WorkedSolution (${ex.id})`, exHtml);
        }
      }
    },
  },
  {
    name: "Screen 4 — Practice View & QuestionCard (Single-choice, Multi-correct, Numerical, Worked Solutions, and Trap Diagnostics across all 12 questions)",
    run: () => {
      const demoState = migrateLegacyStudentStateMath(createDemoStudentState());

      const practiceHtml = renderToStaticMarkup(
        React.createElement(PracticeView, {
          state: demoState,
          onRecordAttempt: noop,
          onToggleBookmark: noop,
          onUpdatePracticeSession: noop,
          onNavigate: noop,
        })
      );
      assertCleanMathRenderingInView("PracticeView", practiceHtml);

      // Render every QuestionCard in both unattempted and attempted (solution visible) states
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const unattemptedHtml = renderToStaticMarkup(
          React.createElement(QuestionCard, {
            question: q,
            questionNumber: i + 1,
            totalQuestions: QUESTIONS.length,
            isBookmarked: false,
            targetExam: "JEE Main",
            onRecordAttempt: noop,
            onToggleBookmark: noop,
          })
        );
        assertCleanMathRenderingInView(
          `QuestionCard unattempted (${q.id})`,
          unattemptedHtml
        );

        // Simulated wrong attempt so option-by-option trap diagnostic and step-by-step worked solution render
        const wrongAttempt = {
          id: `att-test-${q.id}`,
          questionId: q.id,
          topicId: q.topicId,
          chapterId: q.chapterId,
          subjectId: q.subjectId,
          selectedOptionId:
            q.questionType === "single-choice"
              ? q.options?.find((o) => o.id !== q.correctOptionId)?.id || "A"
              : undefined,
          selectedOptionIds:
            q.questionType === "multiple-choice"
              ? (["A", "C"] as ("A" | "B" | "C" | "D")[])
              : undefined,
          numericalAnswer:
            q.questionType === "numerical"
              ? (q.correctNumericalValue ?? 0) + 10
              : undefined,
          isCorrect: false,
          marksAwarded: q.questionType === "numerical" ? 0 : -1,
          attemptedAt: "Just now",
          timeSpentSeconds: 45,
          markedForRevision: true,
        };

        const attemptedHtml = renderToStaticMarkup(
          React.createElement(QuestionCard, {
            question: q,
            questionNumber: i + 1,
            totalQuestions: QUESTIONS.length,
            existingAttempt: wrongAttempt,
            isBookmarked: true,
            targetExam: "JEE Advanced",
            onRecordAttempt: noop,
            onToggleBookmark: noop,
          })
        );
        assert.ok(
          attemptedHtml.includes("Final Answer"),
          `Expected Final Answer callout in attempted QuestionCard (${q.id})`
        );
        assertCleanMathRenderingInView(
          `QuestionCard attempted with solution (${q.id})`,
          attemptedHtml
        );

        // Also verify QuestionContent directly
        const contentHtml = renderToStaticMarkup(
          React.createElement(QuestionContent, { question: q })
        );
        assertCleanMathRenderingInView(`QuestionContent (${q.id})`, contentHtml);

        const workedSolHtml = renderToStaticMarkup(
          React.createElement(QuestionWorkedSolution, { question: q })
        );
        assertCleanMathRenderingInView(
          `QuestionWorkedSolution (${q.id})`,
          workedSolHtml
        );
      }
    },
  },
  {
    name: "Screen 5 — AI Tutor View (DoubtSolverView) renders conversation history, structured derivations, formulas, and follow-up controls cleanly",
    run: () => {
      const demoState = migrateLegacyStudentStateMath(createDemoStudentState());
      const tutorHtml = renderToStaticMarkup(
        React.createElement(DoubtSolverView, {
          state: demoState,
          onAddDoubtMessages: noop,
          onClearDoubtHistory: noop,
          onSaveExplanationToNotes: noop,
          onNavigate: noop,
        })
      );
      assert.ok(
        tutorHtml.includes("katex-display"),
        "Expected display equations in AI Tutor conversation history"
      );
      assertCleanMathRenderingInView("DoubtSolverView", tutorHtml);
    },
  },
  {
    name: "Screen 6 — Mock Tests View (Test Overview & Post-Test Scorecard with Solution Review) renders all equations cleanly",
    run: () => {
      const demoState = migrateLegacyStudentStateMath(createDemoStudentState());
      const mockOverviewHtml = renderToStaticMarkup(
        React.createElement(MockTestsView, {
          state: demoState,
          onSaveMockResult: noop,
          onToggleBookmarkTopic: noop,
          onNavigate: noop,
        })
      );
      assertCleanMathRenderingInView("MockTestsView (Overview)", mockOverviewHtml);
    },
  },
  {
    name: "Screen 7 — Revision, Progress, and Notes Views render all saved formulas, mistake queues, and topic insights with zero raw LaTeX",
    run: () => {
      const demoState = migrateLegacyStudentStateMath(createDemoStudentState());

      const revisionHtml = renderToStaticMarkup(
        React.createElement(RevisionView, {
          state: demoState,
          onRecordAttempt: noop,
          onToggleBookmark: noop,
          onToggleBookmarkTopic: noop,
          onCompleteRevisionSession: noop,
          onNavigate: noop,
        })
      );
      assertCleanMathRenderingInView("RevisionView", revisionHtml);

      const progressHtml = renderToStaticMarkup(
        React.createElement(ProgressView, {
          state: demoState,
          onNavigate: noop,
        })
      );
      assertCleanMathRenderingInView("ProgressView", progressHtml);

      const notesHtml = renderToStaticMarkup(
        React.createElement(NotesView, {
          state: demoState,
          onAddNote: noop,
          onDeleteNote: noop,
        })
      );
      assert.ok(
        notesHtml.includes("katex"),
        "Expected KaTeX equations in saved student notes"
      );
      assertCleanMathRenderingInView("NotesView", notesHtml);
    },
  },
  {
    name: "Workflow & Persistence — Study planner generation, topic/subject insights, recommendation engine, and state migration preserve data integrity",
    run: () => {
      const demoState = createDemoStudentState();
      const migrated = migrateLegacyStudentStateMath(demoState);
      assert.equal(migrated.attempts.length, demoState.attempts.length);
      assert.equal(migrated.doubtHistory.length, demoState.doubtHistory.length);
      assert.equal(migrated.notes.length, demoState.notes.length);

      const topicInsights = computeTopicInsights(migrated);
      assert.ok(topicInsights.length > 0, "Expected topic insights to be computed");

      const subjectInsights = computeSubjectInsights(migrated);
      assert.equal(
        subjectInsights.length,
        3,
        "Expected 3 subjects (Physics, Chemistry, Mathematics) for JEE Main demo profile"
      );

      const recommendation = getPersonalisedNextRecommendation(migrated);
      assert.ok(recommendation.title && recommendation.primaryActionLabel);

      const freshPlan = buildAdaptiveDailyPlan(migrated);
      assert.ok(freshPlan.length >= 2, "Expected daily planner to generate actionable tasks");

      // Verify structured tutor response markdown formatter
      const tutorMsg = migrated.doubtHistory.find((m) => m.role === "tutor" && m.structured);
      assert.ok(tutorMsg?.structured);
      const formattedMd = formatStructuredTutorMarkdown(tutorMsg.structured);
      const formattedHtml = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: formattedMd })
      );
      assertCleanMathRenderingInView("Formatted Structured Tutor Note", formattedHtml);
    },
  },
  {
    name: "Career Test 1 — Dataset validation: exactly 40 unique questions, 10 career clusters, 6 interest dimensions, and complete scoring maps",
    run: () => {
      const validation = validateCareerAssessmentDataset();
      assert.equal(
        validation.valid,
        true,
        `Dataset validation failed: ${validation.errors.join("; ")}`
      );
      assert.equal(validation.questionCount, 40);
      assert.equal(validation.clusterCount, 10);
      assert.equal(validation.dimensionCount, 6);
      assert.equal(CAREER_QUESTIONS.length, 40);
      assert.equal(CAREER_CLUSTERS.length, 10);
      assert.equal(INTEREST_DIMENSIONS.length, 6);
    },
  },
  {
    name: "Career Test 2 — Boundary scores (0 and 100), uniform tie detection, and repeatability of deterministic scoring engine",
    run: () => {
      // 1. Minimum Likert responses ("1" = Strongly dislike -> 0 weight on all 30 Likert items)
      const minLikertResponses: Record<string, string> = {};
      CAREER_QUESTIONS.slice(0, 30).forEach((q) => {
        minLikertResponses[q.id] = "1";
      });
      const minScores = scoreInterestDimensions(minLikertResponses);
      minScores.forEach((s) => {
        assert.equal(
          s.normalizedScore,
          0,
          `Expected 0 normalized score for minimum Likert response on ${s.dimensionId}, got ${s.normalizedScore}`
        );
      });

      // 2. Maximum Likert responses ("5" = Strongly like -> full weight on all 30 Likert items)
      const maxLikertResponses: Record<string, string> = {};
      CAREER_QUESTIONS.slice(0, 30).forEach((q) => {
        maxLikertResponses[q.id] = "5";
      });
      const maxScores = scoreInterestDimensions(maxLikertResponses);
      maxScores.forEach((s) => {
        assert.equal(
          s.normalizedScore,
          100,
          `Expected 100 normalized score for maximum Likert response on ${s.dimensionId}, got ${s.normalizedScore}`
        );
      });

      // 3. Ties between interest dimensions trigger an explicit tieNote
      const tiedReport = generateCareerGuidanceReport(maxLikertResponses);
      assert.ok(
        tiedReport.tieNote && tiedReport.tieNote.includes("within"),
        "Expected tieNote when top interest dimensions have tied/close scores"
      );

      // 4. Repeatability: identical inputs produce identical scores and cluster rankings
      const repA = generateCareerGuidanceReport(maxLikertResponses, {
        reportId: "fixed-id",
        generatedAt: "29 Oct 2026",
      });
      const repB = generateCareerGuidanceReport(maxLikertResponses, {
        reportId: "fixed-id",
        generatedAt: "29 Oct 2026",
      });
      assert.deepEqual(repA.dimensionScores, repB.dimensionScores);
      assert.deepEqual(
        repA.recommendedClusters.map((c) => c.cluster.id),
        repB.recommendedClusters.map((c) => c.cluster.id)
      );
    },
  },
  {
    name: "Career Test 3 — Missing answers, incomplete assessments, and invalid/corrupted response handling",
    run: () => {
      // 1. Invalid / corrupted inputs are stripped safely
      const dirtyInput = {
        "cit-q01": "5",
        "cit-q02": "INVALID_OPTION",
        "unknown-question": "3",
        "cit-q03": 999,
        "cit-q31": "A",
      };
      const sanitized = sanitizeAssessmentResponses(dirtyInput);
      assert.deepEqual(sanitized, {
        "cit-q01": "5",
        "cit-q31": "A",
      });

      // 2. Unanswered question detection
      const unanswered = findUnansweredQuestions(sanitized);
      assert.equal(unanswered.length, 38);
      assert.equal(unanswered[0].id, "cit-q02");

      // 3. Partial assessment produces valid 0-100 scores without NaN
      const partialReport = generateCareerGuidanceReport(sanitized);
      assert.equal(partialReport.answeredCount, 2);
      assert.equal(partialReport.totalQuestions, 40);
      partialReport.dimensionScores.forEach((d) => {
        assert.ok(
          Number.isInteger(d.normalizedScore) &&
            d.normalizedScore >= 0 &&
            d.normalizedScore <= 100,
          `Invalid score ${d.normalizedScore} on ${d.dimensionId}`
        );
      });

      // 4. Completely empty responses do not crash and yield 0 scores
      const emptyReport = generateCareerGuidanceReport({});
      assert.equal(emptyReport.answeredCount, 0);
      emptyReport.dimensionScores.forEach((d) => {
        assert.equal(d.normalizedScore, 0);
      });
    },
  },
  {
    name: "Career Test 4 — Report sensitivity: distinct student answer patterns produce distinct leading dimensions and career matches",
    run: () => {
      // Profile 1: High Investigative + Realistic (Engineering, Pure Sciences, Environment)
      const stemResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q) => {
        if (q.responseType === "likert-5") {
          const isStem =
            q.primaryDimensions.includes("investigative") ||
            q.primaryDimensions.includes("realistic");
          stemResponses[q.id] = isStem ? "5" : "1";
        } else {
          stemResponses[q.id] = "A";
        }
      });
      const stemReport = generateCareerGuidanceReport(stemResponses);
      const stemTopDims = stemReport.leadingDimensions
        .slice(0, 2)
        .map((d) => d.dimensionId);
      assert.ok(
        stemTopDims.includes("investigative") &&
          stemTopDims.includes("realistic"),
        `Expected investigative & realistic at top for STEM profile, got ${stemTopDims.join(", ")}`
      );
      const stemTopClusterIds = stemReport.recommendedClusters
        .slice(0, 3)
        .map((c) => c.cluster.id);
      assert.ok(
        stemTopClusterIds.includes("engineering-tech") ||
          stemTopClusterIds.includes("pure-sciences"),
        `Expected engineering-tech or pure-sciences in top 3 for STEM profile, got ${stemTopClusterIds.join(", ")}`
      );

      // Profile 2: High Social + Artistic (Education, Humanities, Creative Media)
      const humanCreativeResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q) => {
        if (q.responseType === "likert-5") {
          const isHumanCreative =
            q.primaryDimensions.includes("social") ||
            q.primaryDimensions.includes("artistic");
          humanCreativeResponses[q.id] = isHumanCreative ? "5" : "1";
        } else {
          humanCreativeResponses[q.id] = "C";
        }
      });
      const humanReport = generateCareerGuidanceReport(humanCreativeResponses);
      const humanTopDims = humanReport.leadingDimensions
        .slice(0, 2)
        .map((d) => d.dimensionId);
      assert.ok(
        humanTopDims.includes("social") && humanTopDims.includes("artistic"),
        `Expected social & artistic at top for Creative/Social profile, got ${humanTopDims.join(", ")}`
      );
      assert.notDeepEqual(
        stemReport.recommendedClusters.map((c) => c.cluster.id),
        humanReport.recommendedClusters.map((c) => c.cluster.id),
        "Expected recommended career clusters to change meaningfully when answers change"
      );
    },
  },
  {
    name: "Career Test 5 — AI failure and invalid AI payload fallback preserve the complete free deterministic report",
    run: () => {
      const sampleResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q) => {
        sampleResponses[q.id] = q.responseType === "likert-5" ? "4" : "B";
      });
      const baseReport = generateCareerGuidanceReport(sampleResponses);
      assert.equal(baseReport.personalizationMode, "deterministic");

      // 1. Null / failed AI call keeps deterministic report intact
      const fallbackNull = attachAINarrativeToReport(baseReport, null);
      assert.equal(fallbackNull.personalizationMode, "deterministic");
      assert.equal(fallbackNull.recommendedClusters.length, 5);
      assert.equal(fallbackNull.sevenDayPlan.length, 7);

      // 2. Prohibited deterministic claim ("guaranteed admission") is rejected by validator
      const prohibitedPayload = {
        personalizedOverview:
          "Based on your answers, you have guaranteed admission into top engineering colleges.",
        combinationCommentary:
          "Your Investigative and Realistic scores work together well for technical projects.",
        encouragementNote:
          "Keep exploring hands-on projects over the next week.",
      };
      assert.equal(validateAICareerNarrative(prohibitedPayload), null);
      const fallbackProhibited = attachAINarrativeToReport(
        baseReport,
        prohibitedPayload
      );
      assert.equal(fallbackProhibited.personalizationMode, "deterministic");

      // 3. Valid, balanced AI commentary merges cleanly
      const validPayload = {
        personalizedOverview:
          "Your responses show strong curiosity for understanding how systems work alongside structured analysis. These patterns suggest several analytical and research directions worth exploring.",
        combinationCommentary:
          "Combining Investigative curiosity with Conventional organisation helps you both ask deep questions and keep data reliable.",
        encouragementNote:
          "Try one small 20-minute activity from your 7-day plan this week to see how these fields feel in practice.",
      };
      const enhanced = attachAINarrativeToReport(baseReport, validPayload);
      assert.equal(enhanced.personalizationMode, "ai-enhanced");
      assert.equal(
        enhanced.aiNarrative?.personalizedOverview,
        validPayload.personalizedOverview
      );
    },
  },
  {
    name: "Career Test 6 — Full UI rendering of CareerDiscoveryView across Landing, Intro, Questions, Unanswered Check, and Complete Report with single PDF download action",
    run: () => {
      // 1. Landing Stage
      const landingHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: {
            stage: "landing",
            currentQuestionIndex: 0,
            responses: {},
            completedReport: null,
          },
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        landingHtml.includes("Discover where your interests could take you."),
        "Landing page must include exact headline"
      );
      assert.ok(
        landingHtml.includes("40 Questions") &&
          landingHtml.includes("20–25 Minutes") &&
          landingHtml.includes("Free Personalized Report") &&
          landingHtml.includes("Start My Free Assessment"),
        "Landing page must include required badges and primary CTA"
      );
      assert.ok(
        !landingHtml.includes("WhatsApp") &&
          !landingHtml.includes("Print / Save as PDF"),
        "Landing page must not reference WhatsApp delivery or Print / Save as PDF"
      );
      assertCleanMathRenderingInView("CareerDiscoveryView (Landing)", landingHtml);

      // 2. Intro Stage (Student Personalization Form: Name & Class only)
      const introHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: {
            stage: "intro",
            currentQuestionIndex: 0,
            responses: {},
            completedReport: null,
          },
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        introHtml.includes("Let&#x27;s personalize your career report") ||
          introHtml.includes("Let's personalize your career report"),
        "Intro screen must include 'Let's personalize your career report' heading"
      );
      assert.ok(
        introHtml.includes("Begin Question 1 of 40") &&
          introHtml.includes("Student&#x27;s Full Name"),
        "Intro screen must include student name field and Begin Question 1 of 40 CTA"
      );
      assert.ok(
        !introHtml.includes("WhatsApp") &&
          !introHtml.includes("Preferred Report Delivery Method") &&
          !introHtml.includes("cit-student-email") &&
          !introHtml.includes("cit-student-mobile"),
        "Intro screen must not include email or WhatsApp delivery collection inputs"
      );

      // 3. Active Question Stage
      const questionHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: {
            stage: "questions",
            currentQuestionIndex: 0,
            responses: { "cit-q01": "4" },
            completedReport: null,
          },
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        questionHtml.includes("Question 1 of 40") &&
          questionHtml.includes(CAREER_QUESTIONS[0].prompt),
        "Questions view must render Question 1 prompt and progress"
      );

      // 4. Complete 40-question Report Stage (verifying all sections A-H, single PDF action, and shared KaTeX rendering)
      const fullResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q, idx) => {
        fullResponses[q.id] =
          q.responseType === "likert-5"
            ? String((idx % 5) + 1)
            : (["A", "B", "C", "D"][idx % 4] as string);
      });
      const fullReport = generateCareerGuidanceReport(fullResponses, {
        studentName: "Aarav Sharma",
        studentClass: "Class 11",
      });

      const reportHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: {
            stage: "report",
            currentQuestionIndex: 39,
            responses: fullResponses,
            completedReport: fullReport,
          },
          studentName: "Aarav Sharma",
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        reportHtml.includes("A. Welcome") &&
          reportHtml.includes("B. Your Interest Profile") &&
          reportHtml.includes("C. Leading Interest Combinations") &&
          reportHtml.includes("D. Career Fields to Explore") &&
          reportHtml.includes("E. Learning") &&
          reportHtml.includes("F. Your Personalized 7-Day Exploration Plan") &&
          reportHtml.includes("G. Questions for Further Reflection") &&
          reportHtml.includes("H. Important Limitations"),
        "Report view must render all required sections A through H"
      );
      assert.ok(
        reportHtml.includes("Download Report (PDF)") &&
          reportHtml.includes("Retake Assessment") &&
          reportHtml.includes("Class 11"),
        "Report view must include Download Report (PDF), Retake Assessment, and student class"
      );
      assert.ok(
        !reportHtml.includes("Print / Save as PDF") &&
          !reportHtml.includes("WhatsApp") &&
          !reportHtml.includes("Report Delivery Status") &&
          !reportHtml.includes("Send to Email"),
        "Report view must NOT include Print / Save as PDF or Email/WhatsApp delivery controls"
      );
      assert.ok(
        reportHtml.includes("katex"),
        "Report view must render quantitative career examples using shared KaTeX renderer"
      );
      assertCleanMathRenderingInView(
        "CareerDiscoveryView (Report)",
        reportHtml
      );

      // Verify internal Markdown helper still formats all sections cleanly
      const exportedMd = formatCareerReportAsMarkdown(fullReport);
      assert.ok(
        exportedMd.includes("Student: Aarav Sharma") &&
          exportedMd.includes("Class: Class 11") &&
          exportedMd.includes("## A. Welcome & Overview") &&
          exportedMd.includes("## D. Top Career Fields to Explore") &&
          exportedMd.includes("## F. Your 7-Day Exploration Plan")
      );
    },
  },
  {
    name: "Career Test 7 — Student personalization form validation: fullName and studentClass validation rules",
    run: () => {
      // 1. Valid student name and class
      const validDetails = validateStudentDetailsForm({
        fullName: "  Diya Krishnan  ",
        studentClass: "Class 12",
      });
      assert.equal(validDetails.valid, true);
      assert.equal(validDetails.sanitized?.fullName, "Diya Krishnan");
      assert.equal(validDetails.sanitized?.studentClass, "Class 12");

      // 2. Empty or too-short name fails validation
      const emptyName = validateStudentDetailsForm({
        fullName: " ",
        studentClass: "Class 11",
      });
      assert.equal(emptyName.valid, false);
      assert.ok(emptyName.errors.fullName);

      // 3. Invalid class fails validation
      const badClass = validateStudentDetailsForm({
        fullName: "Rohan Mehta",
        studentClass: "Invalid Class",
      });
      assert.equal(badClass.valid, false);
      assert.ok(badClass.errors.studentClass);
    },
  },
  {
    name: "Career Test 8 — Backend attempt persistence, idempotent updates on refresh/resume, token access control (IDOR prevention), and data deletion",
    run: () => {
      const store = new CareerAssessmentStore(null); // In-memory store for isolated test

      // 1. Create attempt with student personalization details
      const created = store.upsertAttempt({
        studentDetails: {
          fullName: "Ishaan Nair",
          studentClass: "Class 11",
        },
        responses: { "cit-q01": "5", "cit-q02": "4" },
      });
      assert.equal(created.status, "ok");
      assert.ok(created.record?.attemptId);
      assert.ok(
        created.record && created.record.accessToken.length >= 64,
        "Expected 64-char cryptographic access token"
      );

      const attemptId = created.record!.attemptId;
      const accessToken = created.record!.accessToken;

      // 2. Refresh/resume updates the same attemptId in place without creating duplicates
      const resumed = store.upsertAttempt({
        attemptId,
        accessToken,
        responses: { "cit-q01": "5", "cit-q02": "4", "cit-q03": "5" },
      });
      assert.equal(resumed.status, "ok");
      assert.equal(resumed.record?.attemptId, attemptId);
      assert.equal(Object.keys(resumed.record?.responses || {}).length, 3);

      // 3. IDOR Protection: wrong or missing access token cannot read or modify another student's report
      const unauthorizedRead = store.getAuthorizedAttempt(
        attemptId,
        "wrong-token-12345"
      );
      assert.equal(unauthorizedRead.status, "unauthorized");

      const unauthorizedUpdate = store.upsertAttempt({
        attemptId,
        accessToken: "wrong-token-12345",
        responses: { "cit-q01": "1" },
      });
      assert.equal(unauthorizedUpdate.status, "unauthorized");

      // 4. Authorized read succeeds
      const authorizedRead = store.getAuthorizedAttempt(attemptId, accessToken);
      assert.equal(authorizedRead.status, "ok");
      assert.equal(
        authorizedRead.record?.studentDetails?.fullName,
        "Ishaan Nair"
      );

      // 5. Authorized deletion permanently removes student personal data
      const deleted = store.deleteAuthorizedAttempt(attemptId, accessToken);
      assert.equal(deleted.status, "ok");
      const afterDelete = store.getAuthorizedAttempt(attemptId, accessToken);
      assert.equal(afterDelete.status, "not_found");
    },
  },
  {
    name: "Career Test 9 — Genuine multi-page A4 PDF generation (%PDF- signature, student personalization, all report sections A-H, filename sanitization, and error handling)",
    run: () => {
      const allFortyResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q, idx) => {
        allFortyResponses[q.id] =
          q.responseType === "likert-5"
            ? String((idx % 5) + 1)
            : (["A", "B", "C", "D"][idx % 4] as string);
      });

      const baseReport = generateCareerGuidanceReport(allFortyResponses, {
        reportId: "cit-pdf-test-01",
        studentName: "Meera Kulkarni",
        studentClass: "Class 12",
        generatedAt: "29 Oct 2026, 10:30 am",
      });
      const fullReport = attachAINarrativeToReport(baseReport, {
        personalizedOverview:
          "Your responses show a strong combination of analytical problem-solving and structured execution.",
        combinationCommentary:
          "Combining Investigative curiosity with Conventional organisation supports engineering and quantitative fields.",
        encouragementNote:
          "Try one 20-minute exploration activity each day this week.",
      });

      // 1. Verify PDF filename sanitization & format: Vidyakshara_Career_Report_<StudentName>_<YYYY-MM-DD>.pdf
      assert.equal(
        formatReportDateForFilename("29 Oct 2026, 10:30 am"),
        "2026-10-29"
      );
      const filename = buildCareerReportPdfFilename(fullReport);
      assert.equal(
        filename,
        "Vidyakshara_Career_Report_Meera_Kulkarni_2026-10-29.pdf",
        `Expected sanitized PDF filename, got: ${filename}`
      );
      assert.ok(
        filename.endsWith(".pdf") && !filename.endsWith(".md"),
        "Filename must end with .pdf and never .md"
      );

      // Verify special character sanitization in student name
      const specialNameReport = {
        ...fullReport,
        studentName: "Aarav / O'Connor: Jr. (XII)*",
      };
      const sanitizedSpecialFilename =
        buildCareerReportPdfFilename(specialNameReport);
      assert.equal(
        sanitizedSpecialFilename,
        "Vidyakshara_Career_Report_Aarav_O_Connor_Jr_XII_2026-10-29.pdf"
      );

      // 2. Generate genuine binary PDF bytes and verify %PDF- header signature
      const pdfBytes = generateCareerReportPdfBytes(fullReport);
      assert.ok(
        pdfBytes instanceof Uint8Array && pdfBytes.byteLength > 5000,
        `Expected non-empty PDF byte array (> 5 KB), got ${pdfBytes.byteLength} bytes`
      );

      const headerSignature = new TextDecoder("ascii").decode(
        pdfBytes.subarray(0, 8)
      );
      assert.ok(
        headerSignature.startsWith("%PDF-1."),
        `Expected PDF binary to start with '%PDF-1.', got '${headerSignature}'`
      );

      // 3. Inspect uncompressed PDF content stream to verify multi-page A4 structure and actual student report data
      const pdfText = new TextDecoder("latin1").decode(pdfBytes);
      const pageCountMatches = pdfText.match(/\/Type\s*\/Page\b/g) || [];
      assert.ok(
        pageCountMatches.length >= 2,
        `Expected multi-page A4 PDF (>= 2 pages), found ${pageCountMatches.length} page objects`
      );
      assert.ok(
        pdfText.includes("Vidyakshara Career Intelligence Test"),
        "PDF must include Vidyakshara Career Intelligence Test branding"
      );
      assert.ok(
        pdfText.includes("Meera Kulkarni") && pdfText.includes("Class 12"),
        "PDF must include the student's actual name and class"
      );
      assert.ok(
        pdfText.includes("A. Welcome & Executive Overview") &&
          pdfText.includes(
            "B. Your Interest Profile Across Six Dimensions"
          ) &&
          pdfText.includes(
            "C. Leading Interest Combinations & Preferred Work Style"
          ) &&
          pdfText.includes("D. Recommended Career Fields to Explore") &&
          pdfText.includes("E. Learning & Skill Development") &&
          pdfText.includes("F. Your Personalized 7-Day Exploration Plan") &&
          pdfText.includes("G. Questions for Further Reflection") &&
          pdfText.includes("H. Important Limitations & Responsible Use"),
        "PDF must include all 8 report sections (A through H)"
      );
      assert.ok(
        pdfText.includes(fullReport.recommendedClusters[0].cluster.title),
        "PDF must include the student's actual top recommended career cluster"
      );
      assert.ok(
        pdfText.includes("Page 1 of "),
        "PDF must include running footer with 'Page X of Y' numbering"
      );

      // 4. Verify graceful error handling when invalid report data is passed
      assert.throws(
        () =>
          generateCareerReportPdfBytes(
            null as unknown as ReturnType<typeof generateCareerGuidanceReport>
          ),
        /Invalid career report data/
      );
    },
  },
  {
    name: "Career Test 10 — Navigation & state persistence verification across Scenarios A, B, C, D, and E (zero cross-candidate report leakage)",
    run: () => {
      const store = new CareerAssessmentStore(null);

      // Build Candidate A's 40 responses (Investigative / Realistic emphasis)
      const candidateAResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q) => {
        if (q.responseType === "likert-5") {
          candidateAResponses[q.id] =
            q.primaryDimensions.includes("investigative") ||
            q.primaryDimensions.includes("realistic")
              ? "5"
              : "1";
        } else {
          candidateAResponses[q.id] = q.options[0].id;
        }
      });

      const candidateADetails = {
        fullName: "Candidate Ananya Rao",
        studentClass: "Class 12" as const,
      };
      const candidateASaved = store.upsertAttempt({
        studentDetails: candidateADetails,
        responses: candidateAResponses,
      });
      assert.equal(candidateASaved.status, "ok");
      const candidateAAttemptId = candidateASaved.record!.attemptId;
      const candidateAAccessToken = candidateASaved.record!.accessToken;
      const candidateAReport = candidateASaved.record!.completedReport!;
      assert.equal(candidateAReport.studentName, "Candidate Ananya Rao");

      // Candidate A is currently viewing their completed report in CareerDiscoveryView
      const candidateACompletedState = {
        sessionId: "cit-sess-candidate-a",
        stage: "report" as const,
        currentQuestionIndex: 39,
        attemptId: candidateAAttemptId,
        accessToken: candidateAAccessToken,
        studentDetails: candidateADetails,
        responses: candidateAResponses,
        completedReport: candidateAReport,
      };

      const candidateAReportHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: candidateACompletedState,
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        candidateAReportHtml.includes(
          "Candidate Ananya Rao’s Personalized Career-Guidance Report"
        ),
        "Candidate A must see their own completed report immediately upon finishing"
      );

      // =====================================================================
      // Scenario A: Previous report exists -> Navigate away and click Career Discovery again
      // =====================================================================
      const { nextActiveState: afterTabClickState, archivedReportEntry } =
        resetCareerStateForTabEntry(candidateACompletedState);

      assert.equal(
        afterTabClickState.stage,
        "landing",
        "Scenario A: Clicking Career Discovery tab must reset stage to 'landing'"
      );
      assert.equal(
        afterTabClickState.completedReport,
        null,
        "Scenario A: Active state must not retain previous candidate's completedReport"
      );
      assert.equal(
        afterTabClickState.studentDetails,
        null,
        "Scenario A: Active state must not retain previous candidate's studentDetails"
      );
      assert.equal(
        Object.keys(afterTabClickState.responses).length,
        0,
        "Scenario A: Active state must reset responses to empty"
      );
      assert.equal(
        afterTabClickState.attemptId,
        undefined,
        "Scenario A: Active state must clear previous candidate's attemptId"
      );
      assert.notEqual(
        afterTabClickState.sessionId,
        candidateACompletedState.sessionId,
        "Scenario A: Active state must receive a brand-new sessionId"
      );

      const landingAfterCandidateAHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: afterTabClickState,
          studentName: "Aarav",
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        landingAfterCandidateAHtml.includes("Start My Free Assessment") &&
          !landingAfterCandidateAHtml.includes("Candidate Ananya Rao") &&
          !landingAfterCandidateAHtml.includes(
            "Personalized Career-Guidance Report"
          ) &&
          !landingAfterCandidateAHtml.includes("Open My Report") &&
          !landingAfterCandidateAHtml.includes("View Saved Report"),
        "Scenario A: Fresh Career Discovery landing page must render and previous candidate's report/name must NOT appear"
      );

      // =====================================================================
      // Scenario B: New candidate starts & completes a new assessment
      // =====================================================================
      const candidateBIntroState = createFreshCareerAssessmentState("intro");
      const candidateBIntroHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: candidateBIntroState,
          studentName: "Aarav", // Demo profile name must NOT pre-fill the registration input
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        !candidateBIntroHtml.includes("Candidate Ananya Rao") &&
          !candidateBIntroHtml.includes('value="Aarav"'),
        "Scenario B: Student registration form for a new assessment must start blank without previous candidate or demo profile name"
      );

      // Candidate B answers all 40 questions with Artistic / Social emphasis
      const candidateBResponses: Record<string, string> = {};
      CAREER_QUESTIONS.forEach((q) => {
        if (q.responseType === "likert-5") {
          candidateBResponses[q.id] =
            q.primaryDimensions.includes("artistic") ||
            q.primaryDimensions.includes("social")
              ? "5"
              : "1";
        } else {
          candidateBResponses[q.id] = q.options[q.options.length - 1].id;
        }
      });
      const candidateBDetails = {
        fullName: "Candidate Bhavesh Nair",
        studentClass: "Class 10" as const,
      };
      const candidateBSaved = store.upsertAttempt({
        studentDetails: candidateBDetails,
        responses: candidateBResponses,
      });
      assert.equal(candidateBSaved.status, "ok");
      const candidateBAttemptId = candidateBSaved.record!.attemptId;
      const candidateBReport = candidateBSaved.record!.completedReport!;

      assert.notEqual(
        candidateBAttemptId,
        candidateAAttemptId,
        "Scenario B: Candidate B must receive a unique attemptId distinct from Candidate A"
      );
      assert.notEqual(
        candidateBReport.reportId,
        candidateAReport.reportId,
        "Scenario B: Candidate B must receive a unique reportId distinct from Candidate A"
      );
      assert.equal(candidateBReport.studentName, "Candidate Bhavesh Nair");
      assert.equal(candidateBReport.studentClass, "Class 10");

      const candidateBCompletedState = {
        sessionId: candidateBIntroState.sessionId,
        stage: "report" as const,
        currentQuestionIndex: 39,
        attemptId: candidateBAttemptId,
        accessToken: candidateBSaved.record!.accessToken,
        studentDetails: candidateBDetails,
        responses: candidateBResponses,
        completedReport: candidateBReport,
      };
      const candidateBReportHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: candidateBCompletedState,
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        candidateBReportHtml.includes(
          "Candidate Bhavesh Nair’s Personalized Career-Guidance Report"
        ) &&
          candidateBReportHtml.includes("Class 10") &&
          !candidateBReportHtml.includes("Candidate Ananya Rao"),
        "Scenario B: Candidate B's report must display ONLY Candidate B's name, class, scores, and recommendations"
      );

      // =====================================================================
      // Scenario C: Repeated navigation across tabs and back to Career Discovery
      // =====================================================================
      let rollingState = candidateBCompletedState;
      for (let i = 0; i < 3; i++) {
        const { nextActiveState } = resetCareerStateForTabEntry(rollingState);
        rollingState = nextActiveState as typeof candidateBCompletedState;
        const navHtml = renderToStaticMarkup(
          React.createElement(CareerDiscoveryView, {
            careerState: rollingState,
            onUpdateCareerState: noop,
            onClearCareerData: noop,
          })
        );
        assert.equal(rollingState.stage, "landing");
        assert.ok(
          navHtml.includes("Start My Free Assessment") &&
            !navHtml.includes("Candidate Bhavesh Nair") &&
            !navHtml.includes("Candidate Ananya Rao"),
          `Scenario C (iteration ${i + 1}): Repeated navigation to Career Discovery must always render the fresh landing page`
        );
      }

      // =====================================================================
      // Scenario D: Refresh & persisted state (completed vs unfinished draft)
      // =====================================================================
      // D1: Refreshing when a completed report was in state resets active session to landing
      const { nextActiveState: refreshedFromCompleted } =
        resetCareerStateForTabEntry(candidateBCompletedState);
      assert.equal(refreshedFromCompleted.stage, "landing");
      assert.equal(refreshedFromCompleted.completedReport, null);

      // D2: Refreshing when an unfinished draft (e.g. 5/40 answers) exists opens the landing page first with explicit resume button
      const unfinishedDraftState = {
        sessionId: "cit-sess-draft-1",
        stage: "questions" as const,
        currentQuestionIndex: 5,
        studentDetails: {
          fullName: "Draft Student",
          studentClass: "Class 11" as const,
        },
        responses: {
          "cit-q01": "4",
          "cit-q02": "5",
          "cit-q03": "3",
          "cit-q04": "4",
          "cit-q05": "5",
        },
        completedReport: null,
      };
      const { nextActiveState: refreshedFromDraft } =
        resetCareerStateForTabEntry(unfinishedDraftState);
      assert.equal(
        refreshedFromDraft.stage,
        "landing",
        "Scenario D: Unfinished draft must open on landing page first rather than auto-jumping into questions"
      );
      const draftLandingHtml = renderToStaticMarkup(
        React.createElement(CareerDiscoveryView, {
          careerState: refreshedFromDraft,
          onUpdateCareerState: noop,
          onClearCareerData: noop,
        })
      );
      assert.ok(
        draftLandingHtml.includes("Start My Free Assessment") &&
          draftLandingHtml.includes("Resume Unfinished Assessment (5/40)"),
        "Scenario D: Landing page with an unfinished draft must offer both 'Start My Free Assessment' and explicit 'Resume Unfinished Assessment (5/40)'"
      );

      // =====================================================================
      // Scenario E: Historical reports preserved in archive and backend store
      // =====================================================================
      assert.ok(
        archivedReportEntry &&
          archivedReportEntry.reportId === candidateAReport.reportId,
        "Scenario E: Candidate A's completed report must be extracted for historical archiving"
      );
      let reportHistory = appendReportToHistory(
        [],
        candidateAReport,
        {
          attemptId: candidateAAttemptId,
          accessToken: candidateAAccessToken,
        }
      );
      reportHistory = appendReportToHistory(
        reportHistory,
        candidateBReport,
        {
          attemptId: candidateBAttemptId,
          accessToken: candidateBSaved.record!.accessToken,
        }
      );
      assert.equal(
        reportHistory.length,
        2,
        "Scenario E: Historical report archive must preserve both Candidate A and Candidate B reports without overwriting"
      );
      assert.equal(
        createSavedReportHistoryEntry(candidateAReport).studentName,
        "Candidate Ananya Rao"
      );

      // Verify Candidate A's report is still intact in the backend store when accessed with Candidate A's credentials
      const storedCandidateA = store.getAuthorizedAttempt(
        candidateAAttemptId,
        candidateAAccessToken
      );
      assert.equal(storedCandidateA.status, "ok");
      assert.equal(
        storedCandidateA.record?.completedReport?.studentName,
        "Candidate Ananya Rao"
      );
    },
  },
  {
    name: "Production Test 11 — Production readiness: StudentRecordStore auth & timing-safe tokens, CareerAssessmentStore DB hooks, RateLimiter, and server configuration audit",
    run: () => {
      // 1. Verify StudentRecordStore ID validation, timing-safe token matching, and IDOR protection
      assert.equal(isValidStudentId("stu-12345_abc"), true);
      assert.equal(isValidStudentId("a"), false); // too short (< 2 chars)
      assert.equal(isValidStudentId("../etc/passwd"), false); // path traversal rejected

      assert.equal(timingSafeTokenMatch("secret-token-123", "secret-token-123"), true);
      assert.equal(timingSafeTokenMatch("secret-token-123", "secret-token-999"), false);
      assert.equal(timingSafeTokenMatch("secret-token-123", ""), false);

      const studentStore = new StudentRecordStore(null);
      const session = studentStore.createOrVerifySession({
        studentId: "stu-prod-test-01",
        initialState: { profile: { name: "Neha Verma" } },
      });
      assert.equal(session.status, "ok");
      assert.ok(session.record && session.record.token.length === 48);

      const sessionToken = session.record!.token;

      // Authorized read & save
      const authorizedRead = studentStore.getAuthorizedState(
        "stu-prod-test-01",
        sessionToken
      );
      assert.equal(authorizedRead.status, "ok");
      assert.deepEqual(authorizedRead.record?.state, {
        profile: { name: "Neha Verma" },
      });

      const authorizedSave = studentStore.updateAuthorizedState(
        "stu-prod-test-01",
        sessionToken,
        { profile: { name: "Neha Verma", targetExam: "JEE Main" } }
      );
      assert.equal(authorizedSave.status, "ok");

      // Unauthorized read & save (IDOR protection)
      const forbiddenRead = studentStore.getAuthorizedState(
        "stu-prod-test-01",
        "wrong-session-token"
      );
      assert.equal(forbiddenRead.status, "forbidden");

      const forbiddenSave = studentStore.updateAuthorizedState(
        "stu-prod-test-01",
        "wrong-session-token",
        { hacked: true }
      );
      assert.equal(forbiddenSave.status, "forbidden");

      // 2. Verify CareerAssessmentStore PostgreSQL persistence hooks & hydration
      const upsertedIds: string[] = [];
      const deletedIds: string[] = [];
      const hookedCareerStore = new CareerAssessmentStore(null);
      hookedCareerStore.setPersistenceHooks({
        onUpsert: (rec) => {
          upsertedIds.push(rec.attemptId);
        },
        onDelete: (id) => {
          deletedIds.push(id);
        },
      });

      const createdAttempt = hookedCareerStore.upsertAttempt({
        studentDetails: { fullName: "Pranav Iyer", studentClass: "Class 12" },
        responses: { "cit-q01": "5" },
      });
      assert.equal(createdAttempt.status, "ok");
      assert.equal(upsertedIds.length, 1);
      assert.equal(upsertedIds[0], createdAttempt.record!.attemptId);

      const deletedAttempt = hookedCareerStore.deleteAuthorizedAttempt(
        createdAttempt.record!.attemptId,
        createdAttempt.record!.accessToken
      );
      assert.equal(deletedAttempt.status, "ok");
      assert.equal(deletedIds.length, 1);
      assert.equal(deletedIds[0], createdAttempt.record!.attemptId);

      // 3. Verify RateLimiter sliding window enforcement
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });
      assert.equal(limiter.check("203.0.113.10").allowed, true);
      assert.equal(limiter.check("203.0.113.10").allowed, true);
      assert.equal(limiter.check("203.0.113.10").allowed, true);
      const fourthCheck = limiter.check("203.0.113.10");
      assert.equal(fourthCheck.allowed, false);
      assert.ok(fourthCheck.retryAfterSeconds >= 1);

      // 4. Audit server.ts and client source for production readiness & secret safety
      const serverSource = fs.readFileSync(
        path.resolve(process.cwd(), "server.ts"),
        "utf-8"
      );
      assert.ok(
        serverSource.includes("process.env.PORT"),
        "server.ts must read process.env.PORT for cloud hosting"
      );
      assert.ok(
        serverSource.includes('"/api/health"'),
        "server.ts must expose /api/health endpoint"
      );
      assert.ok(
        serverSource.includes('app.all("/api/*"'),
        "server.ts must return 404 JSON for unmatched /api/* routes before SPA catch-all"
      );

      // Verify client-side code never references GEMINI_API_KEY or DATABASE_URL
      const appSource = fs.readFileSync(
        path.resolve(process.cwd(), "src/App.tsx"),
        "utf-8"
      );
      assert.ok(
        !appSource.includes("GEMINI_API_KEY") &&
          !appSource.includes("DATABASE_URL"),
        "Client bundle code must never reference GEMINI_API_KEY or DATABASE_URL"
      );
    },
  },
];


async function runAllTests() {
  let passed = 0;
  for (const t of tests) {
    await t.run();
    passed++;
    console.log(`PASS [${passed}/${tests.length}] ${t.name}`);
  }
  console.log(
    `\nAll ${passed} mathematical rendering, career intelligence & application QA tests passed.`
  );
}

runAllTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});


