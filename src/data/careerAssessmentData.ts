import {
  CareerAnswerOption,
  CareerClusterDefinition,
  CareerQuestion,
  InterestDimensionId,
  InterestDimensionMeta,
  WorkPreferenceTag,
} from "../types/career";

export const CAREER_PRODUCT_IDENTITY = {
  productName: "Vidyakshara Career Intelligence Test",
  headline: "Discover where your interests could take you.",
  supportingDescription:
    "Explore your interests, discover career possibilities and receive a personalized career-guidance report designed for your next steps.",
  badges: [
    "100% Free",
    "40 Questions",
    "20–25 Minutes",
    "Free Personalized Report",
    "No Credit Card Required",
  ],
  primaryCta: "Start My Free Assessment",
  secondaryCta: "How It Works",
} as const;

export const INTEREST_DIMENSIONS: InterestDimensionMeta[] = [
  {
    id: "realistic",
    name: "Realistic (Practical & Hands-On)",
    shortLabel: "Realistic",
    tagline: "Practical work, building, tools, physical systems and hands-on problem-solving.",
    description:
      "Reflects an interest in working with tangible objects, machines, electronics, field equipment, laboratory instruments, or outdoor environments where you can see direct physical results.",
    studentExamples: [
      "Assembling robotics kits, circuits, or mechanical prototypes",
      "Conducting field surveys, plant/soil studies, or physical lab work",
      "Troubleshooting hardware, instruments, or structural models",
    ],
  },
  {
    id: "investigative",
    name: "Investigative (Analytical & Scientific)",
    shortLabel: "Investigative",
    tagline: "Scientific inquiry, analysis, experimentation and solving complex problems.",
    description:
      "Reflects curiosity about how natural, mathematical, biological, or economic systems work — forming hypotheses, analysing evidence, and reasoning from first principles.",
    studentExamples: [
      "Tracing why a physical phenomenon or chemical reaction behaves a certain way",
      "Analysing datasets, mathematical patterns, or clinical case studies",
      "Reading deeply into science, economics, or social research questions",
    ],
  },
  {
    id: "artistic",
    name: "Artistic (Creative & Expressive)",
    shortLabel: "Artistic",
    tagline: "Creativity, visual expression, writing, design and original ideas.",
    description:
      "Reflects an interest in shaping original ideas through visual design, storytelling, media production, architecture, user experience, or expressive writing where there is no single rigid formula.",
    studentExamples: [
      "Designing interfaces, illustrations, videos, or architectural spaces",
      "Writing essays, scripts, stories, or persuasive visual narratives",
      "Reimagining everyday products so they feel intuitive and human-friendly",
    ],
  },
  {
    id: "social",
    name: "Social (People, Care & Learning)",
    shortLabel: "Social",
    tagline: "Teaching, supporting, healthcare, communication and helping people.",
    description:
      "Reflects a motivation to understand human behaviour, explain difficult ideas clearly, care for people's health and wellbeing, or strengthen communities through education and empathy.",
    studentExamples: [
      "Explaining a tough concept to a classmate until it clicks",
      "Supporting patient care, counselling, or community health initiatives",
      "Listening to diverse perspectives and resolving interpersonal misunderstandings",
    ],
  },
  {
    id: "enterprising",
    name: "Enterprising (Leadership & Initiative)",
    shortLabel: "Enterprising",
    tagline: "Leadership, persuasion, business, initiative and entrepreneurship.",
    description:
      "Reflects enjoyment in launching initiatives, coordinating teams, debating policy, pitching ideas, building organisations, or turning opportunities into real-world projects.",
    studentExamples: [
      "Organising a school fest, club project, or student venture from scratch",
      "Debating public policy, legal arguments, or business strategies",
      "Motivating a team toward a shared goal and making decisions under uncertainty",
    ],
  },
  {
    id: "conventional",
    name: "Conventional (Structured Systems & Accuracy)",
    shortLabel: "Conventional",
    tagline: "Organization, planning, structured processes, data and financial accuracy.",
    description:
      "Reflects an appreciation for clarity, reliable workflows, financial accuracy, structured record-keeping, regulatory compliance, and systematic planning.",
    studentExamples: [
      "Managing budgets, spreadsheets, or structured project schedules",
      "Auditing calculations, financial statements, or data tables for accuracy",
      "Designing clean, repeatable checklists and operational workflows",
    ],
  },
];

