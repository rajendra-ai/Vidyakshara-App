import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Question,
  QuestionAttempt,
  SubjectId,
  TargetExam,
} from "../../types/domain";
import { Button, MetaLine } from "../ui/Primitives";
import {
  MarkdownContent,
  QuestionContent,
  QuestionWorkedSolution,
} from "../ui/MathAndDiagrams";

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
  questionNumber?: number;
  totalQuestions?: number;
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
  questionNumber,
  totalQuestions,
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

  const handleClearSelection = () => {
    if (submitted) return;
    setSelectedSingle(null);
    setSelectedMultiple([]);
    setNumericalInput("");
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
      return selectedSingle
        ? `Option ${selectedSingle} — ${opt?.text || ""}`
        : "None";
    }
    if (question.questionType === "multiple-choice") {
      return `Options ${selectedMultiple.join(", ")}`;
    }
    return `$$${numericalInput}${
      question.numericalUnit ? `\\text{ ${question.numericalUnit}}` : ""
    }$$`;
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
    return `$$${question.correctNumericalValue}${
      question.numericalUnit ? `\\text{ ${question.numericalUnit}}` : ""
    }$$`;
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
            "The live AI tutor did not respond right now. Please refer to the verified worked solution above or try again."
        );
        return;
      }
      setAiBreakdown(data.reply || null);
    } catch {
      setAiBreakdown(
        "Could not reach the live AI tutor right now. Please refer to the verified worked solution above or try again."
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

  const questionHeadingLabel =
    questionNumber !== undefined && totalQuestions !== undefined
      ? `Question ${questionNumber} of ${totalQuestions}`
      : questionNumber !== undefined
      ? `Question ${questionNumber}`
      : "Practice Question";

  const currentSelectionSummary = (() => {
    if (question.questionType === "single-choice") {
      return selectedSingle
        ? `Selected: Option ${selectedSingle}`
        : "Select one option (A, B, C, or D) above to submit";
    }
    if (question.questionType === "multiple-choice") {
      return selectedMultiple.length > 0
        ? `Selected: Option${
            selectedMultiple.length > 1 ? "s" : ""
          } ${selectedMultiple.join(", ")}`
        : "Select one or more correct options above to submit";
    }
    return numericalInput.trim()
      ? `Entered value: ${numericalInput.trim()}${
          question.numericalUnit ? ` ${question.numericalUnit}` : ""
        }`
      : "Enter your numerical value above to submit";
  })();

  return (
    <article
      className="bg-white border border-[#E2E5DC] rounded-xl overflow-hidden"
      aria-label={questionHeadingLabel}
    >
      {/* 1. Clear Question Number & Metadata Header */}
      <div className="px-5 sm:px-6 py-4 bg-[#FAF8F3] border-b border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#164A31] text-white font-mono text-xs font-semibold tabular-nums">
              {questionHeadingLabel}
            </span>
            <span className="text-xs font-semibold text-[#14241B]">
              {question.subjectId.toUpperCase()} · {question.examTag}
            </span>
          </div>
          <MetaLine
            items={[
              `Class ${question.classLevel}`,
              `${question.difficulty} Difficulty`,
              markingLabel,
              question.sourceLabel,
            ]}
          />
        </div>

        <button
          type="button"
          onClick={() => onToggleBookmark(question.id)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isBookmarked
              ? "bg-[#D8F3A2] text-[#14241B] border-[#164A31]/25"
              : "bg-white text-[#48564D] border-[#E2E5DC] hover:bg-[#F3F1EA] hover:text-[#14241B]"
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

      {/* Main Question Body, Options, Submission Action & Worked Solution */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* 2. Readable Problem Statement, Diagrams & Reference Formula */}
        <QuestionContent question={question} />

        {/* 3. Consistent Multiple-Choice Options / Numerical Input */}
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
                "border-[#E2E5DC] bg-white hover:bg-[#FAF8F3] hover:border-[#C5CBC0] text-[#14241B]";
              let badgeStyle =
                "bg-[#FAF8F3] border-[#E2E5DC] text-[#48564D]";
              let badgeText: string = opt.id;

              if (!submitted && isSelected) {
                containerStyle =
                  "border-[#164A31] bg-[#EAF2EC]/85 text-[#14241B] ring-1 ring-[#164A31]";
                badgeStyle = "bg-[#164A31] border-[#164A31] text-white";
              } else if (submitted) {
                if (isThisCorrect) {
                  containerStyle =
                    "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
                  badgeStyle = "bg-[#164A31] border-[#164A31] text-white";
                  badgeText = "✓";
                } else if (isSelected && !isThisCorrect) {
                  containerStyle =
                    "border-[#D97706] bg-[#FFFBEB] text-[#14241B]";
                  badgeStyle = "bg-[#D97706] border-[#D97706] text-white";
                  badgeText = "✗";
                } else {
                  containerStyle =
                    "border-[#E2E5DC] bg-[#FAF8F3]/60 text-[#6E7B72]";
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={submitted}
                  onClick={() => setSelectedSingle(opt.id)}
                  className={`w-full min-h-[54px] text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${containerStyle}`}
                >
                  <div className="flex items-baseline gap-3.5 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-semibold shrink-0 transition-colors ${badgeStyle}`}
                    >
                      {badgeText}
                    </span>
                    <div className="flex-1 min-w-0 overflow-x-auto text-sm sm:text-[15px] leading-relaxed py-0.5">
                      <MarkdownContent content={opt.text} inline />
                    </div>
                  </div>

                  {submitted && isThisCorrect && (
                    <span className="text-xs font-mono font-semibold text-[#164A31] shrink-0 hidden sm:inline">
                      Correct Option
                    </span>
                  )}
                  {submitted && isSelected && !isThisCorrect && (
                    <span className="text-xs font-mono font-semibold text-[#B45309] shrink-0 hidden sm:inline">
                      Your Choice
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {question.questionType === "multiple-choice" && question.options && (
          <div
            className="space-y-2.5"
            role="group"
            aria-label="Multiple-correct answer options"
          >
            <div className="text-xs font-medium text-[#184E77]">
              Multiple-Correct Format: Select one or more options that are
              correct.
            </div>
            {question.options.map((opt) => {
              const isSelected = selectedMultiple.includes(opt.id);
              const isThisCorrect = (question.correctOptionIds || []).includes(
                opt.id
              );

              let containerStyle =
                "border-[#E2E5DC] bg-white hover:bg-[#FAF8F3] hover:border-[#C5CBC0] text-[#14241B]";
              let badgeStyle =
                "bg-[#FAF8F3] border-[#E2E5DC] text-[#48564D]";
              let badgeText: string = opt.id;

              if (!submitted && isSelected) {
                containerStyle =
                  "border-[#164A31] bg-[#EAF2EC]/85 text-[#14241B] ring-1 ring-[#164A31]";
                badgeStyle = "bg-[#164A31] border-[#164A31] text-white";
              } else if (submitted) {
                if (isThisCorrect) {
                  containerStyle =
                    "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
                  badgeStyle = "bg-[#164A31] border-[#164A31] text-white";
                  badgeText = "✓";
                } else if (isSelected && !isThisCorrect) {
                  containerStyle =
                    "border-[#D97706] bg-[#FFFBEB] text-[#14241B]";
                  badgeStyle = "bg-[#D97706] border-[#D97706] text-white";
                  badgeText = "✗";
                } else {
                  containerStyle =
                    "border-[#E2E5DC] bg-[#FAF8F3]/60 text-[#6E7B72]";
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  disabled={submitted}
                  onClick={() => toggleMultiOption(opt.id)}
                  className={`w-full min-h-[54px] text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${containerStyle}`}
                >
                  <div className="flex items-baseline gap-3.5 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono font-semibold shrink-0 transition-colors ${badgeStyle}`}
                    >
                      {badgeText}
                    </span>
                    <div className="flex-1 min-w-0 overflow-x-auto text-sm sm:text-[15px] leading-relaxed py-0.5">
                      <MarkdownContent content={opt.text} inline />
                    </div>
                  </div>

                  {submitted && (
                    <span className="text-xs font-mono font-semibold shrink-0 hidden sm:inline">
                      {isThisCorrect && isSelected && (
                        <span className="text-[#164A31]">✓ Selected</span>
                      )}
                      {isThisCorrect && !isSelected && (
                        <span className="text-[#184E77]">Correct Option</span>
                      )}
                      {!isThisCorrect && isSelected && (
                        <span className="text-[#B45309]">✗ Incorrect</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {question.questionType === "numerical" && (
          <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-2.5">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit && !submitted) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="e.g., 40"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-[#E2E5DC] rounded-lg text-[#14241B]"
              />
              {question.numericalUnit && (
                <span className="text-sm font-mono font-semibold text-[#48564D] shrink-0">
                  {question.numericalUnit}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6E7B72]">
              Section B numerical questions carry +{question.marks.correct}{" "}
              marks for correct entries and 0 negative marks.
            </p>
          </div>
        )}

        {/* 4. Clear Answer-Submission Action Bar */}
        {!submitted && (
          <div className="pt-3 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-[#48564D]">
                {currentSelectionSummary}
              </span>
              {canSubmit && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="inline-flex items-center gap-1 text-xs text-[#6E7B72] hover:text-[#14241B] underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear selection
                </button>
              )}
            </div>

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
            5 & 6. POST-SUBMISSION DIAGNOSTIC FEEDBACK & WORKED SOLUTION
           ===================================================================== */}
        {submitted && (
          <div className="pt-5 border-t border-[#E2E5DC] space-y-5">
            {/* Diagnostic Status Banner + Side-by-side Answer Comparison */}
            <div
              className={`p-4 sm:p-5 rounded-xl border space-y-3.5 ${
                isCorrect
                  ? "bg-[#EAF2EC]/80 border-[#164A31]/30 text-[#14241B]"
                  : "bg-[#FFFBEB] border-[#D97706]/40 text-[#14241B]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#164A31] shrink-0" />
                      <span>
                        Correct Answer ·{" "}
                        {marksAwarded >= 0 ? `+${marksAwarded}` : marksAwarded}{" "}
                        Marks
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-[#B45309] shrink-0" />
                      <span>
                        Not Quite Right (
                        {marksAwarded >= 0 ? `+${marksAwarded}` : marksAwarded}{" "}
                        mark{Math.abs(marksAwarded) === 1 ? "" : "s"}) — review
                        the solution below
                      </span>
                    </>
                  )}
                </div>
                {!isCorrect && (
                  <span className="text-xs font-medium text-[#8F4B00]">
                    Saved to your Mistake Log
                  </span>
                )}
              </div>

              {/* Side-by-Side: Your Answer vs Correct Answer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-lg bg-white/90 border border-[#E2E5DC] space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6E7B72]">
                    Your Submitted Answer
                  </div>
                  <div className="font-medium text-[#14241B] overflow-x-auto">
                    <MarkdownContent
                      content={getFormattedStudentAnswer()}
                      inline
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#164A31]/30 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#164A31]">
                    Verified Correct Answer
                  </div>
                  <div className="font-semibold text-[#164A31] overflow-x-auto">
                    <MarkdownContent
                      content={getFormattedCorrectAnswer()}
                      inline
                    />
                  </div>
                </div>
              </div>

              {/* Why the student's chosen answer is wrong (when applicable) */}
              {!isCorrect && (
                <div className="px-3.5 py-2.5 rounded-lg bg-white/90 border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
                  <strong className="text-[#8F4B00]">
                    Why your selection is a common exam trap:
                  </strong>{" "}
                  <MarkdownContent
                    content={buildWrongAnswerExplanation()}
                    inline
                  />
                </div>
              )}
            </div>

            {/* Worked Solution with Logical Steps & Clearly Identified Final Answer */}
            <QuestionWorkedSolution question={question} />

            {aiBreakdown && (
              <div className="bg-[#EBF3F9] border border-[#C5DDF0] rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-semibold text-[#184E77]">
                  Personalised Tutor Breakdown
                </div>
                <MarkdownContent
                  content={aiBreakdown}
                  className="text-xs sm:text-sm text-[#14241B] leading-relaxed"
                />
              </div>
            )}

            {/* Relevant Next Actions based on performance */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
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
                  <RotateCcw className="w-3.5 h-3.5" />
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
      </div>
    </article>
  );
}
