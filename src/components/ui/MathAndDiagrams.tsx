import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import { Question, QuestionDiagramType, WorkedExample } from "../../types/domain";
import {
  guardInvalidMathInMarkdown,
  normalizeMathContent,
  renderLatexToString,
  validateLatexExpression,
} from "../../utils/mathContentContract";
import { MetaLine } from "./Primitives";

/**
 * Normalizes mathematical delimiters and legacy expressions using the shared
 * Vidyakshara Mathematical Content Contract without silently mutating invalid syntax.
 */
export function normalizeMathDelimiters(
  raw: string,
  expandDisplayBlocks = true
): string {
  if (!raw || typeof raw !== "string") return "";

  const upgraded = raw.replace(
    /∫\[([^\]]+?)\s+to\s+([^\]]+?)\]/g,
    (_m, lower, upper) => `$\\int_{${lower}}^{${upper}}$`
  );

  return normalizeMathContent(upgraded, { expandDisplayBlocks });
}

export interface InvalidMathFallbackProps {
  raw: string;
  displayMode?: boolean;
  errorMessage?: string;
}

/**
 * Graceful fallback displayed when a LaTeX expression has invalid syntax.
 * Never silently invents or alters a formula — retains the exact original notation
 * for readability and debugging.
 */
export function InvalidMathFallback({
  raw,
  displayMode = false,
  errorMessage,
}: InvalidMathFallbackProps) {
  if (!displayMode) {
    return (
      <span
        className="inline-flex items-baseline gap-1.5 px-1.5 py-0.5 rounded bg-[#FDF6E7] border border-[#F2D08B] text-[#8F4B00] text-xs font-mono"
        title={
          errorMessage
            ? `Unparsed formula syntax (${errorMessage}) — original notation preserved`
            : "Original formula notation preserved"
        }
        data-math-fallback="inline"
        data-raw-latex={raw}
      >
        <span>{raw}</span>
      </span>
    );
  }

  return (
    <div
      className="my-2 px-3.5 py-2.5 rounded-lg bg-[#FDF6E7] border border-[#F2D08B] text-xs text-[#14241B] space-y-1"
      role="note"
      aria-label="Formula fallback with original notation preserved"
      data-math-fallback="display"
      data-raw-latex={raw}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8F4B00] font-semibold">
        <span>Readable Formula Fallback (Original Notation Preserved)</span>
        {errorMessage && (
          <span className="font-normal text-[#6E7B72]">{errorMessage}</span>
        )}
      </div>
      <pre className="font-mono text-xs text-[#14241B] whitespace-pre-wrap break-words bg-white/80 px-2.5 py-1.5 rounded border border-[#E2E5DC] overflow-x-auto">
        <code>{raw}</code>
      </pre>
    </div>
  );
}

/**
 * Converts a standalone formula string (that may not yet have $...$ delimiters)
 * into a properly delimited LaTeX string for KaTeX rendering.
 */
