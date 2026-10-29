import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Layers,
  RotateCcw,
  Target,
} from "lucide-react";
import {
  ClassLevel,
  ImmediateGoal,
  StudentProfile,
  SubjectId,
  TargetExam,
} from "../../types/domain";
import { SUBJECTS } from "../../data/curriculum";
import { Button, MetaLine, ProgressBar, SegmentedControl } from "../ui/Primitives";
import { MarkdownContent, MathRenderer } from "../ui/MathAndDiagrams";
import { SubjectIllustration } from "../ui/SubjectIllustration";
import {
  CareerAssessmentState,
  CareerGuidanceReport,
} from "../../types/career";
import {
  createFreshCareerAssessmentState,
  resetCareerStateForTabEntry,
} from "../../utils/careerScoringEngine";
import { CareerDiscoveryView } from "./CareerDiscoveryView";

interface DiscoveryAndAuthViewProps {
  initialStep?: "discover" | "onboarding" | "career-discovery";
  onCompleteOnboarding: (profile: StudentProfile) => void;
  onEnterDemoMode: () => void;
  careerState?: CareerAssessmentState;
  onUpdateCareerState?: (nextState: CareerAssessmentState) => void;
  onArchiveCompletedReport?: (
    report: CareerGuidanceReport,
    attemptMeta?: { attemptId?: string; accessToken?: string }
  ) => void;
  onClearCareerData?: () => void;
  onOpenCareerDiscovery?: () => void;
}

