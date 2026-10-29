import { CareerAssessmentState, CareerSavedReportEntry } from "./career";

export type ClassLevel = "11" | "12";

export type TargetExam =
  | "JEE Main"
  | "JEE Advanced"
  | "JEE Main + Advanced"
  | "NEET UG";

export type SubjectId = "physics" | "chemistry" | "mathematics" | "biology";

export type ImmediateGoal =
  | "concepts"
  | "practice"
  | "revision"
  | "balanced";

export type AppRoute =
  | "discover"
  | "onboarding"
  | "home"
  | "learn"
  | "practice"
  | "doubts"
  | "revision"
  | "mock-tests"
  | "progress"
  | "notes"
  | "settings"
  | "career-discovery";

export interface StudyPreferences {
  dailyStudyMinutes: 45 | 90 | 150;
  preferredSessionStyle: "concept-first" | "practice-first" | "balanced";
  immediateGoal?: ImmediateGoal;
  focusSubjectIds: SubjectId[];
  highContrastReading: boolean;
  fontSizeScale: "normal" | "comfortable";
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  classLevel: ClassLevel;
  targetExam: TargetExam;
  schoolOrCity: string;
  isDemoAccount: boolean;
  onboardingCompleted: boolean;
  preferences: StudyPreferences;
  lastActiveRoute?: AppRoute;
  lastActiveTopicId?: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  examTag: string;
  problemStatement: string;
  givenData: string[];
  steps: {
    stepTitle: string;
    detail: string;
    formula?: string;
  }[];
  finalAnswer: string;
  commonMistakeNote: string;
}

export interface InteractiveSimulationSpec {
  type:
    | "electrostatics-flux"
    | "bohr-dissociation"
    | "projectile-kinematics"
    | "chemical-equilibrium";
  title: string;
  caption: string;
  parameterLabel: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  secondaryLabel?: string;
  secondaryMin?: number;
  secondaryMax?: number;
  secondaryDefault?: number;
  secondaryUnit?: string;
}

export interface FormulaDefinitionItem {
  term: string;
  formula?: string;
  meaning: string;
}

export interface KnowledgeCheckItem {
  id: string;
  prompt: string;
  options: { id: "A" | "B" | "C"; text: string }[];
  correctId: "A" | "B" | "C";
  reinforcement: string;
}

export interface Topic {
  id: string;
  chapterId: string;
  subjectId: SubjectId;
  classLevel: ClassLevel;
  applicableExams: TargetExam[];
  title: string;
  estimatedMinutes: number;
  difficulty: "Foundation" | "Exam Core" | "Advanced";
  summary: string;
  learningObjectives: string[];
  intuitiveIntro: string;
  definitionsAndFormulas: FormulaDefinitionItem[];
  keyTakeaways: string[];
  conceptSections: {
    heading: string;
    explanation: string;
    formulaHighlight?: string;
    examTip?: string;
  }[];
  simulation: InteractiveSimulationSpec;
  workedExamples: WorkedExample[];
  knowledgeCheck: KnowledgeCheckItem;
}

export interface Chapter {
  id: string;
  subjectId: SubjectId;
  classLevel: ClassLevel;
  applicableExams: TargetExam[];
  number: number;
  title: string;
  examWeightage: string;
  summary: string;
  topicIds: string[];
}

export interface Subject {
  id: SubjectId;
  name: string;
  shortCode: string;
  applicableExams: TargetExam[];
  description: string;
  chapters: Chapter[];
}

export type QuestionType = "single-choice" | "multiple-choice" | "numerical";

export type QuestionDiagramType =
  | "gaussian-cube"
  | "projectile-apex"
  | "equilibrium-vessel"
  | "daniell-cell"
  | "bohr-curve";

export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
  trapReason?: string;
}

export interface QuestionSolutionStep {
  label?: string;
  content: string;
  formula?: string;
}

export interface QuestionSolutionBreakdown {
  given?: string[];
  conceptOrFormula?: string;
  steps?: QuestionSolutionStep[];
  finalAnswer: string;
  underlyingConcept?: string;
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  topicId: string;
  classLevel: ClassLevel;
  questionType: QuestionType;
  examRelevance: TargetExam[];
  examTag: string;
  sourceLabel: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  marks: {
    correct: number;
    incorrect: number;
  };
  questionText: string;
  formulaContext?: string;
  diagramType?: QuestionDiagramType;
  options?: QuestionOption[];
  correctOptionId?: "A" | "B" | "C" | "D";
  correctOptionIds?: ("A" | "B" | "C" | "D")[];
  correctNumericalValue?: number;
  numericalTolerance?: number;
  numericalUnit?: string;
  stepByStepExplanation: string[];
  solutionBreakdown?: QuestionSolutionBreakdown;
  keyConceptTested: string;
  commonMistakeSummary: string;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  topicId: string;
  chapterId: string;
  subjectId: SubjectId;
  questionType?: QuestionType;
  selectedOptionId?: "A" | "B" | "C" | "D";
  selectedOptionIds?: ("A" | "B" | "C" | "D")[];
  enteredNumericalValue?: number;
  isCorrect: boolean;
  marksAwarded?: number;
  timeSpentSeconds: number;
  attemptedAt: string;
  markedForRevision: boolean;
}

