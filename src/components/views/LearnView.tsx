import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  BookOpen,
  CheckCircle2,
  Compass,
  HelpCircle,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";
import {
  AppRoute,
  ClassLevel,
  StudentLearningState,
  SubjectId,
  TargetExam,
} from "../../types/domain";
import {
  QUESTIONS,
  SUBJECTS,
  SYLLABUS_DATASET_NOTICE,
  TOPICS,
} from "../../data/curriculum";
import { Button, MetaLine, ProgressBar, SegmentedControl } from "../ui/Primitives";
import { ConceptSimulator } from "../simulations/ConceptSimulator";
import { MathFormula } from "../ui/MathAndDiagrams";
import { SubjectIllustration } from "../ui/SubjectIllustration";

interface LearnViewProps {
  state: StudentLearningState;
  initialSubjectId?: SubjectId;
  initialTopicId?: string;
  onToggleTopicComplete: (topicId: string) => void;
  onMarkKnowledgeCheckDone?: (topicId: string) => void;
  onSaveTopicToNotes: (
    title: string,
    subjectId: SubjectId,
    chapterId: string,
    content: string
  ) => void;
  onNavigate: (
    route: AppRoute,
    options?: {
      subjectId?: SubjectId;
      chapterId?: string;
      topicId?: string;
      prefillDoubt?: string;
    }
  ) => void;
}

