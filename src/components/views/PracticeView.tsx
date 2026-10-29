import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flag,
  RotateCcw,
  Target,
} from "lucide-react";
import {
  ActivePracticeSession,
  AppRoute,
  ClassLevel,
  QuestionType,
  StudentLearningState,
  SubjectId,
} from "../../types/domain";
import { QUESTIONS, SUBJECTS, TOPICS } from "../../data/curriculum";
import {
  Button,
  MetaLine,
  ProgressBar,
  SegmentedControl,
} from "../ui/Primitives";
import {
  QuestionCard,
  QuestionSubmissionPayload,
} from "../questions/QuestionCard";
import { MarkdownContent } from "../ui/MathAndDiagrams";

interface PracticeViewProps {
  state: StudentLearningState;
  initialSubjectId?: SubjectId;
  initialChapterId?: string;
  initialTopicId?: string;
  onRecordAttempt: (payload: QuestionSubmissionPayload) => void;
  onToggleBookmark: (questionId: string) => void;
  onUpdatePracticeSession: (session: ActivePracticeSession | null) => void;
  onNavigate: (
    route: AppRoute,
    options?: {
      subjectId?: SubjectId;
      chapterId?: string;
      topicId?: string;
      prefillDoubt?: string;
    }
  ) => void;
}

