import assert from "node:assert/strict";
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
  QuestionWorkedSolution,
} from "../../components/ui/MathAndDiagrams";
import { createDemoStudentState, QUESTIONS, TOPICS } from "../../data/curriculum";

interface TestCase {
  name: string;
  run: () => void;
}

const tests: TestCase[] = [
  {
    name: "1. Content contract prompt enforces Markdown prose, $...$/$$...$$ delimiters, aligned derivations, SI units, and = vs \\approx",
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
    name: "2. JSON parser recovers single-escaped LaTeX commands (\\frac, \\theta, \\tau, \\beta, \\right, \\neq, \\sqrt) and strips ```json fences",
    run: () => {
      // Simulate raw LLM output wrapped in ```json fences with single-escaped \frac, \theta, \beta, \right, \neq, \sqrt
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
      assert.ok(
        structured.mainIdea.includes("u\\cos\\theta"),
        `Expected \\theta to be preserved, got: ${structured.mainIdea}`
      );
      assert.ok(
        structured.steps?.[0]?.explanation.includes("\\frac{\\pi}{4}"),
        `Expected \\frac to be preserved, got: ${structured.steps?.[0]?.explanation}`
      );
      assert.ok(
        structured.steps?.[0]?.explanation.includes("\\beta"),
        `Expected \\beta to be preserved, got: ${structured.steps?.[0]?.explanation}`
      );
      assert.ok(
        structured.steps?.[0]?.formula?.includes("\\begin{aligned}"),
        `Expected aligned derivation to be preserved, got: ${structured.steps?.[0]?.formula}`
      );
      assert.ok(
        structured.formulaExpression?.includes("\\right)"),
        `Expected \\right) to be preserved, got: ${structured.formulaExpression}`
      );
    },
  },
  {
    name: "3. Control-character recovery repairs already-corrupted \\x0crac (\\frac), \\x09heta (\\theta), \\x08eta (\\beta), \\x0dight (\\right)",
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
    name: "4. Double-escaped LaTeX is repaired while preserving \\\\ row breaks inside \\begin{aligned}",
    run: () => {
      const doubleEscaped =
        "$$\\begin{aligned}\n\\\\Delta G &= \\\\Delta H - T\\\\Delta S \\\\\n&= -92.4\\\\text{ kJ mol}^{-1}\n\\end{aligned}$$";
      const repaired = repairDoubleEscapedLatex(doubleEscaped);
      assert.ok(repaired.includes("\\Delta G &= \\Delta H - T\\Delta S \\\\"));
      assert.ok(repaired.includes("-92.4\\text{ kJ mol}^{-1}"));

      const validation = validateLatexExpression(repaired, true);
      assert.equal(
        validation.isValid,
        true,
        `Expected repaired aligned block to be valid KaTeX, error: ${validation.errorMessage}`
      );
    },
  },
  {
    name: "5. Currency dollar signs ($25 and $40) are disambiguated from mathematical expressions ($x = 25$)",
    run: () => {
      const currencyProse =
        "A workbook costs $25 and a laboratory kit costs $40, whereas the velocity is $v = 25\\text{ m s}^{-1}$.";
      const normalized = normalizeMathContent(currencyProse);

      // The currency amounts $25 and $40 should be escaped as \$25 and \$40 so prose between them is NOT treated as math
      assert.ok(
        normalized.includes("\\$25 and a laboratory kit costs \\$40"),
        `Expected currency dollars to be escaped, got: ${normalized}`
      );
      // The real math expression $v = 25\text{ m s}^{-1}$ must remain unescaped math
      assert.ok(
        normalized.includes("$v = 25\\text{ m s}^{-1}$"),
        `Expected math expression to remain intact, got: ${normalized}`
      );

      // Also test a single unmatched currency sign in a sentence with math
      const singleCurrency =
        "The registration fee is $50 for the scholarship test where $x^2 + y^2 = 25$.";
      const normSingle = disambiguateCurrencyDollars(singleCurrency);
      assert.ok(normSingle.includes("\\$50"));
      assert.ok(normSingle.includes("$x^2 + y^2 = 25$"));
    },
  },
  {
    name: "6. Standalone \\begin{align*} and ```latex code fences convert cleanly to $$\\begin{aligned}...\\end{aligned}$$",
    run: () => {
      const fencedAndAlign = [
        "Here is the integration by King's Property:",
        "```latex",
        "\\begin{align*}",
        "2I &= \\int_{0}^{\\pi/2} 1\\,dx \\\\",
        "I &= \\frac{\\pi}{4} \\approx 0.7854",
        "\\end{align*}",
        "```",
        "And a piecewise potential:",
        "\\begin{cases}",
        "V(r) = \\frac{kQ}{R} & r \\le R \\\\",
        "V(r) = \\frac{kQ}{r} & r > R",
        "\\end{cases}",
      ].join("\n");

      const normalized = normalizeMathContent(fencedAndAlign);
      assert.ok(!normalized.includes("```latex"), "Expected ```latex fence to be unwrapped");
      assert.ok(
        normalized.includes("\\begin{aligned}"),
        "Expected align* to be normalized to aligned"
      );
      assert.ok(
        normalized.includes("$$\n\\begin{cases}"),
        "Expected standalone cases environment to be wrapped in $$...$$"
      );

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: normalized })
      );
      assert.ok(html.includes("katex-display"), "Expected KaTeX display rendering");
    },
  },
  {
    name: "7. Legacy undelimited LaTeX is wrapped in $...$ without corrupting normal prose or code blocks",
    run: () => {
      const legacyNote =
        "By Gauss's Law, the net electric flux is \\Phi_{\\text{net}} = \\frac{q_{\\text{enc}}}{\\varepsilon_0} for any closed surface.";
      const normalized = normalizeMathContent(legacyNote);
      assert.ok(
        normalized.includes("$\\Phi_{\\text{net}} = \\frac{q_{\\text{enc}}}{\\varepsilon_0}$"),
        `Expected legacy undelimited formula to be wrapped in $...$, got: ${normalized}`
      );

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: normalized })
      );
      assert.ok(html.includes("katex"), "Expected KaTeX output for migrated legacy note");
    },
  },
  {
    name: "8. Invalid LaTeX notation triggers graceful fallback and preserves exact original raw notation without inventing formulas",
    run: () => {
      const brokenFormula = "\\frac{u^2 \\sin 2\\theta}{";
      const validation = validateLatexExpression(brokenFormula, true);
      assert.equal(validation.isValid, false, "Expected unclosed \\frac to be marked invalid");
      assert.equal(
        validation.raw,
        brokenFormula,
        "Expected exact original raw expression to be preserved"
      );

      // Render via MathRenderer and verify fallback markup preserves exact raw formula
      const fallbackHtml = renderToStaticMarkup(
        React.createElement(MathRenderer, {
          expression: brokenFormula,
          block: true,
        })
      );
      assert.ok(
        fallbackHtml.includes("Readable Formula Fallback (Original Notation Preserved)"),
        "Expected fallback notice in rendered HTML"
      );
      assert.ok(
        fallbackHtml.includes("\\frac{u^2 \\sin 2\\theta}{"),
        "Expected exact raw broken formula in fallback output"
      );

      // Also test mixed Markdown containing one valid equation and one invalid equation
      const mixedMarkdown =
        "Valid inline $E = mc^2$ and invalid inline $\\sqrt{2gh + $ in the same sentence.";
      const guarded = guardInvalidMathInMarkdown(mixedMarkdown);
      assert.equal(guarded.invalidEntries.length, 1);
      assert.equal(guarded.invalidEntries[0].raw, "\\sqrt{2gh +");

      const mixedHtml = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: mixedMarkdown })
      );
      assert.ok(mixedHtml.includes("katex"), "Expected valid equation to still render with KaTeX");
      assert.ok(
        mixedHtml.includes("data-math-fallback=\"inline\""),
        "Expected invalid inline equation to render inline fallback"
      );
      assert.ok(
        mixedHtml.includes("\\sqrt{2gh +"),
        "Expected original raw invalid expression to be preserved in HTML"
      );
    },
  },
  {
    name: "9. Existing student state, conversation history, and curriculum formulas/questions all validate cleanly",
    run: () => {
      const demoState = createDemoStudentState();
      const migrated = migrateLegacyStudentStateMath(demoState);
      assert.equal(
        migrated.doubtHistory.length,
        demoState.doubtHistory.length,
        "Expected all conversation history messages to be preserved"
      );
      assert.equal(
        migrated.notes.length,
        demoState.notes.length,
        "Expected all saved student notes to be preserved"
      );

      // Verify every curriculum topic formula and worked example formula renders without fallback errors
      for (const topic of TOPICS) {
        for (const def of topic.definitionsAndFormulas) {
          if (def.formula) {
            const html = renderToStaticMarkup(
              React.createElement(MathRenderer, {
                expression: def.formula,
                block: true,
              })
            );
            assert.ok(
              !html.includes("data-math-fallback"),
              `Curriculum topic "${topic.id}" formula "${def.formula}" triggered fallback unexpectedly`
            );
          }
        }
        for (const ex of topic.workedExamples) {
          for (const st of ex.steps) {
            if (st.formula) {
              const html = renderToStaticMarkup(
                React.createElement(MathRenderer, {
                  expression: st.formula,
                  block: true,
                })
              );
              assert.ok(
                !html.includes("data-math-fallback"),
                `Worked example "${ex.id}" step formula "${st.formula}" triggered fallback unexpectedly`
              );
            }
          }
        }
      }

      // Verify every question stem, options, and worked solution renders cleanly
      for (const q of QUESTIONS) {
        const stemHtml = renderToStaticMarkup(
          React.createElement(MarkdownContent, { content: q.questionText })
        );
        assert.ok(
          !stemHtml.includes("data-math-fallback"),
          `Question "${q.id}" stem triggered fallback unexpectedly`
        );

        if (q.formulaContext) {
          const formulaHtml = renderToStaticMarkup(
            React.createElement(MathRenderer, { expression: q.formulaContext, block: true })
          );
          assert.ok(
            !formulaHtml.includes("data-math-fallback"),
            `Question "${q.id}" formulaContext triggered fallback unexpectedly`
          );
        }

        if (q.options) {
          for (const opt of q.options) {
            const optHtml = renderToStaticMarkup(
              React.createElement(MarkdownContent, { content: opt.text })
            );
            assert.ok(
              !optHtml.includes("data-math-fallback"),
              `Question "${q.id}" option "${opt.id}" triggered fallback unexpectedly`
            );
          }
        }

        const solutionHtml = renderToStaticMarkup(
          React.createElement(QuestionWorkedSolution, { question: q })
        );
        assert.ok(
          !solutionHtml.includes("data-math-fallback"),
          `Question "${q.id}" QuestionWorkedSolution triggered fallback unexpectedly`
        );
        assert.ok(
          solutionHtml.includes("Final Answer"),
          `Question "${q.id}" QuestionWorkedSolution should render Final Answer section`
        );
      }

      // Verify formatStructuredTutorMarkdown produces valid Markdown + LaTeX
      const tutorMsgWithStructured = migrated.doubtHistory.find(
        (m) => m.role === "tutor" && m.structured
      );
      assert.ok(tutorMsgWithStructured?.structured);
      const md = formatStructuredTutorMarkdown(tutorMsgWithStructured.structured);
      const mdHtml = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: md })
      );
      assert.ok(mdHtml.includes("katex"));
      assert.ok(!mdHtml.includes("data-math-fallback"));
    },
  },
  {
    name: "10. normalizeFormulaField strips redundant outer fences/delimiters while preserving internal LaTeX",
    run: () => {
      const f1 = normalizeFormulaField("```latex\n$$\\Phi = \\frac{q}{\\varepsilon_0}$$\n```");
      assert.equal(f1, "\\Phi = \\frac{q}{\\varepsilon_0}");

      const f2 = normalizeFormulaField("\\[ E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log Q \\]");
      assert.equal(f2, "E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log Q");
    },
  },
  {
    name: "11. JEE Mathematics notation: matrices, determinants, vectors, limits, derivatives, definite integrals, probability, and series",
    run: () => {
      const mathMarkdown = [
        "Given matrix $A = \\begin{pmatrix} \\alpha + \\beta & 2 \\\\ 3 & \\alpha\\beta \\end{pmatrix}$ and determinant $\\det(A) = \\begin{vmatrix} 6 & 2 \\\\ 3 & 4 \\end{vmatrix} = 18$, evaluate:",
        "$$\\begin{aligned}",
        "L &= \\lim_{x \\to 0} \\frac{\\sin x - x}{x^3} = -\\frac{1}{6} \\\\",
        "I &= \\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}}\\,dx = \\frac{\\pi}{4} \\\\",
        "P(X = r) &= \\binom{n}{r} p^r (1-p)^{n-r}, \\quad S_n = \\sum_{k=1}^{n} k^2 = \\frac{n(n+1)(2n+1)}{6}",
        "\\end{aligned}$$",
      ].join("\n");

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: mathMarkdown })
      );
      assert.ok(html.includes("katex-display"), "Expected display math for aligned JEE Math equations");
      assert.ok(!html.includes("data-math-fallback"), "Expected zero math fallbacks for JEE Math notation");
    },
  },
  {
    name: "12. JEE Physics notation: vectors vs. scalars, upright SI units, Greek letters, subscripts/superscripts, and multi-step calculations",
    run: () => {
      const physicsMarkdown = [
        "For an electric field $\\vec{E} = E_0\\hat{i} + 2E_0\\hat{j}\\text{ N C}^{-1}$ through area vector $d\\vec{A} = A\\hat{i}\\text{ m}^2$, the scalar flux is:",
        "$$\\begin{aligned}",
        "\\Phi_E &= \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enc}}}{\\varepsilon_0} \\\\",
        "&= \\frac{8.854 \\times 10^{-6}\\text{ C}}{8.854 \\times 10^{-12}\\text{ C}^2\\text{ N}^{-1}\\text{ m}^{-2}} = 1.0 \\times 10^{6}\\text{ N m}^2\\text{ C}^{-1}",
        "\\end{aligned}$$",
      ].join("\n");

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: physicsMarkdown })
      );
      assert.ok(html.includes("katex-display"), "Expected display math for Physics derivation");
      assert.ok(!html.includes("data-math-fallback"), "Expected zero math fallbacks for Physics notation");
    },
  },
  {
    name: "13. JEE/NEET Chemistry notation via KaTeX mhchem (\\ce{...} and \\pu{...}): chemical formulas, ionic charges, reversible reactions, and reaction conditions",
    run: () => {
      const chemistryMarkdown = [
        "Consider the catalytic oxidation $\\ce{2SO2(g) + O2(g) <=>[$\\text{V}_2\\text{O}_5$, 720 K][2 bar] 2SO3(g)}$ with $\\Delta_{\\text{r}}H^\\circ = \\pu{-198 kJ mol^-1}$ and the redox reaction:",
        "$$\\ce{Cr2O7^{2-}(aq) + 14H^+(aq) + 6Fe^{2+}(aq) -> 2Cr^{3+}(aq) + 6Fe^{3+}(aq) + 7H2O(l)}$$",
        "For the galvanic cell $\\ce{A(s) + B^{2+}(aq) <=> A^{2+}(aq) + B(s)}$, the reaction quotient is $Q = \\frac{[\\ce{A^{2+}}]}{[\\ce{B^{2+}}]}$.",
      ].join("\n");

      const validation = validateLatexExpression(
        "\\ce{2SO2(g) + O2(g) <=>[\\text{V}_2\\text{O}_5] 2SO3(g)}",
        true
      );
      assert.equal(
        validation.isValid,
        true,
        `Expected mhchem \\ce{...} expression to validate cleanly, error: ${validation.errorMessage}`
      );

      const html = renderToStaticMarkup(
        React.createElement(MarkdownContent, { content: chemistryMarkdown })
      );
      assert.ok(html.includes("katex"), "Expected KaTeX output for mhchem expressions");
      assert.ok(!html.includes("data-math-fallback"), "Expected zero math fallbacks for mhchem Chemistry notation");
    },
  },
];

let passed = 0;
for (const t of tests) {
  t.run();
  passed++;
  console.log(`PASS [${passed}/${tests.length}] ${t.name}`);
}
console.log(`\nAll ${passed} mathematical content pipeline tests passed.`);
