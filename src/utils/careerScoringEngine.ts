import {
  CAREER_CLUSTERS,
  CAREER_QUESTIONS,
  INTEREST_DIMENSIONS,
} from "../data/careerAssessmentData";
import {
  AICareerNarrative,
  CareerAssessmentResponses,
  CareerAssessmentStage,
  CareerAssessmentState,
  CareerClusterDefinition,
  CareerClusterId,
  CareerGuidanceReport,
  CareerQuestion,
  CareerSavedReportEntry,
  CareerStudentClass,
  CareerStudentDetails,
  DimensionScoreItem,
  ExplorationDayPlan,
  InterestCombinationInsight,
  InterestDimensionId,
  MatchedCareerCluster,
  SkillRecommendation,
  WorkPreferenceTag,
  WorkStyleSummary,
} from "../types/career";

const ALL_PREFERENCE_TAGS: WorkPreferenceTag[] = [
  "hands-on",
  "theoretical",
  "collaborative",
  "independent",
  "structured",
  "exploratory",
  "people-centered",
  "analytical-systems",
];

/**
 * Validates and sanitizes raw response map against the official question list.
 * Invalid question IDs, non-string values, or option IDs that do not belong
 * to that question are stripped out so scoring is immune to corrupted inputs.
 */
export function sanitizeAssessmentResponses(
  rawResponses: unknown,
  questions: CareerQuestion[] = CAREER_QUESTIONS
): CareerAssessmentResponses {
  if (!rawResponses || typeof rawResponses !== "object" || Array.isArray(rawResponses)) {
    return {};
  }

  const questionMap = new Map<string, CareerQuestion>(
    questions.map((q) => [q.id, q])
  );
  const clean: CareerAssessmentResponses = {};

  Object.entries(rawResponses as Record<string, unknown>).forEach(
    ([qId, optId]) => {
      if (typeof optId !== "string") return;
      const question = questionMap.get(qId);
      if (!question) return;
      const trimmedOpt = optId.trim();
      const validOption = question.options.some((o) => o.id === trimmedOpt);
      if (validOption) {
        clean[qId] = trimmedOpt;
      }
    }
  );

  return clean;
}

/**
 * Returns the ordered list of questions that have not been answered yet.
 */
export function findUnansweredQuestions(
  responses: unknown,
  questions: CareerQuestion[] = CAREER_QUESTIONS
): CareerQuestion[] {
  const clean = sanitizeAssessmentResponses(responses, questions);
  return questions.filter((q) => !clean[q.id]);
}

/**
 * Deterministically scores all six interest dimensions on a 0–100 scale.
 *
 * Missing-response handling:
 * - Each question's maximum possible contribution to dimension `d` is:
 *     maxWeight(q, d) = max_{option in q.options} weight(option, d)
 * - If the student has answered at least one question that loads on dimension `d`,
 *   `normalizedScore` is computed against `answeredMaxScore` so a few skipped
 *   questions do not artificially zero out the student's expressed pattern, while
 *   `answeredCount` and `totalQuestionsForDimension` are transparently reported.
 * - When all 40 questions are answered, `answeredMaxScore === maxPossibleScore`.
 * - If no questions loading on dimension `d` were answered, `normalizedScore` is 0.
 */