export function PracticeView({
  state,
  initialSubjectId,
  initialChapterId,
  initialTopicId,
  onRecordAttempt,
  onToggleBookmark,
  onUpdatePracticeSession,
  onNavigate,
}: PracticeViewProps) {
  const profile = state.profile!;
  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );

  const savedSession = state.activePracticeSession;

  const [subjectFilter, setSubjectFilter] = useState<"all" | SubjectId>(
    initialSubjectId || savedSession?.subjectFilter || "all"
  );
  const [classFilter, setClassFilter] = useState<"all" | ClassLevel>(
    savedSession?.classFilter || "all"
  );
  const [chapterFilter, setChapterFilter] = useState<string>(
    initialChapterId || savedSession?.chapterFilter || "all"
  );
  const [topicFilter, setTopicFilter] = useState<string>(
    initialTopicId || savedSession?.topicFilter || "all"
  );
  const [questionTypeFilter, setQuestionTypeFilter] = useState<
    "all" | QuestionType
  >(savedSession?.questionTypeFilter || "all");

  const [currentIdx, setCurrentIdx] = useState<number>(
    savedSession?.currentQuestionIndex || 0
  );
  const [sessionSubmittedIds, setSessionSubmittedIds] = useState<string[]>(
    savedSession?.submittedQuestionIds || []
  );
  const [showSessionSummary, setShowSessionSummary] = useState<boolean>(false);

  useEffect(() => {
    if (initialSubjectId) {
      setSubjectFilter(initialSubjectId);
      setCurrentIdx(0);
      setShowSessionSummary(false);
    }
    if (initialChapterId) {
      setChapterFilter(initialChapterId);
      setCurrentIdx(0);
      setShowSessionSummary(false);
    }
    if (initialTopicId) {
      setTopicFilter(initialTopicId);
      setCurrentIdx(0);
      setShowSessionSummary(false);
    }
  }, [initialSubjectId, initialChapterId, initialTopicId]);

  const filteredQuestions = QUESTIONS.filter((q) => {
    const subjAllowed = applicableSubjects.some((s) => s.id === q.subjectId);
    if (!subjAllowed && subjectFilter === "all") return false;
    if (subjectFilter !== "all" && q.subjectId !== subjectFilter) return false;
    if (classFilter !== "all" && q.classLevel !== classFilter) return false;
    if (chapterFilter !== "all" && q.chapterId !== chapterFilter) return false;
    if (topicFilter !== "all" && q.topicId !== topicFilter) return false;
    if (
      questionTypeFilter !== "all" &&
      q.questionType !== questionTypeFilter
    ) {
      return false;
    }
    return true;
  });

  const safeIndex = Math.min(
    Math.max(0, currentIdx),
    Math.max(0, filteredQuestions.length - 1)
  );
  const activeQuestion = filteredQuestions[safeIndex];

  // Persist active practice session for Save & Resume
  useEffect(() => {
    if (filteredQuestions.length === 0) return;
    onUpdatePracticeSession({
      id: savedSession?.id || "session-active",
      startedAt: savedSession?.startedAt || "Current session",
      subjectFilter,
      classFilter,
      chapterFilter,
      topicFilter,
      questionTypeFilter,
      currentQuestionIndex: safeIndex,
      questionIds: filteredQuestions.map((q) => q.id),
      submittedQuestionIds: sessionSubmittedIds,
    });
  }, [
    subjectFilter,
    classFilter,
    chapterFilter,
    topicFilter,
    questionTypeFilter,
    safeIndex,
    sessionSubmittedIds.length,
  ]);

  const handleQuestionSubmitted = (payload: QuestionSubmissionPayload) => {
    onRecordAttempt(payload);
    setSessionSubmittedIds((prev) =>
      prev.includes(payload.questionId) ? prev : [...prev, payload.questionId]
    );
  };

  const handleResetFilters = () => {
    setSubjectFilter("all");
    setClassFilter("all");
    setChapterFilter("all");
    setTopicFilter("all");
    setQuestionTypeFilter("all");
    setCurrentIdx(0);
    setShowSessionSummary(false);
  };

  const handleStartFreshSession = () => {
    setSessionSubmittedIds([]);
    setCurrentIdx(0);
    setShowSessionSummary(false);
  };

  // Calculate real session metrics from actual attempts on the filtered question set
  const sessionResults = filteredQuestions.map((q) => {
    const latestAttempt = [...state.attempts]
      .reverse()
      .find((a) => a.questionId === q.id);
    return { question: q, attempt: latestAttempt };
  });

  const attemptedInSet = sessionResults.filter((r) => Boolean(r.attempt));
  const correctInSet = attemptedInSet.filter((r) => r.attempt?.isCorrect);
  const incorrectInSet = attemptedInSet.filter(
    (r) => r.attempt && !r.attempt.isCorrect
  );

  const totalMarksScored = attemptedInSet.reduce(
    (sum, r) =>
      sum +
      (r.attempt?.marksAwarded !== undefined
        ? r.attempt.marksAwarded
        : r.attempt?.isCorrect
        ? r.question.marks.correct
        : r.question.marks.incorrect),
    0
  );
  const maxPossibleMarks = filteredQuestions.reduce(
    (sum, q) => sum + q.marks.correct,
    0
  );

  const accuracyPct =
    attemptedInSet.length > 0
      ? Math.round((correctInSet.length / attemptedInSet.length) * 100)
      : 0;

  // Identify weak topics from incorrect attempts in this session
  const weakTopicIdsInSet = Array.from(
    new Set(incorrectInSet.map((r) => r.question.topicId))
  );
  const weakTopicsInSet = TOPICS.filter((t) =>
    weakTopicIdsInSet.includes(t.id)
  );

  return (
    <div className="space-y-8">
      {/* Top Practice Session Header & Filters */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <MetaLine
              items={[
                "Exam-Style Question Practice",
                "Single MCQ · Multiple-Correct · Numerical",
                profile.targetExam,
              ]}
            />
            <h1 className="text-2xl font-bold text-[#14241B]">
              Practise questions with instant feedback and trap analysis
            </h1>
          </div>

          {/* Live Session Score & Progress Strip */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC]">
            <div>
              <div className="text-[11px] text-[#6E7B72]">Session Progress</div>
              <div className="text-sm font-mono font-semibold tabular-nums text-[#14241B]">
                {attemptedInSet.length} / {filteredQuestions.length} answered
              </div>
            </div>
            <div className="h-7 w-px bg-[#E2E5DC]" />
            <div>
              <div className="text-[11px] text-[#6E7B72]">Session Marks</div>
              <div className="text-sm font-mono font-semibold tabular-nums text-[#164A31]">
                {totalMarksScored} / {maxPossibleMarks}
              </div>
            </div>
            <div className="h-7 w-px bg-[#E2E5DC]" />
            <Button
              type="button"
              variant={showSessionSummary ? "primary" : "secondary"}
              size="sm"
              onClick={() => setShowSessionSummary((v) => !v)}
            >
              {showSessionSummary ? "Return to Questions" : "Session Summary"}
            </Button>
          </div>
        </div>

        {/* Filter Bar: Subject + Question Format */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E2E5DC]">
          <SegmentedControl
            ariaLabel="Filter by Subject"
            value={subjectFilter}
            onChange={(val) => {
              setSubjectFilter(val);
              setChapterFilter("all");
              setTopicFilter("all");
              setCurrentIdx(0);
              setShowSessionSummary(false);
            }}
            options={[
              { id: "all", label: "All Subjects" },
              ...applicableSubjects.map((s) => ({
                id: s.id,
                label: s.name,
              })),
            ]}
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <SegmentedControl
              ariaLabel="Filter by Question Format"
              value={questionTypeFilter}
              onChange={(val) => {
                setQuestionTypeFilter(val);
                setCurrentIdx(0);
                setShowSessionSummary(false);
              }}
              options={[
                { id: "all", label: "All Formats" },
                { id: "single-choice", label: "Single MCQ" },
                { id: "multiple-choice", label: "Multi-Correct" },
                { id: "numerical", label: "Numerical" },
              ]}
            />

            {(chapterFilter !== "all" || topicFilter !== "all") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setChapterFilter("all");
                  setTopicFilter("all");
                  setCurrentIdx(0);
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Topic Filter
              </Button>
            )}
          </div>
        </div>

        {/* Save & Resume Transparency Note */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E7B72] pt-1">
          <span>
            Your current question position and answers are automatically saved in this browser so you can resume anytime.
          </span>
          <span>
            All questions are illustrative exam-style practice problems verified for conceptual accuracy.
          </span>
        </div>
      </section>

      {/* Empty Filter State */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white border border-[#E2E5DC] rounded-xl p-10 text-center space-y-4">
          <h2 className="text-lg font-semibold text-[#14241B]">
            No questions match this exact filter combination
          </h2>
          <p className="text-sm text-[#48564D] max-w-md mx-auto">
            Reset the question format or subject filter to practise all available questions.
          </p>
          <Button type="button" variant="secondary" onClick={handleResetFilters}>
            Reset All Filters
          </Button>
        </div>
      ) : showSessionSummary ? (
        /* =====================================================================
           SESSION COMPLETION & CONSTRUCTIVE FEEDBACK SUMMARY
           ===================================================================== */
        <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#E2E5DC]">
            <div className="space-y-1.5">
              <MetaLine
                items={[
                  "Practice Session Results & Insights",
                  `${attemptedInSet.length} of ${filteredQuestions.length} Questions Attempted`,
                  attemptedInSet.length < 3
                    ? "Limited Evidence (<3 questions)"
                    : "Meaningful Session Sample",
                ]}
              />
              <h2 className="text-2xl font-bold text-[#14241B]">
                {attemptedInSet.length === 0
                  ? "Start answering questions to build your session insights"
                  : attemptedInSet.length < 3
                  ? `Initial signal (${correctInSet.length}/${attemptedInSet.length} correct) — attempt at least 3 questions to confirm a trend`
                  : accuracyPct >= 75
                  ? "Strong performance across this practice set!"
                  : "Good effort! Reviewing your mistakes now will lock in these concepts."}
              </h2>
              <p className="text-xs text-[#6E7B72]">
                Vidyakshara never infers mastery from a single question. Attempt at least 3 questions per topic for a reliable accuracy trend.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowSessionSummary(false)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Question {safeIndex + 1}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStartFreshSession}
              >
                Practise Set from Q1
              </Button>
            </div>
          </div>

          {/* 5-Column Session Metrics (Correct, Incorrect, Unanswered, Accuracy, Marks) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC]">
            <div>
              <div className="text-xs text-[#6E7B72]">Correct</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#164A31] mt-1">
                {correctInSet.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">Incorrect</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#B45309] mt-1">
                {incorrectInSet.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">Unanswered</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#6E7B72] mt-1">
                {filteredQuestions.length - attemptedInSet.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">Accuracy</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#14241B] mt-1">
                {attemptedInSet.length > 0 ? `${accuracyPct}%` : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6E7B72]">Net Marks</div>
              <div className="text-2xl font-mono font-bold tabular-nums text-[#164A31] mt-1">
                {totalMarksScored} / {maxPossibleMarks}
              </div>
            </div>
          </div>

          {/* Questions Worth Reviewing */}
          {incorrectInSet.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-[#14241B]">
                Questions worth reviewing ({incorrectInSet.length})
              </h3>
              <div className="divide-y divide-[#E2E5DC] border border-[#E2E5DC] rounded-xl bg-[#FAF8F3] px-4">
                {incorrectInSet.map(({ question: mq }) => {
                  const qIndex = filteredQuestions.findIndex(
                    (fq) => fq.id === mq.id
                  );
                  return (
                    <div
                      key={mq.id}
                      className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 max-w-2xl">
                        <MetaLine
                          items={[
                            `Question ${qIndex + 1}`,
                            mq.subjectId.toUpperCase(),
                            mq.keyConceptTested,
                          ]}
                        />
                        <div className="text-xs sm:text-sm font-medium text-[#14241B] line-clamp-1">
                          <MarkdownContent content={mq.questionText} inline />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (qIndex >= 0) setCurrentIdx(qIndex);
                          setShowSessionSummary(false);
                        }}
                      >
                        Review Question {qIndex + 1} →
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Constructive Next Action: Underlying Concepts to Review OR Next Challenge */}
          {weakTopicsInSet.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#14241B]">
                Underlying concepts to review before your next practice set ({weakTopicsInSet.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakTopicsInSet.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <MetaLine
                        items={[
                          t.subjectId.toUpperCase(),
                          `Class ${t.classLevel}`,
                        ]}
                      />
                      <h4 className="text-base font-semibold text-[#14241B]">
                        {t.title}
                      </h4>
                      <p className="text-xs text-[#48564D] leading-relaxed">
                        {t.summary}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          onNavigate("learn", {
                            subjectId: t.subjectId,
                            topicId: t.id,
                          })
                        }
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Review Concept &amp; Worked Example
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onNavigate("revision")}
                      >
                        Open Revision Session
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-[#EAF2EC] border border-[#164A31]/30 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[#14241B]">
                  Ready for your next step?
                </div>
                <p className="text-xs text-[#48564D]">
                  Try our JEE Advanced multiple-correct questions or take a 15-minute timed checkpoint mock test.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuestionTypeFilter("multiple-choice");
                    setShowSessionSummary(false);
                    setCurrentIdx(0);
                  }}
                >
                  Try Multi-Correct Challenge
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate("mock-tests")}
                >
                  Open Timed Mock Test
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* =====================================================================
           ACTIVE QUESTION NAVIGATION & PRACTICE WORKSPACE
           ===================================================================== */
        <div className="space-y-6">
          {/* Question Navigator Strip */}
          <div className="bg-white border border-[#E2E5DC] rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {filteredQuestions.map((q, idx) => {
                  const att = [...state.attempts]
                    .reverse()
                    .find((a) => a.questionId === q.id);
                  const isCurrent = idx === safeIndex;

                  let pillClass =
                    "bg-[#FAF8F3] border-[#E2E5DC] text-[#48564D]";
                  if (att?.isCorrect) {
                    pillClass = "bg-[#EAF2EC] border-[#164A31] text-[#164A31]";
                  } else if (att && !att.isCorrect) {
                    pillClass = "bg-[#FFFBEB] border-[#D97706] text-[#B45309]";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`w-9 h-9 rounded-lg border font-mono text-xs font-semibold tabular-nums shrink-0 transition-colors cursor-pointer ${pillClass} ${
                        isCurrent ? "ring-2 ring-[#14241B] ring-offset-1" : ""
                      }`}
                      aria-label={`Question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={safeIndex === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Prev
                </Button>
                {safeIndex < filteredQuestions.length - 1 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setCurrentIdx((i) =>
                        Math.min(filteredQuestions.length - 1, i + 1)
                      )
                    }
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setShowSessionSummary(true)}
                  >
                    Finish Session
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <ProgressBar
              label={`Question ${safeIndex + 1} of ${filteredQuestions.length}`}
              value={attemptedInSet.length}
              max={filteredQuestions.length}
              valueLabel={`${attemptedInSet.length}/${filteredQuestions.length} completed`}
              tone="forest"
            />
          </div>

          {/* Active Question Card */}
          {activeQuestion && (
            <QuestionCard
              key={activeQuestion.id}
              question={activeQuestion}
              questionNumber={safeIndex + 1}
              totalQuestions={filteredQuestions.length}
              existingAttempt={[...state.attempts]
                .reverse()
                .find((a) => a.questionId === activeQuestion.id)}
              isBookmarked={state.bookmarkedQuestionIds.includes(
                activeQuestion.id
              )}
              targetExam={profile.targetExam}
              onRecordAttempt={handleQuestionSubmitted}
              onToggleBookmark={onToggleBookmark}
              onReviewConcept={(subjId, topId) =>
                onNavigate("learn", { subjectId: subjId, topicId: topId })
              }
              onNextQuestion={() => {
                if (safeIndex < filteredQuestions.length - 1) {
                  setCurrentIdx(safeIndex + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setShowSessionSummary(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              onAskDoubtAboutQuestion={(prefill) =>
                onNavigate("doubts", {
                  subjectId: activeQuestion.subjectId,
                  prefillDoubt: prefill,
                })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
