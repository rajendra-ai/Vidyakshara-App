import React, { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  RefreshCw,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
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
  computeTopicInsights,
  getPersonalisedNextRecommendation,
} from "../../utils/personalisation";
import { Button, MetaLine, ProgressBar } from "../ui/Primitives";
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
  const unresolvedMistakeQuestionIds = Array.from(
    new Set(
      topicInsights.flatMap((ti) => ti.unresolvedMistakeQuestionIds)
    )
  );

  const hasLearningHistory =
    completedTopicsCount > 0 ||
    totalAttempts > 0 ||
    state.mockResults.length > 0;

  // Evidence-based personalised recommendation (respecting optional student override)
  const recommendation = getPersonalisedNextRecommendation(
    state,
    overrideTopicId || undefined
  );
  const activeOrNextTopic = recommendation.topic;

  const activeTasks = state.studyTasks.filter((t) => !t.skipped);
  const skippedTasks = state.studyTasks.filter((t) => t.skipped);
  const completedTasksCount = activeTasks.filter((t) => t.completed).length;
  const totalPlannedMinutes = activeTasks.reduce(
    (sum, t) => sum + t.estimatedMinutes,
    0
  );

  const milestones = state.studentMilestones || [];

  // Actual activity-based milestones (never fabricated)
  const actualMilestones = [
    {
      id: "m-onboarding",
      label: `Study plan configured for Class ${profile.classLevel} ${profile.targetExam}`,
      achieved: true,
    },
    {
      id: "m-first-concept",
      label: "Complete your first interactive concept & worked example",
      achieved: completedTopicsCount >= 1,
    },
    {
      id: "m-practice",
      label: "Solve at least 3 exam-style questions in Practice",
      achieved: totalAttempts >= 3,
    },
    {
      id: "m-mock",
      label: "Complete a 15-minute timed checkpoint mock test",
      achieved: state.mockResults.length >= 1,
    },
  ];

  const achievedMilestoneCount = actualMilestones.filter((m) => m.achieved).length;

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
      subtitle: `${newTaskSubject.toUpperCase()} · Student-added task`,
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
    <div className="space-y-12">
      {/* =====================================================================
          ABOVE THE FOLD: WARM WELCOME, PERSONALISD NEXT ACTION, & MANAGEABLE DAILY PLANNER
         ===================================================================== */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-5 sm:p-8 space-y-8">
        {/* Top Row: Welcome + Concise Real Progress */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E2E5DC]">
          <div className="space-y-2">
            <MetaLine
              items={[
                `Class ${profile.classLevel}`,
                profile.targetExam,
                `${profile.preferences.dailyStudyMinutes} mins/day goal`,
                profile.isDemoAccount
                  ? "Sample Student Workspace"
                  : "Personal Study Companion",
              ]}
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
              {hasLearningHistory
                ? `Welcome back, ${profile.name.split(" ")[0]}. Ready to continue?`
                : `Welcome, ${profile.name.split(" ")[0]}. Let's start your first study session.`}
            </h1>
            <p className="text-sm sm:text-base text-[#48564D] max-w-2xl leading-relaxed">
              {hasLearningHistory
                ? `You have completed ${completedTopicsCount} of ${totalTopicsCount} core topics and solved ${totalAttempts} practice question${
                    totalAttempts === 1 ? "" : "s"
                  }. Your next recommended action is tailored from your actual activity.`
                : `Your study plan for Class ${profile.classLevel} ${profile.targetExam} is ready. Start with the recommended concept below or choose any topic you prefer.`}
            </p>
          </div>

          {/* Concise Real Progress Strip */}
          <div className="flex items-center gap-5 px-5 py-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] shrink-0">
            <div>
              <div className="text-xs text-[#6E7B72]">Topics Done</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#14241B] mt-0.5">
                {completedTopicsCount}/{totalTopicsCount}
              </div>
            </div>
            <div className="h-8 w-px bg-[#E2E5DC]" />
            <div>
              <div className="text-xs text-[#6E7B72]">Accuracy</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#164A31] mt-0.5">
                {accuracyPct !== null ? `${accuracyPct}%` : "New"}
              </div>
            </div>
            <div className="h-8 w-px bg-[#E2E5DC]" />
            <div>
              <div className="text-xs text-[#6E7B72]">Daily Plan</div>
              <div className="text-lg font-mono font-bold tabular-nums text-[#14241B] mt-0.5">
                {completedTasksCount}/{activeTasks.length}
              </div>
            </div>
          </div>
        </div>

        {/* Main Above-the-Fold Split: Evidence-Based Recommendation (Left 6 Cols) + Daily Study Planner (Right 6 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Dominant Focal Anchor: Evidence-Based Recommendation with Student Override */}
          <div className="lg:col-span-6 p-6 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#164A31]">
                  {recommendation.badgeLabel}
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
                    {showOverridePicker ? "Close selector" : "Choose another topic"}
                  </button>
                </div>
              </div>

              {/* Optional Student Override Selector */}
              {showOverridePicker && (
                <div className="p-3.5 rounded-lg bg-white border border-[#E2E5DC] space-y-2">
                  <label
                    htmlFor="override-topic-select"
                    className="block text-xs font-semibold text-[#14241B]"
                  >
                    Override recommendation — choose what you want to study now:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      id="override-topic-select"
                      value={overrideTopicId}
                      onChange={(e) => setOverrideTopicId(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#14241B]"
                    >
                      <option value="">
                        Automatic (Recommended from your activity)
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
                        Reset to Auto
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <SubjectIllustration
                subjectId={activeOrNextTopic.subjectId}
                className="w-full h-32"
              />

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-[#14241B]">
                  {recommendation.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                  {activeOrNextTopic.summary}
                </p>
                <div className="p-3 rounded-lg bg-white border border-[#E2E5DC] text-xs text-[#14241B] leading-relaxed">
                  <strong className="text-[#164A31]">Why this next step: </strong>
                  {recommendation.reason}
                </div>
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

          {/* Manageable Daily Study Planner (Complete, Skip, Rearrange, Custom Tasks & Milestones) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#14241B]">
                    Today&apos;s study planner
                  </h2>
                  <p className="text-xs text-[#6E7B72]">
                    Sized for your {profile.preferences.dailyStudyMinutes} min/day preference ({totalPlannedMinutes} mins active)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskForm((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#164A31]" />
                    Add Task
                  </button>
                  <button
                    type="button"
                    onClick={onRegenerateDailyPlan}
                    title="Refresh plan based on latest mistakes, unfinished topics, and time goal"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#164A31]" />
                    Refresh Plan
                  </button>
                </div>
              </div>

              <ProgressBar
                value={completedTasksCount}
                max={Math.max(1, activeTasks.length)}
                valueLabel={`${completedTasksCount}/${activeTasks.length} completed`}
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
                  Add your own study task to today&apos;s plan
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
                    <option value="concept">Concept Study</option>
                    <option value="practice">Question Practice</option>
                    <option value="revision">Revision</option>
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
                    Add to Today
                  </Button>
                </div>
              </form>
            )}

            {/* Active Tasks List with Complete, Rearrange (Up/Down), Skip, and Open */}
            <div className="divide-y divide-[#E2E5DC] border-t border-b border-[#E2E5DC]">
              {activeTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#6E7B72] space-y-2">
                  <p>All tasks for today are either completed or skipped.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onRegenerateDailyPlan}
                  >
                    Generate Fresh Daily Tasks
                  </Button>
                </div>
              ) : (
                activeTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="py-3 flex items-center justify-between gap-2"
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

                    {/* Task Controls: Rearrange Up/Down, Skip, Open */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoveTask(task.id, "up")}
                        title="Move task earlier"
                        aria-label="Move task up"
                        className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-md text-[#6E7B72] hover:text-[#14241B] hover:bg-[#FAF8F3] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === activeTasks.length - 1}
                        onClick={() => onMoveTask(task.id, "down")}
                        title="Move task later"
                        aria-label="Move task down"
                        className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-md text-[#6E7B72] hover:text-[#14241B] hover:bg-[#FAF8F3] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTaskSkipped(task.id)}
                        title="Skip task for today"
                        aria-label="Skip task for today"
                        className="p-2 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-md text-[#6E7B72] hover:text-[#B45309] hover:bg-[#FFFBEB] cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onNavigate(task.routeTarget, {
                            subjectId: task.subjectId,
                            topicId: task.topicId,
                            chapterId: task.chapterId,
                          })
                        }
                      >
                        Open →
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Skipped Tasks Drawer if any */}
            {skippedTasks.length > 0 && (
              <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-2">
                <div className="text-[11px] font-semibold text-[#6E7B72]">
                  Skipped for today ({skippedTasks.length})
                </div>
                <div className="space-y-1.5">
                  {skippedTasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 text-xs text-[#6E7B72]"
                    >
                      <span className="truncate">{st.title}</span>
                      <button
                        type="button"
                        onClick={() => onToggleTaskSkipped(st.id)}
                        className="text-[#164A31] font-medium hover:underline shrink-0 cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student-Entered Upcoming Milestones (Never assumes external schedule) */}
            <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#164A31]" />
                  <span className="text-xs font-semibold text-[#14241B]">
                    Your Upcoming Study Milestones
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm((v) => !v)}
                  className="text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
                >
                  {showMilestoneForm ? "Close" : "+ Add Milestone"}
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
                      Save Milestone
                    </Button>
                  </div>
                </form>
              )}

              {milestones.length === 0 ? (
                <p className="text-[11px] text-[#6E7B72] leading-relaxed">
                  Add a personal test date or chapter target above so your daily plan can prioritise that subject. Vidyakshara only plans around milestones you enter.
                </p>
              ) : (
                <div className="space-y-2">
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
                          aria-label="Delete milestone"
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
          BELOW THE FOLD 1: CONTINUE WHERE YOU LEFT OFF & MISTAKE / REVISION LOOP
         ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left 7 Cols: Continue Where You Left Off */}
        <div className="lg:col-span-7 bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-1.5">
            <MetaLine
              items={[
                hasLearningHistory
                  ? "Continue Where You Left Off"
                  : "Up Next in Your Syllabus",
                recommendation.subjectName,
              ]}
            />
            <h2 className="text-xl font-bold text-[#14241B]">
              {activeOrNextTopic.title} — Key Takeaways
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-2.5">
            {activeOrNextTopic.keyTakeaways.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-[#14241B] leading-relaxed"
              >
                <span className="font-mono text-xs font-semibold text-[#164A31] mt-0.5">
                  0{idx + 1}.
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#6E7B72]">
              Includes interactive concept simulator + step-by-step worked example
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  onNavigate("doubts", {
                    subjectId: activeOrNextTopic.subjectId,
                    topicId: activeOrNextTopic.id,
                    prefillDoubt: `Can you explain the main exam shortcut for ${activeOrNextTopic.title}?`,
                  })
                }
              >
                Ask AI Tutor
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  onNavigate("learn", {
                    subjectId: activeOrNextTopic.subjectId,
                    topicId: activeOrNextTopic.id,
                  })
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Concept Lesson
              </Button>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Review Mistakes & Spaced Revision Status */}
        <div className="lg:col-span-5 bg-white border border-[#E2E5DC] rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-1.5">
            <MetaLine items={["Smart Revision & Mistake Recovery"]} />
            <h2 className="text-xl font-bold text-[#14241B]">
              {unresolvedMistakeQuestionIds.length > 0
                ? `${unresolvedMistakeQuestionIds.length} unresolved mistake${
                    unresolvedMistakeQuestionIds.length > 1 ? "s" : ""
                  } ready to review`
                : "No unresolved mistakes pending"}
            </h2>
            <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
              {unresolvedMistakeQuestionIds.length > 0
                ? "When you miss a question, Vidyakshara recommends reviewing the underlying concept and re-attempting the question in a Revision Session."
                : "Any wrong attempt or bookmarked topic is automatically added to your Revision Queue so you can review it before your next mock test."}
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
                    className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#D97706]/30 space-y-1"
                  >
                    <MetaLine items={[q.examTag, "Unresolved Mistake"]} />
                    <p className="text-xs font-medium text-[#14241B] line-clamp-2">
                      {q.questionText}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#EAF2EC] border border-[#164A31]/25 text-xs text-[#14241B] space-y-1">
              <div className="font-semibold text-[#164A31]">
                Next recommended action:
              </div>
              <p>
                Attempt at least 3 questions in a topic to establish a meaningful accuracy signal.
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
              onClick={() => onNavigate("practice")}
            >
              Practise Questions
            </Button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          BELOW THE FOLD 2: EXPLORE SUBJECTS
         ===================================================================== */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <MetaLine items={[`${profile.targetExam} Curriculum`]} />
            <h2 className="text-2xl font-bold text-[#14241B] mt-0.5">
              Explore your subjects
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onNavigate("learn")}
          >
            Open Full Syllabus
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {applicableSubjects.map((subj) => {
            const subjTopicIds = subj.chapters.flatMap((c) => c.topicIds);
            const doneCount = state.completedTopicIds.filter((id) =>
              subjTopicIds.includes(id)
            ).length;

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

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#14241B]">
                        {subj.name}
                      </h3>
                      <span className="text-xs font-mono tabular-nums text-[#164A31] font-semibold">
                        {doneCount}/{subjTopicIds.length} topics
                      </span>
                    </div>
                    <p className="text-xs text-[#48564D] leading-relaxed">
                      {subj.description}
                    </p>
                  </div>

                  {/* Chapter links */}
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
                    Learn {subj.name}
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
          BELOW THE FOLD 3: PRACTISE QUESTIONS & ACTUAL LEARNING MILESTONES
         ===================================================================== */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <MetaLine
            items={[
              "Exam-Style Question Bank & Timed Checkpoints",
              "Configurable +4 / −1 Marking",
            ]}
          />
          <h2 className="text-xl sm:text-2xl font-bold text-[#14241B]">
            Test your understanding with chapter questions or a timed mock checkpoint
          </h2>
          <p className="text-sm text-[#48564D] leading-relaxed">
            Every attempt feeds directly into your Revision Queue and Progress Insights so you always know which topics are strong and which need a second look.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              onClick={() => onNavigate("practice")}
            >
              Start practising questions
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onNavigate("mock-tests")}
            >
              Open Timed Mock Tests
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#14241B]">
              Study Milestones (Real Activity)
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#164A31] font-semibold">
              {achievedMilestoneCount} / {actualMilestones.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {actualMilestones.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-2.5 text-xs leading-relaxed"
              >
                {m.achieved ? (
                  <CheckCircle2 className="w-4 h-4 text-[#164A31] shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-[#6E7B72] shrink-0 mt-0.5" />
                )}
                <span
                  className={
                    m.achieved
                      ? "text-[#14241B] font-medium"
                      : "text-[#6E7B72]"
                  }
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