export const CAREER_CLUSTERS: CareerClusterDefinition[] = [
  {
    id: "engineering-tech",
    title: "Engineering and Technology",
    subtitle: "Software, Electronics, Mechanical, Civil, Robotics & AI Systems",
    summary:
      "Combines analytical problem-solving with practical system building — designing software, hardware, infrastructure, or clean-energy technologies.",
    primaryDimensions: ["investigative", "realistic"],
    secondaryDimensions: ["conventional", "artistic"],
    alignedPreferences: ["hands-on", "analytical-systems", "theoretical"],
    exampleCareers: [
      "Software & Systems Engineer",
      "Robotics / Mechatronics Engineer",
      "Electronics & Semiconductor Designer",
      "Civil & Sustainable Infrastructure Engineer",
      "Data Science & Machine Learning Specialist",
    ],
    typicalActivities: [
      "Designing, coding, or testing software applications and algorithms",
      "Building and testing physical prototypes, circuits, or structural models",
      "Optimising system efficiency, safety margins, and energy use",
    ],
    relevantSubjectsAndSkills: [
      "Mathematics (Calculus, Linear Algebra, Probability)",
      "Physics & Computational Logic",
      "Programming, CAD modelling, or circuit troubleshooting",
    ],
    lowCostTrialActivity:
      "Build a small calculator or simulation script in Python/JavaScript, or model an everyday household circuit using a free online circuit simulator this weekend.",
    eligibilityAndPathwayNote:
      "Most B.Tech/B.E. programmes in India require Class 12 with Physics and Mathematics (via exams such as JEE Main, JEE Advanced, state CETs, or university entrances), while BCA and B.Sc. Computer Science pathways also offer strong entry routes.",
    quantitativeOrConceptExample:
      "Engineers balance theoretical models with real constraints — for example, calculating power dissipation $P = I^2 R$ in a circuit or analysing algorithm runtime growth $T(n) = \\mathcal{O}(n \\log n)$.",
  },
  {
    id: "medical-healthcare",
    title: "Medical and Healthcare",
    subtitle: "Clinical Medicine, Nursing, Allied Health, Pharmacy & Public Health",
    summary:
      "Unites scientific inquiry into human biology with direct, compassionate care for patients and communities.",
    primaryDimensions: ["investigative", "social"],
    secondaryDimensions: ["realistic", "conventional"],
    alignedPreferences: ["people-centered", "hands-on", "structured"],
    exampleCareers: [
      "Physician / Surgeon (MBBS & Specialisations)",
      "Dentist (BDS), Physiotherapist (BPT) or Occupational Therapist",
      "Pharmacologist / Clinical Pharmacist",
      "Public Health Specialist & Epidemiologist",
      "Biomedical Diagnostics & Clinical Nurse Specialist",
    ],
    typicalActivities: [
      "Diagnosing health conditions using patient history, physical signs, and lab reports",
      "Planning evidence-based treatment, rehabilitation, or preventive care",
      "Communicating reassuringly with patients and their families during stressful moments",
    ],
    relevantSubjectsAndSkills: [
      "Biology (Human Physiology, Genetics, Microbiology)",
      "Chemistry (Biochemistry, Organic & Pharmacology basics)",
      "Observation, empathy, and calm decision-making under pressure",
    ],
    lowCostTrialActivity:
      "Read a real public-health case study from WHO/ICMR or interview a local doctor, nurse, pharmacist, or physiotherapist for 15 minutes about what their typical Tuesday looks like.",
    eligibilityAndPathwayNote:
      "Clinical degrees such as MBBS, BDS, BAMS, and BHMS require Class 12 with Physics, Chemistry, and Biology (PCB) and qualifying NEET UG, whereas allied health, nursing, pharmacy, and public health offer diverse state and university entry pathways.",
    quantitativeOrConceptExample:
      "Clinicians and pharmacologists regularly interpret physiological relationships — such as the Henderson–Hasselbalch blood buffer equation $\\text{pH} = \\text{p}K_a + \\log\\left(\\frac{[\\ce{HCO3-}]}{0.03 \\times P_{\\ce{CO2}}}\\right)$.",
  },
  {
    id: "commerce-finance",
    title: "Commerce, Finance and Economics",
    subtitle: "Chartered Accountancy, Financial Analysis, Economics, Banking & Actuarial Science",
    summary:
      "Focuses on how money, markets, taxation, and economic policies work — bringing quantitative rigour and structured accuracy to resource decisions.",
    primaryDimensions: ["conventional", "investigative"],
    secondaryDimensions: ["enterprising"],
    alignedPreferences: ["structured", "analytical-systems", "independent"],
    exampleCareers: [
      "Chartered Accountant (CA) / Cost & Management Accountant",
      "Economist & Economic Policy Analyst",
      "Financial Analyst / Investment & Risk Manager",
      "Actuary (Insurance & Quantitative Risk Modelling)",
      "Corporate Finance & FinTech Specialist",
    ],
    typicalActivities: [
      "Analysing financial statements, budgets, audit trails, and tax frameworks",
      "Studying inflation, employment trends, and market behaviour using statistical data",
      "Evaluating financial risk and long-term sustainability for organisations or households",
    ],
    relevantSubjectsAndSkills: [
      "Economics, Accountancy, and Business Studies",
      "Mathematics & Statistics (essential for Economics Hons, Finance, and Actuarial paths)",
      "Spreadsheet modelling, data accuracy, and ethical financial reasoning",
    ],
    lowCostTrialActivity:
      "Pick a familiar Indian company, download its public annual report summary, and trace how it earns ₹100 of revenue and where that ₹100 is spent.",
    eligibilityAndPathwayNote:
      "Many B.Com, BBA (Finance), and CA Foundation tracks are open to students from Commerce, Science, or Humanities streams (note: top B.A./B.Sc. Economics Honours and Actuarial programmes often require Class 12 Mathematics).",
    quantitativeOrConceptExample:
      "Financial and economic analysts model compounding and present value using relationships such as $A = P\\left(1 + \\frac{r}{n}\\right)^{nt}$ and real interest approximations $r_{\\text{real}} \\approx r_{\\text{nominal}} - \\pi$.",
  },
  {
    id: "humanities-social",
    title: "Humanities, Psychology and Social Sciences",
    subtitle: "Psychology, Counselling, Sociology, History, International Relations & Journalism",
    summary:
      "Explores human thought, culture, mental wellbeing, and societal change through deep empathy, research, and critical writing.",
    primaryDimensions: ["social", "investigative"],
    secondaryDimensions: ["artistic"],
    alignedPreferences: ["people-centered", "exploratory", "theoretical"],
    exampleCareers: [
      "Clinical or Counselling Psychologist",
      "Organizational Behaviour & Human Resources Specialist",
      "Sociologist / Development Sector Researcher",
      "Historian, Archivist & Cultural Researcher",
      "Investigative Journalist & Long-Form Writer",
    ],
    typicalActivities: [
      "Conducting interviews, surveys, and behavioural observations to understand human needs",
      "Providing structured mental-health counselling or school/workplace guidance",
      "Writing clear, evidence-backed articles, reports, or historical analyses",
    ],
    relevantSubjectsAndSkills: [
      "Psychology, Sociology, History, Political Science, or Literature",
      "Active listening, qualitative & statistical research methods",
      "Clear written communication and ethical sensitivity",
    ],
    lowCostTrialActivity:
      "Read an introductory chapter on cognitive biases or developmental psychology and write a 300-word reflection on how you see one of those patterns in everyday school life.",
    eligibilityAndPathwayNote:
      "Undergraduate degrees in Psychology, Sociology, Liberal Arts, and Humanities (via CUET UG and university entrances) are generally open to students from any Class 12 stream (Science, Commerce, or Arts).",
    quantitativeOrConceptExample:
      "Behavioural and social researchers use statistical testing — such as computing a sample correlation coefficient $r = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum (x_i - \\bar{x})^2 \\sum (y_i - \\bar{y})^2}}$ — to separate real patterns from coincidence.",
  },
  {
    id: "creative-media",
    title: "Creative Arts, Design and Media",
    subtitle: "Product/UX Design, Architecture, Communication Design, Film, Animation & Writing",
    summary:
      "Channels visual imagination, storytelling, and human-centered empathy into physical spaces, digital interfaces, publications, and media.",
    primaryDimensions: ["artistic", "realistic"],
    secondaryDimensions: ["social", "enterprising"],
    alignedPreferences: ["exploratory", "hands-on", "independent"],
    exampleCareers: [
      "Industrial, Product or UI/UX Designer",
      "Architect & Urban Spatial Designer",
      "Visual Communication Designer & Illustrator",
      "Filmmaker, Animator & Digital Media Producer",
      "Creative Writer, Editor & Content Strategist",
    ],
    typicalActivities: [
      "Sketching wireframes, spatial layouts, storyboards, or physical product concepts",
      "Observing how real people interact with an app, object, or building and improving usability",
      "Editing visual, audio, or written stories for clarity and emotional resonance",
    ],
    relevantSubjectsAndSkills: [
      "Design thinking, visual composition, and spatial geometry",
      "Observation, sketching, storytelling, and prototyping tools",
      "Mathematics & Physics (specifically required for B.Arch Architecture pathways)",
    ],
    lowCostTrialActivity:
      "Pick one everyday object or mobile screen that frustrates you, sketch two improved versions on paper, and ask two friends which version is clearer to use.",
    eligibilityAndPathwayNote:
      "Design degrees (B.Des via UCEED, NID DAT, NIFT) are typically open to any Class 12 stream, whereas Bachelor of Architecture (B.Arch via NATA or JEE Main Paper 2) requires Class 12 Mathematics.",
    quantitativeOrConceptExample:
      "Architects and industrial designers blend aesthetics with geometry and structural balance — from aspect ratios $\\varphi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.618$ to acoustic and lighting calculations.",
  },
  {
    id: "business-management",
    title: "Business, Entrepreneurship and Management",
    subtitle: "Product Management, Operations, Marketing, Startups & Supply Chain",
    summary:
      "Brings people, strategy, operations, and customer understanding together to build sustainable organisations and solve practical market problems.",
    primaryDimensions: ["enterprising", "conventional"],
    secondaryDimensions: ["social", "investigative"],
    alignedPreferences: ["collaborative", "structured", "people-centered"],
    exampleCareers: [
      "Entrepreneur / Startup Founder",
      "Product Manager & Business Analyst",
      "Operations & Supply Chain Manager",
      "Brand, Growth & Marketing Strategist",
      "Management Consultant",
    ],
    typicalActivities: [
      "Identifying unmet customer or community needs and designing practical solutions",
      "Coordinating cross-functional teams across engineering, design, finance, and logistics",
      "Tracking project milestones, unit economics, and operational bottlenecks",
    ],
    relevantSubjectsAndSkills: [
      "Business Studies, Economics, Mathematics, and Communication",
      "Project coordination, negotiation, and structured problem-solving",
      "Basic financial literacy and data interpretation",
    ],
    lowCostTrialActivity:
      "Plan a small school event, book-exchange drive, or neighbourhood service on a single page: define who it helps, what resources are needed, and how you would measure if it worked.",
    eligibilityAndPathwayNote:
      "BBA, BMS, Integrated MBA (IPMAT), and B.Com programmes welcome students from Science, Commerce, and Humanities streams; many professionals also combine an undergraduate degree in engineering, science, or arts with a postgraduate MBA.",
    quantitativeOrConceptExample:
      "Managers evaluate unit economics and break-even volume using clear relationships such as $Q_{\\text{break-even}} = \\frac{\\text{Fixed Costs}}{\\text{Price per Unit} - \\text{Variable Cost per Unit}}$.",
  },
  {
    id: "law-policy",
    title: "Law, Public Policy and Civil Services",
    subtitle: "Legal Practice, Constitutional Law, Public Administration, Diplomacy & Governance",
    summary:
      "Combines structured reasoning, persuasive communication, and civic responsibility to uphold justice, shape public policy, and administer public institutions.",
    primaryDimensions: ["enterprising", "social"],
    secondaryDimensions: ["investigative", "conventional"],
    alignedPreferences: ["people-centered", "structured", "collaborative"],
    exampleCareers: [
      "Advocate / Litigation & Constitutional Lawyer",
      "Corporate, Intellectual Property or Technology Lawyer",
      "Public Policy Researcher & Legislative Analyst",
      "Civil Servant (IAS, IFS, IPS & State Administrative Services)",
      "Legal Aid & Human Rights Specialist",
    ],
    typicalActivities: [
      "Reading statutes, court precedents, and policy drafts to build logical arguments",
      "Representing clients, mediating disputes, or drafting clear contracts and regulations",
      "Designing and evaluating public programmes in education, infrastructure, or welfare",
    ],
    relevantSubjectsAndSkills: [
      "Political Science, History, Economics, Legal Studies, and English comprehension",
      "Logical reasoning, structured debate, and reading dense texts carefully",
      "Ethical judgement and civic awareness",
    ],
    lowCostTrialActivity:
      "Read a landmark Supreme Court summary or a local municipal policy issue and write two strong arguments on each side of the question.",
    eligibilityAndPathwayNote:
      "Five-year integrated law degrees (B.A. LL.B. / B.B.A. LL.B. / B.Sc. LL.B. via CLAT, AILET, and state law entrances) are open to any Class 12 stream, while Civil Services (UPSC CSE) require any recognised undergraduate degree.",
    quantitativeOrConceptExample:
      "Policy analysts evaluate social programmes using demographic rates, budget allocations, and cost-effectiveness ratios $\\text{CER} = \\frac{\\Delta \\text{Net Public Cost}}{\\Delta \\text{Social Outcome Units}}$.",
  },
  {
    id: "pure-sciences",
    title: "Pure Sciences, Research and Academia",
    subtitle: "Physics, Chemistry, Mathematics, Astronomy, Statistics & Interdisciplinary Research",
    summary:
      "Dedicated to discovering fundamental laws of nature and mathematics — pushing the boundaries of human knowledge in laboratories, observatories, and universities.",
    primaryDimensions: ["investigative", "realistic"],
    secondaryDimensions: ["conventional", "social"],
    alignedPreferences: ["theoretical", "independent", "analytical-systems"],
    exampleCareers: [
      "Research Scientist (Physics, Chemistry, Materials or Earth Sciences)",
      "Mathematician, Statistician & Quantitative Researcher",
      "Astrophysicist & Space Science Researcher",
      "University Professor & Academic Author",
      "R&D Specialist in National Laboratories (ISRO, BARC, CSIR, DRDO)",
    ],
    typicalActivities: [
      "Designing controlled experiments or mathematical proofs to test hypotheses",
      "Operating precision laboratory instruments, telescopes, or computational simulations",
      "Publishing findings, mentoring students, and collaborating with research groups",
    ],
    relevantSubjectsAndSkills: [
      "Physics, Chemistry, Mathematics, and Biology",
      "Deep conceptual curiosity, patience with long problems, and scientific computing",
      "Precision in measurement and error analysis",
    ],
    lowCostTrialActivity:
      "Take a familiar school experiment (like a pendulum, lens, or cooling curve), measure 10 data points at home, plot them, and investigate why real measurements differ slightly from the textbook formula.",
    eligibilityAndPathwayNote:
      "Integrated BS-MS and B.Sc. Honours programmes at IISERs (via IAT), IISc, NISER (via NEST), central universities (via CUET), and IITs provide dedicated pathways into scientific research.",
    quantitativeOrConceptExample:
      "Scientists test models against experimental uncertainty — for example, verifying whether reaction rate data fit the Arrhenius law $k = A e^{-E_a / (RT)}$.",
  },
  {
    id: "education-development",
    title: "Education and Human Development",
    subtitle: "School & Higher Education, Curriculum Design, EdTech Pedagogy & Special Education",
    summary:
      "Focuses on how people learn and grow — designing clear explanations, supportive classrooms, and accessible learning tools that unlock potential in others.",
    primaryDimensions: ["social", "artistic"],
    secondaryDimensions: ["investigative", "conventional"],
    alignedPreferences: ["people-centered", "collaborative", "exploratory"],
    exampleCareers: [
      "Subject Teacher & Academic Mentor",
      "Curriculum & Instructional Designer",
      "Educational Psychologist & Special Educator",
      "Academic Content Author & Science Communicator",
      "Education Policy & Non-Profit Programme Leader",
    ],
    typicalActivities: [
      "Breaking complex concepts into intuitive examples, analogies, and visual steps",
      "Diagnosing where a learner is stuck and adapting teaching strategies with patience",
      "Designing textbooks, assessments, or interactive learning resources",
    ],
    relevantSubjectsAndSkills: [
      "Strong command of your chosen subject (Science, Maths, Humanities, Languages, or Arts)",
      "Empathy, clear communication, and classroom facilitation",
      "Curriculum structuring and assessment design",
    ],
    lowCostTrialActivity:
      "Choose one topic you understand well, create a 1-page visual study sheet for a junior student, and walk them through it for 15 minutes to see which examples helped them most.",
    eligibilityAndPathwayNote:
      "Four-year Integrated Teacher Education Programmes (ITEP / B.A.-B.Ed. / B.Sc.-B.Ed. via NCET) or a subject bachelor's degree followed by B.Ed. / M.Ed. are open across streams.",
    quantitativeOrConceptExample:
      "Educators and learning scientists track mastery and spaced retention — often modelled by Ebbinghaus retention curves $R(t) = e^{-t / S}$ where review strengthens memory stability $S$.",
  },
  {
    id: "environment-life",
    title: "Environment, Agriculture and Life Sciences",
    subtitle: "Biotechnology, Ecology, Agricultural Science, Climate Sustainability & Food Systems",
    summary:
      "Connects biology, chemistry, and earth systems with hands-on field and lab work to protect ecosystems, improve crop resilience, and build sustainable food and climate solutions.",
    primaryDimensions: ["realistic", "investigative"],
    secondaryDimensions: ["social", "conventional"],
    alignedPreferences: ["hands-on", "analytical-systems", "exploratory"],
    exampleCareers: [
      "Biotechnologist & Genetic/Microbial Researcher",
      "Agricultural Scientist & Agronomy Specialist",
      "Environmental Scientist & Climate Sustainability Analyst",
      "Wildlife Ecologist, Forester & Conservation Biologist",
      "Food Technology & Nutrition Scientist",
    ],
    typicalActivities: [
      "Analysing soil, water, plant genetics, or microbial cultures in the lab and field",
      "Developing drought-resistant crops, clean water systems, or biodegradable materials",
      "Assessing environmental impact and advising communities or industries on sustainability",
    ],
    relevantSubjectsAndSkills: [
      "Biology, Chemistry, Environmental Studies, and Geography/Earth Science",
      "Field observation, laboratory technique, and ecological data analysis",
      "Systems thinking across climate, agriculture, and rural/urban livelihoods",
    ],
    lowCostTrialActivity:
      "Conduct a 7-day biodiversity or water/energy audit of your home or school campus and propose one practical, measurable conservation step.",
    eligibilityAndPathwayNote:
      "B.Sc. Agriculture, Forestry, Horticulture (via ICAR / CUET / state entrances), B.Sc./B.Tech Biotechnology, and Environmental Science degrees are accessible through PCB or PCMB subject combinations.",
    quantitativeOrConceptExample:
      "Ecologists and bioprocess scientists model population growth and resource capacity using logistic equations such as $\\frac{dN}{dt} = rN\\left(1 - \\frac{N}{K}\\right)$.",
  },
];

