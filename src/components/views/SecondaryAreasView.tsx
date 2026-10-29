import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Database,
  FilePlus2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  AppRoute,
  ClassLevel,
  StudentLearningState,
  StudentProfile,
  SubjectId,
  TargetExam,
  Topic,
} from "../../types/domain";
import { QUESTIONS, SUBJECTS, TOPICS } from "../../data/curriculum";
import {
  computeSubjectInsights,
  computeTopicInsights,
} from "../../utils/personalisation";
import {
  Button,
  MetaLine,
  ProgressBar,
  SegmentedControl,
} from "../ui/Primitives";
import { MarkdownContent, MathRenderer } from "../ui/MathAndDiagrams";
import {
  QuestionCard,
  QuestionSubmissionPayload,
} from "../questions/QuestionCard";

/* ============================================================================
 * AREA 6: REVISION SYSTEM — Mistakes, saved items, spaced revision, & sessions
 * ========================================================================== */

interface RevisionViewProps {
  state: StudentLearningState;
  onRecordAttempt: (payload: QuestionSubmissionPayload) => void;
  onToggleBookmark: (questionId: string) => void;
  onToggleBookmarkTopic: (topicId: string) => void;
  onCompleteRevisionSession: (
    topicId: string,
    confidenceLevel: "needs-work" | "steady" | "confident",
    questionsReviewedCount: number,
    questionsResolvedCount: number
  ) => void;
  onNavigate: (
    route: AppRoute,
    options?: { subjectId?: SubjectId; topicId?: string; prefillDoubt?: string }
  ) => void;
}

