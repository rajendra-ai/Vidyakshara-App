import {
  AppRoute,
  StudentLearningState,
  StudyTask,
  SubjectId,
  Topic,
} from "../types/domain";
import { QUESTIONS, SUBJECTS, TOPICS } from "../data/curriculum";

export type EvidenceStrength = "none" | "limited" | "meaningful";

export interface TopicPerformanceInsight {
  topic: Topic;
  isCompleted: boolean;
  isBookmarked: boolean;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  unresolvedMistakeQuestionIds: string[];
  accuracyPct: number | null;
  evidenceStrength: EvidenceStrength;
  statusLabel: string;
  needsConceptReviewFirst: boolean;
}

export interface SubjectPerformanceInsight {
  subjectId: SubjectId;
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPct: number | null;
  evidenceStrength: EvidenceStrength;
  insightLabel: string;
}

export interface PersonalisedRecommendation {
  id: string;
  badgeLabel: string;
  title: string;
  reason: string;
  subjectId: SubjectId;
  subjectName: string;
  topic: Topic;
  estimatedMinutes: number;
  primaryActionLabel: string;
  primaryRoute: AppRoute;
  secondaryActionLabel: string;
  secondaryRoute: AppRoute;
}

/**
 * Evaluates each topic's performance strictly from actual stored attempts.
 * Never infers mastery from 1–2 questions; requires >= 3 attempts for a meaningful trend.
 */
export function computeTopicInsights(
  state: StudentLearningState
): TopicPerformanceInsight[] {
  const profile = state.profile;
  if (!profile) return [];

  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );
  const applicableTopicIds = new Set(
    applicableSubjects.flatMap((s) => s.chapters.flatMap((c) => c.topicIds))
  );

  // Track latest attempt per question to know if a mistake is still unresolved
  const latestAttemptByQuestion = new Map<string, boolean>();
  state.attempts.forEach((att) => {
    latestAttemptByQuestion.set(att.questionId, att.isCorrect);
  });

  return TOPICS.filter((t) => applicableTopicIds.has(t.id)).map((topic) => {
    const topicAttempts = state.attempts.filter((a) => a.topicId === topic.id);
    const attemptCount = topicAttempts.length;
    const correctCount = topicAttempts.filter((a) => a.isCorrect).length;
    const incorrectCount = attemptCount - correctCount;
    const accuracyPct =
      attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : null;

    const topicQuestions = QUESTIONS.filter((q) => q.topicId === topic.id);
    const unresolvedMistakeQuestionIds = topicQuestions
      .filter((q) => latestAttemptByQuestion.get(q.id) === false)
      .map((q) => q.id);

    const isCompleted = state.completedTopicIds.includes(topic.id);
    const isBookmarked = (state.bookmarkedTopicIds || []).includes(topic.id);

    let evidenceStrength: EvidenceStrength = "none";
    let statusLabel = "Not practised yet";

    if (attemptCount > 0 && attemptCount < 3) {
      evidenceStrength = "limited";
      statusLabel =
        unresolvedMistakeQuestionIds.length > 0
          ? `Initial signal (${attemptCount} attempt${
              attemptCount === 1 ? "" : "s"
            }, ${unresolvedMistakeQuestionIds.length} mistake to review)`
          : `Limited evidence (${correctCount}/${attemptCount} correct — practise ${
              3 - attemptCount
            } more for a reliable trend)`;
    } else if (attemptCount >= 3 && accuracyPct !== null) {
      evidenceStrength = "meaningful";
      if (accuracyPct >= 75 && unresolvedMistakeQuestionIds.length === 0) {
        statusLabel = `Strong area (${accuracyPct}% across ${attemptCount} attempts)`;
      } else if (accuracyPct >= 60) {
        statusLabel = `Steady progress (${accuracyPct}% — review ${unresolvedMistakeQuestionIds.length} mistake${
          unresolvedMistakeQuestionIds.length === 1 ? "" : "s"
        })`;
      } else {
        statusLabel = `Needs concept revision (${accuracyPct}% across ${attemptCount} attempts)`;
      }
    }

    const needsConceptReviewFirst =
      unresolvedMistakeQuestionIds.length >= 1 &&
      (incorrectCount >= 2 || !isCompleted);

    return {
      topic,
      isCompleted,
      isBookmarked,
      attemptCount,
      correctCount,
      incorrectCount,
      unresolvedMistakeQuestionIds,
      accuracyPct,
      evidenceStrength,
      statusLabel,
      needsConceptReviewFirst,
    };
  });
}