const LIKERT_SCALE_LABELS: {
  id: string;
  label: string;
  multiplier: number;
}[] = [
  { id: "1", label: "Strongly dislike", multiplier: 0 },
  { id: "2", label: "Dislike", multiplier: 0.25 },
  { id: "3", label: "Not sure / Neutral", multiplier: 0.5 },
  { id: "4", label: "Like", multiplier: 0.75 },
  { id: "5", label: "Strongly like", multiplier: 1.0 },
];

/**
 * Helper to create consistent 5-point Likert options.
 * Multipliers: Strongly dislike = 0, Dislike = 0.25, Neutral = 0.5, Like = 0.75, Strongly like = 1.0.
 * Base weight of 4 means clean integer steps: 0, 1, 2, 3, 4.
 */
function createLikertOptions(
  maxWeights: Partial<Record<InterestDimensionId, number>>,
  likedPreferenceTags: WorkPreferenceTag[] = []
): CareerAnswerOption[] {
  return LIKERT_SCALE_LABELS.map((item) => {
    const dimensionWeights: Partial<Record<InterestDimensionId, number>> = {};
    (Object.keys(maxWeights) as InterestDimensionId[]).forEach((dim) => {
      const base = maxWeights[dim] || 0;
      dimensionWeights[dim] = Number((base * item.multiplier).toFixed(2));
    });
    return {
      id: item.id,
      label: item.label,
      dimensionWeights,
      preferenceTags: item.multiplier >= 0.75 ? likedPreferenceTags : [],
    };
  });
}