export function LearnView({
  state,
  initialSubjectId,
  initialTopicId,
  onToggleTopicComplete,
  onMarkKnowledgeCheckDone,
  onSaveTopicToNotes,
  onNavigate,
}: LearnViewProps) {
  const profile = state.profile!;

  // Mode: 'explorer' (Exam -> Class -> Subject -> Chapter -> Topic) or 'reader' (Focused Concept Learning Screen)
  const [mode, setMode] = useState<"explorer" | "reader">(
    initialTopicId ? "reader" : "explorer"
  );

  // Explorer hierarchy filters: Exam -> Class -> Subject
  const [selectedExam, setSelectedExam] = useState<TargetExam>(
    profile.targetExam
  );
  const [selectedClass, setSelectedClass] = useState<"all" | ClassLevel>("all");

  const applicableSubjects = SUBJECTS.filter((s) =>
    s.applicableExams.includes(selectedExam)
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>(
    initialSubjectId &&
      applicableSubjects.some((s) => s.id === initialSubjectId)
      ? initialSubjectId
      : applicableSubjects[0]?.id || "physics"
  );

  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || TOPICS[0].id
  );

  // Knowledge check interactive state inside the Concept Reader
  const [kcSelected, setKcSelected] = useState<"A" | "B" | "C" | null>(null);
  const [kcSubmitted, setKcSubmitted] = useState<boolean>(false);
  const [noteSavedBanner, setNoteSavedBanner] = useState<boolean>(false);

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
    if (initialTopicId) {
      const found = TOPICS.find((t) => t.id === initialTopicId);
      if (found) {
        setSelectedSubjectId(found.subjectId);
        setSelectedTopicId(found.id);
        setMode("reader");
      }
    }
  }, [initialSubjectId, initialTopicId]);

  useEffect(() => {
    setKcSelected(null);
    setKcSubmitted(false);
    setNoteSavedBanner(false);
  }, [selectedTopicId]);

  const handleExamFilterChange = (exam: TargetExam) => {
    setSelectedExam(exam);
    const validSubjs = SUBJECTS.filter((s) => s.applicableExams.includes(exam));
    if (!validSubjs.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(validSubjs[0]?.id || "physics");
    }
  };

  const currentSubject =
    applicableSubjects.find((s) => s.id === selectedSubjectId) ||
    applicableSubjects[0] ||
    SUBJECTS[0];

  const filteredChapters = currentSubject.chapters.filter(
    (ch) => selectedClass === "all" || ch.classLevel === selectedClass
  );

  const activeTopic =
    TOPICS.find((t) => t.id === selectedTopicId) || TOPICS[0];
  const activeTopicSubject =
    SUBJECTS.find((s) => s.id === activeTopic.subjectId) || currentSubject;
  const activeTopicChapter = activeTopicSubject.chapters.find((c) =>
    c.topicIds.includes(activeTopic.id)
  );

  const isTopicCompleted = state.completedTopicIds.includes(activeTopic.id);

  // Next topic in sequence for "Continue to Next Topic"
  const allExamTopics = TOPICS.filter((t) =>
    t.applicableExams.includes(selectedExam)
  );
  const currentTopicIndex = allExamTopics.findIndex(
    (t) => t.id === activeTopic.id
  );
  const nextTopic =
    allExamTopics[(currentTopicIndex + 1) % allExamTopics.length] ||
    allExamTopics[0];

  const handleOpenTopicReader = (topicId: string) => {
    const t = TOPICS.find((item) => item.id === topicId);
    if (t) {
      setSelectedSubjectId(t.subjectId);
      setSelectedTopicId(t.id);
      setMode("reader");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveSummaryNote = () => {
    const content = [
      `Topic: ${activeTopic.title} (Class ${activeTopic.classLevel})`,
      "Key Takeaways:",
      ...activeTopic.keyTakeaways.map((k) => `• ${k}`),
      "Formulas & Definitions:",
      ...activeTopic.definitionsAndFormulas.map(
        (d) => `• ${d.term}: ${d.formula || ""} — ${d.meaning}`
      ),
    ].join("\n");

    onSaveTopicToNotes(
      `${activeTopic.title} — Concept & Formula Summary`,
      activeTopic.subjectId,
      activeTopic.chapterId,
      content
    );
    setNoteSavedBanner(true);
  };

  /* =========================================================================
   * MODE 1: SUBJECT AND SYLLABUS EXPLORER (Exam -> Class -> Subject -> Chapter -> Topic)
   * ======================================================================= */
  if (mode === "explorer") {
    return (
      <div className="space-y-8">
        {/* Top Hierarchy Selector Card */}
        <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <MetaLine
                items={[
                  "Subject & Syllabus Explorer",
                  `${selectedExam}`,
                  selectedClass === "all"
                    ? "Classes 11 & 12"
                    : `Class ${selectedClass}`,
                  currentSubject.name,
                ]}
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
                Explore concepts by exam, class, subject, and chapter
              </h1>
              <p className="text-xs sm:text-sm text-[#48564D] max-w-2xl">
                Physics and Chemistry foundations are shared across JEE and NEET without duplicating content, while Mathematics (JEE) and Biology (NEET UG) provide exam-specific depth.
              </p>
            </div>

            {profile.lastActiveTopicId && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() =>
                  handleOpenTopicReader(profile.lastActiveTopicId!)
                }
              >
                Resume Last Concept
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Hierarchy Controls: 1. Exam -> 2. Class -> 3. Subject */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-[#E2E5DC] items-end">
            <div className="lg:col-span-5 space-y-1.5">
              <span className="block text-xs font-semibold text-[#14241B]">
                1. Target Exam
              </span>
              <SegmentedControl
                ariaLabel="Select Exam"
                value={selectedExam}
                onChange={handleExamFilterChange}
                options={[
                  { id: "JEE Main", label: "JEE Main" },
                  { id: "JEE Advanced", label: "JEE Adv" },
                  { id: "NEET UG", label: "NEET UG" },
                ]}
              />
            </div>

            <div className="lg:col-span-3 space-y-1.5">
              <span className="block text-xs font-semibold text-[#14241B]">
                2. Class Level
              </span>
              <SegmentedControl
                ariaLabel="Select Class"
                value={selectedClass}
                onChange={setSelectedClass}
                options={[
                  { id: "all", label: "Both" },
                  { id: "11", label: "Class 11" },
                  { id: "12", label: "Class 12" },
                ]}
              />
            </div>

            <div className="lg:col-span-4 space-y-1.5">
              <span className="block text-xs font-semibold text-[#14241B]">
                3. Subject ({selectedExam === "NEET UG" ? "PCB" : "PCM"})
              </span>
              <SegmentedControl
                ariaLabel="Select Subject"
                value={currentSubject.id}
                onChange={setSelectedSubjectId}
                options={applicableSubjects.map((s) => ({
                  id: s.id,
                  label: s.name,
                }))}
              />
            </div>
          </div>

          {/* Dataset Transparency Notice */}
          <div className="px-4 py-2.5 rounded-lg bg-[#FAF8F3] border border-[#E2E5DC] text-xs text-[#6E7B72]">
            {SYLLABUS_DATASET_NOTICE}
          </div>
        </section>

        {/* Subject Overview & Chapters List */}
        <section className="space-y-6">
          <div className="bg-white border border-[#E2E5DC] rounded-xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4">
              <SubjectIllustration
                subjectId={currentSubject.id}
                className="w-full h-32"
              />
            </div>
            <div className="md:col-span-8 space-y-3">
              <MetaLine
                items={[
                  currentSubject.shortCode,
                  `Shared across: ${currentSubject.applicableExams.join(" · ")}`,
                ]}
              />
              <h2 className="text-xl font-bold text-[#14241B]">
                {currentSubject.name} Syllabus &amp; Chapters
              </h2>
              <p className="text-sm text-[#48564D] leading-relaxed">
                {currentSubject.description}
              </p>
              <ProgressBar
                label={`${currentSubject.name} Topic Completion`}
                value={
                  currentSubject.chapters
                    .flatMap((c) => c.topicIds)
                    .filter((id) => state.completedTopicIds.includes(id)).length
                }
                max={currentSubject.chapters.flatMap((c) => c.topicIds).length}
                valueLabel={`${
                  currentSubject.chapters
                    .flatMap((c) => c.topicIds)
                    .filter((id) => state.completedTopicIds.includes(id)).length
                } / ${
                  currentSubject.chapters.flatMap((c) => c.topicIds).length
                } topics mastered`}
                tone="forest"
              />
            </div>
          </div>

          {/* Chapters & Topics Cards */}
          <div className="space-y-6">
            {filteredChapters.map((chapter) => {
              const chapterTopics = TOPICS.filter((t) =>
                chapter.topicIds.includes(t.id)
              );
              const chapterQuestionsCount = QUESTIONS.filter(
                (q) => q.chapterId === chapter.id
              ).length;
              const completedInChapter = chapterTopics.filter((t) =>
                state.completedTopicIds.includes(t.id)
              ).length;

              return (
                <div
                  key={chapter.id}
                  className="bg-white border border-[#E2E5DC] rounded-xl p-6 space-y-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E2E5DC]">
                    <div className="space-y-1.5 max-w-2xl">
                      <MetaLine
                        items={[
                          `Chapter ${chapter.number}`,
                          `Class ${chapter.classLevel}`,
                          chapter.examWeightage,
                          `${completedInChapter}/${chapterTopics.length} topics completed`,
                        ]}
                      />
                      <h3 className="text-lg font-bold text-[#14241B]">
                        {chapter.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                        {chapter.summary}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onNavigate("practice", {
                          subjectId: currentSubject.id,
                          chapterId: chapter.id,
                        })
                      }
                    >
                      <Target className="w-3.5 h-3.5" />
                      Practise Chapter ({chapterQuestionsCount})
                    </Button>
                  </div>

                  {/* Topic List within Chapter */}
                  <div className="divide-y divide-[#E2E5DC]">
                    {chapterTopics.map((topic, idx) => {
                      const isDone = state.completedTopicIds.includes(topic.id);
                      const topicQCount = QUESTIONS.filter(
                        (q) => q.topicId === topic.id
                      ).length;

                      return (
                        <div
                          key={topic.id}
                          className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold text-[#164A31]">
                                0{idx + 1}.
                              </span>
                              <h4 className="text-sm sm:text-base font-semibold text-[#14241B]">
                                {topic.title}
                              </h4>
                              {isDone && (
                                <CheckCircle2
                                  className="w-4 h-4 text-[#164A31] shrink-0"
                                  aria-label="Completed"
                                />
                              )}
                            </div>
                            <p className="text-xs text-[#48564D] max-w-2xl">
                              {topic.summary}
                            </p>
                            <MetaLine
                              items={[
                                `~${topic.estimatedMinutes} mins`,
                                topic.difficulty,
                                `${topic.workedExamples.length} worked example`,
                                `${topicQCount} practice question${
                                  topicQCount === 1 ? "" : "s"
                                }`,
                              ]}
                            />
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenTopicReader(topic.id)}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              {isDone ? "Review Concept" : "Study Concept"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================================
   * MODE 2: FOCUSED CONCEPT LEARNING SCREEN (No distracting sidebars)
   * ======================================================================= */
  const kc = activeTopic.knowledgeCheck;
  const kcIsCorrect = kcSubmitted && kcSelected === kc.correctId;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Breadcrumb & Return to Syllabus Explorer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E2E5DC] rounded-xl px-5 py-3.5">
        <button
          type="button"
          onClick={() => setMode("explorer")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#164A31] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Syllabus Explorer ({activeTopicSubject.name} · Class{" "}
          {activeTopic.classLevel})
        </button>

        <MetaLine
          items={[
            activeTopicSubject.name,
            activeTopicChapter?.title,
            `~${activeTopic.estimatedMinutes} mins`,
            activeTopic.difficulty,
          ]}
        />
      </div>

      {/* 1. TOPIC TITLE, LEARNING OBJECTIVES & INTUITIVE INTRODUCTION */}
      <article className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-8">
        <header className="space-y-4 pb-6 border-b border-[#E2E5DC]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <MetaLine
                items={[
                  `Class ${activeTopic.classLevel}`,
                  activeTopic.applicableExams.join(" · "),
                ]}
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-[#14241B]">
                {activeTopic.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                type="button"
                variant={isTopicCompleted ? "lime" : "primary"}
                size="sm"
                onClick={() => onToggleTopicComplete(activeTopic.id)}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isTopicCompleted ? "Completed" : "Mark Concept Completed"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveSummaryNote}
              >
                <BookmarkPlus className="w-4 h-4" />
                Save to Notes
              </Button>
            </div>
          </div>

          {noteSavedBanner && (
            <div className="p-3 rounded-lg bg-[#EAF2EC] border border-[#164A31]/30 text-xs text-[#14241B] flex items-center justify-between">
              <span>
                Saved key formulas and takeaways to your Notes &amp; Resources.
              </span>
              <button
                type="button"
                onClick={() => onNavigate("notes")}
                className="font-semibold text-[#164A31] hover:underline cursor-pointer"
              >
                Open Notes →
              </button>
            </div>
          )}

          {/* Learning Objectives */}
          <div className="p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-2.5">
            <h2 className="text-xs font-semibold text-[#164A31]">
              Learning Objectives — After this lesson, you will be able to:
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#14241B]">
              {activeTopic.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="font-mono text-xs font-semibold text-[#164A31] mt-0.5">
                    ✓
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </header>

        {/* Short Intuitive Introduction */}
        <section className="space-y-2.5">
          <h2 className="text-base font-semibold text-[#14241B]">
            Intuitive Picture
          </h2>
          <p className="text-sm sm:text-base text-[#48564D] leading-relaxed">
            {activeTopic.intuitiveIntro}
          </p>
        </section>

        {/* Clear Explanations Broken into Sections */}
        <section className="space-y-6 pt-2">
          {activeTopic.conceptSections.map((sec, idx) => (
            <div
              key={idx}
              className="space-y-3 pt-4 border-t border-[#E2E5DC] first:border-t-0 first:pt-0"
            >
              <h3 className="text-lg font-semibold text-[#14241B]">
                {sec.heading}
              </h3>
              <p className="text-sm sm:text-base text-[#48564D] leading-relaxed">
                {sec.explanation}
              </p>
              {sec.formulaHighlight && (
                <MathFormula expression={sec.formulaHighlight} block />
              )}
              {sec.examTip && (
                <div className="p-3.5 rounded-lg bg-[#EBF3F9] border border-[#C5DDF0] text-xs sm:text-sm text-[#184E77] leading-relaxed">
                  <strong>Exam Tip:</strong> {sec.examTip}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Relevant Formulas & Definitions */}
        <section className="space-y-3 pt-4 border-t border-[#E2E5DC]">
          <h2 className="text-lg font-semibold text-[#14241B]">
            Key Definitions &amp; Formulas
          </h2>
          <div className="divide-y divide-[#E2E5DC] border border-[#E2E5DC] rounded-xl overflow-hidden">
            {activeTopic.definitionsAndFormulas.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FAF8F3] grid grid-cols-1 sm:grid-cols-12 gap-3 items-start"
              >
                <div className="sm:col-span-4 space-y-1">
                  <div className="text-xs font-semibold text-[#14241B]">
                    {item.term}
                  </div>
                  {item.formula && (
                    <MathFormula
                      expression={item.formula}
                      className="text-xs font-semibold text-[#164A31]"
                    />
                  )}
                </div>
                <div className="sm:col-span-8 text-xs sm:text-sm text-[#48564D] leading-relaxed">
                  {item.meaning}
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>

      {/* 2. INTERACTIVE DIAGRAM / GRAPH LABORATORY */}
      <ConceptSimulator spec={activeTopic.simulation} />

      {/* 3. WORKED EXAMPLES */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-6">
        <div>
          <MetaLine items={["Step-by-Step Derivation"]} />
          <h2 className="text-xl font-bold text-[#14241B] mt-0.5">
            Worked Example
          </h2>
        </div>

        <div className="space-y-6">
          {activeTopic.workedExamples.map((ex) => (
            <div
              key={ex.id}
              className="p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-4"
            >
              <div className="space-y-1">
                <MetaLine items={[ex.examTag]} />
                <h3 className="text-base font-semibold text-[#14241B]">
                  {ex.title}
                </h3>
              </div>

              <p className="text-sm sm:text-base text-[#14241B] font-serif leading-relaxed bg-white p-4 rounded-lg border border-[#E2E5DC]">
                {ex.problemStatement}
              </p>

              <div className="space-y-3">
                {ex.steps.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 rounded-lg bg-white border border-[#E2E5DC] space-y-1.5"
                  >
                    <div className="text-xs font-semibold text-[#164A31]">
                      Step {sIdx + 1}: {st.stepTitle}
                    </div>
                    <p className="text-xs sm:text-sm text-[#48564D] leading-relaxed">
                      {st.detail}
                    </p>
                    {st.formula && <MathFormula expression={st.formula} block />}
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-lg bg-[#EAF2EC] border border-[#164A31]/30 text-xs sm:text-sm font-semibold text-[#14241B]">
                Final Answer: <MathFormula expression={ex.finalAnswer} />
              </div>

              <div className="text-xs text-[#48564D] leading-relaxed">
                <strong className="text-[#14241B]">Common Mistake to Avoid:</strong>{" "}
                {ex.commonMistakeNote}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CONCISE KEY-POINTS SUMMARY & SHORT KNOWLEDGE CHECK */}
      <section className="bg-white border border-[#E2E5DC] rounded-xl p-6 sm:p-8 space-y-8">
        {/* Key-Points Summary */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-[#14241B]">
            Key-Points Summary
          </h2>
          <div className="p-5 rounded-xl bg-[#FAF8F3] border border-[#E2E5DC] space-y-2.5">
            {activeTopic.keyTakeaways.map((point, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-sm text-[#14241B] leading-relaxed"
              >
                <span className="font-mono text-xs font-semibold text-[#164A31] mt-0.5">
                  0{idx + 1}.
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Short Inline Knowledge Check */}
        <div className="pt-6 border-t border-[#E2E5DC] space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#164A31]">
              Quick Knowledge Check
            </span>
            <p className="text-sm sm:text-base font-medium text-[#14241B]">
              <MathFormula expression={kc.prompt} className="font-sans" />
            </p>
          </div>

          <div className="space-y-2" role="radiogroup" aria-label="Knowledge check options">
            {kc.options.map((opt) => {
              const chosen = kcSelected === opt.id;
              const isRight = opt.id === kc.correctId;

              let style =
                "border-[#E2E5DC] bg-[#FAF8F3] hover:bg-[#F3F1EA] text-[#14241B]";
              if (!kcSubmitted && chosen) {
                style = "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
              } else if (kcSubmitted) {
                if (isRight) {
                  style = "border-[#164A31] bg-[#EAF2EC] text-[#14241B]";
                } else if (chosen && !isRight) {
                  style = "border-[#D97706] bg-[#FFFBEB] text-[#14241B]";
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={kcSubmitted}
                  onClick={() => setKcSelected(opt.id)}
                  className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm flex items-center gap-3 transition-colors cursor-pointer disabled:cursor-default ${style}`}
                >
                  <span className="w-6 h-6 rounded-md border border-current/25 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                    {opt.id}
                  </span>
                  <span>
                    <MathFormula expression={opt.text} className="font-sans" />
                  </span>
                </button>
              );
            })}
          </div>

          {!kcSubmitted ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!kcSelected}
              onClick={() => {
                setKcSubmitted(true);
                if (kcSelected === kc.correctId && onMarkKnowledgeCheckDone) {
                  onMarkKnowledgeCheckDone(activeTopic.id);
                }
              }}
            >
              Check Understanding
            </Button>
          ) : (
            <div
              className={`p-4 rounded-lg border text-xs sm:text-sm space-y-1 ${
                kcIsCorrect
                  ? "bg-[#EAF2EC] border-[#164A31]/30 text-[#14241B]"
                  : "bg-[#FFFBEB] border-[#D97706]/40 text-[#14241B]"
              }`}
            >
              <div className="font-semibold">
                {kcIsCorrect
                  ? "✓ Spot on! You grasped the core principle."
                  : `Option ${kc.correctId} is the right answer.`}
              </div>
              <p className="text-[#48564D] leading-relaxed">
                <MathFormula expression={kc.reinforcement} className="font-sans" />
              </p>
            </div>
          )}
        </div>

        {/* 5. ACTIONS TO PRACTISE, SAVE, OR CONTINUE */}
        <div className="pt-6 border-t border-[#E2E5DC] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="primary"
              onClick={() =>
                onNavigate("practice", {
                  subjectId: activeTopic.subjectId,
                  chapterId: activeTopic.chapterId,
                  topicId: activeTopic.id,
                })
              }
            >
              <Target className="w-4 h-4" />
              Practise Questions on This Topic
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                onNavigate("doubts", {
                  subjectId: activeTopic.subjectId,
                  topicId: activeTopic.id,
                  prefillDoubt: `Can you help me understand ${activeTopic.title} step by step?`,
                })
              }
            >
              <Sparkles className="w-4 h-4" />
              Ask AI Tutor
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenTopicReader(nextTopic.id)}
          >
            <span className="truncate max-w-[200px] sm:max-w-[280px]">
              Next Topic: {nextTopic.title}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Button>
        </div>
      </section>
    </div>
  );
}
