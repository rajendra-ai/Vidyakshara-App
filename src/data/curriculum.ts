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
      "Calculate electric flux through flat and closed 3D surfaces using $\\Phi = \\oint \\vec{E} \\cdot d\\vec{A}$.",
      "Distinguish between the role of enclosed charges (which determine net flux $\\Phi_{\\text{net}}$) and external charges (which affect $\\vec{E}$ at points on the surface but contribute zero net flux).",
      "Use cube and sphere symmetry to find flux through individual faces without explicit surface integration.",
    ],
    intuitiveIntro:
      "Imagine placing a small light bulb inside a closed paper lantern. Whether the lantern is a small sphere, a large sphere, or a cube, the total amount of light escaping through the entire closed surface depends only on the brightness of the bulb inside — not on the lantern's shape or size. Gauss's Law states this exact conservation rule for electric field lines.",
    definitionsAndFormulas: [
      {
        term: "Differential Electric Flux",
        formula: "$$d\\Phi = \\vec{E} \\cdot d\\vec{A} = E\\,dA\\cos\\theta$$",
        meaning:
          "Flux through a tiny area element $d\\vec{A}$ where $\\theta$ is the angle between electric field $\\vec{E}$ and the outward normal vector $\\hat{n}$.",
      },
      {
        term: "Gauss's Law (Integral Form)",
        formula: "$$\\Phi_{\\text{net}} = \\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$$",
        meaning:
          "Total outward electric flux through any closed Gaussian surface equals net enclosed charge $q_{\\text{enclosed}}$ divided by permittivity of free space $\\varepsilon_0$.",
      },
      {
        term: "Cube Face Symmetry",
        formula: "$$\\Phi_{\\text{face}} = \\frac{Q}{6\\varepsilon_0} \\quad (\\text{centre}) \\quad ; \\quad \\Phi_{\\text{face}} = \\frac{Q}{24\\varepsilon_0} \\quad (\\text{corner})$$",
        meaning:
          "When $+Q$ sits at the geometric centre of a cube, equal flux $\\frac{Q}{6\\varepsilon_0}$ passes through each of its $6$ identical square faces.",
      },
    ],
    keyTakeaways: [
      "Net flux through a closed surface depends only on enclosed charge: $\\Phi_{\\text{net}} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$.",
      "Charges outside the Gaussian surface affect the electric field $\\vec{E}$ at points on the surface, but contribute zero net flux.",
      "Flux is independent of the radius $R$ or shape of the closed surface as long as it encloses the same net charge.",
    ],
    conceptSections: [
      {
        heading: "1. What Electric Flux Really Measures",
        explanation:
          "Hold a rectangular frame in a steady stream of water. The water volume passing through per second depends on stream speed, frame area, and tilt angle. Electric flux measures how many electric field lines pierce a surface. For a closed 3D surface, outward-pointing field lines count as positive flux ($+\\Phi$) and inward-pointing lines count as negative flux ($-\\Phi$).",
        formulaHighlight: "$$d\\Phi = \\vec{E} \\cdot d\\vec{A} = E\\,dA\\cos\\theta \\qquad \\left(\\text{SI Unit: } \\text{N}\\cdot\\text{m}^2\\text{/C} \\text{ or } \\text{V}\\cdot\\text{m}\\right)$$",
        examTip:
          "Always measure $\\theta$ between the electric field vector $\\vec{E}$ and the outward normal (perpendicular) vector to the surface — not the angle with the surface plane itself.",
      },
      {
        heading: "2. Why External Charges Give Zero Net Flux",
        explanation:
          "Suppose a positive charge sits outside a closed hollow sphere. Its electric field lines pierce into the sphere on the near side (negative flux) and exit out of the sphere on the far side (positive flux). Because no field lines start or end inside the empty cavity, every line that enters must leave, cancelling to zero net flux.",
        formulaHighlight: "$$\\Phi_{\\text{net}} = \\frac{q_{\\text{in},1} + q_{\\text{in},2} + \\cdots + q_{\\text{in},n}}{\\varepsilon_0}$$",
        examTip:
          "If an electric dipole ($+q$ and $-q$) is completely enclosed inside a box, $q_{\\text{enclosed}} = +q - q = 0$, so the net flux through the box is strictly zero.",
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
          "A point charge $+Q$ is placed at the exact geometric centre of a cube of side $a$. Find the electric flux passing through (i) the entire closed cube, and (ii) any one square face of the cube.",
        givenData: [
          "Enclosed charge at centre = $+Q$",
          "Number of identical square faces = $6$",
        ],
        steps: [
          {
            stepTitle: "Apply Gauss's Law to the closed cube",
            detail:
              "Because the cube is a closed 3D surface completely surrounding $+Q$, total outward flux is given directly by Gauss's Law:",
            formula: "$$\\Phi_{\\text{total}} = \\oint_{\\text{cube}} \\vec{E} \\cdot d\\vec{A} = \\frac{Q}{\\varepsilon_0}$$",
          },
          {
            stepTitle: "Use symmetry for a single square face",
            detail:
              "The charge $+Q$ is equidistant from all $6$ identical square faces, so equal flux passes through each face:",
            formula: "$$\\Phi_{\\text{face}} = \\frac{\\Phi_{\\text{total}}}{6} = \\frac{Q}{6\\varepsilon_0}$$",
          },
        ],
        finalAnswer: "$$\\Phi_{\\text{total}} = \\frac{Q}{\\varepsilon_0} \\quad , \\quad \\Phi_{\\text{face}} = \\frac{Q}{6\\varepsilon_0}$$",
        commonMistakeNote:
          "If $+Q$ is placed at one corner (vertex) of a cube instead of the centre, $8$ identical cubes are required to surround the charge symmetrically. Total flux through one cube becomes $\\frac{Q}{8\\varepsilon_0}$, shared equally across the $3$ faces that do not touch the charge — giving $\\frac{Q}{24\\varepsilon_0}$ per non-adjacent face.",
      },
    ],
    knowledgeCheck: {
      id: "kc-gauss",
      prompt:
        "Quick Check: If we double the radius $R$ of a spherical Gaussian surface surrounding a point charge $+q$, what happens to the total electric flux $\\Phi$ through the sphere?",
      options: [
        { id: "A", text: "It remains unchanged ($\\Phi = \\frac{q}{\\varepsilon_0}$)" },
        { id: "B", text: "It decreases to one-fourth because $E \\propto \\frac{1}{R^2}$" },
        { id: "C", text: "It quadruples because surface area $A = 4\\pi R^2$" },
      ],
      correctId: "A",
      reinforcement:
        "Surface area increases by $4\\times$ while electric field $E = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q}{R^2}$ decreases by $4\\times$, so their product $\\Phi = E A = \\frac{q}{\\varepsilon_0}$ stays completely unchanged!",
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
      "Define electric dipole moment $\\vec{p} = q(2\\vec{a})$ and its direction from $-q$ to $+q$.",
      "Compare the magnitude and direction of $\\vec{E}_{\\text{axial}}$ and $\\vec{E}_{\\text{equatorial}}$ for a short dipole ($r \\gg a$).",
      "Calculate torque $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$ and work done in rotating a dipole in a uniform electric field.",
    ],
    intuitiveIntro:
      "Water molecules ($\\text{H}_2\\text{O}$) and $\\text{HCl}$ molecules have a slight separation between their positive and negative charge centres. Even though their total charge is zero, they still create an electric field nearby and twist to align when placed in an external electric field — just like a compass needle in a magnetic field.",
    definitionsAndFormulas: [
      {
        term: "Electric Dipole Moment",
        formula: "$$\\vec{p} = q(2\\vec{a}) \\qquad (\\text{directed from } -q \\text{ to } +q)$$",
        meaning: "Product of magnitude of either charge $q$ and separation vector $2\\vec{a}$.",
      },
      {
        term: "Short Dipole Axial vs Equatorial Field",
        formula: "$$E_{\\text{axial}} = \\frac{1}{4\\pi\\varepsilon_0}\\frac{2p}{r^3} \\quad ; \\quad E_{\\text{equatorial}} = \\frac{1}{4\\pi\\varepsilon_0}\\frac{p}{r^3}$$",
        meaning:
          "At distance $r \\gg a$, axial field is twice the equatorial field and points along $\\vec{p}$, while equatorial field points opposite to $\\vec{p}$.",
      },
      {
        term: "Torque & Potential Energy",
        formula: "$$\\tau = pE\\sin\\theta \\quad ; \\quad U(\\theta) = -\\vec{p}\\cdot\\vec{E} = -pE\\cos\\theta$$",
        meaning:
          "Stable equilibrium occurs at $\\theta = 0^\\circ$ ($U = -pE$) and unstable equilibrium at $\\theta = 180^\\circ$ ($U = +pE$).",
      },
    ],
    keyTakeaways: [
      "Dipole moment vector $\\vec{p} = q(2\\vec{a})$ always points from negative charge ($-q$) to positive charge ($+q$).",
      "For a short dipole ($r \\gg a$), $\\vec{E}_{\\text{axial}} = -2\\vec{E}_{\\text{equatorial}}$.",
      "Torque $\\tau = pE\\sin\\theta$ and Potential Energy $U(\\theta) = -pE\\cos\\theta$.",
    ],
    conceptSections: [
      {
        heading: "1. Axial vs Equatorial Field Ratio",
        explanation:
          "At the same distance $r$ from the centre of a short electric dipole, the electric field on the axial line is twice as strong as the field on the equatorial bisector, and points in the exact opposite direction.",
        formulaHighlight: "$$\\vec{E}_{\\text{axial}} = -2\\vec{E}_{\\text{equatorial}} \\qquad (\\text{for } r \\gg a)$$",
        examTip:
          "Unlike a single point charge where $E \\propto \\frac{1}{r^2}$, a dipole's electric field falls off faster as $E \\propto \\frac{1}{r^3}$ because the $+q$ and $-q$ fields partially cancel at large distances.",
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
          "An electric dipole of dipole moment $p$ is aligned in stable equilibrium with a uniform electric field $E$. Find the external work required to rotate it slowly by $180^\\circ$.",
        givenData: [
          "Initial angle $\\theta_1 = 0^\\circ$ (stable equilibrium)",
          "Final angle $\\theta_2 = 180^\\circ$ (unstable equilibrium)",
        ],
        steps: [
          {
            stepTitle: "Write the potential energy at both angles",
            detail:
              "Potential energy of a dipole at angle $\\theta$ with electric field $\\vec{E}$ is $U(\\theta) = -pE\\cos\\theta$:",
            formula: "$$U_1 = -pE\\cos 0^\\circ = -pE \\quad , \\quad U_2 = -pE\\cos 180^\\circ = +pE$$",
          },
          {
            stepTitle: "Find work done as change in potential energy",
            detail:
              "Work done by an external agent slowly without changing kinetic energy is $W_{\\text{ext}} = U_2 - U_1$:",
            formula: "$$W_{\\text{ext}} = (+pE) - (-pE) = +2pE$$",
          },
        ],
        finalAnswer: "$$W_{\\text{ext}} = 2pE$$",
        commonMistakeNote:
          "Rotating by $90^\\circ$ from stable equilibrium takes $W = +pE$, whereas rotating a full $180^\\circ$ takes $W = +2pE$.",
      },
    ],
    knowledgeCheck: {
      id: "kc-dipole",
      prompt:
        "Quick Check: What is the angle between the axial electric field vector $\\vec{E}_{\\text{axial}}$ and the equatorial electric field vector $\\vec{E}_{\\text{equatorial}}$ of a short electric dipole?",
      options: [
        { id: "A", text: "$180^\\circ$ (they point in opposite directions)" },
        { id: "B", text: "$0^\\circ$ (they point in the same direction)" },
        { id: "C", text: "$90^\\circ$ (perpendicular to each other)" },
      ],
      correctId: "A",
      reinforcement:
        "On the axial line, $\\vec{E}$ points along the dipole moment $\\vec{p}$ (from $-q$ to $+q$). On the equatorial line, $\\vec{E}$ points antiparallel to $\\vec{p}$ (from $+q$ toward $-q$), so the angle between them is $180^\\circ$.",
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
      "Resolve initial velocity $u$ at launch angle $\\theta$ into horizontal ($u\\cos\\theta$) and vertical ($u\\sin\\theta$) components.",
      "Derive time of flight $T$, maximum height $H_{\\max}$, and horizontal range $R$ on level ground.",
      "Apply the ratio $\\tan\\theta = \\frac{4H_{\\max}}{R}$ and kinetic energy conservation at the apex.",
    ],
    intuitiveIntro:
      "If you throw a cricket ball across a field, gravity pulls it downward but nothing pushes or slows it horizontally (ignoring air resistance). That means if a drone flew directly above the ball at constant horizontal speed $u\\cos\\theta$, it would stay right above the ball from launch until landing!",
    definitionsAndFormulas: [
      {
        term: "Time of Flight",
        formula: "$$T = \\frac{2u\\sin\\theta}{g}$$",
        meaning: "Total time the projectile remains in the air on level ground.",
      },
      {
        term: "Maximum Vertical Height",
        formula: "$$H_{\\max} = \\frac{u^2\\sin^2\\theta}{2g}$$",
        meaning: "Vertical apex reached when vertical velocity $v_y$ becomes $0$.",
      },
      {
        term: "Horizontal Range & Apex Shortcut",
        formula: "$$R = \\frac{u^2\\sin(2\\theta)}{g} \\quad ; \\quad \\tan\\theta = \\frac{4H_{\\max}}{R}$$",
        meaning:
          "Horizontal distance covered before returning to launch level; maximum at $\\theta = 45^\\circ$.",
      },
    ],
    keyTakeaways: [
      "Horizontal velocity $u_x = u\\cos\\theta$ remains constant throughout flight (neglecting air drag).",
      "At the highest point, vertical velocity $v_y = 0$, so speed is minimum and equals $v_{\\text{top}} = u\\cos\\theta$.",
      "Launch angles $\\theta$ and $(90^\\circ - \\theta)$ give the exact same horizontal range $R$ for a given initial speed $u$.",
    ],
    conceptSections: [
      {
        heading: "1. Decoupling Horizontal and Vertical Motion",
        explanation:
          "Gravity acts strictly vertically downwards ($a_y = -g$, $a_x = 0$). Horizontal motion and vertical motion proceed independently, linked only by the common time parameter $t$. Eliminating $t = \\frac{x}{u\\cos\\theta}$ yields the parabolic trajectory equation:",
        formulaHighlight: "$$y = x\\tan\\theta - \\frac{gx^2}{2u^2\\cos^2\\theta} = x\\tan\\theta\\left(1 - \\frac{x}{R}\\right)$$",
        examTip:
          "Because $v_y = 0$ at the highest point, kinetic energy at the apex is $K_{\\text{top}} = K_{\\text{initial}}\\cos^2\\theta$, and gravitational potential energy at the apex is $U_{\\text{top}} = K_{\\text{initial}}\\sin^2\\theta$.",
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
          "Find the angle of projection $\\theta$ from the horizontal for which the horizontal range $R$ of a projectile equals its maximum height $H_{\\max}$.",
        givenData: ["Condition: $R = H_{\\max}$"],
        steps: [
          {
            stepTitle: "Use the direct relation between R and H_max",
            detail:
              "Dividing $R = \\frac{2u^2\\sin\\theta\\cos\\theta}{g}$ by $H_{\\max} = \\frac{u^2\\sin^2\\theta}{2g}$ gives the universal ratio:",
            formula: "$$\\frac{R}{H_{\\max}} = \\frac{4}{\\tan\\theta} \\implies \\tan\\theta = \\frac{4H_{\\max}}{R}$$",
          },
          {
            stepTitle: "Substitute H_max = R",
            detail: "Replacing $\\frac{H_{\\max}}{R} = 1$ immediately yields $\\tan\\theta = 4$:",
            formula: "$$\\theta = \\tan^{-1}(4) \\approx 76^\\circ$$",
          },
        ],
        finalAnswer: "$$\\theta = \\tan^{-1}(4) \\approx 76^\\circ$$",
        commonMistakeNote:
          "Do not confuse $R = H_{\\max}$ ($\\tan\\theta = 4$) with maximum possible range ($\\theta = 45^\\circ$, where $R = 4H_{\\max}$).",
      },
    ],
    knowledgeCheck: {
      id: "kc-proj",
      prompt:
        "Quick Check: At the highest point of a projectile's trajectory (launched at angle $\\theta = 45^\\circ$), what is the angle between its velocity vector $\\vec{v}$ and acceleration vector $\\vec{a}$?",
      options: [
        { id: "A", text: "$90^\\circ$ (velocity is horizontal, gravity is vertical)" },
        { id: "B", text: "$0^\\circ$ (both are zero at the top)" },
        { id: "C", text: "$45^\\circ$ (same as launch angle)" },
      ],
      correctId: "A",
      reinforcement:
        "At the apex, vertical velocity is zero so velocity $\\vec{v} = u\\cos 45^\\circ\\,\\hat{i}$ points strictly horizontally, while gravitational acceleration $\\vec{a} = -g\\,\\hat{j}$ points strictly vertically downward — forming a $90^\\circ$ angle.",
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
      "Write the expressions for $K_c$, $K_p$, and reaction quotient $Q$ excluding pure solids and pure liquids.",
      "Relate $K_p$ and $K_c$ using $K_p = K_c(RT)^{\\Delta n_g}$.",
      "Predict shifts caused by concentration, pressure, temperature, and inert gas addition.",
    ],
    intuitiveIntro:
      "Think of chemical equilibrium like a balanced seesaw or two connected water tanks. If you pour extra water into the left tank, water flows right until the level ratio is restored. Only changing the temperature actually changes the target balance ratio ($K_c$) itself.",
    definitionsAndFormulas: [
      {
        term: "Kp and Kc Relationship",
        formula: "$$K_p = K_c(RT)^{\\Delta n_g}$$",
        meaning:
          "$\\Delta n_g = \\sum n_{\\text{products}(g)} - \\sum n_{\\text{reactants}(g)}$ (count only gaseous species).",
      },
      {
        term: "Direction Prediction via Q",
        formula: "$$Q < K_c \\implies \\text{Forward Shift} \\quad ; \\quad Q > K_c \\implies \\text{Backward Shift}$$",
        meaning:
          "Reaction quotient $Q$ has the same form as $K_c$ but uses instantaneous non-equilibrium concentrations.",
      },
    ],
    keyTakeaways: [
      "Only temperature changes the numerical value of the equilibrium constant $K_c$ or $K_p$ via the van 't Hoff equation $\\ln\\left(\\frac{K_2}{K_1}\\right) = \\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)$.",
      "If $Q < K_c$, the reaction proceeds forward (left to right) to form more products.",
      "Adding an inert gas at constant volume causes no shift in equilibrium; at constant pressure, it shifts toward the side with more gas moles.",
    ],
    conceptSections: [
      {
        heading: "1. Comparing Reaction Quotient Q with Kc",
        explanation:
          "At any instant during a reversible reaction $a\\text{A} + b\\text{B} \\rightleftharpoons c\\text{C} + d\\text{D}$, the reaction quotient $Q_c = \\frac{[\\text{C}]^c[\\text{D}]^d}{[\\text{A}]^a[\\text{B}]^b}$ tells you which way the system will move to reach balance.",
        formulaHighlight: "$$Q_c < K_c \\implies \\text{Forward} \\quad | \\quad Q_c = K_c \\implies \\text{Equilibrium} \\quad | \\quad Q_c > K_c \\implies \\text{Backward}$$",
        examTip:
          "Pure solids (like $\\text{CaCO}_3(s)$) and pure liquids (like $\\text{H}_2\\text{O}(l)$) have constant unit activity ($a = 1$) and are omitted from $Q$ and $K_c$.",
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
          "For the reversible synthesis of ammonia $\\text{N}_2(g) + 3\\text{H}_2(g) \\rightleftharpoons 2\\text{NH}_3(g)$ at temperature $T$, derive the relationship between $K_p$ and $K_c$.",
        givenData: [
          "Gaseous product moles = $2$",
          "Gaseous reactant moles = $1 + 3 = 4$",
        ],
        steps: [
          {
            stepTitle: "Find Δn_g (change in moles of gas)",
            detail:
              "Count only gaseous species on both sides of the balanced chemical equation:",
            formula: "$$\\Delta n_g = n_{\\text{products}(g)} - n_{\\text{reactants}(g)} = 2 - (1 + 3) = -2$$",
          },
          {
            stepTitle: "Substitute into Kp = Kc (RT)^(Δn_g)",
            detail: "With $\\Delta n_g = -2$, $K_p$ is smaller than $K_c$ by a factor of $(RT)^2$:",
            formula: "$$K_p = K_c(RT)^{-2} = \\frac{K_c}{(RT)^2}$$",
          },
        ],
        finalAnswer: "$$K_p = \\frac{K_c}{(RT)^2}$$",
        commonMistakeNote:
          "Always use $R = 0.0821\\text{ L}\\cdot\\text{atm}\\cdot\\text{mol}^{-1}\\cdot\\text{K}^{-1}$ when partial pressures are expressed in atmospheres.",
      },
    ],
    knowledgeCheck: {
      id: "kc-equilibrium",
      prompt:
        "Quick Check: For the heterogeneous equilibrium $\\text{CaCO}_3(s) \\rightleftharpoons \\text{CaO}(s) + \\text{CO}_2(g)$, what is the correct expression for $K_p$?",
      options: [
        { id: "A", text: "$K_p = P_{\\text{CO}_2}$ only" },
        { id: "B", text: "$K_p = \\frac{P_{\\text{CaO}} \\cdot P_{\\text{CO}_2}}{P_{\\text{CaCO}_3}}$" },
        { id: "C", text: "$K_p = \\frac{1}{P_{\\text{CO}_2}}$" },
      ],
      correctId: "A",
      reinforcement:
        "$\\text{CaCO}_3(s)$ and $\\text{CaO}(s)$ are pure solids with unit activity ($1$), so only gaseous $\\text{CO}_2$ appears in $K_p = P_{\\text{CO}_2}$.",
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
      "Calculate standard cell EMF using $E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}}$.",
      "Apply the Nernst equation at $298\\text{ K}$: $E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} Q$.",
      "Connect $E^\\circ_{\\text{cell}}$ with standard Gibbs energy $\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}$ and equilibrium constant $K_{\\text{eq}}$.",
    ],
    intuitiveIntro:
      "A battery's voltage is not fixed forever — as reactants get used up and product ions build up in solution, the driving force drops until the battery goes flat ($E_{\\text{cell}} = 0$ at chemical equilibrium). The Nernst equation tells us the exact voltage at any ion concentration.",
    definitionsAndFormulas: [
      {
        term: "Nernst Equation at 298 K",
        formula: "$$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} Q$$",
        meaning:
          "Relates non-standard cell potential $E_{\\text{cell}}$ to standard potential $E^\\circ_{\\text{cell}}$, electron count $n$, and reaction quotient $Q$.",
      },
      {
        term: "Gibbs Free Energy Relation",
        formula: "$$\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}} = -2.303RT\\log_{10} K_{\\text{eq}}$$",
        meaning:
          "A positive $E^\\circ_{\\text{cell}}$ guarantees $\\Delta G^\\circ < 0$ (spontaneous cell reaction) and $K_{\\text{eq}} > 1$.",
      },
    ],
    keyTakeaways: [
      "At $298\\text{ K}$ ($25^\\circ\\text{C}$), $E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} Q$.",
      "Maximum electrical work done by a reversible galvanic cell equals the decrease in Gibbs free energy: $W_{\\max} = -\\Delta G = nFE_{\\text{cell}}$.",
      "At chemical equilibrium, $E_{\\text{cell}} = 0$ and $Q = K_{\\text{eq}}$, so $E^\\circ_{\\text{cell}} = \\frac{0.0591}{n}\\log_{10} K_{\\text{eq}}$.",
    ],
    conceptSections: [
      {
        heading: "1. Applying the Nernst Equation Without Sign Errors",
        explanation:
          "First balance the half-cell reactions so the number of transferred electrons $n$ matches. Then write $Q = \\frac{[\\text{Anode Product Ion}]^a}{[\\text{Cathode Reactant Ion}]^b}$ raised to their stoichiometric coefficients.",
        formulaHighlight: "$$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10}\\left(\\frac{[\\text{Anode Ion}]^a}{[\\text{Cathode Ion}]^b}\\right)$$",
        examTip:
          "Diluting the anode compartment lowers $[\\text{Anode Ion}]$, which decreases $Q$ and therefore increases cell voltage $E_{\\text{cell}}$.",
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
          "In a Daniell cell $\\text{Zn}(s)\\,|\\,\\text{Zn}^{2+}(0.01\\text{ M})\\,\\|\\,\\text{Cu}^{2+}(1.0\\text{ M})\\,|\\,\\text{Cu}(s)$ with $E^\\circ_{\\text{cell}} = 1.10\\text{ V}$ at $298\\text{ K}$, calculate $E_{\\text{cell}}$.",
        givenData: [
          "$E^\\circ_{\\text{cell}} = 1.10\\text{ V}$",
          "$n = 2$ electrons",
          "$[\\text{Zn}^{2+}] = 0.01\\text{ M}$, $[\\text{Cu}^{2+}] = 1.0\\text{ M}$",
        ],
        steps: [
          {
            stepTitle: "Calculate reaction quotient Q",
            detail:
              "Overall cell reaction is $\\text{Zn}(s) + \\text{Cu}^{2+}(aq) \\rightarrow \\text{Zn}^{2+}(aq) + \\text{Cu}(s)$:",
            formula: "$$Q = \\frac{[\\text{Zn}^{2+}]}{[\\text{Cu}^{2+}]} = \\frac{0.01}{1.0} = 10^{-2}$$",
          },
          {
            stepTitle: "Substitute into Nernst Equation",
            detail: "Since $\\log_{10}(10^{-2}) = -2$, the second term adds to $E^\\circ_{\\text{cell}}$:",
            formula:
              "$$E_{\\text{cell}} = 1.10 - \\frac{0.0591}{2}(-2) = 1.10 + 0.0591 = 1.1591\\text{ V}$$",
          },
        ],
        finalAnswer: "$$E_{\\text{cell}} \\approx 1.16\\text{ V}$$",
        commonMistakeNote:
          "Do not invert $\\frac{[\\text{Zn}^{2+}]}{[\\text{Cu}^{2+}]}$; the oxidation product $\\text{Zn}^{2+}$ always goes in the numerator of $Q$.",
      },
    ],
    knowledgeCheck: {
      id: "kc-nernst",
      prompt:
        "Quick Check: When a galvanic cell reaches complete chemical equilibrium (a dead battery), which statement is true?",
      options: [
        { id: "A", text: "$E_{\\text{cell}} = 0$, but $E^\\circ_{\\text{cell}} \\ne 0$" },
        { id: "B", text: "Both $E_{\\text{cell}} = 0$ and $E^\\circ_{\\text{cell}} = 0$" },
        { id: "C", text: "$E_{\\text{cell}} = E^\\circ_{\\text{cell}}$" },
      ],
      correctId: "A",
      reinforcement:
        "At equilibrium, current stops flowing so $E_{\\text{cell}} = 0$, whereas $E^\\circ_{\\text{cell}} = \\frac{0.0591}{n}\\log_{10} K_{\\text{eq}}$ is a constant standard property fixed by $K_{\\text{eq}}$.",
    },
  },
  {
    id: "topic-quadratic-roots",
    chapterId: "math-11-quadratics",
    subjectId: "mathematics",
    classLevel: "11",
    applicableExams: ["JEE Main", "JEE Advanced", "JEE Main + Advanced"],
    title: "Quadratic Formula, Discriminant & Vieta's Root Relations",
    estimatedMinutes: 25,
    difficulty: "Foundation",
    summary:
      "Solve ax² + bx + c = 0 using the quadratic formula, classify roots via the discriminant Δ = b² − 4ac, and evaluate symmetric root expressions using Vieta's relations.",
    learningObjectives: [
      "Apply the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ by identifying coefficients $a, b, c$ and simplifying radicals.",
      "Classify the nature of roots using the discriminant $\\Delta = b^2 - 4ac$ (real and distinct, real and equal, or complex conjugates).",
      "Apply $\\alpha + \\beta = -\\frac{b}{a}$ and $\\alpha\\beta = \\frac{c}{a}$ to evaluate symmetric root expressions like $\\alpha^2 + \\beta^2$ and $|\\alpha - \\beta|$.",
    ],
    intuitiveIntro:
      "Every quadratic equation $ax^2 + bx + c = 0$ ($a \\neq 0$) represents a parabola $y = ax^2 + bx + c$. Completing the square centres the parabola at its axis of symmetry $x = -\\frac{b}{2a}$, while the term $\\frac{\\sqrt{b^2 - 4ac}}{2a}$ measures how far the two roots step to the left and right of that vertex.",
    definitionsAndFormulas: [
      {
        term: "The Quadratic Formula & Discriminant",
        formula: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\qquad \\text{where } \\Delta = b^2 - 4ac$$",
        meaning: "Here $a \\neq 0$ is the coefficient of $x^2$, $b$ is the coefficient of $x$, $c$ is the constant term, and $\\Delta$ is the discriminant.",
      },
      {
        term: "Sum, Product & Difference of Roots (Vieta's Formulas)",
        formula: "$$\\alpha + \\beta = -\\frac{b}{a} \\quad ; \\quad \\alpha\\beta = \\frac{c}{a} \\quad ; \\quad |\\alpha - \\beta| = \\frac{\\sqrt{b^2 - 4ac}}{|a|}$$",
        meaning: "Connects the roots $\\alpha, \\beta$ directly to coefficients $a, b, c$ without computing individual roots.",
      },
    ],
    keyTakeaways: [
      "For $ax^2 + bx + c = 0$ ($a \\neq 0$), the roots are $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$ where $\\Delta = b^2 - 4ac$.",
      "Sum of roots $\\alpha + \\beta = -\\frac{b}{a}$ and product $\\alpha\\beta = \\frac{c}{a}$; always rewrite $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta$.",
      "If coefficients $a, b, c \\in \\mathbb{Q}$ and $\\Delta > 0$ is not a perfect square, irrational roots occur in conjugate pairs $p \\pm \\sqrt{q}$.",
    ],
    conceptSections: [
      {
        heading: "1. The Quadratic Formula, Variables & Discriminant Classification",
        explanation:
          "For any quadratic equation in standard form $ax^2 + bx + c = 0$ with leading coefficient $a \\neq 0$, linear coefficient $b$, and constant term $c$, completing the square yields the quadratic formula. The quantity under the radical, $\\Delta = b^2 - 4ac$, determines the nature of the roots:",
        formulaHighlight: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\quad , \\quad \\text{Nature of Roots: } \\begin{cases} \\Delta > 0 & \\text{Two distinct real roots} \\\\ \\Delta = 0 & \\text{Two equal real roots } \\left(x = -\\frac{b}{2a}\\right) \\\\ \\Delta < 0 & \\text{Non-real complex conjugate roots} \\end{cases}$$",
        examTip:
          "Always rearrange the equation into standard form $ax^2 + bx + c = 0$ and carry the negative signs of $b$ and $c$ before substituting into $\\Delta = b^2 - 4ac$.",
      },
      {
        heading: "2. Evaluating Symmetric Root Identities Fast",
        explanation:
          "Expanding $a(x - \\alpha)(x - \\beta) = ax^2 - a(\\alpha + \\beta)x + a\\alpha\\beta$ shows that any expression symmetric in $\\alpha$ and $\\beta$ can be written purely in terms of $S = \\alpha + \\beta = -\\frac{b}{a}$ and $P = \\alpha\\beta = \\frac{c}{a}$.",
        formulaHighlight: "$$\\alpha^2 + \\beta^2 = S^2 - 2P \\qquad | \\qquad \\alpha^3 + \\beta^3 = S^3 - 3PS$$",
        examTip:
          "If $\\alpha$ is a root of $ax^2 + bx + c = 0$, you can also reduce high powers using Newton's sum relation $aS_n + bS_{n-1} + cS_{n-2} = 0$, where $S_n = \\alpha^n + \\beta^n$.",
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
        id: "we-quad-formula-sub",
        title: "Solving a Quadratic Equation by Formula Substitution & Radical Simplification",
        examTag: "Foundation Textbook Example",
        problemStatement:
          "Find the exact roots of the quadratic equation $2x^2 - 6x + 3 = 0$ using the quadratic formula, and state the distance $|\\alpha - \\beta|$ between the two roots.",
        givenData: [
          "Standard form $ax^2 + bx + c = 0$",
          "$a = 2$",
          "$b = -6$",
          "$c = 3$",
        ],
        steps: [
          {
            stepTitle: "Compute the discriminant Δ = b² − 4ac",
            detail:
              "Substitute $a = 2$, $b = -6$, and $c = 3$ into $\\Delta = b^2 - 4ac$, taking care to square the negative coefficient $(-6)^2 = +36$:",
            formula: "$$\\Delta = b^2 - 4ac = (-6)^2 - 4(2)(3) = 36 - 24 = 12 > 0$$",
          },
          {
            stepTitle: "Substitute into the quadratic formula",
            detail:
              "Since $\\Delta = 12 > 0$, the equation has two distinct irrational real roots. Substitute $b = -6$, $\\Delta = 12$, and $a = 2$:",
            formula: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} = \\frac{-(-6) \\pm \\sqrt{12}}{2(2)} = \\frac{6 \\pm 2\\sqrt{3}}{4}$$",
          },
          {
            stepTitle: "Factor and simplify the fraction and root separation",
            detail:
              "Divide numerator and denominator by the common factor $2$, and compute $|\\alpha - \\beta| = \\frac{\\sqrt{\\Delta}}{|a|}$:",
            formula: "$$x = \\frac{3 \\pm \\sqrt{3}}{2} \\quad \\implies \\quad |\\alpha - \\beta| = \\frac{\\sqrt{12}}{2} = \\sqrt{3}$$",
          },
        ],
        finalAnswer: "$$x = \\frac{3 + \\sqrt{3}}{2} \\ , \\ \\frac{3 - \\sqrt{3}}{2} \\qquad \\left(|\\alpha - \\beta| = \\sqrt{3}\\right)$$",
        commonMistakeNote:
          "When cancelling a factor from $\\frac{6 \\pm 2\\sqrt{3}}{4}$, divide BOTH terms in the numerator by $2$ — cancelling only the $6$ with $4$ is a classic algebraic error.",
      },
      {
        id: "we-quad-sum-squares",
        title: "Sum of Squares of Roots Without Finding Individual Roots",
        examTag: "Illustrative JEE Main Example",
        problemStatement:
          "If $\\alpha$ and $\\beta$ are the roots of $x^2 - 5x + 3 = 0$, find the exact value of $\\alpha^2 + \\beta^2$ and $\\frac{1}{\\alpha^2} + \\frac{1}{\\beta^2}$.",
        givenData: ["$a = 1, b = -5, c = 3$", "$\\alpha + \\beta = 5$", "$\\alpha\\beta = 3$"],
        steps: [
          {
            stepTitle: "Use the symmetric identity for α² + β²",
            detail: "Express $\\alpha^2 + \\beta^2$ in terms of $\\alpha + \\beta = 5$ and $\\alpha\\beta = 3$:",
            formula: "$$\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = 5^2 - 2(3) = 25 - 6 = 19$$",
          },
          {
            stepTitle: "Evaluate the reciprocal sum of squares",
            detail: "Combine over the common denominator $(\\alpha\\beta)^2 = 9$:",
            formula: "$$\\frac{1}{\\alpha^2} + \\frac{1}{\\beta^2} = \\frac{\\alpha^2 + \\beta^2}{(\\alpha\\beta)^2} = \\frac{19}{3^2} = \\frac{19}{9}$$",
          },
        ],
        finalAnswer: "$$\\alpha^2 + \\beta^2 = 19 \\quad , \\quad \\frac{1}{\\alpha^2} + \\frac{1}{\\beta^2} = \\frac{19}{9}$$",
        commonMistakeNote:
          "Watch the sign of $\\alpha + \\beta = -\\frac{b}{a}$: for $x^2 - 5x + 3 = 0$, $\\alpha + \\beta = +5$. A sign mistake here will ruin odd-power sums like $\\alpha^3 + \\beta^3$.",
      },
    ],
    knowledgeCheck: {
      id: "kc-quad",
      prompt:
        "Quick Check: If the sum of the coefficients ($a + b + c = 0$) of a quadratic equation $ax^2 + bx + c = 0$ equals zero, what are its two roots?",
      options: [
        { id: "A", text: "$x = 1$ and $x = \\frac{c}{a}$" },
        { id: "B", text: "$x = 0$ and $x = -\\frac{b}{a}$" },
        { id: "C", text: "$x = -1$ and $x = -\\frac{c}{a}$" },
      ],
      correctId: "A",
      reinforcement:
        "Substituting $x = 1$ into $ax^2 + bx + c$ gives $a(1)^2 + b(1) + c = a + b + c = 0$. Since the product of roots is $\\frac{c}{a}$, the second root is immediately $\\frac{c}{a}$!",
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
      "Master the reflection symmetry identity to solve complex trigonometric and algebraic definite integrals in seconds.",
    learningObjectives: [
      "Apply King's property $\\int_{a}^{b} f(x)\\,dx = \\int_{a}^{b} f(a + b - x)\\,dx$.",
      "Recognise the canonical quotient form $\\int_{a}^{b} \\frac{g(x)}{g(x) + g(a + b - x)}\\,dx = \\frac{b - a}{2}$.",
      "Use even and odd function symmetry on symmetric intervals $[-a, a]$.",
    ],
    intuitiveIntro:
      "If you flip an asymmetric hill horizontally from left to right between milestones $a$ and $b$, the cross-sectional area of the hill does not change. Adding the original hill and the flipped hill together often creates a flat horizontal top of height $1$ — turning a hard calculus problem into a simple rectangle area!",
    definitionsAndFormulas: [
      {
        term: "King's Property (Reflection Identity)",
        formula: "$$\\int_{a}^{b} f(x)\\,dx = \\int_{a}^{b} f(a + b - x)\\,dx$$",
        meaning: "Horizontal reflection across the midpoint $x = \\frac{a + b}{2}$ preserves definite integral area.",
      },
      {
        term: "Complementary Quotient Shortcut",
        formula: "$$I = \\int_{a}^{b} \\frac{g(x)}{g(x) + g(a+b-x)}\\,dx = \\frac{b - a}{2}$$",
        meaning: "Adding $I$ and the reflected integral yields $2I = \\int_{a}^{b} 1\\,dx = b - a$.",
      },
    ],
    keyTakeaways: [
      "Replacing $x$ with $(a + b - x)$ reflects the curve horizontally across the midpoint $x = \\frac{a + b}{2}$, leaving the area unchanged.",
      "Whenever an integral has the form $\\int_{a}^{b} \\frac{g(x)}{g(x) + g(a + b - x)}\\,dx$, its value is always $\\frac{b - a}{2}$.",
      "For symmetric limits $[-a, a]$, check whether $f(-x) = -f(x)$ (odd function $\\implies 0$) or $f(-x) = f(x)$ (even function $\\implies 2\\int_{0}^{a} f(x)\\,dx$).",
    ],
    conceptSections: [
      {
        heading: "1. The Symmetry Shortcut & Even/Odd Piecewise Rule",
        explanation:
          "Many definite integrals look impossible to antidifferentiate directly. By labelling the integral $I$, applying $x \\mapsto a + b - x$, and adding the two versions of $I$ together, the numerator and denominator cancel to $1$. Likewise, on symmetric limits $[-a, a]$:",
        formulaHighlight: "$$\\int_{-a}^{a} f(x)\\,dx = \\begin{cases} 2\\int_{0}^{a} f(x)\\,dx & \\text{if } f(-x) = f(x) \\text{ (even)} \\\\ 0 & \\text{if } f(-x) = -f(x) \\text{ (odd)} \\end{cases}$$",
        examTip:
          "Before trying integration by parts or substitution on $\\left[0, \\frac{\\pi}{2}\\right]$, always test $x \\mapsto \\frac{\\pi}{2} - x$ first.",
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
        title: "Evaluating a Classic Trigonometric Integral via King's Property",
        examTag: "Illustrative JEE Main & Advanced Example",
        problemStatement:
          "Evaluate the definite integral $$I = \\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}}\\,dx$$",
        givenData: ["Lower limit $a = 0$, Upper limit $b = \\frac{\\pi}{2}$"],
        steps: [
          {
            stepTitle: "Apply King's Property x ↦ (π/2 − x)",
            detail:
              "Since $\\sin\\left(\\frac{\\pi}{2} - x\\right) = \\cos x$ and $\\cos\\left(\\frac{\\pi}{2} - x\\right) = \\sin x$, the transformed integral becomes:",
            formula: "$$I = \\int_{0}^{\\pi/2} \\frac{\\sqrt{\\cos x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}}\\,dx$$",
          },
          {
            stepTitle: "Add the original and transformed integrals",
            detail:
              "Adding the two expressions for $I$ term-by-term inside the integral:",
            formula: "$$2I = \\int_{0}^{\\pi/2} \\frac{\\sqrt{\\sin x} + \\sqrt{\\cos x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}}\\,dx = \\int_{0}^{\\pi/2} 1\\,dx = \\frac{\\pi}{2} \\implies I = \\frac{\\pi}{4}$$",
          },
        ],
        finalAnswer: "$$I = \\frac{\\pi}{4}$$",
        commonMistakeNote:
          "The exact same result $I = \\frac{\\pi}{4}$ holds for any real exponent $n$ in $\\int_{0}^{\\pi/2} \\frac{\\sin^n x}{\\sin^n x + \\cos^n x}\\,dx$.",
      },
    ],
    knowledgeCheck: {
      id: "kc-calc",
      prompt:
        "Quick Check: Using the symmetry shortcut $I = \\frac{b - a}{2}$, what is the value of $\\int_{1}^{5} \\frac{\\sqrt{x}}{\\sqrt{x} + \\sqrt{6 - x}}\\,dx$?",
      options: [
        { id: "A", text: "$2$  (since $\\frac{5 - 1}{2} = 2$)" },
        { id: "B", text: "$4$  (since $5 - 1 = 4$)" },
        { id: "C", text: "$3$  (since $\\frac{5 + 1}{2} = 3$)" },
      ],
      correctId: "A",
      reinforcement:
        "Here $a = 1$, $b = 5$, and $a + b - x = 6 - x$. Adding $I$ and the reflected integral gives $2I = \\int_{1}^{5} 1\\,dx = 5 - 1 = 4$, so $I = 2$!",
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
      "Interpret the sigmoid (S-shaped) oxygen-haemoglobin dissociation curve and $P_{50}$.",
      "Contrast alveolar conditions (Left shift / $\\text{O}_2$ loading) with exercising tissue conditions (Right shift / $\\text{O}_2$ unloading).",
      "Calculate the volume of $\\text{O}_2$ delivered per $100\\text{ mL}$ of blood under normal resting conditions.",
    ],
    intuitiveIntro:
      "Haemoglobin acts like a smart delivery truck for oxygen. In the lungs (the warehouse), it needs high stickiness so it loads up to $97\\%$ capacity. When it reaches hard-working muscle cells that are warm and releasing $\\text{CO}_2$, that very $\\text{CO}_2$ and acidity signal haemoglobin to loosen its grip and unload oxygen right where it is needed.",
    definitionsAndFormulas: [
      {
        term: "Half-Saturation Pressure (P₅₀)",
        formula: "$$P_{50} \\approx 25\\text{--}27\\text{ mmHg O}_2 \\qquad (\\text{Normal Arterial Blood})$$",
        meaning:
          "Partial pressure of oxygen at which haemoglobin is $50\\%$ saturated with $\\text{O}_2$. Higher $P_{50}$ means lower affinity.",
      },
      {
        term: "Bohr Effect Equilibrium",
        formula: "$$\\text{Hb}(\\text{O}_2)_4 + \\text{H}^+ \\rightleftharpoons \\text{HbH}^+ + 4\\text{O}_2$$",
        meaning:
          "Higher $[\\text{H}^+]$ (lower pH) and higher $p\\text{CO}_2$ in active tissues drive the equilibrium forward, releasing free $\\text{O}_2$.",
      },
    ],
    keyTakeaways: [
      "Each haemoglobin molecule carries up to $4$ molecules of $\\text{O}_2$, producing a cooperative sigmoid (S-shaped) saturation curve.",
      "$P_{50}$ is the partial pressure of $\\text{O}_2$ at which haemoglobin is $50\\%$ saturated (normally $\\approx 25\\text{--}27\\text{ mmHg}$).",
      "Right shift (increased $P_{50}$, lower affinity, more $\\text{O}_2$ unloading) is caused by high $p\\text{CO}_2$, high $[\\text{H}^+]$ (low pH), high temperature, and high $2,3\\text{-BPG}$.",
    ],
    conceptSections: [
      {
        heading: "1. Why Active Muscles Need a Right Shift",
        explanation:
          "During sprint exercise, muscle cells respire rapidly, releasing $\\text{CO}_2$, lactic acid ($\\text{H}^+$), and heat. Through the Bohr effect, $\\text{H}^+$ and $\\text{CO}_2$ bind to haemoglobin and alter its conformation, lowering its oxygen affinity so oxygen is unloaded where cells need it most.",
        formulaHighlight: "$$\\text{Right Shift Factors: } \\uparrow p\\text{CO}_2 \\quad | \\quad \\uparrow [\\text{H}^+]\\,(\\downarrow \\text{pH}) \\quad | \\quad \\uparrow T \\quad | \\quad \\uparrow 2,3\\text{-BPG}$$",
        examTip:
          "Memory hook for NEET UG: 'CADET, face Right!' — $\\text{CO}_2$, Acid ($\\text{H}^+$), $2,3\\text{-DPG}$, Exercise, and Temperature all shift the dissociation curve to the Right.",
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
          "How much oxygen is delivered by $100\\text{ mL}$ of oxygenated blood to tissues under normal resting physiological conditions?",
        givenData: [
          "Haemoglobin content $\\approx 15\\text{ g}$ per $100\\text{ mL}$ blood",
          "Oxygen carried by $100\\text{ mL}$ arterial blood $\\approx 20\\text{ mL}$",
          "Oxygen remaining in $100\\text{ mL}$ venous blood at rest $\\approx 15\\text{ mL}$",
        ],
        steps: [
          {
            stepTitle: "Compare arterial vs venous saturation",
            detail:
              "In alveoli ($p\\text{O}_2 = 104\\text{ mmHg}$), Hb is $\\approx 97\\%$ saturated ($\\approx 20\\text{ mL O}_2/100\\text{ mL}$). In resting tissues ($p\\text{O}_2 = 40\\text{ mmHg}$), Hb remains $\\approx 75\\%$ saturated ($\\approx 15\\text{ mL O}_2/100\\text{ mL}$).",
          },
          {
            stepTitle: "Calculate unloaded oxygen volume",
            detail:
              "Subtract venous oxygen content from arterial oxygen content:",
            formula: "$$V_{\\text{delivered}} = 20\\text{ mL} - 15\\text{ mL} = 5\\text{ mL O}_2 \\text{ per } 100\\text{ mL blood}$$",
          },
        ],
        finalAnswer:
          "$5\\text{ mL}$ of $\\text{O}_2$ per $100\\text{ mL}$ of blood under normal resting conditions.",
        commonMistakeNote:
          "Students often confuse total $\\text{O}_2$ carried ($20\\text{ mL}$ per $100\\text{ mL}$ blood) with $\\text{O}_2$ actually unloaded to resting tissues ($5\\text{ mL}$ per $100\\text{ mL}$ blood).",
      },
    ],
    knowledgeCheck: {
      id: "kc-bohr",
      prompt:
        "Quick Check: When the oxygen-haemoglobin dissociation curve shifts to the right during strenuous exercise, what happens to the value of $P_{50}$?",
      options: [
        { id: "A", text: "$P_{50}$ increases (indicating lower affinity and easier $\\text{O}_2$ release)" },
        { id: "B", text: "$P_{50}$ decreases (indicating tighter $\\text{O}_2$ binding)" },
        { id: "C", text: "$P_{50}$ stays constant at $104\\text{ mmHg}$" },
      ],
      correctId: "A",
      reinforcement:
        "A right shift means a higher partial pressure of $\\text{O}_2$ is required to achieve $50\\%$ saturation, so $P_{50}$ increases and oxygen unloads more easily into active tissues.",
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
      "Apply Chargaff's rule $[\\text{A}] = [\\text{T}]$ and $[\\text{G}] = [\\text{C}]$ for double-stranded DNA.",
      "Count hydrogen bonds ($2$ between $\\text{A}=\\text{T}$, $3$ between $\\text{G}\\equiv\\text{C}$) and calculate total helix length using $0.34\\text{ nm}$ per base pair.",
      "Understand nucleosome packaging ($\\approx 200\\text{ bp}$ wrapped around a positively charged histone octamer).",
    ],
    intuitiveIntro:
      "A double-stranded DNA molecule is like a twisted spiral staircase where every step has a fixed width. Because a two-ring purine ($\\text{A}$ or $\\text{G}$) always pairs with a one-ring pyrimidine ($\\text{T}$ or $\\text{C}$), knowing the percentage of just one base immediately reveals the percentages of the other three!",
    definitionsAndFormulas: [
      {
        term: "Chargaff's Purine-Pyrimidine Ratio",
        formula: "$$\\frac{[\\text{A}] + [\\text{G}]}{[\\text{T}] + [\\text{C}]} = 1 \\quad \\implies \\quad \\%\\text{A} + \\%\\text{G} = 50\\%$$",
        meaning: "Total purines equal total pyrimidines in double-stranded DNA.",
      },
      {
        term: "B-DNA Helix Geometry & H-Bonds",
        formula: "$$L = N_{\\text{bp}} \\times 0.34\\text{ nm} \\quad ; \\quad N_{\\text{H-bonds}} = 2N_{\\text{AT}} + 3N_{\\text{GC}}$$",
        meaning: "Distance between adjacent base pairs is $0.34\\text{ nm}$ ($3.4\\text{ \\AA}$), with $10\\text{ bp}$ per $3.4\\text{ nm}$ turn.",
      },
    ],
    keyTakeaways: [
      "In double-stranded DNA (dsDNA), $\\%\\text{A} = \\%\\text{T}$ and $\\%\\text{G} = \\%\\text{C}$, so Purines $(\\text{A} + \\text{G}) =$ Pyrimidines $(\\text{T} + \\text{C}) = 50\\%$.",
      "Adenine pairs with Thymine via $2$ H-bonds ($\\text{A}=\\text{T}$); Guanine pairs with Cytosine via $3$ H-bonds ($\\text{G}\\equiv\\text{C}$).",
      "Distance between consecutive base pairs in B-DNA is $0.34\\text{ nm}$ ($3.4 \\times 10^{-10}\\text{ m}$).",
    ],
    conceptSections: [
      {
        heading: "1. Solving Base Percentage Numericals in 10 Seconds",
        explanation:
          "Since $\\%\\text{A} + \\%\\text{G} = 50\\%$ in any double-stranded DNA molecule, if a question gives $\\%\\text{Cytosine} = 18\\%$, then $\\%\\text{Guanine} = 18\\%$, and $\\%\\text{Adenine} = \\%\\text{Thymine} = 50\\% - 18\\% = 32\\%$.",
        formulaHighlight: "$$\\%\\text{A} = \\%\\text{T} = 50\\% - \\%\\text{G} = 50\\% - \\%\\text{C} \\qquad (\\text{valid for dsDNA})$$",
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
          "If a double-stranded DNA sample contains $22\\%$ Guanine, what is the percentage of Adenine in the sample?",
        givenData: ["$\\%\\text{G} = 22\\%$", "Double-stranded DNA follows Chargaff's rule"],
        steps: [
          {
            stepTitle: "Use %A + %G = 50%",
            detail: "In dsDNA, total purines ($\\text{A} + \\text{G}$) always make up $50\\%$ of all bases:",
            formula: "$$\\%\\text{A} = 50\\% - \\%\\text{G} = 50\\% - 22\\% = 28\\%$$",
          },
        ],
        finalAnswer: "$$28\\%$$",
        commonMistakeNote:
          "Do not subtract $22\\%$ from $100\\%$ without dividing by $2$: $100\\% - (22\\%\\text{ G} + 22\\%\\text{ C}) = 56\\%$ for $(\\text{A} + \\text{T})$, which divides by $2$ to give $28\\%$ Adenine.",
      },
    ],
    knowledgeCheck: {
      id: "kc-dna",
      prompt:
        "Quick Check: How many hydrogen bonds are present in a short B-DNA segment containing $10$ $\\text{A-T}$ base pairs and $10$ $\\text{G-C}$ base pairs?",
      options: [
        { id: "A", text: "$50$ hydrogen bonds  ($10\\times 2 + 10\\times 3$)" },
        { id: "B", text: "$40$ hydrogen bonds  ($20\\times 2$)" },
        { id: "C", text: "$60$ hydrogen bonds  ($20\\times 3$)" },
      ],
      correctId: "A",
      reinforcement:
        "Each $\\text{A}=\\text{T}$ pair has $2$ H-bonds ($10 \\times 2 = 20$) and each $\\text{G}\\equiv\\text{C}$ pair has $3$ H-bonds ($10 \\times 3 = 30$), giving $20 + 30 = 50$ hydrogen bonds.",
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
      "An electric dipole of dipole moment $\\vec{p}$ (consisting of charges $+q$ and $-q$ separated by distance $2a$) is enclosed inside a hollow sphere of radius $R$ ($R > a$), and an additional point charge $+Q$ is placed at a distance $2R$ from the centre outside the sphere. What is the net scalar electric flux $\\Phi_{\\text{net}}$ through the sphere?",
    formulaContext:
      "$$\\Phi_{\\text{net}} = \\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$$",
    diagramType: "gaussian-cube",
    options: [
      {
        id: "A",
        text: "$0\\text{ N m}^2\\text{ C}^{-1}$ (Zero)",
      },
      {
        id: "B",
        text: "$\\frac{Q}{\\varepsilon_0}$",
        trapReason:
          "$+Q$ is at distance $2R$ outside the sphere of radius $R$, so it is not enclosed within the Gaussian surface.",
      },
      {
        id: "C",
        text: "$\\frac{Q + 2q}{\\varepsilon_0}$",
        trapReason:
          "A dipole has charges $+q$ and $-q$ (net enclosed charge $q_{\\text{in}} = 0$), and $+Q$ lies outside the Gaussian sphere.",
      },
      {
        id: "D",
        text: "$\\frac{|\\vec{p}|}{R\\varepsilon_0}$",
        trapReason:
          "Electric flux is a scalar with dimensions of $\\frac{\\text{Charge}}{\\varepsilon_0}$ ($\\text{N m}^2\\text{ C}^{-1}$), not dipole moment magnitude $|\\vec{p}| = 2qa$ divided by length.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "Inside the sphere of radius $R$, only the electric dipole ($+q$ and $-q$) is present, so net enclosed charge $q_{\\text{enclosed}} = (+q) + (-q) = 0\\text{ C}$.",
      "The external point charge $+Q$ is at distance $2R > R$ (outside the sphere), so every electric field line from $+Q$ that enters the sphere also exits it.",
      "By Gauss's Law, $\\Phi_{\\text{net}} = \\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0} = 0\\text{ N m}^2\\text{ C}^{-1}$.",
    ],
    solutionBreakdown: {
      given: [
        "Enclosed electric dipole moment $\\vec{p}$ (charges $+q$ and $-q$ inside $r < R$)",
        "External point charge $+Q$ at $r = 2R > R$",
      ],
      conceptOrFormula:
        "$$\\Phi_{\\text{net}} = \\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{\\sum q_{\\text{inside}}}{\\varepsilon_0}$$",
      steps: [
        {
          label: "Evaluate Net Enclosed Charge",
          content:
            "Sum the scalar charges strictly inside the spherical surface of radius $R$. The dipole consists of equal and opposite charges $+q$ and $-q$, while $+Q$ lies outside at $2R$:",
          formula: "$$q_{\\text{enclosed}} = (+q) + (-q) = 0\\text{ C}$$",
        },
        {
          label: "Substitution into Gauss's Law",
          content:
            "Substitute $q_{\\text{enclosed}} = 0\\text{ C}$ into Gauss's Law. Although $+Q$ and $\\vec{p}$ produce a non-zero electric field vector $\\vec{E}$ at points on the sphere, the surface integral of $\\vec{E} \\cdot d\\vec{A}$ vanishes:",
          formula:
            "$$\\Phi_{\\text{net}} = \\frac{0}{\\varepsilon_0} = 0\\text{ N m}^2\\text{ C}^{-1}$$",
        },
      ],
      finalAnswer:
        "**Option A** — $\\Phi_{\\text{net}} = 0\\text{ N m}^2\\text{ C}^{-1}$ (Zero)",
      underlyingConcept:
        "Gauss's Law states that the net scalar electric flux $\\Phi_{\\text{net}}$ through any closed surface depends exclusively on the algebraic sum of charges enclosed within that surface.",
    },
    keyConceptTested: "Gauss's Law depends strictly on net enclosed charge.",
    commonMistakeSummary:
      "Forgetting that a dipole has zero net charge or including external charges in $q_{\\text{enclosed}}$.",
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
      "A point charge $+q_1$ is placed inside a closed spherical Gaussian surface $S$, and another point charge $-q_2$ is placed just outside $S$. Distinguishing carefully between the electric field vector $\\vec{E}$ and the scalar electric flux $\\Phi$, which of the following statements are CORRECT? (Select all correct options)",
    formulaContext:
      "$$\\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{inside}}}{\\varepsilon_0} \\qquad \\text{where } \\vec{E} = \\vec{E}_{q_1} + \\vec{E}_{-q_2}$$",
    options: [
      {
        id: "A",
        text: "The resultant electric field vector $\\vec{E}$ at any point on surface $S$ is influenced by both $+q_1$ and $-q_2$.",
      },
      {
        id: "B",
        text: "The net scalar electric flux $\\Phi$ through the closed surface $S$ depends only on $+q_1$ and equals $\\frac{+q_1}{\\varepsilon_0}$.",
      },
      {
        id: "C",
        text: "Moving $-q_2$ further away (while keeping it outside $S$) changes the net electric flux $\\Phi$ through $S$.",
        trapReason:
          "External charges contribute zero net flux regardless of their external position.",
      },
      {
        id: "D",
        text: "If $S$ is deformed into a cube still enclosing only $+q_1$, the net electric flux remains $\\frac{+q_1}{\\varepsilon_0}$.",
      },
    ],
    correctOptionIds: ["A", "B", "D"],
    stepByStepExplanation: [
      "Option A is correct: In $\\oint_S \\vec{E} \\cdot d\\vec{A}$, the electric field vector $\\vec{E}$ at every point on $S$ is the vector superposition $\\vec{E} = \\vec{E}_{q_1} + \\vec{E}_{-q_2}$ due to ALL charges (both inside and outside).",
      "Option B is correct: When integrated over the entire closed surface $S$, the flux contribution of external charge $-q_2$ cancels to zero, leaving $\\Phi_{\\text{net}} = \\frac{+q_1}{\\varepsilon_0}$.",
      "Option C is incorrect: Moving an external charge changes $\\vec{E}$ locally on $S$, but net flux remains fixed at $\\frac{+q_1}{\\varepsilon_0}$.",
      "Option D is correct: Gauss's Law holds for any closed 3D surface regardless of its geometric shape.",
    ],
    solutionBreakdown: {
      given: [
        "Internal charge: $+q_1$ (inside closed surface $S$)",
        "External charge: $-q_2$ (outside closed surface $S$)",
      ],
      conceptOrFormula:
        "$$\\Phi_{\\text{net}} = \\oint_S \\left(\\vec{E}_{q_1} + \\vec{E}_{-q_2}\\right) \\cdot d\\vec{A} = \\frac{+q_1}{\\varepsilon_0} + 0$$",
      steps: [
        {
          label: "Vector Superposition of Electric Field (Option A)",
          content:
            "At any point on the surface $S$, the local electric field vector $\\vec{E}$ is the vector sum $\\vec{E} = \\vec{E}_{q_1} + \\vec{E}_{-q_2}$ produced by all charges in space. Thus **Option A is correct**.",
        },
        {
          label: "Closed-Surface Flux Integration (Options B & C)",
          content:
            "Every field line from the external charge $-q_2$ that enters $S$ also leaves $S$, so $\\oint_S \\vec{E}_{-q_2} \\cdot d\\vec{A} = 0$ regardless of where $-q_2$ sits outside $S$. Thus **Option B is correct** and **Option C is incorrect**.",
        },
        {
          label: "Topological Shape Independence (Option D)",
          content:
            "Gauss's Law depends only on whether $+q_1$ is enclosed, not on whether $S$ is a sphere or a cube. Thus **Option D is correct**.",
        },
      ],
      finalAnswer: "**Correct Options: A, B, D**",
      underlyingConcept:
        "Local electric field $\\vec{E}$ (a vector at a point) depends on all charges inside and outside $S$, whereas net electric flux $\\Phi$ (a scalar surface integral) depends only on enclosed charge $q_{\\text{inside}}$.",
    },
    keyConceptTested:
      "Distinction between local electric field $\\vec{E}$ (depends on all charges) and net closed-surface flux $\\Phi$ (depends only on enclosed charges).",
    commonMistakeSummary:
      "Assuming that because $-q_2$ does not affect net flux $\\Phi$, it also does not affect the electric field $\\vec{E}$ on the surface.",
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
      "A point charge $+q$ is placed at the geometric centre of a cube of side $L$. If the side of the cube is doubled to $2L$ while keeping $+q$ at the centre, the electric flux $\\Phi_{\\text{face}}$ passing through any one face of the cube becomes:",
    diagramType: "gaussian-cube",
    options: [
      {
        id: "A",
        text: "$\\frac{q}{6\\varepsilon_0}$ — remains unchanged",
      },
      {
        id: "B",
        text: "$\\frac{q}{12\\varepsilon_0}$",
        trapReason:
          "Flux depends only on enclosed charge and symmetry, not on the side length $L$ of the Gaussian surface.",
      },
      {
        id: "C",
        text: "$\\frac{q}{24\\varepsilon_0}$",
        trapReason:
          "Face area increases by a factor of $4$, while the average normal component of $\\vec{E}$ decreases by a factor of $4$, so their product stays constant.",
      },
      {
        id: "D",
        text: "$\\frac{2q}{3\\varepsilon_0}$",
        trapReason: "Doubling the surface dimensions does not multiply the flux.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "By Gauss's Law, the total flux through the entire closed cube is $\\Phi_{\\text{total}} = \\frac{q}{\\varepsilon_0}$ regardless of its side length $L$.",
      "Because the point charge $+q$ remains at the geometric centre, all $6$ faces are still completely symmetric.",
      "Therefore, the flux through one face remains $\\Phi_{\\text{face}} = \\frac{\\Phi_{\\text{total}}}{6} = \\frac{q}{6\\varepsilon_0}$.",
    ],
    solutionBreakdown: {
      given: [
        "Enclosed charge at cube centre: $+q$",
        "Initial side length $L \\to$ final side length $2L$",
        "Number of symmetric square faces $= 6$",
      ],
      conceptOrFormula:
        "$$\\Phi_{\\text{total}} = \\frac{q}{\\varepsilon_0} \\quad \\implies \\quad \\Phi_{\\text{face}} = \\frac{\\Phi_{\\text{total}}}{6}$$",
      steps: [
        {
          label: "Total Flux via Gauss's Law",
          content:
            "For any closed cube enclosing $+q$, the total outward flux is $\\Phi_{\\text{total}} = \\frac{q}{\\varepsilon_0}$, independent of whether the cube edge is $L$ or $2L$.",
        },
        {
          label: "Equal Partitioning by 6-Fold Cubic Symmetry",
          content:
            "Since $+q$ is at the exact geometric centre, each of the $6$ identical faces subtends the same solid angle $\\Omega = \\frac{4\\pi}{6} = \\frac{2\\pi}{3}\\text{ sr}$:",
          formula:
            "$$\\Phi_{\\text{face}} = \\frac{1}{6}\\Phi_{\\text{total}} = \\frac{q}{6\\varepsilon_0}$$",
        },
      ],
      finalAnswer:
        "**Option A** — $\\Phi_{\\text{face}} = \\frac{q}{6\\varepsilon_0}$ (remains unchanged)",
      underlyingConcept:
        "When a Gaussian surface is scaled uniformly around a central charge, surface area scales as $L^2$ while electric field magnitude $|\\vec{E}|$ scales as $L^{-2}$, leaving the scalar flux $\\Phi$ invariant.",
    },
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
      "A projectile of mass $m$ is launched from horizontal ground with initial velocity $\\vec{u} = u\\cos 60^\\circ\\,\\hat{i} + u\\sin 60^\\circ\\,\\hat{j}$ and initial kinetic energy $K$. Neglecting air resistance, what is its scalar kinetic energy $K_{\\text{top}}$ at the highest point (apex) of its trajectory?",
    formulaContext:
      "$$K = \\frac{1}{2}mu^2 \\quad ; \\quad \\vec{v}_{\\text{top}} = (u\\cos\\theta)\\,\\hat{i} + 0\\,\\hat{j}$$",
    diagramType: "projectile-apex",
    options: [
      {
        id: "A",
        text: "$\\frac{K}{4}$",
      },
      {
        id: "B",
        text: "Zero",
        trapReason:
          "Only the vertical velocity component $v_y$ becomes zero at the apex; the horizontal velocity vector $\\vec{v}_{\\text{top}} = (u\\cos 60^\\circ)\\,\\hat{i}$ remains non-zero.",
      },
      {
        id: "C",
        text: "$\\frac{K}{2}$",
        trapReason:
          "Speed at the apex is $v_{\\text{top}} = u\\cos 60^\\circ = \\frac{u}{2}$, but kinetic energy is proportional to speed squared: $\\cos^2 60^\\circ = \\frac{1}{4}$.",
      },
      {
        id: "D",
        text: "$\\frac{3K}{4}$",
        trapReason:
          "$\\frac{3K}{4} = K\\sin^2 60^\\circ$ is the gravitational potential energy gained at the highest point, not the remaining kinetic energy.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "At the highest point of a projectile's flight, the vertical velocity component is $v_y = 0$, while the horizontal velocity component remains constant at $v_x = u\\cos 60^\\circ = \\frac{u}{2}$.",
      "Kinetic energy at the apex is $K_{\\text{top}} = \\frac{1}{2}m|\\vec{v}_{\\text{top}}|^2 = \\frac{1}{2}mv_x^2 = \\frac{1}{2}mu^2\\cos^2 60^\\circ$.",
      "Since $K = \\frac{1}{2}mu^2$ and $\\cos^2 60^\\circ = \\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$, we obtain $K_{\\text{top}} = \\frac{K}{4}$.",
    ],
    solutionBreakdown: {
      given: [
        "Launch angle $\\theta = 60^\\circ$",
        "Initial kinetic energy $K = \\frac{1}{2}mu^2$",
        "Constant acceleration $\\vec{a} = -g\\,\\hat{j}$ ($a_x = 0$)",
      ],
      conceptOrFormula:
        "$$|\\vec{v}_{\\text{top}}| = v_x = u\\cos\\theta \\quad \\implies \\quad K_{\\text{top}} = \\frac{1}{2}m(u\\cos\\theta)^2 = K\\cos^2\\theta$$",
      steps: [
        {
          label: "Velocity Vector at the Highest Point",
          content:
            "At the apex, vertical velocity $v_y = 0$, while horizontal velocity is unaffected by gravity:",
          formula:
            "$$\\vec{v}_{\\text{top}} = (u\\cos 60^\\circ)\\,\\hat{i} = \\frac{u}{2}\\,\\hat{i} \\implies v_{\\text{top}} = \\frac{u}{2}$$",
        },
        {
          label: "Substitution & Calculation",
          content:
            "Substitute $v_{\\text{top}} = u\\cos 60^\\circ = \\frac{u}{2}$ into the kinetic energy expression:",
          formula:
            "$$\\begin{aligned} K_{\\text{top}} &= \\frac{1}{2}m\\left(u\\cos 60^\\circ\\right)^2 \\\\ &= \\left(\\frac{1}{2}mu^2\\right)\\left(\\frac{1}{2}\\right)^2 = \\frac{K}{4} \\end{aligned}$$",
        },
      ],
      finalAnswer: "**Option A** — $K_{\\text{top}} = \\frac{K}{4}$",
      underlyingConcept:
        "In 2D projectile motion, kinetic energy is a scalar quantity partitioned between horizontal motion ($K_x = K\\cos^2\\theta$, constant throughout flight) and vertical motion ($K_y = K\\sin^2\\theta$ at launch, converted into potential energy $U = \\frac{3K}{4}$ at the apex).",
    },
    keyConceptTested:
      "Non-zero horizontal velocity and energy partitioning at projectile apex.",
    commonMistakeSummary:
      "Forgetting to square $\\cos\\theta$ when computing kinetic energy, or confusing potential energy ($\\frac{3K}{4}$) with kinetic energy ($\\frac{K}{4}$).",
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
      "A ball is projected from level ground with initial speed $u = 20\\text{ m s}^{-1}$ at an angle $\\theta = 45^\\circ$ to the horizontal. Taking acceleration due to gravity $g = 10\\text{ m s}^{-2}$, find the maximum horizontal range $R$ of the ball (in $\\text{m}$).",
    formulaContext: "$$R = \\frac{u^2\\sin(2\\theta)}{g}$$",
    correctNumericalValue: 40,
    numericalTolerance: 0.1,
    numericalUnit: "m",
    stepByStepExplanation: [
      "Given initial speed $u = 20\\text{ m s}^{-1}$, launch angle $\\theta = 45^\\circ$, and $g = 10\\text{ m s}^{-2}$.",
      "Use the horizontal range formula: $R = \\frac{u^2\\sin(2\\theta)}{g}$.",
      "Substitute values: $R = \\frac{(20\\text{ m s}^{-1})^2 \\times \\sin(90^\\circ)}{10\\text{ m s}^{-2}} = \\frac{400 \\times 1}{10} = 40\\text{ m}$.",
    ],
    solutionBreakdown: {
      given: [
        "Initial speed $u = 20\\text{ m s}^{-1}$",
        "Launch angle $\\theta = 45^\\circ$",
        "Gravitational acceleration $g = 10\\text{ m s}^{-2}$",
      ],
      conceptOrFormula: "$$R = \\frac{u^2\\sin(2\\theta)}{g}$$",
      steps: [
        {
          label: "Substitution",
          content:
            "Substitute $u = 20\\text{ m s}^{-1}$, $2\\theta = 2(45^\\circ) = 90^\\circ$, and $g = 10\\text{ m s}^{-2}$ into the horizontal range formula:",
          formula:
            "$$R = \\frac{(20\\text{ m s}^{-1})^2 \\sin(90^\\circ)}{10\\text{ m s}^{-2}}$$",
        },
        {
          label: "Calculation & Dimensional Check",
          content:
            "Since $\\sin(90^\\circ) = 1$ and $\\frac{\\text{m}^2\\text{ s}^{-2}}{\\text{m s}^{-2}} = \\text{m}$, evaluate the numerical quotient:",
          formula:
            "$$R = \\frac{400\\text{ m}^2\\text{ s}^{-2} \\times 1}{10\\text{ m s}^{-2}} = 40\\text{ m}$$",
        },
      ],
      finalAnswer: "$$R = 40\\text{ m}$$",
      underlyingConcept:
        "For a fixed launch speed $u$ on level ground, horizontal range $R = \\frac{u^2\\sin(2\\theta)}{g}$ attains its maximum value $R_{\\max} = \\frac{u^2}{g}$ when $\\sin(2\\theta) = 1$, i.e., at $\\theta = 45^\\circ$.",
    },
    keyConceptTested: "Maximum horizontal range at $\\theta = 45^\\circ$.",
    commonMistakeSummary:
      "Using $H_{\\max} = \\frac{u^2\\sin^2\\theta}{2g} = 10\\text{ m}$ instead of the horizontal range formula $R = \\frac{u^2\\sin(2\\theta)}{g} = 40\\text{ m}$.",
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
      "In the Contact Process for the catalytic oxidation of sulphur dioxide, $$\\ce{2SO2(g) + O2(g) <=>[\\text{V}_2\\text{O}_5] 2SO3(g)} \\qquad (\\Delta H^\\circ = -198\\text{ kJ mol}^{-1} < 0)$$ which combination of temperature and pressure conditions will maximize the equilibrium yield of $\\ce{SO3(g)}$?",
    formulaContext:
      "$$\\Delta n_g = n_{\\text{products}(g)} - n_{\\text{reactants}(g)} = 2 - (2 + 1) = -1 \\quad ; \\quad \\Delta H^\\circ < 0\\text{ (Exothermic)}$$",
    diagramType: "equilibrium-vessel",
    options: [
      {
        id: "A",
        text: "Low (moderate optimum) temperature and high pressure",
      },
      {
        id: "B",
        text: "High temperature and high pressure",
        trapReason:
          "Because the forward reaction is exothermic ($\\Delta H^\\circ < 0$), raising temperature decreases $K_p$ and shifts equilibrium backward toward $\\ce{SO2(g)}$ and $\\ce{O2(g)}$.",
      },
      {
        id: "C",
        text: "Low temperature and low pressure",
        trapReason:
          "There are $3\\text{ mol}$ of gas on the reactant side and $2\\text{ mol}$ on the product side; lowering pressure shifts equilibrium toward the side with more gas moles (reactants).",
      },
      {
        id: "D",
        text: "Adding inert $\\ce{Ar(g)}$ at constant volume",
        trapReason:
          "Adding an inert gas at constant volume leaves the partial pressures and molar concentrations of $\\ce{SO2}$, $\\ce{O2}$, and $\\ce{SO3}$ unchanged ($Q_c = K_c$).",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "Count stoichiometric gas moles in $\\ce{2SO2(g) + O2(g) <=> 2SO3(g)}$: Reactants $= 2 + 1 = 3\\text{ mol}$; Products $= 2\\text{ mol}$ ($\\Delta n_g = -1$). High pressure shifts equilibrium toward fewer gas moles (forward toward $\\ce{SO3}$).",
      "The forward reaction is exothermic ($\\Delta H^\\circ = -198\\text{ kJ mol}^{-1} < 0$). Lowering temperature favours the heat-releasing forward direction.",
      "Therefore, low temperature (industrial optimum $\\approx 700\\text{ K}$ over $\\ce{V2O5}$ catalyst) and high pressure maximize $\\ce{SO3(g)}$ yield.",
    ],
    solutionBreakdown: {
      given: [
        "Balanced equilibrium: $\\ce{2SO2(g) + O2(g) <=>[\\text{V}_2\\text{O}_5] 2SO3(g)}$",
        "Enthalpy change: $\\Delta H^\\circ = -198\\text{ kJ mol}^{-1} < 0$ (exothermic)",
        "Gas mole change: $\\Delta n_g = 2 - (2 + 1) = -1\\text{ mol}$",
      ],
      conceptOrFormula:
        "$$K_p = \\frac{P_{\\ce{SO3}}^2}{P_{\\ce{SO2}}^2 \\cdot P_{\\ce{O2}}} \\quad ; \\quad \\ln\\left(\\frac{K_2}{K_1}\\right) = \\frac{\\Delta H^\\circ}{R}\\left(\\frac{1}{T_1} - \\frac{1}{T_2}\\right)$$",
      steps: [
        {
          label: "Effect of Pressure (Stoichiometric Gas Volume Analysis)",
          content:
            "From the balanced equation, $3\\text{ mol}$ of gaseous reactants ($\\ce{2SO2 + O2}$) contract to $2\\text{ mol}$ of gaseous product ($\\ce{2SO3}$). Increasing total pressure increases $Q_p$ less than denominator terms, driving the equilibrium **forward** toward fewer gas moles.",
        },
        {
          label: "Effect of Temperature (Van 't Hoff Relation)",
          content:
            "Since the forward reaction is exothermic ($\\Delta H^\\circ < 0$), lowering the temperature $T$ increases the equilibrium constant $K_p$ and shifts the equilibrium **forward** to form more $\\ce{SO3(g)}$.",
        },
      ],
      finalAnswer: "**Option A** — Low temperature and high pressure",
      underlyingConcept:
        "By Le Chatelier's Principle, an exothermic reaction with gas contraction ($\\Delta H^\\circ < 0,\\; \\Delta n_g < 0$) achieves maximum equilibrium conversion at low temperature and high pressure (while a catalyst like $\\ce{V2O5}$ only speeds up attainment of equilibrium without shifting $K_p$).",
    },
    keyConceptTested:
      "Le Chatelier's Principle for temperature and pressure simultaneously.",
    commonMistakeSummary:
      "Mixing up $\\Delta n_g$ direction or forgetting that exothermic reactions are favoured at lower temperatures.",
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
      "For a reversible redox reaction in a galvanic cell at $298\\text{ K}$, $$\\ce{A(s) + B^{2+}(aq) <=> A^{2+}(aq) + B(s)}$$ if the standard cell EMF is $E^\\circ_{\\text{cell}} = 0.2955\\text{ V}$, what is the equilibrium constant $K_{\\text{eq}}$ of the reaction? (Take $\\frac{2.303RT}{F} = 0.0591\\text{ V}$ at $298\\text{ K}$)",
    formulaContext:
      "$$E^\\circ_{\\text{cell}} = \\frac{0.0591\\text{ V}}{n}\\log_{10} K_{\\text{eq}} \\qquad (\\text{at } 298\\text{ K})$$",
    diagramType: "daniell-cell",
    options: [
      {
        id: "A",
        text: "$10^{10}$",
      },
      {
        id: "B",
        text: "$10^5$",
        trapReason:
          "This occurs if you forget to multiply by $n = 2\\text{ mol e}^-$ transferred in $\\ce{A(s) -> A^{2+}(aq) + 2e^-}$.",
      },
      {
        id: "C",
        text: "$10^{-10}$",
        trapReason:
          "A positive $E^\\circ_{\\text{cell}} > 0$ guarantees $\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}} < 0$ and therefore $K_{\\text{eq}} > 1$.",
      },
      {
        id: "D",
        text: "$2 \\times 10^5$",
        trapReason:
          "$n = 2$ multiplies $\\log_{10} K_{\\text{eq}}$, which becomes the exponent of $10$, not a linear prefactor.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "At chemical equilibrium ($E_{\\text{cell}} = 0\\text{ V}$ and $Q = K_{\\text{eq}}$) at $298\\text{ K}$, the Nernst equation gives $E^\\circ_{\\text{cell}} = \\frac{0.0591}{n}\\log_{10} K_{\\text{eq}}$.",
      "From the ionic equation $\\ce{A(s) + B^{2+}(aq) <=> A^{2+}(aq) + B(s)}$, the number of electrons transferred is $n = 2$. Substitute $E^\\circ_{\\text{cell}} = 0.2955\\text{ V}$ and $n = 2$: $$0.2955 = \\frac{0.0591}{2}\\log_{10} K_{\\text{eq}}$$",
      "Since $\\frac{0.2955}{0.0591} = 5$, we get $\\log_{10} K_{\\text{eq}} = 5 \\times 2 = 10 \\implies K_{\\text{eq}} = 10^{10}$.",
    ],
    solutionBreakdown: {
      given: [
        "Redox reaction: $\\ce{A(s) + B^{2+}(aq) <=> A^{2+}(aq) + B(s)}$",
        "Electrons transferred: $n = 2\\text{ mol e}^-$",
        "Standard EMF at $298\\text{ K}$: $E^\\circ_{\\text{cell}} = 0.2955\\text{ V}$",
      ],
      conceptOrFormula:
        "$$E_{\\text{cell}} = 0 \\implies E^\\circ_{\\text{cell}} = \\frac{0.0591\\text{ V}}{n}\\log_{10} K_{\\text{eq}}$$",
      steps: [
        {
          label: "Rearrange for log₁₀(K_eq) & Substitute",
          content:
            "Isolate $\\log_{10} K_{\\text{eq}}$ and substitute $n = 2$ and $E^\\circ_{\\text{cell}} = 0.2955\\text{ V}$:",
          formula:
            "$$\\log_{10} K_{\\text{eq}} = \\frac{n \\cdot E^\\circ_{\\text{cell}}}{0.0591\\text{ V}} = \\frac{2 \\times 0.2955\\text{ V}}{0.0591\\text{ V}}$$",
        },
        {
          label: "Calculation & Antilogarithm",
          content:
            "Notice that $0.2955 = 5 \\times 0.0591$. Simplify the ratio and take the base-$10$ antilogarithm:",
          formula:
            "$$\\log_{10} K_{\\text{eq}} = 2 \\times 5 = 10 \\quad \\implies \\quad K_{\\text{eq}} = 10^{10}$$",
        },
      ],
      finalAnswer:
        "**Option A** — $K_{\\text{eq}} = 10^{10}$ (dimensionless equilibrium constant)",
      underlyingConcept:
        "At chemical equilibrium, the forward and reverse redox rates balance so $\\Delta G = 0$ and $E_{\\text{cell}} = 0\\text{ V}$, linking standard cell potential exponentially to the equilibrium constant via $\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}} = -2.303RT\\log_{10} K_{\\text{eq}}$.",
    },
    keyConceptTested:
      "Relationship between $E^\\circ_{\\text{cell}}$ and equilibrium constant $K_{\\text{eq}}$.",
    commonMistakeSummary:
      "Omitting the factor $n = 2$ before taking the antilogarithm.",
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
      "If $\\alpha$ and $\\beta$ are the roots of the quadratic equation $x^2 - 6x + 4 = 0$, find the exact numerical value of the symmetric sum $\\alpha^2 + \\beta^2 = \\text{tr}\\begin{pmatrix} \\alpha^2 & 0 \\\\ 0 & \\beta^2 \\end{pmatrix}$.",
    formulaContext:
      "$$\\alpha + \\beta = -\\frac{b}{a} \\quad , \\quad \\alpha\\beta = \\frac{c}{a} \\quad ; \\quad \\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta$$",
    correctNumericalValue: 28,
    numericalTolerance: 0.01,
    numericalUnit: "",
    stepByStepExplanation: [
      "From $x^2 - 6x + 4 = 0$ ($a = 1,\\; b = -6,\\; c = 4$), Vieta's relations give sum of roots $\\alpha + \\beta = 6$ and product of roots $\\alpha\\beta = 4$.",
      "Use the symmetric algebraic identity $\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta$.",
      "Substitute values: $\\alpha^2 + \\beta^2 = 6^2 - 2(4) = 36 - 8 = 28$.",
    ],
    solutionBreakdown: {
      given: [
        "Quadratic equation: $x^2 - 6x + 4 = 0$ ($a = 1,\\; b = -6,\\; c = 4$)",
        "Roots: $\\alpha,\\, \\beta$",
      ],
      conceptOrFormula:
        "$$\\alpha + \\beta = -\\frac{b}{a} \\quad , \\quad \\alpha\\beta = \\frac{c}{a} \\quad \\implies \\quad \\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta$$",
      steps: [
        {
          label: "Extract Elementary Symmetric Sums (Vieta's Formulas)",
          content:
            "Compare $x^2 - 6x + 4 = 0$ with $ax^2 + bx + c = 0$ to obtain the sum and product of roots:",
          formula:
            "$$\\alpha + \\beta = -\\frac{-6}{1} = 6 \\quad , \\quad \\alpha\\beta = \\frac{4}{1} = 4$$",
        },
        {
          label: "Substitution & Calculation",
          content:
            "Substitute $\\alpha + \\beta = 6$ and $\\alpha\\beta = 4$ into the quadratic identity:",
          formula:
            "$$\\begin{aligned} \\alpha^2 + \\beta^2 &= (\\alpha + \\beta)^2 - 2\\alpha\\beta \\\\ &= (6)^2 - 2(4) = 36 - 8 = 28 \\end{aligned}$$",
        },
      ],
      finalAnswer: "$$\\alpha^2 + \\beta^2 = 28$$",
      underlyingConcept:
        "By the Fundamental Theorem of Symmetric Polynomials, any power sum $S_n = \\alpha^n + \\beta^n$ of the roots of $ax^2 + bx + c = 0$ can be computed directly from $S_1 = \\alpha + \\beta$ and $P = \\alpha\\beta$ without solving for the irrational roots $3 \\pm \\sqrt{5}$.",
    },
    keyConceptTested:
      "Symmetric functions of quadratic roots via Vieta's formulas.",
    commonMistakeSummary:
      "Computing $(\\alpha + \\beta)^2 = 36$ and forgetting to subtract $2\\alpha\\beta = 8$.",
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
      "What is the exact value of the definite integral $$I = \\int_{\\pi/6}^{\\pi/3} \\frac{dx}{1 + \\sqrt{\\tan x}}\\,?$$",
    formulaContext:
      "$$\\int_{a}^{b} f(x)\\,dx = \\int_{a}^{b} f(a + b - x)\\,dx$$",
    options: [
      {
        id: "A",
        text: "$\\frac{\\pi}{12}$",
      },
      {
        id: "B",
        text: "$\\frac{\\pi}{6}$",
        trapReason:
          "$\\frac{\\pi}{6}$ is the value of $2I = b - a = \\frac{\\pi}{3} - \\frac{\\pi}{6}$; remember to divide by $2$ to get $I$.",
      },
      {
        id: "C",
        text: "$\\frac{\\pi}{4}$",
        trapReason:
          "$\\frac{\\pi}{4}$ is the answer when the limits are $\\left[0, \\frac{\\pi}{2}\\right]$, not $\\left[\\frac{\\pi}{6}, \\frac{\\pi}{3}\\right]$.",
      },
      {
        id: "D",
        text: "$\\frac{\\pi}{8}$",
        trapReason:
          "Check the interval length: $\\frac{\\pi/3 - \\pi/6}{2} = \\frac{\\pi/6}{2} = \\frac{\\pi}{12}$.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "Write $\\sqrt{\\tan x} = \\frac{\\sqrt{\\sin x}}{\\sqrt{\\cos x}}$, so $$I = \\int_{\\pi/6}^{\\pi/3} \\frac{\\sqrt{\\cos x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}}\\,dx$$",
      "Notice $a + b = \\frac{\\pi}{6} + \\frac{\\pi}{3} = \\frac{\\pi}{2}$. Apply King's property $x \\mapsto \\frac{\\pi}{2} - x$, which swaps $\\sin x$ and $\\cos x$.",
      "Adding the two integrals gives $2I = \\int_{\\pi/6}^{\\pi/3} 1\\,dx = \\frac{\\pi}{3} - \\frac{\\pi}{6} = \\frac{\\pi}{6}$. Dividing by $2$ gives $I = \\frac{\\pi}{12}$.",
    ],
    solutionBreakdown: {
      given: [
        "Lower limit $a = \\frac{\\pi}{6}$, Upper limit $b = \\frac{\\pi}{3}$",
        "Complementary sum $a + b = \\frac{\\pi}{6} + \\frac{\\pi}{3} = \\frac{\\pi}{2}$",
      ],
      conceptOrFormula:
        "$$\\int_{a}^{b} f(x)\\,dx = \\int_{a}^{b} f(a + b - x)\\,dx \\quad \\implies \\quad I = \\frac{b - a}{2}$$",
      steps: [
        {
          label: "Express in Sine & Cosine Form",
          content:
            "Substitute $\\tan x = \\frac{\\sin x}{\\cos x}$ and simplify the complex fraction on $\\left[\\frac{\\pi}{6}, \\frac{\\pi}{3}\\right]$:",
          formula:
            "$$I = \\int_{\\pi/6}^{\\pi/3} \\frac{\\sqrt{\\cos x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}}\\,dx \\qquad \\text{--- (1)}$$",
        },
        {
          label: "Apply King's Reflection Property",
          content:
            "Replace $x$ with $a + b - x = \\frac{\\pi}{2} - x$. Using $\\cos\\left(\\frac{\\pi}{2} - x\\right) = \\sin x$ and $\\sin\\left(\\frac{\\pi}{2} - x\\right) = \\cos x$:",
          formula:
            "$$I = \\int_{\\pi/6}^{\\pi/3} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}}\\,dx \\qquad \\text{--- (2)}$$",
        },
        {
          label: "Add Equations (1) and (2) & Integrate",
          content:
            "Adding $(1)$ and $(2)$ makes the integrand identically $1$ across the interval:",
          formula:
            "$$\\begin{aligned} 2I &= \\int_{\\pi/6}^{\\pi/3} \\frac{\\sqrt{\\cos x} + \\sqrt{\\sin x}}{\\sqrt{\\cos x} + \\sqrt{\\sin x}}\\,dx = \\int_{\\pi/6}^{\\pi/3} 1\\,dx \\\\ &= \\frac{\\pi}{3} - \\frac{\\pi}{6} = \\frac{\\pi}{6} \\implies I = \\frac{\\pi}{12} \\end{aligned}$$",
        },
      ],
      finalAnswer: "**Option A** — $I = \\frac{\\pi}{12}$",
      underlyingConcept:
        "Whenever an integrand satisfies $f(x) + f(a + b - x) = 1$ on $[a, b]$, King's reflection symmetry guarantees that the definite integral equals half the interval width, $I = \\frac{b - a}{2}$.",
    },
    keyConceptTested:
      "King's Property on non-zero complementary intervals $\\left[\\frac{\\pi}{6}, \\frac{\\pi}{3}\\right]$.",
    commonMistakeSummary:
      "Defaulting to the memorized $\\left[0, \\frac{\\pi}{2}\\right]$ answer of $\\frac{\\pi}{4}$ instead of computing $\\frac{b - a}{2}$.",
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
      "In the alveoli of the lungs, which set of physiological conditions favours the formation of oxyhaemoglobin ($\\ce{Hb + O2 <=> HbO2}$, left shift of the dissociation curve)?",
    formulaContext:
      "$$\\ce{Hb + O2 <=> HbO2} \\qquad (\\text{favoured at alveoli by } \\uparrow p\\text{O}_2,\\; \\downarrow p\\text{CO}_2,\\; \\downarrow [\\ce{H^+}],\\; \\downarrow T)$$",
    diagramType: "bohr-curve",
    options: [
      {
        id: "A",
        text: "High $p\\text{O}_2$, low $p\\text{CO}_2$, lesser $\\ce{H^+}$ concentration (higher pH), and lower temperature",
      },
      {
        id: "B",
        text: "High $p\\text{O}_2$, high $p\\text{CO}_2$, higher $\\ce{H^+}$ concentration, and higher temperature",
        trapReason:
          "High $p\\text{CO}_2$, high $[\\ce{H^+}]$, and high temperature occur in metabolically active tissues and cause dissociation, not binding.",
      },
      {
        id: "C",
        text: "Low $p\\text{O}_2$, low $p\\text{CO}_2$, higher $\\ce{H^+}$ concentration, and lower temperature",
        trapReason:
          "Low $p\\text{O}_2$ and high $[\\ce{H^+}]$ oppose oxygen binding to haemoglobin.",
      },
      {
        id: "D",
        text: "High $p\\text{O}_2$, low $p\\text{CO}_2$, higher $\\ce{H^+}$ concentration (lower pH), and higher temperature",
        trapReason:
          "Higher $\\ce{H^+}$ concentration (acidic pH) triggers the Bohr effect, releasing oxygen rather than binding it.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "In the lung alveoli, fresh inhaled air provides a high partial pressure of oxygen ($p\\text{O}_2 \\approx 104\\text{ mmHg}$) and low $p\\text{CO}_2$ ($\\approx 40\\text{ mmHg}$).",
      "Lower $\\ce{CO2}$ means less carbonic acid ($\\ce{H2CO3}$) formation, so $[\\ce{H^+}]$ is lower (slightly higher pH $\\approx 7.4$) and temperature is cooler than deep working muscle.",
      "All four factors shift the $\\ce{O2}$-Hb dissociation curve to the left, promoting rapid oxyhaemoglobin ($\\ce{HbO2}$) formation.",
    ],
    solutionBreakdown: {
      given: [
        "Anatomical site: Lung alveoli (oxygen loading zone)",
        "Alveolar pressures: $p\\text{O}_2 \\approx 104\\text{ mmHg}$, $p\\text{CO}_2 \\approx 40\\text{ mmHg}$",
      ],
      conceptOrFormula:
        "$$\\ce{HbH^+ + O2 <=> HbO2 + H^+} \\qquad \\left(\\text{pH} = -\\log_{10}[\\ce{H^+}]\\right)$$",
      steps: [
        {
          label: "Partial Pressure Gradient at Alveoli",
          content:
            "Alveolar air has high $p\\text{O}_2$ ($104\\text{ mmHg}$) and low $p\\text{CO}_2$ ($40\\text{ mmHg}$), driving $\\ce{O2}$ binding and $\\ce{CO2}$ exhalation.",
        },
        {
          label: "Hydrogen Ion Concentration & Temperature",
          content:
            "Because $\\ce{CO2 + H2O <=> H2CO3 <=> H^+ + HCO3^-}$ shifts left as $\\ce{CO2}$ is exhaled, $[\\ce{H^+}]$ decreases (pH increases) and alveolar temperature is lower than exercising muscle—both increasing haemoglobin's affinity for $\\ce{O2}$.",
        },
      ],
      finalAnswer:
        "**Option A** — High $p\\text{O}_2$, low $p\\text{CO}_2$, lesser $\\ce{H^+}$ concentration (higher pH), and lower temperature",
      underlyingConcept:
        "The Bohr effect couples $\\ce{O2}$ transport to tissue metabolism: low $[\\ce{H^+}]$ and low $p\\text{CO}_2$ in the lungs favour $\\ce{HbO2}$ loading (left shift, lower $P_{50}$), whereas high $[\\ce{H^+}]$ and high $p\\text{CO}_2$ in active tissues favour $\\ce{O2}$ unloading (right shift, higher $P_{50}$).",
    },
    keyConceptTested:
      "NCERT conditions for oxyhaemoglobin formation vs dissociation.",
    commonMistakeSummary:
      "Confusing 'lesser $\\ce{H^+}$ concentration' with 'lower pH' (lesser $[\\ce{H^+}]$ actually means higher pH).",
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
      "In a double-stranded B-DNA molecule, if Cytosine ($\\text{C}$) makes up $18\\%$ of the total nitrogenous bases, what is the percentage of Adenine ($\\text{A}$) bases?",
    formulaContext:
      "$$\\%\\text{A} + \\%\\text{G} = 50\\% \\quad ; \\quad \\%\\text{G} = \\%\\text{C} \\qquad (\\text{in dsDNA})$$",
    options: [
      {
        id: "A",
        text: "$32\\%$",
      },
      {
        id: "B",
        text: "$64\\%$",
        trapReason:
          "$64\\%$ is the combined percentage of Adenine + Thymine ($100\\% - 36\\%$), not Adenine alone.",
      },
      {
        id: "C",
        text: "$18\\%$",
        trapReason:
          "$18\\%$ is the percentage of Guanine (which pairs with Cytosine via $3$ hydrogen bonds, $\\text{G}\\equiv\\text{C}$), not Adenine.",
      },
      {
        id: "D",
        text: "$41\\%$",
        trapReason:
          "Use $\\%\\text{A} = 50\\% - \\%\\text{C} = 50\\% - 18\\% = 32\\%$.",
      },
    ],
    correctOptionId: "A",
    stepByStepExplanation: [
      "By Chargaff's equivalence rule for double-stranded DNA, $\\%\\text{Guanine} = \\%\\text{Cytosine} = 18\\%$.",
      "Since $\\%\\text{A} + \\%\\text{G} = 50\\%$ (total purines $= 50\\%$), we get $\\%\\text{A} = 50\\% - 18\\% = 32\\%$.",
    ],
    solutionBreakdown: {
      given: [
        "Nucleic acid type: Double-stranded B-DNA (dsDNA)",
        "Cytosine composition: $\\%\\text{C} = 18\\%$",
      ],
      conceptOrFormula:
        "$$\\%\\text{G} = \\%\\text{C} \\quad , \\quad \\%\\text{A} = \\%\\text{T} \\quad \\implies \\quad \\%\\text{A} + \\%\\text{C} = 50\\%$$",
      steps: [
        {
          label: "Apply Watson-Crick Base Pairing (G ≡ C)",
          content:
            "In dsDNA, Cytosine pairs equimolarly with Guanine, so $\\%\\text{G} = \\%\\text{C} = 18\\%$. Together, $\\%(\\text{G} + \\text{C}) = 18\\% + 18\\% = 36\\%$.",
        },
        {
          label: "Calculate Adenine Percentage",
          content:
            "The remaining bases are Adenine and Thymine in equal amounts ($\\text{A} = \\text{T}$):",
          formula:
            "$$\\%\\text{A} = \\frac{100\\% - 36\\%}{2} = 50\\% - 18\\% = 32\\%$$",
        },
      ],
      finalAnswer: "**Option A** — $\\%\\text{A} = 32\\%$",
      underlyingConcept:
        "Chargaff's base-equivalence rule holds for any double-stranded DNA helix because every purine ($\\text{A}, \\text{G}$) on one strand hydrogen-bonds with a complementary pyrimidine ($\\text{T}, \\text{C}$) on the antiparallel strand.",
    },
    keyConceptTested:
      "Chargaff's base-equivalence rule in double-stranded DNA.",
    commonMistakeSummary:
      "Forgetting to divide $(\\%\\text{A} + \\%\\text{T} = 64\\%)$ by $2$ to obtain $\\%\\text{A} = 32\\%$.",
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
          "1. **Gauss's Law:** $\\Phi_{\\text{net}} = \\oint \\vec{E}\\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$ (External charges give zero net flux).\n2. **Projectile Range-Height Shortcut:** $\\tan\\theta = \\frac{4H_{\\max}}{R}$.\n3. **Nernst Equation at 298 K:** $E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} Q$.",
        updatedAt: "Saved starter note",
      },
    ],
    doubtHistory: [
      {
        id: "doubt-welcome",
        role: "tutor",
        text: `Namaste ${profile.name}! Welcome to your personal study companion for ${profile.targetExam} (Class ${profile.classLevel}). Ask me any concept doubt in Physics, Chemistry, ${
          profile.targetExam === "NEET UG" ? "or Biology" : "or Mathematics"
        } — we will break it down step by step with full mathematical derivations.`,
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
          "• Net flux through closed surface: $\\Phi_{\\text{net}} = \\frac{q_{\\text{in}}}{\\varepsilon_0}$.\n• If $+Q$ is at the centre of a cube, flux through $1$ face $= \\frac{Q}{6\\varepsilon_0}$.\n• If $+Q$ is at $1$ corner of a cube, $3$ adjacent faces have $0$ flux ($\\vec{E}$ is parallel to the surface), and each of the other $3$ faces gets $\\frac{Q}{24\\varepsilon_0}$.",
        updatedAt: "Sample note · Yesterday",
      },
      {
        id: "demo-note-2",
        title: "Nernst Equation Sign & Stoichiometry Checklist",
        subjectId: "chemistry",
        chapterId: "chem-12-electrochemistry",
        content:
          "• Always check $n$ (number of electrons transferred) before applying $$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n}\\log_{10} Q$$\n• At equilibrium, $E_{\\text{cell}} = 0$ and $\\Delta G = 0$, but $E^\\circ_{\\text{cell}} \\ne 0$ and $\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}$.",
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
        text: "An external charge changes the electric field vector $\\vec{E}$ at individual points on the Gaussian surface, but every field line from that outside charge that enters the closed sphere on one side must exit on the other side, cancelling its net flux contribution to zero.",
        timestamp: "Sample conversation · Yesterday",
        subjectId: "physics",
        topicId: "topic-gauss-law",
        relatedTopicTitle: "Gauss's Law & Symmetric Flux",
        explanationMode: "step-by-step",
        sourceType: "sample-history",
        structured: {
          mainIdea:
            "Electric field $\\vec{E}$ at a point on the Gaussian surface depends on all charges (both inside and outside), whereas net electric flux $\\Phi_{\\text{net}}$ through the closed surface depends only on the net enclosed charge $q_{\\text{enclosed}}$.",
          steps: [
            {
              title: "Distinguish local electric field E from total flux Φ",
              explanation:
                "By the superposition principle, the electric field vector $\\vec{E}$ at any point on the sphere is the vector sum of the fields from inside and outside charges:",
              formula: "$$\\vec{E}_{\\text{total}} = \\vec{E}_{\\text{inside}} + \\vec{E}_{\\text{outside}}$$",
            },
            {
              title: "Track field lines from the external charge",
              explanation:
                "Because the external charge lies outside the closed surface, every field line originating from it that pierces inward (negative flux, $\\vec{E} \\cdot d\\vec{A} < 0$) on the near side must pierce outward (positive flux, $\\vec{E} \\cdot d\\vec{A} > 0$) on the far side.",
            },
            {
              title: "Integrate over the entire closed surface",
              explanation:
                "When we integrate $\\vec{E} \\cdot d\\vec{A}$ over the entire closed sphere $S$, the inward and outward flux contributions from the outside charge cancel out to zero:",
              formula: "$$\\Phi_{\\text{net}} = \\oint_S (\\vec{E}_{\\text{inside}} + \\vec{E}_{\\text{outside}}) \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0} + 0$$",
            },
          ],
          formulaOrDiagramNote:
            "Always check whether a charge lies strictly inside the chosen closed Gaussian surface $S$ before including it in $q_{\\text{enclosed}}$.",
          formulaExpression: "$$\\Phi_{\\text{net}} = \\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$$",
          diagramType: "gaussian-cube",
          finalAnswer:
            "Net electric flux remains $\\Phi_{\\text{net}} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$ (unchanged by outside charges), even though the local electric field $\\vec{E}$ on the surface changes.",
          commonMistake:
            "Assuming that $\\Phi_{\\text{net}} = 0$ implies $\\vec{E} = \\vec{0}$ everywhere on the Gaussian surface. Even if $q_{\\text{enclosed}} = 0$, an external charge still creates a non-zero electric field at points on the surface.",
          practiceQuestion: {
            prompt:
              "A point charge $+2\\,\\mu\\text{C}$ is placed at the centre of a cubic Gaussian surface, and another charge $-5\\,\\mu\\text{C}$ is placed outside the cube at a distance of $10\\text{ cm}$. The net electric flux through the cube depends on:",
            options: [
              "A. Only the $+2\\,\\mu\\text{C}$ charge inside the cube",
              "B. Only the $-5\\,\\mu\\text{C}$ charge outside the cube",
              "C. The algebraic sum ($+2\\,\\mu\\text{C} - 5\\,\\mu\\text{C} = -3\\,\\mu\\text{C}$)",
              "D. Zero, because the charges have opposite signs",
            ],
            correctAnswer: "A. Only the $+2\\,\\mu\\text{C}$ charge inside the cube",
            hintOrSolution:
              "By Gauss's Law, $\\Phi_{\\text{net}} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$. Only the $+2\\,\\mu\\text{C}$ charge is enclosed within the cubic surface; the $-5\\,\\mu\\text{C}$ charge outside contributes zero net flux.",
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

