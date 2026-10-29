import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  BookOpen,
  BookmarkPlus,
  Check,
  CheckCircle2,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  ListOrdered,
  Paperclip,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  AppRoute,
  DoubtMessage,
  StudentLearningState,
  SubjectId,
  TutorAttachment,
  TutorExplanationMode,
} from "../../types/domain";
import { SUBJECTS, TOPICS } from "../../data/curriculum";
import { Button, MetaLine, SegmentedControl } from "../ui/Primitives";
import {
  MarkdownContent,
  MathRenderer,
  QuestionDiagramSvg,
} from "../ui/MathAndDiagrams";

interface DoubtSolverViewProps {
  state: StudentLearningState;
  initialSubjectId?: SubjectId;
  initialTopicId?: string;
  initialPrefill?: string;
  onAddDoubtMessages: (userMsg: DoubtMessage, tutorMsg: DoubtMessage) => void;
  onClearDoubtHistory: () => void;
  onSaveExplanationToNotes: (
    title: string,
    subjectId: SubjectId,
    content: string
  ) => void;
  onNavigate?: (
    route: AppRoute,
    options?: {
      subjectId?: SubjectId;
      chapterId?: string;
      topicId?: string;
      prefillDoubt?: string;
    }
  ) => void;
}

interface PendingAttachment extends TutorAttachment {
  base64Data?: string;
  textContent?: string;
}

const EXPLANATION_MODES: {
  id: TutorExplanationMode;
  label: string;
  shortHint: string;
}[] = [
  {
    id: "step-by-step",
    label: "Show step by step",
    shortHint: "Full reasoning, formulas, final answer & common traps",
  },
  {
    id: "simple",
    label: "Explain simply",
    shortHint: "Plain language & everyday intuition first",
  },
  {
    id: "example",
    label: "Give an example",
    shortHint: "Concrete worked example or analogy",
  },
  {
    id: "test-me",
    label: "Test my understanding",
    shortHint: "Includes a practice question to check your grasp",
  },
];

const STARTER_DOUBTS: Record<SubjectId, string[]> = {
  physics: [
    "Why do charges outside a Gaussian surface contribute zero net electric flux?",
    "At what launch angle does projectile horizontal range equal maximum height?",
    "How do I apply conservation of mechanical energy when a block slides down a smooth wedge?",
  ],
  chemistry: [
    "Why does adding an inert gas at constant volume not shift chemical equilibrium?",
    "How do I determine hybridisation and lone pair geometry using VSEPR?",
    "How does diluting the anode ion concentration affect cell EMF in the Nernst equation?",
  ],
  mathematics: [
    "How and when should I apply King's Property in definite integrals?",
    "How do I check if a function is odd or even on symmetric integral limits [−a, a]?",
    "Why do we check Left Hand Limit and Right Hand Limit separately for greatest integer functions?",
  ],
  biology: [
    "Why does the Oxygen-Haemoglobin dissociation curve shift to the right in exercising muscles?",
    "How much oxygen is actually delivered per 100 mL of blood under resting conditions?",
    "What is the difference between competitive and non-competitive enzyme inhibition?",
  ],
};