export function computeSubjectInsights(
  state: StudentLearningState
): SubjectPerformanceInsight[] {
  const profile = state.profile;
  if (!profile) return [];

  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );

  return applicableSubjects.map((subj) => {
    const subjTopicIds = subj.chapters.flatMap((c) => c.topicIds);
    const completedTopics = state.completedTopicIds.filter((id) =>
      subjTopicIds.includes(id)
    ).length;

    const subjAttempts = state.attempts.filter((a) => a.subjectId === subj.id);
    const attemptCount = subjAttempts.length;
    const correctCount = subjAttempts.filter((a) => a.isCorrect).length;
    const incorrectCount = attemptCount - correctCount;
    const accuracyPct =
      attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : null;

    let evidenceStrength: EvidenceStrength = "none";
    let insightLabel = "No questions attempted yet — try 3 questions to establish a baseline";

    if (attemptCount > 0 && attemptCount < 3) {
      evidenceStrength = "limited";
      insightLabel = `Limited sample (${attemptCount} question${
        attemptCount === 1 ? "" : "s"
      }) — attempt ${3 - attemptCount} more to see a reliable accuracy trend`;
    } else if (attemptCount >= 3 && accuracyPct !== null) {
      evidenceStrength = "meaningful";
      if (accuracyPct >= 75) {
        insightLabel = `Strong foundation (${accuracyPct}% accuracy across ${attemptCount} attempts)`;
      } else if (accuracyPct >= 50) {
        insightLabel = `Moderate accuracy (${accuracyPct}%) — review missed questions in Revision`;
      } else {
        insightLabel = `Priority focus area (${accuracyPct}% accuracy) — revisit core concepts before next test`;
      }
    }

    return {
      subjectId: subj.id,
      subjectName: subj.name,
      totalTopics: subjTopicIds.length,
      completedTopics,
      attemptCount,
      correctCount,
      incorrectCount,
      accuracyPct,
      evidenceStrength,
      insightLabel,
    };
  });
}

/**
 * Recommends the next learning activity based on transparent, evidence-backed rules:
 * 1. If a student has unresolved mistakes in a topic, recommend reviewing that concept/mistake first.
 * 2. If a student studied a concept but hasn't practised questions on it yet, recommend practising that topic.
 * 3. If the student entered an upcoming milestone for a subject, recommend an unfinished topic in that subject.
 * 4. Otherwise, recommend the next uncompleted topic in their syllabus.
 */