export function scoreInterestDimensions(
  rawResponses: unknown,
  questions: CareerQuestion[] = CAREER_QUESTIONS
): DimensionScoreItem[] {
  const clean = sanitizeAssessmentResponses(rawResponses, questions);

  const dimensionTotals: Record<
    InterestDimensionId,
    {
      rawScore: number;
      maxPossibleScore: number;
      answeredMaxScore: number;
      answeredCount: number;
      totalQuestionsForDimension: number;
    }
  > = {
    realistic: {
      rawScore: 0,
      maxPossibleScore: 0,
      answeredMaxScore: 0,
      answeredCount: 0,
      totalQuestionsForDimension: 0,
    },
    investigative: {
      rawScore: 0,
      maxPossibleScore: 0,
      answeredMaxScore: 0,
      answeredCount: 0,
      totalQuestionsForDimension: 0,
    },
    artistic: {
      rawScore: 0,
      maxPossibleScore: 0,
      answeredMaxScore: 0,
      answeredCount: 0,
      totalQuestionsForDimension: 0,
    },
    social: {
      rawScore: 0,
      maxPossibleScore: 0,
      answeredMaxScore: 0,
      answeredCount: 0,
      totalQuestionsForDimension: 0,
    },
    enterprising: {
      rawScore: 0,
      maxPossibleScore: 0,
      answeredMaxScore: 0,
      answeredCount: 0,
      totalQuestionsForDimension: 0,
    },
    conventional: {
      rawScore: 0,
      maxPossibleScore: 0,
      answeredMaxScore: 0,
      answeredCount: 0,
      totalQuestionsForDimension: 0,
    },
  };

  questions.forEach((question) => {
    const selectedOptId = clean[question.id];
    const selectedOption = selectedOptId
      ? question.options.find((o) => o.id === selectedOptId)
      : undefined;

    INTEREST_DIMENSIONS.forEach((dimMeta) => {
      const dimId = dimMeta.id;
      const maxWeightForQuestion = question.options.reduce((maxVal, opt) => {
        const w = opt.dimensionWeights?.[dimId] || 0;
        return w > maxVal ? w : maxVal;
      }, 0);

      if (maxWeightForQuestion > 0) {
        dimensionTotals[dimId].maxPossibleScore += maxWeightForQuestion;
        dimensionTotals[dimId].totalQuestionsForDimension += 1;

        if (selectedOption) {
          const earned = selectedOption.dimensionWeights?.[dimId] || 0;
          dimensionTotals[dimId].rawScore += earned;
          dimensionTotals[dimId].answeredMaxScore += maxWeightForQuestion;
          dimensionTotals[dimId].answeredCount += 1;
        }
      }
    });
  });

  const canonicalOrder: Record<InterestDimensionId, number> = {
    realistic: 0,
    investigative: 1,
    artistic: 2,
    social: 3,
    enterprising: 4,
    conventional: 5,
  };

  const items: DimensionScoreItem[] = INTEREST_DIMENSIONS.map((dimMeta) => {
    const totals = dimensionTotals[dimMeta.id];
    const rawRounded = Number(totals.rawScore.toFixed(2));
    const maxRounded = Number(totals.maxPossibleScore.toFixed(2));
    const answeredMaxRounded = Number(totals.answeredMaxScore.toFixed(2));

    const rawRatio =
      answeredMaxRounded > 0 ? rawRounded / answeredMaxRounded : 0;
    const normalizedScore = Math.max(
      0,
      Math.min(100, Math.round(rawRatio * 100))
    );

    const levelLabel: DimensionScoreItem["levelLabel"] =
      normalizedScore >= 68
        ? "High relative interest"
        : normalizedScore >= 42
        ? "Moderate interest"
        : "Emerging / situational interest";

    const explanation =
      normalizedScore >= 68
        ? `Your responses frequently favoured activities involving ${dimMeta.tagline.toLowerCase()}`
        : normalizedScore >= 42
        ? `You showed a balanced, selective interest in ${dimMeta.tagline.toLowerCase()}`
        : `You expressed lower current preference for ${dimMeta.shortLabel.toLowerCase()}-focused tasks compared with your top areas, though specific projects may still appeal to you.`;

    return {
      dimensionId: dimMeta.id,
      name: dimMeta.name,
      shortLabel: dimMeta.shortLabel,
      tagline: dimMeta.tagline,
      rawScore: rawRounded,
      maxPossibleScore: maxRounded,
      answeredMaxScore: answeredMaxRounded,
      normalizedScore,
      answeredCount: totals.answeredCount,
      totalQuestionsForDimension: totals.totalQuestionsForDimension,
      levelLabel,
      explanation,
    };
  });

  // Sort deterministically: highest normalizedScore first, then rawScore, then canonical order
  return [...items].sort((a, b) => {
    if (b.normalizedScore !== a.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    if (b.rawScore !== a.rawScore) {
      return b.rawScore - a.rawScore;
    }
    return canonicalOrder[a.dimensionId] - canonicalOrder[b.dimensionId];
  });
}

/**
 * Identifies leading interest dimensions and explains ties or small differences honestly.
 */
export function detectLeadingDimensionsAndTies(
  sortedScores: DimensionScoreItem[]
): {
  leadingDimensions: DimensionScoreItem[];
  tieNote?: string;
} {
  if (sortedScores.length === 0) {
    return { leadingDimensions: [] };
  }

  const topScore = sortedScores[0].normalizedScore;
  const closeToTop = sortedScores.filter(
    (s) => topScore - s.normalizedScore <= 5
  );

  const leadingDimensions =
    closeToTop.length >= 3
      ? closeToTop.slice(0, 3)
      : sortedScores.slice(0, 3);

  let tieNote: string | undefined;
  if (closeToTop.length >= 2) {
    const names = closeToTop.map((d) => d.shortLabel).join(", ");
    tieNote = `Your top interest areas (${names}) are within ${
      topScore - closeToTop[closeToTop.length - 1].normalizedScore
    } points of each other on a 100-point scale. Small score differences of a few points are not statistically or practically rigid — they indicate that you have balanced, multi-faceted curiosity across these areas.`;
  } else if (
    sortedScores.length >= 3 &&
    sortedScores[1].normalizedScore - sortedScores[2].normalizedScore <= 4
  ) {
    tieNote = `Your second and third interest areas (${sortedScores[1].shortLabel} and ${sortedScores[2].shortLabel}) have very similar scores. Consider both combinations equally when exploring career options.`;
  }

  return { leadingDimensions, tieNote };
}

interface CombinationTemplate {
  title: string;
  meaning: string;
  alternativeInterpretation: string;
  suggestedClusterIds: CareerClusterId[];
}

const PAIR_TEMPLATES: Record<string, CombinationTemplate> = {
  "investigative+realistic": {
    title: "Scientific Inquiry + Practical System Building",
    meaning:
      "You enjoy understanding how natural or mathematical systems work and applying those principles to tangible tools, experiments, hardware, or ecological systems.",
    alternativeInterpretation:
      "Some students with this pattern prefer deep laboratory research (Pure Sciences or Biotechnology), while others prefer designing practical machinery, software, or sustainable infrastructure (Engineering).",
    suggestedClusterIds: [
      "engineering-tech",
      "pure-sciences",
      "environment-life",
    ],
  },
  "investigative+social": {
    title: "Analytical Inquiry + Human Wellbeing & Learning",
    meaning:
      "You combine curiosity about science, evidence, and root causes with a genuine care for how people learn, heal, and thrive in communities.",
    alternativeInterpretation:
      "This combination often aligns with clinical healthcare and public health, but it is equally strong in psychology, social research, science communication, and education.",
    suggestedClusterIds: [
      "medical-healthcare",
      "humanities-social",
      "education-development",
    ],
  },
  "artistic+enterprising": {
    title: "Creative Expression + Initiative & Leadership",
    meaning:
      "You enjoy shaping original visual, written, or design ideas and bringing them into the world through projects, media, storytelling, or entrepreneurship.",
    alternativeInterpretation:
      "You might enjoy leading creative campaigns, product design, or media ventures, or you may prefer independent creative work where you manage your own studio or brand.",
    suggestedClusterIds: [
      "creative-media",
      "business-management",
      "humanities-social",
    ],
  },
  "conventional+enterprising": {
    title: "Structured Systems + Strategic Leadership",
    meaning:
      "You value clear organisation, financial or operational accuracy, and coordinating people and resources toward measurable goals.",
    alternativeInterpretation:
      "This pattern supports commercial leadership, management, and entrepreneurship, as well as structured fields like corporate finance, public administration, and legal operations.",
    suggestedClusterIds: [
      "business-management",
      "commerce-finance",
      "law-policy",
    ],
  },
  "artistic+social": {
    title: "Creative Communication + Human-Centered Empathy",
    meaning:
      "You care about how ideas feel to real people — whether through teaching, design, writing, counselling, or cultural expression.",
    alternativeInterpretation:
      "Students with this combination often thrive in education, UX/communication design, psychology, journalism, or social-impact media.",
    suggestedClusterIds: [
      "education-development",
      "creative-media",
      "humanities-social",
    ],
  },
  "conventional+investigative": {
    title: "Analytical Reasoning + Precision & Data Structure",
    meaning:
      "You enjoy working with logic, quantitative evidence, and structured rules where careful analysis prevents costly errors.",
    alternativeInterpretation:
      "This pattern fits economics, actuarial science, chartered accountancy, and financial analysis, as well as data science, software verification, and laboratory quality systems.",
    suggestedClusterIds: [
      "commerce-finance",
      "pure-sciences",
      "engineering-tech",
    ],
  },
  "artistic+realistic": {
    title: "Tangible Craft + Visual & Spatial Design",
    meaning:
      "You like turning imaginative concepts into physical or interactive forms that people can see, touch, and use.",
    alternativeInterpretation:
      "This combination is classic in architecture, industrial/product design, user-interface prototyping, and film/media production.",
    suggestedClusterIds: ["creative-media", "engineering-tech"],
  },
  "artistic+investigative": {
    title: "Conceptual Inquiry + Original Expression",
    meaning:
      "You enjoy both deep research and creative synthesis — asking big questions and expressing answers through design, writing, or interdisciplinary projects.",
    alternativeInterpretation:
      "Consider architecture, human-computer interaction, research journalism, psychology, or science communication.",
    suggestedClusterIds: [
      "creative-media",
      "humanities-social",
      "pure-sciences",
    ],
  },
  "enterprising+social": {
    title: "Public Advocacy + Community & Team Leadership",
    meaning:
      "You are energised by working with people, debating ideas, organising collective action, and shaping institutions that serve society.",
    alternativeInterpretation:
      "This combination points toward law, public policy, civil services, social entrepreneurship, and educational leadership.",
    suggestedClusterIds: [
      "law-policy",
      "business-management",
      "education-development",
    ],
  },
  "enterprising+investigative": {
    title: "Analytical Strategy + Problem-Solving Initiative",
    meaning:
      "You enjoy investigating complex systems and using those insights to lead projects, technology ventures, or policy decisions.",
    alternativeInterpretation:
      "Explore technology product management, economics and policy analysis, research-driven entrepreneurship, or corporate law.",
    suggestedClusterIds: [
      "business-management",
      "law-policy",
      "engineering-tech",
    ],
  },
  "realistic+social": {
    title: "Practical Action + Direct Community & Patient Support",
    meaning:
      "You prefer helping people in tangible, hands-on ways rather than sitting behind a desk all day.",
    alternativeInterpretation:
      "This combination often aligns with clinical healthcare, physiotherapy, nursing, environmental fieldwork, and community agricultural extension.",
    suggestedClusterIds: [
      "medical-healthcare",
      "environment-life",
      "education-development",
    ],
  },
  "conventional+realistic": {
    title: "Practical Operations + Systematic Precision",
    meaning:
      "You value reliable physical systems, clear technical standards, and well-organised execution.",
    alternativeInterpretation:
      "Explore civil and mechanical engineering operations, supply-chain logistics, laboratory management, or environmental auditing.",
    suggestedClusterIds: [
      "engineering-tech",
      "commerce-finance",
      "environment-life",
    ],
  },
};

function getPairKey(a: InterestDimensionId, b: InterestDimensionId): string {
  return [a, b].sort().join("+");
}

export function buildInterestCombinations(
  sortedScores: DimensionScoreItem[]
): InterestCombinationInsight[] {
  if (sortedScores.length < 2) return [];

  const first = sortedScores[0];
  const second = sortedScores[1];
  const third = sortedScores[2];

  const pairsToBuild: [DimensionScoreItem, DimensionScoreItem][] = [
    [first, second],
  ];
  if (third) {
    pairsToBuild.push([first, third]);
  }

  return pairsToBuild.map(([dimA, dimB], idx) => {
    const key = getPairKey(dimA.dimensionId, dimB.dimensionId);
    const template = PAIR_TEMPLATES[key];
    const combinationCode = `${dimA.shortLabel} + ${dimB.shortLabel}`;

    if (template) {
      return {
        id: `combo-${idx + 1}-${key}`,
        dimensions: [dimA.dimensionId, dimB.dimensionId],
        title: template.title,
        combinationCode,
        meaning: template.meaning,
        alternativeInterpretation: template.alternativeInterpretation,
        suggestedClusterIds: template.suggestedClusterIds,
      };
    }

    return {
      id: `combo-${idx + 1}-${key}`,
      dimensions: [dimA.dimensionId, dimB.dimensionId],
      title: `${dimA.shortLabel} & ${dimB.shortLabel} Synergy`,
      combinationCode,
      meaning: `Your responses combine ${dimA.shortLabel.toLowerCase()} interests (${dimA.tagline.toLowerCase()}) with ${dimB.shortLabel.toLowerCase()} interests (${dimB.tagline.toLowerCase()}).`,
      alternativeInterpretation:
        "You can explore roles that blend both strengths directly, or choose one as your primary academic study and keep the other as a complementary skill.",
      suggestedClusterIds: ["business-management", "humanities-social"],
    };
  });
}

export function summarizeWorkStylePreferences(
  rawResponses: unknown,
  questions: CareerQuestion[] = CAREER_QUESTIONS
): WorkStyleSummary {
  const clean = sanitizeAssessmentResponses(rawResponses, questions);
  const tagCounts: Record<WorkPreferenceTag, number> = {
    "hands-on": 0,
    theoretical: 0,
    collaborative: 0,
    independent: 0,
    structured: 0,
    exploratory: 0,
    "people-centered": 0,
    "analytical-systems": 0,
  };

  questions.forEach((q) => {
    const selectedId = clean[q.id];
    if (!selectedId) return;
    const opt = q.options.find((o) => o.id === selectedId);
    if (!opt?.preferenceTags) return;
    opt.preferenceTags.forEach((tag) => {
      if (ALL_PREFERENCE_TAGS.includes(tag)) {
        tagCounts[tag] += 1;
      }
    });
  });

  const preferredEnvironment =
    tagCounts["hands-on"] > tagCounts.theoretical + 2
      ? "You gravitate toward practical labs, workshops, clinics, studios, or field settings where you can build and test things directly."
      : tagCounts.theoretical > tagCounts["hands-on"] + 2
      ? "You enjoy analytical, research-oriented, or conceptual environments where you can investigate ideas deeply."
      : "You appreciate a balanced environment that connects conceptual theory with practical, real-world application.";

  const learningApproach =
    tagCounts.structured > tagCounts.exploratory + 2
      ? "You prefer structured frameworks, clear milestones, and step-by-step mastery when learning new material."
      : tagCounts.exploratory > tagCounts.structured + 2
      ? "You enjoy open-ended exploration, creative experimentation, and discovering connections across different subjects."
      : "You learn well when clear foundational structure is paired with room for creative or practical experimentation.";

  const collaborationStyle =
    tagCounts.collaborative + tagCounts["people-centered"] >
    tagCounts.independent * 2 + 2
      ? "You gain energy from working with people — explaining ideas, coordinating teams, or supporting others directly."
      : tagCounts.independent > tagCounts.collaborative + 2
      ? "You value focused, independent problem-solving time where you can think deeply without constant interruption."
      : "You are comfortable switching between independent deep focus and collaborative team projects.";

  const q39Choice = clean["cit-q39"];
  const explorationOpenness =
    q39Choice === "A" || q39Choice === "B"
      ? "You expressed strong openness to interdisciplinary paths that bridge two fields (such as technology + design, biology + computation, or science + policy)."
      : q39Choice === "C"
      ? "You currently prefer focusing deeply on a well-defined discipline with clear professional milestones."
      : "You are open to testing small beginner projects across multiple fields before narrowing down your long-term path.";

  const sortedTags = [...ALL_PREFERENCE_TAGS].sort(
    (a, b) => tagCounts[b] - tagCounts[a]
  );

  const tagLabels: Record<WorkPreferenceTag, string> = {
    "hands-on": "Hands-on experimentation & prototyping",
    theoretical: "Conceptual & theoretical inquiry",
    collaborative: "Team coordination & group collaboration",
    independent: "Independent deep focus",
    structured: "Structured planning & systematic accuracy",
    exploratory: "Creative & open-ended exploration",
    "people-centered": "Human-centered communication & care",
    "analytical-systems": "Analytical & systems problem-solving",
  };

  const preferenceHighlights = sortedTags
    .filter((t) => tagCounts[t] > 0)
    .slice(0, 4)
    .map((t) => tagLabels[t]);

  if (preferenceHighlights.length === 0) {
    preferenceHighlights.push(
      "Balanced preference across analytical, practical, and collaborative tasks"
    );
  }

  return {
    preferredEnvironment,
    learningApproach,
    collaborationStyle,
    explorationOpenness,
    preferenceHighlights,
    tagCounts,
  };
}

/**
 * Deterministically ranks all 10 career clusters based on the student's
 * 6-dimension scores and work-style preferences.
 */
export function matchCareerClusters(
  dimensionScores: DimensionScoreItem[],
  workStyleSummary: WorkStyleSummary,
  rawResponses: unknown,
  clusters: CareerClusterDefinition[] = CAREER_CLUSTERS,
  questions: CareerQuestion[] = CAREER_QUESTIONS
): MatchedCareerCluster[] {
  const clean = sanitizeAssessmentResponses(rawResponses, questions);
  const scoreMap = new Map<InterestDimensionId, number>(
    dimensionScores.map((d) => [d.dimensionId, d.normalizedScore])
  );
  const nameMap = new Map<InterestDimensionId, string>(
    dimensionScores.map((d) => [d.dimensionId, d.shortLabel])
  );

  const maxTagCount = Math.max(
    1,
    ...Object.values(workStyleSummary.tagCounts)
  );

  // Find specific liked prompts to make "Why it fits" concrete and personal
  const likedPromptsByDimension: Record<InterestDimensionId, string[]> = {
    realistic: [],
    investigative: [],
    artistic: [],
    social: [],
    enterprising: [],
    conventional: [],
  };

  questions.forEach((q) => {
    const ans = clean[q.id];
    if (!ans) return;
    if (q.responseType === "likert-5" && (ans === "4" || ans === "5")) {
      q.primaryDimensions.forEach((dim) => {
        likedPromptsByDimension[dim].push(q.prompt);
      });
    }
  });

  const scoredClusters = clusters.map((cluster) => {
    const primaryAvg =
      cluster.primaryDimensions.reduce(
        (sum, d) => sum + (scoreMap.get(d) || 0),
        0
      ) / Math.max(1, cluster.primaryDimensions.length);

    const secondaryAvg =
      cluster.secondaryDimensions.reduce(
        (sum, d) => sum + (scoreMap.get(d) || 0),
        0
      ) / Math.max(1, cluster.secondaryDimensions.length);

    const prefAvg =
      cluster.alignedPreferences.reduce(
        (sum, tag) =>
          sum + ((workStyleSummary.tagCounts[tag] || 0) / maxTagCount) * 100,
        0
      ) / Math.max(1, cluster.alignedPreferences.length);

    const rawAlignment = primaryAvg * 0.62 + secondaryAvg * 0.23 + prefAvg * 0.15;
    const alignmentScore = Math.max(
      0,
      Math.min(100, Math.round(rawAlignment))
    );

    const matchedDimensions = [
      ...cluster.primaryDimensions,
      ...cluster.secondaryDimensions,
    ].filter((d) => (scoreMap.get(d) || 0) >= 45);

    const primaryNames = cluster.primaryDimensions
      .map((d) => `${nameMap.get(d) || d} (${scoreMap.get(d) ?? 0}/100)`)
      .join(" and ");

    const sampleLiked =
      likedPromptsByDimension[cluster.primaryDimensions[0]]?.[0];

    const whyItFits = sampleLiked
      ? `This field aligns with your scores in ${primaryNames}. In your responses, you expressed interest in activities such as "${sampleLiked.replace(/\.$/, "")}", which connects naturally with the day-to-day problem-solving in ${cluster.title}.`
      : `This field connects with your relative pattern across ${primaryNames}, combining ${cluster.summary.charAt(0).toLowerCase()}${cluster.summary.slice(1)}`;

    const matchedPreferences = cluster.alignedPreferences.map((tag) =>
      tag.replace("-", " ")
    );

    return {
      cluster,
      rank: 0,
      alignmentScore,
      whyItFits,
      matchedDimensions:
        matchedDimensions.length > 0
          ? matchedDimensions
          : cluster.primaryDimensions,
      matchedPreferences,
    };
  });

  scoredClusters.sort((a, b) => {
    if (b.alignmentScore !== a.alignmentScore) {
      return b.alignmentScore - a.alignmentScore;
    }
    return a.cluster.id.localeCompare(b.cluster.id);
  });

  return scoredClusters.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function buildSkillRecommendations(
  dimensionScores: DimensionScoreItem[],
  workStyleSummary: WorkStyleSummary
): SkillRecommendation[] {
  const topDims = new Set(
    dimensionScores.slice(0, 3).map((d) => d.dimensionId)
  );
  const skills: SkillRecommendation[] = [];

  if (topDims.has("investigative") || workStyleSummary.tagCounts["analytical-systems"] > 0) {
    skills.push({
      id: "skill-evidence-reasoning",
      skillName: "Quantitative & First-Principles Reasoning",
      category: "Analytical Thinking",
      whySuggested:
        "Connected to your interest in investigating how systems work and analysing evidence before jumping to conclusions.",
      starterActivity:
        "Pick one concept in science, economics, or statistics this week and write down why the formula or rule works in your own words without memorising.",
    });
  }

  if (topDims.has("realistic") || workStyleSummary.tagCounts["hands-on"] > 0) {
    skills.push({
      id: "skill-prototyping",
      skillName: "Practical Prototyping & Experimental Method",
      category: "Hands-On Execution",
      whySuggested:
        "Connected to your preference for learning through tangible models, lab tools, hardware, or fieldwork.",
      starterActivity:
        "Document a small hands-on project or lab observation in a notebook: record what went wrong on the first attempt and how you fixed it.",
    });
  }

  if (topDims.has("artistic") || workStyleSummary.tagCounts.exploratory > 0) {
    skills.push({
      id: "skill-visual-storytelling",
      skillName: "Visual Structuring & Creative Problem Framing",
      category: "Design & Expression",
      whySuggested:
        "Connected to your interest in original expression, visual design, and exploring problems with more than one valid answer.",
      starterActivity:
        "Redesign a cluttered handout, poster, or study page into a clean visual diagram that anyone in your class can understand in 30 seconds.",
    });
  }

  if (topDims.has("social") || workStyleSummary.tagCounts["people-centered"] > 0) {
    skills.push({
      id: "skill-empathetic-communication",
      skillName: "Active Listening & Explanatory Clarity",
      category: "Human Development & Care",
      whySuggested:
        "Connected to your responses valuing teaching, supporting people, healthcare, or resolving misunderstandings.",
      starterActivity:
        "Practise explaining a challenging topic to a friend or younger sibling by asking them two questions first to see how they currently think about it.",
    });
  }

  if (topDims.has("enterprising") || workStyleSummary.tagCounts.collaborative > 0) {
    skills.push({
      id: "skill-project-leadership",
      skillName: "Structured Argumentation & Collaborative Initiative",
      category: "Leadership & Policy",
      whySuggested:
        "Connected to your interest in organising teams, debating policy or business ideas, and taking initiative.",
      starterActivity:
        "Take a current school or civic issue, write a 1-page proposal with three realistic action steps, and ask a teacher or peer for critical feedback.",
    });
  }

  if (topDims.has("conventional") || workStyleSummary.tagCounts.structured > 0) {
    skills.push({
      id: "skill-financial-data-literacy",
      skillName: "Data Organization & Financial Literacy",
      category: "Systems & Accuracy",
      whySuggested:
        "Connected to your appreciation for structured planning, reliable checklists, and accurate data or financial records.",
      starterActivity:
        "Build a clean spreadsheet tracking either a 30-day study schedule or a sample project budget, checking that every total and formula is self-consistent.",
    });
  }

  // Ensure at least 4 well-rounded skill suggestions
  if (skills.length < 4) {
    skills.push({
      id: "skill-foundational-reflection",
      skillName: "Self-Directed Research & Source Verification",
      category: "Core Academic Skill",
      whySuggested:
        "Useful across every career pathway for evaluating college curricula, eligibility rules, and real-world job roles.",
      starterActivity:
        "Compare the actual first-year syllabus of two undergraduate degrees you are curious about using official university websites.",
    });
  }

  return skills.slice(0, 5);
}

export function buildSevenDayExplorationPlan(
  recommendedClusters: MatchedCareerCluster[],
  leadingDimensions: DimensionScoreItem[]
): ExplorationDayPlan[] {
  const cluster1 = recommendedClusters[0]?.cluster || CAREER_CLUSTERS[0];
  const cluster2 = recommendedClusters[1]?.cluster || CAREER_CLUSTERS[1];
  const cluster3 = recommendedClusters[2]?.cluster || CAREER_CLUSTERS[2];
  const topDim = leadingDimensions[0]?.shortLabel || "Investigative";

  return [
    {
      day: 1,
      title: `Explore Day-in-the-Life Roles in ${cluster1.title}`,
      activity: `Read about two specific roles in ${cluster1.title} (such as ${cluster1.exampleCareers[0]} and ${cluster1.exampleCareers[1]}). Note what problems they solve on an ordinary workday rather than just their job titles.`,
      timeEstimate: "20 mins",
      focusArea: cluster1.title,
    },
    {
      day: 2,
      title: `Try a Hands-On Micro-Task in ${cluster1.title}`,
      activity: cluster1.lowCostTrialActivity,
      timeEstimate: "30 mins",
      focusArea: cluster1.title,
    },
    {
      day: 3,
      title: `Compare with Your Second Cluster: ${cluster2.title}`,
      activity: `Explore how ${cluster2.title} uses your ${topDim} interest differently. Try this small starter: ${cluster2.lowCostTrialActivity}`,
      timeEstimate: "25 mins",
      focusArea: cluster2.title,
    },
    {
      day: 4,
      title: "Check Academic Eligibility & Subject Pathways",
      activity: `Look up the official subject and entrance requirements for ${cluster1.title} and ${cluster2.title}. Note which Class 11/12 subjects or undergraduate degrees keep both doors open.`,
      timeEstimate: "20 mins",
      focusArea: "Academic Planning",
    },
    {
      day: 5,
      title: `Sample Your Third Direction: ${cluster3.title}`,
      activity: `Spend 20 minutes testing ${cluster3.title}: ${cluster3.lowCostTrialActivity}`,
      timeEstimate: "25 mins",
      focusArea: cluster3.title,
    },
    {
      day: 6,
      title: "Have a 15-Minute Curiosity Conversation",
      activity:
        "Speak with a teacher, older student, family acquaintance, or professional working in one of your top three fields. Ask: 'What do you enjoy most about your work, and what surprised you when you entered the field?'",
      timeEstimate: "20 mins",
      focusArea: "Real-World Perspective",
    },
    {
      day: 7,
      title: "Reflect & Choose One Monthly Exploration Project",
      activity:
        "Review your notes from Days 1–6. Pick which activity felt most naturally engaging (even when it required effort) and choose one small, free project to continue next month.",
      timeEstimate: "15 mins",
      focusArea: "Next Steps",
    },
  ];
}

export const STUDENT_CLASS_OPTIONS: CareerStudentClass[] = [
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Undergraduate",
  "Other",
];

export interface StudentDetailsValidationInput {
  fullName?: unknown;
  studentClass?: unknown;
}

export interface StudentDetailsValidationResult {
  valid: boolean;
  errors: Partial<Record<"fullName" | "studentClass", string>>;
  sanitized?: CareerStudentDetails;
}

/**
 * Validates the student personalization form (Full Name and Current Class)
 * used to personalize the assessment report.
 */
export function validateStudentDetailsForm(
  input: StudentDetailsValidationInput
): StudentDetailsValidationResult {
  const errors: StudentDetailsValidationResult["errors"] = {};

  const fullName =
    typeof input.fullName === "string"
      ? input.fullName.replace(/\s+/g, " ").trim()
      : "";
  if (!fullName || fullName.length < 2) {
    errors.fullName = "Please enter your full name (at least 2 characters).";
  } else if (fullName.length > 100) {
    errors.fullName = "Full name must be 100 characters or fewer.";
  }

  const studentClassRaw =
    typeof input.studentClass === "string" ? input.studentClass.trim() : "";
  const isValidClass = STUDENT_CLASS_OPTIONS.includes(
    studentClassRaw as CareerStudentClass
  );
  if (!isValidClass) {
    errors.studentClass =
      "Please select your current class (Class 9, Class 10, Class 11, Class 12, Undergraduate, or Other).";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      fullName,
      studentClass: studentClassRaw as CareerStudentClass,
    },
  };
}

export interface GenerateReportOptions {
  studentName?: string;
  studentClass?: CareerStudentClass;
  studentDetails?: CareerStudentDetails;
  attemptId?: string;
  generatedAt?: string;
  reportId?: string;
}

/**
 * Generates the complete, 100% free personalized career-guidance report
 * deterministically from the student's responses.
 */
export function generateCareerGuidanceReport(
  rawResponses: unknown,
  options: GenerateReportOptions = {},
  questions: CareerQuestion[] = CAREER_QUESTIONS,
  clusters: CareerClusterDefinition[] = CAREER_CLUSTERS
): CareerGuidanceReport {
  const clean = sanitizeAssessmentResponses(rawResponses, questions);
  const answeredCount = Object.keys(clean).length;

  const dimensionScores = scoreInterestDimensions(clean, questions);
  const { leadingDimensions, tieNote } =
    detectLeadingDimensionsAndTies(dimensionScores);
  const leadingCombinations = buildInterestCombinations(dimensionScores);
  const workStyleSummary = summarizeWorkStylePreferences(clean, questions);
  const allRankedClusters = matchCareerClusters(
    dimensionScores,
    workStyleSummary,
    clean,
    clusters,
    questions
  );
  const recommendedClusters = allRankedClusters.slice(0, 5);
  const skillRecommendations = buildSkillRecommendations(
    dimensionScores,
    workStyleSummary
  );
  const sevenDayPlan = buildSevenDayExplorationPlan(
    recommendedClusters,
    leadingDimensions
  );

  const reflectionQuestions: string[] = [
    "Which of the top recommended career clusters includes daily activities that you would still enjoy doing even on a tiring afternoon?",
    "How do your current school subjects and academic preparation align with the eligibility requirements of the fields that interest you most?",
    "Are there fields where you enjoy the subject as a hobby or creative outlet, versus fields you want to pursue as a full-time professional pathway?",
    "What practical considerations (such as college location, study duration, scholarship options, or family plans) should you discuss openly with your parents or teachers?",
    "If you combined your first and second interest dimensions into a single project next month, what would you build, write, investigate, or organise?",
  ];

  const limitationsAndEthics: string[] = [
    "Preliminary Interest & Preference Profile: The Vidyakshara Career Intelligence Test reflects your self-reported interests and work preferences today. It is not an IQ test, clinical psychological assessment, or psychometrically standardised aptitude exam.",
    "Interests Evolve with Experience: In Classes 9–12 and early college, interests naturally shift as you encounter new subjects, mentors, and hands-on projects. Treat these results as a map for exploration, not a fixed label.",
    "Interest vs. Eligibility & Skill: Enjoying a field is an important starting point, but choosing a profession also requires checking official academic eligibility, building subject mastery, and considering practical opportunities.",
    "100% Free & Student-First: Every section of this report is permanently free with no locked insights, upgrades, or commercial bias toward any single career stream.",
  ];

  const effectiveStudentName =
    options.studentDetails?.fullName?.trim() ||
    options.studentName?.trim() ||
    undefined;
  const effectiveStudentClass =
    options.studentDetails?.studentClass || options.studentClass || undefined;

  return {
    reportId: options.reportId || `cit-report-${Date.now()}`,
    attemptId: options.attemptId,
    generatedAt:
      options.generatedAt ||
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    studentName: effectiveStudentName,
    studentClass: effectiveStudentClass,
    studentDetails: options.studentDetails,
    answeredCount,
    totalQuestions: questions.length,
    dimensionScores,
    leadingDimensions,
    tieNote,
    leadingCombinations,
    workStyleSummary,
    recommendedClusters,
    allRankedClusters,
    skillRecommendations,
    sevenDayPlan,
    reflectionQuestions,
    limitationsAndEthics,
    personalizationMode: "deterministic",
  };
}

const PROHIBITED_AI_PHRASES = [
  "guaranteed success",
  "guaranteed admission",
  "iq score",
  "clinically diagnosed",
  "incapable of",
  "unfit for",
];

/**
 * Validates an optional AI narrative object against a strict schema and safety rules.
 * If validation fails, returns null so the deterministic report remains unaffected.
 */
export function validateAICareerNarrative(
  candidate: unknown
): AICareerNarrative | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const obj = candidate as Record<string, unknown>;
  const personalizedOverview =
    typeof obj.personalizedOverview === "string"
      ? obj.personalizedOverview.trim()
      : "";
  const combinationCommentary =
    typeof obj.combinationCommentary === "string"
      ? obj.combinationCommentary.trim()
      : "";
  const encouragementNote =
    typeof obj.encouragementNote === "string"
      ? obj.encouragementNote.trim()
      : "";

  if (
    personalizedOverview.length < 30 ||
    combinationCommentary.length < 25 ||
    encouragementNote.length < 20
  ) {
    return null;
  }

  const combinedLower =
    `${personalizedOverview} ${combinationCommentary} ${encouragementNote}`.toLowerCase();
  for (const phrase of PROHIBITED_AI_PHRASES) {
    if (combinedLower.includes(phrase)) {
      return null;
    }
  }

  return {
    personalizedOverview,
    combinationCommentary,
    encouragementNote,
  };
}