export function DoubtSolverView({
  state,
  initialSubjectId,
  initialTopicId,
  initialPrefill,
  onAddDoubtMessages,
  onClearDoubtHistory,
  onSaveExplanationToNotes,
  onNavigate,
}: DoubtSolverViewProps) {
  const profile = state.profile!;
  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(profile.targetExam)
  );

  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(
    initialSubjectId &&
      applicableSubjects.some((s) => s.id === initialSubjectId)
      ? initialSubjectId
      : applicableSubjects[0]?.id || "physics"
  );

  const subjectTopics = TOPICS.filter(
    (t) =>
      t.subjectId === selectedSubject &&
      t.applicableExams.includes(profile.targetExam)
  );

  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => {
    if (initialTopicId && TOPICS.some((t) => t.id === initialTopicId)) {
      return initialTopicId;
    }
    if (
      profile.lastActiveTopicId &&
      TOPICS.some(
        (t) =>
          t.id === profile.lastActiveTopicId && t.subjectId === selectedSubject
      )
    ) {
      return profile.lastActiveTopicId;
    }
    return subjectTopics[0]?.id || "none";
  });

  const [explanationMode, setExplanationMode] =
    useState<TutorExplanationMode>("step-by-step");
  const [questionInput, setQuestionInput] = useState<string>(
    initialPrefill || ""
  );
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedMsgIds, setSavedMsgIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<{
    text: string;
    mode: TutorExplanationMode;
    attachment: PendingAttachment | null;
  } | null>(null);

  // Track interactive practice question answers inside tutor messages
  const [practiceSelections, setPracticeSelections] = useState<
    Record<string, string>
  >({});
  const [revealedPracticeSolutions, setRevealedPracticeSolutions] = useState<
    Record<string, boolean>
  >({});

  // Check whether live AI credentials are configured on the server
  const [serviceStatus, setServiceStatus] = useState<
    "checking" | "ready" | "needs-config"
  >("checking");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formulaCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/tutor/status")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setServiceStatus(data?.configured ? "ready" : "needs-config");
      })
      .catch(() => {
        if (!active) return;
        setServiceStatus("needs-config");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      initialSubjectId &&
      applicableSubjects.some((s) => s.id === initialSubjectId)
    ) {
      setSelectedSubject(initialSubjectId);
    }
    if (initialTopicId && TOPICS.some((t) => t.id === initialTopicId)) {
      setSelectedTopicId(initialTopicId);
    }
    if (initialPrefill) {
      setQuestionInput(initialPrefill);
    }
  }, [initialSubjectId, initialTopicId, initialPrefill]);

  // Keep selectedTopicId synced when subject changes
  const handleSubjectChange = (newSubject: SubjectId) => {
    setSelectedSubject(newSubject);
    const matchingTopics = TOPICS.filter(
      (t) =>
        t.subjectId === newSubject &&
        t.applicableExams.includes(profile.targetExam)
    );
    setSelectedTopicId(matchingTopics[0]?.id || "none");
  };

  const activeTopic = TOPICS.find((t) => t.id === selectedTopicId) || null;
  const activeSubjectName =
    SUBJECTS.find((s) => s.id === selectedSubject)?.name || "Science";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage(
        "Please choose an image or document smaller than 4 MB so it can be analysed quickly."
      );
      e.target.value = "";
      return;
    }

    setErrorMessage(null);
    const sizeKB = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel =
      sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    const isTextFile =
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md");

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent =
          typeof reader.result === "string" ? reader.result : "";
        setPendingAttachment({
          name: file.name,
          mimeType: file.type || "text/plain",
          sizeLabel,
          textContent,
        });
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        const base64Data = dataUrl.includes(",")
          ? dataUrl.split(",")[1]
          : "";
        const isImage = file.type.startsWith("image/");
        setPendingAttachment({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeLabel,
          base64Data,
          previewDataUrl: isImage ? dataUrl : undefined,
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  const handleAskDoubt = async (
    overrideText?: string,
    overrideMode?: TutorExplanationMode,
    overrideAttachment?: PendingAttachment | null
  ) => {
    const qText = (overrideText ?? questionInput).trim();
    const modeToUse = overrideMode ?? explanationMode;
    const attachmentToUse =
      overrideAttachment !== undefined ? overrideAttachment : pendingAttachment;

    if ((!qText && !attachmentToUse) || isSubmitting) return;

    setErrorMessage(null);
    setLastFailedPrompt(null);
    setIsSubmitting(true);

    if (overrideText === undefined) {
      setQuestionInput("");
      setPendingAttachment(null);
    }

    const displayQuestionText =
      qText ||
      `Please solve and explain the question in the attached file (${attachmentToUse?.name}).`;

    const userMessage: DoubtMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: displayQuestionText,
      timestamp: "Just now",
      subjectId: selectedSubject,
      topicId: activeTopic?.id,
      relatedTopicTitle: activeTopic?.title,
      explanationMode: modeToUse,
      attachment: attachmentToUse
        ? {
            name: attachmentToUse.name,
            mimeType: attachmentToUse.mimeType,
            sizeLabel: attachmentToUse.sizeLabel,
            previewDataUrl: attachmentToUse.previewDataUrl,
          }
        : undefined,
      sourceType: "live-ai",
    };

    try {
      const res = await fetch("/api/tutor/doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: displayQuestionText,
          explanationMode: modeToUse,
          subject: activeSubjectName,
          studentClass: profile.classLevel,
          targetExam: profile.targetExam,
          topicContext: activeTopic
            ? {
                title: activeTopic.title,
                summary: activeTopic.summary,
                formulas: activeTopic.definitionsAndFormulas
                  .map((f) => (f.formula ? `${f.term}: ${f.formula}` : f.term))
                  .slice(0, 4),
              }
            : null,
          attachment: attachmentToUse
            ? {
                name: attachmentToUse.name,
                mimeType: attachmentToUse.mimeType,
                base64Data: attachmentToUse.base64Data,
                textContent: attachmentToUse.textContent,
              }
            : null,
          history: state.doubtHistory.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.code === "CREDENTIALS_REQUIRED") {
          setServiceStatus("needs-config");
        }
        setLastFailedPrompt({
          text: displayQuestionText,
          mode: modeToUse,
          attachment: attachmentToUse,
        });
        setErrorMessage(
          data?.error ||
            "The AI tutor service did not respond. No fake answer was shown — you can retry your question below."
        );
        return;
      }

      const tutorMessage: DoubtMessage = {
        id: `t-${Date.now() + 1}`,
        role: "tutor",
        text: data.reply,
        timestamp: "Just now",
        subjectId: selectedSubject,
        topicId: activeTopic?.id,
        relatedTopicTitle: activeTopic?.title,
        explanationMode: modeToUse,
        structured: data.structured,
        sourceType: "live-ai",
      };

      onAddDoubtMessages(userMessage, tutorMessage);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      setLastFailedPrompt({
        text: displayQuestionText,
        mode: modeToUse,
        attachment: attachmentToUse,
      });
      setErrorMessage(
        "We could not reach the AI tutor right now. No fake response was generated — please check your connection or click Retry below."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveToNotes = (msg: DoubtMessage) => {
    const subj = msg.subjectId || selectedSubject;
    const subjName = SUBJECTS.find((s) => s.id === subj)?.name || "Science";
    const title = msg.relatedTopicTitle
      ? `AI Tutor Breakdown — ${msg.relatedTopicTitle}`
      : `AI Tutor Breakdown — ${subjName}`;
    onSaveExplanationToNotes(title, subj, msg.text);
    setSavedMsgIds((prev) => [...prev, msg.id]);
  };

  const scrollToFormulaReference = () => {
    formulaCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Subject Context Bar */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <MetaLine
              items={[
                "Vidyakshara AI Study Companion",
                `Class ${profile.classLevel}`,
                profile.targetExam,
                serviceStatus === "ready"
                  ? "Live Tutor Ready"
                  : serviceStatus === "needs-config"
                  ? "Verified Topic Reference Active"
                  : "Connecting Tutor...",
              ]}
            />
            <h1 className="text-2xl font-bold text-[#14241B]">
              Ask a concept doubt, step-by-step problem, or upload a question
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              ariaLabel="Select Subject for AI Tutor"
              value={selectedSubject}
              onChange={handleSubjectChange}
              options={applicableSubjects.map((s) => ({
                id: s.id,
                label: s.name,
              }))}
            />
            {state.doubtHistory.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearDoubtHistory}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset Thread
              </Button>
            )}
          </div>
        </div>

        {/* Active Topic Context & Educational Safeguard Transparency Bar */}
        <div className="pt-3 border-t border-[#E2E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#48564D]">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="tutor-topic-context-select"
              className="font-semibold text-[#14241B]"
            >
              Current Topic Context:
            </label>
            <select
              id="tutor-topic-context-select"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs font-medium text-[#14241B]"
            >
              <option value="none">
                General {activeSubjectName} Doubt (No specific topic attached)
              </option>
              {subjectTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} (Class {t.classLevel})
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-[#6E7B72]">
            Shared with tutor: Class {profile.classLevel} · {profile.targetExam}{" "}
            · {activeSubjectName}
            {activeTopic ? ` · ${activeTopic.title}` : ""}. Private notes or
            files are only included when you attach them.
          </p>
        </div>

        {serviceStatus === "needs-config" && (
          <div className="p-3.5 rounded-lg bg-[#FDF6E7] border border-[#F2D08B] text-xs text-[#8F4B00] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong>Live Tutor Notice:</strong> Live AI replies are currently
              offline. Vidyakshara never shows fake AI answers when the live
              tutor is offline — you can still review the verified topic
              formulas and worked breakdown below.
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4 Columns: Starter Doubts & Relevant Formula / Concept Reviewer */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Relevant Formula & Concept Card (Supports "Review the relevant formula or concept") */}
          <div
            ref={formulaCardRef}
            className="bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-[#164A31]">
                  Verified Topic Reference
                </span>
                <h2 className="text-base font-semibold text-[#14241B] mt-0.5">
                  {activeTopic
                    ? activeTopic.title
                    : `${activeSubjectName} Core Formulas`}
                </h2>
              </div>
              {activeTopic && onNavigate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onNavigate("learn", {
                      subjectId: activeTopic.subjectId,
                      topicId: activeTopic.id,
                    })
                  }
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Lesson
                </Button>
              )}
            </div>

            {activeTopic ? (
              <div className="space-y-3">
                <p className="text-xs text-[#48564D] leading-relaxed">
                  {activeTopic.summary}
                </p>
                <div className="divide-y divide-[#E2E5DC] rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] overflow-hidden">
                  {activeTopic.definitionsAndFormulas.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 space-y-1"
                    >
                      <div className="text-xs font-semibold text-[#14241B]">
                        <MarkdownContent content={item.term} inline />
                      </div>
                      {item.formula && (
                        <MathRenderer
                          expression={item.formula}
                          block
                          variant="plain"
                          className="text-xs"
                        />
                      )}
                      <div className="text-[11px] text-[#48564D] leading-relaxed">
                        <MarkdownContent content={item.meaning} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleAskDoubt(
                      `Can you explain the core concept and most common exam trap in "${activeTopic.title}"?`,
                      "step-by-step"
                    )
                  }
                >
                  Ask Tutor about {activeTopic.title}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-[#48564D] leading-relaxed">
                Select a topic in the bar above to pin its verified formulas and
                definitions right alongside your tutor conversation.
              </p>
            )}
          </div>

          {/* Starter Doubts for Selected Subject */}
          <div className="bg-white border border-[#E2E5DC] rounded-xl p-5 space-y-4">
            <div>
              <span className="text-xs font-medium text-[#164A31]">
                Starter {activeSubjectName} Doubts
              </span>
              <h2 className="text-base font-semibold text-[#14241B] mt-0.5">
                Tap a question to ask in {EXPLANATION_MODES.find((m) => m.id === explanationMode)?.label.toLowerCase()} mode
              </h2>
            </div>

            <div className="space-y-2.5">
              {(STARTER_DOUBTS[selectedSubject] || STARTER_DOUBTS.physics).map(
                (promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleAskDoubt(promptText, explanationMode)}
                    className="w-full text-left p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] hover:border-[#164A31] hover:bg-[#EAF2EC] text-xs text-[#14241B] leading-relaxed transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {promptText}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="bg-[#EBF3F9] border border-[#C5DDF0] rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-semibold text-[#184E77]">
              Subject-Specific Coaching
            </h3>
            <p className="text-xs text-[#14241B] leading-relaxed">
              {selectedSubject === "physics" &&
                "In Physics, the tutor focuses on physical intuition, free-body/field symmetry, SI units, and limiting-case checks."}
              {selectedSubject === "chemistry" &&
                "In Chemistry, the tutor highlights reaction mechanisms, electronic effects, equilibrium conditions, and NCERT exceptions."}
              {selectedSubject === "mathematics" &&
                "In Mathematics, the tutor explains the reason behind each algebraic or calculus step and points out domain/sign traps."}
              {selectedSubject === "biology" &&
                "In Biology, the tutor clarifies physiological processes, NCERT terminology, and cause-and-effect diagram shifts."}
            </p>
          </div>
        </aside>

        {/* Right 8 Columns: Focused Conversational Tutor Experience */}
        <section className="lg:col-span-8 bg-white border border-[#E2E5DC] rounded-xl flex flex-col overflow-hidden">
          {/* Conversation Thread */}
          <div className="p-5 sm:p-6 space-y-6 max-h-[680px] overflow-y-auto">
            {state.doubtHistory.map((msg) => {
              const isTutor = msg.role === "tutor";
              const isSaved = savedMsgIds.includes(msg.id);
              const s = msg.structured;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isTutor ? "items-start" : "items-end"
                  }`}
                >
                  <div
                    className={`w-full max-w-3xl rounded-xl p-4 sm:p-5 space-y-4 border ${
                      isTutor
                        ? "bg-[#FAF8F3] border-[#E2E5DC] text-[#14241B]"
                        : "bg-[#164A31] border-[#164A31] text-white sm:max-w-xl"
                    }`}
                  >
                    {/* Message Header Metadata (Zero-Pill Unboxed Text) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-85">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">
                          {isTutor
                            ? "Vidyakshara Tutor"
                            : profile.name.split(" ")[0]}
                        </span>
                        {msg.relatedTopicTitle && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{msg.relatedTopicTitle}</span>
                          </>
                        )}
                        {msg.explanationMode && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>
                              {EXPLANATION_MODES.find(
                                (m) => m.id === msg.explanationMode
                              )?.label || "Step by step"}
                            </span>
                          </>
                        )}
                      </div>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* User Attachment Preview if present */}
                    {msg.attachment && (
                      <div className="p-2.5 rounded-lg bg-white/10 border border-white/20 space-y-2">
                        {msg.attachment.previewDataUrl && (
                          <img
                            src={msg.attachment.previewDataUrl}
                            alt={`Attached question: ${msg.attachment.name}`}
                            className="max-h-48 w-auto rounded border border-white/20 object-contain bg-white"
                          />
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Paperclip className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-medium truncate">
                            {msg.attachment.name}
                          </span>
                          <span className="opacity-75">
                            ({msg.attachment.sizeLabel})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Structured 6-Part Tutor Explanation vs Plain Text */}
                    {isTutor && s ? (
                      <div className="space-y-4 text-sm">
                        {/* 1. The Main Idea */}
                        <div className="p-3.5 rounded-lg bg-white border border-[#E2E5DC] space-y-1">
                          <div className="text-[11px] font-semibold text-[#164A31] uppercase tracking-wider">
                            1. The Main Idea
                          </div>
                          <div className="text-sm text-[#14241B] leading-relaxed font-medium">
                            <MarkdownContent content={s.mainIdea} />
                          </div>
                        </div>

                        {/* 2. Step-by-Step Reasoning (Textbook hairline-separated steps, unboxed formulas) */}
                        {s.steps && s.steps.length > 0 && (
                          <div className="rounded-lg bg-white border border-[#E2E5DC] p-3.5 sm:p-4 space-y-2">
                            <div className="text-[11px] font-semibold text-[#48564D] uppercase tracking-wider">
                              2. Step-by-Step Reasoning
                            </div>
                            <ol className="divide-y divide-[#E2E5DC]/80">
                              {s.steps.map((step, idx) => (
                                <li
                                  key={idx}
                                  className="py-3 first:pt-1.5 last:pb-1 space-y-1.5"
                                >
                                  <div className="text-xs font-semibold text-[#14241B]">
                                    <span className="font-mono text-[#164A31] mr-1.5">
                                      Step {idx + 1}.
                                    </span>
                                    <MarkdownContent content={step.title} inline />
                                  </div>
                                  <div className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                                    <MarkdownContent content={step.explanation} />
                                  </div>
                                  {step.formula && (
                                    <MathRenderer
                                      expression={step.formula}
                                      block
                                      variant="plain"
                                      className="text-xs"
                                    />
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* 3. Formula or Diagram to Remember */}
                        {(s.formulaExpression ||
                          s.formulaOrDiagramNote ||
                          s.diagramType) && (
                          <div className="p-3.5 rounded-lg bg-[#EBF3F9] border border-[#C5DDF0] space-y-2">
                            <div className="text-[11px] font-semibold text-[#184E77] uppercase tracking-wider">
                              3. Key Formula &amp; Visual Concept
                            </div>
                            {s.formulaExpression && (
                              <MathRenderer
                                expression={s.formulaExpression}
                                block
                                variant="plain"
                              />
                            )}
                            {s.diagramType && (
                              <div className="pt-1">
                                <QuestionDiagramSvg type={s.diagramType} />
                              </div>
                            )}
                            {s.formulaOrDiagramNote && (
                              <div className="text-xs text-[#14241B] leading-relaxed">
                                <MarkdownContent content={s.formulaOrDiagramNote} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. Final Answer */}
                        {s.finalAnswer && (
                          <div className="p-3.5 rounded-lg bg-[#EAF2EC] border border-[#B8D8BE] space-y-1">
                            <div className="text-[11px] font-semibold text-[#164A31] uppercase tracking-wider">
                              4. Final Answer
                            </div>
                            <div className="text-sm font-semibold text-[#14241B] leading-relaxed overflow-x-auto max-w-full">
                              <MarkdownContent content={s.finalAnswer} />
                            </div>
                          </div>
                        )}

                        {/* 5. Common Mistake to Avoid */}
                        {s.commonMistake && (
                          <div className="p-3.5 rounded-lg bg-[#FDF6E7] border border-[#F2D08B] space-y-1">
                            <div className="text-[11px] font-semibold text-[#8F4B00] uppercase tracking-wider">
                              5. Common Exam Mistake to Avoid
                            </div>
                            <div className="text-xs sm:text-sm text-[#14241B] leading-relaxed">
                              <MarkdownContent content={s.commonMistake} />
                            </div>
                          </div>
                        )}

                        {/* 6. One Optional Practice Question */}
                        {s.practiceQuestion && (
                          <div className="p-4 rounded-lg bg-white border border-[#E2E5DC] space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-[#164A31] uppercase tracking-wider">
                                6. Check Your Understanding
                              </span>
                              <span className="text-[11px] text-[#6E7B72]">
                                Optional Practice Question
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm font-serif text-[#14241B] leading-relaxed">
                              <MarkdownContent content={s.practiceQuestion.prompt} />
                            </div>

                            {s.practiceQuestion.options &&
                              s.practiceQuestion.options.length > 0 && (
                                <div className="grid grid-cols-1 gap-2">
                                  {s.practiceQuestion.options.map(
                                    (optText, oIdx) => {
                                      const selected =
                                        practiceSelections[msg.id] === optText;
                                      const isRevealed =
                                        revealedPracticeSolutions[msg.id];
                                      const isCorrectOpt =
                                        optText.trim() ===
                                          s.practiceQuestion?.correctAnswer.trim() ||
                                        optText.startsWith(
                                          s.practiceQuestion?.correctAnswer.trim() ||
                                            "___"
                                        );

                                      return (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          onClick={() => {
                                            setPracticeSelections((prev) => ({
                                              ...prev,
                                              [msg.id]: optText,
                                            }));
                                            setRevealedPracticeSolutions(
                                              (prev) => ({
                                                ...prev,
                                                [msg.id]: true,
                                              })
                                            );
                                          }}
                                          className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                            isRevealed && isCorrectOpt
                                              ? "bg-[#EAF2EC] border-[#164A31] text-[#14241B] font-semibold"
                                              : selected
                                              ? "bg-[#FDF2F2] border-[#C81E1E] text-[#9B1C1C]"
                                              : "bg-[#FAF8F3] border-[#E2E5DC] text-[#14241B] hover:border-[#164A31]"
                                          }`}
                                        >
                                          <MarkdownContent content={optText} inline />
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedPracticeSolutions((prev) => ({
                                    ...prev,
                                    [msg.id]: !prev[msg.id],
                                  }))
                                }
                                className="text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
                              >
                                {revealedPracticeSolutions[msg.id]
                                  ? "Hide Answer & Solution"
                                  : "Check Answer & Solution"}
                              </button>
                            </div>

                            {revealedPracticeSolutions[msg.id] && (
                              <div className="p-3 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] space-y-1 text-xs">
                                <div className="font-semibold text-[#164A31] flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Correct Answer: </span>
                                  <MarkdownContent
                                    content={s.practiceQuestion.correctAnswer}
                                    inline
                                  />
                                </div>
                                <div className="text-[#48564D] leading-relaxed">
                                  <MarkdownContent
                                    content={s.practiceQuestion.hintOrSolution}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <MarkdownContent
                        content={msg.text}
                        className="text-sm leading-relaxed"
                      />
                    )}

                    {/* Follow-up Pedagogical Actions & Save to Notes on Tutor Messages */}
                    {isTutor && (
                      <div className="pt-3 border-t border-[#E2E5DC] space-y-3">
                        {/* Quick Refinement & Follow-up Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleAskDoubt(
                                "Can you explain that more simply using an everyday analogy?",
                                "simple"
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-[#164A31]" />
                            Explain simply
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleAskDoubt(
                                "Can you show me the complete step-by-step derivation or calculation for this?",
                                "step-by-step"
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <ListOrdered className="w-3.5 h-3.5 text-[#164A31]" />
                            Step-by-step solution
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleAskDoubt(
                                "Can you give me a concrete worked example with numbers for this concept?",
                                "example"
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#164A31]" />
                            Give an example
                          </button>

                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              handleAskDoubt(
                                "Give me a similar exam-style practice question to test my understanding of this concept.",
                                "test-me"
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#164A31]" />
                            Similar practice question
                          </button>
                        </div>

                        {/* Suggested Follow-up Prompts from Structured Tutor Response */}
                        {s?.suggestedFollowUps &&
                          s.suggestedFollowUps.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[11px] text-[#6E7B72] mr-1">
                                Follow-up questions:
                              </span>
                              {s.suggestedFollowUps.map((followUp, fIdx) => (
                                <button
                                  key={fIdx}
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() =>
                                    handleAskDoubt(followUp, explanationMode)
                                  }
                                  className="text-left text-[11px] text-[#164A31] hover:underline mr-3 cursor-pointer disabled:opacity-50"
                                >
                                  &ldquo;{followUp}&rdquo; →
                                </button>
                              ))}
                            </div>
                          )}

                        {/* Bottom Action Row: Review Concept & Save to Notes */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeTopic && onNavigate) {
                                onNavigate("learn", {
                                  subjectId: activeTopic.subjectId,
                                  topicId: activeTopic.id,
                                });
                              } else {
                                scrollToFormulaReference();
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#184E77] hover:underline cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Review relevant formula &amp; concept
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveToNotes(msg)}
                            disabled={isSaved}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#164A31] hover:underline disabled:opacity-60 cursor-pointer"
                          >
                            {isSaved ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Saved to Notes
                              </>
                            ) : (
                              <>
                                <BookmarkPlus className="w-3.5 h-3.5" />
                                Save to My Notes
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isSubmitting && (
              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#48564D] flex items-center gap-2.5 max-w-md">
                <Sparkles className="w-4 h-4 text-[#164A31] shrink-0" />
                <span>
                  Preparing your{" "}
                  {EXPLANATION_MODES.find(
                    (m) => m.id === explanationMode
                  )?.label.toLowerCase()}{" "}
                  explanation for {activeSubjectName}...
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C] space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
                {lastFailedPrompt && (
                  <div className="flex items-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={() =>
                        handleAskDoubt(
                          lastFailedPrompt.text,
                          lastFailedPrompt.mode,
                          lastFailedPrompt.attachment
                        )
                      }
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Question
                    </Button>
                    <button
                      type="button"
                      onClick={scrollToFormulaReference}
                      className="text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
                    >
                      View Verified Topic Formulas Instead →
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Unobtrusive Explanation Mode Bar + Compose Area */}
          <div className="bg-[#FAF8F3] border-t border-[#E2E5DC] p-4 space-y-3">
            {/* Explanation Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#48564D] mr-1">
                  Explanation mode:
                </span>
                {EXPLANATION_MODES.map((mode) => {
                  const active = explanationMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setExplanationMode(mode.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? "bg-[#164A31] text-white"
                          : "bg-white border border-[#E2E5DC] text-[#48564D] hover:text-[#14241B]"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] text-[#6E7B72] hidden sm:inline">
                {
                  EXPLANATION_MODES.find((m) => m.id === explanationMode)
                    ?.shortHint
                }
              </span>
            </div>

            {/* Pending Image / Document Attachment Preview */}
            {pendingAttachment && (
              <div className="p-2.5 rounded-lg bg-white border border-[#E2E5DC] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {pendingAttachment.previewDataUrl ? (
                    <img
                      src={pendingAttachment.previewDataUrl}
                      alt={pendingAttachment.name}
                      className="w-10 h-10 rounded object-cover border border-[#E2E5DC] shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded bg-[#EAF2EC] text-[#164A31] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#14241B] truncate">
                      {pendingAttachment.name}
                    </div>
                    <div className="text-[11px] text-[#6E7B72]">
                      {pendingAttachment.sizeLabel} · Ready to send with your
                      question
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  aria-label="Remove attached file"
                  className="p-1.5 rounded-md text-[#6E7B72] hover:text-[#14241B] hover:bg-[#F3F1EA] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Question Input & Multimodal Attachment Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskDoubt();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                title="Attach a question image (PNG/JPG/WebP) or study document (PDF/TXT/MD)"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-white border border-[#E2E5DC] hover:border-[#164A31] text-xs font-medium text-[#14241B] shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4 text-[#164A31]" />
                <span>Attach Image / File</span>
              </button>

              <label htmlFor="doubt-question-input" className="sr-only">
                Type your academic doubt
              </label>
              <input
                id="doubt-question-input"
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder={`Ask a ${activeSubjectName} doubt or follow-up question...`}
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-[#E2E5DC] rounded-lg text-[#14241B] placeholder:text-[#6E7B72]"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={
                  (!questionInput.trim() && !pendingAttachment) || isSubmitting
                }
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Thinking..." : "Ask Tutor"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