export function getPersonalisedNextRecommendation(
  state: StudentLearningState,
  overrideTopicId?: string
): PersonalisedRecommendation {
  const profile = state.profile!;
  const topicInsights = computeTopicInsights(state);
  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );

  const getSubjectName = (sid: SubjectId) =>
    SUBJECTS.find((s) => s.id === sid)?.name || "Science";

  // 0. Student explicit override
  if (overrideTopicId) {
    const chosen = topicInsights.find((ti) => ti.topic.id === overrideTopicId);
    if (chosen) {
      return {
        id: `rec-override-${chosen.topic.id}`,
        badgeLabel: "Selected by You",
        title: chosen.topic.title,
        reason: `You selected this ${getSubjectName(
          chosen.topic.subjectId
        )} topic to focus on right now. ${chosen.statusLabel}.`,
        subjectId: chosen.topic.subjectId,
        subjectName: getSubjectName(chosen.topic.subjectId),
        topic: chosen.topic,
        estimatedMinutes: chosen.topic.estimatedMinutes,
        primaryActionLabel: "Study Concept & Examples",
        primaryRoute: "learn",
        secondaryActionLabel: "Practise Topic Questions",
        secondaryRoute: "practice",
      };
    }
  }

  // 1. Topic with unresolved practice mistakes -> suggest reviewing the concept before taking another practice set
  const mistakeTopic = topicInsights.find(
    (ti) => ti.unresolvedMistakeQuestionIds.length > 0
  );
  if (mistakeTopic) {
    const mCount = mistakeTopic.unresolvedMistakeQuestionIds.length;
    return {
      id: `rec-mistake-${mistakeTopic.topic.id}`,
      badgeLabel: "Recommended from Recent Practice",
      title: `Review ${mistakeTopic.topic.title}`,
      reason: `You have ${mCount} unresolved mistake${
        mCount > 1 ? "s" : ""
      } in this topic. Reviewing the underlying concept and worked example before taking another practice set will help prevent repeating the same trap.`,
      subjectId: mistakeTopic.topic.subjectId,
      subjectName: getSubjectName(mistakeTopic.topic.subjectId),
      topic: mistakeTopic.topic,
      estimatedMinutes: 15,
      primaryActionLabel: "Review Concept & Mistake Trap",
      primaryRoute: "learn",
      secondaryActionLabel: "Retry Missed Question in Revision",
      secondaryRoute: "revision",
    };
  }

  // 2. Topic where concept was completed, but 0 practice questions attempted yet
  const studiedButUnpractised = topicInsights.find(
    (ti) => ti.isCompleted && ti.attemptCount === 0
  );
  if (studiedButUnpractised) {
    return {
      id: `rec-practise-${studiedButUnpractised.topic.id}`,
      badgeLabel: "Reinforce What You Learned",
      title: `Practise ${studiedButUnpractised.topic.title}`,
      reason: `You completed the concept lesson for "${studiedButUnpractised.topic.title}", but haven't attempted its exam-style practice questions yet.`,
      subjectId: studiedButUnpractised.topic.subjectId,
      subjectName: getSubjectName(studiedButUnpractised.topic.subjectId),
      topic: studiedButUnpractised.topic,
      estimatedMinutes: 15,
      primaryActionLabel: "Practise Topic Questions",
      primaryRoute: "practice",
      secondaryActionLabel: "Re-open Concept Lesson",
      secondaryRoute: "learn",
    };
  }

  // 3. Upcoming student-entered milestone subject priority
  const activeMilestone = (state.studentMilestones || []).find(
    (m) => !m.completed && m.subjectId
  );
  if (activeMilestone?.subjectId) {
    const milestoneTopic = topicInsights.find(
      (ti) =>
        ti.topic.subjectId === activeMilestone.subjectId && !ti.isCompleted
    );
    if (milestoneTopic) {
      return {
        id: `rec-milestone-${milestoneTopic.topic.id}`,
        badgeLabel: `Aligned with Your Milestone (${activeMilestone.title})`,
        title: milestoneTopic.topic.title,
        reason: `Supports your upcoming milestone "${activeMilestone.title}" (${activeMilestone.targetDateLabel}).`,
        subjectId: milestoneTopic.topic.subjectId,
        subjectName: getSubjectName(milestoneTopic.topic.subjectId),
        topic: milestoneTopic.topic,
        estimatedMinutes: milestoneTopic.topic.estimatedMinutes,
        primaryActionLabel: "Start Concept Session",
        primaryRoute: "learn",
        secondaryActionLabel: "Practise Questions",
        secondaryRoute: "practice",
      };
    }
  }

  // 4. Next unfinished topic (or fallback to first applicable topic)
  const nextUnfinished =
    topicInsights.find((ti) => !ti.isCompleted) || topicInsights[0];
  const fallbackTopic =
    nextUnfinished?.topic ||
    TOPICS.find((t) => t.subjectId === applicableSubjects[0]?.id) ||
    TOPICS[0];

  return {
    id: `rec-next-${fallbackTopic.id}`,
    badgeLabel:
      state.completedTopicIds.length > 0 || state.attempts.length > 0
        ? "Recommended Next Step"
        : "Your First Study Session",
    title: fallbackTopic.title,
    reason:
      state.completedTopicIds.length > 0
        ? `Next uncompleted core topic in your Class ${profile.classLevel} ${profile.targetExam} syllabus.`
        : `High-weightage foundation topic for Class ${profile.classLevel} ${profile.targetExam} with an interactive concept simulator and worked example.`,
    subjectId: fallbackTopic.subjectId,
    subjectName: getSubjectName(fallbackTopic.subjectId),
    topic: fallbackTopic,
    estimatedMinutes: fallbackTopic.estimatedMinutes,
    primaryActionLabel:
      state.completedTopicIds.length > 0
        ? "Continue learning"
        : "Start a study session",
    primaryRoute: "learn",
    secondaryActionLabel: "Practise questions",
    secondaryRoute: "practice",
  };
}

/**
 * Generates a realistic, manageable daily study plan sized to the student's
 * dailyStudyMinutes (45, 90, or 150 mins), unfinished topics, actual mistakes,
 * and student-entered milestones.
 */
