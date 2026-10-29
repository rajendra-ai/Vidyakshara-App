import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  Flag,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  AppRoute,
  MockTestAttemptResult,
  MockTestDefinition,
  StudentLearningState,
  SubjectId,
} from "../../types/domain";
import { MOCK_TESTS, QUESTIONS, SUBJECTS, TOPICS } from "../../data/curriculum";
import { Button, MetaLine, ModalDialog } from "../ui/Primitives";
import { MathFormula, QuestionDiagramSvg } from "../ui/MathAndDiagrams";

interface MockTestsViewProps {
  state: StudentLearningState;
  onSaveMockResult: (result: MockTestAttemptResult) => void;
  onToggleBookmarkTopic?: (topicId: string) => void;
  onNavigate?: (
    route: AppRoute,
    options?: {
      subjectId?: SubjectId;
      chapterId?: string;
      topicId?: string;
      prefillDoubt?: string;
    }
  ) => void;
}

export function MockTestsView({
  state,
  onSaveMockResult,
  onToggleBookmarkTopic,
  onNavigate,
}: MockTestsViewProps) {
  const profile = state.profile!;

  // Pre-test instructions & configuration modal state
  const [briefingTest, setBriefingTest] =
    useState<MockTestDefinition | null>(null);
  const [configuredMinutes, setConfiguredMinutes] = useState<number>(15);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] =
    useState<boolean>(true);

  // Active test state
  const [activeTest, setActiveTest] = useState<MockTestDefinition | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<
    Record<string, "A" | "B" | "C" | "D" | null>
  >({});
  const [markedForReview, setMarkedForReview] = useState<string[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  // Post-test results view state
  const [viewingResult, setViewingResult] =
    useState<MockTestAttemptResult | null>(null);

  const openTestInstructions = (test: MockTestDefinition) => {
    setBriefingTest(test);
    setConfiguredMinutes(test.durationMinutes);
    setNegativeMarkingEnabled(true);
  };

  const handleBeginTestFromBriefing = () => {
    if (!briefingTest) return;
    const initialAnswers: Record<string, "A" | "B" | "C" | "D" | null> = {};
    briefingTest.questionIds.forEach((id) => {
      initialAnswers[id] = null;
    });
    setAnswers(initialAnswers);
    setMarkedForReview([]);
    setCurrentQIdx(0);
    setSecondsRemaining(configuredMinutes * 60);
    setViewingResult(null);
    setActiveTest(briefingTest);
    setBriefingTest(null);
  };

  const handleConfirmSubmit = () => {
    if (!activeTest) return;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const posMarks = activeTest.markingScheme.correct;
    const negMarks = negativeMarkingEnabled
      ? activeTest.markingScheme.incorrect
      : 0;

    activeTest.questionIds.forEach((qid) => {
      const q = QUESTIONS.find((item) => item.id === qid);
      const ans = answers[qid];
      if (!ans) {
        unattemptedCount++;
      } else if (q && ans === q.correctOptionId) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const totalScore = correctCount * posMarks + incorrectCount * negMarks;
    const maxScore = activeTest.questionIds.length * posMarks;
    const totalAllocatedSeconds = configuredMinutes * 60;
    const usedSeconds = Math.max(
      1,
      totalAllocatedSeconds - secondsRemaining
    );

    const newResult: MockTestAttemptResult = {
      id: `mock-res-${Date.now()}`,
      mockTestId: activeTest.id,
      title: activeTest.title,
      submittedAt: "Just now",
      durationSecondsUsed: usedSeconds,
      configuredDurationMinutes: configuredMinutes,
      negativeMarkingEnabled,
      totalScore,
      maxScore,
      correctCount,
      incorrectCount,
      unattemptedCount,
      markedForReviewIds: [...markedForReview],
      answers: { ...answers },
    };

    onSaveMockResult(newResult);
    setIsSubmitModalOpen(false);
    setActiveTest(null);
    setViewingResult(newResult);
  };

  useEffect(() => {
    if (!activeTest) return;
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeTest]);

  // Auto-open submit prompt if timer reaches 0
  useEffect(() => {
    if (activeTest && secondsRemaining === 0 && !isSubmitModalOpen) {
      setIsSubmitModalOpen(true);
    }
  }, [activeTest, secondsRemaining, isSubmitModalOpen]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  /* =========================================================================
   * 1. ACTIVE EXAM-TAKING INTERFACE
   * ======================================================================= */
  if (activeTest) {
    const testQuestions = activeTest.questionIds
      .map((id) => QUESTIONS.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    const currentQ = testQuestions[currentQIdx] || testQuestions[0];
    const selectedOpt = answers[currentQ.id] ?? null;
    const isFlagged = markedForReview.includes(currentQ.id);

    const answeredCount = Object.values(answers).filter(Boolean).length;
    const unattemptedCount = testQuestions.length - answeredCount;
    const negMarkValue = negativeMarkingEnabled
      ? activeTest.markingScheme.incorrect
      : 0;

    return (
      <div className="space-y-6">
        {/* Exam Top Status Bar */}
        <div className="bg-white border border-[#E2E5DC] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <MetaLine
              items={[
                activeTest.targetExam,
                `Marking: +${activeTest.markingScheme.correct} / ${negMarkValue} / 0 Unattempted`,
                `${configuredMinutes} Min Duration`,
              ]}
            />
            <h1 className="text-lg font-bold text-[#14241B] mt-0.5">
              {activeTest.title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                secondsRemaining <= 120
                  ? "bg-[#FDF2F2] border-[#F8B4B4] text-[#9B1C1C]"
                  : "bg-[#FAF8F3] border-[#E2E5DC] text-[#14241B]"
              }`}
            >
              <Clock className="w-4 h-4 text-[#164A31]" />
              <span className="text-sm font-mono font-semibold tabular-nums">
                {formatTime(secondsRemaining)}
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
            >
              Submit Test
            </Button>
          </div>
        </div>

        {/* Two-Column Exam Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question Workspace (8 Cols) */}
          <div className="lg:col-span-8 bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E5DC] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold text-[#164A31]">
                  Question {currentQIdx + 1} of {testQuestions.length}
                </span>
                <span className="text-xs text-[#6E7B72]">
                  · {selectedOpt ? `Answered (${selectedOpt})` : "Unanswered"}
                  {isFlagged ? " · Marked for Review" : ""}
                </span>
              </div>
              <MetaLine
                items={[
                  currentQ.subjectId.toUpperCase(),
                  `${currentQ.difficulty} Difficulty`,
                  `+${activeTest.markingScheme.correct} / ${negMarkValue}`,
                ]}
              />
            </div>

            <p className="text-base font-serif font-medium text-[#14241B] leading-relaxed">
              {currentQ.questionText}
            </p>

            {currentQ.diagramType && (
              <div>
                <QuestionDiagramSvg type={currentQ.diagramType} />
              </div>
            )}

            {currentQ.formulaContext && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6E7B72]">
                  Given Data / Reference Relation:
                </span>
                <MathFormula expression={currentQ.formulaContext} block />
              </div>
            )}

            <div
              className="space-y-2.5"
              role="radiogroup"
              aria-label="Question Options"
            >
              {(currentQ.options || []).map((opt) => {
                const chosen = selectedOpt === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: opt.id,
                      }))
                    }
                    className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer ${
                      chosen
                        ? "border-[#164A31] bg-[#EAF2EC] text-[#14241B]"
                        : "border-[#E2E5DC] bg-white hover:bg-[#FAF8F3] text-[#14241B]"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md border border-current/25 flex items-center justify-center text-xs font-mono font-semibold shrink-0">
                      {opt.id}
                    </span>
                    <span className="text-sm leading-relaxed">
                      <MathFormula expression={opt.text} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!selectedOpt}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [currentQ.id]: null }))
                  }
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Response
                </Button>
                <Button
                  type="button"
                  variant={isFlagged ? "lime" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setMarkedForReview((prev) =>
                      prev.includes(currentQ.id)
                        ? prev.filter((id) => id !== currentQ.id)
                        : [...prev, currentQ.id]
                    )
                  }
                >
                  <Flag className="w-3.5 h-3.5" />
                  {isFlagged ? "Marked for Review" : "Mark for Review"}
                </Button>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={currentQIdx === 0}
                  onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                {currentQIdx < testQuestions.length - 1 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setCurrentQIdx((i) =>
                        Math.min(testQuestions.length - 1, i + 1)
                      )
                    }
                  >
                    Save &amp; Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSubmitModalOpen(true)}
                  >
                    Review &amp; Submit
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question Palette (4 Cols) */}
          <aside className="lg:col-span-4 bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-5">
            <div>
              <span className="text-xs font-medium text-[#6E7B72]">
                Question Navigator
              </span>
              <h2 className="text-base font-semibold text-[#14241B] mt-0.5">
                Jump to any question
              </h2>
            </div>

            <div className="grid grid-cols-5 gap-2.5">
              {testQuestions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isReview = markedForReview.includes(q.id);
                const isCurrent = idx === currentQIdx;

                let btnClass =
                  "bg-[#FAF8F3] border-[#E2E5DC] text-[#48564D]";
                if (isAnswered && isReview) {
                  btnClass =
                    "bg-[#164A31] border-[#164A31] text-[#D8F3A2]";
                } else if (isAnswered) {
                  btnClass = "bg-[#164A31] border-[#164A31] text-white";
                } else if (isReview) {
                  btnClass = "bg-[#D8F3A2] border-[#164A31] text-[#14241B]";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIdx(idx)}
                    aria-label={`Question ${idx + 1}: ${
                      isAnswered ? "Answered" : "Unanswered"
                    }${isReview ? ", Marked for review" : ""}`}
                    className={`h-10 rounded-lg border font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer ${btnClass} ${
                      isCurrent ? "ring-2 ring-[#14241B] ring-offset-1" : ""
                    }`}
                  >
                    {idx + 1}
                    {isReview ? "*" : ""}
                  </button>
                );
              })}
            </div>

            {/* Status Legend & Counts */}
            <div className="pt-4 border-t border-[#E2E5DC] space-y-2 text-xs text-[#48564D]">
              <div className="flex justify-between font-mono tabular-nums">
                <span>Answered:</span>
                <span className="font-semibold text-[#164A31]">
                  {answeredCount}
                </span>
              </div>
              <div className="flex justify-between font-mono tabular-nums">
                <span>Marked for Review (*):</span>
                <span className="font-semibold text-[#14241B]">
                  {markedForReview.length}
                </span>
              </div>
              <div className="flex justify-between font-mono tabular-nums">
                <span>Unanswered:</span>
                <span className="font-semibold text-[#6E7B72]">
                  {unattemptedCount}
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Submit Confirmation Modal */}
        <ModalDialog
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title={
            secondsRemaining === 0
              ? "Time is up! Submit your test"
              : "Submit your checkpoint mock test?"
          }
          subtitle="Check your attempt summary before calculating your final score and question insights."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-center">
              <div>
                <div className="text-xs text-[#6E7B72]">Answered</div>
                <div className="text-lg font-mono font-semibold text-[#164A31] tabular-nums">
                  {answeredCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6E7B72]">Marked for Review</div>
                <div className="text-lg font-mono font-semibold text-[#14241B] tabular-nums">
                  {markedForReview.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#6E7B72]">Unanswered</div>
                <div className="text-lg font-mono font-semibold text-[#6E7B72] tabular-nums">
                  {unattemptedCount}
                </div>
              </div>
            </div>

            {unattemptedCount > 0 && secondsRemaining > 0 && (
              <p className="text-xs text-[#48564D] leading-relaxed">
                You still have <strong>{unattemptedCount}</strong> unanswered
                question{unattemptedCount > 1 ? "s" : ""} and{" "}
                <strong className="font-mono">
                  {formatTime(secondsRemaining)}
                </strong>{" "}
                remaining. Unanswered questions carry 0 marks.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {secondsRemaining > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Return to Questions
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmSubmit}
              >
                Confirm &amp; Calculate Results
              </Button>
            </div>
          </div>
        </ModalDialog>
      </div>
    );
  }

  /* =========================================================================
   * 2. POST-TEST RESULTS, EVIDENCE-BASED INSIGHTS & SOLUTION REVIEW
   * ======================================================================= */
  if (viewingResult) {
    const testDef = MOCK_TESTS.find((t) => t.id === viewingResult.mockTestId);
    const posMark = testDef?.markingScheme.correct ?? 4;
    const negMark =
      viewingResult.negativeMarkingEnabled === false
        ? 0
        : testDef?.markingScheme.incorrect ?? -1;

    const resultQuestions = (
      testDef?.questionIds || Object.keys(viewingResult.answers)
    )
      .map((id) => QUESTIONS.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    const attemptedTotal =
      viewingResult.correctCount + viewingResult.incorrectCount;
    const accuracyPct =
      attemptedTotal > 0
        ? Math.round((viewingResult.correctCount / attemptedTotal) * 100)
        : 0;

    // Group performance by subject for this test
    const subjectGroups = Array.from(
      new Set(resultQuestions.map((q) => q.subjectId))
    ).map((sid) => {
      const qs = resultQuestions.filter((q) => q.subjectId === sid);
      let corr = 0;
      let incorr = 0;
      let unans = 0;
      qs.forEach((q) => {
        const c = viewingResult.answers[q.id];
        if (!c) unans++;
        else if (c === q.correctOptionId) corr++;
        else incorr++;
      });
      const subjScore = corr * posMark + incorr * negMark;
      const subjMax = qs.length * posMark;
      const sName = SUBJECTS.find((s) => s.id === sid)?.name || sid;
      const isMeaningful = qs.length >= 3 && corr + incorr >= 3;

      return {
        subjectId: sid,
        subjectName: sName,
        totalQuestions: qs.length,
        correct: corr,
        incorrect: incorr,
        unanswered: unans,
        score: subjScore,
        maxScore: subjMax,
        evidenceNote: isMeaningful
          ? `${Math.round((corr / (corr + incorr)) * 100)}% accuracy across ${
              corr + incorr
            } attempted questions`
          : `Initial signal (${qs.length} question${
              qs.length === 1 ? "" : "s"
            } in this checkpoint — practise at least 3 questions in ${sName} for a reliable trend)`,
      };
    });

    // Questions worth reviewing (incorrect or unanswered or flagged)
    const questionsWorthReviewing = resultQuestions.filter((q) => {
      const choice = viewingResult.answers[q.id];
      const wasFlagged = (viewingResult.markedForReviewIds || []).includes(q.id);
      return !choice || choice !== q.correctOptionId || wasFlagged;
    });

    return (
      <div className="space-y-8">
        {/* Scorecard Summary */}
        <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <MetaLine
                items={[
                  "Mock Test Scorecard & Diagnostic Insights",
                  viewingResult.submittedAt,
                  `Marking: +${posMark} / ${negMark}`,
                ]}
              />
              <h1 className="text-2xl font-bold text-[#14241B]">
                {viewingResult.title}
              </h1>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setViewingResult(null)}
            >
              <ArrowLeft className="w-4 h-4" />
              All Mock Tests
            </Button>
          </div>

          {/* 5-Column Core Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC]">
            <div>
              <div className="text-xs text-[#6E7B72]">Net Score</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#164A31] mt-1">
                {viewingResult.totalScore} / {viewingResult.maxScore}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">Accuracy</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#14241B] mt-1">
                {attemptedTotal > 0 ? `${accuracyPct}%` : "0%"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">
                Correct (+{posMark * viewingResult.correctCount})
              </div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#164A31] mt-1">
                {viewingResult.correctCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">
                Incorrect ({negMark * viewingResult.incorrectCount})
              </div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#B45309] mt-1">
                {viewingResult.incorrectCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">Unanswered (0)</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#6E7B72] mt-1">
                {viewingResult.unattemptedCount}
              </div>
            </div>
          </div>

          {/* Subject-wise Performance & Evidence Confidence Note */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#14241B]">
                Subject-wise Breakdown &amp; Evidence Strength
              </h2>
              <span className="text-xs text-[#6E7B72]">
                Time used: {formatTime(viewingResult.durationSecondsUsed)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjectGroups.map((sg) => (
                <div
                  key={sg.subjectId}
                  className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#14241B]">
                      {sg.subjectName}
                    </span>
                    <span className="text-xs font-mono font-semibold tabular-nums text-[#164A31]">
                      {sg.score} / {sg.maxScore} marks
                    </span>
                  </div>
                  <div className="text-xs text-[#48564D] font-mono tabular-nums">
                    {sg.correct} Correct · {sg.incorrect} Incorrect ·{" "}
                    {sg.unanswered} Unanswered
                  </div>
                  <p className="text-[11px] text-[#6E7B72] leading-relaxed">
                    {sg.evidenceNote}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Useful Next Steps */}
          <div className="p-5 rounded-xl bg-[#EAF2EC] border border-[#164A31]/25 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[#14241B]">
                Recommended Next Step after this Test
              </div>
              <p className="text-xs text-[#48564D] max-w-2xl">
                {questionsWorthReviewing.length > 0
                  ? `You have ${questionsWorthReviewing.length} question${
                      questionsWorthReviewing.length > 1 ? "s" : ""
                    } worth reviewing below (missed, unanswered, or marked for review). Revisit the underlying concept before retaking the test.`
                  : "Spotless attempt! Continue to your next syllabus chapter or try a multi-correct practice set."}
              </p>
            </div>
            {onNavigate && (
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate("revision")}
                >
                  Open Revision Area
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate("progress")}
                >
                  View Overall Progress
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Questions Worth Reviewing & Complete Solution Breakdown */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#14241B]">
              Question-by-Question Solution &amp; Mistake Review
            </h2>
            <span className="text-xs text-[#6E7B72]">
              {questionsWorthReviewing.length} question
              {questionsWorthReviewing.length === 1 ? "" : "s"} highlighted for
              follow-up review
            </span>
          </div>

          {resultQuestions.map((q, idx) => {
            const studentChoice = viewingResult.answers[q.id];
            const isCorrect = studentChoice === q.correctOptionId;
            const wasFlagged = (
              viewingResult.markedForReviewIds || []
            ).includes(q.id);
            const topic = TOPICS.find((t) => t.id === q.topicId);
            const isTopicSaved = (state.bookmarkedTopicIds || []).includes(
              q.topicId
            );

            return (
              <div
                key={q.id}
                className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <MetaLine
                    items={[
                      `Question ${idx + 1}`,
                      q.subjectId.toUpperCase(),
                      topic?.title,
                      wasFlagged ? "Marked for Review" : undefined,
                    ]}
                  />
                  <span
                    className={`text-xs font-mono font-semibold ${
                      !studentChoice
                        ? "text-[#6E7B72]"
                        : isCorrect
                        ? "text-[#164A31]"
                        : "text-[#9B1C1C]"
                    }`}
                  >
                    {!studentChoice
                      ? "Unanswered (0 marks)"
                      : isCorrect
                      ? `✓ Correct (+${posMark} marks)`
                      : `✗ Incorrect (${negMark} mark)`}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-serif font-medium text-[#14241B] leading-relaxed">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC]">
                    <span className="text-[#6E7B72]">Your Answer: </span>
                    <strong className="text-[#14241B]">
                      {studentChoice
                        ? `Option ${studentChoice} — ${
                            q.options?.find((o) => o.id === studentChoice)
                              ?.text || ""
                          }`
                        : "Not Attempted"}
                    </strong>
                  </div>
                  <div className="p-3 rounded-lg bg-[#EAF2EC] border border-[#164A31]/30">
                    <span className="text-[#48564D]">Correct Answer: </span>
                    <strong className="text-[#164A31]">
                      Option {q.correctOptionId} —{" "}
                      {q.options?.find((o) => o.id === q.correctOptionId)?.text}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-2 text-xs text-[#48564D]">
                  <div className="font-semibold text-[#14241B]">
                    Step-by-Step Solution:
                  </div>
                  {q.stepByStepExplanation.map((st, i) => (
                    <div key={i} className="leading-relaxed">
                      {i + 1}. <MathFormula expression={st} />
                    </div>
                  ))}
                  <div className="pt-1 text-[#8F4B00] font-medium">
                    Common Trap to Avoid: {q.commonMistakeSummary}
                  </div>
                </div>

                {/* Actionable Follow-up Links per Question */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E5DC]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {onNavigate && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          onNavigate("learn", {
                            subjectId: q.subjectId,
                            topicId: q.topicId,
                          })
                        }
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Review Concept ({topic?.title || "Lesson"})
                      </Button>
                    )}

                    {onToggleBookmarkTopic && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleBookmarkTopic(q.topicId)}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {isTopicSaved
                          ? "Saved in Topics to Revisit"
                          : "Flag Topic for Revision"}
                      </Button>
                    )}
                  </div>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("doubts", {
                          subjectId: q.subjectId,
                          topicId: q.topicId,
                          prefillDoubt: `Can you explain this mock test question step by step: "${q.questionText}"`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ask AI Tutor about this question →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    );
  }

  /* =========================================================================
   * 3. DEFAULT MOCK TESTS OVERVIEW & PRE-TEST INSTRUCTIONS MODAL
   * ======================================================================= */
  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-2">
        <MetaLine
          items={[
            "Timed Exam Checkpoint Papers",
            "Configurable +4 / −1 Marking Scheme",
            profile.targetExam,
          ]}
        />
        <h1 className="text-2xl font-bold text-[#14241B]">
          Practise under real exam timing and review every mistake
        </h1>
        <p className="text-sm text-[#48564D] max-w-3xl leading-relaxed">
          Start a focused checkpoint test with configurable duration and marking rules. All questions are verified Vidyakshara curriculum problems designed for exam practice—they do not claim to reproduce an official NTA exam paper.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_TESTS.map((test) => {
          const isRecommended = test.targetExam === profile.targetExam;
          return (
            <div
              key={test.id}
              className="bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <MetaLine
                  items={[
                    test.targetExam,
                    `Class ${test.classLevel}`,
                    `${test.durationMinutes} Mins`,
                    `${test.questionIds.length} Questions`,
                    isRecommended ? "Recommended for your exam" : undefined,
                  ]}
                />
                <h2 className="text-lg font-semibold text-[#14241B]">
                  {test.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                  {test.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E5DC] flex items-center justify-between gap-4">
                <span className="text-xs font-mono tabular-nums text-[#6E7B72]">
                  Max Marks:{" "}
                  {test.questionIds.length * test.markingScheme.correct} (+
                  {test.markingScheme.correct} / {test.markingScheme.incorrect})
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => openTestInstructions(test)}
                >
                  <Play className="w-3.5 h-3.5" />
                  View Instructions &amp; Start
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Previous Mock Attempts */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#14241B]">
            Submitted Mock Test Attempts ({state.mockResults.length})
          </h2>
          {profile.isDemoAccount && state.mockResults.length > 0 && (
            <span className="text-xs text-[#6E7B72]">
              Includes sample attempt record
            </span>
          )}
        </div>

        {state.mockResults.length === 0 ? (
          <p className="text-sm text-[#6E7B72]">
            You haven&apos;t submitted a mock test in this profile yet. Start a checkpoint paper above to see your score breakdown and subject insights here.
          </p>
        ) : (
          <div className="divide-y divide-[#E2E5DC]">
            {state.mockResults.map((res) => (
              <div
                key={res.id}
                className="py-4 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[#14241B]">
                    {res.title}
                  </h3>
                  <MetaLine
                    items={[
                      res.submittedAt,
                      `Score: ${res.totalScore} / ${res.maxScore}`,
                      `${res.correctCount} Correct · ${res.incorrectCount} Incorrect · ${res.unattemptedCount} Unanswered`,
                    ]}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewingResult(res)}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  View Scorecard &amp; Solutions
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pre-Test Instructions & Configuration Modal */}
      {briefingTest && (
        <ModalDialog
          isOpen={Boolean(briefingTest)}
          onClose={() => setBriefingTest(null)}
          title={`Test Instructions: ${briefingTest.title}`}
          subtitle="Review the exam rules and configure your timing before starting the clock."
        >
          <div className="space-y-4 text-xs text-[#48564D]">
            <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-2">
              <div className="font-semibold text-[#14241B]">
                Checkpoint Rules &amp; Navigation:
              </div>
              <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                <li>
                  This paper contains{" "}
                  <strong>{briefingTest.questionIds.length} questions</strong>{" "}
                  from your {briefingTest.targetExam} syllabus.
                </li>
                <li>
                  Use the <strong>Question Navigator</strong> palette on the
                  right to jump to any question, see answered/unanswered status,
                  or flag questions with <strong>Mark for Review</strong>.
                </li>
                <li>
                  Answers are not revealed until you confirm and submit the
                  test.
                </li>
                <li>
                  <strong>Curriculum Honesty:</strong> This is a curated
                  Vidyakshara practice checkpoint, not an official NTA past
                  examination paper.
                </li>
              </ul>
            </div>

            {/* Configurable Duration & Negative Marking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mock-duration-select"
                  className="block font-semibold text-[#14241B] mb-1"
                >
                  Configured Duration
                </label>
                <select
                  id="mock-duration-select"
                  value={configuredMinutes}
                  onChange={(e) => setConfiguredMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#14241B]"
                >
                  <option value={10}>10 Minutes (Speed Drill)</option>
                  <option value={15}>15 Minutes (Standard Checkpoint)</option>
                  <option value={25}>25 Minutes (Relaxed Timing)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="mock-marking-select"
                  className="block font-semibold text-[#14241B] mb-1"
                >
                  Marking Scheme
                </label>
                <select
                  id="mock-marking-select"
                  value={negativeMarkingEnabled ? "standard" : "no-negative"}
                  onChange={(e) =>
                    setNegativeMarkingEnabled(e.target.value === "standard")
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#14241B]"
                >
                  <option value="standard">
                    +{briefingTest.markingScheme.correct} Correct /{" "}
                    {briefingTest.markingScheme.incorrect} Incorrect / 0
                    Unanswered
                  </option>
                  <option value="no-negative">
                    +{briefingTest.markingScheme.correct} Correct / 0 Incorrect
                    (No Negative Marking)
                  </option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBriefingTest(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleBeginTestFromBriefing}
              >
                <Play className="w-3.5 h-3.5" />
                Begin Timed Test ({configuredMinutes} mins)
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
