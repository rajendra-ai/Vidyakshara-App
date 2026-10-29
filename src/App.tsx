/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  BookOpen,
  Compass,
  FileCheck2,
  FileText,
  Home,
  Menu,
  MessageSquare,
  RotateCcw,
  Settings,
  Target,
  UserPlus,
  X,
} from "lucide-react";
import {
  ActivePracticeSession,
  AppRoute,
  DoubtMessage,
  MockTestAttemptResult,
  QuestionAttempt,
  RevisionSessionRecord,
  StudentLearningState,
  StudentMilestone,
  StudentNote,
  StudentProfile,
  StudyTask,
  SubjectId,
  TopicRevisionRecord,
} from "./types/domain";
import {
  QUESTIONS,
  TOPICS,
  buildStudyTasksForExam,
  createDemoStudentState,
  createFreshStudentState,
} from "./data/curriculum";
import { buildAdaptiveDailyPlan } from "./utils/personalisation";
import { migrateLegacyStudentStateMath } from "./utils/mathContentContract";
import { Button } from "./components/ui/Primitives";
import { QuestionSubmissionPayload } from "./components/questions/QuestionCard";
import { DiscoveryAndAuthView } from "./components/views/DiscoveryAndAuthView";
import { HomeView } from "./components/views/HomeView";
import { LearnView } from "./components/views/LearnView";
import { PracticeView } from "./components/views/PracticeView";
import { DoubtSolverView } from "./components/views/DoubtSolverView";
import { MockTestsView } from "./components/views/MockTestsView";
import {
  NotesView,
  ProgressView,
  RevisionView,
  SettingsView,
} from "./components/views/SecondaryAreasView";
import {
  CareerAssessmentState,
  CareerGuidanceReport,
  CareerSavedReportEntry,
} from "./types/career";
import {
  appendReportToHistory,
  createFreshCareerAssessmentState,
  resetCareerStateForTabEntry,
} from "./utils/careerScoringEngine";
import { CareerDiscoveryView } from "./components/views/CareerDiscoveryView";

const STORAGE_KEY = "vidyakshara_student_state_v2";
const LEGACY_CAREER_STORAGE_KEY = "vidyakshara_career_assessment_v1";
const CAREER_IN_PROGRESS_STORAGE_KEY = "vidyakshara_career_in_progress_v2";
const CAREER_HISTORY_STORAGE_KEY = "vidyakshara_career_report_history_v1";
const TOKENS_KEY = "vidyakshara_session_tokens_v2";
const BROWSER_INSTANCE_KEY = "vidyakshara_browser_instance_v2";