export function buildAdaptiveDailyPlan(
  state: StudentLearningState
): StudyTask[] {
  const profile = state.profile;
  if (!profile) return [];

  const targetMinutes = profile.preferences.dailyStudyMinutes || 90;
  const topicInsights = computeTopicInsights(state);
  const candidateTasks: StudyTask[] = [];

  // 1. If mistakes exist, add a 15-minute targeted revision task first
  const topicsWithMistakes = topicInsights.filter(
    (ti) => ti.unresolvedMistakeQuestionIds.length > 0
  );
  if (topicsWithMistakes.length > 0) {
    const firstMistakeTopic = topicsWithMistakes[0].topic;
    const totalMistakes = topicsWithMistakes.reduce(
      (acc, item) => acc + item.unresolvedMistakeQuestionIds.length,
      0
    );
    candidateTasks.push({
      id: `plan-rev-${Date.now()}-1`,
      title: `Resolve ${totalMistakes} Mistake${
        totalMistakes > 1 ? "s" : ""
      } (${firstMistakeTopic.title})`,
      subtitle: "Targeted Revision · Based on recent practice attempts",
      type: "revision",
      subjectId: firstMistakeTopic.subjectId,
      topicId: firstMistakeTopic.id,
      chapterId: firstMistakeTopic.chapterId,
      estimatedMinutes: 15,
      completed: false,
      reasonLabel: "Prioritised from practice mistakes",
      routeTarget: "revision",
    });
  }

  // 2. If student entered an active milestone, add a task aligned with it
  const activeMilestone = (state.studentMilestones || []).find(
    (m) => !m.completed && m.subjectId
  );
  if (activeMilestone?.subjectId) {
    const milestoneTopic = topicInsights.find(
      (ti) =>
        ti.topic.subjectId === activeMilestone.subjectId && !ti.isCompleted
    )?.topic;
    if (milestoneTopic) {
      candidateTasks.push({
        id: `plan-mile-${Date.now()}-2`,
        title: `Study ${milestoneTopic.title}`,
        subtitle: `Supports milestone: ${activeMilestone.title} (${activeMilestone.targetDateLabel})`,
        type: "concept",
        subjectId: milestoneTopic.subjectId,
        topicId: milestoneTopic.id,
        chapterId: milestoneTopic.chapterId,
        estimatedMinutes: milestoneTopic.estimatedMinutes,
        completed: false,
        reasonLabel: `Milestone: ${activeMilestone.title}`,
        routeTarget: "learn",
      });
    }
  }

  // 3. Add unfinished concept topics across applicable subjects
  const unfinishedTopics = topicInsights.filter(
    (ti) =>
      !ti.isCompleted &&
      !candidateTasks.some((ct) => ct.topicId === ti.topic.id)
  );
  for (const ti of unfinishedTopics.slice(0, 2)) {
    candidateTasks.push({
      id: `plan-concept-${ti.topic.id}`,
      title: `Learn ${ti.topic.title}`,
      subtitle: `${ti.topic.subjectId.toUpperCase()} · Class ${
        ti.topic.classLevel
      } · Unfinished concept`,
      type: "concept",
      subjectId: ti.topic.subjectId,
      topicId: ti.topic.id,
      chapterId: ti.topic.chapterId,
      estimatedMinutes: ti.topic.estimatedMinutes,
      completed: false,
      reasonLabel: "Unfinished core topic",
      routeTarget: "learn",
    });
  }

  // 4. Add a chapter practice session task
  const practiceTarget =
    topicInsights.find((ti) => ti.isCompleted && ti.attemptCount < 3)?.topic ||
    topicInsights[0]?.topic;
  if (practiceTarget) {
    candidateTasks.push({
      id: `plan-prac-${practiceTarget.id}`,
      title: `Practise Questions: ${practiceTarget.title}`,
      subtitle: `${profile.targetExam} · Single MCQ, Multi-Correct & Numerical`,
      type: "practice",
      subjectId: practiceTarget.subjectId,
      topicId: practiceTarget.id,
      chapterId: practiceTarget.chapterId,
      estimatedMinutes: 20,
      completed: false,
      reasonLabel: "Build question accuracy",
      routeTarget: "practice",
    });
  }

  // 5. If 90+ minutes budget, include a 15-minute timed mock checkpoint
  if (targetMinutes >= 90) {
    candidateTasks.push({
      id: `plan-mock-${Date.now()}`,
      title: "Take a 15-Minute Timed Checkpoint Test",
      subtitle: `${profile.targetExam} · Timed exam simulation`,
      type: "mock",
      subjectId: practiceTarget?.subjectId || "physics",
      estimatedMinutes: 15,
      completed: false,
      reasonLabel: "Timed exam temperament",
      routeTarget: "mock-tests",
    });
  }

  // Trim tasks so total planned minutes fits the student's daily time budget
  const selectedTasks: StudyTask[] = [];
  let accumulatedMinutes = 0;
  for (const task of candidateTasks) {
    if (
      selectedTasks.length < 2 ||
      accumulatedMinutes + task.estimatedMinutes <= targetMinutes + 10
    ) {
      selectedTasks.push(task);
      accumulatedMinutes += task.estimatedMinutes;
    }
  }

  return selectedTasks;
}
