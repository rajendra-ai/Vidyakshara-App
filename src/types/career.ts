export type InterestDimensionId =
  | "realistic"
  | "investigative"
  | "artistic"
  | "social"
  | "enterprising"
  | "conventional";

export interface InterestDimensionMeta {
  id: InterestDimensionId;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  studentExamples: string[];
}

export type CareerClusterId =
  | "engineering-tech"
  | "medical-healthcare"
  | "commerce-finance"
  | "humanities-social"
  | "creative-media"
  | "business-management"
  | "law-policy"
  | "pure-sciences"
  | "education-development"
  | "environment-life";

export type WorkPreferenceTag =
  | "hands-on"
  | "theoretical"
  | "collaborative"
  | "independent"
  | "structured"
  | "exploratory"
  | "people-centered"
  | "analytical-systems";

export type CareerQuestionType = "likert-5" | "situational";

export interface CareerAnswerOption {
  id: string;
  label: string;
  description?: string;
  dimensionWeights: Partial<Record<InterestDimensionId, number>>;
  preferenceTags?: WorkPreferenceTag[];
}

export interface CareerQuestion {
  id: string;
  number: number;
  sectionTitle: string;
  prompt: string;
  contextNote?: string;
  responseType: CareerQuestionType;
  options: CareerAnswerOption[];
  primaryDimensions: InterestDimensionId[];
  maintainerNote: string;
}

export interface CareerClusterDefinition {
  id: CareerClusterId;
  title: string;
  subtitle: string;
  summary: string;
  primaryDimensions: InterestDimensionId[];
  secondaryDimensions: InterestDimensionId[];
  alignedPreferences: WorkPreferenceTag[];
  exampleCareers: string[];
  typicalActivities: string[];
  relevantSubjectsAndSkills: string[];
  lowCostTrialActivity: string;
  eligibilityAndPathwayNote: string;
  quantitativeOrConceptExample: string;
}

export type CareerAssessmentResponses = Record<string, string>;

export interface DimensionScoreItem {
  dimensionId: InterestDimensionId;
  name: string;
  shortLabel: string;
  tagline: string;
  rawScore: number;
  maxPossibleScore: number;
  answeredMaxScore: number;
  normalizedScore: number; // 0 to 100 integer
  answeredCount: number;
  totalQuestionsForDimension: number;
  levelLabel:
    | "High relative interest"
    | "Moderate interest"
    | "Emerging / situational interest";
  explanation: string;
}

export interface InterestCombinationInsight {
  id: string;
  dimensions: [InterestDimensionId, InterestDimensionId];
  title: string;
  combinationCode: string;
  meaning: string;
  alternativeInterpretation: string;
  suggestedClusterIds: CareerClusterId[];
}

export interface MatchedCareerCluster {
  cluster: CareerClusterDefinition;
  rank: number;
  alignmentScore: number; // 0 to 100 integer
  whyItFits: string;
  matchedDimensions: InterestDimensionId[];
  matchedPreferences: string[];
}

export interface SkillRecommendation {
  id: string;
  skillName: string;
  category: string;
  whySuggested: string;
  starterActivity: string;
}

export interface ExplorationDayPlan {
  day: number;
  title: string;
  activity: string;
  timeEstimate: string;
  focusArea: string;
}

export interface WorkStyleSummary {
  preferredEnvironment: string;
  learningApproach: string;
  collaborationStyle: string;
  explorationOpenness: string;
  preferenceHighlights: string[];
  tagCounts: Record<WorkPreferenceTag, number>;
}

export interface AICareerNarrative {
  personalizedOverview: string;
  combinationCommentary: string;
  encouragementNote: string;
}

export type CareerStudentClass =
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12"
  | "Undergraduate"
  | "Other";

export interface CareerStudentDetails {
  fullName: string;
  studentClass: CareerStudentClass;
}

export interface CareerGuidanceReport {
  reportId: string;
  attemptId?: string;
  generatedAt: string;
  studentName?: string;
  studentClass?: CareerStudentClass;
  studentDetails?: CareerStudentDetails;
  answeredCount: number;
  totalQuestions: number;
  dimensionScores: DimensionScoreItem[];
  leadingDimensions: DimensionScoreItem[];
  tieNote?: string;
  leadingCombinations: InterestCombinationInsight[];
  workStyleSummary: WorkStyleSummary;
  recommendedClusters: MatchedCareerCluster[];
  allRankedClusters: MatchedCareerCluster[];
  skillRecommendations: SkillRecommendation[];
  sevenDayPlan: ExplorationDayPlan[];
  reflectionQuestions: string[];
  limitationsAndEthics: string[];
  personalizationMode: "deterministic" | "ai-enhanced";
  aiNarrative?: AICareerNarrative;
}

export type CareerAssessmentStage =
  | "landing"
  | "intro"
  | "questions"
  | "review-unanswered"
  | "report";

export interface CareerAssessmentState {
  sessionId?: string;
  stage: CareerAssessmentStage;
  currentQuestionIndex: number;
  responses: CareerAssessmentResponses;
  startedAt?: string;
  updatedAt?: string;
  completedReport?: CareerGuidanceReport | null;
  attemptId?: string;
  accessToken?: string;
  studentDetails?: CareerStudentDetails | null;
}

export interface CareerSavedReportEntry {
  reportId: string;
  attemptId?: string;
  accessToken?: string;
  studentName: string;
  studentClass: CareerStudentClass;
  generatedAt: string;
  topDimensionsSummary: string;
  topClusterTitles: string[];
  report: CareerGuidanceReport;
}