export function attachAINarrativeToReport(
  report: CareerGuidanceReport,
  candidate: unknown
): CareerGuidanceReport {
  const validNarrative = validateAICareerNarrative(candidate);
  if (!validNarrative) {
    return {
      ...report,
      personalizationMode: "deterministic",
      aiNarrative: undefined,
    };
  }
  return {
    ...report,
    personalizationMode: "ai-enhanced",
    aiNarrative: validNarrative,
  };
}

/**
 * Formats the complete career guidance report as clean, readable Markdown/text
 * so students can download and save a local copy on any device.
 */
export function formatCareerReportAsMarkdown(
  report: CareerGuidanceReport
): string {
  const studentMeta = [
    `Date: ${report.generatedAt}`,
    report.studentName ? `Student: ${report.studentName}` : null,
    report.studentClass ? `Class: ${report.studentClass}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const lines: string[] = [
    `# Vidyakshara Career Intelligence Test — Personalized Guidance Report`,
    studentMeta,
    `Questions Answered: ${report.answeredCount} / ${report.totalQuestions} | 100% Free Complete Report`,
    ``,
    `## A. Welcome & Overview`,
    `This report summarizes your responses across 40 career-interest and work-style questions. It is designed to help you explore promising academic and career directions — not to make a rigid prediction or limit your choices.`,
    report.aiNarrative
      ? `\n${report.aiNarrative.personalizedOverview}`
      : ``,
    ``,
    `## B. Your 6-Dimension Interest Profile`,
    ...report.dimensionScores.map(
      (d) =>
        `- **${d.name}**: ${d.normalizedScore}/100 (${d.levelLabel}) — ${d.explanation}`
    ),
    report.tieNote ? `\n*Note on close scores*: ${report.tieNote}` : ``,
    ``,
    `## C. Leading Interest Combinations & Work Preferences`,
    ...report.leadingCombinations.map(
      (c) =>
        `### ${c.combinationCode}: ${c.title}\n- What it suggests: ${c.meaning}\n- Alternative view: ${c.alternativeInterpretation}`
    ),
    ``,
    `### Preferred Working & Learning Style`,
    `- **Environment**: ${report.workStyleSummary.preferredEnvironment}`,
    `- **Learning Approach**: ${report.workStyleSummary.learningApproach}`,
    `- **Collaboration**: ${report.workStyleSummary.collaborationStyle}`,
    `- **Pathway Openness**: ${report.workStyleSummary.explorationOpenness}`,
    ``,
    `## D. Top Career Fields to Explore`,
    ...report.recommendedClusters.map(
      (m) =>
        `### ${m.rank}. ${m.cluster.title} (${m.cluster.subtitle}) — Alignment: ${m.alignmentScore}/100\n- **Why it may fit your interests**: ${m.whyItFits}\n- **Example Careers**: ${m.cluster.exampleCareers.join(", ")}\n- **Typical Activities**: ${m.cluster.typicalActivities.join("; ")}\n- **Relevant Subjects & Skills**: ${m.cluster.relevantSubjectsAndSkills.join("; ")}\n- **Low-Cost Way to Test Your Interest**: ${m.cluster.lowCostTrialActivity}\n- **Eligibility & Pathway Reminder**: ${m.cluster.eligibilityAndPathwayNote}`
    ),
    ``,
    `## E. Learning & Skill Development`,
    ...report.skillRecommendations.map(
      (s) =>
        `- **${s.skillName}** (${s.category}): ${s.whySuggested} *Starter step*: ${s.starterActivity}`
    ),
    ``,
    `## F. Your 7-Day Exploration Plan`,
    ...report.sevenDayPlan.map(
      (p) =>
        `- **Day ${p.day} — ${p.title}** (${p.timeEstimate}): ${p.activity}`
    ),
    ``,
    `## G. Questions for Further Reflection`,
    ...report.reflectionQuestions.map((q, idx) => `${idx + 1}. ${q}`),
    ``,
    `## H. Important Limitations`,
    ...report.limitationsAndEthics.map((l) => `- ${l}`),
  ];

  return lines.filter((line) => line !== undefined).join("\n");
}

