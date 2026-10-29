import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Compass,
  Download,
  Edit3,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  HeartPulse,
  HelpCircle,
  Landmark,
  Lightbulb,
  Palette,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import {
  CAREER_CLUSTERS,
  CAREER_PRODUCT_IDENTITY,
  CAREER_QUESTIONS,
  INTEREST_DIMENSIONS,
} from "../../data/careerAssessmentData";
import {
  CareerAssessmentResponses,
  CareerAssessmentStage,
  CareerAssessmentState,
  CareerClusterId,
  CareerGuidanceReport,
  CareerStudentClass,
  CareerStudentDetails,
} from "../../types/career";
import {
  STUDENT_CLASS_OPTIONS,
  StudentDetailsValidationResult,
  attachAINarrativeToReport,
  createFreshCareerAssessmentState,
  findUnansweredQuestions,
  generateCareerGuidanceReport,
  sanitizeAssessmentResponses,
  validateStudentDetailsForm,
} from "../../utils/careerScoringEngine";
import { downloadCareerReportPdf } from "../../utils/careerPdfGenerator";
import { MarkdownContent } from "../ui/MathAndDiagrams";
import { Button, MetaLine, ProgressBar } from "../ui/Primitives";

interface CareerDiscoveryViewProps {
  careerState: CareerAssessmentState;
  studentName?: string;
  isAnonymousSession?: boolean;
  onUpdateCareerState: (nextState: CareerAssessmentState) => void;
  onArchiveCompletedReport?: (
    report: CareerGuidanceReport,
    attemptMeta?: { attemptId?: string; accessToken?: string }
  ) => void;
  onClearCareerData: () => void;
  onBackToStudyWorkspace?: () => void;
}

function getClusterIcon(clusterId: CareerClusterId): React.ReactNode {
  switch (clusterId) {
    case "engineering-tech":
      return <Wrench className="w-4 h-4 text-[#164A31]" />;
    case "medical-healthcare":
      return <HeartPulse className="w-4 h-4 text-[#164A31]" />;
    case "commerce-finance":
      return <Landmark className="w-4 h-4 text-[#164A31]" />;
    case "humanities-social":
      return <Users className="w-4 h-4 text-[#164A31]" />;
    case "creative-media":
      return <Palette className="w-4 h-4 text-[#164A31]" />;
    case "business-management":
      return <Briefcase className="w-4 h-4 text-[#164A31]" />;
    case "law-policy":
      return <Scale className="w-4 h-4 text-[#164A31]" />;
    case "pure-sciences":
      return <FlaskConical className="w-4 h-4 text-[#164A31]" />;
    case "education-development":
      return <GraduationCap className="w-4 h-4 text-[#164A31]" />;
    case "environment-life":
      return <Sprout className="w-4 h-4 text-[#164A31]" />;
    default:
      return <Compass className="w-4 h-4 text-[#164A31]" />;
  }
}