export function RevisionView({
  state,
  onRecordAttempt,
  onToggleBookmark,
  onToggleBookmarkTopic,
  onCompleteRevisionSession,
  onNavigate,
}: RevisionViewProps) {
  const profile = state.profile!;
  const [tab, setTab] = useState<
    "mistakes" | "saved" | "spaced-topics" | "sessions"
  >("mistakes");

  // Active Interactive Revision Session State
  const [activeSessionTopic, setActiveSessionTopic] = useState<Topic | null>(
    null
  );
  const [sessionStep, setSessionStep] = useState<"concept" | "practice">(
    "concept"
  );
  const [sessionQuestionIds, setSessionQuestionIds] = useState<string[]>([]);
  const [sessionAttemptedIds, setSessionAttemptedIds] = useState<string[]>([]);
  const [sessionResolvedIds, setSessionResolvedIds] = useState<string[]>([]);
  const [selectedConfidence, setSelectedConfidence] = useState<
    "needs-work" | "steady" | "confident"
  >("steady");

  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );
  const applicableTopicIds = applicableSubjects.flatMap((s) =>
    s.chapters.flatMap((c) => c.topicIds)
  );
  const applicableTopics = TOPICS.filter((t) =>
    applicableTopicIds.includes(t.id)
  );

  // Track latest attempt per question to distinguish unresolved mistakes from resolved ones
  const latestAttemptByQuestion = new Map<string, boolean>();
  state.attempts.forEach((att) => {
    latestAttemptByQuestion.set(att.questionId, att.isCorrect);
  });

  // All questions ever answered incorrectly or marked for revision
  const allMistakeHistoryQuestionIds = Array.from(
    new Set(
      state.attempts
        .filter((a) => !a.isCorrect || a.markedForRevision)
        .map((a) => a.questionId)
    )
  );
  const mistakeQuestions = QUESTIONS.filter((q) =>
    allMistakeHistoryQuestionIds.includes(q.id)
  );
  const unresolvedMistakeQuestions = mistakeQuestions.filter(
    (q) => latestAttemptByQuestion.get(q.id) === false
  );

  // Saved questions & saved topics
  const savedQuestions = QUESTIONS.filter((q) =>
    state.bookmarkedQuestionIds.includes(q.id)
  );
  const bookmarkedTopicIds = state.bookmarkedTopicIds || [];
  const savedTopics = TOPICS.filter((t) => bookmarkedTopicIds.includes(t.id));

  // Previously studied topics + topics with mistakes + flagged topics for Spaced Revision
  const topicInsights = computeTopicInsights(state);
  const revisionTopics = topicInsights.filter(
    (ti) =>
      ti.isCompleted ||
      ti.attemptCount > 0 ||
      ti.isBookmarked ||
      Boolean(state.revisionRecords?.[ti.topic.id])
  );

  const handleStartTopicRevisionSession = (topic: Topic) => {
    const topicQs = QUESTIONS.filter((q) => q.topicId === topic.id).map(
      (q) => q.id
    );
    setActiveSessionTopic(topic);
    setSessionStep("concept");
    setSessionQuestionIds(topicQs);
    setSessionAttemptedIds([]);
    setSessionResolvedIds([]);
    setSelectedConfidence("steady");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSessionQuestionAttempt = (payload: QuestionSubmissionPayload) => {
    onRecordAttempt(payload);
    setSessionAttemptedIds((prev) =>
      prev.includes(payload.questionId) ? prev : [...prev, payload.questionId]
    );
    if (payload.isCorrect) {
      setSessionResolvedIds((prev) =>
        prev.includes(payload.questionId) ? prev : [...prev, payload.questionId]
      );
    }
  };

  const handleFinishRevisionSession = () => {
    if (!activeSessionTopic) return;
    onCompleteRevisionSession(
      activeSessionTopic.id,
      selectedConfidence,
      sessionAttemptedIds.length,
      sessionResolvedIds.length
    );
    setActiveSessionTopic(null);
    setTab("sessions");
  };

  /* =========================================================================
   * ACTIVE INTERACTIVE REVISION SESSION WORKFLOW
   * ======================================================================= */
  if (activeSessionTopic) {
    const sessionQuestions = QUESTIONS.filter((q) =>
      sessionQuestionIds.includes(q.id)
    );

    return (
      <div className="space-y-8">
        <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <MetaLine
                items={[
                  "Active Revision Session",
                  activeSessionTopic.subjectId.toUpperCase(),
                  `Step ${sessionStep === "concept" ? "1 of 2: Concept Review" : "2 of 2: Re-attempt Questions"}`,
                ]}
              />
              <h1 className="text-2xl font-bold text-[#14241B]">
                Revising: {activeSessionTopic.title}
              </h1>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setActiveSessionTopic(null)}
            >
              <ArrowLeft className="w-4 h-4" />
              Exit Session
            </Button>
          </div>

          <SegmentedControl
            ariaLabel="Revision session step"
            value={sessionStep}
            onChange={setSessionStep}
            options={[
              { id: "concept", label: "1. Review Concept & Formulas" },
              {
                id: "practice",
                label: "2. Re-attempt Questions & Log Session",
                count: sessionQuestions.length,
              },
            ]}
          />
        </section>

        {sessionStep === "concept" ? (
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#164A31] uppercase tracking-wider">
                Core Concept Refresher
              </span>
              <MarkdownContent
                content={activeSessionTopic.intuitiveIntro}
                className="text-sm sm:text-base text-[#14241B] leading-relaxed"
              />
            </div>

            {/* Formulas to Remember */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-[#14241B]">
                Formulas &amp; Definitions to Check Before Practising
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSessionTopic.definitionsAndFormulas.map((df, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-[#14241B]">
                      <MarkdownContent content={df.term} inline />
                    </div>
                    {df.formula && (
                      <MathRenderer
                        expression={df.formula}
                        block
                        variant="plain"
                      />
                    )}
                    <div className="text-xs text-[#48564D] leading-relaxed">
                      <MarkdownContent content={df.meaning} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="p-5 rounded-xl bg-[#EAF2EC] border border-[#164A31]/25 space-y-2.5">
              <h3 className="text-xs font-semibold text-[#164A31] uppercase tracking-wider">
                Key Exam Takeaways
              </h3>
              <ul className="space-y-2">
                {activeSessionTopic.keyTakeaways.map((kt, idx) => (
                  <li
                    key={idx}
                    className="text-xs sm:text-sm text-[#14241B] flex items-start gap-2"
                  >
                    <span className="font-mono font-semibold text-[#164A31]">
                      0{idx + 1}.
                    </span>
                    <MarkdownContent content={kt} inline />
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  onNavigate("learn", {
                    subjectId: activeSessionTopic.subjectId,
                    topicId: activeSessionTopic.id,
                  })
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Full Lesson &amp; Simulator
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => setSessionStep("practice")}
              >
                Proceed to Step 2: Re-attempt Questions ({sessionQuestions.length})
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </section>
        ) : (
          <div className="space-y-6">
            {sessionQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                questionNumber={idx + 1}
                totalQuestions={sessionQuestions.length}
                existingAttempt={[...state.attempts]
                  .reverse()
                  .find((a) => a.questionId === q.id)}
                isBookmarked={state.bookmarkedQuestionIds.includes(q.id)}
                targetExam={profile.targetExam}
                onRecordAttempt={handleSessionQuestionAttempt}
                onToggleBookmark={onToggleBookmark}
                onReviewConcept={() => setSessionStep("concept")}
                onAskDoubtAboutQuestion={(prefill) =>
                  onNavigate("doubts", {
                    subjectId: q.subjectId,
                    topicId: q.topicId,
                    prefillDoubt: prefill,
                  })
                }
              />
            ))}

            {/* Complete & Log Spaced Revision Session Box */}
            <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-[#14241B]">
                  Complete Revision Session &amp; Update Spaced Schedule
                </h2>
                <p className="text-xs text-[#48564D]">
                  How confident do you feel with{" "}
                  <strong>{activeSessionTopic.title}</strong> after this review?
                  Your choice sets the next spaced revision interval.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      id: "needs-work",
                      label: "Still Needs Work",
                      desc: "Schedule next review in 1 day",
                    },
                    {
                      id: "steady",
                      label: "Getting Steady",
                      desc: "Schedule next review in 3 days",
                    },
                    {
                      id: "confident",
                      label: "Confident",
                      desc: "Schedule next review in 7 days",
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedConfidence(opt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      selectedConfidence === opt.id
                        ? "bg-[#EAF2EC] border-[#164A31] text-[#14241B]"
                        : "bg-[#FAF8F3] border-[#E2E5DC] text-[#48564D] hover:border-[#164A31]"
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#14241B]">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-[#6E7B72] mt-0.5">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleFinishRevisionSession}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Revision Session to History
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================================
   * STANDARD REVISION HUB
   * ======================================================================= */
  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <MetaLine
              items={[
                "Targeted Exam Revision & Spaced Review",
                `${unresolvedMistakeQuestions.length} Unresolved Mistakes`,
                `${savedQuestions.length + savedTopics.length} Saved Items`,
                `${(state.revisionSessions || []).length} Completed Sessions`,
              ]}
            />
            <h1 className="text-2xl font-bold text-[#14241B]">
              Resolve mistakes, revisit saved concepts, and run revision sessions
            </h1>
          </div>

          {applicableTopics.length > 0 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const targetTopic =
                  revisionTopics.find(
                    (rt) => rt.unresolvedMistakeQuestionIds.length > 0
                  )?.topic ||
                  savedTopics[0] ||
                  applicableTopics[0];
                if (targetTopic) handleStartTopicRevisionSession(targetTopic);
              }}
            >
              <Play className="w-3.5 h-3.5" />
              Start Guided Revision Session
            </Button>
          )}
        </div>

        <SegmentedControl
          ariaLabel="Revision Category"
          value={tab}
          onChange={setTab}
          options={[
            {
              id: "mistakes",
              label: "Mistakes to Review",
              count: mistakeQuestions.length,
            },
            {
              id: "saved",
              label: "Saved Questions & Concepts",
              count: savedQuestions.length + savedTopics.length,
            },
            {
              id: "spaced-topics",
              label: "Topics & Spaced Schedule",
              count: applicableTopics.length,
            },
            {
              id: "sessions",
              label: "Revision History",
              count: (state.revisionSessions || []).length,
            },
          ]}
        />
      </section>

      {/* TAB 1: MISTAKES TO REVIEW */}
      {tab === "mistakes" && (
        <div className="space-y-6">
          {mistakeQuestions.length === 0 ? (
            <div className="bg-white border border-[#E2E5DC] rounded-xl p-10 text-center space-y-4">
              <h2 className="text-lg font-semibold text-[#14241B]">
                No mistakes recorded in your log yet
              </h2>
              <p className="text-sm text-[#48564D] max-w-md mx-auto">
                Whenever you miss a question in Practice, it automatically appears here so you can review the concept, retry the question, and track whether you resolved it.
              </p>
              <Button
                type="button"
                variant="primary"
                onClick={() => onNavigate("practice")}
              >
                Start Practising Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3 text-xs text-[#48564D]">
                <span>
                  Showing <strong>{mistakeQuestions.length}</strong> question
                  {mistakeQuestions.length === 1 ? "" : "s"} from your mistake
                  log ({unresolvedMistakeQuestions.length} still unresolved,{" "}
                  {mistakeQuestions.length - unresolvedMistakeQuestions.length}{" "}
                  resolved on re-attempt).
                </span>
                <span>
                  Click &ldquo;Try Question Again&rdquo; on any card to re-attempt and update your revision record.
                </span>
              </div>

              {mistakeQuestions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  questionNumber={idx + 1}
                  totalQuestions={mistakeQuestions.length}
                  existingAttempt={[...state.attempts]
                    .reverse()
                    .find((a) => a.questionId === q.id)}
                  isBookmarked={state.bookmarkedQuestionIds.includes(q.id)}
                  targetExam={profile.targetExam}
                  onRecordAttempt={onRecordAttempt}
                  onToggleBookmark={onToggleBookmark}
                  onReviewConcept={(subjId, topId) =>
                    onNavigate("learn", { subjectId: subjId, topicId: topId })
                  }
                  onAskDoubtAboutQuestion={(prefill) =>
                    onNavigate("doubts", {
                      subjectId: q.subjectId,
                      topicId: q.topicId,
                      prefillDoubt: prefill,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED QUESTIONS & CONCEPTS */}
      {tab === "saved" && (
        <div className="space-y-8">
          {/* Saved Concepts Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#14241B]">
                Topics &amp; Concepts Flagged to Revisit ({savedTopics.length})
              </h2>
            </div>

            {savedTopics.length === 0 ? (
              <div className="bg-white border border-[#E2E5DC] rounded-xl p-6 text-xs text-[#6E7B72]">
                You haven&apos;t flagged any topics to revisit yet. You can flag any topic in the{" "}
                <button
                  type="button"
                  onClick={() => setTab("spaced-topics")}
                  className="text-[#164A31] font-semibold hover:underline cursor-pointer"
                >
                  Topics &amp; Spaced Schedule
                </button>{" "}
                tab or after a Mock Test.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white border border-[#E2E5DC] rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-1.5">
                      <MetaLine
                        items={[
                          topic.subjectId.toUpperCase(),
                          `Class ${topic.classLevel}`,
                          "Saved to Revisit",
                        ]}
                      />
                      <h3 className="text-base font-semibold text-[#14241B]">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-[#48564D] leading-relaxed">
                        {topic.summary}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartTopicRevisionSession(topic)}
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Revision Session
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            onNavigate("learn", {
                              subjectId: topic.subjectId,
                              topicId: topic.id,
                            })
                          }
                        >
                          Open Lesson
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleBookmarkTopic(topic.id)}
                        className="text-xs text-[#6E7B72] hover:text-[#9B1C1C] cursor-pointer"
                      >
                        Remove flag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Saved Questions Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#14241B]">
              Bookmarked Practice Questions ({savedQuestions.length})
            </h2>
            {savedQuestions.length === 0 ? (
              <div className="bg-white border border-[#E2E5DC] rounded-xl p-8 text-center space-y-3">
                <p className="text-sm text-[#48564D]">
                  Click &ldquo;Save Question&rdquo; on any question in Practice to keep it here for pre-exam revision.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate("practice")}
                >
                  Browse Practice Questions
                </Button>
              </div>
            ) : (
              savedQuestions.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  questionNumber={idx + 1}
                  totalQuestions={savedQuestions.length}
                  existingAttempt={[...state.attempts]
                    .reverse()
                    .find((a) => a.questionId === q.id)}
                  isBookmarked={true}
                  targetExam={profile.targetExam}
                  onRecordAttempt={onRecordAttempt}
                  onToggleBookmark={onToggleBookmark}
                  onReviewConcept={(subjId, topId) =>
                    onNavigate("learn", { subjectId: subjId, topicId: topId })
                  }
                  onAskDoubtAboutQuestion={(prefill) =>
                    onNavigate("doubts", {
                      subjectId: q.subjectId,
                      topicId: q.topicId,
                      prefillDoubt: prefill,
                    })
                  }
                />
              ))
            )}
          </section>
        </div>
      )}

      {/* TAB 3: TOPICS TO REVISIT & SPACED REVISION SCHEDULING */}
      {tab === "spaced-topics" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#EBF3F9] border border-[#C5DDF0] text-xs text-[#184E77] leading-relaxed">
            <strong>How Spaced Revision Works:</strong> Topics with unresolved
            mistakes are scheduled for immediate recovery. As you complete
            guided Revision Sessions and mark your confidence, the suggested
            review interval expands from 1 day → 3 days → 7 days.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topicInsights.map((ti) => {
              const { topic } = ti;
              const revRec = state.revisionRecords?.[topic.id];
              const isFlagged = bookmarkedTopicIds.includes(topic.id);

              const scheduleLabel =
                ti.unresolvedMistakeQuestionIds.length > 0
                  ? "Due Today — Mistake Recovery"
                  : revRec
                  ? `Next Review: ${revRec.nextSuggestedReview} (Reviewed ${revRec.revisionCount}×)`
                  : ti.isCompleted
                  ? "Studied — Ready for first 3-day spaced review"
                  : "Not studied yet";

              return (
                <div
                  key={topic.id}
                  className="bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <MetaLine
                        items={[
                          topic.subjectId.toUpperCase(),
                          `Class ${topic.classLevel}`,
                          ti.isCompleted
                            ? "Concept Completed"
                            : "Concept Unfinished",
                        ]}
                      />
                      <button
                        type="button"
                        onClick={() => onToggleBookmarkTopic(topic.id)}
                        className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer ${
                          isFlagged
                            ? "text-[#164A31] font-semibold"
                            : "text-[#6E7B72] hover:text-[#14241B]"
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {isFlagged ? "Saved to Revisit" : "Want to Revisit"}
                      </button>
                    </div>

                    <h3 className="text-lg font-semibold text-[#14241B]">
                      {topic.title}
                    </h3>

                    <p className="text-xs text-[#48564D] leading-relaxed">
                      {topic.summary}
                    </p>

                    <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-[#164A31]">
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span>{scheduleLabel}</span>
                      </div>
                      <div className="text-[#6E7B72]">{ti.statusLabel}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartTopicRevisionSession(topic)}
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start Revision Session
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onNavigate("learn", {
                          subjectId: topic.subjectId,
                          topicId: topic.id,
                        })
                      }
                    >
                      Open Concept Lesson →
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: COMPLETED REVISION SESSIONS LOG */}
      {tab === "sessions" && (
        <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#14241B]">
              Completed Revision Sessions ({(state.revisionSessions || []).length})
            </h2>
          </div>

          {(state.revisionSessions || []).length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-[#48564D] max-w-md mx-auto">
                You haven&apos;t logged a guided Revision Session yet. Start one on any topic to review its key formulas, re-attempt questions, and schedule your next spaced review.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setTab("spaced-topics")}
              >
                Choose a Topic to Revise
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E5DC]">
              {(state.revisionSessions || []).map((sess) => {
                const topic = TOPICS.find((t) => t.id === sess.topicId);
                const revRecord = sess.topicId
                  ? state.revisionRecords?.[sess.topicId]
                  : undefined;

                return (
                  <div
                    key={sess.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-[#14241B]">
                        {sess.title}
                      </h3>
                      <MetaLine
                        items={[
                          sess.subjectId.toUpperCase(),
                          sess.completedAt,
                          `${sess.questionsReviewedCount} questions reviewed (${sess.questionsResolvedCount} correct)`,
                          revRecord
                            ? `Next review: ${revRecord.nextSuggestedReview}`
                            : undefined,
                        ]}
                      />
                    </div>
                    {topic && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleStartTopicRevisionSession(topic)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revise Again
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ============================================================================
 * AREA 7: PROGRESS DASHBOARD — Honest, evidence-backed learning insights
 * ========================================================================== */

interface ProgressViewProps {
  state: StudentLearningState;
  onNavigate: (
    route: AppRoute,
    options?: { subjectId?: SubjectId; topicId?: string }
  ) => void;
}

export function ProgressView({ state, onNavigate }: ProgressViewProps) {
  const profile = state.profile!;
  const subjectInsights = computeSubjectInsights(state);
  const topicInsights = computeTopicInsights(state);

  const totalTopicsCount = topicInsights.length;
  const completedTopicsCount = topicInsights.filter((t) => t.isCompleted).length;

  const totalAttempts = state.attempts.length;
  const uniqueQuestionsPractised = new Set(
    state.attempts.map((a) => a.questionId)
  ).size;
  const correctAttempts = state.attempts.filter((a) => a.isCorrect).length;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;

  // Stronger areas: requires meaningful evidence (>=3 attempts & >=75% accuracy) OR completed concept + >=2 correct attempts with 0 unresolved mistakes
  const strongerTopics = topicInsights.filter(
    (ti) =>
      (ti.evidenceStrength === "meaningful" &&
        (ti.accuracyPct ?? 0) >= 75 &&
        ti.unresolvedMistakeQuestionIds.length === 0) ||
      (ti.isCompleted &&
        ti.correctCount >= 2 &&
        ti.unresolvedMistakeQuestionIds.length === 0)
  );

  // Topics to revise next: unresolved mistakes or low accuracy or flagged to revisit
  const topicsToReviseNext = topicInsights.filter(
    (ti) =>
      ti.unresolvedMistakeQuestionIds.length > 0 ||
      ti.isBookmarked ||
      (ti.accuracyPct !== null && ti.accuracyPct < 70)
  );

  // Build chronological accuracy over time batches (only when real attempts exist!)
  const chronologicalBatches: {
    label: string;
    attemptCount: number;
    correctCount: number;
    accuracyPct: number;
  }[] = [];

  if (state.attempts.length > 0) {
    const groups = new Map<string, { total: number; correct: number }>();
    state.attempts.forEach((att) => {
      const key = att.attemptedAt || "Recent Session";
      const curr = groups.get(key) || { total: 0, correct: 0 };
      curr.total += 1;
      if (att.isCorrect) curr.correct += 1;
      groups.set(key, curr);
    });
    groups.forEach((val, key) => {
      chronologicalBatches.push({
        label: key,
        attemptCount: val.total,
        correctCount: val.correct,
        accuracyPct: Math.round((val.correct / val.total) * 100),
      });
    });
  }

  return (
    <div className="space-y-8">
      {/* Header & Top Summary */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <MetaLine
              items={[
                profile.isDemoAccount
                  ? "Demonstration Data (Sample Student: Aarav Sharma)"
                  : "Personal Stored Activity",
                `Class ${profile.classLevel}`,
                profile.targetExam,
              ]}
            />
            <h1 className="text-2xl font-bold text-[#14241B]">
              Your learning progress, stronger areas, and topics to revise next
            </h1>
            <p className="text-xs text-[#6E7B72]">
              Every metric below is calculated directly from{" "}
              {profile.isDemoAccount
                ? "clearly labelled sample demonstration activity"
                : "your actual saved study sessions"}
              . Vidyakshara never makes unsupported predictions about exam ranks or admission chances.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onNavigate("practice")}
          >
            Practise Questions
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 4-Column Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC]">
          <div>
            <div className="text-xs text-[#6E7B72]">Topics Completed</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#14241B] mt-1">
              {completedTopicsCount} / {totalTopicsCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6E7B72]">Questions Practised</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#14241B] mt-1">
              {totalAttempts}{" "}
              <span className="text-xs font-normal text-[#6E7B72]">
                ({uniqueQuestionsPractised} unique)
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6E7B72]">Overall Accuracy</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#164A31] mt-1">
              {overallAccuracy !== null
                ? `${overallAccuracy}%`
                : "No attempts yet"}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#6E7B72]">Revision Sessions</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-[#14241B] mt-1">
              {(state.revisionSessions || []).length}
            </div>
          </div>
        </div>
      </section>

      {/* Stronger Areas & Topics to Revise Next */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Stronger Areas (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#164A31]">
              Evidence-Backed Strengths
            </span>
            <h2 className="text-lg font-bold text-[#14241B]">
              Stronger areas ({strongerTopics.length})
            </h2>
            <p className="text-xs text-[#6E7B72]">
              Requires completed concept study and consistent question accuracy with zero unresolved mistakes.
            </p>
          </div>

          {strongerTopics.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#48564D] space-y-2">
              <div className="font-semibold text-[#14241B]">
                Not enough evidence to declare strong areas yet
              </div>
              <p className="leading-relaxed">
                Complete a topic lesson and solve at least 2–3 practice questions accurately to see your stronger topics listed here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {strongerTopics.map((ti) => (
                <div
                  key={ti.topic.id}
                  className="p-4 rounded-xl bg-[#EAF2EC] border border-[#164A31]/25 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <MetaLine
                      items={[
                        ti.topic.subjectId.toUpperCase(),
                        `${ti.correctCount}/${ti.attemptCount} correct`,
                      ]}
                    />
                    <div className="text-sm font-semibold text-[#14241B]">
                      {ti.topic.title}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onNavigate("practice", {
                        subjectId: ti.topic.subjectId,
                        topicId: ti.topic.id,
                      })
                    }
                  >
                    Practise More
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topics to Revise Next (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#8F4B00]">
              Actionable Focus List
            </span>
            <h2 className="text-lg font-bold text-[#14241B]">
              Topics to revise next ({topicsToReviseNext.length})
            </h2>
            <p className="text-xs text-[#6E7B72]">
              Topics with unresolved practice mistakes or topics you explicitly flagged to revisit.
            </p>
          </div>

          {topicsToReviseNext.length === 0 ? (
            <div className="p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#48564D] space-y-2">
              <div className="font-semibold text-[#14241B]">
                No urgent revision topics flagged right now
              </div>
              <p className="leading-relaxed">
                As you practise more chapter questions or take mock tests, any topic where you slip up will be prioritised here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topicsToReviseNext.map((ti) => (
                <div
                  key={ti.topic.id}
                  className="p-4 rounded-xl bg-[#FFFBEB] border border-[#D97706]/30 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <MetaLine
                      items={[
                        ti.topic.subjectId.toUpperCase(),
                        ti.unresolvedMistakeQuestionIds.length > 0
                          ? `${ti.unresolvedMistakeQuestionIds.length} unresolved mistake`
                          : "Flagged to revisit",
                      ]}
                    />
                    <div className="text-sm font-semibold text-[#14241B]">
                      {ti.topic.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        onNavigate("learn", {
                          subjectId: ti.topic.subjectId,
                          topicId: ti.topic.id,
                        })
                      }
                    >
                      Review Concept
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate("revision")}
                    >
                      Revise
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Accuracy Over Time (Honest Empty State when 0 attempts) */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#14241B]">
              Accuracy over time
            </h2>
            <p className="text-xs text-[#6E7B72]">
              Tracks your question accuracy across practice sessions and timed mock checkpoints.
            </p>
          </div>
          {totalAttempts > 0 && totalAttempts < 3 && (
            <span className="text-xs text-[#8F4B00] font-medium">
              Limited sample ({totalAttempts} attempt{totalAttempts === 1 ? "" : "s"}) — practise more for a fuller trend
            </span>
          )}
        </div>

        {chronologicalBatches.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] text-center space-y-2">
            <div className="text-sm font-semibold text-[#14241B]">
              No practice history recorded yet
            </div>
            <p className="text-xs text-[#6E7B72] max-w-md mx-auto">
              We do not display placeholder charts when your history is empty. Answer your first few questions in Practice to see your real accuracy over time here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chronologicalBatches.map((batch, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#14241B]">
                    {batch.label}
                  </span>
                  <span className="text-xs font-mono font-bold tabular-nums text-[#164A31]">
                    {batch.accuracyPct}%
                  </span>
                </div>
                <ProgressBar
                  value={batch.correctCount}
                  max={batch.attemptCount}
                  tone="forest"
                />
                <div className="text-[11px] font-mono text-[#6E7B72]">
                  {batch.correctCount} correct out of {batch.attemptCount}{" "}
                  attempted
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subject-wise Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subjectInsights.map((subj) => (
          <div
            key={subj.subjectId}
            className="bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#14241B]">
                  {subj.subjectName}
                </h2>
                <span className="text-xs font-mono tabular-nums text-[#6E7B72]">
                  {subj.attemptCount} attempts
                </span>
              </div>

              <ProgressBar
                label="Topic Coverage"
                value={subj.completedTopics}
                max={subj.totalTopics}
                valueLabel={`${subj.completedTopics}/${subj.totalTopics}`}
                tone="forest"
              />

              <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-1">
                <div className="text-xs text-[#6E7B72]">Question Accuracy</div>
                <div className="text-base font-mono font-semibold tabular-nums text-[#14241B]">
                  {subj.accuracyPct !== null
                    ? `${subj.accuracyPct}% (${subj.correctCount}/${subj.attemptCount})`
                    : "Not practised yet"}
                </div>
                <p className="text-[11px] text-[#6E7B72] leading-relaxed pt-1">
                  {subj.insightLabel}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E5DC] flex items-center justify-between gap-2">
              <span className="text-xs text-[#48564D]">
                {subj.evidenceStrength === "none"
                  ? "Start with 3 questions"
                  : subj.evidenceStrength === "limited"
                  ? "Limited sample (<3 Qs)"
                  : "Meaningful trend"}
              </span>
              <button
                type="button"
                onClick={() =>
                  onNavigate("learn", { subjectId: subj.subjectId })
                }
                className="text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
              >
                Open {subj.subjectName} →
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ============================================================================
 * AREA 8: NOTES & RESOURCES — Student notes & supported document uploads
 * ========================================================================== */

interface NotesViewProps {
  state: StudentLearningState;
  onAddNote: (
    title: string,
    subjectId: SubjectId,
    content: string,
    attachmentName?: string,
    attachmentSizeLabel?: string
  ) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NotesView({
  state,
  onAddNote,
  onDeleteNote,
}: NotesViewProps) {
  const profile = state.profile!;
  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<SubjectId>(
    applicableSubjects[0]?.id || "physics"
  );
  const [content, setContent] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | undefined>();
  const [attachmentSize, setAttachmentSize] = useState<string | undefined>();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [filterSubj, setFilterSubj] = useState<"all" | SubjectId>("all");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError(
        "Please choose a study file smaller than 2 MB so it can be saved smoothly."
      );
      e.target.value = "";
      return;
    }

    setUploadError(null);
    setAttachmentName(file.name);
    const kb = Math.max(1, Math.round(file.size / 1024));
    setAttachmentSize(`${kb} KB`);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    if (
      file.type.startsWith("text/") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt")
    ) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setContent((prev) =>
            prev ? `${prev}\n\n${reader.result}` : (reader.result as string)
          );
        }
      };
      reader.readAsText(file);
    } else if (!content.trim()) {
      setContent(
        `Attached study document: ${file.name} (${kb} KB). Add your key formula summary or page takeaways here.`
      );
    }
    e.target.value = "";
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAddNote(
      title.trim(),
      subjectId,
      content.trim(),
      attachmentName,
      attachmentSize
    );
    setTitle("");
    setContent("");
    setAttachmentName(undefined);
    setAttachmentSize(undefined);
  };

  const visibleNotes = state.notes.filter(
    (n) => filterSubj === "all" || n.subjectId === filterSubj
  );

  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <MetaLine
            items={[
              "Personal Formula Sheets & Study Materials",
              `${state.notes.length} Saved Notes`,
            ]}
          />
          <h1 className="text-2xl font-bold text-[#14241B]">
            Notes &amp; study resources
          </h1>
        </div>

        <SegmentedControl
          ariaLabel="Filter notes by subject"
          value={filterSubj}
          onChange={setFilterSubj}
          options={[
            { id: "all", label: "All Notes" },
            ...applicableSubjects.map((s) => ({
              id: s.id,
              label: s.name,
            })),
          ]}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleCreateNote}
          className="lg:col-span-5 bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-base font-semibold text-[#14241B]">
            Create a study note or attach a document
          </h2>

          <div>
            <label
              htmlFor="note-title"
              className="block text-xs font-medium text-[#14241B] mb-1"
            >
              Note Title
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Electrostatics Cube Flux Cases"
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
            />
          </div>

          <div>
            <label
              htmlFor="note-subject"
              className="block text-xs font-medium text-[#14241B] mb-1"
            >
              Subject
            </label>
            <select
              id="note-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value as SubjectId)}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
            >
              {applicableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="note-content"
              className="block text-xs font-medium text-[#14241B] mb-1"
            >
              Formula Points &amp; Key Takeaways
            </label>
            <textarea
              id="note-content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your revision points, formulas, or paste a summary..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-dashed border-[#E2E5DC] flex items-center justify-between gap-3">
            <div className="text-xs text-[#48564D] truncate">
              {attachmentName
                ? `Attached: ${attachmentName} (${attachmentSize})`
                : "Optional: Upload PDF, TXT, or Markdown sheet (up to 2 MB)"}
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E2E5DC] text-xs font-medium text-[#14241B] hover:bg-[#F3F1EA] cursor-pointer shrink-0">
              <Upload className="w-3.5 h-3.5" />
              Choose File
              <input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C]">
              {uploadError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!title.trim() || !content.trim()}
          >
            <FilePlus2 className="w-4 h-4" />
            Save Note
          </Button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          {visibleNotes.length === 0 ? (
            <div className="bg-white border border-[#E2E5DC] rounded-xl p-10 text-center space-y-2">
              <h3 className="text-base font-semibold text-[#14241B]">
                No notes in this view yet
              </h3>
              <p className="text-xs text-[#6E7B72]">
                Add a note using the form on the left, or save formulas directly from Learn and AI Tutor.
              </p>
            </div>
          ) : (
            visibleNotes.map((note) => (
              <article
                key={note.id}
                className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <MetaLine
                      items={[
                        note.subjectId.toUpperCase(),
                        note.updatedAt,
                        note.attachmentName
                          ? `File: ${note.attachmentName} (${note.attachmentSizeLabel})`
                          : undefined,
                      ]}
                    />
                    <h3 className="text-base font-semibold text-[#14241B] mt-1">
                      {note.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteNote(note.id)}
                    aria-label="Delete note"
                    className="p-1.5 text-[#6E7B72] hover:text-[#9B1C1C] rounded-md hover:bg-[#FDF2F2] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-[#48564D] leading-relaxed bg-[#FAF8F3] p-4 rounded-lg border border-[#E2E5DC]">
                  <MarkdownContent content={note.content} />
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * AREA 9: PROFILE, SETTINGS & PERSISTENCE ARCHITECTURE STATUS
 * ========================================================================== */

interface SettingsViewProps {
  state: StudentLearningState;
  serverSyncStatus?: "synced" | "local-only" | "syncing";
  onUpdateProfile: (updated: StudentProfile) => void;
  onSwitchToDemoMode: () => void;
  onSignOutToDiscovery: () => void;
}

export function SettingsView({
  state,
  serverSyncStatus = "synced",
  onUpdateProfile,
  onSwitchToDemoMode,
  onSignOutToDiscovery,
}: SettingsViewProps) {
  const profile = state.profile!;
  const [name, setName] = useState(profile.name);
  const [schoolOrCity, setSchoolOrCity] = useState(profile.schoolOrCity);
  const [classLevel, setClassLevel] = useState<ClassLevel>(profile.classLevel);
  const [targetExam, setTargetExam] = useState<TargetExam>(profile.targetExam);
  const [dailyMinutes, setDailyMinutes] = useState<45 | 90 | 150>(
    profile.preferences.dailyStudyMinutes
  );
  const [fontSizeScale, setFontSizeScale] = useState<"normal" | "comfortable">(
    profile.preferences.fontSizeScale
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const focusSubjects: SubjectId[] =
      targetExam === "NEET UG"
        ? ["physics", "chemistry", "biology"]
        : ["physics", "chemistry", "mathematics"];

    onUpdateProfile({
      ...profile,
      name: name.trim() || profile.name,
      schoolOrCity: schoolOrCity.trim() || profile.schoolOrCity,
      classLevel,
      targetExam,
      preferences: {
        ...profile.preferences,
        dailyStudyMinutes: dailyMinutes,
        focusSubjectIds: focusSubjects,
        fontSizeScale,
      },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <MetaLine
            items={[
              "Student Profile & Exam Preferences",
              profile.isDemoAccount ? "Sample Student Mode" : "Personal Account",
            ]}
          />
          <h1 className="text-2xl font-bold text-[#14241B]">
            Profile, target exam &amp; study preferences
          </h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-xs font-medium text-[#14241B] mb-1.5"
              >
                Student Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
              />
            </div>

            <div>
              <label
                htmlFor="settings-city"
                className="block text-xs font-medium text-[#14241B] mb-1.5"
              >
                City or School
              </label>
              <input
                id="settings-city"
                type="text"
                value={schoolOrCity}
                onChange={(e) => setSchoolOrCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="settings-class"
                className="block text-xs font-medium text-[#14241B] mb-1.5"
              >
                Current Class
              </label>
              <select
                id="settings-class"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
              >
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-exam"
                className="block text-xs font-medium text-[#14241B] mb-1.5"
              >
                Target Competitive Exam
              </label>
              <select
                id="settings-exam"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value as TargetExam)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
              >
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Main + Advanced">JEE Main + Advanced</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET UG">NEET UG</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-minutes"
                className="block text-xs font-medium text-[#14241B] mb-1.5"
              >
                Daily Study Target
              </label>
              <select
                id="settings-minutes"
                value={dailyMinutes}
                onChange={(e) =>
                  setDailyMinutes(Number(e.target.value) as 45 | 90 | 150)
                }
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
              >
                <option value={45}>45 mins / day</option>
                <option value={90}>90 mins / day</option>
                <option value={150}>150 mins / day</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E5DC] space-y-3">
            <h2 className="text-sm font-semibold text-[#14241B]">
              Reading Comfort &amp; Accessibility
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <SegmentedControl
                ariaLabel="Reading Text Size"
                value={fontSizeScale}
                onChange={setFontSizeScale}
                options={[
                  { id: "normal", label: "Standard Text Size" },
                  { id: "comfortable", label: "Comfortable Large Text" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E2E5DC]">
            <div>
              {savedNotice && (
                <span className="text-xs font-semibold text-[#164A31]">
                  ✓ Your study preferences and daily plan budget have been updated.
                </span>
              )}
            </div>
            <Button type="submit" variant="primary">
              Save Preferences
            </Button>
          </div>
        </form>
      </section>

      {/* Data Persistence & User-Specific Access Control Transparency */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#14241B]">
            <Database className="w-4 h-4 text-[#164A31]" />
            <span>Saved Progress &amp; Privacy</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#164A31]">
            <ShieldCheck className="w-3.5 h-3.5" />
            {serverSyncStatus === "synced"
              ? "Progress Saved Automatically"
              : "Saved on This Device"}
          </span>
        </div>
        <p className="text-xs text-[#48564D] leading-relaxed">
          Your daily study plan, question attempts, mock test scores, revision schedule, and personal notes are saved automatically to your private student session and this browser so you can pick up right where you left off. Sample mode is kept completely separate from your personal study records.
        </p>
      </section>

      {/* Account & Mode Management */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#14241B]">
            Switch Study Profile or Mode
          </h2>
          <p className="text-xs text-[#48564D]">
            Switch between your personal profile and Sample Student Mode, or return to the welcome screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!profile.isDemoAccount && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSwitchToDemoMode}
            >
              Load Sample Student Mode
            </Button>
          )}
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onSignOutToDiscovery}
          >
            {profile.isDemoAccount
              ? "Create Your Own Fresh Profile"
              : "Sign Out / Switch Student"}
          </Button>
        </div>
      </section>
    </div>
  );
}