function ensureMathDelimited(expression: string, isDisplay: boolean): string {
  const trimmed = (expression || "").trim();
  if (!trimmed) return "";

  const normalized = normalizeMathDelimiters(trimmed, isDisplay);

  // If the string already contains $...$ or $$...$$ delimiters, preserve as-is
  // so mixed prose + math (e.g., "Relation: $E = mc^2$") is never double-wrapped.
  if (normalized.includes("$")) {
    return normalized;
  }

  // If the string looks like a pure prose sentence with no LaTeX commands or math operators,
  // return it directly so normal English prose isn't italicized as math variables.
  const hasLatexCommand = /\\[a-zA-Z]+/.test(normalized);
  const hasMathOperators = /[=^_{}±×÷⋅·⇌→←↔≥≤≠≈∝∞∫∮∑∏√∆ΔΦθλμπσωαβγϵε]/.test(
    normalized
  );
  const wordCount = normalized.split(/\s+/).length;
  const looksLikePlainSentence =
    !hasLatexCommand && !hasMathOperators && wordCount > 5;

  if (looksLikePlainSentence) {
    return normalized;
  }

  // Convert common Unicode symbols in legacy pure-formula strings to crisp LaTeX
  let latexExpr = normalized;
  if (!hasLatexCommand) {
    latexExpr = latexExpr
      .replace(/Φ_([a-zA-Z0-9]+)/g, "\\Phi_{\\text{$1}}")
      .replace(/q_([a-zA-Z0-9]+)/g, "q_{\\text{$1}}")
      .replace(/E°_([a-zA-Z0-9]+)/g, "E^\\circ_{\\text{$1}}")
      .replace(/E_([a-zA-Z0-9]+)/g, "E_{\\text{$1}}")
      .replace(/H_max/g, "H_{\\max}")
      .replace(/v_top/g, "v_{\\text{top}}")
      .replace(/v_x/g, "v_x")
      .replace(/v_y/g, "v_y")
      .replace(/ε_0|ε₀/g, "\\varepsilon_0")
      .replace(/∮/g, "\\oint ")
      .replace(/∫/g, "\\int ")
      .replace(/√\(([^)]+)\)/g, "\\sqrt{$1}")
      .replace(/±/g, "\\pm ")
      .replace(/×/g, "\\times ")
      .replace(/·/g, "\\cdot ")
      .replace(/⇌/g, "\\rightleftharpoons ")
      .replace(/→/g, "\\rightarrow ")
      .replace(/≥/g, "\\ge ")
      .replace(/≤/g, "\\le ")
      .replace(/≠/g, "\\ne ")
      .replace(/≈/g, "\\approx ")
      .replace(/Δ/g, "\\Delta ")
      .replace(/θ/g, "\\theta ")
      .replace(/π/g, "\\pi ")
      .replace(/λ/g, "\\lambda ")
      .replace(/μ/g, "\\mu ");
  }

  return isDisplay ? `\n\n$$\n${latexExpr}\n$$\n\n` : `$${latexExpr}$`;
}

const KATEX_RENDER_OPTIONS = {
  throwOnError: false,
  strict: "ignore" as const,
  output: "htmlAndMathml" as const,
  trust: false,
};

export interface MarkdownContentProps {
  content: string;
  inline?: boolean;
  serif?: boolean;
  className?: string;
}

/**
 * Renders rich educational Markdown (paragraphs, lists, tables, derivations)
 * with embedded inline ($...$) and display ($$...$$) KaTeX mathematics.
 *
 * Security: Raw HTML parsing (rehype-raw) is intentionally NOT enabled,
 * so untrusted Markdown or AI output can never inject executable scripts or HTML.
 *
 * Resilience: Any invalid LaTeX expression is intercepted by guardInvalidMathInMarkdown
 * and rendered via InvalidMathFallback with the exact original notation preserved.
 */