/**
 * Generates a unique client-side assessment session ID (`cit-sess-...`)
 * so every new assessment attempt is isolated from any previous attempt.
 */
export function generateCareerSessionId(): string {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `cit-sess-${Date.now()}-${randomSuffix}`;
}

/**
 * Creates a clean, fresh CareerAssessmentState with a unique sessionId,
 * zeroed progress, empty responses, and no completed report or candidate data.
 */
export function createFreshCareerAssessmentState(
  stage: CareerAssessmentStage = "landing"
): CareerAssessmentState {
  const nowIso = new Date().toISOString();
  return {
    sessionId: generateCareerSessionId(),
    stage,
    currentQuestionIndex: 0,
    responses: {},
    startedAt: stage === "intro" || stage === "questions" ? nowIso : undefined,
    updatedAt: nowIso,
    completedReport: null,
    attemptId: undefined,
    accessToken: undefined,
    studentDetails: null,
  };
}

/**
 * Builds a historical archive record from a completed CareerGuidanceReport
 * so completed reports are preserved without polluting the active assessment state.
 */
export function createSavedReportHistoryEntry(
  report: CareerGuidanceReport,
  attemptMeta?: { attemptId?: string; accessToken?: string }
): CareerSavedReportEntry {
  const studentName =
    report.studentDetails?.fullName ||
    report.studentName ||
    "Student Candidate";
  const studentClass: CareerStudentClass =
    report.studentDetails?.studentClass || report.studentClass || "Class 11";
  const topDimensionsSummary = report.leadingDimensions
    .slice(0, 2)
    .map((d) => `${d.shortLabel} (${d.normalizedScore}/100)`)
    .join(" · ");
  const topClusterTitles = report.recommendedClusters
    .slice(0, 3)
    .map((c) => c.cluster.title);

  return {
    reportId: report.reportId,
    attemptId: attemptMeta?.attemptId || report.attemptId,
    accessToken: attemptMeta?.accessToken,
    studentName,
    studentClass,
    generatedAt: report.generatedAt,
    topDimensionsSummary,
    topClusterTitles,
    report,
  };
}

