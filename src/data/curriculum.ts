import {
  Subject,
  Topic,
  Question,
  MockTestDefinition,
  StudentLearningState,
  StudentProfile,
  TargetExam,
  ClassLevel,
  StudyTask,
} from "../types/domain";

export const SYLLABUS_DATASET_NOTICE =
  "Curated Illustrative Study Dataset — Organised around common Class 11 & 12 NCERT concepts for JEE Main, JEE Advanced, and NEET UG. Structured so an expanded full-syllabus dataset can be added directly.";

export const SUBJECTS: Subject[] = [
  {
    id: "physics",
    name: "Physics",
    shortCode: "PHY",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    description:
      "Shared conceptual foundation for both JEE and NEET covering Mechanics, Electrostatics, Magnetism, Optics, and Modern Physics.",
    chapters: [
      {
        id: "phy-11-kinematics",
        subjectId: "physics",
        classLevel: "11",
        applicableExams: [
          "JEE Main",
          "JEE Advanced",
          "JEE Main + Advanced",
          "NEET UG",
        ],
        number: 1,
        title: "Motion in a Plane & Projectile Kinematics",
        examWeightage: "Shared JEE & NEET Foundation · 1 to 2 questions",
        summary:
          "Independent horizontal and vertical components of 2D motion under gravity, parabolic trajectory equation, complementary launch angles, and apex energy.",
        topicIds: ["topic-projectile-motion"],
      },
      {
        id: "phy-12-electrostatics",
        subjectId: "physics",
        classLevel: "12",
        applicableExams: [
          "JEE Main",
          "JEE Advanced",
          "JEE Main + Advanced",
          "NEET UG",
        ],
        number: 2,
        title: "Electric Charges, Fields & Gauss's Law",
        examWeightage: "High Priority in JEE & NEET · 2 to 3 questions",
        summary:
          "Coulomb's vector law, electric field lines, electric dipole torque, and symmetric flux calculations using Gauss's Law.",
        topicIds: ["topic-gauss-law", "topic-dipole-field"],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    shortCode: "CHEM",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    description:
      "Shared Physical, Inorganic, and Organic Chemistry concepts across JEE and NEET with emphasis on Equilibrium and Electrochemistry.",
    chapters: [
      {
        id: "chem-11-equilibrium",
        subjectId: "chemistry",
        classLevel: "11",
        applicableExams: [
          "JEE Main",
          "JEE Advanced",
          "JEE Main + Advanced",
          "NEET UG",
        ],
        number: 1,
        title: "Chemical Equilibrium & Le Chatelier's Principle",
        examWeightage: "Shared JEE & NEET Core · 2 questions",
        summary:
          "Law of mass action, Kp and Kc relationship, reaction quotient Q, and predicting equilibrium shifts under temperature, pressure, or inert gas addition.",
        topicIds: ["topic-le-chatelier"],
      },
      {
        id: "chem-12-electrochemistry",
        subjectId: "chemistry",
        classLevel: "12",
        applicableExams: [
          "JEE Main",
          "JEE Advanced",
          "JEE Main + Advanced",
          "NEET UG",
        ],
        number: 2,
        title: "Electrochemistry & Nernst Equation",
        examWeightage: "High Priority · 2 to 3 questions",
        summary:
          "Galvanic cells, standard electrode potential, Nernst equation at 298 K, and Gibbs free energy relationship with equilibrium constant.",
        topicIds: ["topic-nernst-equation"],
      },
    ],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    shortCode: "MATH",
    applicableExams: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    description:
      "JEE Main and JEE Advanced Calculus, Algebra, Coordinate Geometry, Vectors, and 3D Geometry.",
    chapters: [
      {
        id: "math-11-quadratics",
        subjectId: "mathematics",
        classLevel: "11",
        applicableExams: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
        number: 1,
        title: "Quadratic Equations & Nature of Roots",
        examWeightage: "JEE Core Algebra · 1 to 2 questions",
        summary:
          "Discriminant analysis, Vieta's sum and product of roots relations, symmetric root expressions, and location of roots on the real line.",
        topicIds: ["topic-quadratic-roots"],
      },
      {
        id: "math-12-calculus",
        subjectId: "mathematics",
        classLevel: "12",
        applicableExams: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
        number: 2,
        title: "Definite Integration & Symmetry Properties",
        examWeightage: "Very High Priority in JEE · 2 to 3 questions",
        summary:
          "Fundamental theorem of calculus, King's property of definite integrals, even-odd symmetry on [−a, a], and bounded area calculation.",
        topicIds: ["topic-definite-integrals"],
      },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    shortCode: "BIO",
    applicableExams: ["NEET UG"],
    description:
      "NEET UG Botany and Zoology built around NCERT Human Physiology, Genetics, Cell Biology, and Plant Physiology.",
    chapters: [
      {
        id: "bio-11-respiration",
        subjectId: "biology",
        classLevel: "11",
        applicableExams: ["NEET UG"],
        number: 1,
        title: "Breathing, Exchange of Gases & Bohr Effect",
        examWeightage: "NEET UG High-Yield Physiology · 3 questions",
        summary:
          "Alveolar gas exchange, partial pressures of O₂ and CO₂, haemoglobin saturation curve, and physiological shifts in active tissues.",
        topicIds: ["topic-bohr-effect"],
      },
      {
        id: "bio-12-genetics",
        subjectId: "biology",
        classLevel: "12",
        applicableExams: ["NEET UG"],
        number: 2,
        title: "Molecular Basis of Inheritance & DNA Packaging",
        examWeightage: "NEET UG Highest Weightage · 4 to 5 questions",
        summary:
          "Chargaff's base-equivalence rules, B-DNA pitch and base-pair spacing, nucleosome histone octamer, and semi-conservative replication.",
        topicIds: ["topic-dna-structure"],
      },
    ],
  },
];

export const TOPICS: Topic[] = [
  {
    id: "topic-gauss-law",
    chapterId: "phy-12-electrostatics",
    subjectId: "physics",
    classLevel: "12",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    title: "Gauss's Law & Symmetric Electric Flux",
    estimatedMinutes: 25,
    difficulty: "Exam Core",
    summary:
      "Understand how enclosed charge determines net electric flux through any closed surface, and why symmetry lets us find the electric field in one step.",
    learningObjectives: [
      "Calculate electric flux through flat and closed 3D surfaces using Φ = ∮ E · dA.",
      "Distinguish between the role of enclosed charges (which determine net flux) and external charges (which affect E at points on the surface but contribute zero net flux).",
      "Use cube and sphere symmetry to find flux through individual faces without integration.",
    ],
    intuitiveIntro:
      "Imagine placing a small light bulb inside a closed paper lantern. Whether the lantern is a small sphere, a large sphere, or a cube, the total amount of light escaping through the entire closed surface depends only on the brightness of the bulb inside — not on the lantern's shape or size. Gauss's Law states this exact conservation rule for electric field lines.",
    definitionsAndFormulas: [
      {
        term: "Differential Electric Flux",
        formula: "dΦ = E · dA = E dA cos θ",
        meaning:
          "Flux through a tiny area element dA where θ is the angle between electric field E and the outward normal vector dA.",
      },
      {
        term: "Gauss's Law (Integral Form)",
        formula: "Φ_net = ∮ E · dA = q_enclosed / ε_0",
        meaning:
          "Total outward electric flux through any closed Gaussian surface equals net enclosed charge divided by permittivity of free space.",
      },
      {
        term: "Cube Face Symmetry",
        formula: "Φ_one_face = Q / (6 ε_0)",
        meaning:
          "When a point charge +Q sits at the exact geometric centre of a cube, equal flux passes through each of its 6 identical square faces.",
      },
    ],
    keyTakeaways: [
      "Net flux through a closed surface depends only on enclosed charge: Φ_net = q_enclosed / ε_0.",
      "Charges outside the Gaussian surface affect the electric field E at the surface, but contribute zero net flux.",
      "Flux is independent of the radius or shape of the closed surface as long as it encloses the same net charge.",
    ],
    conceptSections: [
      {
        heading: "1. What Electric Flux Really Measures",
        explanation:
          "Hold a rectangular frame in a steady stream of water. The water volume passing through per second depends on stream speed, frame area, and tilt angle. Electric flux measures how many electric field lines pierce a surface. For a closed 3D surface, outward-pointing field lines count as positive flux (+Φ) and inward-pointing lines count as negative flux (−Φ).",
        formulaHighlight: "dΦ = E dA cos θ   (SI Unit: N·m^2/C or V·m)",
        examTip:
          "Always measure θ between the electric field vector E and the normal (perpendicular) vector to the surface — not the angle with the surface plane itself.",
      },
      {
        heading: "2. Why External Charges Give Zero Net Flux",
        explanation:
          "Suppose a positive charge sits outside a closed hollow sphere. Its electric field lines pierce into the sphere on the near side (negative flux) and exit out of the sphere on the far side (positive flux). Because no field lines start or end inside the empty cavity, every line that enters must leave, cancelling to zero net flux.",
        formulaHighlight: "Φ_net = (q_inside_1 + q_inside_2 + ...) / ε_0",
        examTip:
          "If an electric dipole (+q and −q) is completely enclosed inside a box, q_enclosed = +q − q = 0, so the net flux through the box is strictly zero.",
      },
    ],
    simulation: {
      type: "electrostatics-flux",
      title: "Interactive Gaussian Sphere Explorer",
      caption:
        "Adjust the enclosed charge q_in and the Gaussian sphere radius R. Watch how the electric field strength changes with radius while the total outward flux stays locked to q_in.",
      parameterLabel: "Enclosed Charge (q_in)",
      unit: "μC",
      min: -6,
      max: 6,
      step: 1,
      defaultValue: 3,
      secondaryLabel: "Gaussian Radius (R)",
      secondaryMin: 1,
      secondaryMax: 5,
      secondaryDefault: 2,
      secondaryUnit: "m",
    },
    workedExamples: [
      {
        id: "we-gauss-cube",
        title: "Point Charge at the Centre vs Corner of a Cube",
        examTag: "Illustrative JEE & NEET Example",
        problemStatement:
          "A point charge +Q is placed at the exact geometric centre of a cube of side a. Find the electric flux passing through (i) the entire cube, and (ii) any one square face of the cube.",
        givenData: [
          "Enclosed charge at centre = +Q",
          "Number of identical square faces = 6",
        ],
        steps: [
          {
            stepTitle: "Apply Gauss's Law to the closed cube",
            detail:
              "Because the cube is a closed 3D surface completely surrounding +Q, total flux is directly given by Gauss's Law.",
            formula: "Φ_total = Q / ε_0",
          },
          {
            stepTitle: "Use symmetry for a single face",
            detail:
              "The charge is equidistant from all 6 identical square faces, so equal flux passes through each face.",
            formula: "Φ_one_face = Φ_total / 6 = Q / (6 ε_0)",
          },
        ],
        finalAnswer: "Total flux = Q / ε_0 ; Flux through one face = Q / (6 ε_0)",
        commonMistakeNote:
          "If +Q is placed at one corner (vertex) of a cube instead of the centre, 8 identical cubes are required to surround the charge symmetrically. Total flux through one cube becomes Q / (8 ε_0), shared equally across the 3 faces that do not touch the charge — giving Q / (24 ε_0) per non-adjacent face.",
      },
    ],
    knowledgeCheck: {
      id: "kc-gauss",
      prompt:
        "Quick Check: If we double the radius R of a spherical Gaussian surface surrounding a point charge +q, what happens to the total electric flux Φ through the sphere?",
      options: [
        { id: "A", text: "It remains unchanged (Φ = q / ε₀)" },
        { id: "B", text: "It decreases to one-fourth because E ∝ 1/R²" },
        { id: "C", text: "It quadruples because surface area A = 4πR²" },
      ],
      correctId: "A",
      reinforcement:
        "Surface area increases by 4× while electric field E decreases by 4×, so their product (total flux Φ = q / ε₀) stays completely unchanged!",
    },
  },
  {
    id: "topic-dipole-field",
    chapterId: "phy-12-electrostatics",
    subjectId: "physics",
    classLevel: "12",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    title: "Electric Dipole Field & Torque in Uniform Field",
    estimatedMinutes: 20,
    difficulty: "Exam Core",
    summary:
      "Compare axial and equatorial electric fields of a short dipole and calculate potential energy and torque in an external field.",
    learningObjectives: [
      "Define electric dipole moment p = q(2a) and its direction from −q to +q.",
      "Compare the magnitude and direction of E_axial and E_equatorial for a short dipole (r >> a).",
      "Calculate torque τ = p × E and work done in rotating a dipole in a uniform electric field.",
    ],
    intuitiveIntro:
      "Water molecules (H₂O) and HCl molecules have a slight separation between their positive and negative charge centres. Even though their total charge is zero, they still create an electric field nearby and twist to align when placed in an external electric field — just like a compass needle in a magnetic field.",
    definitionsAndFormulas: [
      {
        term: "Electric Dipole Moment",
        formula: "p = q × (2a)   (Directed from −q to +q)",
        meaning: "Product of magnitude of either charge and separation distance 2a.",
      },
      {
        term: "Short Dipole Axial vs Equatorial Field",
        formula: "E_axial = 2kp / r^3   ;   E_equatorial = kp / r^3",
        meaning:
          "At distance r >> a, axial field is twice the equatorial field and points along p, while equatorial field points opposite to p.",
      },
      {
        term: "Torque & Potential Energy",
        formula: "τ = p E sin θ   ;   U(θ) = −p E cos θ",
        meaning:
          "Stable equilibrium occurs at θ = 0° (U = −pE) and unstable equilibrium at θ = 180° (U = +pE).",
      },
    ],
    keyTakeaways: [
      "Dipole moment vector p = q × (2a) always points from negative charge (−q) to positive charge (+q).",
      "For a short dipole (r >> a), E_axial = 2kp / r^3 (parallel to p) and E_equatorial = kp / r^3 (antiparallel to p).",
      "Torque τ = p E sin θ and Potential Energy U = −p E cos θ.",
    ],
    conceptSections: [
      {
        heading: "1. Axial vs Equatorial Field Ratio",
        explanation:
          "At the same distance r from the centre of a short electric dipole, the electric field on the axial line is twice as strong as the field on the equatorial bisector, and points in the exact opposite direction.",
        formulaHighlight: "E_axial = −2 E_equatorial   (for r >> a)",
        examTip:
          "Unlike a single point charge where E falls off as 1/r², a dipole's electric field falls off faster as 1/r³ because the +q and −q fields partially cancel at large distances.",
      },
    ],
    simulation: {
      type: "electrostatics-flux",
      title: "Field Line Intensity Explorer",
      caption:
        "Explore how charge magnitude and observation distance control field strength.",
      parameterLabel: "Dipole Charge Magnitude",
      unit: "μC",
      min: 1,
      max: 6,
      step: 1,
      defaultValue: 4,
      secondaryLabel: "Observation Distance (r)",
      secondaryMin: 1,
      secondaryMax: 5,
      secondaryDefault: 2,
      secondaryUnit: "m",
    },
    workedExamples: [
      {
        id: "we-dipole-torque",
        title: "Work Done in Rotating an Electric Dipole by 180°",
        examTag: "Illustrative NEET & JEE Example",
        problemStatement:
          "An electric dipole of dipole moment p is aligned in stable equilibrium with a uniform electric field E. Find the external work required to rotate it slowly by 180°.",
        givenData: [
          "Initial angle θ_1 = 0° (stable equilibrium)",
          "Final angle θ_2 = 180° (unstable equilibrium)",
        ],
        steps: [
          {
            stepTitle: "Write the potential energy at both angles",
            detail:
              "Potential energy of a dipole at angle θ with electric field E is U(θ) = −pE cos θ.",
            formula: "U_1 = −pE cos(0°) = −pE   ;   U_2 = −pE cos(180°) = +pE",
          },
          {
            stepTitle: "Find work done as change in potential energy",
            detail:
              "Work done by an external agent slowly without changing kinetic energy is W = U_2 − U_1.",
            formula: "W = (+pE) − (−pE) = +2pE",
          },
        ],
        finalAnswer: "W = 2pE",
        commonMistakeNote:
          "Rotating by 90° from stable equilibrium takes W = +pE, whereas rotating a full 180° takes +2pE.",
      },
    ],
    knowledgeCheck: {
      id: "kc-dipole",
      prompt:
        "Quick Check: What is the angle between the axial electric field vector E_axial and the equatorial electric field vector E_equatorial of a short electric dipole?",
      options: [
        { id: "A", text: "180° (they point in opposite directions)" },
        { id: "B", text: "0° (they point in the same direction)" },
        { id: "C", text: "90° (perpendicular to each other)" },
      ],
      correctId: "A",
      reinforcement:
        "On the axial line, E points along the dipole moment p (from −q to +q). On the equatorial line, E points antiparallel to p (from +q toward −q), so the angle between them is 180°.",
    },
  },
  {
    id: "topic-projectile-motion",
    chapterId: "phy-11-kinematics",
    subjectId: "physics",
    classLevel: "11",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    title: "Projectile Trajectory, Range & Complementary Angles",
    estimatedMinutes: 25,
    difficulty: "Foundation",
    summary:
      "Break 2D motion under gravity into a constant-velocity horizontal component and a constant-acceleration vertical component.",
    learningObjectives: [
      "Resolve initial velocity u at launch angle θ into horizontal (u cos θ) and vertical (u sin θ) components.",
      "Derive time of flight T, maximum height H_max, and horizontal range R on level ground.",
      "Apply the ratio tan θ = 4 H_max / R and kinetic energy conservation at the apex.",
    ],
    intuitiveIntro:
      "If you throw a cricket ball across a field, gravity pulls it downward but nothing pushes or slows it horizontally (ignoring air resistance). That means if a drone flew directly above the ball at constant horizontal speed u cos θ, it would stay right above the ball from launch until landing!",
    definitionsAndFormulas: [
      {
        term: "Time of Flight",
        formula: "T = 2 u sin θ / g",
        meaning: "Total time the projectile remains in the air on level ground.",
      },
      {
        term: "Maximum Vertical Height",
        formula: "H_max = u^2 sin^2 θ / (2g)",
        meaning: "Vertical apex reached when vertical velocity v_y becomes 0.",
      },
      {
        term: "Horizontal Range & Apex Shortcut",
        formula: "R = u^2 sin(2θ) / g   ;   tan θ = 4 H_max / R",
        meaning:
          "Horizontal distance covered before returning to launch level; maximum at θ = 45°.",
      },
    ],
    keyTakeaways: [
      "Horizontal velocity u_x = u cos θ remains constant throughout flight (neglecting air drag).",
      "At the highest point, vertical velocity v_y = 0, so speed is minimum and equals u cos θ.",
      "Launch angles θ and (90° − θ) give the exact same horizontal range R for a given initial speed u.",
    ],
    conceptSections: [
      {
        heading: "1. Decoupling Horizontal and Vertical Motion",
        explanation:
          "Gravity acts strictly vertically downwards (a_y = −g, a_x = 0). Horizontal motion and vertical motion proceed independently, linked only by the common time parameter t.",
        formulaHighlight:
          "v_x(t) = u cos θ (constant)   |   v_y(t) = u sin θ − g t",
        examTip:
          "Because v_y = 0 at the highest point, kinetic energy at the apex is K_top = K_initial cos²θ, and potential energy at the apex is U_top = K_initial sin²θ.",
      },
    ],
    simulation: {
      type: "projectile-kinematics",
      title: "Interactive Projectile Trajectory Sandbox",
      caption:
        "Adjust launch angle θ and launch speed u to observe the parabolic flight path, peak height H_max, and horizontal range R.",
      parameterLabel: "Launch Angle (θ)",
      unit: "°",
      min: 15,
      max: 75,
      step: 5,
      defaultValue: 45,
      secondaryLabel: "Initial Speed (u)",
      secondaryMin: 15,
      secondaryMax: 40,
      secondaryDefault: 25,
      secondaryUnit: "m/s",
    },
    workedExamples: [
      {
        id: "we-projectile-ratio",
        title: "Finding Launch Angle When Range Equals Maximum Height",
        examTag: "Illustrative JEE & NEET Example",
        problemStatement:
          "Find the angle of projection θ from the horizontal for which the horizontal range R of a projectile equals its maximum height H_max.",
        givenData: ["Condition: R = H_max"],
        steps: [
          {
            stepTitle: "Use the direct relation between R and H_max",
            detail:
              "Dividing R = u²(2 sinθ cosθ)/g by H_max = u² sin²θ/(2g) gives R / H_max = 4 / tan θ.",
            formula: "tan θ = 4 H_max / R",
          },
          {
            stepTitle: "Substitute H_max = R",
            detail: "Replacing H_max / R with 1 immediately yields tan θ = 4.",
            formula: "θ = tan^−1(4) ≈ 76°",
          },
        ],
        finalAnswer: "θ = tan^−1(4)",
        commonMistakeNote:
          "Do not confuse R = H_max (tan θ = 4) with maximum possible range (θ = 45°, where R = 4 H_max).",
      },
    ],
    knowledgeCheck: {
      id: "kc-proj",
      prompt:
        "Quick Check: At the highest point of a projectile's trajectory (launched at angle θ = 45°), what is the angle between its velocity vector v and acceleration vector a?",
      options: [
        { id: "A", text: "90° (velocity is horizontal, gravity is vertical)" },
        { id: "B", text: "0° (both are zero at the top)" },
        { id: "C", text: "45° (same as launch angle)" },
      ],
      correctId: "A",
      reinforcement:
        "At the apex, vertical velocity is zero so velocity v = u cos 45° points strictly horizontally, while gravitational acceleration g points strictly vertically downward — forming a 90° angle.",
    },
  },
  {
    id: "topic-le-chatelier",
    chapterId: "chem-11-equilibrium",
    subjectId: "chemistry",
    classLevel: "11",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    title: "Reaction Quotient Q vs Kc & Le Chatelier Shifts",
    estimatedMinutes: 20,
    difficulty: "Exam Core",
    summary:
      "Compare reaction quotient Q with equilibrium constant Kc to predict whether a reversible reaction moves forward or backward.",
    learningObjectives: [
      "Write the expressions for Kc, Kp, and reaction quotient Q excluding pure solids and pure liquids.",
      "Relate Kp and Kc using Kp = Kc (RT)^(Δn_g).",
      "Predict shifts caused by concentration, pressure, temperature, and inert gas addition.",
    ],
    intuitiveIntro:
      "Think of chemical equilibrium like a balanced seesaw or two connected water tanks. If you pour extra water into the left tank, water flows right until the level ratio is restored. Only changing the temperature actually changes the target balance ratio (Kc) itself.",
    definitionsAndFormulas: [
      {
        term: "Kp and Kc Relationship",
        formula: "K_p = K_c (R T)^Δn_g",
        meaning:
          "Δn_g = (sum of stoichiometric coefficients of gaseous products) − (sum of gaseous reactants).",
      },
      {
        term: "Direction Prediction via Q",
        formula: "Q < K_c ⇒ Forward   ;   Q > K_c ⇒ Backward",
        meaning:
          "Reaction quotient Q has the same form as Kc but uses current non-equilibrium concentrations.",
      },
    ],
    keyTakeaways: [
      "Only temperature changes the numerical value of the equilibrium constant Kc or Kp.",
      "If Q < Kc, the reaction proceeds forward (left to right) to form more products.",
      "Adding an inert gas at constant volume causes no shift in equilibrium; at constant pressure, it shifts toward the side with more gas moles.",
    ],
    conceptSections: [
      {
        heading: "1. Comparing Reaction Quotient Q with Kc",
        explanation:
          "At any instant during a reaction, Q is calculated using the exact same expression as Kc but with current concentrations. The comparison between Q and Kc tells you which way the system will move to reach balance.",
        formulaHighlight:
          "Q < K_c ⇒ Forward Shift   |   Q = K_c ⇒ Equilibrium   |   Q > K_c ⇒ Backward Shift",
        examTip:
          "Pure solids (like CaCO₃(s)) and pure liquids (like H₂O(l)) have constant active mass (= 1) and are omitted from Q and Kc.",
      },
    ],
    simulation: {
      type: "chemical-equilibrium",
      title: "Reversible Equilibrium Balance Simulator",
      caption:
        "Adjust the Reaction Quotient (Q) relative to Equilibrium Constant (Kc = 4.0) to see the net driving direction and concentration balance.",
      parameterLabel: "Current Reaction Quotient (Q)",
      unit: "",
      min: 1,
      max: 8,
      step: 0.5,
      defaultValue: 2,
      secondaryLabel: "Temperature (T)",
      secondaryMin: 300,
      secondaryMax: 600,
      secondaryDefault: 400,
      secondaryUnit: "K",
    },
    workedExamples: [
      {
        id: "we-kp-kc",
        title: "Relating Kp and Kc in Haber's Ammonia Synthesis",
        examTag: "Illustrative JEE & NEET Example",
        problemStatement:
          "For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g) at temperature T, write the relationship between Kp and Kc.",
        givenData: [
          "Gaseous product moles = 2",
          "Gaseous reactant moles = 1 + 3 = 4",
        ],
        steps: [
          {
            stepTitle: "Find Δn_g (change in moles of gas)",
            detail:
              "Count only gaseous species on both sides of the balanced equation.",
            formula: "Δn_g = n_products(g) − n_reactants(g) = 2 − (1 + 3) = −2",
          },
          {
            stepTitle: "Substitute into Kp = Kc (RT)^(Δn_g)",
            detail: "With Δn_g = −2, Kp is smaller than Kc by a factor of (RT)².",
            formula: "K_p = K_c (R T)^−2 = K_c / (R T)^2",
          },
        ],
        finalAnswer: "K_p = K_c / (R T)^2",
        commonMistakeNote:
          "Always use R = 0.0821 L·atm/(mol·K) when partial pressures are in atmospheres.",
      },
    ],
    knowledgeCheck: {
      id: "kc-equilibrium",
      prompt:
        "Quick Check: For CaCO₃(s) ⇌ CaO(s) + CO₂(g), what is the correct expression for Kp?",
      options: [
        { id: "A", text: "Kp = p(CO₂) only" },
        { id: "B", text: "Kp = p(CaO) · p(CO₂) / p(CaCO₃)" },
        { id: "C", text: "Kp = 1 / p(CO₂)" },
      ],
      correctId: "A",
      reinforcement:
        "CaCO₃(s) and CaO(s) are pure solids with activity = 1, so only gaseous CO₂ appears in Kp = p(CO₂).",
    },
  },
  {
    id: "topic-nernst-equation",
    chapterId: "chem-12-electrochemistry",
    subjectId: "chemistry",
    classLevel: "12",
    applicableExams: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    title: "Nernst Equation & Cell EMF at 298 K",
    estimatedMinutes: 25,
    difficulty: "Exam Core",
    summary:
      "Calculate cell potential under non-standard concentrations and link cell EMF to equilibrium constant and Gibbs energy.",
    learningObjectives: [
      "Calculate standard cell EMF using E°_cell = E°_cathode − E°_anode.",
      "Apply the Nernst equation at 298 K: E_cell = E°_cell − (0.0591 / n) log₁₀ Q.",
      "Connect E°_cell with standard Gibbs energy ΔG° = −n F E°_cell and equilibrium constant K_eq.",
    ],
    intuitiveIntro:
      "A battery's voltage is not fixed forever — as reactants get used up and product ions build up in solution, the driving force drops until the battery goes flat (E_cell = 0 at chemical equilibrium). The Nernst equation tells us the exact voltage at any ion concentration.",
    definitionsAndFormulas: [
      {
        term: "Nernst Equation at 298 K",
        formula: "E_cell = E°_cell − (0.0591 / n) log_10 Q",
        meaning:
          "Relates non-standard cell potential E_cell to standard potential E°_cell, electron count n, and reaction quotient Q.",
      },
      {
        term: "Gibbs Free Energy Relation",
        formula: "ΔG° = −n F E°_cell = −2.303 R T log_10 K_eq",
        meaning:
          "A positive E°_cell guarantees ΔG° < 0 (spontaneous cell reaction) and K_eq > 1.",
      },
    ],
    keyTakeaways: [
      "At 298 K (25°C), E_cell = E°_cell − (0.0591 / n) log_10 Q.",
      "Electrical work done by a cell equals decrease in Gibbs free energy: ΔG = −n F E_cell.",
      "At chemical equilibrium, E_cell = 0 and Q = K_eq, so E°_cell = (0.0591 / n) log_10 K_eq.",
    ],
    conceptSections: [
      {
        heading: "1. Applying the Nernst Equation Without Sign Errors",
        explanation:
          "First balance the half-cell reactions so the number of transferred electrons n matches. Then write Q = [Products in aqueous/gas state] / [Reactants in aqueous/gas state] raised to their stoichiometric coefficients.",
        formulaHighlight:
          "E_cell = E°_cell − (0.0591 / n) log_10 ([Anode Ion]^a / [Cathode Ion]^b)",
        examTip:
          "Diluting the anode compartment lowers [Anode Ion], which decreases Q and therefore increases cell voltage E_cell.",
      },
    ],
    simulation: {
      type: "chemical-equilibrium",
      title: "Nernst Concentration Ratio Explorer",
      caption:
        "Adjust ion concentration ratio log₁₀(Q) to observe how cell voltage responds.",
      parameterLabel: "Ion Ratio log₁₀(Q)",
      unit: "",
      min: -3,
      max: 3,
      step: 1,
      defaultValue: 0,
      secondaryLabel: "Electrons Transferred (n)",
      secondaryMin: 1,
      secondaryMax: 4,
      secondaryDefault: 2,
      secondaryUnit: "mol e⁻",
    },
    workedExamples: [
      {
        id: "we-daniell-nernst",
        title: "Daniell Cell EMF with Tenfold Ion Dilution",
        examTag: "Illustrative Class 12 & JEE Example",
        problemStatement:
          "In a Daniell cell Zn(s) | Zn²⁺(0.01 M) || Cu²⁺(1.0 M) | Cu(s) with E°_cell = 1.10 V at 298 K, find E_cell.",
        givenData: [
          "E°_cell = 1.10 V",
          "n = 2 electrons",
          "[Zn²⁺] = 0.01 M, [Cu²⁺] = 1.0 M",
        ],
        steps: [
          {
            stepTitle: "Calculate reaction quotient Q",
            detail:
              "Overall reaction is Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s).",
            formula: "Q = [Zn^2+] / [Cu^2+] = 0.01 / 1.0 = 10^−2",
          },
          {
            stepTitle: "Substitute into Nernst Equation",
            detail: "Since log₁₀(10⁻²) = −2, the second term adds to E°_cell.",
            formula:
              "E_cell = 1.10 − (0.0591 / 2) × (−2) = 1.10 + 0.0591 = 1.159 V",
          },
        ],
        finalAnswer: "E_cell ≈ 1.16 V",
        commonMistakeNote:
          "Do not invert [Zn²⁺]/[Cu²⁺]; oxidation product Zn²⁺ always goes in the numerator of Q.",
      },
    ],
    knowledgeCheck: {
      id: "kc-nernst",
      prompt:
        "Quick Check: When a galvanic cell reaches complete chemical equilibrium (a dead battery), which statement is true?",
      options: [
        { id: "A", text: "E_cell = 0, but E°_cell ≠ 0" },
        { id: "B", text: "Both E_cell = 0 and E°_cell = 0" },
        { id: "C", text: "E_cell = E°_cell" },
      ],
      correctId: "A",
      reinforcement:
        "At equilibrium, current stops flowing so E_cell = 0, whereas E°_cell is a constant standard property fixed by K_eq.",
    },
  },
  {
    id: "topic-quadratic-roots",
    chapterId: "math-11-quadratics",
    subjectId: "mathematics",
    classLevel: "11",
    applicableExams: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    title: "Vieta's Relations & Symmetric Functions of Roots",
    estimatedMinutes: 25,
    difficulty: "Foundation",
    summary:
      "Connect the roots α and β of ax² + bx + c = 0 directly to its coefficients without solving the quadratic formula.",
    learningObjectives: [
      "Apply α + β = −b/a and αβ = c/a to evaluate symmetric root expressions like α² + β² and |α − β|.",
      "Classify roots using the discriminant D = b² − 4ac.",
      "Form a new quadratic equation whose roots are transformed functions of α and β.",
    ],
    intuitiveIntro:
      "Expanding factored quadratics shows that a(x − α)(x − β) = ax² − a(α + β)x + aαβ. That means the middle coefficient always encodes the sum of the roots and the constant term always encodes their product — letting us find α² + β² or α³ + β³ without ever computing ugly square roots!",
    definitionsAndFormulas: [
      {
        term: "Sum and Product of Roots",
        formula: "α + β = −b / a   ;   α β = c / a",
        meaning: "Vieta's formulas for ax² + bx + c = 0 (a ≠ 0).",
      },
      {
        term: "Difference of Roots",
        formula: "|α − β| = √( (α + β)^2 − 4αβ ) = √D / |a|",
        meaning: "Distance between the two roots in terms of discriminant D = b² − 4ac.",
      },
    ],
    keyTakeaways: [
      "For ax² + bx + c = 0, sum of roots α + β = −b/a and product αβ = c/a.",
      "Always rewrite α² + β² as (α + β)² − 2αβ.",
      "If coefficients a, b, c are rational and D > 0 is not a perfect square, irrational roots occur in conjugate pairs p ± √q.",
    ],
    conceptSections: [
      {
        heading: "1. Evaluating Symmetric Identities Fast",
        explanation:
          "Any expression that remains unchanged when you swap α and β can be written purely in terms of S = α + β and P = αβ.",
        formulaHighlight:
          "α^2 + β^2 = S^2 − 2P   |   α^3 + β^3 = S^3 − 3PS",
        examTip:
          "If α is a root of ax² + bx + c = 0, you can also reduce high powers using aα² + bα + c = 0 ⇒ aα² = −(bα + c).",
      },
    ],
    simulation: {
      type: "projectile-kinematics",
      title: "Parabolic Graph & Root Separation Visualizer",
      caption:
        "Explore how the parabola's curve width and height control the distance between roots on the horizontal axis.",
      parameterLabel: "Curve Steepness Parameter",
      unit: "",
      min: 15,
      max: 75,
      step: 15,
      defaultValue: 45,
      secondaryLabel: "Root Span Factor",
      secondaryMin: 15,
      secondaryMax: 40,
      secondaryDefault: 25,
      secondaryUnit: "",
    },
    workedExamples: [
      {
        id: "we-quad-sum-squares",
        title: "Sum of Squares of Roots Without Finding Individual Roots",
        examTag: "Illustrative JEE Main Example",
        problemStatement:
          "If α and β are the roots of x² − 5x + 3 = 0, find the exact value of α² + β².",
        givenData: ["a = 1, b = −5, c = 3", "α + β = 5, αβ = 3"],
        steps: [
          {
            stepTitle: "Use the symmetric identity for α² + β²",
            detail: "Express α² + β² in terms of (α + β) and αβ.",
            formula: "α^2 + β^2 = (α + β)^2 − 2αβ",
          },
          {
            stepTitle: "Substitute α + β = 5 and αβ = 3",
            detail: "Compute 5² − 2(3).",
            formula: "α^2 + β^2 = 25 − 6 = 19",
          },
        ],
        finalAnswer: "19",
        commonMistakeNote:
          "Watch the sign of α + β = −b/a: for x² − 5x + 3 = 0, α + β is +5, though its square is +25 either way (which is not true for α³ + β³!).",
      },
    ],
    knowledgeCheck: {
      id: "kc-quad",
      prompt:
        "Quick Check: If the sum of the coefficients (a + b + c) of a quadratic equation ax² + bx + c = 0 equals 0, what is always one of its roots?",
      options: [
        { id: "A", text: "x = 1 (and the other root is c / a)" },
        { id: "B", text: "x = 0" },
        { id: "C", text: "x = −1" },
      ],
      correctId: "A",
      reinforcement:
        "Substituting x = 1 into ax² + bx + c gives a(1)² + b(1) + c = a + b + c = 0. Since product of roots is c/a, the second root is immediately c/a!",
    },
  },
  {
    id: "topic-definite-integrals",
    chapterId: "math-12-calculus",
    subjectId: "mathematics",
    classLevel: "12",
    applicableExams: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    title: "King's Property of Definite Integrals",
    estimatedMinutes: 30,
    difficulty: "Advanced",
    summary:
      "Master the symmetry identity ∫[a to b] f(x) dx = ∫[a to b] f(a + b − x) dx to solve complex trigonometric and algebraic integrals in seconds.",
    learningObjectives: [
      "Apply King's property ∫[a to b] f(x) dx = ∫[a to b] f(a + b − x) dx.",
      "Recognise the canonical quotient form f(x) / [f(x) + f(a + b − x)] and evaluate it as (b − a) / 2.",
      "Use even and odd function symmetry on symmetric intervals [−a, a].",
    ],
    intuitiveIntro:
      "If you flip a asymmetric hill horizontally from left to right between milestones a and b, the cross-sectional area of the hill does not change. Adding the original hill and the flipped hill together often creates a flat horizontal top of height 1 — turning a hard calculus problem into simple rectangle area!",
    definitionsAndFormulas: [
      {
        term: "King's Property",
        formula: "∫[a to b] f(x) dx = ∫[a to b] f(a + b − x) dx",
        meaning: "Horizontal reflection across the midpoint x = (a + b)/2 preserves definite integral area.",
      },
      {
        term: "Complementary Quotient Shortcut",
        formula: "I = ∫[a to b] g(x) / ( g(x) + g(a+b−x) ) dx = (b − a) / 2",
        meaning: "Adding I and transformed I yields 2I = ∫[a to b] 1 dx = b − a.",
      },
    ],
    keyTakeaways: [
      "Replacing x with (a + b − x) reflects the curve horizontally across the midpoint x = (a + b)/2, leaving the area unchanged.",
      "Whenever an integral has the form ∫[a to b] g(x) / [g(x) + g(a + b − x)] dx, its value is always (b − a) / 2.",
      "For symmetric limits [−a, a], check whether f(x) is odd (integral = 0) or even (integral = 2 ∫[0 to a] f(x) dx).",
    ],
    conceptSections: [
      {
        heading: "1. The Symmetry Shortcut",
        explanation:
          "Many definite integrals look impossible to antidifferentiate directly. By labelling the integral I, applying x → a + b − x, and adding the two versions of I together, the numerator and denominator cancel to 1.",
        formulaHighlight:
          "2I = ∫[a to b] 1 dx = b − a   ⇒   I = (b − a) / 2",
        examTip:
          "Before trying integration by parts or substitution on [0, π/2], always test x → π/2 − x first.",
      },
    ],
    simulation: {
      type: "projectile-kinematics",
      title: "Symmetric Interval Area Visualizer",
      caption:
        "Observe how interval width and symmetry preserve bounded integral area.",
      parameterLabel: "Upper Limit Parameter",
      unit: "rad",
      min: 15,
      max: 75,
      step: 15,
      defaultValue: 45,
      secondaryLabel: "Function Power Index",
      secondaryMin: 1,
      secondaryMax: 5,
      secondaryDefault: 3,
      secondaryUnit: "",
    },
    workedExamples: [
      {
        id: "we-kings-trig",
        title: "Evaluating ∫[0 to π/2] √(sin x) / (√(sin x) + √(cos x)) dx",
        examTag: "Illustrative JEE Main & Advanced Example",
        problemStatement:
          "Evaluate I = ∫[0 to π/2] √(sin x) / (√(sin x) + √(cos x)) dx.",
        givenData: ["Lower limit a = 0, Upper limit b = π/2"],
        steps: [
          {
            stepTitle: "Apply King's Property x → (π/2 − x)",
            detail:
              "Since sin(π/2 − x) = cos x and cos(π/2 − x) = sin x, the transformed integral has √(cos x) in the numerator.",
            formula: "I = ∫[0 to π/2] √(cos x) / (√(cos x) + √(sin x)) dx",
          },
          {
            stepTitle: "Add original and transformed integrals",
            detail:
              "Adding the two expressions gives 2I = ∫[0 to π/2] 1 dx = π/2.",
            formula: "I = π / 4",
          },
        ],
        finalAnswer: "I = π / 4",
        commonMistakeNote:
          "The same answer π/4 holds for any real exponent n in sinⁿx / (sinⁿx + cosⁿx) on [0, π/2].",
      },
    ],
    knowledgeCheck: {
      id: "kc-calc",
      prompt:
        "Quick Check: Using the symmetry shortcut I = (b − a) / 2, what is the value of ∫[1 to 5] √x / (√x + √(6 − x)) dx?",
      options: [
        { id: "A", text: "2  (since (5 − 1) / 2 = 2)" },
        { id: "B", text: "4  (since 5 − 1 = 4)" },
        { id: "C", text: "3  (since (5 + 1) / 2 = 3)" },
      ],
      correctId: "A",
      reinforcement:
        "Here a = 1, b = 5, and a + b − x = 6 − x. Adding I and the reflected integral gives 2I = 5 − 1 = 4, so I = 2!",
    },
  },
  {
    id: "topic-bohr-effect",
    chapterId: "bio-11-respiration",
    subjectId: "biology",
    classLevel: "11",
    applicableExams: ["NEET UG"],
    title: "Oxygen-Haemoglobin Dissociation Curve & Bohr Effect",
    estimatedMinutes: 25,
    difficulty: "Exam Core",
    summary:
      "Understand why haemoglobin binds oxygen tightly in the lungs (high pO₂, low pCO₂) and releases it efficiently in exercising tissues (high pCO₂, lower pH).",
    learningObjectives: [
      "Interpret the sigmoid (S-shaped) oxygen-haemoglobin dissociation curve and P₅₀.",
      "Contrast alveolar conditions (Left shift / O₂ loading) with exercising tissue conditions (Right shift / O₂ unloading).",
      "Calculate the volume of O₂ delivered per 100 mL of blood under normal resting conditions.",
    ],
    intuitiveIntro:
      "Haemoglobin acts like a smart delivery truck for oxygen. In the lungs (the warehouse), it needs high stickiness so it loads up to 97% capacity. When it reaches hard-working muscle cells that are warm and releasing CO₂, that very CO₂ and acidity signal haemoglobin to loosen its grip and unload oxygen right where it is needed.",
    definitionsAndFormulas: [
      {
        term: "Half-Saturation Pressure (P_50)",
        formula: "P_50 ≈ 25 to 27 mmHg O_2 (Normal Arterial Blood)",
        meaning:
          "Partial pressure of oxygen at which haemoglobin is 50% saturated with O₂. Higher P_50 means lower affinity.",
      },
      {
        term: "Bohr Effect Equilibrium",
        formula: "Hb(O_2)_4 + H^+ ⇌ HbH^+ + 4 O_2",
        meaning:
          "Higher H⁺ (lower pH) and higher pCO₂ in active tissues drive the reaction forward, releasing free O₂.",
      },
    ],
    keyTakeaways: [
      "Each haemoglobin molecule carries up to 4 molecules of O₂, producing a sigmoid (S-shaped) saturation curve.",
      "P₅₀ is the partial pressure of O₂ at which haemoglobin is 50% saturated (normally ~25–27 mmHg).",
      "Right shift (increased P₅₀, lower affinity, more O₂ unloading) is caused by high pCO₂, high H⁺ (low pH), high temperature, and high 2,3-BPG.",
    ],
    conceptSections: [
      {
        heading: "1. Why Active Muscles Need a Right Shift",
        explanation:
          "During sprint exercise, muscle cells respire rapidly, releasing CO₂, lactic acid (H⁺), and heat. Through the Bohr effect, H⁺ and CO₂ bind to haemoglobin and slightly alter its conformation, lowering its oxygen affinity so oxygen is unloaded where cells need it most.",
        formulaHighlight:
          "Right Shift Factors: ↑ pCO_2  |  ↑ [H^+] (↓ pH)  |  ↑ Temperature  |  ↑ 2,3-BPG",
        examTip:
          "Memory hook for NEET UG: 'CADET, face Right!' — CO₂, Acid (H⁺), 2,3-DPG, Exercise, and Temperature all shift the dissociation curve to the Right.",
      },
    ],
    simulation: {
      type: "bohr-dissociation",
      title: "Interactive Bohr Effect & O₂ Saturation Curve",
      caption:
        "Adjust blood pH and tissue pCO₂ to observe how the Oxygen-Haemoglobin Dissociation Curve shifts between Resting Lungs (Left/Nominal) and Exercising Tissue (Right Shift).",
      parameterLabel: "Blood pH Level",
      unit: "pH",
      min: 7.0,
      max: 7.6,
      step: 0.1,
      defaultValue: 7.4,
      secondaryLabel: "Tissue pCO₂",
      secondaryMin: 25,
      secondaryMax: 65,
      secondaryDefault: 40,
      secondaryUnit: "mmHg",
    },
    workedExamples: [
      {
        id: "we-oxygen-delivery",
        title: "Volume of Oxygen Delivered per 100 mL of Blood",
        examTag: "Illustrative NEET UG NCERT Example",
        problemStatement:
          "How much oxygen is delivered by 100 mL of oxygenated blood to tissues under normal resting physiological conditions?",
        givenData: [
          "Haemoglobin content ≈ 15 g per 100 mL blood",
          "Oxygen carried by 100 mL arterial blood ≈ 20 mL",
          "Oxygen remaining in 100 mL venous blood at rest ≈ 15 mL",
        ],
        steps: [
          {
            stepTitle: "Compare arterial vs venous saturation",
            detail:
              "In alveoli (pO₂ = 104 mmHg), Hb is ~97% saturated (~20 mL O₂/100 mL). In resting tissues (pO₂ = 40 mmHg), Hb remains ~75% saturated (~15 mL O₂/100 mL).",
          },
          {
            stepTitle: "Calculate unloaded oxygen volume",
            detail:
              "Subtract venous oxygen content from arterial oxygen content: 20 mL − 15 mL = 5 mL.",
          },
        ],
        finalAnswer:
          "5 mL of O₂ per 100 mL of blood under normal resting conditions.",
        commonMistakeNote:
          "Students often confuse total O₂ carried (20 mL per 100 mL blood) with O₂ actually unloaded to resting tissues (5 mL per 100 mL blood).",
      },
    ],
    knowledgeCheck: {
      id: "kc-bohr",
      prompt:
        "Quick Check: When the oxygen-haemoglobin dissociation curve shifts to the right during strenuous exercise, what happens to the value of P₅₀?",
      options: [
        { id: "A", text: "P₅₀ increases (indicating lower affinity and easier O₂ release)" },
        { id: "B", text: "P₅₀ decreases (indicating tighter O₂ binding)" },
        { id: "C", text: "P₅₀ stays constant at 104 mmHg" },
      ],
      correctId: "A",
      reinforcement:
        "A right shift means a higher partial pressure of O₂ is required to achieve 50% saturation, so P₅₀ increases and oxygen unloads more easily into active tissues.",
    },
  },
  {
    id: "topic-dna-structure",
    chapterId: "bio-12-genetics",
    subjectId: "biology",
    classLevel: "12",
    applicableExams: ["NEET UG"],
    title: "B-DNA Double Helix & Chargaff's Equivalence Rule",
    estimatedMinutes: 20,
    difficulty: "Foundation",
    summary:
      "Calculate base composition percentages and DNA helix length using Watson-Crick base pairing and Chargaff's rules.",
    learningObjectives: [
      "Apply Chargaff's rule [A] = [T] and [G] = [C] for double-stranded DNA.",
      "Count hydrogen bonds (2 between A=T, 3 between G≡C) and calculate total helix length using 0.34 nm per base pair.",
      "Understand nucleosome packaging (~200 bp wrapped around positively charged histone octamer).",
    ],
    intuitiveIntro:
      "A double-stranded DNA molecule is like a twisted spiral staircase where every step has a fixed width. Because a two-ring purine (A or G) always pairs with a one-ring pyrimidine (T or C), knowing the percentage of just one base immediately reveals the percentages of the other three!",
    definitionsAndFormulas: [
      {
        term: "Chargaff's Purine-Pyrimidine Ratio",
        formula: "A + G = T + C = 50%   (in dsDNA)",
        meaning: "Total purines equal total pyrimidines in double-stranded DNA.",
      },
      {
        term: "B-DNA Helix Geometry",
        formula: "Pitch = 3.4 nm (10 bp per turn)   ;   d_bp = 0.34 nm",
        meaning: "Distance between adjacent base pairs is 0.34 nm (3.4 Å).",
      },
    ],
    keyTakeaways: [
      "In double-stranded DNA (dsDNA), %A = %T and %G = %C, so Purines (A + G) = Pyrimidines (T + C) = 50%.",
      "Adenine pairs with Thymine via 2 H-bonds (A=T); Guanine pairs with Cytosine via 3 H-bonds (G≡C).",
      "Distance between consecutive base pairs in B-DNA is 0.34 nm (3.4 × 10⁻¹⁰ m).",
    ],
    conceptSections: [
      {
        heading: "1. Solving Base Percentage Numericals in 10 Seconds",
        explanation:
          "Since %A + %G = 50% in any double-stranded DNA molecule, if a question gives %Cytosine = 18%, then %Guanine = 18%, and %Adenine = %Thymine = 50% − 18% = 32%.",
        formulaHighlight: "%A = %T = 50% − %G   (Valid for dsDNA only)",
        examTip:
          "Always check whether the virus or sample in the question has single-stranded DNA/RNA (where Chargaff's rule does NOT apply) or double-stranded DNA.",
      },
    ],
    simulation: {
      type: "bohr-dissociation",
      title: "DNA Melting & Stability Explorer",
      caption:
        "Higher G≡C content (3 hydrogen bonds per pair) increases thermal stability of the double helix.",
      parameterLabel: "Relative G≡C Stability Factor",
      unit: "",
      min: 7.0,
      max: 7.6,
      step: 0.1,
      defaultValue: 7.4,
      secondaryLabel: "Strand Length Parameter",
      secondaryMin: 25,
      secondaryMax: 65,
      secondaryDefault: 40,
      secondaryUnit: "kbp",
    },
    workedExamples: [
      {
        id: "we-chargaff",
        title: "Finding Adenine Percentage from Guanine Percentage",
        examTag: "Illustrative NEET UG Example",
        problemStatement:
          "If a double-stranded DNA sample contains 22% Guanine, what is the percentage of Adenine in the sample?",
        givenData: ["%G = 22%", "Double-stranded DNA follows Chargaff's rule"],
        steps: [
          {
            stepTitle: "Use %A + %G = 50%",
            detail: "In dsDNA, total purines (A + G) always make up 50% of all bases.",
            formula: "%A = 50% − %G = 50% − 22% = 28%",
          },
        ],
        finalAnswer: "28%",
        commonMistakeNote:
          "Do not subtract 22% from 100% without dividing by 2: 100% − (22% G + 22% C) = 56% for (A + T), which divides by 2 to give 28% Adenine.",
      },
    ],
    knowledgeCheck: {
      id: "kc-dna",
      prompt:
        "Quick Check: How many hydrogen bonds are present in a short B-DNA segment containing 10 A-T base pairs and 10 G-C base pairs?",
      options: [
        { id: "A", text: "50 hydrogen bonds  (10×2 + 10×3)" },
        { id: "B", text: "40 hydrogen bonds  (20×2)" },
        { id: "C", text: "60 hydrogen bonds  (20×3)" },
      ],
      correctId: "A",
      reinforcement:
        "Each A=T pair has 2 H-bonds (10 × 2 = 20) and each G≡C pair has 3 H-bonds (10 × 3 = 30), giving 20 + 30 = 50 hydrogen bonds.",
    },
  },
];

export const QUESTIONS: Question[] = [
  {
    id: "q-phy-gauss-1",
    subjectId: "physics",
    chapterId: "phy-12-electrostatics",
    topicId: "topic-gauss-law",
    classLevel: "12",
    questionType: "single-choice",
    examRelevance: ["JEE Main", "JEE Main + Advanced", "NEET UG"],
    examTag: "JEE Main & NEET · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Moderate",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "An electric dipole of dipole moment p is enclosed inside a hollow sphere of radius R, and an additional point charge +Q is placed at a distance 2R outside the sphere. What is the net electric flux through the sphere?",
    formulaContext: "Φ_net = ∮ E · dA = q_enclosed / ε_0",
    diagramType: "gaussian-cube",
    options: [
      {
        id: "A",
        text: "Zero",
      },
      {
        id: "B",
        text: "Q / ε₀",
        trapReason:
          "+Q is at distance 2R outside the sphere of radius R, so it is not enclosed.",
      },
      {
        id: "C",
        text: "(Q + 2q) / ε₀",
        trapReason:
          "A dipole has charges +q and −q (sum = 0), and +Q is outside the Gaussian sphere.",
      },
      {
        id: "D",
        text: "p / (R ε₀)",
        trapReason:
          "Electric flux has dimensions of Charge / ε₀, not dipole moment divided by length.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "Inside the sphere of radius R, only the electric dipole (+q and −q) is present, so net enclosed charge q_in = (+q) + (−q) = 0.",
      "The point charge +Q is at distance 2R (outside the sphere), so every field line from +Q that enters the sphere also exits it.",
      "By Gauss's Law, Φ_net = q_in / ε₀ = 0.",
    ],
    keyConceptTested: "Gauss's Law depends strictly on net enclosed charge.",
    commonMistakeSummary:
      "Forgetting that a dipole has zero net charge or including external charges in q_enclosed.",
  },
  {
    id: "q-phy-gauss-multi",
    subjectId: "physics",
    chapterId: "phy-12-electrostatics",
    topicId: "topic-gauss-law",
    classLevel: "12",
    questionType: "multiple-choice",
    examRelevance: ["JEE Advanced", "JEE Main + Advanced"],
    examTag: "JEE Advanced Style · Multiple-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Challenging",
    marks: { correct: 4, incorrect: -2 },
    questionText:
      "A point charge +q₁ is placed inside a closed spherical Gaussian surface S, and another point charge −q₂ is placed just outside S. Which of the following statements are CORRECT? (Select all correct options)",
    formulaContext: "∮_S E · dA = q_inside / ε_0",
    options: [
      {
        id: "A",
        text: "The resultant electric field E at any point on surface S is influenced by both +q₁ and −q₂.",
      },
      {
        id: "B",
        text: "The net electric flux Φ through the closed surface S depends only on +q₁ and equals +q₁ / ε₀.",
      },
      {
        id: "C",
        text: "Moving −q₂ further away (while keeping it outside S) changes the net electric flux through S.",
        trapReason:
          "External charges contribute zero net flux regardless of their external position.",
      },
      {
        id: "D",
        text: "If S is deformed into a cube still enclosing only +q₁, the net electric flux remains +q₁ / ε₀.",
      },
    ],
    correctOptionIds: ["A", "B", "D"],
    stepByStepExplanation: [
      "Option A is correct: In ∮ E · dA, the electric field vector E at every point on S is the superposition of fields due to ALL charges (both inside and outside).",
      "Option B is correct: When integrated over the entire closed surface S, the flux contribution of external charge −q₂ cancels to zero, leaving Φ_net = +q₁ / ε₀.",
      "Option C is incorrect: Moving an external charge changes E locally on S, but net flux remains fixed at +q₁ / ε₀.",
      "Option D is correct: Gauss's Law holds for any closed 3D surface regardless of its shape.",
    ],
    keyConceptTested:
      "Distinction between local electric field E (depends on all charges) and net closed-surface flux Φ (depends only on enclosed charges).",
    commonMistakeSummary:
      "Assuming that because −q₂ does not affect net flux Φ, it also does not affect the electric field E on the surface.",
  },
  {
    id: "q-phy-gauss-2",
    subjectId: "physics",
    chapterId: "phy-12-electrostatics",
    topicId: "topic-gauss-law",
    classLevel: "12",
    questionType: "single-choice",
    examRelevance: ["JEE Main", "JEE Main + Advanced", "NEET UG"],
    examTag: "NEET UG & JEE Main · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Easy",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "A point charge +q is placed at the centre of a cube of side L. If the side of the cube is doubled to 2L while keeping the charge at the centre, the electric flux passing through any one face of the cube becomes:",
    diagramType: "gaussian-cube",
    options: [
      {
        id: "A",
        text: "q / (6ε₀) — remains unchanged",
      },
      {
        id: "B",
        text: "q / (12ε₀)",
        trapReason:
          "Flux depends only on enclosed charge and symmetry, not on the side length L of the Gaussian surface.",
      },
      {
        id: "C",
        text: "q / (24ε₀)",
        trapReason:
          "Area increases by 4, and average field decreases by 4, so their product (flux) stays constant.",
      },
      {
        id: "D",
        text: "2q / (3ε₀)",
        trapReason: "Doubling the surface dimensions does not multiply the flux.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "By Gauss's Law, the total flux through the entire closed cube is Φ_total = q / ε₀ regardless of its side length L.",
      "Because the point charge +q remains at the geometric centre, all 6 faces are still completely symmetric.",
      "Therefore, the flux through one face remains Φ_total / 6 = q / (6ε₀).",
    ],
    keyConceptTested:
      "Scale invariance of electric flux for symmetric Gaussian surfaces.",
    commonMistakeSummary:
      "Assuming that doubling the cube side changes the flux because electric field decreases with distance.",
  },
  {
    id: "q-phy-proj-1",
    subjectId: "physics",
    chapterId: "phy-11-kinematics",
    topicId: "topic-projectile-motion",
    classLevel: "11",
    questionType: "single-choice",
    examRelevance: ["JEE Main", "JEE Main + Advanced", "NEET UG"],
    examTag: "JEE Main & NEET · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Moderate",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "A projectile is launched from horizontal ground with kinetic energy K at an angle of 60° above the horizontal. What is its kinetic energy at the highest point of its trajectory?",
    formulaContext: "K_initial = (1/2) m u^2   ;   v_top = u cos θ",
    diagramType: "projectile-apex",
    options: [
      {
        id: "A",
        text: "K / 4",
      },
      {
        id: "B",
        text: "Zero",
        trapReason:
          "Only the vertical component of velocity becomes zero at the highest point; horizontal velocity u cos(60°) remains non-zero.",
      },
      {
        id: "C",
        text: "K / 2",
        trapReason:
          "cos(60°) = 1/2, but kinetic energy is proportional to speed squared: cos²(60°) = 1/4.",
      },
      {
        id: "D",
        text: "3K / 4",
        trapReason:
          "3K / 4 is the gravitational potential energy gained at the highest point, not the remaining kinetic energy.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "At the highest point of a projectile's flight, the vertical velocity v_y = 0, while the horizontal velocity remains v_x = u cos(60°) = u / 2.",
      "Kinetic energy at the top is K_top = ½ m (v_x)² = ½ m u² cos²(60°).",
      "Since K = ½ m u² and cos²(60°) = (1/2)² = 1/4, we get K_top = K / 4.",
    ],
    keyConceptTested:
      "Non-zero horizontal velocity and energy partitioning at projectile apex.",
    commonMistakeSummary:
      "Forgetting to square cos(θ) when computing kinetic energy, or confusing potential energy (3K/4) with kinetic energy (K/4).",
  },
  {
    id: "q-phy-proj-num",
    subjectId: "physics",
    chapterId: "phy-11-kinematics",
    topicId: "topic-projectile-motion",
    classLevel: "11",
    questionType: "numerical",
    examRelevance: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    examTag: "JEE Section B · Numerical Value Question",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Moderate",
    marks: { correct: 4, incorrect: 0 },
    questionText:
      "A ball is projected from level ground with initial speed u = 20 m/s at an angle θ = 45° to the horizontal. Taking acceleration due to gravity g = 10 m/s², find the maximum horizontal range R of the ball (in metres).",
    formulaContext: "R = u^2 sin(2θ) / g",
    correctNumericalValue: 40,
    numericalTolerance: 0.1,
    numericalUnit: "m",
    stepByStepExplanation: [
      "Given initial speed u = 20 m/s, launch angle θ = 45°, and g = 10 m/s².",
      "Use the horizontal range formula: R = u² sin(2θ) / g.",
      "Substitute values: R = (20)² × sin(90°) / 10 = 400 × 1 / 10 = 40 m.",
    ],
    keyConceptTested: "Maximum horizontal range at θ = 45°.",
    commonMistakeSummary:
      "Using H_max = u² sin²θ / (2g) = 10 m instead of the horizontal range formula R = u² sin(2θ) / g = 40 m.",
  },
  {
    id: "q-chem-eq-1",
    subjectId: "chemistry",
    chapterId: "chem-11-equilibrium",
    topicId: "topic-le-chatelier",
    classLevel: "11",
    questionType: "single-choice",
    examRelevance: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    examTag: "JEE & NEET · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Moderate",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "For the exothermic reversible reaction 2SO₂(g) + O₂(g) ⇌ 2SO₃(g) (ΔH < 0), which combination of changes will maximize the equilibrium yield of SO₃(g)?",
    diagramType: "equilibrium-vessel",
    options: [
      {
        id: "A",
        text: "Low temperature and high pressure",
      },
      {
        id: "B",
        text: "High temperature and high pressure",
        trapReason:
          "Because the forward reaction is exothermic (ΔH < 0), raising temperature shifts equilibrium backward toward reactants.",
      },
      {
        id: "C",
        text: "Low temperature and low pressure",
        trapReason:
          "There are 3 moles of gas on the left and 2 moles on the right; lowering pressure shifts toward the side with more gas moles (reactants).",
      },
      {
        id: "D",
        text: "Adding argon gas at constant volume",
        trapReason:
          "Adding an inert gas at constant volume does not change partial pressures of reacting gases, so no shift occurs.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "Count gas moles: Reactants = 2 + 1 = 3 moles; Products = 2 moles. High pressure shifts equilibrium toward fewer gas moles (forward toward SO₃).",
      "The forward reaction is exothermic (releases heat). Lowering temperature favours the heat-releasing forward direction.",
      "Therefore, low temperature (optimum ~700 K with catalyst) and high pressure maximize SO₃ yield.",
    ],
    keyConceptTested:
      "Le Chatelier's Principle for temperature and pressure simultaneously.",
    commonMistakeSummary:
      "Mixing up Δn_g direction or forgetting that exothermic reactions are favoured at lower temperatures.",
  },
  {
    id: "q-chem-nernst-1",
    subjectId: "chemistry",
    chapterId: "chem-12-electrochemistry",
    topicId: "topic-nernst-equation",
    classLevel: "12",
    questionType: "single-choice",
    examRelevance: [
      "JEE Main",
      "JEE Advanced",
      "JEE Main + Advanced",
      "NEET UG",
    ],
    examTag: "JEE & NEET · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Challenging",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "If the standard EMF (E°_cell) of a two-electron galvanic cell reaction at 298 K is 0.2955 V, what is the equilibrium constant K_eq of the reaction?",
    formulaContext: "E°_cell = (0.0591 / n) log_10 K_eq   (at 298 K)",
    diagramType: "daniell-cell",
    options: [
      {
        id: "A",
        text: "10¹⁰",
      },
      {
        id: "B",
        text: "10⁵",
        trapReason:
          "This happens if you forget to multiply by n = 2 electrons transferred.",
      },
      {
        id: "C",
        text: "10⁻¹⁰",
        trapReason:
          "Positive E°_cell always corresponds to K_eq > 1 (spontaneous forward reaction).",
      },
      {
        id: "D",
        text: "2 × 10⁵",
        trapReason:
          "n = 2 multiplies log₁₀(K_eq), which becomes an exponent on 10, not a linear multiplier.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "At equilibrium (E_cell = 0) at 298 K, E°_cell = (0.0591 / n) log₁₀(K_eq).",
      "Substitute E°_cell = 0.2955 V and n = 2: 0.2955 = (0.0591 / 2) log₁₀(K_eq).",
      "Since 0.2955 / 0.0591 = 5, we get log₁₀(K_eq) = 5 × 2 = 10, so K_eq = 10¹⁰.",
    ],
    keyConceptTested:
      "Relationship between E°_cell and equilibrium constant K_eq.",
    commonMistakeSummary:
      "Omitting the factor n = 2 before taking the antilogarithm.",
  },
  {
    id: "q-math-quad-num",
    subjectId: "mathematics",
    chapterId: "math-11-quadratics",
    topicId: "topic-quadratic-roots",
    classLevel: "11",
    questionType: "numerical",
    examRelevance: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    examTag: "JEE Section B · Numerical Value Question",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Easy",
    marks: { correct: 4, incorrect: 0 },
    questionText:
      "If α and β are the roots of the quadratic equation x² − 6x + 4 = 0, find the numerical value of α² + β².",
    formulaContext: "α + β = −b / a   ;   α^2 + β^2 = (α + β)^2 − 2αβ",
    correctNumericalValue: 28,
    numericalTolerance: 0.01,
    numericalUnit: "",
    stepByStepExplanation: [
      "From x² − 6x + 4 = 0, Vieta's relations give sum of roots α + β = 6 and product of roots αβ = 4.",
      "Use the identity α² + β² = (α + β)² − 2αβ.",
      "Substitute values: α² + β² = 6² − 2(4) = 36 − 8 = 28.",
    ],
    keyConceptTested: "Symmetric functions of quadratic roots via Vieta's formulas.",
    commonMistakeSummary:
      "Computing (α + β)² = 36 and forgetting to subtract 2αβ = 8.",
  },
  {
    id: "q-math-calc-1",
    subjectId: "mathematics",
    chapterId: "math-12-calculus",
    topicId: "topic-definite-integrals",
    classLevel: "12",
    questionType: "single-choice",
    examRelevance: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    examTag: "JEE Main & Advanced · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Moderate",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "What is the exact value of the definite integral I = ∫[π/6 to π/3] dx / (1 + √(tan x)) ?",
    formulaContext: "∫[a to b] f(x) dx = ∫[a to b] f(a + b − x) dx",
    options: [
      {
        id: "A",
        text: "π / 12",
      },
      {
        id: "B",
        text: "π / 6",
        trapReason:
          "π / 6 is the value of 2I = (b − a) = π/3 − π/6; remember to divide by 2 to get I.",
      },
      {
        id: "C",
        text: "π / 4",
        trapReason:
          "π / 4 is the answer when the limits are [0, π/2], not [π/6, π/3].",
      },
      {
        id: "D",
        text: "π / 8",
        trapReason:
          "Check the interval length: (π/3 − π/6) / 2 = (π/6) / 2 = π/12.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "Write √(tan x) = √(sin x) / √(cos x), so I = ∫[π/6 to π/3] √(cos x) / (√(cos x) + √(sin x)) dx.",
      "Notice a + b = π/6 + π/3 = π/2. Apply King's property x → π/2 − x, which swaps sin x and cos x.",
      "Adding the two integrals gives 2I = ∫[π/6 to π/3] 1 dx = π/3 − π/6 = π/6. Dividing by 2 gives I = π/12.",
    ],
    keyConceptTested:
      "King's Property on non-zero complementary intervals [π/6, π/3].",
    commonMistakeSummary:
      "Defaulting to the memorized [0, π/2] answer of π/4 instead of computing (b − a)/2.",
  },
  {
    id: "q-bio-bohr-1",
    subjectId: "biology",
    chapterId: "bio-11-respiration",
    topicId: "topic-bohr-effect",
    classLevel: "11",
    questionType: "single-choice",
    examRelevance: ["NEET UG"],
    examTag: "NEET UG · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Moderate",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "In the alveoli of the lungs, which set of physiological conditions favours the formation of oxyhaemoglobin (left shift of the dissociation curve)?",
    diagramType: "bohr-curve",
    options: [
      {
        id: "A",
        text: "High pO₂, low pCO₂, lesser H⁺ concentration (higher pH), and lower temperature",
      },
      {
        id: "B",
        text: "High pO₂, high pCO₂, higher H⁺ concentration, and higher temperature",
        trapReason:
          "High pCO₂, high H⁺, and high temperature occur in metabolically active tissues and cause dissociation, not binding.",
      },
      {
        id: "C",
        text: "Low pO₂, low pCO₂, higher H⁺ concentration, and lower temperature",
        trapReason:
          "Low pO₂ and high H⁺ oppose oxygen binding to haemoglobin.",
      },
      {
        id: "D",
        text: "High pO₂, low pCO₂, higher H⁺ concentration (lower pH), and higher temperature",
        trapReason:
          "Higher H⁺ concentration (acidic pH) triggers the Bohr effect, releasing oxygen rather than binding it.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "In the lung alveoli, fresh inhaled air provides a high partial pressure of oxygen (pO₂ ≈ 104 mmHg) and low pCO₂ (≈ 40 mmHg).",
      "Lower CO₂ means less carbonic acid formation, so H⁺ concentration is lower (slightly higher pH) and temperature is cooler than deep working muscle.",
      "All four factors shift the O₂-Hb dissociation curve to the left, promoting rapid oxyhaemoglobin formation.",
    ],
    keyConceptTested:
      "NCERT conditions for oxyhaemoglobin formation vs dissociation.",
    commonMistakeSummary:
      "Confusing 'lesser H⁺ concentration' with 'lower pH' (lesser H⁺ actually means higher pH).",
  },
  {
    id: "q-bio-dna-1",
    subjectId: "biology",
    chapterId: "bio-12-genetics",
    topicId: "topic-dna-structure",
    classLevel: "12",
    questionType: "single-choice",
    examRelevance: ["NEET UG"],
    examTag: "NEET UG · Single-Correct MCQ",
    sourceLabel: "Illustrative Exam-Style Practice",
    difficulty: "Easy",
    marks: { correct: 4, incorrect: -1 },
    questionText:
      "In a double-stranded B-DNA molecule, if Cytosine makes up 18% of the total nitrogenous bases, what is the percentage of Adenine bases?",
    formulaContext: "%A + %G = 50%   ;   %G = %C   (in dsDNA)",
    options: [
      {
        id: "A",
        text: "32%",
      },
      {
        id: "B",
        text: "64%",
        trapReason:
          "64% is the combined percentage of Adenine + Thymine (100% − 36%), not Adenine alone.",
      },
      {
        id: "C",
        text: "18%",
        trapReason:
          "18% is the percentage of Guanine (which pairs with Cytosine), not Adenine.",
      },
      {
        id: "D",
        text: "41%",
        trapReason:
          "Use %A = 50% − %C = 50% − 18% = 32%.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "By Chargaff's equivalence rule for double-stranded DNA, %Guanine = %Cytosine = 18%.",
      "Since %A + %G = 50% (total purines = 50%), we get %A = 50% − 18% = 32%.",
    ],
    keyConceptTested: "Chargaff's base-equivalence rule in double-stranded DNA.",
    commonMistakeSummary:
      "Forgetting to divide (%A + %T = 64%) by 2 to obtain %A = 32%.",
  },
];

export const MOCK_TESTS: MockTestDefinition[] = [
  {
    id: "mock-jee-part-1",
    title: "JEE Core Concept Checkpoint — Physics, Chemistry & Maths",
    targetExam: "JEE Main",
    classLevel: "12",
    durationMinutes: 15,
    markingScheme: {
      correct: 4,
      incorrect: -1,
      unattempted: 0,
    },
    questionIds: [
      "q-phy-gauss-1",
      "q-phy-gauss-2",
      "q-phy-proj-1",
      "q-chem-eq-1",
      "q-chem-nernst-1",
      "q-math-calc-1",
    ],
    description:
      "Timed 6-question exam-style checkpoint with official +4 / −1 marking, question palette navigation, and post-submission mistake analysis (answers are never revealed before submission).",
  },
  {
    id: "mock-neet-part-1",
    title: "NEET UG High-Yield Checkpoint — Physics, Chemistry & Biology",
    targetExam: "NEET UG",
    classLevel: "12",
    durationMinutes: 15,
    markingScheme: {
      correct: 4,
      incorrect: -1,
      unattempted: 0,
    },
    questionIds: [
      "q-bio-bohr-1",
      "q-bio-dna-1",
      "q-phy-gauss-2",
      "q-phy-proj-1",
      "q-chem-eq-1",
      "q-chem-nernst-1",
    ],
    description:
      "NCERT-aligned NEET UG practice sprint with +4 / −1 negative marking and step-by-step physiological and physical explanations after submission.",
  },
];

export function buildStudyTasksForExam(
  targetExam: TargetExam,
  classLevel: ClassLevel
): StudyTask[] {
  const isNeet = targetExam === "NEET UG";
  return [
    {
      id: "task-1",
      title: isNeet
        ? "Understand Bohr Effect & O₂ Dissociation Curve"
        : "Master Gauss's Law & Symmetric Flux",
      subtitle: isNeet
        ? "Biology · Class 11 · Interactive curve & NCERT worked example"
        : "Physics · Class 12 · Interactive Gaussian surface & worked example",
      type: "concept",
      subjectId: isNeet ? "biology" : "physics",
      topicId: isNeet ? "topic-bohr-effect" : "topic-gauss-law",
      chapterId: isNeet ? "bio-11-respiration" : "phy-12-electrostatics",
      estimatedMinutes: 20,
      completed: false,
      routeTarget: "learn",
    },
    {
      id: "task-2",
      title: "Complete a Guided Practice Session (MCQ & Numerical)",
      subtitle: `${targetExam} · Class ${classLevel} · Step-by-step trap feedback`,
      type: "practice",
      subjectId: "physics",
      chapterId: "phy-12-electrostatics",
      estimatedMinutes: 15,
      completed: false,
      routeTarget: "practice",
    },
    {
      id: "task-3",
      title: "Review Chemical Equilibrium & Le Chatelier Shifts",
      subtitle: "Chemistry · Class 11 · Reaction quotient Q vs Kc simulator",
      type: "concept",
      subjectId: "chemistry",
      topicId: "topic-le-chatelier",
      chapterId: "chem-11-equilibrium",
      estimatedMinutes: 20,
      completed: false,
      routeTarget: "learn",
    },
    {
      id: "task-4",
      title: "Take 15-Minute Timed Checkpoint Test",
      subtitle: `${targetExam} · +4 / −1 marking scheme`,
      type: "mock",
      subjectId: isNeet ? "biology" : "mathematics",
      estimatedMinutes: 15,
      completed: false,
      routeTarget: "mock-tests",
    },
  ];
}

export function createFreshStudentState(
  profile: StudentProfile
): StudentLearningState {
  const tasks = buildStudyTasksForExam(profile.targetExam, profile.classLevel);
  return {
    profile,
    completedTopicIds: [],
    knowledgeCheckCompletedTopicIds: [],
    bookmarkedQuestionIds: [],
    bookmarkedTopicIds: [],
    attempts: [],
    activePracticeSession: null,
    studyTasks: tasks,
    studentMilestones: [],
    revisionRecords: {},
    revisionSessions: [],
    mockResults: [],
    notes: [
      {
        id: "note-welcome",
        title: "Formula Quick Sheet — Electrostatics & Equilibrium",
        subjectId: "physics",
        chapterId: "phy-12-electrostatics",
        content:
          "1. Gauss's Law: Φ_net = q_enclosed / ε₀ (External charges give zero net flux).\n2. Projectile Range-Height Shortcut: tan(θ) = 4 H_max / R.\n3. Nernst Equation at 298 K: E_cell = E°_cell − (0.0591/n) log₁₀(Q).",
        updatedAt: "Saved starter note",
      },
    ],
    doubtHistory: [
      {
        id: "doubt-welcome",
        role: "tutor",
        text: `Namaste ${profile.name}! Welcome to your personal study companion for ${profile.targetExam} (Class ${profile.classLevel}). Ask me any concept doubt in Physics, Chemistry, ${
          profile.targetExam === "NEET UG" ? "or Biology" : "or Mathematics"
        } — we will break it down step by step.`,
        timestamp: "Just now",
      },
    ],
  };
}

export function createDemoStudentState(): StudentLearningState {
  const demoProfile: StudentProfile = {
    id: "demo-student-aarav",
    name: "Aarav Sharma (Sample Mode)",
    email: "aarav.demo@vidyakshara.edu.in",
    classLevel: "12",
    targetExam: "JEE Main",
    schoolOrCity: "Pune, Maharashtra",
    isDemoAccount: true,
    onboardingCompleted: true,
    preferences: {
      dailyStudyMinutes: 90,
      preferredSessionStyle: "balanced",
      focusSubjectIds: ["physics", "chemistry", "mathematics"],
      highContrastReading: false,
      fontSizeScale: "normal",
    },
    lastActiveRoute: "home",
    lastActiveTopicId: "topic-gauss-law",
  };

  return {
    profile: demoProfile,
    completedTopicIds: ["topic-gauss-law", "topic-le-chatelier"],
    knowledgeCheckCompletedTopicIds: ["topic-gauss-law"],
    bookmarkedQuestionIds: ["q-phy-proj-1", "q-chem-nernst-1"],
    bookmarkedTopicIds: ["topic-projectile-motion", "topic-nernst-equation"],
    activePracticeSession: null,
    studentMilestones: [
      {
        id: "demo-milestone-1",
        title: "School Physics Electrostatics & Kinematics Test (Sample Milestone)",
        targetDateLabel: "This Friday",
        subjectId: "physics",
        completed: false,
      },
    ],
    revisionRecords: {
      "topic-gauss-law": {
        topicId: "topic-gauss-law",
        subjectId: "physics",
        lastReviewedAt: "Yesterday (Sample Record)",
        revisionCount: 1,
        confidenceLevel: "confident",
        nextSuggestedReview: "In 4 days (Spaced Revision)",
        intervalDays: 4,
      },
      "topic-projectile-motion": {
        topicId: "topic-projectile-motion",
        subjectId: "physics",
        lastReviewedAt: "Yesterday (Sample Record)",
        revisionCount: 1,
        confidenceLevel: "needs-work",
        nextSuggestedReview: "Due Today (Mistake Recovery)",
        intervalDays: 1,
      },
    },
    revisionSessions: [
      {
        id: "demo-rev-session-1",
        topicId: "topic-gauss-law",
        subjectId: "physics",
        title: "Gauss's Law & Symmetric Flux — Spaced Review",
        completedAt: "Yesterday (Sample Record)",
        questionsReviewedCount: 2,
        questionsResolvedCount: 2,
      },
    ],
    attempts: [
      {
        id: "demo-att-1",
        questionId: "q-phy-gauss-1",
        topicId: "topic-gauss-law",
        chapterId: "phy-12-electrostatics",
        subjectId: "physics",
        questionType: "single-choice",
        selectedOptionId: "A",
        isCorrect: true,
        marksAwarded: 4,
        timeSpentSeconds: 48,
        attemptedAt: "Yesterday",
        markedForRevision: false,
      },
      {
        id: "demo-att-2",
        questionId: "q-phy-gauss-2",
        topicId: "topic-gauss-law",
        chapterId: "phy-12-electrostatics",
        subjectId: "physics",
        questionType: "single-choice",
        selectedOptionId: "A",
        isCorrect: true,
        marksAwarded: 4,
        timeSpentSeconds: 35,
        attemptedAt: "Yesterday",
        markedForRevision: false,
      },
      {
        id: "demo-att-3",
        questionId: "q-phy-proj-1",
        topicId: "topic-projectile-motion",
        chapterId: "phy-11-kinematics",
        subjectId: "physics",
        questionType: "single-choice",
        selectedOptionId: "C",
        isCorrect: false,
        marksAwarded: -1,
        timeSpentSeconds: 65,
        attemptedAt: "Yesterday",
        markedForRevision: true,
      },
      {
        id: "demo-att-4",
        questionId: "q-chem-eq-1",
        topicId: "topic-le-chatelier",
        chapterId: "chem-11-equilibrium",
        subjectId: "chemistry",
        questionType: "single-choice",
        selectedOptionId: "A",
        isCorrect: true,
        marksAwarded: 4,
        timeSpentSeconds: 42,
        attemptedAt: "Today",
        markedForRevision: false,
      },
      {
        id: "demo-att-5",
        questionId: "q-chem-nernst-1",
        topicId: "topic-nernst-equation",
        chapterId: "chem-12-electrochemistry",
        subjectId: "chemistry",
        questionType: "single-choice",
        selectedOptionId: "B",
        isCorrect: false,
        marksAwarded: -1,
        timeSpentSeconds: 78,
        attemptedAt: "Today",
        markedForRevision: true,
      },
    ],
    studyTasks: [
      {
        id: "demo-task-1",
        title: "Master Gauss's Law & Symmetric Flux",
        subtitle: "Physics · Class 12 · Completed in sample session",
        type: "concept",
        subjectId: "physics",
        topicId: "topic-gauss-law",
        chapterId: "phy-12-electrostatics",
        estimatedMinutes: 25,
        completed: true,
        routeTarget: "learn",
      },
      {
        id: "demo-task-2",
        title: "Review 2 Mistakes in Projectile & Nernst Equation",
        subtitle: "Physics & Chemistry · Marked for revision",
        type: "revision",
        subjectId: "physics",
        topicId: "topic-projectile-motion",
        chapterId: "phy-11-kinematics",
        estimatedMinutes: 15,
        completed: false,
        routeTarget: "revision",
      },
      {
        id: "demo-task-3",
        title: "Learn King's Property in Definite Integrals",
        subtitle: "Mathematics · Class 12 · High-weightage JEE topic",
        type: "concept",
        subjectId: "mathematics",
        topicId: "topic-definite-integrals",
        chapterId: "math-12-calculus",
        estimatedMinutes: 30,
        completed: false,
        routeTarget: "learn",
      },
      {
        id: "demo-task-4",
        title: "Practise Remaining Chapter Questions",
        subtitle: "JEE Main · Single MCQ, Multiple-Choice & Numerical",
        type: "practice",
        subjectId: "chemistry",
        chapterId: "chem-12-electrochemistry",
        estimatedMinutes: 20,
        completed: false,
        routeTarget: "practice",
      },
    ],
    mockResults: [
      {
        id: "demo-mock-1",
        mockTestId: "mock-jee-part-1",
        title: "JEE Core Concept Checkpoint — Physics, Chemistry & Maths",
        submittedAt: "2 days ago (Sample Record)",
        durationSecondsUsed: 540,
        totalScore: 15,
        maxScore: 24,
        correctCount: 4,
        incorrectCount: 1,
        unattemptedCount: 1,
        answers: {
          "q-phy-gauss-1": "A",
          "q-phy-gauss-2": "A",
          "q-phy-proj-1": "C",
          "q-chem-eq-1": "A",
          "q-chem-nernst-1": null,
          "q-math-calc-1": "A",
        },
      },
    ],
    notes: [
      {
        id: "demo-note-1",
        title: "Electrostatics & Gauss's Law Revision Notes",
        subjectId: "physics",
        chapterId: "phy-12-electrostatics",
        content:
          "• Net flux through closed surface = q_in / ε₀.\n• If +Q is at the centre of a cube, flux through 1 face = Q / (6ε₀).\n• If +Q is at 1 corner of a cube, 3 adjacent faces have 0 flux (E is parallel to surface), and each of the other 3 faces gets Q / (24ε₀).",
        updatedAt: "Sample note · Yesterday",
      },
      {
        id: "demo-note-2",
        title: "Nernst Equation Sign & Stoichiometry Checklist",
        subjectId: "chemistry",
        chapterId: "chem-12-electrochemistry",
        content:
          "• Always check n (number of electrons transferred) before applying E = E° − (0.0591/n) log Q.\n• At equilibrium, E_cell = 0, ΔG = 0, but E°_cell ≠ 0 and ΔG° = −nFE°_cell.",
        attachmentName: "NCERT_Electrochemistry_Summary.pdf",
        attachmentSizeLabel: "420 KB",
        updatedAt: "Sample note · Today",
      },
    ],
    doubtHistory: [
      {
        id: "demo-d-1",
        role: "user",
        text: "Why does adding an external charge outside a Gaussian sphere not change the net flux, even though it changes the electric field?",
        timestamp: "Sample conversation · Yesterday",
        subjectId: "physics",
        topicId: "topic-gauss-law",
        relatedTopicTitle: "Gauss's Law & Symmetric Flux",
        explanationMode: "step-by-step",
        sourceType: "sample-history",
      },
      {
        id: "demo-d-2",
        role: "tutor",
        text: "An external charge changes the electric field vector E at individual points on the Gaussian surface, but every field line from that outside charge that enters the closed sphere on one side must exit on the other side, cancelling its net flux contribution to zero.",
        timestamp: "Sample conversation · Yesterday",
        subjectId: "physics",
        topicId: "topic-gauss-law",
        relatedTopicTitle: "Gauss's Law & Symmetric Flux",
        explanationMode: "step-by-step",
        sourceType: "sample-history",
        structured: {
          mainIdea:
            "Electric field E at a point on the Gaussian surface depends on all charges (both inside and outside), whereas net electric flux Φ through the closed surface depends only on the net enclosed charge.",
          steps: [
            {
              title: "Distinguish local electric field E from total flux Φ",
              explanation:
                "By the superposition principle, the electric field vector E at any point on the sphere is the vector sum E = E_inside + E_outside.",
              formula: "E_total = E_inside + E_outside",
            },
            {
              title: "Track field lines from the external charge",
              explanation:
                "Because the external charge lies outside the closed surface, every field line originating from it that pierces inward (negative flux, E · dA < 0) on the near side must pierce outward (positive flux, E · dA > 0) on the far side.",
            },
            {
              title: "Integrate over the entire closed surface",
              explanation:
                "When we sum E · dA over the entire closed sphere, the inward and outward flux contributions from the outside charge cancel out to zero.",
              formula: "Φ_net = ∮ (E_inside + E_outside) · dA = q_enclosed / ε_0 + 0",
            },
          ],
          formulaOrDiagramNote:
            "Always check whether a charge lies strictly inside the chosen closed Gaussian surface before including it in q_enclosed.",
          formulaExpression: "Φ_net = ∮ E · dA = q_enclosed / ε_0",
          diagramType: "gaussian-cube",
          finalAnswer:
            "Net electric flux remains q_enclosed / ε₀ (unchanged by outside charges), even though the local electric field E on the surface changes.",
          commonMistake:
            "Assuming that Φ_net = 0 implies E = 0 everywhere on the Gaussian surface. Even if q_enclosed = 0, an external charge still creates a non-zero electric field at points on the surface.",
          practiceQuestion: {
            prompt:
              "A point charge +2 μC is placed at the centre of a cubic Gaussian surface, and another charge −5 μC is placed outside the cube at a distance of 10 cm. The net electric flux through the cube depends on:",
            options: [
              "A. Only the +2 μC charge inside the cube",
              "B. Only the −5 μC charge outside the cube",
              "C. The algebraic sum (+2 μC − 5 μC = −3 μC)",
              "D. Zero, because the charges have opposite signs",
            ],
            correctAnswer: "A. Only the +2 μC charge inside the cube",
            hintOrSolution:
              "By Gauss's Law, Φ = q_enclosed / ε₀. Only the +2 μC charge is enclosed within the cubic surface; the −5 μC charge outside contributes zero net flux.",
          },
          suggestedFollowUps: [
            "Explain this more simply with an analogy",
            "What happens if the charge is placed right on a corner of a cube?",
            "Give me a numerical calculation example on Gauss's Law",
          ],
        },
      },
    ],
  };
}