export function CareerDiscoveryView({
  careerState,
  onUpdateCareerState,
  onArchiveCompletedReport,
  onClearCareerData,
  onBackToStudyWorkspace,
}: CareerDiscoveryViewProps) {
  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);
  const [confirmClearDataOpen, setConfirmClearDataOpen] = useState(false);
  const [showNavigatorGrid, setShowNavigatorGrid] = useState(false);
  const [showAllTenClusters, setShowAllTenClusters] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusNotice, setAiStatusNotice] = useState<string | null>(null);

  // Student Personalization Form State (Name & Class) — strictly scoped to the active attempt
  const savedDetails = careerState.studentDetails;
  const [fullNameInput, setFullNameInput] = useState<string>(
    savedDetails?.fullName || ""
  );
  const [studentClassInput, setStudentClassInput] =
    useState<CareerStudentClass>(savedDetails?.studentClass || "Class 11");
  const [formErrors, setFormErrors] = useState<
    StudentDetailsValidationResult["errors"]
  >({});
  const [returnToReportAfterDetails, setReturnToReportAfterDetails] =
    useState<boolean>(false);

  // PDF Generation & Download State
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccessFilename, setPdfSuccessFilename] = useState<string | null>(
    null
  );

  const careerStateRef = useRef<CareerAssessmentState>(careerState);
  useEffect(() => {
    careerStateRef.current = careerState;
  }, [careerState]);

  // Keep form inputs synced with the active attempt's studentDetails and clear them on a fresh session
  useEffect(() => {
    if (careerState.studentDetails) {
      setFullNameInput(careerState.studentDetails.fullName);
      setStudentClassInput(careerState.studentDetails.studentClass);
    } else {
      setFullNameInput("");
      setStudentClassInput("Class 11");
      setFormErrors({});
    }
  }, [careerState.sessionId, careerState.studentDetails]);

  const cleanResponses = sanitizeAssessmentResponses(careerState.responses);
  const answeredCount = Object.keys(cleanResponses).length;
  const totalQuestions = CAREER_QUESTIONS.length;
  const unansweredQuestions = findUnansweredQuestions(cleanResponses);
  const hasUnfinishedDraft =
    answeredCount > 0 &&
    answeredCount < totalQuestions &&
    !careerState.completedReport;

  const safeQuestionIndex = Math.max(
    0,
    Math.min(totalQuestions - 1, careerState.currentQuestionIndex || 0)
  );
  const currentQuestion = CAREER_QUESTIONS[safeQuestionIndex];

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  /**
   * Synchronizes the current career assessment attempt to the backend without
   * creating duplicate records on refresh or resume.
   */
  const syncAttemptToBackend = async (
    overrideState: CareerAssessmentState
  ): Promise<{
    attemptId?: string;
    accessToken?: string;
  }> => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (overrideState.accessToken) {
        headers["Authorization"] = `Bearer ${overrideState.accessToken}`;
      }
      const res = await fetch("/api/career/attempts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          attemptId: overrideState.attemptId,
          accessToken: overrideState.accessToken,
          studentDetails: overrideState.studentDetails,
          responses: overrideState.responses,
          aiNarrative: overrideState.completedReport?.aiNarrative,
        }),
      });
      if (!res.ok) return {};
      const data = await res.json();
      if (data?.ok && data.attemptId && data.accessToken) {
        const latest = careerStateRef.current;
        const merged: CareerAssessmentState = {
          ...latest,
          attemptId: data.attemptId,
          accessToken: data.accessToken,
        };
        onUpdateCareerState(merged);
        return {
          attemptId: data.attemptId,
          accessToken: data.accessToken,
        };
      }
    } catch {
      // Offline / local fallback remains intact
    }
    return {};
  };

  const handleStageChange = (
    nextStage: CareerAssessmentStage,
    nextIndex = safeQuestionIndex
  ) => {
    onUpdateCareerState({
      ...careerState,
      stage: nextStage,
      currentQuestionIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Starts a brand-new assessment session with a fresh sessionId, cleared answers,
   * cleared candidate details, and no previous report data.
   */
  const handleStartNewAssessment = () => {
    setReturnToReportAfterDetails(false);
    setConfirmRestartOpen(false);
    setConfirmClearDataOpen(false);
    setFullNameInput("");
    setStudentClassInput("Class 11");
    setFormErrors({});
    setAiStatusNotice(null);
    setPdfError(null);
    setPdfSuccessFilename(null);

    const freshIntroState = createFreshCareerAssessmentState("intro");
    onUpdateCareerState(freshIntroState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Explicitly resumes an unfinished assessment draft (`0 < answeredCount < 40`)
   * when the student chooses to continue where they left off.
   */
  const handleResumeUnfinishedAssessment = () => {
    setReturnToReportAfterDetails(false);
    if (
      answeredCount > 0 &&
      answeredCount < totalQuestions &&
      careerState.studentDetails
    ) {
      const firstUnansweredIdx = CAREER_QUESTIONS.findIndex(
        (q) => !cleanResponses[q.id]
      );
      handleStageChange(
        "questions",
        firstUnansweredIdx >= 0 ? firstUnansweredIdx : safeQuestionIndex
      );
      return;
    }
    onUpdateCareerState({
      ...careerState,
      stage: "intro",
      currentQuestionIndex: 0,
      startedAt: careerState.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStudentDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStudentDetailsForm({
      fullName: fullNameInput,
      studentClass: studentClassInput,
    });

    if (!validation.valid || !validation.sanitized) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    const sanitizedDetails: CareerStudentDetails = validation.sanitized;

    const firstUnansweredIdx = CAREER_QUESTIONS.findIndex(
      (q) => !cleanResponses[q.id]
    );
    const targetStage: CareerAssessmentStage = returnToReportAfterDetails
      ? "report"
      : "questions";
    const targetQuestionIdx =
      firstUnansweredIdx >= 0 ? firstUnansweredIdx : 0;

    let updatedReport = careerState.completedReport;
    if (updatedReport || targetStage === "report") {
      updatedReport = generateCareerGuidanceReport(cleanResponses, {
        attemptId: careerState.attemptId,
        studentName: sanitizedDetails.fullName,
        studentClass: sanitizedDetails.studentClass,
        studentDetails: sanitizedDetails,
        reportId: careerState.completedReport?.reportId,
        generatedAt: careerState.completedReport?.generatedAt,
      });
      if (careerState.completedReport?.aiNarrative) {
        updatedReport = attachAINarrativeToReport(
          updatedReport,
          careerState.completedReport.aiNarrative
        );
      }
    }

    const nextState: CareerAssessmentState = {
      ...careerState,
      stage: targetStage,
      currentQuestionIndex: targetQuestionIdx,
      studentDetails: sanitizedDetails,
      completedReport: updatedReport,
      startedAt: careerState.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdateCareerState(nextState);
    setReturnToReportAfterDetails(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    await syncAttemptToBackend(nextState);
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    const updatedResponses: CareerAssessmentResponses = {
      ...cleanResponses,
      [questionId]: optionId,
    };
    const nextState: CareerAssessmentState = {
      ...careerState,
      responses: updatedResponses,
      updatedAt: new Date().toISOString(),
    };
    onUpdateCareerState(nextState);

    if (nextState.attemptId && nextState.accessToken) {
      void syncAttemptToBackend(nextState);
    }
  };

  const handleFinishOrReviewAttempt = () => {
    const currentUnanswered = findUnansweredQuestions(cleanResponses);
    if (currentUnanswered.length > 0) {
      handleStageChange("review-unanswered", safeQuestionIndex);
      return;
    }
    void handleFinalizeReport(cleanResponses);
  };

  const handleFinalizeReport = async (
    responsesToScore: CareerAssessmentResponses
  ) => {
    const activeDetails = careerState.studentDetails || undefined;
    const generatedReport = generateCareerGuidanceReport(responsesToScore, {
      attemptId: careerState.attemptId,
      studentName: activeDetails?.fullName,
      studentClass: activeDetails?.studentClass,
      studentDetails: activeDetails,
    });
    setAiStatusNotice(null);
    setPdfError(null);
    setPdfSuccessFilename(null);

    const nextState: CareerAssessmentState = {
      ...careerState,
      stage: "report",
      responses: responsesToScore,
      completedReport: generatedReport,
      updatedAt: new Date().toISOString(),
    };
    onUpdateCareerState(nextState);
    onArchiveCompletedReport?.(generatedReport, {
      attemptId: careerState.attemptId,
      accessToken: careerState.accessToken,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });

    const syncedMeta = await syncAttemptToBackend(nextState);
    if (syncedMeta.attemptId) {
      onArchiveCompletedReport?.(
        {
          ...generatedReport,
          attemptId: syncedMeta.attemptId,
        },
        syncedMeta
      );
    }
  };

  const handleConfirmedRestart = () => {
    setConfirmRestartOpen(false);
    setReturnToReportAfterDetails(false);
    setFullNameInput("");
    setStudentClassInput("Class 11");
    setFormErrors({});
    setAiStatusNotice(null);
    setPdfError(null);
    setPdfSuccessFilename(null);
    onUpdateCareerState(createFreshCareerAssessmentState("intro"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmedClearData = async () => {
    setConfirmClearDataOpen(false);
    setAiStatusNotice(null);
    setPdfError(null);
    setPdfSuccessFilename(null);
    if (careerState.attemptId && careerState.accessToken) {
      try {
        await fetch(
          `/api/career/attempts/${encodeURIComponent(careerState.attemptId)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${careerState.accessToken}`,
            },
          }
        );
      } catch {
        // Ignore network error during local cleanup
      }
    }
    setFullNameInput("");
    onClearCareerData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRequestAINarrative = async (report: CareerGuidanceReport) => {
    setAiLoading(true);
    setAiStatusNotice(null);
    try {
      const res = await fetch("/api/career/personalize-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dimensionScores: report.dimensionScores,
          leadingCombinations: report.leadingCombinations,
          recommendedClusters: report.recommendedClusters,
          workStyleSummary: report.workStyleSummary,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.narrative) {
        setAiStatusNotice(
          data?.error ||
            "Live AI narrative commentary is not configured in this environment. Your complete free deterministic report is shown below."
        );
        return;
      }
      const enhancedReport = attachAINarrativeToReport(report, data.narrative);
      const nextState: CareerAssessmentState = {
        ...careerState,
        completedReport: enhancedReport,
        updatedAt: new Date().toISOString(),
      };
      onUpdateCareerState(nextState);
      if (nextState.attemptId && nextState.accessToken) {
        void syncAttemptToBackend(nextState);
      }
      setAiStatusNotice(
        "AI-enhanced personal commentary added based on your interest scores."
      );
    } catch {
      setAiStatusNotice(
        "Could not connect to the AI commentary service right now. Your complete deterministic report remains available below."
      );
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Generates a real, multi-page A4 PDF document from the completed CareerGuidanceReport
   * and triggers a browser file download with a .pdf extension.
   * Prevents duplicate clicks while PDF generation is in progress.
   */
  const handleDownloadPdfReport = async (report: CareerGuidanceReport) => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    setPdfError(null);
    setPdfSuccessFilename(null);

    try {
      // Yield briefly so the UI renders the "Generating PDF…" state before PDF layout work
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      const result = await downloadCareerReportPdf(report);
      if (!result.ok) {
        setPdfError(
          result.error ||
            "Could not generate your PDF report right now. Please try again."
        );
        return;
      }
      setPdfSuccessFilename(result.filename);
    } catch (err) {
      setPdfError(
        err instanceof Error && err.message
          ? err.message
          : "An unexpected error occurred while generating the PDF. Please retry."
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  const activeReport: CareerGuidanceReport | null =
    careerState.stage === "report"
      ? careerState.completedReport ||
        generateCareerGuidanceReport(cleanResponses, {
          attemptId: careerState.attemptId,
          studentName: careerState.studentDetails?.fullName,
          studentClass: careerState.studentDetails?.studentClass,
          studentDetails: careerState.studentDetails || undefined,
        })
      : null;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Breadcrumb / Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E5DC] pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#48564D]">
          <span className="font-semibold text-[#164A31] inline-flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            {CAREER_PRODUCT_IDENTITY.productName}
          </span>
          <span aria-hidden="true">·</span>
          <span>100% Free Career-Interest &amp; Preference Assessment</span>
          {careerState.stage !== "landing" && answeredCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#14241B] tabular-nums">
                {answeredCount} of {totalQuestions} answered
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {careerState.stage !== "landing" && (
            <button
              type="button"
              onClick={() => handleStageChange("landing")}
              className="text-xs font-medium text-[#48564D] hover:text-[#14241B] hover:underline cursor-pointer"
            >
              Assessment Overview
            </button>
          )}
          {onBackToStudyWorkspace && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBackToStudyWorkspace}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Study Workspace
            </Button>
          )}
        </div>
      </div>

      {/* =====================================================================
          STAGE 1: DEDICATED CAREER DISCOVERY LANDING PAGE
         ===================================================================== */}
      {careerState.stage === "landing" && (
        <div className="space-y-12">
          {/* HERO SECTION */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <MetaLine
                  items={[
                    "Vidyakshara Career Intelligence Test",
                    "Classes 9–12 & College Explorers",
                    "100% Free",
                  ]}
                />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14241B] leading-tight">
                  {CAREER_PRODUCT_IDENTITY.headline}
                </h1>
                <p className="text-base sm:text-lg text-[#48564D] leading-relaxed">
                  {CAREER_PRODUCT_IDENTITY.supportingDescription}
                </p>

                {/* Key Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-3">
                    <div className="text-xs text-[#6E7B72]">Format</div>
                    <div className="text-sm font-bold text-[#14241B] mt-0.5 tabular-nums">
                      40 Questions
                    </div>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-3">
                    <div className="text-xs text-[#6E7B72]">Estimated Time</div>
                    <div className="text-sm font-bold text-[#14241B] mt-0.5 tabular-nums">
                      20–25 Minutes
                    </div>
                  </div>
                  <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-3 col-span-2 sm:col-span-1">
                    <div className="text-xs text-[#6E7B72]">Complete Access</div>
                    <div className="text-sm font-bold text-[#164A31] mt-0.5">
                      Free Personalized Report
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleStartNewAssessment}
                  >
                    {CAREER_PRODUCT_IDENTITY.primaryCta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  {hasUnfinishedDraft && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={handleResumeUnfinishedAssessment}
                    >
                      Resume Unfinished Assessment ({answeredCount}/
                      {totalQuestions})
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => scrollToElement("career-how-it-works")}
                  >
                    {CAREER_PRODUCT_IDENTITY.secondaryCta}
                  </Button>
                </div>

                <p className="text-xs text-[#6E7B72]">
                  100% free · No credit card required · No subscription or upgrade required to unlock any section of your report.
                </p>
              </div>

              {/* Right 5 Cols: What the Assessment Measures */}
              <div className="lg:col-span-5 bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-[#E2E5DC] pb-3">
                  <div>
                    <span className="text-xs font-semibold text-[#164A31]">
                      Six Broad Interest Dimensions
                    </span>
                    <h2 className="text-sm font-semibold text-[#14241B]">
                      How your interest profile is mapped
                    </h2>
                  </div>
                  <Compass className="w-5 h-5 text-[#164A31] shrink-0" />
                </div>

                <div className="space-y-2.5">
                  {INTEREST_DIMENSIONS.map((dim) => (
                    <div
                      key={dim.id}
                      className="bg-white border border-[#E2E5DC] rounded-lg p-3"
                    >
                      <div className="text-xs font-semibold text-[#14241B]">
                        {dim.name}
                      </div>
                      <p className="text-xs text-[#48564D] mt-0.5 leading-relaxed">
                        {dim.tagline}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#6E7B72] leading-relaxed">
                  Inspired by established career-interest frameworks to help you organise your preferences — presented as practical exploration guidance, not a fixed diagnosis.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION: WHAT YOU WILL DISCOVER */}
          <section className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-[#164A31]">
                Inside Your Free Report
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#14241B] mt-0.5">
                What you will discover
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2EC] text-[#164A31] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  1. Your interest patterns
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  See your relative profile across Practical, Investigative, Creative, Social, Enterprising, and Structured activities — including how your top two dimensions combine.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2EC] text-[#164A31] flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  2. Career fields worth exploring
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  Explore a tailored shortlist of career clusters with transparent explanations of why each field connects to your answers and what professionals actually do each day.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2EC] text-[#164A31] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  3. Working &amp; learning styles
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  Understand whether you currently prefer hands-on prototyping, deep conceptual inquiry, collaborative team initiatives, or structured analytical workflows.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#EAF2EC] text-[#164A31] flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  4. Next steps &amp; 7-day plan
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  Receive a practical 7-day exploration plan with small, zero-cost activities and skills to try before making high-stakes subject or college choices.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION: EXPLORE CAREER POSSIBILITIES (ALL 10 CLUSTERS) */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[#164A31]">
                  Broad Horizons Across Streams
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#14241B] mt-0.5">
                  Explore career possibilities across 10 diverse fields
                </h2>
                <p className="text-xs sm:text-sm text-[#48564D] mt-1 max-w-3xl">
                  Many students have strong interests that bridge two or three different fields. No career path is inherently superior to another — the goal is to discover where your curiosity, effort, and opportunities meet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAREER_CLUSTERS.map((cluster) => (
                <div
                  key={cluster.id}
                  className="bg-white border border-[#E2E5DC] rounded-xl p-5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#FAF8F3] border border-[#E2E5DC] flex items-center justify-center shrink-0">
                        {getClusterIcon(cluster.id)}
                      </div>
                      <h3 className="text-sm font-semibold text-[#14241B]">
                        {cluster.title}
                      </h3>
                    </div>
                    <p className="text-[11px] font-medium text-[#164A31]">
                      {cluster.subtitle}
                    </p>
                    <p className="text-xs text-[#48564D] leading-relaxed">
                      {cluster.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E2E5DC] text-[11px] text-[#6E7B72]">
                    <strong className="text-[#14241B]">Examples:</strong>{" "}
                    {cluster.exampleCareers.slice(0, 3).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION: HOW IT WORKS */}
          <section
            id="career-how-it-works"
            className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div>
              <span className="text-xs font-semibold text-[#164A31]">
                Simple 4-Step Flow
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#14241B] mt-0.5">
                How it works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 space-y-2">
                <div className="text-xs font-bold text-[#164A31] tabular-nums">
                  Step 1
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  Answer 40 questions
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  Respond to 30 activity-interest statements and 10 real-world scenarios at your own pace. Your progress saves automatically on each question.
                </p>
              </div>

              <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 space-y-2">
                <div className="text-xs font-bold text-[#164A31] tabular-nums">
                  Step 2
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  Review your interest profile
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  See how your responses map across six broad interest dimensions and how your preferred learning and working styles take shape.
                </p>
              </div>

              <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 space-y-2">
                <div className="text-xs font-bold text-[#164A31] tabular-nums">
                  Step 3
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  Receive your free personalized report
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  Unlock your full career-guidance report immediately upon completion — with zero paywalls, subscriptions, or hidden locks.
                </p>
              </div>

              <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 space-y-2">
                <div className="text-xs font-bold text-[#164A31] tabular-nums">
                  Step 4
                </div>
                <h3 className="text-sm font-semibold text-[#14241B]">
                  Download your PDF &amp; explore next steps
                </h3>
                <p className="text-xs text-[#48564D] leading-relaxed">
                  Try low-cost 7-day exploration tasks, review subject eligibility pathways, and download your formatted multi-page PDF report to discuss with family or teachers.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION: TRUST, TRANSPARENCY & PRIVACY */}
          <section className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#164A31]" />
              <h2 className="text-base sm:text-lg font-bold text-[#14241B]">
                Trust, transparency &amp; student privacy
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#48564D] leading-relaxed">
              <div className="bg-white border border-[#E2E5DC] rounded-lg p-4 space-y-1.5">
                <div className="font-semibold text-[#14241B]">
                  Guidance, Not a Fixed Diagnosis
                </div>
                <p>
                  This assessment explores your current career interests and work preferences. It is not a clinically standardized psychological test, medical diagnosis, or exam-cutoff predictor.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5DC] rounded-lg p-4 space-y-1.5">
                <div className="font-semibold text-[#14241B]">
                  Interests Evolve with Experience
                </div>
                <p>
                  Career success depends on interest, sustained practice, mentorship, and opportunity. Exploring new projects or subjects often reveals strengths you did not know you had.
                </p>
              </div>

              <div className="bg-white border border-[#E2E5DC] rounded-lg p-4 space-y-1.5">
                <div className="font-semibold text-[#14241B]">
                  Permanently 100% Free &amp; Student-First Privacy
                </div>
                <p>
                  We never ask for payment details, phone numbers, or email addresses to unlock your report. Your name and class personalize your report and PDF download, and you can delete your saved data at any time.
                </p>
              </div>
            </div>

            {hasUnfinishedDraft && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E5DC]">
                <span className="text-xs text-[#48564D]">
                  Unfinished assessment draft saved on this device:{" "}
                  {answeredCount} of {totalQuestions} answers.
                </span>
                {!confirmClearDataOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearDataOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B42318] hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Discard unfinished draft
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[#B42318]">
                      Discard saved draft answers?
                    </span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleConfirmedClearData}
                    >
                      Yes, Discard Draft
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmClearDataOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION: FINAL CTA */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#14241B]">
              Ready to explore your possibilities?
            </h2>
            <p className="text-xs sm:text-sm text-[#48564D] max-w-xl mx-auto">
              Take 20–25 quiet minutes to reflect on the activities and problems that genuinely interest you, and receive your complete personalized report right away.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleStartNewAssessment}
              >
                {CAREER_PRODUCT_IDENTITY.primaryCta}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          STAGE 2: PRE-ASSESSMENT INTRO & STUDENT PERSONALIZATION FORM
         ===================================================================== */}
      {careerState.stage === "intro" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <form
            onSubmit={handleStudentDetailsSubmit}
            noValidate
            className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="space-y-2 border-b border-[#E2E5DC] pb-4">
              <MetaLine
                items={[
                  "Step 1 of 2 · Report Personalization",
                  "40 Questions",
                  "100% Free Complete Report & PDF",
                ]}
              />
              <h1 className="text-xl sm:text-2xl font-bold text-[#14241B]">
                Let&apos;s personalize your career report
              </h1>
              <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                Enter your name and current class so we can personalize your Career Intelligence Report and downloadable PDF.
              </p>
            </div>

            {/* Form Fields Grid: Student Name & Current Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cit-student-full-name"
                  className="block text-xs font-semibold text-[#14241B]"
                >
                  Student&apos;s Full Name <span className="text-[#B42318]">*</span>
                </label>
                <input
                  id="cit-student-full-name"
                  type="text"
                  autoComplete="name"
                  value={fullNameInput}
                  onChange={(e) => {
                    setFullNameInput(e.target.value);
                    if (formErrors.fullName) {
                      setFormErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  placeholder="e.g., Aarav Sharma"
                  aria-invalid={Boolean(formErrors.fullName)}
                  aria-describedby={
                    formErrors.fullName ? "cit-err-fullname" : undefined
                  }
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#14241B] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#164A31] ${
                    formErrors.fullName ? "border-[#B42318]" : "border-[#CBD2C6]"
                  }`}
                />
                {formErrors.fullName && (
                  <p
                    id="cit-err-fullname"
                    role="alert"
                    className="text-xs font-medium text-[#B42318]"
                  >
                    {formErrors.fullName}
                  </p>
                )}
              </div>

              {/* Current Class */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cit-student-class"
                  className="block text-xs font-semibold text-[#14241B]"
                >
                  Current Class <span className="text-[#B42318]">*</span>
                </label>
                <select
                  id="cit-student-class"
                  value={studentClassInput}
                  onChange={(e) => {
                    setStudentClassInput(e.target.value as CareerStudentClass);
                    if (formErrors.studentClass) {
                      setFormErrors((prev) => ({
                        ...prev,
                        studentClass: undefined,
                      }));
                    }
                  }}
                  aria-invalid={Boolean(formErrors.studentClass)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#14241B] bg-[#FAF8F3] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#164A31] ${
                    formErrors.studentClass
                      ? "border-[#B42318]"
                      : "border-[#CBD2C6]"
                  }`}
                >
                  {STUDENT_CLASS_OPTIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                {formErrors.studentClass && (
                  <p role="alert" className="text-xs font-medium text-[#B42318]">
                    {formErrors.studentClass}
                  </p>
                )}
              </div>
            </div>

            {/* Concise Assessment Orientation */}
            <div className="border-t border-[#E2E5DC] pt-5 space-y-3">
              <div className="text-xs font-semibold text-[#164A31]">
                Quick Tips Before Question 1 of 40
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#48564D] leading-relaxed">
                <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-3">
                  <strong className="text-[#14241B] block mb-0.5">
                    1. What this measures
                  </strong>
                  Questions 1–30 explore your interest across six dimensions (Realistic, Investigative, Artistic, Social, Enterprising, Conventional); Questions 31–40 explore your preferred working and learning style.
                </div>
                <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-3">
                  <strong className="text-[#14241B] block mb-0.5">
                    2. No right or wrong answers
                  </strong>
                  This is not a timed exam. Answer based on what genuinely sounds interesting to learn or do — your answers auto-save on every question.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E5DC]">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() =>
                  handleStageChange(
                    returnToReportAfterDetails ? "report" : "landing"
                  )
                }
              >
                <ArrowLeft className="w-4 h-4" />
                {returnToReportAfterDetails
                  ? "Back to My Report"
                  : "Back to Overview"}
              </Button>

              <Button type="submit" variant="primary" size="lg">
                {returnToReportAfterDetails
                  ? "Save Name & Class"
                  : answeredCount > 0 && answeredCount < totalQuestions
                  ? `Save & Resume (${answeredCount}/${totalQuestions})`
                  : "Begin Question 1 of 40"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          STAGE 3: ASSESSMENT-TAKING EXPERIENCE (40 QUESTIONS)
         ===================================================================== */}
      {careerState.stage === "questions" && currentQuestion && (
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Progress & Top Controls Card */}
          <div className="bg-white border border-[#E2E5DC] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-[#164A31]">
                  {currentQuestion.sectionTitle}
                </span>
                <div className="text-xs text-[#48564D] mt-0.5 tabular-nums">
                  Question{" "}
                  <strong className="text-[#14241B]">
                    {currentQuestion.number}
                  </strong>{" "}
                  of {totalQuestions} ·{" "}
                  <strong className="text-[#164A31]">{answeredCount}</strong> of{" "}
                  {totalQuestions} answered (
                  {Math.round((answeredCount / totalQuestions) * 100)}%)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNavigatorGrid((v) => !v)}
                >
                  {showNavigatorGrid
                    ? "Hide Question Map"
                    : `Question Map (${answeredCount}/40)`}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRestartOpen(true)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart
                </Button>
              </div>
            </div>

            <ProgressBar
              value={(answeredCount / totalQuestions) * 100}
              label={`Career assessment progress: ${answeredCount} of ${totalQuestions} questions answered`}
            />

            {/* Confirmation before discarding existing answers */}
            {confirmRestartOpen && (
              <div className="bg-[#FDF6E7] border border-[#E6C88A] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#6E4800]">
                  <strong>Restart assessment?</strong> This will clear your{" "}
                  {answeredCount} current answer{answeredCount === 1 ? "" : "s"}{" "}
                  and start fresh from Question 1.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmedRestart}
                  >
                    Yes, Discard &amp; Restart
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmRestartOpen(false)}
                  >
                    Keep My Answers
                  </Button>
                </div>
              </div>
            )}

            {/* Collapsible 40-Question Navigator Map */}
            {showNavigatorGrid && (
              <div className="pt-3 border-t border-[#E2E5DC] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#48564D]">
                  <span>
                    Select any question number to jump directly or revise a previous answer:
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#164A31] inline-block" />
                      Answered ({answeredCount})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-[#FAF8F3] border border-[#CBD2C6] inline-block" />
                      Unanswered ({totalQuestions - answeredCount})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {CAREER_QUESTIONS.map((q, idx) => {
                    const isAnswered = Boolean(cleanResponses[q.id]);
                    const isCurrent = idx === safeQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          onUpdateCareerState({
                            ...careerState,
                            currentQuestionIndex: idx,
                          });
                        }}
                        aria-label={`Jump to question ${q.number} (${
                          isAnswered ? "Answered" : "Unanswered"
                        })`}
                        className={`h-8 rounded-md text-xs font-semibold tabular-nums transition-colors cursor-pointer border ${
                          isCurrent
                            ? "ring-2 ring-[#164A31] ring-offset-1 bg-[#EAF2EC] text-[#164A31] border-[#164A31]"
                            : isAnswered
                            ? "bg-[#164A31] text-white border-[#164A31]"
                            : "bg-[#FAF8F3] text-[#48564D] border-[#E2E5DC] hover:border-[#164A31]"
                        }`}
                      >
                        {q.number}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Question Card */}
          <div className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#6E7B72] tabular-nums">
                  Question {currentQuestion.number} of {totalQuestions}
                </span>
                <span className="text-xs font-medium text-[#164A31]">
                  {cleanResponses[currentQuestion.id]
                    ? "Answer saved"
                    : "Not answered yet"}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#14241B] leading-snug">
                {currentQuestion.prompt}
              </h2>

              <p className="text-xs text-[#6E7B72]">
                {currentQuestion.responseType === "likert-5"
                  ? "How would you feel about doing or learning this activity? (No right or wrong answer)"
                  : "Choose the option that feels closest to your natural preference:"}
              </p>
            </div>

            {/* Answer Options */}
            <div
              role="radiogroup"
              aria-label={`Question ${currentQuestion.number} options`}
              className="space-y-2.5"
            >
              {currentQuestion.options.map((opt) => {
                const isSelected =
                  cleanResponses[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      handleSelectOption(currentQuestion.id, opt.id)
                    }
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#EAF2EC] border-[#164A31] text-[#14241B] shadow-2xs"
                        : "bg-[#FAF8F3] border-[#E2E5DC] text-[#14241B] hover:bg-white hover:border-[#164A31]/50"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums border ${
                        isSelected
                          ? "bg-[#164A31] text-white border-[#164A31]"
                          : "bg-white text-[#48564D] border-[#CBD2C6]"
                      }`}
                    >
                      {opt.id}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm sm:text-base font-medium leading-relaxed">
                        {opt.label}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#164A31] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation Footer */}
            <div className="pt-4 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={safeQuestionIndex === 0}
                onClick={() =>
                  onUpdateCareerState({
                    ...careerState,
                    currentQuestionIndex: Math.max(0, safeQuestionIndex - 1),
                  })
                }
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex flex-wrap items-center gap-2.5">
                {safeQuestionIndex < totalQuestions - 1 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() =>
                      onUpdateCareerState({
                        ...careerState,
                        currentQuestionIndex: Math.min(
                          totalQuestions - 1,
                          safeQuestionIndex + 1
                        ),
                      })
                    }
                  >
                    Next Question
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleFinishOrReviewAttempt}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Review &amp; Generate My Free Report
                  </Button>
                )}

                {answeredCount >= 30 &&
                  safeQuestionIndex < totalQuestions - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={handleFinishOrReviewAttempt}
                    >
                      Finish Assessment ({answeredCount}/40)
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {/* Reassuring Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E7B72] px-1">
            <span>
              Your progress is saved automatically in this browser. You can exit and resume anytime.
            </span>
            <button
              type="button"
              onClick={() => handleStageChange("landing")}
              className="text-[#164A31] font-medium hover:underline cursor-pointer"
            >
              Save &amp; Return to Overview
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 3B: UNANSWERED QUESTIONS CHECK BEFORE SUBMISSION
         ===================================================================== */}
      {careerState.stage === "review-unanswered" && (
        <div className="max-w-3xl mx-auto bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-[#E2E5DC] pb-4">
            <span className="text-xs font-semibold text-[#8F4B00]">
              Review Before Generating Report
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#14241B]">
              You have {unansweredQuestions.length} unanswered question
              {unansweredQuestions.length === 1 ? "" : "s"}
            </h1>
            <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
              You have answered{" "}
              <strong className="text-[#14241B] tabular-nums">
                {answeredCount} of {totalQuestions}
              </strong>{" "}
              questions. Answering all 40 questions gives you the most balanced interest profile, or you can generate your report right now using your answered questions.
            </p>
          </div>

          {unansweredQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#14241B]">
                Select any unanswered question below to return and answer it:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {unansweredQuestions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() =>
                      handleStageChange("questions", q.number - 1)
                    }
                    className="text-left p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-[#164A31] tabular-nums">
                      Question {q.number}
                    </div>
                    <div className="text-xs text-[#48564D] line-clamp-2 mt-0.5">
                      {q.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E5DC]">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() =>
                handleStageChange(
                  "questions",
                  unansweredQuestions[0]
                    ? unansweredQuestions[0].number - 1
                    : safeQuestionIndex
                )
              }
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Unanswered Questions
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={answeredCount === 0}
              onClick={() => handleFinalizeReport(cleanResponses)}
            >
              Generate My Free Report Now ({answeredCount}/{totalQuestions}{" "}
              Answered)
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STAGE 4: COMPLETE 100% FREE PERSONALIZED CAREER-GUIDANCE REPORT
         ===================================================================== */}
      {careerState.stage === "report" && activeReport && (
        <div id="career-guidance-report" className="space-y-8">
          {/* REPORT HEADER & SINGLE PDF DOWNLOAD ACTION */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E5DC] pb-5">
              <div className="space-y-2">
                <MetaLine
                  items={[
                    "Vidyakshara Career Intelligence Test",
                    ...(activeReport.studentClass
                      ? [activeReport.studentClass]
                      : []),
                    `Generated ${activeReport.generatedAt}`,
                    `${activeReport.answeredCount} / ${activeReport.totalQuestions} Questions Answered`,
                    "100% Free Complete Report",
                  ]}
                />
                <h1 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
                  {activeReport.studentName
                    ? `${activeReport.studentName}’s Personalized Career-Guidance Report`
                    : "Your Personalized Career-Guidance Report"}
                </h1>
                <p className="text-xs sm:text-sm text-[#48564D] max-w-3xl leading-relaxed">
                  A structured exploration of your stated interests, work-style preferences, leading combinations, and career possibilities — designed to support your next steps.
                </p>
              </div>

              {/* Action Toolbar: Single Primary Export Button ("Download Report (PDF)") */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={pdfGenerating}
                  onClick={() => handleDownloadPdfReport(activeReport)}
                >
                  {pdfGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating PDF…
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Report (PDF)
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setReturnToReportAfterDetails(true);
                    handleStageChange("intro", safeQuestionIndex);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {careerState.studentDetails
                    ? "Edit Name & Class"
                    : "Add Name & Class"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStageChange("questions", 0)}
                >
                  Review / Edit Answers
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRestartOpen(true)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake Assessment
                </Button>
              </div>
            </div>

            {/* PDF Generation Error / Retry Alert */}
            {pdfError && (
              <div
                role="alert"
                className="bg-[#FEF3F2] border border-[#FECDCA] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 text-xs text-[#B42318]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">
                      Could not generate PDF report
                    </strong>
                    <span>{pdfError}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pdfGenerating}
                  onClick={() => handleDownloadPdfReport(activeReport)}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry PDF Download
                </Button>
              </div>
            )}

            {/* PDF Download Confirmation Banner (only shown after PDF generation and download succeed) */}
            {pdfSuccessFilename && !pdfError && (
              <div
                role="status"
                aria-live="polite"
                className="bg-[#EAF2EC] border border-[#C6DEC9] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#14241B]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#164A31] shrink-0" />
                  <span>
                    Your PDF report{" "}
                    <strong className="font-semibold text-[#164A31]">
                      {pdfSuccessFilename}
                    </strong>{" "}
                    has been generated and downloaded.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfSuccessFilename(null)}
                  className="text-xs font-medium text-[#164A31] hover:underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {confirmRestartOpen && (
              <div className="bg-[#FDF6E7] border border-[#E6C88A] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#6E4800]">
                  <strong>Retake the assessment from Question 1?</strong> This will clear your current 40 answers and generate a fresh report when you finish.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmedRestart}
                  >
                    Yes, Retake Assessment
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmRestartOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION A: WELCOME AND OVERVIEW */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#14241B]">
                  A. Welcome &amp; Overview
                </h2>
                <span className="text-xs font-medium text-[#164A31]">
                  {activeReport.personalizationMode === "ai-enhanced"
                    ? "Deterministic Scoring + AI Personal Commentary"
                    : "Deterministic Interest & Preference Engine"}
                </span>
              </div>

              <p className="text-sm text-[#48564D] leading-relaxed">
                Thank you
                {activeReport.studentName
                  ? `, ${activeReport.studentName}${
                      activeReport.studentClass
                        ? ` (${activeReport.studentClass})`
                        : ""
                    },`
                  : ""}{" "}
                for completing the{" "}
                <strong className="text-[#14241B]">
                  Vidyakshara Career Intelligence Test
                </strong>
                . Your top relative interest areas today are{" "}
                <strong className="text-[#164A31]">
                  {activeReport.leadingDimensions
                    .map((d) => `${d.shortLabel} (${d.normalizedScore}/100)`)
                    .join(", ")}
                </strong>
                . Remember that this assessment explores your current interests and preferences rather than predicting destiny or measuring fixed ability — use it as a practical compass for curiosity and conversation.
              </p>

              {activeReport.aiNarrative ? (
                <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 space-y-2">
                  <div className="text-xs font-semibold text-[#164A31] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Personalized AI Advisor Commentary (Grounded in Your Scores)
                  </div>
                  <p className="text-xs sm:text-sm text-[#14241B] leading-relaxed">
                    {activeReport.aiNarrative.personalizedOverview}
                  </p>
                  <p className="text-xs text-[#48564D] leading-relaxed">
                    {activeReport.aiNarrative.encouragementNote}
                  </p>
                </div>
              ) : (
                <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#48564D]">
                    Your complete deterministic report is ready below. You can optionally request AI-phrased commentary on your score patterns.
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={aiLoading}
                    onClick={() => handleRequestAINarrative(activeReport)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiLoading
                      ? "Generating Commentary..."
                      : "Add Optional AI Commentary"}
                  </Button>
                </div>
              )}

              {aiStatusNotice && (
                <p className="text-xs text-[#48564D] bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg px-3.5 py-2">
                  {aiStatusNotice}
                </p>
              )}
            </div>
          </section>

          {/* SECTION B: INTEREST PROFILE (6 DIMENSIONS + HORIZONTAL BAR CHART) */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#164A31]">
                Six-Dimension Interest Profile
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14241B]">
                B. Your Interest Profile Across Six Dimensions
              </h2>
              <p className="text-xs sm:text-sm text-[#48564D]">
                Scores are normalized to a 0–100 scale based on your responses. These scores show your relative preference for different types of activities — they are not an externally validated aptitude or exam-readiness score.
              </p>
            </div>

            {activeReport.tieNote && (
              <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 text-xs text-[#48564D] leading-relaxed">
                <strong className="text-[#14241B]">
                  Note on Balanced / Close Scores:
                </strong>{" "}
                {activeReport.tieNote}
              </div>
            )}

            <div className="space-y-4">
              {activeReport.dimensionScores.map((dim) => (
                <div
                  key={dim.dimensionId}
                  className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-bold text-[#14241B]">
                        {dim.name}
                      </span>
                      <span className="text-xs text-[#6E7B72] ml-2">
                        · {dim.levelLabel}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#164A31] tabular-nums">
                      {dim.normalizedScore} / 100
                    </div>
                  </div>

                  {/* Accessible Horizontal Bar */}
                  <div
                    role="meter"
                    aria-label={`${dim.name} interest score`}
                    aria-valuenow={dim.normalizedScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="w-full h-2.5 bg-[#E2E5DC] rounded-xs overflow-hidden"
                  >
                    <div
                      className="h-full bg-[#164A31] transition-all duration-300"
                      style={{ width: `${dim.normalizedScore}%` }}
                    />
                  </div>

                  <p className="text-xs text-[#48564D] leading-relaxed">
                    {dim.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION C: LEADING INTEREST COMBINATIONS & WORK STYLE */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#164A31]">
                Patterns &amp; Working Preferences
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14241B]">
                C. Leading Interest Combinations &amp; Preferred Work Style
              </h2>
              <p className="text-xs sm:text-sm text-[#48564D]">
                Most rewarding careers sit at the intersection of two or more interests rather than inside a single box.
              </p>
            </div>

            {activeReport.aiNarrative?.combinationCommentary && (
              <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg p-4 text-xs sm:text-sm text-[#14241B] leading-relaxed">
                <strong className="text-[#164A31]">
                  How Your Top Dimensions Interact:
                </strong>{" "}
                {activeReport.aiNarrative.combinationCommentary}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeReport.leadingCombinations.map((combo) => (
                <div
                  key={combo.id}
                  className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-5 space-y-2.5"
                >
                  <div className="text-xs font-bold text-[#164A31]">
                    {combo.combinationCode}
                  </div>
                  <h3 className="text-base font-bold text-[#14241B]">
                    {combo.title}
                  </h3>
                  <p className="text-xs text-[#48564D] leading-relaxed">
                    {combo.meaning}
                  </p>
                  <div className="pt-2 border-t border-[#E2E5DC] text-xs text-[#48564D] leading-relaxed">
                    <strong className="text-[#14241B]">
                      Alternative Interpretation:
                    </strong>{" "}
                    {combo.alternativeInterpretation}
                  </div>
                </div>
              ))}
            </div>

            {/* Work & Learning Preferences Summary */}
            <div className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#14241B]">
                Your Stated Learning &amp; Work-Environment Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#48564D] leading-relaxed">
                <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5">
                  <strong className="text-[#14241B] block mb-1">
                    Work Setting Preference
                  </strong>
                  {activeReport.workStyleSummary.preferredEnvironment}
                </div>
                <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5">
                  <strong className="text-[#14241B] block mb-1">
                    Learning Approach
                  </strong>
                  {activeReport.workStyleSummary.learningApproach}
                </div>
                <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5">
                  <strong className="text-[#14241B] block mb-1">
                    Collaboration &amp; Focus
                  </strong>
                  {activeReport.workStyleSummary.collaborationStyle}
                </div>
                <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5">
                  <strong className="text-[#14241B] block mb-1">
                    Interdisciplinary Openness
                  </strong>
                  {activeReport.workStyleSummary.explorationOpenness}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION D: CAREER FIELDS TO EXPLORE */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#164A31]">
                  Shortlist for Exploration
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#14241B]">
                  D. Career Fields to Explore
                </h2>
                <p className="text-xs sm:text-sm text-[#48564D] max-w-3xl">
                  Below are the top 5 career clusters aligned with your responses. Treat this ranking as a starting menu for exploration — not a guaranteed prediction or an exclusive restriction.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowAllTenClusters((v) => !v)}
              >
                {showAllTenClusters
                  ? "Show Top 5 Shortlist"
                  : "Explore All 10 Career Clusters"}
              </Button>
            </div>

            <div className="space-y-5">
              {(showAllTenClusters
                ? activeReport.allRankedClusters
                : activeReport.recommendedClusters
              ).map((matched) => (
                <div
                  key={matched.cluster.id}
                  className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E2E5DC] pb-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#164A31] tabular-nums">
                          #{matched.rank} Exploration Match
                        </span>
                        <span className="text-xs text-[#6E7B72]">·</span>
                        <span className="text-xs font-medium text-[#48564D]">
                          {matched.cluster.subtitle}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#14241B]">
                        {matched.cluster.title}
                      </h3>
                    </div>

                    <div className="bg-white border border-[#E2E5DC] rounded-lg px-3 py-1.5 text-right shrink-0">
                      <div className="text-[11px] text-[#6E7B72]">
                        Interest Alignment
                      </div>
                      <div className="text-sm font-bold text-[#164A31] tabular-nums">
                        {matched.alignmentScore} / 100
                      </div>
                    </div>
                  </div>

                  {/* Why it fits */}
                  <div className="text-xs sm:text-sm text-[#14241B] leading-relaxed">
                    <strong className="text-[#164A31]">
                      Why it may fit your stated interests:
                    </strong>{" "}
                    {matched.whyItFits}
                  </div>

                  {/* 3-Column Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                    <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5 space-y-1.5">
                      <div className="font-semibold text-[#14241B]">
                        Examples of Careers
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[#48564D]">
                        {matched.cluster.exampleCareers.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5 space-y-1.5">
                      <div className="font-semibold text-[#14241B]">
                        Typical Activities &amp; Problems
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[#48564D]">
                        {matched.cluster.typicalActivities.map((act) => (
                          <li key={act}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5 space-y-1.5">
                      <div className="font-semibold text-[#14241B]">
                        Relevant Subjects &amp; Skills
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[#48564D]">
                        {matched.cluster.relevantSubjectsAndSkills.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Quantitative / Conceptual Connection using Shared MathRenderer */}
                  <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5 text-xs text-[#48564D]">
                    <div className="font-semibold text-[#14241B] mb-1">
                      How Concepts &amp; Models Appear in This Field:
                    </div>
                    <MarkdownContent
                      content={matched.cluster.quantitativeOrConceptExample}
                    />
                  </div>

                  {/* Low-Cost Trial + Eligibility Note */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    <div className="bg-[#EAF2EC] border border-[#C6DEC9] rounded-lg p-3.5 text-[#14241B]">
                      <strong className="text-[#164A31] block mb-1">
                        Practical, Zero-Cost Way to Test Your Interest:
                      </strong>
                      {matched.cluster.lowCostTrialActivity}
                    </div>

                    <div className="bg-white border border-[#E2E5DC] rounded-lg p-3.5 text-[#48564D]">
                      <strong className="text-[#14241B] block mb-1">
                        Academic Eligibility &amp; Pathway Reminder:
                      </strong>
                      {matched.cluster.eligibilityAndPathwayNote}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION E: LEARNING AND SKILL DEVELOPMENT */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#164A31]">
                Transferable Capabilities
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14241B]">
                E. Learning &amp; Skill Development
              </h2>
              <p className="text-xs sm:text-sm text-[#48564D]">
                These foundational skills connect to the interests you expressed and remain valuable even if you change your specific career target later.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeReport.skillRecommendations.map((skill) => (
                <div
                  key={skill.id}
                  className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-4 space-y-2"
                >
                  <div className="text-xs font-semibold text-[#164A31]">
                    {skill.category}
                  </div>
                  <h3 className="text-sm font-bold text-[#14241B]">
                    {skill.skillName}
                  </h3>
                  <p className="text-xs text-[#48564D] leading-relaxed">
                    {skill.whySuggested}
                  </p>
                  <div className="pt-2 border-t border-[#E2E5DC] text-xs text-[#14241B]">
                    <strong className="text-[#164A31]">How to practise:</strong>{" "}
                    {skill.starterActivity}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION F: PERSONALIZED 7-DAY EXPLORATION PLAN */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#164A31]">
                Small, Zero-Cost Experiments
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14241B]">
                F. Your Personalized 7-Day Exploration Plan
              </h2>
              <p className="text-xs sm:text-sm text-[#48564D]">
                Spend 15–30 minutes a day over the next week testing your top career clusters through real activities — no paid courses or subscriptions required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {activeReport.sevenDayPlan.map((dayItem) => (
                <div
                  key={dayItem.day}
                  className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-4 flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#164A31] tabular-nums">
                        Day {dayItem.day}
                      </span>
                      <span className="text-[#6E7B72] tabular-nums">
                        {dayItem.timeEstimate}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#14241B]">
                      {dayItem.title}
                    </h3>
                    <p className="text-xs text-[#48564D] leading-relaxed">
                      {dayItem.activity}
                    </p>
                  </div>
                  <div className="text-[11px] font-medium text-[#6E7B72] pt-2 border-t border-[#E2E5DC]">
                    Focus: {dayItem.focusArea}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION G: QUESTIONS FOR FURTHER REFLECTION */}
          <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#164A31]">
                Self-Reflection &amp; Family Discussion
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#14241B]">
                G. Questions for Further Reflection
              </h2>
              <p className="text-xs sm:text-sm text-[#48564D]">
                Use these questions in a notebook or in a calm conversation with your parents, teachers, or school counsellor:
              </p>
            </div>

            <ol className="list-decimal pl-5 space-y-2.5 text-xs sm:text-sm text-[#14241B] leading-relaxed">
              {activeReport.reflectionQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </section>

          {/* SECTION H: IMPORTANT LIMITATIONS & PRIVACY CONTROLS */}
          <section className="bg-[#FAF8F3] border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#164A31]" />
              <h2 className="text-base sm:text-lg font-bold text-[#14241B]">
                H. Important Limitations &amp; Responsible Use
              </h2>
            </div>

            <ul className="list-disc pl-5 space-y-2 text-xs text-[#48564D] leading-relaxed">
              {activeReport.limitationsAndEthics.map((lim) => (
                <li key={lim}>{lim}</li>
              ))}
            </ul>

            <div className="pt-4 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={pdfGenerating}
                  onClick={() => handleDownloadPdfReport(activeReport)}
                >
                  {pdfGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Generating PDF…
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Download Report (PDF)
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStageChange("questions", 0)}
                >
                  Review My 40 Answers
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmRestartOpen(true)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake Assessment
                </Button>
              </div>

              {!confirmClearDataOpen ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearDataOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B42318] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Local Assessment Data
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-[#B42318]">
                    Confirm clearing saved answers &amp; report?
                  </span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmedClearData}
                  >
                    Yes, Clear Data
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmClearDataOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