/**
 * Appends or updates a completed report in the historical report archive,
 * preserving all previous candidates' reports in chronological order.
 */
export function appendReportToHistory(
  existingHistory: CareerSavedReportEntry[] | undefined,
  report: CareerGuidanceReport,
  attemptMeta?: { attemptId?: string; accessToken?: string }
): CareerSavedReportEntry[] {
  const entry = createSavedReportHistoryEntry(report, attemptMeta);
  const safeExisting = Array.isArray(existingHistory) ? existingHistory : [];
  const filtered = safeExisting.filter(
    (item) =>
      item.reportId !== entry.reportId &&
      (!entry.attemptId || item.attemptId !== entry.attemptId)
  );
  return [entry, ...filtered].slice(0, 25);
}

/**
 * Normalizes and resets CareerAssessmentState when entering the Career Discovery tab
 * or hydrating from browser storage on startup/refresh:
 * - Never auto-restores a completed report (`completedReport` or `stage === "report"`)
 *   into the active session. Instead, extracts the completed report for archiving
 *   and returns a fresh landing state (`stage: "landing"`, `completedReport: null`,
 *   `studentDetails: null`, `responses: {}`).
 * - If an unfinished assessment (`0 < answeredCount < 40` and no `completedReport`)
 *   exists, normalizes `stage` to `"landing"` so the landing page always opens first
 *   and resuming is an explicit user action.
 */