export const CAREER_QUESTIONS: CareerQuestion[] = [
  // =========================================================================
  // PART 1: HANDS-ON BUILDING, NATURE & SCIENTIFIC INQUIRY (Questions 1–10)
  // =========================================================================
  {
    id: "cit-q01",
    number: 1,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Taking apart a household appliance, bicycle mechanism, or electronic kit to see how its physical parts fit and work together.",
    responseType: "likert-5",
    options: createLikertOptions(
      { realistic: 4, investigative: 1 },
      ["hands-on"]
    ),
    primaryDimensions: ["realistic"],
    maintainerNote:
      "Measures Realistic (4) with minor Investigative (1) contribution; tags hands-on preference when liked.",
  },
  {
    id: "cit-q02",
    number: 2,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Setting up and calibrating laboratory apparatus, sensors, or measurement tools to test whether a physical or chemical idea holds true.",
    responseType: "likert-5",
    options: createLikertOptions(
      { realistic: 4, investigative: 2 },
      ["hands-on", "analytical-systems"]
    ),
    primaryDimensions: ["realistic", "investigative"],
    maintainerNote:
      "Bridges Realistic (4) lab instrumentation and Investigative (2) experimental testing.",
  },
  {
    id: "cit-q03",
    number: 3,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Working outdoors on an environmental survey, botanical garden project, soil/water quality study, or sustainable farming experiment.",
    responseType: "likert-5",
    options: createLikertOptions(
      { realistic: 4, investigative: 1 },
      ["hands-on", "exploratory"]
    ),
    primaryDimensions: ["realistic"],
    maintainerNote:
      "Captures Realistic outdoor/life-science interest so Realistic is not narrowly equated with machinery alone.",
  },
  {
    id: "cit-q04",
    number: 4,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Building a working prototype — such as a wood/cardboard architectural model, a robotics arm, or a solar water heater — using hand tools or workshop equipment.",
    responseType: "likert-5",
    options: createLikertOptions(
      { realistic: 4, artistic: 1 },
      ["hands-on"]
    ),
    primaryDimensions: ["realistic"],
    maintainerNote:
      "Measures tangible prototyping (Realistic 4, Artistic 1).",
  },
  {
    id: "cit-q05",
    number: 5,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Troubleshooting why a computer network, sound system, or piece of hardware stopped working and fixing the fault step by step.",
    responseType: "likert-5",
    options: createLikertOptions(
      { realistic: 4, conventional: 1 },
      ["hands-on", "analytical-systems"]
    ),
    primaryDimensions: ["realistic"],
    maintainerNote:
      "Measures diagnostic technical troubleshooting (Realistic 4, Conventional 1).",
  },
  {
    id: "cit-q06",
    number: 6,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Investigating the underlying 'why' behind a natural phenomenon — such as why certain chemicals react reversibly or how celestial bodies move.",
    responseType: "likert-5",
    options: createLikertOptions(
      { investigative: 4 },
      ["theoretical", "analytical-systems"]
    ),
    primaryDimensions: ["investigative"],
    maintainerNote:
      "Core Investigative item (4) focusing on conceptual scientific curiosity rather than exam marks.",
  },
  {
    id: "cit-q07",
    number: 7,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Exploring how the human body responds to disease, nutrition, or medicine by reading biological case studies and diagnostic clues.",
    responseType: "likert-5",
    options: createLikertOptions(
      { investigative: 4, social: 1 },
      ["analytical-systems", "people-centered"]
    ),
    primaryDimensions: ["investigative"],
    maintainerNote:
      "Measures biological/medical inquiry (Investigative 4, Social 1).",
  },
  {
    id: "cit-q08",
    number: 8,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Looking for hidden patterns in numbers, datasets, or mathematical puzzles even when it takes patience to test different approaches.",
    responseType: "likert-5",
    options: createLikertOptions(
      { investigative: 4, conventional: 1 },
      ["theoretical", "independent"]
    ),
    primaryDimensions: ["investigative"],
    maintainerNote:
      "Measures mathematical/quantitative inquiry (Investigative 4, Conventional 1).",
  },
  {
    id: "cit-q09",
    number: 9,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Comparing different sources of evidence to understand a complex social, historical, or economic question before forming your own conclusion.",
    responseType: "likert-5",
    options: createLikertOptions(
      { investigative: 4, artistic: 1 },
      ["theoretical", "exploratory"]
    ),
    primaryDimensions: ["investigative"],
    maintainerNote:
      "Ensures Investigative also includes social science, history, and economic research (Investigative 4, Artistic 1).",
  },
  {
    id: "cit-q10",
    number: 10,
    sectionTitle: "Part 1 of 4 · Hands-On Systems & Scientific Curiosity",
    prompt:
      "Designing a controlled experiment or computer simulation to test what happens when you change one variable at a time.",
    responseType: "likert-5",
    options: createLikertOptions(
      { investigative: 4, realistic: 1 },
      ["analytical-systems", "hands-on"]
    ),
    primaryDimensions: ["investigative"],
    maintainerNote:
      "Measures experimental & simulation mindset (Investigative 4, Realistic 1).",
  },

  // =========================================================================
  // PART 2: CREATIVE EXPRESSION, DESIGN & HUMAN IMPACT (Questions 11–20)
  // =========================================================================
  {
    id: "cit-q11",
    number: 11,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Sketching visual layouts, posters, digital interfaces, or architectural spaces to make them both attractive and easy for people to use.",
    responseType: "likert-5",
    options: createLikertOptions(
      { artistic: 4, realistic: 1 },
      ["exploratory", "hands-on"]
    ),
    primaryDimensions: ["artistic"],
    maintainerNote:
      "Measures visual/spatial/UX design interest (Artistic 4, Realistic 1).",
  },
  {
    id: "cit-q12",
    number: 12,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Writing original stories, essays, scripts, poetry, or thoughtful articles that express ideas in your own voice.",
    responseType: "likert-5",
    options: createLikertOptions(
      { artistic: 4 },
      ["exploratory", "independent"]
    ),
    primaryDimensions: ["artistic"],
    maintainerNote:
      "Measures literary and expressive writing interest (Artistic 4).",
  },
  {
    id: "cit-q13",
    number: 13,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Creating short films, animations, photography series, music, or audio stories to communicate a mood or message.",
    responseType: "likert-5",
    options: createLikertOptions(
      { artistic: 4 },
      ["exploratory"]
    ),
    primaryDimensions: ["artistic"],
    maintainerNote:
      "Measures media, audio-visual, and performing arts interest (Artistic 4).",
  },
  {
    id: "cit-q14",
    number: 14,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Brainstorming unconventional ways to redesign an everyday product, school space, or communication campaign where there is no single textbook answer.",
    responseType: "likert-5",
    options: createLikertOptions(
      { artistic: 4, enterprising: 1 },
      ["exploratory", "collaborative"]
    ),
    primaryDimensions: ["artistic"],
    maintainerNote:
      "Measures open-ended divergent design thinking (Artistic 4, Enterprising 1).",
  },
  {
    id: "cit-q15",
    number: 15,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Exploring how language, visual symbols, and cultural traditions shape the way people think and feel.",
    responseType: "likert-5",
    options: createLikertOptions(
      { artistic: 4, social: 1 },
      ["theoretical", "people-centered"]
    ),
    primaryDimensions: ["artistic", "social"],
    maintainerNote:
      "Connects cultural/humanities appreciation with Artistic (4) and Social (1).",
  },
  {
    id: "cit-q16",
    number: 16,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Explaining a difficult topic to a younger student or classmate using patient examples until they feel confident.",
    responseType: "likert-5",
    options: createLikertOptions(
      { social: 4, artistic: 1 },
      ["people-centered", "collaborative"]
    ),
    primaryDimensions: ["social"],
    maintainerNote:
      "Measures teaching and pedagogical interest (Social 4, Artistic 1).",
  },
  {
    id: "cit-q17",
    number: 17,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Listening carefully to someone who is stressed or confused and helping them talk through their feelings and practical options.",
    responseType: "likert-5",
    options: createLikertOptions(
      { social: 4 },
      ["people-centered"]
    ),
    primaryDimensions: ["social"],
    maintainerNote:
      "Measures counselling, empathy, and supportive listening (Social 4).",
  },
  {
    id: "cit-q18",
    number: 18,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Caring for people's physical health, nutrition, rehabilitation, or first-aid needs in a clinic, hospital, or community camp.",
    responseType: "likert-5",
    options: createLikertOptions(
      { social: 4, realistic: 1 },
      ["people-centered", "hands-on"]
    ),
    primaryDimensions: ["social"],
    maintainerNote:
      "Measures direct healthcare and patient support motivation (Social 4, Realistic 1).",
  },
  {
    id: "cit-q19",
    number: 19,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Working with a community group, NGO, or local initiative to improve access to education, sanitation, or public awareness.",
    responseType: "likert-5",
    options: createLikertOptions(
      { social: 4, enterprising: 1 },
      ["people-centered", "collaborative"]
    ),
    primaryDimensions: ["social"],
    maintainerNote:
      "Measures social development and civic service interest (Social 4, Enterprising 1).",
  },
  {
    id: "cit-q20",
    number: 20,
    sectionTitle: "Part 2 of 4 · Creative Expression, Communication & People",
    prompt:
      "Helping two classmates or team members who disagree understand each other's point of view and reach a fair collaboration.",
    responseType: "likert-5",
    options: createLikertOptions(
      { social: 4, enterprising: 1 },
      ["people-centered", "collaborative"]
    ),
    primaryDimensions: ["social"],
    maintainerNote:
      "Measures mediation, interpersonal communication, and teamwork (Social 4, Enterprising 1).",
  },

  // =========================================================================
  // PART 3: LEADERSHIP, INITIATIVE, ORGANIZATION & SYSTEMS (Questions 21–30)
  // =========================================================================
  {
    id: "cit-q21",
    number: 21,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Taking the lead in organising a school event, club project, or tournament — assigning responsibilities and keeping everyone motivated.",
    responseType: "likert-5",
    options: createLikertOptions(
      { enterprising: 4, social: 1 },
      ["collaborative", "people-centered"]
    ),
    primaryDimensions: ["enterprising"],
    maintainerNote:
      "Measures team leadership and event coordination (Enterprising 4, Social 1).",
  },
  {
    id: "cit-q22",
    number: 22,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Spotting a practical need in your neighbourhood or school and pitching a small project, service, or student venture to solve it.",
    responseType: "likert-5",
    options: createLikertOptions(
      { enterprising: 4, artistic: 1 },
      ["exploratory", "collaborative"]
    ),
    primaryDimensions: ["enterprising"],
    maintainerNote:
      "Measures entrepreneurial initiative and opportunity spotting (Enterprising 4, Artistic 1).",
  },
  {
    id: "cit-q23",
    number: 23,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Debating public policy, constitutional rights, ethical dilemmas, or civic rules using structured arguments and evidence.",
    responseType: "likert-5",
    options: createLikertOptions(
      { enterprising: 4, investigative: 1 },
      ["people-centered", "theoretical"]
    ),
    primaryDimensions: ["enterprising"],
    maintainerNote:
      "Measures advocacy, law, and public policy interest (Enterprising 4, Investigative 1).",
  },
  {
    id: "cit-q24",
    number: 24,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Negotiating sponsorships, presenting a project proposal to a panel, or persuading people to support a new idea.",
    responseType: "likert-5",
    options: createLikertOptions(
      { enterprising: 4 },
      ["collaborative", "people-centered"]
    ),
    primaryDimensions: ["enterprising"],
    maintainerNote:
      "Measures persuasion and presentation confidence (Enterprising 4).",
  },
  {
    id: "cit-q25",
    number: 25,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Following how businesses, startups, and economic policies grow, compete, and adapt to changing consumer needs.",
    responseType: "likert-5",
    options: createLikertOptions(
      { enterprising: 4, conventional: 1 },
      ["analytical-systems"]
    ),
    primaryDimensions: ["enterprising"],
    maintainerNote:
      "Measures commercial and strategic business curiosity (Enterprising 4, Conventional 1).",
  },
  {
    id: "cit-q26",
    number: 26,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Creating a clear budget, expense tracker, or financial plan for a family event, student club, or personal savings goal.",
    responseType: "likert-5",
    options: createLikertOptions(
      { conventional: 4, enterprising: 1 },
      ["structured", "analytical-systems"]
    ),
    primaryDimensions: ["conventional"],
    maintainerNote:
      "Measures financial planning and budgeting interest (Conventional 4, Enterprising 1).",
  },
  {
    id: "cit-q27",
    number: 27,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Organising complex information into clean spreadsheets, tables, catalogues, or databases so nothing is lost or miscalculated.",
    responseType: "likert-5",
    options: createLikertOptions(
      { conventional: 4 },
      ["structured", "independent"]
    ),
    primaryDimensions: ["conventional"],
    maintainerNote:
      "Measures data organisation and systematic accuracy (Conventional 4).",
  },
  {
    id: "cit-q28",
    number: 28,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Checking calculations, legal rules, safety checklists, or accounting records carefully to spot errors and ensure fairness.",
    responseType: "likert-5",
    options: createLikertOptions(
      { conventional: 4, investigative: 1 },
      ["structured", "analytical-systems"]
    ),
    primaryDimensions: ["conventional"],
    maintainerNote:
      "Measures auditing, quality assurance, and regulatory compliance interest (Conventional 4, Investigative 1).",
  },
  {
    id: "cit-q29",
    number: 29,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Planning step-by-step schedules, logistics, and resource checklists so a large project runs smoothly and finishes on time.",
    responseType: "likert-5",
    options: createLikertOptions(
      { conventional: 4, enterprising: 1 },
      ["structured", "collaborative"]
    ),
    primaryDimensions: ["conventional"],
    maintainerNote:
      "Measures operational planning and logistics coordination (Conventional 4, Enterprising 1).",
  },
  {
    id: "cit-q30",
    number: 30,
    sectionTitle: "Part 3 of 4 · Leadership, Initiative & Structured Systems",
    prompt:
      "Working with clear procedures, data rules, or classification systems to maintain accurate records in a bank, research lab, or public office.",
    responseType: "likert-5",
    options: createLikertOptions(
      { conventional: 4 },
      ["structured"]
    ),
    primaryDimensions: ["conventional"],
    maintainerNote:
      "Measures institutional systems and structured procedural preference (Conventional 4).",
  },

  // =========================================================================
  // PART 4: REAL-WORLD SCENARIOS & WORK/LEARNING PREFERENCES (Questions 31–40)
  // =========================================================================
  {
    id: "cit-q31",
    number: 31,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "Your school is hosting an annual inter-school exhibition on 'Sustainable Cities'. Which role would you most enjoy taking?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "Building the working solar-grid or water-filtration scale model in the workshop.",
        dimensionWeights: { realistic: 3, investigative: 2 },
        preferenceTags: ["hands-on", "analytical-systems"],
      },
      {
        id: "B",
        label: "Analysing real city pollution and energy data to prove which solution works best.",
        dimensionWeights: { investigative: 3, conventional: 2 },
        preferenceTags: ["theoretical", "analytical-systems"],
      },
      {
        id: "C",
        label: "Designing the visual posters, interactive storyboards, and exhibition layout.",
        dimensionWeights: { artistic: 3, social: 1 },
        preferenceTags: ["exploratory", "hands-on"],
      },
      {
        id: "D",
        label: "Welcoming visitors, coordinating the team schedule, and presenting to the judges.",
        dimensionWeights: { enterprising: 3, social: 2 },
        preferenceTags: ["collaborative", "people-centered"],
      },
    ],
    primaryDimensions: ["realistic", "investigative", "artistic", "enterprising"],
    maintainerNote:
      "Situational item mapping exhibition role preference to Realistic/Investigative, Investigative/Conventional, Artistic/Social, or Enterprising/Social.",
  },
  {
    id: "cit-q32",
    number: 32,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "When you are learning a completely new topic, which approach helps you feel most engaged?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "Trying a hands-on experiment, physical model, or practical demonstration first.",
        dimensionWeights: { realistic: 3, investigative: 1 },
        preferenceTags: ["hands-on"],
      },
      {
        id: "B",
        label: "Understanding the deep logical proof, scientific theory, or root cause behind it.",
        dimensionWeights: { investigative: 3 },
        preferenceTags: ["theoretical", "independent"],
      },
      {
        id: "C",
        label: "Connecting it to human stories, creative visuals, or group discussions.",
        dimensionWeights: { artistic: 2, social: 2 },
        preferenceTags: ["exploratory", "people-centered"],
      },
      {
        id: "D",
        label: "Following a well-organised step-by-step framework with clear rules and examples.",
        dimensionWeights: { conventional: 3, enterprising: 1 },
        preferenceTags: ["structured"],
      },
    ],
    primaryDimensions: ["realistic", "investigative", "artistic", "conventional"],
    maintainerNote:
      "Captures practical vs. theoretical vs. expressive vs. structured learning preference.",
  },
  {
    id: "cit-q33",
    number: 33,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "Imagine a local community health clinic is facing long waiting times for patients. Which contribution appeals to you most?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "Assisting clinicians directly with patient triage, comfort, and health education.",
        dimensionWeights: { social: 3, investigative: 2 },
        preferenceTags: ["people-centered", "hands-on"],
      },
      {
        id: "B",
        label: "Reorganising the appointment booking, record-keeping, and pharmacy inventory flow.",
        dimensionWeights: { conventional: 3, enterprising: 2 },
        preferenceTags: ["structured", "analytical-systems"],
      },
      {
        id: "C",
        label: "Setting up and maintaining the clinic's diagnostic devices and digital kiosk hardware.",
        dimensionWeights: { realistic: 3, investigative: 1 },
        preferenceTags: ["hands-on", "analytical-systems"],
      },
      {
        id: "D",
        label: "Creating clear, multilingual visual signboards and illustrated health guides for families.",
        dimensionWeights: { artistic: 3, social: 2 },
        preferenceTags: ["exploratory", "people-centered"],
      },
    ],
    primaryDimensions: ["social", "conventional", "realistic", "artistic"],
    maintainerNote:
      "Demonstrates how different interest profiles contribute to the same real-world healthcare setting.",
  },
  {
    id: "cit-q34",
    number: 34,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "What kind of daily work environment do you picture yourself enjoying most in the future?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "A workshop, engineering lab, hospital floor, or outdoor field site with active practical work.",
        dimensionWeights: { realistic: 3, investigative: 1 },
        preferenceTags: ["hands-on"],
      },
      {
        id: "B",
        label: "A quiet research lab, library, or analytical workspace where I can think deeply through complex problems.",
        dimensionWeights: { investigative: 3, conventional: 1 },
        preferenceTags: ["independent", "theoretical"],
      },
      {
        id: "C",
        label: "A collaborative studio, classroom, or counselling space focused on creativity and human growth.",
        dimensionWeights: { artistic: 2, social: 3 },
        preferenceTags: ["collaborative", "people-centered", "exploratory"],
      },
      {
        id: "D",
        label: "A dynamic office, courtroom, or project hub where teams coordinate strategy, finance, or policy.",
        dimensionWeights: { enterprising: 3, conventional: 2 },
        preferenceTags: ["collaborative", "structured"],
      },
    ],
    primaryDimensions: ["realistic", "investigative", "social", "enterprising"],
    maintainerNote:
      "Captures preferred work environment across physical/field, research, creative/social, and organizational/policy settings.",
  },
  {
    id: "cit-q35",
    number: 35,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "When working on a month-long assignment or project, how do you prefer to collaborate?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "I enjoy independent deep focus where I am responsible for solving a technical or analytical piece.",
        dimensionWeights: { investigative: 2, realistic: 2 },
        preferenceTags: ["independent", "analytical-systems"],
      },
      {
        id: "B",
        label: "I enjoy brainstorming and mentoring closely with a small group of people.",
        dimensionWeights: { social: 3, artistic: 1 },
        preferenceTags: ["collaborative", "people-centered"],
      },
      {
        id: "C",
        label: "I enjoy coordinating the overall team direction, milestones, and final presentation.",
        dimensionWeights: { enterprising: 3, conventional: 1 },
        preferenceTags: ["collaborative", "structured"],
      },
      {
        id: "D",
        label: "I enjoy keeping the project's data, documentation, and quality checks accurate and organised.",
        dimensionWeights: { conventional: 3, investigative: 1 },
        preferenceTags: ["structured", "independent"],
      },
    ],
    primaryDimensions: ["investigative", "social", "enterprising", "conventional"],
    maintainerNote:
      "Measures collaboration vs. independent work style alongside RIASEC weights.",
  },
  {
    id: "cit-q36",
    number: 36,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "If you had two free hours on a Sunday afternoon to explore a documentary or workshop, which topic would you pick first?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "How spacecraft, renewable energy grids, or modern bridges are engineered and tested.",
        dimensionWeights: { realistic: 3, investigative: 2 },
        preferenceTags: ["hands-on", "analytical-systems"],
      },
      {
        id: "B",
        label: "How the human brain forms memories, how vaccines work, or how ecosystems adapt to climate change.",
        dimensionWeights: { investigative: 3, social: 1 },
        preferenceTags: ["theoretical", "exploratory"],
      },
      {
        id: "C",
        label: "How filmmakers, architects, and designers turn abstract ideas into iconic works.",
        dimensionWeights: { artistic: 3 },
        preferenceTags: ["exploratory"],
      },
      {
        id: "D",
        label: "How economic policies, legal landmarks, and entrepreneurs transformed modern societies.",
        dimensionWeights: { enterprising: 2, conventional: 2, social: 1 },
        preferenceTags: ["structured", "people-centered"],
      },
    ],
    primaryDimensions: ["realistic", "investigative", "artistic", "enterprising"],
    maintainerNote:
      "Measures intrinsic curiosity when free from exam or syllabus pressure.",
  },
  {
    id: "cit-q37",
    number: 37,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "Suppose a student group wants to launch a community book-and-learning library. Which task would you volunteer for first?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "Designing and assembling the shelving, reading corners, and lighting layout.",
        dimensionWeights: { realistic: 3, artistic: 2 },
        preferenceTags: ["hands-on", "exploratory"],
      },
      {
        id: "B",
        label: "Setting up the digital catalogue, borrowing rules, and budget spreadsheet.",
        dimensionWeights: { conventional: 3, realistic: 1 },
        preferenceTags: ["structured", "analytical-systems"],
      },
      {
        id: "C",
        label: "Running weekly reading circles and tutoring sessions for younger children.",
        dimensionWeights: { social: 3, artistic: 1 },
        preferenceTags: ["people-centered", "collaborative"],
      },
      {
        id: "D",
        label: "Reaching out to local donors, school principals, and partners to expand the library.",
        dimensionWeights: { enterprising: 3, social: 1 },
        preferenceTags: ["collaborative", "people-centered"],
      },
    ],
    primaryDimensions: ["realistic", "conventional", "social", "enterprising"],
    maintainerNote:
      "Situational task selection distinguishing Realistic/Artistic, Conventional, Social, and Enterprising contributions.",
  },
  {
    id: "cit-q38",
    number: 38,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "When you face an unfamiliar problem with no obvious instructions, what is your natural first instinct?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "Break it into variables, gather facts, and test a logical hypothesis.",
        dimensionWeights: { investigative: 3, conventional: 1 },
        preferenceTags: ["analytical-systems", "theoretical"],
      },
      {
        id: "B",
        label: "Try building or sketching a rough version right away and learn by adjusting it.",
        dimensionWeights: { realistic: 2, artistic: 2 },
        preferenceTags: ["hands-on", "exploratory"],
      },
      {
        id: "C",
        label: "Talk with people affected by the problem to understand their perspective and needs.",
        dimensionWeights: { social: 3, enterprising: 1 },
        preferenceTags: ["people-centered", "collaborative"],
      },
      {
        id: "D",
        label: "Organise what we already know into a structured checklist and rally a group to tackle it.",
        dimensionWeights: { conventional: 2, enterprising: 2 },
        preferenceTags: ["structured", "collaborative"],
      },
    ],
    primaryDimensions: ["investigative", "realistic", "social", "conventional"],
    maintainerNote:
      "Measures problem-solving style across analytical, prototyping, human-centered, and structured/organizational approaches.",
  },
  {
    id: "cit-q39",
    number: 39,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "How do you feel about exploring interdisciplinary career paths that combine two different fields (for example, Biology + Data Science, Law + Technology, or Design + Business)?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "I am very excited to combine scientific or technical skills with creative or social fields.",
        dimensionWeights: { investigative: 2, artistic: 2, social: 1 },
        preferenceTags: ["exploratory", "analytical-systems"],
      },
      {
        id: "B",
        label: "I like combining practical engineering or science with business, policy, or entrepreneurship.",
        dimensionWeights: { realistic: 2, enterprising: 2, investigative: 1 },
        preferenceTags: ["hands-on", "collaborative"],
      },
      {
        id: "C",
        label: "I prefer focusing deeply on one well-defined professional track with clear milestones.",
        dimensionWeights: { conventional: 3, investigative: 1 },
        preferenceTags: ["structured", "independent"],
      },
      {
        id: "D",
        label: "I am still open and curious — I want to test a few small projects before narrowing down.",
        dimensionWeights: { social: 2, artistic: 1, enterprising: 1 },
        preferenceTags: ["exploratory", "people-centered"],
      },
    ],
    primaryDimensions: ["investigative", "artistic", "enterprising", "conventional"],
    maintainerNote:
      "Captures willingness to explore interdisciplinary vs. structured single-track career pathways.",
  },
  {
    id: "cit-q40",
    number: 40,
    sectionTitle: "Part 4 of 4 · Real-World Scenarios & Learning Preferences",
    prompt:
      "Looking ahead to the next few years of study and work, what kind of impact would make you feel proudest of your effort?",
    responseType: "situational",
    options: [
      {
        id: "A",
        label: "Discovering new scientific knowledge or building reliable technology and infrastructure.",
        dimensionWeights: { investigative: 2, realistic: 3 },
        preferenceTags: ["hands-on", "analytical-systems"],
      },
      {
        id: "B",
        label: "Directly improving people's health, education, emotional wellbeing, or social fairness.",
        dimensionWeights: { social: 3, investigative: 1 },
        preferenceTags: ["people-centered", "collaborative"],
      },
      {
        id: "C",
        label: "Creating original designs, media, literature, or spaces that inspire and inform people.",
        dimensionWeights: { artistic: 3, social: 1 },
        preferenceTags: ["exploratory", "independent"],
      },
      {
        id: "D",
        label: "Leading resilient organisations, ethical financial systems, or public institutions.",
        dimensionWeights: { enterprising: 2, conventional: 3 },
        preferenceTags: ["structured", "collaborative"],
      },
    ],
    primaryDimensions: ["realistic", "social", "artistic", "conventional"],
    maintainerNote:
      "Captures core intrinsic motivation without relying on salary, popularity, or parental pressure.",
  },
];