export function MarkdownContent({
  content,
  inline = false,
  serif = false,
  className = "",
}: MarkdownContentProps) {
  if (!content) return null;

  const prepared = normalizeMathDelimiters(content, !inline);
  const { safeMarkdown, invalidEntries } = guardInvalidMathInMarkdown(prepared);
  const fontClass = serif ? "font-serif" : "";

  const customComponents = {
    ...(inline ? { p: ({ children }: { children?: React.ReactNode }) => <>{children}</> } : {}),
    pre: ({
      node,
      children,
    }: {
      node?: {
        children?: Array<{
          type?: string;
          tagName?: string;
          properties?: { className?: unknown };
        }>;
      };
      children?: React.ReactNode;
    }) => {
      const firstChild = node?.children?.[0];
      const childClasses = Array.isArray(firstChild?.properties?.className)
        ? firstChild.properties.className
        : [];
      if (
        firstChild?.type === "element" &&
        firstChild.tagName === "code" &&
        childClasses.includes("language-math")
      ) {
        return <>{children}</>;
      }
      return <pre>{children}</pre>;
    },
    code: ({
      children,
      className: codeClassName,
    }: {
      children?: React.ReactNode;
      className?: string;
    }) => {
      const rawText = String(children ?? "");
      const textValue = rawText.trim();
      const match = textValue.match(/^@@VIDYA_INVALID_MATH_(\d+)@@$/);
      if (match) {
        const entry = invalidEntries[Number(match[1])];
        if (entry) {
          return (
            <InvalidMathFallback
              raw={entry.raw}
              displayMode={!inline && entry.displayMode}
              errorMessage={entry.errorMessage}
            />
          );
        }
      }

      if (codeClassName && codeClassName.includes("language-math")) {
        const isDisplayMath =
          !inline && codeClassName.includes("math-display");
        const latexSource = rawText.replace(/\n$/, "");
        const check = validateLatexExpression(latexSource, isDisplayMath);
        if (!check.isValid) {
          return (
            <InvalidMathFallback
              raw={latexSource}
              displayMode={isDisplayMath}
              errorMessage={check.errorMessage}
            />
          );
        }

        const renderedHtml = renderLatexToString(latexSource, {
          ...KATEX_RENDER_OPTIONS,
          displayMode: isDisplayMath,
        });

        return (
          <span
            className={isDisplayMath ? "vidya-katex-block block" : "vidya-katex-inline"}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        );
      }

      return <code className={codeClassName}>{children}</code>;
    },
  };

  if (inline) {
    return (
      <span className={`vidya-markdown-inline ${fontClass} ${className}`.trim()}>
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          components={customComponents}
        >
          {safeMarkdown}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div className={`vidya-markdown ${fontClass} ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        components={customComponents}
      >
        {safeMarkdown}
      </ReactMarkdown>
    </div>
  );
}

export interface MathRendererProps {
  expression: string;
  block?: boolean;
  display?: boolean;
  /**
   * "highlight" (default for block): subtle warm-ivory textbook formula surface.
   * "plain": unboxed display equation with generous vertical spacing (ideal inside derivations & tables).
   * "result": forest-tinted textbook conclusion block for final answers.
   */
  variant?: "plain" | "highlight" | "result";
  label?: string;
  className?: string;
}

/**
 * Reusable mathematical expression & mixed-math renderer powered by KaTeX.
 * Supports both pure LaTeX formulas and prose strings containing $...$ or $$...$$.
 * Shows a graceful fallback retaining the exact original raw notation if syntax is invalid.
 */
export function MathRenderer({
  expression,
  block = false,
  display = false,
  variant = "highlight",
  label,
  className = "",
}: MathRendererProps) {
  if (!expression) return null;

  const isDisplay = block || display;
  const trimmed = expression.trim();

  // Check if the expression is a single formula (rather than multi-segment prose)
  const dollarMatches = trimmed.match(/(?<![\\$])\$(?!\$)/g) || [];
  const hasLatexOrMathOps =
    /\\[a-zA-Z]+/.test(trimmed) ||
    /[=^_{}±×÷⋅·⇌→←↔≥≤≠≈∝∞∫∮∑∏√∆ΔΦθλμπσωαβγϵε]/.test(trimmed);
  const isSingleFormulaCandidate =
    hasLatexOrMathOps &&
    (!trimmed.includes("$") ||
      (trimmed.startsWith("$$") &&
        trimmed.endsWith("$$") &&
        trimmed.slice(2, -2).indexOf("$$") === -1) ||
      (trimmed.startsWith("$") &&
        trimmed.endsWith("$") &&
        dollarMatches.length === 2) ||
      dollarMatches.length % 2 === 1);

  if (isSingleFormulaCandidate) {
    const check = validateLatexExpression(trimmed, isDisplay);
    if (!check.isValid) {
      return (
        <InvalidMathFallback
          raw={expression}
          displayMode={isDisplay}
          errorMessage={check.errorMessage}
        />
      );
    }
  }

  const prepared = ensureMathDelimited(expression, isDisplay);

  if (isDisplay) {
    if (variant === "plain") {
      return (
        <div
          className={`vidya-math-surface py-1.5 px-1 text-sm text-[#14241B] overflow-x-auto max-w-full ${className}`.trim()}
        >
          {label && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E7B72] mb-1">
              {label}
            </div>
          )}
          <MarkdownContent content={prepared} />
        </div>
      );
    }

    if (variant === "result") {
      return (
        <div
          className={`vidya-math-surface px-4 py-2.5 rounded-lg bg-[#EAF2EC]/85 border border-[#164A31]/30 text-sm text-[#14241B] overflow-x-auto max-w-full ${className}`.trim()}
        >
          {label && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#164A31] mb-1">
              {label}
            </div>
          )}
          <MarkdownContent content={prepared} />
        </div>
      );
    }

    return (
      <div
        className={`vidya-math-surface px-4 py-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-sm text-[#14241B] overflow-x-auto max-w-full ${className}`.trim()}
      >
        {label && (
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#164A31] mb-1">
            {label}
          </div>
        )}
        <MarkdownContent content={prepared} />
      </div>
    );
  }

  return <MarkdownContent content={prepared} inline className={className} />;
}