export interface ActivePracticeSession {
  id: string;
  startedAt: string;
  subjectFilter: "all" | SubjectId;
  classFilter: "all" | ClassLevel;
  chapterFilter: string;
  topicFilter: string;
  questionTypeFilter: "all" | QuestionType;
  currentQuestionIndex: number;
  questionIds: string[];
  submittedQuestionIds: string[];
}

export interface StudyTask {
  id: string;
  title: string;
  subtitle: string;
  type: "concept" | "practice" | "revision" | "mock";
  subjectId: SubjectId;
  topicId?: string;
  chapterId?: string;
  estimatedMinutes: number;
  completed: boolean;
  skipped?: boolean;
  reasonLabel?: string;
  routeTarget: AppRoute;
}

export interface StudentMilestone {
  id: string;
  title: string;
  targetDateLabel: string;
  subjectId?: SubjectId;
  completed: boolean;
}

export interface TopicRevisionRecord {
  topicId: string;
  subjectId: SubjectId;
  lastReviewedAt: string;
  revisionCount: number;
  confidenceLevel: "needs-work" | "steady" | "confident";
  nextSuggestedReview: string;
  intervalDays: number;
}

export interface RevisionSessionRecord {
  id: string;
  topicId?: string;
  subjectId: SubjectId;
  title: string;
  completedAt: string;
  questionsReviewedCount: number;
  questionsResolvedCount: number;
}

export interface MockTestDefinition {
  id: string;
  title: string;
  targetExam: TargetExam;
  classLevel: ClassLevel;
  durationMinutes: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  questionIds: string[];
  description: string;
  instructions?: string[];
}

export interface MockTestAttemptResult {
  id: string;
  mockTestId: string;
  title: string;
  submittedAt: string;
  durationSecondsUsed: number;
  configuredDurationMinutes?: number;
  negativeMarkingEnabled?: boolean;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  markedForReviewIds?: string[];
  answers: Record<string, "A" | "B" | "C" | "D" | null>;
}

export interface StudentNote {
  id: string;
  title: string;
  subjectId: SubjectId;
  chapterId?: string;
  content: string;
  attachmentName?: string;
  attachmentSizeLabel?: string;
  updatedAt: string;
}

export type TutorExplanationMode =
  | "step-by-step"
  | "simple"
  | "example"
  | "test-me";

export interface TutorAttachment {
  name: string;
  mimeType: string;
  sizeLabel: string;
  previewDataUrl?: string;
}

export interface TutorPracticeQuestion {
  prompt: string;
  options?: string[];
  correctAnswer: string;
  hintOrSolution: string;
}

export interface StructuredTutorResponse {
  mainIdea: string;
  steps?: {
    title: string;
    explanation: string;
    formula?: string;
  }[];
  formulaOrDiagramNote?: string;
  formulaExpression?: string;
  diagramType?: QuestionDiagramType;
  finalAnswer?: string;
  commonMistake?: string;
  practiceQuestion?: TutorPracticeQuestion;
  suggestedFollowUps?: string[];
}

export interface DoubtMessage {
  id: string;
  role: "user" | "tutor";
  text: string;
  timestamp: string;
  subjectId?: SubjectId;
  topicId?: string;
  relatedTopicTitle?: string;
  explanationMode?: TutorExplanationMode;
  attachment?: TutorAttachment;
  structured?: StructuredTutorResponse;
  sourceType?: "live-ai" | "sample-history";
}

export interface StudentLearningState {
  profile: StudentProfile | null;
  completedTopicIds: string[];
  knowledgeCheckCompletedTopicIds?: string[];
  bookmarkedQuestionIds: string[];
  bookmarkedTopicIds?: string[];
  attempts: QuestionAttempt[];
  activePracticeSession?: ActivePracticeSession | null;
  studyTasks: StudyTask[];
  studentMilestones?: StudentMilestone[];
  revisionRecords?: Record<string, TopicRevisionRecord>;
  revisionSessions?: RevisionSessionRecord[];
  mockResults: MockTestAttemptResult[];
  notes: StudentNote[];
  doubtHistory: DoubtMessage[];
  careerAssessment?: CareerAssessmentState;
  careerReportHistory?: CareerSavedReportEntry[];
}