function loadStoredCareerHistory(): CareerSavedReportEntry[] {
  try {
    const raw = window.localStorage.getItem(CAREER_HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as CareerSavedReportEntry[];
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return [];
}

function saveStoredCareerHistory(history: CareerSavedReportEntry[]): void {
  try {
    window.localStorage.setItem(
      CAREER_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, 25))
    );
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Hydrates and normalizes Career Discovery state on startup or browser refresh:
 * - Never restores a completed report (`stage === "report"` or `completedReport`)
 *   into the active session.
 * - Preserves any completed report found in legacy storage or student state by
 *   archiving it into `careerReportHistory` and `CAREER_HISTORY_STORAGE_KEY`.
 * - Ensures the active `careerAssessment` always starts on `stage: "landing"`.
 */
function normalizeHydratedCareerState(
  baseStudentState: StudentLearningState
): StudentLearningState {
  let history: CareerSavedReportEntry[] = [
    ...(baseStudentState.careerReportHistory || []),
  ];
  const storedHistory = loadStoredCareerHistory();
  storedHistory.forEach((entry) => {
    if (
      entry &&
      entry.report &&
      !history.some((h) => h.reportId === entry.reportId)
    ) {
      history.push(entry);
    }
  });

  // Check legacy storage key and migrate any completed report to history, then remove the legacy key
  let legacyCandidate: CareerAssessmentState | null = null;
  try {
    const rawLegacy = window.localStorage.getItem(LEGACY_CAREER_STORAGE_KEY);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy) as CareerAssessmentState;
      if (parsedLegacy && typeof parsedLegacy === "object") {
        legacyCandidate = parsedLegacy;
      }
      window.localStorage.removeItem(LEGACY_CAREER_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }

  if (legacyCandidate) {
    const { archivedReportEntry } = resetCareerStateForTabEntry(legacyCandidate);
    if (archivedReportEntry) {
      history = appendReportToHistory(history, archivedReportEntry.report, {
        attemptId: archivedReportEntry.attemptId,
        accessToken: archivedReportEntry.accessToken,
      });
    }
  }

  // Check in-progress draft slot or baseStudentState.careerAssessment
  let candidateActive: CareerAssessmentState | null =
    baseStudentState.careerAssessment || null;
  try {
    const rawDraft = window.localStorage.getItem(CAREER_IN_PROGRESS_STORAGE_KEY);
    if (rawDraft) {
      const parsedDraft = JSON.parse(rawDraft) as CareerAssessmentState;
      if (parsedDraft && typeof parsedDraft === "object") {
        candidateActive = parsedDraft;
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  const { nextActiveState, archivedReportEntry } =
    resetCareerStateForTabEntry(candidateActive);
  if (archivedReportEntry) {
    history = appendReportToHistory(history, archivedReportEntry.report, {
      attemptId: archivedReportEntry.attemptId,
      accessToken: archivedReportEntry.accessToken,
    });
  }

  saveStoredCareerHistory(history);

  try {
    if (Object.keys(nextActiveState.responses || {}).length > 0) {
      window.localStorage.setItem(
        CAREER_IN_PROGRESS_STORAGE_KEY,
        JSON.stringify(nextActiveState)
      );
    } else {
      window.localStorage.removeItem(CAREER_IN_PROGRESS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }

  return {
    ...baseStudentState,
    careerAssessment: nextActiveState,
    careerReportHistory: history,
  };
}

function getBrowserInstanceId(): string {
  try {
    const existing = window.localStorage.getItem(BROWSER_INSTANCE_KEY);
    if (existing) return existing;
    const generated = `b-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(BROWSER_INSTANCE_KEY, generated);
    return generated;
  } catch {
    return "local-browser";
  }
}

function getEffectiveStudentServerId(profile: StudentProfile): string {
  if (profile.isDemoAccount) {
    return `${profile.id}-${getBrowserInstanceId()}`;
  }
  return profile.id;
}

function getStoredTokens(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(TOKENS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

function saveStoredToken(studentId: string, token: string): void {
  try {
    const current = getStoredTokens();
    current[studentId] = token;
    window.localStorage.setItem(TOKENS_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage write errors
  }
}

export default function App() {
  const [state, setState] = useState<StudentLearningState>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StudentLearningState;
        if (parsed && parsed.profile) {
          return normalizeHydratedCareerState(
            migrateLegacyStudentStateMath(parsed)
          );
        }
      }
    } catch {
      // Fallback to demo state if localStorage is unavailable
    }
    return normalizeHydratedCareerState(
      migrateLegacyStudentStateMath(createDemoStudentState())
    );
  });

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("careerAttemptId") && params.get("accessToken")) {
        return "career-discovery";
      }
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StudentLearningState;
        if (parsed?.profile?.lastActiveRoute) {
          return parsed.profile.lastActiveRoute;
        }
      }
    } catch {
      // Ignore storage read error
    }
    return "discover";
  });

  const [navContext, setNavContext] = useState<{
    subjectId?: SubjectId;
    chapterId?: string;
    topicId?: string;
    prefillDoubt?: string;
  }>({});

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [serverSyncStatus, setServerSyncStatus] = useState<
    "synced" | "local-only" | "syncing"
  >("synced");
  const [sessionReadyVersion, setSessionReadyVersion] = useState(0);

  const activeSessionTokenRef = useRef<string | null>(null);
  const activeServerStudentIdRef = useRef<string | null>(null);

  // 0. Load secure Career Intelligence Report link if opened from Email/WhatsApp
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const attemptId = params.get("careerAttemptId")?.trim();
      const accessToken = params.get("accessToken")?.trim();
      if (!attemptId || !accessToken) return;

      let cancelled = false;
      fetch(
        `/api/career/attempts/${encodeURIComponent(
          attemptId
        )}?accessToken=${encodeURIComponent(accessToken)}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (cancelled || !data?.ok) return;
          const loadedCareerState: CareerAssessmentState = {
            sessionId: `cit-sess-link-${data.attemptId}`,
            stage: data.completedReport ? "report" : "questions",
            currentQuestionIndex: 0,
            attemptId: data.attemptId,
            accessToken,
            studentDetails: data.studentDetails || null,
            responses: data.responses || {},
            completedReport: data.completedReport || null,
            updatedAt: data.updatedAt,
          };
          try {
            window.history.replaceState({}, "", window.location.pathname);
          } catch {
            // Ignore history replace errors
          }
          setState((prev) => {
            const updatedHistory = data.completedReport
              ? appendReportToHistory(
                  prev.careerReportHistory,
                  data.completedReport,
                  { attemptId: data.attemptId, accessToken }
                )
              : prev.careerReportHistory;
            if (updatedHistory) {
              saveStoredCareerHistory(updatedHistory);
            }
            return {
              ...prev,
              careerAssessment: loadedCareerState,
              careerReportHistory: updatedHistory,
            };
          });
          setCurrentRoute("career-discovery");
        })
        .catch(() => {
          // Ignore network error
        });

      return () => {
        cancelled = true;
      };
    } catch {
      return;
    }
  }, []);

  // 1. Local browser persistence (never persist a completed report in the active careerAssessment slot)
  useEffect(() => {
    try {
      const { nextActiveState, archivedReportEntry } =
        resetCareerStateForTabEntry(state.careerAssessment);
      const historyToPersist = archivedReportEntry
        ? appendReportToHistory(
            state.careerReportHistory,
            archivedReportEntry.report,
            {
              attemptId: archivedReportEntry.attemptId,
              accessToken: archivedReportEntry.accessToken,
            }
          )
        : state.careerReportHistory;
      const stateForStorage: StudentLearningState = {
        ...state,
        careerAssessment: nextActiveState,
        careerReportHistory: historyToPersist,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateForStorage));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // 2. Initialise or verify per-student session token on the server
  useEffect(() => {
    const profile = state.profile;
    if (!profile) return;

    const serverStudentId = getEffectiveStudentServerId(profile);
    const tokens = getStoredTokens();
    const existingToken = tokens[serverStudentId];

    // Reset active refs immediately when profile identity changes to prevent cross-profile writes
    activeSessionTokenRef.current = null;
    activeServerStudentIdRef.current = null;

    let cancelled = false;
    setServerSyncStatus("syncing");

    fetch("/api/student/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: serverStudentId,
        existingToken,
        initialState: state,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Session init failed");
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.sessionToken) {
          activeSessionTokenRef.current = data.sessionToken;
          activeServerStudentIdRef.current = serverStudentId;
          saveStoredToken(serverStudentId, data.sessionToken);
          setServerSyncStatus("synced");
          setSessionReadyVersion((v) => v + 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerSyncStatus("local-only");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state.profile?.id, state.profile?.isDemoAccount]);

  // 3. Push state updates to the authenticated server record
  useEffect(() => {
    const profile = state.profile;
    const token = activeSessionTokenRef.current;
    const serverStudentId = activeServerStudentIdRef.current;
    if (!profile || !token || !serverStudentId) return;
    if (serverStudentId !== getEffectiveStudentServerId(profile)) return;

    const timer = window.setTimeout(() => {
      fetch(`/api/student/${encodeURIComponent(serverStudentId)}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ state }),
      })
        .then((res) => {
          setServerSyncStatus(res.ok ? "synced" : "local-only");
        })
        .catch(() => {
          setServerSyncStatus("local-only");
        });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [state, sessionReadyVersion]);

  const handleNavigate = (
    route: AppRoute,
    options?: {
      subjectId?: SubjectId;
      chapterId?: string;
      topicId?: string;
      prefillDoubt?: string;
    }
  ) => {
    setNavContext(options || {});
    setCurrentRoute(route);
    setMobileMoreOpen(false);
    setState((prev) => {
      let nextCareerAssessment = prev.careerAssessment;
      let nextCareerHistory = prev.careerReportHistory;

      // Clicking the Career Discovery tab always resets the active session to the fresh landing page
      // and archives any completed report so no previous candidate's report is displayed.
      if (route === "career-discovery") {
        const { nextActiveState, archivedReportEntry } =
          resetCareerStateForTabEntry(prev.careerAssessment);
        nextCareerAssessment = nextActiveState;
        if (archivedReportEntry) {
          nextCareerHistory = appendReportToHistory(
            prev.careerReportHistory,
            archivedReportEntry.report,
            {
              attemptId: archivedReportEntry.attemptId,
              accessToken: archivedReportEntry.accessToken,
            }
          );
          saveStoredCareerHistory(nextCareerHistory);
        }
        try {
          window.localStorage.removeItem(LEGACY_CAREER_STORAGE_KEY);
          if (Object.keys(nextActiveState.responses || {}).length > 0) {
            window.localStorage.setItem(
              CAREER_IN_PROGRESS_STORAGE_KEY,
              JSON.stringify(nextActiveState)
            );
          } else {
            window.localStorage.removeItem(CAREER_IN_PROGRESS_STORAGE_KEY);
          }
        } catch {
          // Ignore localStorage errors
        }
      }

      const updatedProfile =
        prev.profile && route !== "discover" && route !== "onboarding"
          ? {
              ...prev.profile,
              lastActiveRoute: route,
              lastActiveTopicId:
                options?.topicId || prev.profile.lastActiveTopicId,
            }
          : prev.profile;

      return {
        ...prev,
        profile: updatedProfile,
        careerAssessment: nextCareerAssessment,
        careerReportHistory: nextCareerHistory,
      };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Onboarding & Mode Handlers
  const handleCompleteOnboarding = (newProfile: StudentProfile) => {
    const fresh = createFreshStudentState(newProfile);
    const adaptiveTasks = buildAdaptiveDailyPlan(fresh);
    const stateWithTasks = {
      ...fresh,
      studyTasks: adaptiveTasks.length > 0 ? adaptiveTasks : fresh.studyTasks,
    };
    setState(stateWithTasks);
    const goal = newProfile.preferences.immediateGoal;
    const targetRoute: AppRoute =
      goal === "concepts"
        ? "learn"
        : goal === "practice"
        ? "practice"
        : "home";
    setCurrentRoute(targetRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEnterDemoMode = () => {
    const demo = createDemoStudentState();
    setState(demo);
    setCurrentRoute("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =========================================================================
   * DAILY STUDY PLANNER & MILESTONE HANDLERS
   * ======================================================================= */
  const handleToggleTaskCompleted = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  const handleToggleTaskSkipped = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      studyTasks: prev.studyTasks.map((t) =>
        t.id === taskId ? { ...t, skipped: !t.skipped } : t
      ),
    }));
  };

  const handleMoveTask = (taskId: string, direction: "up" | "down") => {
    setState((prev) => {
      const active = prev.studyTasks.filter((t) => !t.skipped);
      const skipped = prev.studyTasks.filter((t) => t.skipped);
      const idx = active.findIndex((t) => t.id === taskId);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= active.length) return prev;
      const reordered = [...active];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(targetIdx, 0, moved);
      return {
        ...prev,
        studyTasks: [...reordered, ...skipped],
      };
    });
  };

  const handleAddCustomTask = (
    taskInput: Omit<StudyTask, "id" | "completed">
  ) => {
    const newTask: StudyTask = {
      ...taskInput,
      id: `custom-task-${Date.now()}`,
      completed: false,
    };
    setState((prev) => ({
      ...prev,
      studyTasks: [newTask, ...prev.studyTasks],
    }));
  };

  const handleRegenerateDailyPlan = () => {
    setState((prev) => {
      const nextTasks = buildAdaptiveDailyPlan(prev);
      return {
        ...prev,
        studyTasks: nextTasks,
      };
    });
  };

  const handleAddMilestone = (
    milestoneInput: Omit<StudentMilestone, "id" | "completed">
  ) => {
    const newMilestone: StudentMilestone = {
      ...milestoneInput,
      id: `ms-${Date.now()}`,
      completed: false,
    };
    setState((prev) => {
      const updatedState: StudentLearningState = {
        ...prev,
        studentMilestones: [...(prev.studentMilestones || []), newMilestone],
      };
      return {
        ...updatedState,
        studyTasks: buildAdaptiveDailyPlan(updatedState),
      };
    });
  };

  const handleToggleMilestone = (milestoneId: string) => {
    setState((prev) => ({
      ...prev,
      studentMilestones: (prev.studentMilestones || []).map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
    }));
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    setState((prev) => ({
      ...prev,
      studentMilestones: (prev.studentMilestones || []).filter(
        (m) => m.id !== milestoneId
      ),
    }));
  };

  /* =========================================================================
   * CONCEPT LEARNING, PRACTICE, REVISION & MOCK TEST HANDLERS
   * ======================================================================= */
  const handleToggleTopicComplete = (topicId: string) => {
    setState((prev) => {
      const exists = prev.completedTopicIds.includes(topicId);
      const nextCompleted = exists
        ? prev.completedTopicIds.filter((id) => id !== topicId)
        : [...prev.completedTopicIds, topicId];

      const topic = TOPICS.find((t) => t.id === topicId);
      const existingRev = prev.revisionRecords?.[topicId];
      const nextRevisionRecords: Record<string, TopicRevisionRecord> = {
        ...(prev.revisionRecords || {}),
      };

      if (!exists && topic && !existingRev) {
        nextRevisionRecords[topicId] = {
          topicId,
          subjectId: topic.subjectId,
          lastReviewedAt: "Today",
          revisionCount: 1,
          confidenceLevel: "steady",
          nextSuggestedReview: "In 3 days (First Spaced Review)",
          intervalDays: 3,
        };
      }

      return {
        ...prev,
        completedTopicIds: nextCompleted,
        revisionRecords: nextRevisionRecords,
        studyTasks: prev.studyTasks.map((task) =>
          task.topicId === topicId && task.type === "concept"
            ? { ...task, completed: !exists }
            : task
        ),
      };
    });
  };

  const handleMarkKnowledgeCheckDone = (topicId: string) => {
    setState((prev) => {
      const existing = prev.knowledgeCheckCompletedTopicIds || [];
      if (existing.includes(topicId)) return prev;
      return {
        ...prev,
        knowledgeCheckCompletedTopicIds: [...existing, topicId],
      };
    });
  };

  const handleUpdatePracticeSession = (
    session: ActivePracticeSession | null
  ) => {
    setState((prev) => ({
      ...prev,
      activePracticeSession: session,
    }));
  };

  const handleRecordQuestionAttempt = (payload: QuestionSubmissionPayload) => {
    const q = QUESTIONS.find((item) => item.id === payload.questionId);
    if (!q) return;

    const newAttempt: QuestionAttempt = {
      id: `att-${Date.now()}`,
      questionId: payload.questionId,
      topicId: q.topicId,
      chapterId: q.chapterId,
      subjectId: q.subjectId,
      questionType: q.questionType,
      selectedOptionId: payload.selectedOptionId,
      selectedOptionIds: payload.selectedOptionIds,
      enteredNumericalValue: payload.enteredNumericalValue,
      isCorrect: payload.isCorrect,
      marksAwarded: payload.marksAwarded,
      timeSpentSeconds: 45,
      attemptedAt: "Just now",
      markedForRevision: !payload.isCorrect,
    };

    setState((prev) => {
      const nextAttempts = [...prev.attempts, newAttempt];
      const nextRevisionRecords: Record<string, TopicRevisionRecord> = {
        ...(prev.revisionRecords || {}),
      };

      // If incorrect, mark topic in spaced revision schedule for immediate recovery
      if (!payload.isCorrect) {
        const existingRec = nextRevisionRecords[q.topicId];
        nextRevisionRecords[q.topicId] = {
          topicId: q.topicId,
          subjectId: q.subjectId,
          lastReviewedAt: existingRec?.lastReviewedAt || "Today",
          revisionCount: existingRec?.revisionCount || 0,
          confidenceLevel: "needs-work",
          nextSuggestedReview: "Due Today (Mistake Recovery)",
          intervalDays: 1,
        };
      }

      return {
        ...prev,
        attempts: nextAttempts,
        revisionRecords: nextRevisionRecords,
      };
    });
  };

  const handleToggleBookmarkQuestion = (questionId: string) => {
    setState((prev) => {
      const exists = prev.bookmarkedQuestionIds.includes(questionId);
      return {
        ...prev,
        bookmarkedQuestionIds: exists
          ? prev.bookmarkedQuestionIds.filter((id) => id !== questionId)
          : [...prev.bookmarkedQuestionIds, questionId],
      };
    });
  };

  const handleToggleBookmarkTopic = (topicId: string) => {
    setState((prev) => {
      const current = prev.bookmarkedTopicIds || [];
      const exists = current.includes(topicId);
      return {
        ...prev,
        bookmarkedTopicIds: exists
          ? current.filter((id) => id !== topicId)
          : [...current, topicId],
      };
    });
  };

  const handleCompleteRevisionSession = (
    topicId: string,
    confidenceLevel: "needs-work" | "steady" | "confident",
    questionsReviewedCount: number,
    questionsResolvedCount: number
  ) => {
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) return;

    const intervalDays =
      confidenceLevel === "confident"
        ? 7
        : confidenceLevel === "steady"
        ? 3
        : 1;
    const nextSuggestedReview =
      intervalDays === 1
        ? "Tomorrow (1-day recovery)"
        : `In ${intervalDays} days (Spaced Revision)`;

    setState((prev) => {
      const prevRec = prev.revisionRecords?.[topicId];
      const updatedRecord: TopicRevisionRecord = {
        topicId,
        subjectId: topic.subjectId,
        lastReviewedAt: "Just now",
        revisionCount: (prevRec?.revisionCount || 0) + 1,
        confidenceLevel,
        nextSuggestedReview,
        intervalDays,
      };

      const newSessionRecord: RevisionSessionRecord = {
        id: `rev-sess-${Date.now()}`,
        topicId,
        subjectId: topic.subjectId,
        title: `${topic.title} — Guided Revision`,
        completedAt: "Just now",
        questionsReviewedCount,
        questionsResolvedCount,
      };

      return {
        ...prev,
        revisionRecords: {
          ...(prev.revisionRecords || {}),
          [topicId]: updatedRecord,
        },
        revisionSessions: [
          newSessionRecord,
          ...(prev.revisionSessions || []),
        ],
        studyTasks: prev.studyTasks.map((t) =>
          t.type === "revision" && (!t.topicId || t.topicId === topicId)
            ? { ...t, completed: true }
            : t
        ),
      };
    });
  };

  const handleAddDoubtMessages = (
    userMsg: DoubtMessage,
    tutorMsg: DoubtMessage
  ) => {
    setState((prev) => ({
      ...prev,
      doubtHistory: [...prev.doubtHistory, userMsg, tutorMsg],
    }));
  };

  const handleClearDoubtHistory = () => {
    setState((prev) => ({
      ...prev,
      doubtHistory: prev.doubtHistory.slice(0, 1),
    }));
  };

  const handleSaveMockResult = (result: MockTestAttemptResult) => {
    setState((prev) => {
      // Also record each answered question from the mock test into attempts so Revision & Progress stay unified
      const newAttemptsFromMock: QuestionAttempt[] = [];
      const nextRevisionRecords: Record<string, TopicRevisionRecord> = {
        ...(prev.revisionRecords || {}),
      };

      Object.entries(result.answers).forEach(([qid, selectedOpt]) => {
        if (!selectedOpt) return;
        const q = QUESTIONS.find((item) => item.id === qid);
        if (!q) return;
        const isCorrect = selectedOpt === q.correctOptionId;
        const negMark =
          result.negativeMarkingEnabled === false ? 0 : q.marks.incorrect;

        newAttemptsFromMock.push({
          id: `mock-att-${result.id}-${qid}`,
          questionId: q.id,
          topicId: q.topicId,
          chapterId: q.chapterId,
          subjectId: q.subjectId,
          questionType: q.questionType,
          selectedOptionId: selectedOpt,
          isCorrect,
          marksAwarded: isCorrect ? q.marks.correct : negMark,
          timeSpentSeconds: 60,
          attemptedAt: "Mock Test",
          markedForRevision: !isCorrect,
        });

        if (!isCorrect) {
          const existingRec = nextRevisionRecords[q.topicId];
          nextRevisionRecords[q.topicId] = {
            topicId: q.topicId,
            subjectId: q.subjectId,
            lastReviewedAt: existingRec?.lastReviewedAt || "Today",
            revisionCount: existingRec?.revisionCount || 0,
            confidenceLevel: "needs-work",
            nextSuggestedReview: "Due Today (Mock Test Mistake)",
            intervalDays: 1,
          };
        }
      });

      return {
        ...prev,
        mockResults: [result, ...prev.mockResults],
        attempts: [...prev.attempts, ...newAttemptsFromMock],
        revisionRecords: nextRevisionRecords,
        studyTasks: prev.studyTasks.map((t) =>
          t.type === "mock" ? { ...t, completed: true } : t
        ),
      };
    });
  };

  const handleAddNote = (
    title: string,
    subjectId: SubjectId,
    content: string,
    attachmentName?: string,
    attachmentSizeLabel?: string
  ) => {
    const newNote: StudentNote = {
      id: `note-${Date.now()}`,
      title,
      subjectId,
      content,
      attachmentName,
      attachmentSizeLabel,
      updatedAt: "Just now",
    };
    setState((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
  };

  const handleDeleteNote = (noteId: string) => {
    setState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  };

  const handleUpdateProfile = (updatedProfile: StudentProfile) => {
    setState((prev) => {
      const examOrTimeChanged =
        prev.profile?.targetExam !== updatedProfile.targetExam ||
        prev.profile?.classLevel !== updatedProfile.classLevel ||
        prev.profile?.preferences.dailyStudyMinutes !==
          updatedProfile.preferences.dailyStudyMinutes;

      const updatedState: StudentLearningState = {
        ...prev,
        profile: updatedProfile,
      };

      return {
        ...updatedState,
        studyTasks: examOrTimeChanged
          ? buildAdaptiveDailyPlan(updatedState)
          : prev.studyTasks,
      };
    });
  };

  const activeCareerState: CareerAssessmentState =
    state.careerAssessment || createFreshCareerAssessmentState("landing");

  const handleUpdateCareerState = (nextCareerState: CareerAssessmentState) => {
    try {
      window.localStorage.removeItem(LEGACY_CAREER_STORAGE_KEY);
      const answeredCount = Object.keys(nextCareerState.responses || {}).length;
      if (
        !nextCareerState.completedReport &&
        nextCareerState.stage !== "report" &&
        answeredCount > 0 &&
        answeredCount < 40
      ) {
        window.localStorage.setItem(
          CAREER_IN_PROGRESS_STORAGE_KEY,
          JSON.stringify(nextCareerState)
        );
      } else {
        window.localStorage.removeItem(CAREER_IN_PROGRESS_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
    setState((prev) => ({
      ...prev,
      careerAssessment: nextCareerState,
    }));
  };

  const handleArchiveCompletedReport = (
    report: CareerGuidanceReport,
    attemptMeta?: { attemptId?: string; accessToken?: string }
  ) => {
    setState((prev) => {
      const updatedHistory = appendReportToHistory(
        prev.careerReportHistory,
        report,
        attemptMeta
      );
      saveStoredCareerHistory(updatedHistory);
      return {
        ...prev,
        careerReportHistory: updatedHistory,
      };
    });
  };

  const handleClearCareerData = () => {
    try {
      window.localStorage.removeItem(LEGACY_CAREER_STORAGE_KEY);
      window.localStorage.removeItem(CAREER_IN_PROGRESS_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setState((prev) => ({
      ...prev,
      careerAssessment: createFreshCareerAssessmentState("landing"),
    }));
  };

  // Render Public Landing Page or 3-Step Student Onboarding when requested
  if (
    !state.profile ||
    currentRoute === "discover" ||
    currentRoute === "onboarding"
  ) {
    return (
      <DiscoveryAndAuthView
        initialStep={currentRoute === "onboarding" ? "onboarding" : "discover"}
        onCompleteOnboarding={handleCompleteOnboarding}
        onEnterDemoMode={handleEnterDemoMode}
        careerState={activeCareerState}
        onUpdateCareerState={handleUpdateCareerState}
        onArchiveCompletedReport={handleArchiveCompletedReport}
        onClearCareerData={handleClearCareerData}
        onOpenCareerDiscovery={() => handleNavigate("career-discovery")}
      />
    );
  }

  const profile = state.profile;
  const isComfortableText =
    profile.preferences.fontSizeScale === "comfortable";

  // Section D: Prioritise Home, Learn, Practice, AI Tutor, and Revision
  const primaryNavItems: {
    id: AppRoute;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "home", label: "Home", icon: <Home className="w-4 h-4" /> },
    { id: "learn", label: "Learn", icon: <BookOpen className="w-4 h-4" /> },
    {
      id: "practice",
      label: "Practice",
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: "doubts",
      label: "AI Tutor",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "revision",
      label: "Revision",
      icon: <RotateCcw className="w-4 h-4" />,
    },
  ];

  // Secondary functions placed under a sensible menu / workspace bar
  const secondaryNavItems: {
    id: AppRoute;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "career-discovery",
      label: "Career Discovery",
      icon: <Compass className="w-3.5 h-3.5" />,
    },
    {
      id: "mock-tests",
      label: "Mock Tests",
      icon: <FileCheck2 className="w-3.5 h-3.5" />,
    },
    {
      id: "progress",
      label: "My Progress",
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: "notes",
      label: "Notes & Resources",
      icon: <FileText className="w-3.5 h-3.5" />,
    },
    {
      id: "settings",
      label: "Profile & Settings",
      icon: <Settings className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAF8F3] text-[#14241B] overflow-x-hidden pb-16 md:pb-0 ${
        isComfortableText ? "text-[17px]" : ""
      }`}
    >
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#164A31] focus:text-white focus:rounded-lg focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="print:hidden w-full bg-white border-b border-[#E2E5DC]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate("home");
            }}
            className="text-xl font-bold tracking-tight text-[#164A31] whitespace-nowrap shrink-0"
          >
            Vidyakshara
          </a>

          {/* Zone 2: 5 Prioritised Navigation Links (Home, Learn, Practice, AI Tutor, Revision) */}
          <nav
            aria-label="Primary student navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#48564D]"
          >
            {primaryNavItems.map((item) => {
              const active = currentRoute === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.id);
                  }}
                  className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                    active
                      ? "text-[#164A31] font-semibold underline decoration-2 underline-offset-8"
                      : "hover:text-[#14241B] hover:underline underline-offset-8"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (plus mobile More menu trigger) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() =>
                handleNavigate(
                  currentRoute === "learn" ? "practice" : "learn"
                )
              }
            >
              {currentRoute === "learn"
                ? "Practise questions"
                : "Continue learning"}
            </Button>

            <button
              type="button"
              onClick={() => setMobileMoreOpen((v) => !v)}
              aria-label="More study tools"
              className="md:hidden p-2 rounded-lg border border-[#E2E5DC] text-[#14241B] hover:bg-[#F3F1EA] cursor-pointer"
            >
              {mobileMoreOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Workspace Bar (Secondary Functions + Honest Sample/Personal Mode Switch) */}
      <div className="print:hidden w-full bg-[#F3F1EA] border-b border-[#E2E5DC]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Secondary Tools on Desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            {secondaryNavItems.map((item) => {
              const active = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "bg-white text-[#164A31] shadow-2xs"
                      : "text-[#48564D] hover:text-[#14241B] hover:bg-white/60"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Honest Mode Status & Quick Onboarding/Landing Access */}
          <div className="flex flex-wrap items-center gap-3 text-xs ml-auto">
            {profile.isDemoAccount ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#48564D]">
                  <strong className="text-[#14241B]">Sample Mode:</strong>{" "}
                  Aarav (Class 12 · JEE Main)
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate("onboarding")}
                  className="inline-flex items-center gap-1 font-semibold text-[#164A31] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Personalise your own plan →
                </button>
                <span className="text-[#6E7B72]" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => handleNavigate("discover")}
                  className="text-[#48564D] hover:text-[#14241B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  About Vidyakshara
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 text-[#48564D]">
                <span>
                  <strong className="text-[#14241B]">{profile.name}</strong>{" "}
                  · Class {profile.classLevel} · {profile.targetExam}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate("onboarding")}
                  className="text-[#164A31] font-medium hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Change Exam/Class
                </button>
                <span className="text-[#6E7B72]" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => handleNavigate("discover")}
                  className="hover:text-[#14241B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  About Vidyakshara
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Secondary Menu Drawer */}
        {mobileMoreOpen && (
          <div className="md:hidden px-4 py-4 bg-white border-t border-[#E2E5DC] space-y-3">
            <div className="text-xs font-semibold text-[#6E7B72]">
              More Study Tools &amp; Preferences
            </div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`px-3.5 py-2.5 rounded-lg text-left text-xs font-medium border flex items-center gap-2 cursor-pointer ${
                    currentRoute === item.id
                      ? "bg-[#EAF2EC] border-[#164A31] text-[#164A31]"
                      : "bg-[#FAF8F3] border-[#E2E5DC] text-[#14241B]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNavigate("onboarding")}
                className="px-3.5 py-2.5 rounded-lg text-left text-xs font-medium border bg-[#FAF8F3] border-[#E2E5DC] text-[#164A31] flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Change Class / Exam</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate("discover")}
                className="px-3.5 py-2.5 rounded-lg text-left text-xs font-medium border bg-[#FAF8F3] border-[#E2E5DC] text-[#14241B] flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>About Vidyakshara</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Workspace */}
      <main
        id="main-workspace"
        className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8"
      >
        {currentRoute === "home" && (
          <HomeView
            state={state}
            onNavigate={handleNavigate}
            onToggleTaskCompleted={handleToggleTaskCompleted}
            onToggleTaskSkipped={handleToggleTaskSkipped}
            onMoveTask={handleMoveTask}
            onAddCustomTask={handleAddCustomTask}
            onRegenerateDailyPlan={handleRegenerateDailyPlan}
            onAddMilestone={handleAddMilestone}
            onToggleMilestone={handleToggleMilestone}
            onDeleteMilestone={handleDeleteMilestone}
          />
        )}

        {currentRoute === "learn" && (
          <LearnView
            state={state}
            initialSubjectId={navContext.subjectId}
            initialTopicId={navContext.topicId}
            onToggleTopicComplete={handleToggleTopicComplete}
            onMarkKnowledgeCheckDone={handleMarkKnowledgeCheckDone}
            onSaveTopicToNotes={(title, subjectId, _chapterId, content) =>
              handleAddNote(title, subjectId, content)
            }
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === "practice" && (
          <PracticeView
            state={state}
            initialSubjectId={navContext.subjectId}
            initialChapterId={navContext.chapterId}
            initialTopicId={navContext.topicId}
            onRecordAttempt={handleRecordQuestionAttempt}
            onToggleBookmark={handleToggleBookmarkQuestion}
            onUpdatePracticeSession={handleUpdatePracticeSession}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === "doubts" && (
          <DoubtSolverView
            state={state}
            initialSubjectId={navContext.subjectId}
            initialTopicId={navContext.topicId}
            initialPrefill={navContext.prefillDoubt}
            onAddDoubtMessages={handleAddDoubtMessages}
            onClearDoubtHistory={handleClearDoubtHistory}
            onSaveExplanationToNotes={(title, subjectId, content) =>
              handleAddNote(title, subjectId, content)
            }
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === "revision" && (
          <RevisionView
            state={state}
            onRecordAttempt={handleRecordQuestionAttempt}
            onToggleBookmark={handleToggleBookmarkQuestion}
            onToggleBookmarkTopic={handleToggleBookmarkTopic}
            onCompleteRevisionSession={handleCompleteRevisionSession}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === "mock-tests" && (
          <MockTestsView
            state={state}
            onSaveMockResult={handleSaveMockResult}
            onToggleBookmarkTopic={handleToggleBookmarkTopic}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === "progress" && (
          <ProgressView state={state} onNavigate={handleNavigate} />
        )}

        {currentRoute === "notes" && (
          <NotesView
            state={state}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {currentRoute === "settings" && (
          <SettingsView
            state={state}
            serverSyncStatus={serverSyncStatus}
            onUpdateProfile={handleUpdateProfile}
            onSwitchToDemoMode={handleEnterDemoMode}
            onSignOutToDiscovery={() => handleNavigate("discover")}
          />
        )}

        {currentRoute === "career-discovery" && (
          <CareerDiscoveryView
            careerState={activeCareerState}
            studentName={profile.name}
            isAnonymousSession={profile.isDemoAccount}
            onUpdateCareerState={handleUpdateCareerState}
            onArchiveCompletedReport={handleArchiveCompletedReport}
            onClearCareerData={handleClearCareerData}
            onBackToStudyWorkspace={() => handleNavigate("home")}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Prioritises Home, Learn, Practice, AI Tutor, Revision) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="print:hidden md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white border-t border-[#E2E5DC] grid grid-cols-5 items-center px-1"
      >
        {primaryNavItems.map((item) => {
          const active = currentRoute === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                active
                  ? "text-[#164A31] font-semibold"
                  : "text-[#6E7B72] hover:text-[#14241B]"
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quiet Footer */}
      <footer className="print:hidden w-full border-t border-[#E2E5DC] bg-white py-6 px-4 sm:px-6 mt-12">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#6E7B72]">
          <div>
            Vidyakshara — Student Learning Companion for Class 11 &amp; 12 (JEE Main · JEE Advanced · NEET UG)
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate("career-discovery")}
              className="text-[#164A31] font-semibold hover:underline cursor-pointer"
            >
              Career Discovery Test
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("discover")}
              className="hover:text-[#14241B] hover:underline cursor-pointer"
            >
              About Vidyakshara
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("onboarding")}
              className="hover:text-[#14241B] hover:underline cursor-pointer"
            >
              Change Class / Exam
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("settings")}
              className="hover:text-[#14241B] hover:underline cursor-pointer"
            >
              Profile &amp; Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