/**
 * Alias for backward compatibility across existing views.
 */
export const MathFormula = MathRenderer;

export interface WorkedSolutionProps {
  example: WorkedExample;
}

/**
 * Digital-textbook Worked Solution component for step-by-step JEE/NEET derivations.
 * Uses a single clean frame with hairline horizontal rules rather than nesting cards within cards.
 */
export function WorkedSolution({ example }: WorkedSolutionProps) {
  return (
    <article className="rounded-xl border border-[#E2E5DC] bg-white overflow-hidden divide-y divide-[#E2E5DC]">
      {/* Textbook Example Header */}
      <div className="px-5 py-3.5 bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <MetaLine items={["Worked Example", example.examTag]} />
          <h3 className="text-base sm:text-lg font-semibold text-[#14241B]">
            {example.title}
          </h3>
        </div>
      </div>

      {/* Problem Statement & Given Variables */}
      <div className="px-5 py-4 space-y-3 bg-white">
        <div className="text-[15px] sm:text-base text-[#14241B] font-serif leading-relaxed">
          <MarkdownContent content={example.problemStatement} serif />
        </div>

        {example.givenData && example.givenData.length > 0 && (
          <div className="pt-2.5 border-t border-[#E2E5DC]/80 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-xs text-[#48564D]">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#164A31] shrink-0">
              Given &amp; Variables:
            </span>
            {example.givenData.map((datum, dIdx) => (
              <React.Fragment key={dIdx}>
                {dIdx > 0 && (
                  <span className="text-[#6E7B72]" aria-hidden="true">
                    ·
                  </span>
                )}
                <span className="text-[#14241B]">
                  <MarkdownContent content={datum} inline />
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Numbered Derivation Steps (Hairline-separated, unboxed equations) */}
      <div className="px-5 py-4 bg-white space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E7B72]">
          Step-by-Step Solution &amp; Substitution
        </div>
        <ol className="divide-y divide-[#E2E5DC]/75">
          {example.steps.map((st, sIdx) => (
            <li
              key={sIdx}
              className="py-3.5 first:pt-1.5 last:pb-1 space-y-1.5"
            >
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#164A31] shrink-0">
                  Step {sIdx + 1}.
                </span>
                <div className="text-xs sm:text-sm font-semibold text-[#14241B]">
                  <MarkdownContent content={st.stepTitle} inline />
                </div>
              </div>
              <div className="text-xs sm:text-sm text-[#48564D] leading-relaxed pl-0 sm:pl-14">
                <MarkdownContent content={st.detail} />
              </div>
              {st.formula && (
                <div className="pl-0 sm:pl-14 pt-0.5">
                  <MathRenderer
                    expression={st.formula}
                    block
                    variant="plain"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Visually Distinguished Final Answer & Common Mistake Callout */}
      <div className="px-5 py-4 bg-[#FAF8F3]/70 space-y-3">
        <div className="px-4 py-3 rounded-lg bg-[#EAF2EC]/90 border border-[#164A31]/30 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#164A31] shrink-0">
            Final Answer
          </span>
          <div className="text-sm sm:text-base font-semibold text-[#14241B] overflow-x-auto max-w-full">
            <MathRenderer expression={example.finalAnswer} />
          </div>
        </div>

        <div className="text-xs text-[#48564D] leading-relaxed px-3.5 py-2.5 rounded-lg bg-[#FDF6E7] border border-[#F2D08B]">
          <strong className="text-[#8F4B00]">Common Mistake to Avoid:</strong>{" "}
          <MarkdownContent content={example.commonMistakeNote} inline />
        </div>
      </div>
    </article>
  );
}

export interface QuestionContentProps {
  question: Pick<
    Question,
    "questionText" | "diagramType" | "formulaContext"
  >;
  showFormulaLabel?: boolean;
}

/**
 * Reusable Question stem, diagram, and reference formula renderer for Practice & Mock Tests.
 * Ensures generous vertical breathing room between prose, standalone equations, figures, and reference relations.
 */
export function QuestionContent({
  question,
  showFormulaLabel = true,
}: QuestionContentProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="text-[15.5px] sm:text-[16.5px] font-serif font-medium text-[#14241B] leading-[1.82] max-w-[74ch]">
        <MarkdownContent content={question.questionText} serif />
      </div>

      {question.diagramType && (
        <div className="py-1.5">
          <QuestionDiagramSvg type={question.diagramType} />
        </div>
      )}

      {question.formulaContext && (
        <div className="pt-0.5">
          <MathRenderer
            expression={question.formulaContext}
            block
            variant="highlight"
            label={
              showFormulaLabel
                ? "Relevant Concept / Reference Formula"
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}

export interface QuestionWorkedSolutionProps {
  question: Question;
}

/**
 * Natural, textbook-grade Worked Solution renderer for practice and mock-test questions.
 * Presents Given Information, Relevant Concept/Formula, Substitution & Derivation steps,
 * a clearly identified Final Answer & Units, and a brief explanation of the Underlying Concept
 * without forcing conceptual questions into an artificial numerical template.
 */
export function QuestionWorkedSolution({
  question,
}: QuestionWorkedSolutionProps) {
  const breakdown = question.solutionBreakdown;

  // Derive steps: prefer structured solutionBreakdown.steps if provided, else map stepByStepExplanation
  const steps =
    breakdown?.steps && breakdown.steps.length > 0
      ? breakdown.steps
      : question.stepByStepExplanation.map((text, idx, arr) => {
          // Infer natural semantic labels when not explicitly provided
          let defaultLabel: string | undefined;
          if (question.questionType === "numerical") {
            if (idx === 0) defaultLabel = "Given Information & Setup";
            else if (idx === 1 && arr.length >= 3)
              defaultLabel = "Relevant Formula";
            else if (idx === arr.length - 1)
              defaultLabel = "Substitution & Calculation";
          }
          return {
            label: defaultLabel,
            content: text,
            formula: undefined as string | undefined,
          };
        });

  // Derive final answer string with units
  const derivedFinalAnswer = (() => {
    if (breakdown?.finalAnswer) return breakdown.finalAnswer;
    if (question.questionType === "numerical") {
      const unitSuffix = question.numericalUnit
        ? `\\text{ ${question.numericalUnit}}`
        : "";
      return `$$${question.correctNumericalValue}${unitSuffix}$$`;
    }
    if (question.questionType === "multiple-choice") {
      const ids = question.correctOptionIds || [];
      return `Correct Options: **${ids.join(", ")}**`;
    }
    const correctOpt = (question.options || []).find(
      (o) => o.id === question.correctOptionId
    );
    return correctOpt
      ? `**Option ${correctOpt.id}** — ${correctOpt.text}`
      : `**Option ${question.correctOptionId}**`;
  })();

  const underlyingConcept =
    breakdown?.underlyingConcept || question.keyConceptTested;

  return (
    <div
      className="rounded-xl border border-[#E2E5DC] bg-white overflow-hidden divide-y divide-[#E2E5DC]"
      data-testid="question-worked-solution"
    >
      {/* Solution Header & Given Information */}
      <div className="px-4 sm:px-5 py-3.5 bg-[#FAF8F3] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#164A31]">
            Worked Solution &amp; Concept Breakdown
          </span>
          <span className="text-[11px] font-mono text-[#6E7B72]">
            {question.subjectId.toUpperCase()} · Class {question.classLevel}
          </span>
        </div>

        {breakdown?.given && breakdown.given.length > 0 && (
          <div className="pt-2 border-t border-[#E2E5DC]/80 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-xs text-[#48564D]">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#14241B] shrink-0">
              Given Information:
            </span>
            {breakdown.given.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="text-[#6E7B72]" aria-hidden="true">
                    ·
                  </span>
                )}
                <span className="text-[#14241B]">
                  <MarkdownContent content={item} inline />
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {breakdown?.conceptOrFormula && (
          <div className="pt-2 border-t border-[#E2E5DC]/80 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#48564D]">
              Relevant Concept / Formula
            </div>
            <MathRenderer
              expression={breakdown.conceptOrFormula}
              block
              variant="plain"
            />
          </div>
        )}
      </div>

      {/* Logical Derivation / Solution Steps */}
      <div className="px-4 sm:px-5 py-4 bg-white">
        <ol className="divide-y divide-[#E2E5DC]/75">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className="py-3 first:pt-0.5 last:pb-0.5 space-y-1.5 text-xs sm:text-sm text-[#14241B]"
            >
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs font-semibold text-[#164A31] shrink-0">
                  Step {idx + 1}.
                </span>
                {step.label ? (
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#48564D]">
                    {step.label}
                  </span>
                ) : null}
              </div>
              <div className="pl-0 sm:pl-14 text-[#14241B] leading-relaxed overflow-x-auto">
                <MarkdownContent content={step.content} />
              </div>
              {step.formula && (
                <div className="pl-0 sm:pl-14 pt-0.5">
                  <MathRenderer
                    expression={step.formula}
                    block
                    variant="plain"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Final Answer & Units + Underlying Concept & Common Mistake */}
      <div className="px-4 sm:px-5 py-4 bg-[#FAF8F3]/75 space-y-3">
        <div className="px-4 py-3 rounded-lg bg-[#EAF2EC]/90 border border-[#164A31]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#164A31] shrink-0">
            Final Answer &amp; Units
          </span>
          <div className="text-sm sm:text-base font-semibold text-[#14241B] overflow-x-auto max-w-full">
            <MarkdownContent content={derivedFinalAnswer} inline />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div className="px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E5DC] text-[#48564D]">
            <strong className="text-[#164A31] uppercase tracking-wider text-[11px] block mb-0.5">
              Underlying Concept
            </strong>
            <MarkdownContent content={underlyingConcept} inline />
          </div>

          <div className="px-3.5 py-2.5 rounded-lg bg-[#FDF6E7] border border-[#F2D08B] text-[#48564D]">
            <strong className="text-[#8F4B00] uppercase tracking-wider text-[11px] block mb-0.5">
              Common Exam Trap to Avoid
            </strong>
            <MarkdownContent content={question.commonMistakeSummary} inline />
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuestionDiagramSvg({
  type,
}: {
  type: QuestionDiagramType;
}) {
  if (type === "gaussian-cube") {
    return (
      <svg
        viewBox="0 0 320 120"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Gaussian surface diagram with enclosed charge"
      >
        <rect
          x="75"
          y="22"
          width="76"
          height="76"
          fill="#EAF2EC"
          fillOpacity="0.6"
          stroke="#164A31"
          strokeWidth="1.75"
        />
        <rect
          x="95"
          y="12"
          width="76"
          height="76"
          fill="none"
          stroke="#164A31"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        <line x1="75" y1="22" x2="95" y2="12" stroke="#164A31" strokeWidth="1.25" />
        <line x1="151" y1="22" x2="171" y2="12" stroke="#164A31" strokeWidth="1.25" />
        <line x1="75" y1="98" x2="95" y2="88" stroke="#164A31" strokeWidth="1.25" />
        <line x1="151" y1="98" x2="171" y2="88" stroke="#164A31" strokeWidth="1.25" />

        <circle cx="123" cy="55" r="7" fill="#164A31" />
        <text
          x="123"
          y="58"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="8"
          fontFamily="IBM Plex Mono"
        >
          +q
        </text>
        <text
          x="192"
          y="52"
          fill="#14241B"
          fontSize="10"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          6 Symmetric Faces
        </text>
        <text
          x="192"
          y="68"
          fill="#48564D"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
        >
          Φ_face = q / (6ε₀)
        </text>
      </svg>
    );
  }

  if (type === "projectile-apex") {
    return (
      <svg
        viewBox="0 0 320 115"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Projectile trajectory diagram showing horizontal velocity at highest point"
      >
        <line x1="25" y1="95" x2="295" y2="95" stroke="#48564D" strokeWidth="1.5" />
        <path
          d="M 35 95 Q 155 10 275 95"
          fill="none"
          stroke="#164A31"
          strokeWidth="2.2"
        />
        <circle cx="155" cy="52" r="4" fill="#164A31" />
        <line x1="155" y1="52" x2="205" y2="52" stroke="#184E77" strokeWidth="2" />
        <polygon points="205,52 198,48 198,56" fill="#184E77" />
        <text
          x="155"
          y="40"
          textAnchor="middle"
          fill="#184E77"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          v_top = u cos θ (v_y = 0)
        </text>
        <text
          x="52"
          y="88"
          fill="#14241B"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
        >
          θ = 60°
        </text>
      </svg>
    );
  }

  if (type === "equilibrium-vessel") {
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Reversible chemical equilibrium reaction diagram"
      >
        <rect
          x="25"
          y="22"
          width="270"
          height="66"
          rx="6"
          fill="#FFFFFF"
          stroke="#164A31"
          strokeWidth="1.5"
        />
        <text
          x="160"
          y="48"
          textAnchor="middle"
          fill="#14241B"
          fontSize="11"
          fontFamily="IBM Plex Mono"
          fontWeight="600"
        >
          2 SO₂(g) + O₂(g) ⇌ 2 SO₃(g) + Heat
        </text>
        <text
          x="160"
          y="70"
          textAnchor="middle"
          fill="#48564D"
          fontSize="9.5"
          fontFamily="IBM Plex Mono"
        >
          3 gas moles (Left) ⇌ 2 gas moles (Right) | ΔH &lt; 0
        </text>
      </svg>
    );
  }

  if (type === "daniell-cell") {
    return (
      <svg
        viewBox="0 0 320 110"
        className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
        role="img"
        aria-label="Galvanic cell diagram showing anode and cathode compartments"
      >
        <rect x="35" y="30" width="90" height="60" rx="4" fill="#EBF3F9" stroke="#184E77" strokeWidth="1.5" />
        <rect x="195" y="30" width="90" height="60" rx="4" fill="#EAF2EC" stroke="#164A31" strokeWidth="1.5" />
        <path d="M 105 45 L 105 20 L 215 20 L 215 45" fill="none" stroke="#48564D" strokeWidth="2" />
        <text x="80" y="64" textAnchor="middle" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#184E77" fontWeight="600">
          Anode (Oxidation)
        </text>
        <text x="240" y="64" textAnchor="middle" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#164A31" fontWeight="600">
          Cathode (Reduction)
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 320 110"
      className="w-full max-w-[320px] h-auto rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] p-2"
      role="img"
      aria-label="Oxygen-haemoglobin dissociation curve diagram"
    >
      <line x1="35" y1="90" x2="285" y2="90" stroke="#14241B" strokeWidth="1.4" />
      <line x1="35" y1="18" x2="35" y2="90" stroke="#14241B" strokeWidth="1.4" />
      <path d="M 35 90 C 75 88, 95 26, 255 24" fill="none" stroke="#164A31" strokeWidth="2.2" />
      <path d="M 35 90 C 105 88, 130 34, 275 30" fill="none" stroke="#184E77" strokeWidth="1.6" strokeDasharray="4 3" />
      <text x="150" y="45" fontSize="9.5" fontFamily="IBM Plex Mono" fill="#164A31" fontWeight="600">
        Alveoli (Left) vs Active Tissue (Right)
      </text>
    </svg>
  );
}
