import React, { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Compass,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import {
  AppRoute,
  StudentLearningState,
  StudentMilestone,
  StudyTask,
  SubjectId,
} from "../../types/domain";
import { QUESTIONS, SUBJECTS, TOPICS } from "../../data/curriculum";
import {
  computeSubjectInsights,
  computeTopicInsights,
  getPersonalisedNextRecommendation,
} from "../../utils/personalisation";
import { Button, MetaLine, ProgressBar } from "../ui/Primitives";
import { MarkdownContent } from "../ui/MathAndDiagrams";
import { SubjectIllustration } from "../ui/SubjectIllustration";

interface HomeViewProps {
  state: StudentLearningState;
  onNavigate: (
    route: AppRoute,
    options?: {
      subjectId?: SubjectId;
      topicId?: string;
      chapterId?: string;
      prefillDoubt?: string;
    }
  ) => void;
  onToggleTaskCompleted: (taskId: string) => void;
  onToggleTaskSkipped: (taskId: string) => void;
  onMoveTask: (taskId: string, direction: "up" | "down") => void;
  onAddCustomTask: (task: Omit<StudyTask, "id" | "completed">) => void;
  onRegenerateDailyPlan: () => void;
  onAddMilestone: (milestone: Omit<StudentMilestone, "id" | "completed">) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onDeleteMilestone: (milestoneId: string) => void;
}

export function HomeView({
  state,
  onNavigate,
  onToggleTaskCompleted,
  onToggleTaskSkipped,
  onMoveTask,
  onAddCustomTask,
  onRegenerateDailyPlan,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
}: HomeViewProps) {
  const profile = state.profile!;

  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );
  const applicableTopicIds = applicableSubjects.flatMap((s) =>
    s.chapters.flatMap((c) => c.topicIds)
  );
  const applicableTopics = TOPICS.filter((t) =>
    applicableTopicIds.includes(t.id)
  );

  // Student override for the primary recommendation
  const [overrideTopicId, setOverrideTopicId] = useState<string>("");
  const [showOverridePicker, setShowOverridePicker] = useState<boolean>(false);

  // Add custom task form toggle
  const [showAddTaskForm, setShowAddTaskForm] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskSubject, setNewTaskSubject] = useState<SubjectId>(
    applicableSubjects[0]?.id || "physics"
  );
  const [newTaskType, setNewTaskType] = useState<
    "concept" | "practice" | "revision"
  >("concept");
  const [newTaskMinutes, setNewTaskMinutes] = useState<number>(20);

  // Add student milestone form toggle
  const [showMilestoneForm, setShowMilestoneForm] = useState<boolean>(false);
  const [milestoneTitle, setMilestoneTitle] = useState<string>("");
  const [milestoneDate, setMilestoneDate] = useState<string>("");
  const [milestoneSubject, setMilestoneSubject] = useState<SubjectId>(
    applicableSubjects[0]?.id || "physics"
  );

  const totalTopicsCount = applicableTopicIds.length;
  const completedTopicsCount = state.completedTopicIds.filter((id) =>
    applicableTopicIds.includes(id)
  ).length;

  const totalAttempts = state.attempts.length;
  const correctAttempts = state.attempts.filter((a) => a.isCorrect).length;
  const accuracyPct =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;

  const topicInsights = computeTopicInsights(state);
  const subjectInsights = computeSubjectInsights(state);
  const unresolvedMistakeQuestionIds = Array.from(
    new Set(topicInsights.flatMap((ti) => ti.unresolvedMistakeQuestionIds))
  );

  const hasLearningHistory =
    completedTopicsCount > 0 ||
    totalAttempts > 0 ||
    state.mockResults.length > 0;

  // Personalised next study recommendation
  const recommendation = getPersonalisedNextRecommendation(
    state,
    overrideTopicId || undefined
  );
  const activeOrNextTopic = recommendation.topic;

  // Last active topic or practice session for instant resume
  const lastStudiedTopic = profile.lastActiveTopicId
    ? TOPICS.find((t) => t.id === profile.lastActiveTopicId)
    : undefined;
  const savedPracticeSession = state.activePracticeSession;

  const activeTasks = state.studyTasks.filter((t) => !t.skipped);
  const skippedTasks = state.studyTasks.filter((t) => t.skipped);
  const completedTasksCount = activeTasks.filter((t) => t.completed).length;
  const totalPlannedMinutes = activeTasks.reduce(
    (sum, t) => sum + t.estimatedMinutes,
    0
  );

  const milestones = state.studentMilestones || [];

  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const routeTarget: AppRoute =
      newTaskType === "concept"
        ? "learn"
        : newTaskType === "practice"
        ? "practice"
        : "revision";

    onAddCustomTask({
      title: newTaskTitle.trim(),
      subtitle: `${newTaskSubject.toUpperCase()} · Custom study task`,
      type: newTaskType,
      subjectId: newTaskSubject,
      estimatedMinutes: newTaskMinutes,
      reasonLabel: "Added by you",
      routeTarget,
    });
    setNewTaskTitle("");
    setShowAddTaskForm(false);
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDate.trim()) return;
    onAddMilestone({
      title: milestoneTitle.trim(),
      targetDateLabel: milestoneDate.trim(),
      subjectId: milestoneSubject,
    });
    setMilestoneTitle("");
    setMilestoneDate("");
    setShowMilestoneForm(false);
  };

  return (
    <div className="space-y-10">
      {/* =====================================================================
          1. FOCUSED STUDY COMMAND HEADER:
             Answers: What have I completed? How can I resume? What should I study next?
         ===================================================================== */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-5 sm:p-8 space-y-6">
        {/* Welcome + Completed Progress Summary Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2E5DC]">
          <div className="space-y-1.5">
            <MetaLine
              items={[
                `Class ${profile.classLevel}`,
                profile.targetExam,
                `${profile.preferences.dailyStudyMinutes} mins/day goal`,
              ]}
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
              {hasLearningHistory
                ? `Welcome back, ${profile.name.split(" ")[0]}.`
                : `Welcome, ${profile.name.split(" ")[0]}. Let's start your first session.`}
            </h1>
            <p className="text-sm sm:text-base text-[#48564D] max-w-2xl leading-relaxed">
              {hasLearningHistory
                ? `You have completed ${completedTopicsCount} of ${totalTopicsCount} core topics and solved ${totalAttempts} practice question${
                    totalAttempts === 1 ? "" : "s"
                  }. Pick up where you left off or follow today's study plan.`
                : `Your Class ${profile.classLevel} ${profile.targetExam} workspace is ready. Start with the recommended concept below or choose any chapter you want to study.`}
            </p>
          </div>

          {/* What Have I Completed? — Clear 4-Metric Progress Strip */}
          <div
            aria-label="Your completed study summary"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 px-5 py-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] shrink-0"
          >
            <div>
              <div className="text-xs text-[#6E7B72]">Topics Done</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#14241B] mt-0.5">
                {completedTopicsCount}/{totalTopicsCount}
              </div>
            </div>
            <div className="sm:border-l sm:border-[#E2E5DC] sm:pl-4">
              <div className="text-xs text-[#6E7B72]">Questions Solved</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#14241B] mt-0.5">
                {totalAttempts}
              </div>
            </div>
            <div className="sm:border-l sm:border-[#E2E5DC] sm:pl-4">
              <div className="text-xs text-[#6E7B72]">Accuracy</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#164A31] mt-0.5">
                {accuracyPct !== null ? `${accuracyPct}%` : "—"}
              </div>
            </div>
            <div className="sm:border-l sm:border-[#E2E5DC] sm:pl-4">
              <div className="text-xs text-[#6E7B72]">Today&apos;s Plan</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#14241B] mt-0.5">
                {completedTasksCount}/{activeTasks.length}
              </div>
            </div>
          </div>
        </div>

        {/* How Can I Resume? — Instant Resume Strip (shown whenever recent activity exists) */}
        {(lastStudiedTopic || savedPracticeSession || unresolvedMistakeQuestionIds.length > 0) && (
          <div className="p-4 rounded-xl bg-[#EAF2EC]/70 border border-[#164A31]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#164A31]">
                Quick Resume — Pick up right where you left off
              </div>
              <p className="text-xs sm:text-sm text-[#14241B]">
                {lastStudiedTopic ? (
                  <>
                    Last studied concept:{" "}
                    <strong>{lastStudiedTopic.title}</strong> (
                    {lastStudiedTopic.subjectId.toUpperCase()})
                  </>
                ) : (
                  <>
                    Continue your active {profile.targetExam} practice or mistake
                    review session
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {lastStudiedTopic && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onNavigate("learn", {
                      subjectId: lastStudiedTopic.subjectId,
                      topicId: lastStudiedTopic.id,
                    })
                  }
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Resume Lesson
                </Button>
              )}
              {savedPracticeSession && savedPracticeSession.questionIds.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate("practice")}
                >
                  <Target className="w-3.5 h-3.5" />
                  Resume Practice (Q{savedPracticeSession.currentQuestionIndex + 1})
                </Button>
              )}
              {unresolvedMistakeQuestionIds.length > 0 && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate("revision")}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Review {unresolvedMistakeQuestionIds.length} Mistake
                  {unresolvedMistakeQuestionIds.length === 1 ? "" : "s"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Split: 1. What Should I Study Next? (Left 6 Cols) + 2. Today's Study Planner (Right 6 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT 6 COLS: What Should I Study Next? */}
          <div className="lg:col-span-6 p-6 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#164A31]">
                  What to Study Next · {recommendation.badgeLabel}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono tabular-nums text-[#6E7B72]">
                    {recommendation.subjectName} · ~{recommendation.estimatedMinutes} mins
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOverridePicker((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#184E77] hover:underline cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {showOverridePicker ? "Close" : "Change topic"}
                  </button>
                </div>
              </div>

              {/* Optional Topic Override Selector */}
              {showOverridePicker && (
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E5DC] space-y-2">
                  <label
                    htmlFor="override-topic-select"
                    className="block text-xs font-semibold text-[#14241B]"
                  >
                    Choose any syllabus topic to focus on now:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      id="override-topic-select"
                      value={overrideTopicId}
                      onChange={(e) => setOverrideTopicId(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#14241B]"
                    >
                      <option value="">
                        Recommended from your study activity
                      </option>
                      {applicableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.subjectId.toUpperCase()}: {t.title} (Class {t.classLevel})
                        </option>
                      ))}
                    </select>
                    {overrideTopicId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOverrideTopicId("")}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <SubjectIllustration
                subjectId={activeOrNextTopic.subjectId}
                className="w-full h-28"
              />

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#14241B]">
                  {recommendation.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                  {recommendation.reason}
                </p>
              </div>

              {/* Key Concept Takeaways Preview (Rendered with Shared KaTeX Engine) */}
              <div className="p-4 rounded-lg bg-white border border-[#E2E5DC] space-y-2">
                <div className="text-xs font-semibold text-[#164A31]">
                  Key formulas &amp; takeaways in this lesson:
                </div>
                {activeOrNextTopic.keyTakeaways.slice(0, 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[#14241B] leading-relaxed"
                  >
                    <span className="font-mono font-semibold text-[#164A31] mt-0.5">
                      0{idx + 1}.
                    </span>
                    <MarkdownContent content={item} inline />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() =>
                  onNavigate(recommendation.primaryRoute, {
                    subjectId: activeOrNextTopic.subjectId,
                    topicId: activeOrNextTopic.id,
                    chapterId: activeOrNextTopic.chapterId,
                  })
                }
              >
                {recommendation.primaryActionLabel}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() =>
                  onNavigate(recommendation.secondaryRoute, {
                    subjectId: activeOrNextTopic.subjectId,
                    topicId: activeOrNextTopic.id,
                    chapterId: activeOrNextTopic.chapterId,
                  })
                }
              >
                {recommendation.secondaryActionLabel}
              </Button>
            </div>
          </div>

          {/* RIGHT 6 COLS: Manageable Today's Study Planner */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-[#14241B]">
                    Today&apos;s study plan
                  </h2>
                  <p className="text-xs text-[#6E7B72]">
                    {totalPlannedMinutes} mins planned for your {profile.preferences.dailyStudyMinutes} min/day goal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskForm((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#164A31]" />
                    {showAddTaskForm ? "Close" : "Add Task"}
                  </button>
                  <button
                    type="button"
                    onClick={onRegenerateDailyPlan}
                    title="Refresh daily tasks from your latest progress"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#164A31]" />
                    Refresh
                  </button>
                </div>
              </div>

              <ProgressBar
                value={completedTasksCount}
                max={Math.max(1, activeTasks.length)}
                valueLabel={`${completedTasksCount} of ${activeTasks.length} tasks done`}
                tone="forest"
              />
            </div>

            {/* Optional Add Custom Task Form */}
            {showAddTaskForm && (
              <form
                onSubmit={handleCreateCustomTask}
                className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3"
              >
                <div className="text-xs font-semibold text-[#14241B]">
                  Add a study task to today&apos;s checklist
                </div>
                <input
                  type="text"
                  aria-label="Custom study task title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Revise NCERT Electrochemistry solved examples"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E2E5DC] rounded-lg text-[#14241B]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    aria-label="Task subject"
                    value={newTaskSubject}
                    onChange={(e) =>
                      setNewTaskSubject(e.target.value as SubjectId)
                    }
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E5DC] rounded-lg text-[#14241B]"
                  >
                    {applicableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Task activity type"
                    value={newTaskType}
                    onChange={(e) =>
                      setNewTaskType(
                        e.target.value as "concept" | "practice" | "revision"
                      )
                    }
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E5DC] rounded-lg text-[#14241B]"
                  >
                    <option value="concept">Learn Concept</option>
                    <option value="practice">Solve Questions</option>
                    <option value="revision">Revise Mistakes</option>
                  </select>
                  <select
                    aria-label="Estimated task duration"
                    value={newTaskMinutes}
                    onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                    className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E5DC] rounded-lg text-[#14241B]"
                  >
                    <option value={15}>15 mins</option>
                    <option value={25}>25 mins</option>
                    <option value={30}>30 mins</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddTaskForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newTaskTitle.trim()}
                  >
                    Add to Plan
                  </Button>
                </div>
              </form>
            )}

            {/* Active Tasks Checklist */}
            <div className="divide-y divide-[#E2E5DC] border-t border-b border-[#E2E5DC]">
              {activeTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#6E7B72] space-y-2">
                  <p>You&apos;ve completed or skipped all tasks for today.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onRegenerateDailyPlan}
                  >
                    Generate New Tasks
                  </Button>
                </div>
              ) : (
                activeTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleTaskCompleted(task.id)}
                        aria-label={
                          task.completed
                            ? "Mark task incomplete"
                            : "Mark task complete"
                        }
                        className="mt-0.5 text-[#164A31] hover:opacity-80 cursor-pointer shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-[#164A31]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#6E7B72]" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            task.completed
                              ? "line-through text-[#6E7B72]"
                              : "text-[#14241B]"
                          }`}
                        >
                          {task.title}
                        </div>
                        <MetaLine
                          items={[
                            task.subtitle,
                            `${task.estimatedMinutes} mins`,
                            task.reasonLabel,
                          ]}
                        />
                      </div>
                    </div>

                    {/* Task Controls: Move Up/Down, Skip, Start */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveTask(task.id, "up")}
                        title="Move earlier"
                        aria-label="Move task up"
                        className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-md text-[#6E7B72] hover:text-[#14241B] hover:bg-[#FAF8F3] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === activeTasks.length - 1}
                        onClick={() => onMoveTask(task.id, "down")}
                        title="Move later"
                        aria-label="Move task down"
                        className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-md text-[#6E7B72] hover:text-[#14241B] hover:bg-[#FAF8F3] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTaskSkipped(task.id)}
                        title="Skip for today"
                        aria-label="Skip task for today"
                        className="p-1.5 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-md text-[#6E7B72] hover:text-[#B45309] hover:bg-[#FFFBEB] cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          onNavigate(task.routeTarget, {
                            subjectId: task.subjectId,
                            topicId: task.topicId,
                            chapterId: task.chapterId,
                          })
                        }
                      >
                        Start →
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Skipped Tasks Restore Row */}
            {skippedTasks.length > 0 && (
              <div className="px-3.5 py-2.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E7B72]">
                <span>
                  {skippedTasks.length} task{skippedTasks.length > 1 ? "s" : ""}{" "}
                  skipped for today
                </span>
                <button
                  type="button"
                  onClick={() => onToggleTaskSkipped(skippedTasks[0].id)}
                  className="text-[#164A31] font-semibold hover:underline cursor-pointer"
                >
                  Restore {skippedTasks[0].title}
                </button>
              </div>
            )}

            {/* Compact Upcoming Test Dates / Milestones Bar */}
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#164A31]" />
                  <span className="text-xs font-semibold text-[#14241B]">
                    Upcoming Test Dates &amp; Personal Targets
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm((v) => !v)}
                  className="text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
                >
                  {showMilestoneForm ? "Close" : "+ Add Target Date"}
                </button>
              </div>

              {showMilestoneForm && (
                <form
                  onSubmit={handleCreateMilestone}
                  className="p-3 rounded-lg bg-white border border-[#E2E5DC] space-y-2.5"
                >
                  <input
                    type="text"
                    aria-label="Milestone title"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="e.g., School Physics Unit Test or Finish Equilibrium"
                    className="w-full px-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      aria-label="Milestone target date"
                      value={milestoneDate}
                      onChange={(e) => setMilestoneDate(e.target.value)}
                      placeholder="When? (e.g., Next Monday)"
                      className="px-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
                    />
                    <select
                      aria-label="Milestone subject"
                      value={milestoneSubject}
                      onChange={(e) =>
                        setMilestoneSubject(e.target.value as SubjectId)
                      }
                      className="px-2.5 py-1.5 text-xs bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B]"
                    >
                      {applicableSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!milestoneTitle.trim() || !milestoneDate.trim()}
                    >
                      Save Target
                    </Button>
                  </div>
                </form>
              )}

              {milestones.length === 0 ? (
                <p className="text-[11px] text-[#6E7B72] leading-relaxed">
                  Have an upcoming school test or coaching quiz? Add it here so today&apos;s study plan prioritises that subject.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-[#E2E5DC]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleMilestone(ms.id)}
                          className="text-[#164A31] shrink-0 cursor-pointer"
                        >
                          {ms.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#164A31]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#6E7B72]" />
                          )}
                        </button>
                        <span
                          className={`truncate ${
                            ms.completed
                              ? "line-through text-[#6E7B72]"
                              : "font-medium text-[#14241B]"
                          }`}
                        >
                          {ms.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-[#6E7B72]">
                          {ms.targetDateLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteMilestone(ms.id)}
                          aria-label="Delete target date"
                          className="text-[#6E7B72] hover:text-[#9B1C1C] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. YOUR 4-STEP LEARNING LOOP: MISTAKE RECOVERY & AI TUTOR SUPPORT
         ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left 7 Cols: Mistake Recovery & Revision Queue */}
        <div className="lg:col-span-7 bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-1.5">
            <MetaLine items={["Step 3 & 4 of Learning Loop", "Mistake Review & Spaced Revision"]} />
            <h2 className="text-xl font-bold text-[#14241B]">
              {unresolvedMistakeQuestionIds.length > 0
                ? `${unresolvedMistakeQuestionIds.length} practice mistake${
                    unresolvedMistakeQuestionIds.length > 1 ? "s" : ""
                  } ready to resolve`
                : "Your mistake log is clear"}
            </h2>
            <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
              {unresolvedMistakeQuestionIds.length > 0
                ? "Review the exact questions you missed below, revisit the underlying formula, and re-attempt them in a guided Revision Session."
                : "Whenever you miss a question in Practice or Mock Tests, it is saved here automatically so you can fix the misconception before your exam."}
            </p>
          </div>

          {unresolvedMistakeQuestionIds.length > 0 ? (
            <div className="space-y-2.5">
              {unresolvedMistakeQuestionIds.slice(0, 2).map((qid) => {
                const q = QUESTIONS.find((item) => item.id === qid);
                if (!q) return null;
                return (
                  <div
                    key={qid}
                    className="p-4 rounded-xl bg-[#FFFBEB] border border-[#D97706]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <MetaLine
                        items={[
                          q.subjectId.toUpperCase(),
                          q.examTag,
                          "Unresolved Mistake",
                        ]}
                      />
                      <div className="text-xs sm:text-sm font-medium text-[#14241B] line-clamp-2">
                        <MarkdownContent content={q.questionText} inline />
                      </div>
                    </div>
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
                      Review Concept →
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#EAF2EC] border border-[#164A31]/25 text-xs sm:text-sm text-[#14241B] space-y-1">
              <div className="font-semibold text-[#164A31]">
                Build your accuracy signal
              </div>
              <p className="text-xs text-[#48564D]">
                Solve at least 3 exam-style questions in a topic to identify strong areas and uncover common option traps.
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={
                unresolvedMistakeQuestionIds.length > 0 ? "primary" : "secondary"
              }
              size="sm"
              onClick={() => onNavigate("revision")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Open Revision Session ({unresolvedMistakeQuestionIds.length})
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onNavigate("mock-tests")}
            >
              <Play className="w-3.5 h-3.5" />
              Take 15-Min Timed Checkpoint
            </Button>
          </div>
        </div>

        {/* Right 5 Cols: Stuck on a Derivation? Ask AI Study Companion */}
        <div className="lg:col-span-5 bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <MetaLine
              items={[
                "Step-by-Step Doubt Solver",
                recommendation.subjectName,
              ]}
            />
            <h2 className="text-xl font-bold text-[#14241B]">
              Have a doubt in {activeOrNextTopic.title}?
            </h2>
            <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
              Ask the AI Tutor for a simple analogy, a full multi-line derivation, or a similar practice question—or attach a photo of a textbook problem.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#14241B]">
              One-tap questions for your current topic:
            </div>
            <button
              type="button"
              onClick={() =>
                onNavigate("doubts", {
                  subjectId: activeOrNextTopic.subjectId,
                  topicId: activeOrNextTopic.id,
                  prefillDoubt: `Can you explain the core physical intuition and formula for ${activeOrNextTopic.title} step by step?`,
                })
              }
              className="w-full text-left p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] hover:bg-[#EAF2EC] text-xs text-[#14241B] transition-colors cursor-pointer"
            >
              &ldquo;Explain the core formula and intuition for{" "}
              {activeOrNextTopic.title} step by step&rdquo; →
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate("doubts", {
                  subjectId: activeOrNextTopic.subjectId,
                  topicId: activeOrNextTopic.id,
                  prefillDoubt: `What is the most common exam trap students fall into in ${activeOrNextTopic.title}?`,
                })
              }
              className="w-full text-left p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] hover:bg-[#EAF2EC] text-xs text-[#14241B] transition-colors cursor-pointer"
            >
              &ldquo;What is the most common exam trap in{" "}
              {activeOrNextTopic.title}?&rdquo; →
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                onNavigate("doubts", {
                  subjectId: activeOrNextTopic.subjectId,
                  topicId: activeOrNextTopic.id,
                })
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              Open AI Study Companion
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SUBJECT PROGRESS & SYLLABUS QUICK-LAUNCH
         ===================================================================== */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <MetaLine items={[`${profile.targetExam} Core Syllabus`]} />
            <h2 className="text-2xl font-bold text-[#14241B] mt-0.5">
              Your subjects &amp; chapters
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onNavigate("learn")}
          >
            View Complete Syllabus
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {applicableSubjects.map((subj) => {
            const subjTopicIds = subj.chapters.flatMap((c) => c.topicIds);
            const doneCount = state.completedTopicIds.filter((id) =>
              subjTopicIds.includes(id)
            ).length;
            const sInsight = subjectInsights.find(
              (si) => si.subjectId === subj.id
            );

            return (
              <div
                key={subj.id}
                className="bg-white border border-[#E2E5DC] rounded-xl p-5 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <SubjectIllustration
                    subjectId={subj.id}
                    className="w-full h-28"
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#14241B]">
                        {subj.name}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-[#164A31] font-semibold">
                        {doneCount}/{subjTopicIds.length} topics
                      </span>
                    </div>
                    <ProgressBar
                      value={doneCount}
                      max={subjTopicIds.length}
                      tone="forest"
                    />
                    <p className="text-xs text-[#6E7B72]">
                      {sInsight?.accuracyPct !== null &&
                      sInsight?.accuracyPct !== undefined
                        ? `Practice accuracy: ${sInsight.accuracyPct}% (${sInsight.correctCount}/${sInsight.attemptCount} correct)`
                        : "No practice questions attempted in this subject yet"}
                    </p>
                  </div>

                  {/* Direct Chapter Launch Links */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E2E5DC]">
                    {subj.chapters.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() =>
                          onNavigate("learn", {
                            subjectId: subj.id,
                            topicId: ch.topicIds[0],
                          })
                        }
                        className="w-full text-left py-1.5 text-xs text-[#14241B] hover:text-[#164A31] flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">
                          Ch {ch.number}: {ch.title}
                        </span>
                        <span className="text-[#6E7B72] shrink-0">→</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E5DC] flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => onNavigate("learn", { subjectId: subj.id })}
                  >
                    Study {subj.name}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      onNavigate("practice", { subjectId: subj.id })
                    }
                  >
                    Practise
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          4. VIDYAKSHARA CAREER INTELLIGENCE TEST (100% FREE DISCOVERY)
         ===================================================================== */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <MetaLine
            items={[
              "Vidyakshara Career Intelligence Test",
              "40 Questions · 20–25 Minutes",
              "100% Free Personalized Report",
            ]}
          />
          <h2 className="text-xl font-bold text-[#14241B]">
            Discover where your interests could take you.
          </h2>
          <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
            Explore your interests across Engineering, Healthcare, Commerce, Humanities, Design, Business, Law, Pure Sciences, Education, and Life Sciences — and receive a free personalized career-guidance report with a 7-day exploration plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onNavigate("career-discovery")}
          >
            <Compass className="w-4 h-4" />
            Start My Free Assessment
          </Button>
        </div>
      </section>
    </div>
  );
}