export function DiscoveryAndAuthView({
  initialStep = "discover",
  onCompleteOnboarding,
  onEnterDemoMode,
  careerState,
  onUpdateCareerState,
  onArchiveCompletedReport,
  onClearCareerData,
}: DiscoveryAndAuthViewProps) {
  const [viewMode, setViewMode] = useState<
    "discover" | "onboarding" | "career-discovery"
  >(initialStep);
  const [localCareerState, setLocalCareerState] =
    useState<CareerAssessmentState>(
      () => careerState || createFreshCareerAssessmentState("landing")
    );

  const effectiveCareerState = careerState || localCareerState;
  const handleCareerStateChange = (next: CareerAssessmentState) => {
    setLocalCareerState(next);
    onUpdateCareerState?.(next);
  };
  const handleCareerClear = () => {
    const fresh = createFreshCareerAssessmentState("landing");
    setLocalCareerState(fresh);
    onClearCareerData?.();
  };
  const handleOpenCareerDiscoveryTab = () => {
    const { nextActiveState, archivedReportEntry } =
      resetCareerStateForTabEntry(effectiveCareerState);
    if (archivedReportEntry) {
      onArchiveCompletedReport?.(archivedReportEntry.report, {
        attemptId: archivedReportEntry.attemptId,
        accessToken: archivedReportEntry.accessToken,
      });
    }
    setLocalCareerState(nextActiveState);
    onUpdateCareerState?.(nextActiveState);
    setViewMode("career-discovery");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [previewTab, setPreviewTab] = useState<"concept" | "practice" | "doubt">(
    "concept"
  );

  // 3-step short onboarding state
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [classLevel, setClassLevel] = useState<ClassLevel>("12");
  const [targetExam, setTargetExam] = useState<TargetExam>("JEE Main");
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectId[]>([
    "physics",
    "chemistry",
    "mathematics",
  ]);
  const [immediateGoal, setImmediateGoal] = useState<ImmediateGoal>("balanced");
  const [studentName, setStudentName] = useState<string>("");

  const handleSelectExam = (exam: TargetExam) => {
    setTargetExam(exam);
    if (exam === "NEET UG") {
      setSelectedSubjects(["physics", "chemistry", "biology"]);
    } else {
      setSelectedSubjects(["physics", "chemistry", "mathematics"]);
    }
  };

  const handleToggleSubject = (subjId: SubjectId) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjId)) {
        if (prev.length === 1) return prev; // Keep at least one subject selected
        return prev.filter((id) => id !== subjId);
      }
      return [...prev, subjId];
    });
  };

  const handleCompleteFlow = () => {
    const styleMap: Record<
      ImmediateGoal,
      "concept-first" | "practice-first" | "balanced"
    > = {
      concepts: "concept-first",
      practice: "practice-first",
      revision: "balanced",
      balanced: "balanced",
    };

    const profile: StudentProfile = {
      id: `student-${Date.now()}`,
      name: studentName.trim() || "Student",
      email: "local-profile@vidyakshara.local",
      classLevel,
      targetExam,
      schoolOrCity: `Class ${classLevel} · ${targetExam}`,
      isDemoAccount: false,
      onboardingCompleted: true,
      preferences: {
        dailyStudyMinutes: 90,
        preferredSessionStyle: styleMap[immediateGoal],
        immediateGoal,
        focusSubjectIds: selectedSubjects,
        highContrastReading: false,
        fontSizeScale: "normal",
      },
      lastActiveRoute: "home",
    };

    onCompleteOnboarding(profile);
  };

  const scrollToSection = (id: string) => {
    setViewMode("discover");
    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const availableSubjectsForExam = SUBJECTS.filter((s) =>
    s.applicableExams.includes(targetExam)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#14241B] overflow-x-hidden">
      <a
        href="#landing-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#164A31] focus:text-white focus:rounded-lg focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="print:hidden w-full border-b border-[#E2E5DC] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setViewMode("discover");
            }}
            className="text-xl font-bold tracking-tight text-[#164A31] whitespace-nowrap shrink-0"
          >
            Vidyakshara
          </a>

          {/* Zone 2: Concise Nav Links */}
          <nav
            aria-label="Landing page navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#48564D]"
          >
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("how-it-works");
              }}
              className="hover:text-[#14241B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#subjects"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("subjects");
              }}
              className="hover:text-[#14241B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Subjects
            </a>
            <button
              type="button"
              onClick={handleOpenCareerDiscoveryTab}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === "career-discovery"
                  ? "text-[#164A31] font-semibold underline decoration-2 underline-offset-8"
                  : "hover:text-[#14241B] hover:underline underline-offset-4"
              }`}
            >
              Career Discovery
            </button>
            <button
              type="button"
              onClick={onEnterDemoMode}
              className="hover:text-[#14241B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sample Workspace
            </button>
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="flex items-center shrink-0">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setOnboardingStep(1);
                setViewMode("onboarding");
              }}
            >
              Start learning
            </Button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          PUBLIC LANDING PAGE
         ===================================================================== */}
      {viewMode === "discover" && (
        <main id="landing-main" className="flex-1">
          {/* HERO SECTION */}
          <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Left 7 Cols: Headline, Supporting Copy & CTAs */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <MetaLine
                    items={[
                      "Classes 11 & 12",
                      "JEE Main",
                      "JEE Advanced",
                      "NEET UG",
                    ]}
                  />
                  <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#14241B] leading-[1.15]">
                    Understand more. Practise smarter. Walk into your exam with confidence.
                  </h1>
                  <p className="text-base sm:text-lg text-[#48564D] leading-relaxed max-w-2xl">
                    Vidyakshara is your personal learning companion for Class 11 and 12 science. Understand difficult concepts through interactive visual diagrams, practise JEE and NEET questions with option-by-option mistake explanations, resolve doubts step by step, and improve steadily through targeted revision.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3.5">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        setOnboardingStep(1);
                        setViewMode("onboarding");
                      }}
                    >
                      Start learning
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      onClick={handleOpenCareerDiscoveryTab}
                    >
                      <Compass className="w-4 h-4" />
                      Career Discovery Test (Free)
                    </Button>
                  </div>

                  {/* Honest Development / Sample Mode Entry Path */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-[#48564D]">
                    <span>Want to inspect a populated study workspace first?</span>
                    <button
                      type="button"
                      onClick={onEnterDemoMode}
                      className="font-semibold text-[#164A31] hover:underline cursor-pointer"
                    >
                      Open Sample Student Mode (Aarav, Class 12 JEE) →
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Interactive Product-Focused Visual Preview */}
              <div className="lg:col-span-5 bg-white border border-[#E2E5DC] rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E5DC] pb-4">
                  <div>
                    <span className="text-xs font-semibold text-[#164A31]">
                      Interactive Product Preview
                    </span>
                    <h2 className="text-sm font-semibold text-[#14241B]">
                      See how you study inside Vidyakshara
                    </h2>
                  </div>
                  <SegmentedControl
                    ariaLabel="Preview Mode"
                    value={previewTab}
                    onChange={setPreviewTab}
                    options={[
                      { id: "concept", label: "1. Concept" },
                      { id: "practice", label: "2. Practice" },
                      { id: "doubt", label: "3. Tutor" },
                    ]}
                  />
                </div>

                {previewTab === "concept" && (
                  <div className="space-y-4">
                    <MetaLine
                      items={[
                        "Physics · Class 12",
                        "Gauss's Law & Symmetric Flux",
                      ]}
                    />
                    <SubjectIllustration
                      subjectId="physics"
                      className="w-full h-36"
                    />
                    <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-2">
                      <div className="text-xs font-semibold text-[#14241B]">
                        Why external charges give zero net flux
                      </div>
                      <MarkdownContent
                        content="Every electric field line from an outside charge that enters a closed surface also exits it, so inward and outward flux cancel out:"
                        className="text-xs text-[#48564D] leading-relaxed"
                      />
                      <MathRenderer
                        expression="\Phi_{\text{net}} = \oint_S \vec{E}\cdot d\vec{A} = \frac{q_{\text{enclosed}}}{\varepsilon_0}"
                        block
                        className="bg-white py-2 px-3 text-xs"
                      />
                    </div>
                  </div>
                )}

                {previewTab === "practice" && (
                  <div className="space-y-3.5">
                    <MetaLine
                      items={[
                        "JEE Main · Kinematics",
                        "Option Trap Explanation",
                      ]}
                    />
                    <MarkdownContent
                      content="A projectile is launched with kinetic energy $K$ at $60^\circ$ to the horizontal. What is its kinetic energy at the highest point?"
                      className="text-xs sm:text-sm font-medium text-[#14241B] leading-relaxed"
                    />
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-[#164A31] bg-[#EAF2EC] text-[#14241B] flex items-center justify-between gap-2">
                        <MarkdownContent
                          content="A. $\dfrac{K}{4}$ since $v_{\text{top}} = u\cos 60^\circ = \dfrac{u}{2}$"
                          inline
                        />
                        <span className="font-semibold text-[#164A31] shrink-0">
                          ✓ Correct
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-[#D97706]/50 bg-[#FFFBEB] text-[#14241B]">
                        <div className="flex items-center justify-between font-medium">
                          <MarkdownContent content="C. $\dfrac{K}{2}$" inline />
                          <span className="text-[#B45309]">Common Trap</span>
                        </div>
                        <div className="text-[11px] text-[#48564D] mt-1">
                          <MarkdownContent
                            content="Trap: $\cos 60^\circ = \frac{1}{2}$, but kinetic energy depends on speed squared: $K_{\text{top}} = K\cos^2 60^\circ = \left(\frac{1}{2}\right)^2 K = \frac{K}{4}$."
                            inline
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "doubt" && (
                  <div className="space-y-3.5">
                    <MetaLine
                      items={[
                        "NEET UG · Human Physiology",
                        "Step-by-Step Doubt Solver",
                      ]}
                    />
                    <div className="p-3 rounded-lg bg-[#164A31] text-white text-xs">
                      &ldquo;Why does the oxygen dissociation curve shift right during exercise?&rdquo;
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#14241B] space-y-1.5 leading-relaxed">
                      <div className="font-semibold text-[#164A31]">
                        Vidyakshara Tutor:
                      </div>
                      <MarkdownContent
                        content={`1. Active muscles release more $\\text{CO}_2$, $\\text{H}^+$ ions (lower $\\text{pH}$), and metabolic heat.\n\n2. By the **Bohr effect**, $\\text{H}^+$ binds to haemoglobin ($\\text{Hb} + \\text{O}_2 \\rightleftharpoons \\text{HbO}_2$) and raises $P_{50}$, shifting the curve right so $\\text{O}_2$ unloads faster to working cells.`}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[#E2E5DC] flex items-center justify-between text-xs text-[#6E7B72]">
                  <span>Try all interactive tools inside</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingStep(1);
                      setViewMode("onboarding");
                    }}
                    className="font-semibold text-[#164A31] hover:underline cursor-pointer"
                  >
                    Personalise your plan →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS: 4-STEP STUDENT LEARNING JOURNEY */}
          <section
            id="how-it-works"
            className="border-t border-[#E2E5DC] bg-white py-14"
          >
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
              <div className="max-w-2xl space-y-2">
                <MetaLine items={["Your Daily Learning Loop"]} />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
                  A simple four-step habit that builds exam confidence
                </h2>
                <p className="text-sm sm:text-base text-[#48564D] leading-relaxed">
                  Instead of overwhelming you with hundreds of random videos or question dumps, Vidyakshara guides you through one clear learning loop at a time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#164A31]">
                      STEP 01
                    </span>
                    <Compass className="w-4 h-4 text-[#164A31]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#14241B]">
                    Pick your class &amp; exam
                  </h3>
                  <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                    Select Class 11 or 12 and JEE Main, JEE Advanced, or NEET UG. Your home page filters out irrelevant chapters automatically.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#164A31]">
                      STEP 02
                    </span>
                    <Layers className="w-4 h-4 text-[#164A31]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#14241B]">
                    Understand the concept visually
                  </h3>
                  <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                    Read concise NCERT-aligned notes, test formulas on interactive diagrams, and follow worked examples line by line.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#164A31]">
                      STEP 03
                    </span>
                    <Target className="w-4 h-4 text-[#164A31]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#14241B]">
                    Practise &amp; spot exam traps
                  </h3>
                  <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                    Solve exam-style MCQs and see why wrong options are tempting traps, or ask the AI Tutor to explain any step you missed.
                  </p>
                </div>

                <div className="p-6 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-[#164A31]">
                      STEP 04
                    </span>
                    <RotateCcw className="w-4 h-4 text-[#164A31]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#14241B]">
                    Revise mistakes before they stick
                  </h3>
                  <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                    Every missed or bookmarked question is saved to your Revision list so your next study session targets your exact weak areas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SUBJECT & EXAM PREPARATION HIGHLIGHTS */}
          <section
            id="subjects"
            className="border-t border-[#E2E5DC] bg-[#FAF8F3] py-14"
          >
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <MetaLine items={["Subject & Exam Highlights"]} />
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
                    Built for the subjects that decide your paper
                  </h2>
                  <p className="text-sm text-[#48564D]">
                    Each subject combines clear theory, interactive visual labs, worked examples, and chapter-wise questions.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setOnboardingStep(1);
                    setViewMode("onboarding");
                  }}
                >
                  Choose Your Subjects
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SUBJECTS.map((subj) => (
                  <div
                    key={subj.id}
                    className="bg-white border border-[#E2E5DC] rounded-xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center"
                  >
                    <div className="sm:col-span-5">
                      <SubjectIllustration
                        subjectId={subj.id}
                        className="w-full h-32"
                      />
                    </div>
                    <div className="sm:col-span-7 space-y-2.5">
                      <MetaLine
                        items={[
                          subj.shortCode,
                          subj.applicableExams.join(" · "),
                        ]}
                      />
                      <h3 className="text-lg font-semibold text-[#14241B]">
                        {subj.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                        {subj.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TRUSTWORTHY FEATURE DESCRIPTIONS (Student Benefits) */}
          <section
            id="features"
            className="border-t border-[#E2E5DC] bg-white py-14"
          >
            <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
              <div className="max-w-2xl space-y-2">
                <MetaLine items={["Designed Around How Students Actually Learn"]} />
                <h2 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
                  Everything you need for focused self-study, without the noise
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-3 border-t-2 border-[#164A31] pt-5">
                  <h3 className="text-lg font-semibold text-[#14241B]">
                    Explanations that show why wrong options fail
                  </h3>
                  <p className="text-sm text-[#48564D] leading-relaxed">
                    In competitive exams, options are designed around common sign errors, missing factors of 2, or boundary mistakes. Every question in Vidyakshara explains both the correct derivation and the specific trap behind wrong choices.
                  </p>
                </div>

                <div className="space-y-3 border-t-2 border-[#164A31] pt-5">
                  <h3 className="text-lg font-semibold text-[#14241B]">
                    Timed +4 / −1 checkpoints when you are ready
                  </h3>
                  <p className="text-sm text-[#48564D] leading-relaxed">
                    Practise under a realistic countdown clock with a question navigator palette, mark-for-review flags, and an instant post-test solution breakdown so you learn when to attempt and when to skip.
                  </p>
                </div>

                <div className="space-y-3 border-t-2 border-[#164A31] pt-5">
                  <h3 className="text-lg font-semibold text-[#14241B]">
                    Honest progress based on your own work
                  </h3>
                  <p className="text-sm text-[#48564D] leading-relaxed">
                    No distracting leaderboards or artificial points. Track which chapters you have completed, your real question accuracy by subject, and the exact mistakes waiting in your revision list.
                  </p>
                </div>
              </div>

              {/* Bottom CTA Banner */}
              <div className="p-6 sm:p-8 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-[#14241B]">
                    Set up your personal study plan in under 30 seconds
                  </h3>
                  <p className="text-xs sm:text-sm text-[#48564D]">
                    Select your class, target exam, and priority subjects to open your personalised home page.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={() => {
                      setOnboardingStep(1);
                      setViewMode("onboarding");
                    }}
                  >
                    Start learning
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={onEnterDemoMode}
                  >
                    Open Sample Mode
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* =====================================================================
          SHORT, FRIENDLY 3-STEP STUDENT ONBOARDING
         ===================================================================== */}
      {viewMode === "onboarding" && (
        <main
          id="landing-main"
          className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10"
        >
          <div className="w-full max-w-2xl bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-8">
            {/* Top Progress Indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#164A31]">
                  Personalise Your Study Companion
                </span>
                <span className="font-mono tabular-nums text-[#48564D]">
                  Step {onboardingStep} of 3
                </span>
              </div>
              <ProgressBar
                value={onboardingStep}
                max={3}
                tone="forest"
              />
            </div>

            {/* STEP 1: CLASS 11 OR CLASS 12 */}
            {onboardingStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-[#14241B]">
                    Which class are you studying in?
                  </h1>
                  <p className="text-sm text-[#48564D]">
                    We will prioritise chapters and worked examples that match your current academic year.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      {
                        cls: "11" as ClassLevel,
                        title: "Class 11",
                        subtitle: "Core Mechanics, Chemical Equilibrium, Calculus Basics & Human Physiology",
                        detail: "Build rock-solid NCERT & competitive foundations from day one.",
                      },
                      {
                        cls: "12" as ClassLevel,
                        title: "Class 12",
                        subtitle: "Electrostatics, Electrochemistry, Definite Integrals & Full Revision",
                        detail: "Balance Class 12 topics with high-weightage Class 11 revision.",
                      },
                    ]
                  ).map((item) => {
                    const selected = classLevel === item.cls;
                    return (
                      <button
                        key={item.cls}
                        type="button"
                        onClick={() => setClassLevel(item.cls)}
                        className={`p-5 rounded-xl border text-left transition-colors flex flex-col justify-between gap-4 cursor-pointer min-h-[150px] ${
                          selected
                            ? "border-[#164A31] bg-[#EAF2EC] text-[#14241B]"
                            : "border-[#E2E5DC] bg-[#FAF8F3] text-[#14241B] hover:bg-[#F3F1EA]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              {item.title}
                            </span>
                            {selected && (
                              <CheckCircle2 className="w-5 h-5 text-[#164A31]" />
                            )}
                          </div>
                          <p className="text-xs font-medium text-[#164A31]">
                            {item.subtitle}
                          </p>
                        </div>
                        <p className="text-xs text-[#48564D] leading-relaxed">
                          {item.detail}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#E2E5DC] flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setViewMode("discover")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Landing Page
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={() => setOnboardingStep(2)}
                  >
                    Next: Target Exam
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: TARGET EXAM */}
            {onboardingStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-[#14241B]">
                    Which exam are you preparing for?
                  </h1>
                  <p className="text-sm text-[#48564D]">
                    Select your target entrance exam so we can tailor your subjects, question difficulty, and mock tests.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      {
                        exam: "JEE Main" as TargetExam,
                        subjects: "Physics · Chemistry · Mathematics",
                        desc: "Focus on high-frequency NCERT + objective speed and accuracy.",
                      },
                      {
                        exam: "JEE Main + Advanced" as TargetExam,
                        subjects: "Physics · Chemistry · Mathematics",
                        desc: "Combined preparation covering both JEE Main speed and multi-concept Advanced depth.",
                      },
                      {
                        exam: "JEE Advanced" as TargetExam,
                        subjects: "Physics · Chemistry · Mathematics",
                        desc: "Deep conceptual derivations, symmetry shortcuts, and challenging numericals.",
                      },
                      {
                        exam: "NEET UG" as TargetExam,
                        subjects: "Physics · Chemistry · Biology",
                        desc: "Line-by-line NCERT Biology mastery paired with fast Physics and Chemistry problem-solving.",
                      },
                    ]
                  ).map((item) => {
                    const selected = targetExam === item.exam;
                    return (
                      <button
                        key={item.exam}
                        type="button"
                        onClick={() => handleSelectExam(item.exam)}
                        className={`p-5 rounded-xl border text-left transition-colors flex flex-col justify-between gap-3 cursor-pointer ${
                          selected
                            ? "border-[#164A31] bg-[#EAF2EC] text-[#14241B]"
                            : "border-[#E2E5DC] bg-[#FAF8F3] text-[#14241B] hover:bg-[#F3F1EA]"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold">
                              {item.exam}
                            </span>
                            {selected && (
                              <CheckCircle2 className="w-5 h-5 text-[#164A31]" />
                            )}
                          </div>
                          <div className="text-xs font-medium text-[#164A31]">
                            {item.subjects}
                          </div>
                        </div>
                        <p className="text-xs text-[#48564D] leading-relaxed">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#E2E5DC] flex items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOnboardingStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous Step
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={() => setOnboardingStep(3)}
                  >
                    Next: Study Focus
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: PREFERRED SUBJECTS & IMMEDIATE STUDY GOAL */}
            {onboardingStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-[#14241B]">
                    What would you like to focus on first?
                  </h1>
                  <p className="text-sm text-[#48564D]">
                    Choose your priority subjects and how you want your first study session to begin.
                  </p>
                </div>

                {/* Subject Selector Pills/Cards */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-[#14241B]">
                    1. Priority subjects for your daily plan (tap to toggle)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {availableSubjectsForExam.map((subj) => {
                      const active = selectedSubjects.includes(subj.id);
                      return (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => handleToggleSubject(subj.id)}
                          className={`p-3.5 rounded-xl border text-left transition-colors flex items-center justify-between cursor-pointer ${
                            active
                              ? "border-[#164A31] bg-[#EAF2EC] text-[#14241B]"
                              : "border-[#E2E5DC] bg-[#FAF8F3] text-[#48564D]"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-semibold">
                              {subj.name}
                            </div>
                            <div className="text-[11px] text-[#6E7B72]">
                              {subj.chapters.length} core chapters
                            </div>
                          </div>
                          {active && (
                            <CheckCircle2 className="w-4 h-4 text-[#164A31] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Immediate Study Goal */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-[#14241B]">
                    2. Your immediate study goal today
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: "balanced" as ImmediateGoal,
                        title: "Follow a balanced daily study plan",
                        desc: "1 interactive concept + 4 exam-style practice questions",
                      },
                      {
                        id: "concepts" as ImmediateGoal,
                        title: "Understand difficult concepts first",
                        desc: "Start with visual diagrams, formulas, and worked examples",
                      },
                      {
                        id: "practice" as ImmediateGoal,
                        title: "Practise exam-style questions",
                        desc: "Jump directly into chapter MCQs with trap explanations",
                      },
                      {
                        id: "revision" as ImmediateGoal,
                        title: "Identify & fix weak areas",
                        desc: "Take a diagnostic practice set and review mistakes",
                      },
                    ].map((g) => {
                      const active = immediateGoal === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setImmediateGoal(g.id)}
                          className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                            active
                              ? "border-[#164A31] bg-[#EAF2EC] text-[#14241B]"
                              : "border-[#E2E5DC] bg-[#FAF8F3] text-[#14241B] hover:bg-[#F3F1EA]"
                          }`}
                        >
                          <div className="text-sm font-semibold">{g.title}</div>
                          <div className="text-xs text-[#48564D] mt-1">
                            {g.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional First Name for Warm Greeting */}
                <div>
                  <label
                    htmlFor="onboarding-first-name"
                    className="block text-xs font-semibold text-[#14241B] mb-1.5"
                  >
                    3. What should we call you on your home page? (Optional)
                  </label>
                  <input
                    id="onboarding-first-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g., Ananya"
                    className="w-full px-4 py-2.5 text-sm bg-[#FAF8F3] border border-[#E2E5DC] rounded-lg text-[#14241B] placeholder:text-[#6E7B72]"
                  />
                </div>

                <div className="pt-4 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOnboardingStep(2)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous Step
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleCompleteFlow}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Open My Home Page
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* =====================================================================
          ANONYMOUS / PUBLIC CAREER DISCOVERY ASSESSMENT FLOW
         ===================================================================== */}
      {viewMode === "career-discovery" && (
        <main
          id="landing-main"
          className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8"
        >
          <CareerDiscoveryView
            careerState={effectiveCareerState}
            isAnonymousSession={true}
            onUpdateCareerState={handleCareerStateChange}
            onArchiveCompletedReport={onArchiveCompletedReport}
            onClearCareerData={handleCareerClear}
            onBackToStudyWorkspace={() => setViewMode("discover")}
          />
        </main>
      )}

      {/* CLEAR FOOTER WITH RELEVANT WORKING LINKS */}
      <footer className="print:hidden border-t border-[#E2E5DC] bg-white py-8 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-[#6E7B72]">
          <div className="space-y-1">
            <div className="font-bold text-sm text-[#164A31]">Vidyakshara</div>
            <p>
              Personal learning &amp; exam preparation companion for Class 11 &amp; 12 (JEE Main, JEE Advanced &amp; NEET UG).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#48564D]">
            <button
              type="button"
              onClick={handleOpenCareerDiscoveryTab}
              className="text-[#164A31] font-semibold hover:underline cursor-pointer"
            >
              Career Discovery Test (Free)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="hover:text-[#14241B] hover:underline cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("subjects")}
              className="hover:text-[#14241B] hover:underline cursor-pointer"
            >
              Subjects
            </button>
            <button
              type="button"
              onClick={() => {
                setOnboardingStep(1);
                setViewMode("onboarding");
              }}
              className="hover:text-[#14241B] hover:underline cursor-pointer"
            >
              Personalise Your Plan
            </button>
            <button
              type="button"
              onClick={onEnterDemoMode}
              className="text-[#164A31] font-semibold hover:underline cursor-pointer"
            >
              Sample Student Workspace
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