export function resetCareerStateForTabEntry(
  currentState?: CareerAssessmentState | null
): {
  nextActiveState: CareerAssessmentState;
  archivedReportEntry: CareerSavedReportEntry | null;
} {
  if (!currentState || typeof currentState !== "object") {
    return {
      nextActiveState: createFreshCareerAssessmentState("landing"),
      archivedReportEntry: null,
    };
  }

  const cleanResponses = sanitizeAssessmentResponses(currentState.responses);
  const answeredCount = Object.keys(cleanResponses).length;
  const totalQuestions = CAREER_QUESTIONS.length;

  // If the previous state had a completed report, or was on the report stage,
  // or had all 40 questions answered as a finished attempt: archive and reset to a fresh landing state.
  if (
    currentState.completedReport ||
    currentState.stage === "report" ||
    answeredCount >= totalQuestions
  ) {
    let reportToArchive = currentState.completedReport || null;
    if (!reportToArchive && answeredCount > 0) {
      reportToArchive = generateCareerGuidanceReport(cleanResponses, {
        attemptId: currentState.attemptId,
        studentName: currentState.studentDetails?.fullName,
        studentClass: currentState.studentDetails?.studentClass,
        studentDetails: currentState.studentDetails || undefined,
      });
    }

    const archivedReportEntry = reportToArchive
      ? createSavedReportHistoryEntry(reportToArchive, {
          attemptId: currentState.attemptId,
          accessToken: currentState.accessToken,
        })
      : null;

    return {
      nextActiveState: createFreshCareerAssessmentState("landing"),
      archivedReportEntry,
    };
  }

  // If there is a genuinely unfinished in-progress attempt (1..39 answers, no completedReport),
  // always return to `stage: "landing"` when entering the Career Discovery tab so the landing
  // page is displayed first and resuming is an explicit user choice.
  if (answeredCount > 0 && answeredCount < totalQuestions) {
    return {
      nextActiveState: {
        ...currentState,
        sessionId: currentState.sessionId || generateCareerSessionId(),
        stage: "landing",
        responses: cleanResponses,
        completedReport: null,
      },
      archivedReportEntry: null,
    };
  }

  // Otherwise (0 answers), return a completely clean landing state without any stale studentDetails or attemptId
  return {
    nextActiveState: createFreshCareerAssessmentState("landing"),
    archivedReportEntry: null,
  };
}