export interface DatasetValidationResult {
  valid: boolean;
  questionCount: number;
  clusterCount: number;
  dimensionCount: number;
  errors: string[];
}

export function validateCareerAssessmentDataset(
  questions: CareerQuestion[] = CAREER_QUESTIONS,
  clusters: CareerClusterDefinition[] = CAREER_CLUSTERS,
  dimensions: InterestDimensionMeta[] = INTEREST_DIMENSIONS
): DatasetValidationResult {
  const errors: string[] = [];

  if (questions.length !== 40) {
    errors.push(`Expected exactly 40 questions, found ${questions.length}.`);
  }

  const seenIds = new Set<string>();
  const seenPrompts = new Set<string>();
  const validDimensionIds = new Set<InterestDimensionId>(
    dimensions.map((d) => d.id)
  );

  questions.forEach((q, idx) => {
    if (!q.id || !q.id.trim()) {
      errors.push(`Question at index ${idx} is missing a stable id.`);
    } else if (seenIds.has(q.id)) {
      errors.push(`Duplicate question id detected: ${q.id}.`);
    } else {
      seenIds.add(q.id);
    }

    if (q.number !== idx + 1) {
      errors.push(
        `Question ${q.id} has number ${q.number}, expected ${idx + 1}.`
      );
    }

    const cleanPrompt = (q.prompt || "").trim();
    if (cleanPrompt.length < 15) {
      errors.push(`Question ${q.id} has an empty or too-short prompt.`);
    } else if (seenPrompts.has(cleanPrompt.toLowerCase())) {
      errors.push(`Duplicate question prompt detected in ${q.id}.`);
    } else {
      seenPrompts.add(cleanPrompt.toLowerCase());
    }

    if (q.responseType !== "likert-5" && q.responseType !== "situational") {
      errors.push(`Question ${q.id} has invalid responseType: ${q.responseType}.`);
    }

    if (!Array.isArray(q.options) || q.options.length < 4) {
      errors.push(`Question ${q.id} must have at least 4 valid response options.`);
    } else {
      const optionIds = new Set<string>();
      let hasPositiveWeight = false;

      q.options.forEach((opt) => {
        if (!opt.id || optionIds.has(opt.id)) {
          errors.push(`Question ${q.id} has duplicate or missing option id.`);
        }
        optionIds.add(opt.id);

        if (!opt.label || !opt.label.trim()) {
          errors.push(`Question ${q.id} option ${opt.id} is missing label text.`);
        }

        const weights = opt.dimensionWeights || {};
        Object.entries(weights).forEach(([dimKey, val]) => {
          if (!validDimensionIds.has(dimKey as InterestDimensionId)) {
            errors.push(
              `Question ${q.id} option ${opt.id} references invalid dimension ${dimKey}.`
            );
          }
          if (typeof val !== "number" || Number.isNaN(val) || val < 0) {
            errors.push(
              `Question ${q.id} option ${opt.id} has invalid weight for ${dimKey}.`
            );
          }
          if (typeof val === "number" && val > 0) {
            hasPositiveWeight = true;
          }
        });
      });

      if (!hasPositiveWeight) {
        errors.push(`Question ${q.id} has no positive scoring weights across its options.`);
      }
    }
  });

  if (clusters.length < 10) {
    errors.push(`Expected 10 career clusters, found ${clusters.length}.`);
  }

  return {
    valid: errors.length === 0,
    questionCount: questions.length,
    clusterCount: clusters.length,
    dimensionCount: dimensions.length,
    errors,
  };
}
