import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  Question,
  QuestionAttempt,
  SubjectId,
  TargetExam,
} from "../../types/domain";
import { Button, MetaLine } from "../ui/Primitives";
import { MathFormula, QuestionDiagramSvg } from "../ui/MathAndDiagrams";

export interface QuestionSubmissionPayload {
  questionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  selectedOptionId?: "A" | "B" | "C" | "D";
  selectedOptionIds?: ("A" | "B" | "C" | "D")[];
  enteredNumericalValue?: number;
}

interface QuestionCardProps {
  question: Question;
  existingAttempt?: QuestionAttempt;
  isBookmarked: boolean;
  targetExam: TargetExam;
  onRecordAttempt: (payload: QuestionSubmissionPayload) => void;
  onToggleBookmark: (questionId: string) => void;
  onReviewConcept?: (subjectId: SubjectId, topicId: string) => void;
  onNextQuestion?: () => void;
  onAskDoubtAboutQuestion?: (prefillQuestion: string) => void;
}

export function QuestionCard({
  question,
  existingAttempt,
  isBookmarked,
  targetExam,
  onRecordAttempt,
  onToggleBookmark,
  onReviewConcept,
  onNextQuestion,
  onAskDoubtAboutQuestion,
}: QuestionCardProps) {
  const [selectedSingle, setSelectedSingle] = useState<
    "A" | "B" | "C" | "D" | null
  >(existingAttempt?.selectedOptionId ?? null);

  const [selectedMultiple, setSelectedMultiple] = useState<
    ("A" | "B" | "C" | "D")[]
  >(existingAttempt?.selectedOptionIds ?? []);

  const [numericalInput, setNumericalInput] = useState<string>(
    existingAttempt?.enteredNumericalValue !== undefined
      ? String(existingAttempt.enteredNumericalValue)
      : ""
  );

  const [submitted, setSubmitted] = useState<boolean>(Boolean(existingAttempt));
  const [aiBreakdown, setAiBreakdown] = useState<string | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState<boolean>(false);

  useEffect(() => {
    setSelectedSingle(existingAttempt?.selectedOptionId ?? null);
    setSelectedMultiple(existingAttempt?.selectedOptionIds ?? []);
    setNumericalInput(
      existingAttempt?.enteredNumericalValue !== undefined
        ? String(existingAttempt.enteredNumericalValue)
        : ""
    );
    setSubmitted(Boolean(existingAttempt));
    setAiBreakdown(null);
  }, [question.id, existingAttempt]);

  const toggleMultiOption = (optId: "A" | "B" | "C" | "D") => {
    if (submitted) return;
    setSelectedMultiple((prev) =>
      prev.includes(optId)
        ? prev.filter((id) => id !== optId)
        : [...prev, optId].sort()
    );
  };

  // Evaluate correctness based on questionType
  const evaluateSubmission = (): {
    isCorrect: boolean;
    marksAwarded: number;
  } => {
    if (question.questionType === "single-choice") {
      const ok = selectedSingle === question.correctOptionId;
      return {
        isCorrect: ok,
        marksAwarded: ok ? question.marks.correct : question.marks.incorrect,
      };
    }

    if (question.questionType === "multiple-choice") {
      const expected = [...(question.correctOptionIds || [])].sort();
      const chosen = [...selectedMultiple].sort();
      const exactMatch =
        expected.length === chosen.length &&
        expected.every((val, idx) => val === chosen[idx]);
      return {
        isCorrect: exactMatch,
        marksAwarded: exactMatch
          ? question.marks.correct
          : question.marks.incorrect,
      };
    }

    // Numerical question
    const parsed = parseFloat(numericalInput.trim());
    const target = question.correctNumericalValue ?? 0;
    const tol = question.numericalTolerance ?? 0.05;
    const ok = !Number.isNaN(parsed) && Math.abs(parsed - target) <= tol;
    return {
      isCorrect: ok,
      marksAwarded: ok ? question.marks.correct : question.marks.incorrect,
    };
  };

  const canSubmit =
    question.questionType === "single-choice"
      ? selectedSingle !== null
      : question.questionType === "multiple-choice"
      ? selectedMultiple.length > 0
      : numericalInput.trim() !== "" && !Number.isNaN(Number(numericalInput));

  const { isCorrect, marksAwarded } = submitted
    ? evaluateSubmission()
    : { isCorrect: false, marksAwarded: 0 };

  const handleSubmit = () => {
    if (!canSubmit || submitted) return;
    const result = evaluateSubmission();
    setSubmitted(true);
    onRecordAttempt({
      questionId: question.id,
      isCorrect: result.isCorrect,
      marksAwarded: result.marksAwarded,
      selectedOptionId:
        question.questionType === "single-choice" && selectedSingle
          ? selectedSingle
          : undefined,
      selectedOptionIds:
        question.questionType === "multiple-choice"
          ? selectedMultiple
          : undefined,
      enteredNumericalValue:
        question.questionType === "numerical"
          ? parseFloat(numericalInput.trim())
          : undefined,
    });
  };

  const handleResetTryAgain = () => {
    setSelectedSingle(null);
    setSelectedMultiple([]);
    setNumericalInput("");
    setSubmitted(false);
    setAiBreakdown(null);
  };

  const getFormattedStudentAnswer = (): string => {
    if (question.questionType === "single-choice") {
      const opt = question.options?.find((o) => o.id === selectedSingle);
      return selectedSingle ? `Option ${selectedSingle} (${opt?.text || ""})` : "None";
    }
    if (question.questionType === "multiple-choice") {
      return `Options ${selectedMultiple.join(", ")}`;
    }
    return `${numericalInput} ${question.numericalUnit || ""}`.trim();
  };

  const getFormattedCorrectAnswer = (): string => {
    if (question.questionType === "single-choice") {
      const opt = question.options?.find(
        (o) => o.id === question.correctOptionId
      );
      return `Option ${question.correctOptionId} — ${opt?.text || ""}`;
    }
    if (question.questionType === "multiple-choice") {
      return `Options ${(question.correctOptionIds || []).join(", ")}`;
    }
    return `${question.correctNumericalValue} ${
      question.numericalUnit || ""
    }`.trim();
  };

  const handleRequestAiBreakdown = async () => {
    if (loadingBreakdown) return;
    setLoadingBreakdown(true);
    try {
      const res = await fetch("/api/tutor/explain-mistake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: question.questionText,
          selectedOption: getFormattedStudentAnswer(),
          correctOption: getFormattedCorrectAnswer(),
          explanation: question.stepByStepExplanation.join(" "),
          subject: question.subjectId,
          targetExam,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiBreakdown(
          data.error ||
            "The live AI tutor did not respond right now. Please refer to the verified step-by-step explanation above or try again."
        );
        return;
      }
      setAiBreakdown(data.reply || null);
    } catch {
      setAiBreakdown(
        "Could not reach the live AI tutor right now. Please refer to the verified step-by-step explanation above or try again."
      );
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Build specific wrong-answer diagnostic explanation
  const buildWrongAnswerExplanation = (): string => {
    if (question.questionType === "single-choice") {
      const chosenOpt = question.options?.find((o) => o.id === selectedSingle);
      if (chosenOpt?.trapReason) return chosenOpt.trapReason;
      return question.commonMistakeSummary;
    }
    if (question.questionType === "multiple-choice") {
      const wrongPicked = (question.options || []).filter(
        (o) =>
          selectedMultiple.includes(o.id) &&
          !(question.correctOptionIds || []).includes(o.id)
      );
      if (wrongPicked.length > 0 && wrongPicked[0].trapReason) {
        return `Option ${wrongPicked[0].id} is incorrect: ${wrongPicked[0].trapReason}`;
      }
      return `For multiple-correct questions, all correct options (${(
        question.correctOptionIds || []
      ).join(", ")}) must be selected without any incorrect option. ${
        question.commonMistakeSummary
      }`;
    }
    return question.commonMistakeSummary;
  };

  const markingLabel = `Marks: +${question.marks.correct} / ${
    question.marks.incorrect === 0
      ? "0 (No negative marking)"
      : question.marks.incorrect
  }`;

  return (
    <article className="bg-white border border-[#E2E5DC] rounded-xl p-5 sm:p-6 space-y-5">
      {/* Header Metadata Line */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <MetaLine
          items={[
            question.examTag,
            `Class ${question.classLevel}`,
            `${question.difficulty}`,
            markingLabel,
            question.sourceLabel,
          ]}
        />
        <button
          type="button"
          onClick={() => onToggleBookmark(question.id)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isBookmarked
              ? "bg-[#D8F3A2] text-[#14241B]"
              : "text-[#48564D] hover:bg-[#F3F1EA] hover:text-[#14241B]"
          }`}
          aria-label={
            isBookmarked
              ? "Remove from saved questions"
              : "Save question for revision"
          }
        >
          <Bookmark className="w-3.5 h-3.5" />
          {isBookmarked ? "Saved for Revision" : "Save Question"}
        </button>
      </div>

      {/* Question Stem, Diagram & Formula Context */}
      <div className="space-y-4">
        <p className="text-base font-medium text-[#14241B] leading-relaxed">
          <MathFormula expression={question.questionText} className="font-sans" />
        </p>

        {question.diagramType && (
          <div className="py-1">
            <QuestionDiagramSvg type={question.diagramType} />
          </div>
        )}

        {question.formulaContext && (
          <MathFormula expression={`Relation: ${question.formulaContext}`} block />
        )}
      </div>

      {/* Input Area by Question Type */}
      {question.questionType === "single-choice" && question.options && (
        <div
          className="grid grid-cols-1 gap-2.5"
          role="radiogroup"
          aria-label="Single-correct answer options"
        >
          {question.options.map((opt) => {
            const isSelected = selectedSingle === opt.id;
            const isThisCorrect = opt.id === question.correctOptionId;

            let containerStyle =
              "border-[#E2E5DC] bg-white hover:bg-[#FAF8F3] text-[#14241B]";
            let badgeText: string = opt.id;

            if (!submitted && isSelected) {
              containerStyle = "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
            } else if (submitted) {
              if (isThisCorrect) {
                containerStyle = "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
                badgeText = "✓";
              } else if (isSelected && !isThisCorrect) {
                containerStyle = "border-[#D97706] bg-[#FFFBEB] text-[#14241B]";
                badgeText = "✗";
              } else {
                containerStyle = "border-[#E2E5DC] bg-white/70 text-[#6E7B72]";
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={submitted}
                onClick={() => setSelectedSingle(opt.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-default ${containerStyle}`}
              >
                <span className="w-6 h-6 rounded-md border border-current/25 flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5">
                  {badgeText}
                </span>
                <div className="flex-1 text-sm leading-relaxed">
                  <MathFormula expression={opt.text} className="font-sans" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {question.questionType === "multiple-choice" && question.options && (
        <div className="space-y-2.5" role="group" aria-label="Multiple-correct answer options">
          <div className="text-xs font-medium text-[#184E77]">
            Multiple-Correct Format: Select one or more options that are correct.
          </div>
          {question.options.map((opt) => {
            const isSelected = selectedMultiple.includes(opt.id);
            const isThisCorrect = (question.correctOptionIds || []).includes(
              opt.id
            );

            let containerStyle =
              "border-[#E2E5DC] bg-white hover:bg-[#FAF8F3] text-[#14241B]";
            let badgeText: string = opt.id;

            if (!submitted && isSelected) {
              containerStyle = "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
            } else if (submitted) {
              if (isThisCorrect) {
                containerStyle = "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
                badgeText = "✓";
              } else if (isSelected && !isThisCorrect) {
                containerStyle = "border-[#D97706] bg-[#FFFBEB] text-[#14241B]";
                badgeText = "✗";
              } else {
                containerStyle = "border-[#E2E5DC] bg-white/70 text-[#6E7B72]";
              }
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={submitted}
                onClick={() => toggleMultiOption(opt.id)}
                className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer disabled:cursor-default ${containerStyle}`}
              >
                <span className="w-6 h-6 rounded-md border border-current/25 flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5">
                  {badgeText}
                </span>
                <div className="flex-1 text-sm leading-relaxed">
                  <MathFormula expression={opt.text} className="font-sans" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {question.questionType === "numerical" && (
        <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-2">
          <label
            htmlFor={`num-input-${question.id}`}
            className="block text-xs font-semibold text-[#14241B]"
          >
            Enter Numerical Answer{" "}
            {question.numericalUnit ? `(in ${question.numericalUnit})` : ""}
          </label>
          <div className="flex items-center gap-3 max-w-xs">
            <input
              id={`num-input-${question.id}`}
              type="number"
              step="any"
              disabled={submitted}
              value={numericalInput}
              onChange={(e) => setNumericalInput(e.target.value)}
              placeholder="e.g., 40"
              className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-[#E2E5DC] rounded-lg text-[#14241B]"
            />
            {question.numericalUnit && (
              <span className="text-sm font-mono text-[#48564D] shrink-0">
                {question.numericalUnit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Submission Bar */}
      {!submitted && (
        <div className="pt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-[#6E7B72]">
            Select your answer and submit to view full solution and feedback.
          </span>
          <Button
            type="button"
            variant="primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Submit Answer
          </Button>
        </div>
      )}

      {/* =====================================================================
          6-PART STRUCTURED POST-ANSWER FEEDBACK
         ===================================================================== */}
      {submitted && (
        <div className="pt-5 border-t border-[#E2E5DC] space-y-4">
          {/* 1. Whether the answer is correct + 2. The correct answer */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              isCorrect
                ? "bg-[#EAF2EC] border-[#164A31]/30 text-[#14241B]"
                : "bg-[#FFFBEB] border-[#D97706]/40 text-[#14241B]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#164A31] shrink-0" />
                    <span>
                      1. Correct! Well reasoned ({marksAwarded >= 0 ? `+${marksAwarded}` : marksAwarded} marks)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
                    <span>
                      1. Not quite right ({marksAwarded >= 0 ? `+${marksAwarded}` : marksAwarded} mark{Math.abs(marksAwarded) === 1 ? "" : "s"}) — let&apos;s understand why
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs font-mono text-[#48564D]">
                Your answer: {getFormattedStudentAnswer()}
              </span>
            </div>

            <div className="text-xs sm:text-sm pt-1 border-t border-current/10">
              <strong className="text-[#14241B]">2. Correct Answer:</strong>{" "}
              <span className="font-mono font-semibold text-[#164A31]">
                {getFormattedCorrectAnswer()}
              </span>
            </div>

            {/* 4. Why the student's chosen answer is wrong (when applicable) */}
            {!isCorrect && (
              <div className="text-xs text-[#48564D] pt-1 leading-relaxed">
                <strong className="text-[#14241B]">
                  Why your selection is a common exam trap:
                </strong>{" "}
                {buildWrongAnswerExplanation()}
              </div>
            )}
          </div>

          {/* 3. Clear Step-by-Step Explanation & 5. Concept or Formula to Remember */}
          <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-4 sm:p-5 space-y-3.5">
            <h4 className="text-xs font-semibold text-[#164A31]">
              3. Step-by-Step Solution
            </h4>
            <ol className="space-y-2 text-xs sm:text-sm text-[#14241B] list-decimal list-inside leading-relaxed">
              {question.stepByStepExplanation.map((step, i) => (
                <li key={i}>
                  <MathFormula expression={step} className="font-sans" />
                </li>
              ))}
            </ol>

            <div className="pt-3 border-t border-[#E2E5DC] space-y-1.5 text-xs">
              <div>
                <strong className="text-[#14241B]">
                  Concept &amp; Formula to Remember:
                </strong>{" "}
                <span className="text-[#48564D]">{question.keyConceptTested}</span>
              </div>
              {question.formulaContext && (
                <MathFormula expression={question.formulaContext} />
              )}
            </div>
          </div>

          {aiBreakdown && (
            <div className="bg-[#EBF3F9] border border-[#C5DDF0] rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-semibold text-[#184E77]">
                Personalised Tutor Breakdown
              </div>
              <div className="text-xs text-[#14241B] whitespace-pre-line leading-relaxed">
                {aiBreakdown}
              </div>
            </div>
          )}

          {/* 6. Relevant Next Action based on performance */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {!isCorrect && onReviewConcept && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    onReviewConcept(question.subjectId, question.topicId)
                  }
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Review Underlying Concept
                </Button>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResetTryAgain}
              >
                Try Question Again
              </Button>

              {!isCorrect && (
                <Button
                  type="button"
                  variant="lime"
                  size="sm"
                  onClick={handleRequestAiBreakdown}
                  disabled={loadingBreakdown}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {loadingBreakdown ? "Analysing..." : "Explain My Mistake"}
                </Button>
              )}

              {onAskDoubtAboutQuestion && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onAskDoubtAboutQuestion(
                      `Can you help me understand this question: "${question.questionText}"?`
                    )
                  }
                >
                  Ask in AI Tutor
                </Button>
              )}
            </div>

            {onNextQuestion && (
              <Button
                type="button"
                variant={isCorrect ? "primary" : "secondary"}
                size="sm"
                onClick={onNextQuestion}
              >
                {isCorrect ? "Next Challenge Question" : "Next Question"}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
