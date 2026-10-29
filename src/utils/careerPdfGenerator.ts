import { jsPDF } from "jspdf";
import { CareerGuidanceReport } from "../types/career";

/**
 * Converts LaTeX/Markdown snippets (such as quantitative career examples)
 * and typographic Unicode punctuation into clean, readable text for standard
 * PDF fonts while preserving Indian names and mathematical clarity.
 */
export function formatTextForPdf(input: string | undefined | null): string {
  if (!input) return "";

  let text = input;

  // Strip display and inline math delimiters while converting common LaTeX constructs
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner: string) =>
    ` ${cleanLatexSnippet(inner)} `
  );
  text = text.replace(/\$([^$\n]+)\$/g, (_, inner: string) =>
    cleanLatexSnippet(inner)
  );

  // Strip Markdown bold/italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/`([^`]+)`/g, "$1");

  // Normalize typographic symbols to PDF-safe equivalents in standard Helvetica
  text = text
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2013\u2014]/g, " - ")
    .replace(/\u2026/g, "...")
    .replace(/\u20B9/g, "Rs. ")
    .replace(/\u00A0/g, " ")
    .replace(/\u2022/g, "-")
    .replace(/\u00B7/g, " | ")
    .replace(/[\u2192\u27F6]/g, " -> ")
    .replace(/[\u21CC\u2194]/g, " <=> ")
    .replace(/\u00D7/g, " x ")
    .replace(/\u00F7/g, " / ")
    .replace(/\u00B1/g, "+/-")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u2260/g, "!=")
    .replace(/\u2248/g, "~=");

  return text.replace(/\s+/g, " ").trim();
}

function cleanLatexSnippet(latex: string): string {
  let s = latex.trim();

  // Handle \ce{...} chemistry notation
  s = s.replace(/\\ce\{([^{}]+)\}/g, "$1");
  // Handle \text{...} and \mathrm{...}
  s = s.replace(/\\(?:text|mathrm|mathbf)\{([^{}]+)\}/g, "$1");
  // Handle \frac{a}{b} -> (a)/(b)
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)");
  }
  // Handle \sqrt{x} -> sqrt(x)
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)");
  // Common LaTeX operators and Greek symbols
  s = s
    .replace(/\\times/g, " x ")
    .replace(/\\cdot/g, " * ")
    .replace(/\\pm/g, "+/-")
    .replace(/\\leq/g, "<=")
    .replace(/\\geq/g, ">=")
    .replace(/\\neq/g, "!=")
    .replace(/\\approx/g, "~=")
    .replace(/\\to/g, " -> ")
    .replace(/\\rightarrow/g, " -> ")
    .replace(/\\rightleftharpoons/g, " <=> ")
    .replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, "sum_($1..$2)")
    .replace(/\\int_\{([^{}]+)\}\^\{([^{}]+)\}/g, "integral_($1..$2)")
    .replace(/\\Delta/g, "Delta ")
    .replace(/\\alpha/g, "alpha")
    .replace(/\\beta/g, "beta")
    .replace(/\\gamma/g, "gamma")
    .replace(/\\theta/g, "theta")
    .replace(/\\lambda/g, "lambda")
    .replace(/\\mu/g, "mu")
    .replace(/\\pi/g, "pi")
    .replace(/\\sigma/g, "sigma")
    .replace(/\\omega/g, "omega")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\;/g, " ")
    .replace(/\^\{([^{}]+)\}/g, "^($1)")
    .replace(/_\{([^{}]+)\}/g, "_($1)")
    .replace(/[{}]/g, "");

  return s.replace(/\s+/g, " ").trim();
}

/**
 * Formats a date string or current date as YYYY-MM-DD for safe filenames.
 */
export function formatReportDateForFilename(generatedAt?: string): string {
  if (generatedAt) {
    const parsed = new Date(generatedAt);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Builds a clean, safe PDF filename such as:
 *   Vidyakshara_Career_Report_Aarav_Sharma_2026-10-29.pdf
 */
export function buildCareerReportPdfFilename(
  report: Pick<CareerGuidanceReport, "studentName" | "generatedAt">
): string {
  const rawName = (report.studentName || "Student").trim();
  const safeName =
    rawName
      .replace(/[^a-zA-Z0-9\u0900-\u0D7F]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "Student";
  const datePart = formatReportDateForFilename(report.generatedAt);
  return `Vidyakshara_Career_Report_${safeName}_${datePart}.pdf`;
}

/**
 * Generates a complete, multi-page A4 PDF binary (Uint8Array starting with %PDF-)
 * from the student's actual CareerGuidanceReport data.
 */
export function generateCareerReportPdfBytes(
  report: CareerGuidanceReport
): Uint8Array {
  if (!report || !Array.isArray(report.dimensionScores)) {
    throw new Error("Invalid career report data provided for PDF generation.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: false,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm
  const topMargin = 20;
  const bottomLimit = pageHeight - 18; // Leave 18mm at bottom for page footer

  let cursorY = 16;

  // Brand Palette (RGB)
  const COLOR_PRIMARY: [number, number, number] = [22, 74, 49]; // #164A31
  const COLOR_DARK: [number, number, number] = [20, 36, 27]; // #14241B
  const COLOR_MUTED: [number, number, number] = [72, 86, 77]; // #48564D
  const COLOR_LIGHT_BG: [number, number, number] = [250, 248, 243]; // #FAF8F3
  const COLOR_ACCENT_BG: [number, number, number] = [234, 242, 236]; // #EAF2EC
  const COLOR_BORDER: [number, number, number] = [226, 229, 220]; // #E2E5DC

  const ensureSpace = (neededHeightMm: number) => {
    if (cursorY + neededHeightMm > bottomLimit) {
      doc.addPage("a4", "portrait");
      cursorY = topMargin;
    }
  };

  const writeWrappedParagraph = (
    rawText: string,
    options: {
      x?: number;
      maxWidth?: number;
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      lineHeightMm?: number;
      spacingAfterMm?: number;
    } = {}
  ) => {
    const clean = formatTextForPdf(rawText);
    if (!clean) return;

    const x = options.x ?? marginX;
    const maxWidth = options.maxWidth ?? contentWidth;
    const fontSize = options.fontSize ?? 9.5;
    const fontStyle = options.fontStyle ?? "normal";
    const color = options.color ?? COLOR_MUTED;
    const lineHeightMm = options.lineHeightMm ?? fontSize * 0.46;
    const spacingAfterMm = options.spacingAfterMm ?? 2.5;

    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines: string[] = doc.splitTextToSize(clean, maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeightMm + 1);
      doc.text(line, x, cursorY);
      cursorY += lineHeightMm;
    }
    cursorY += spacingAfterMm;
  };

  const writeSectionHeading = (label: string, subtitle?: string) => {
    ensureSpace(18);
    cursorY += 3;

    // Green accent bar + section heading box
    doc.setFillColor(COLOR_ACCENT_BG[0], COLOR_ACCENT_BG[1], COLOR_ACCENT_BG[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.roundedRect(marginX, cursorY - 4.5, contentWidth, 9, 1.5, 1.5, "FD");

    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.rect(marginX, cursorY - 4.5, 2.2, 9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(formatTextForPdf(label), marginX + 5, cursorY + 1.5);
    cursorY += 8.5;

    if (subtitle) {
      writeWrappedParagraph(subtitle, {
        fontSize: 9,
        color: COLOR_MUTED,
        spacingAfterMm: 3,
      });
    }
  };

  // =========================================================================
  // COVER / REPORT HEADER BANNER
  // =========================================================================
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.roundedRect(marginX, cursorY, contentWidth, 34, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(215, 238, 223);
  doc.text(
    "VIDYAKSHARA CAREER INTELLIGENCE TEST  |  100% FREE PERSONALIZED GUIDANCE REPORT",
    marginX + 6,
    cursorY + 8
  );

  const studentDisplayName = formatTextForPdf(report.studentName || "Student");
  const studentDisplayClass = formatTextForPdf(
    report.studentClass || "Class 11 / 12 Explorer"
  );
  const reportTitle = report.studentName
    ? `${studentDisplayName}'s Personalized Career-Guidance Report`
    : "Personalized Career-Guidance Report";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  const titleLines: string[] = doc.splitTextToSize(
    reportTitle,
    contentWidth - 12
  );
  doc.text(titleLines[0] || reportTitle, marginX + 6, cursorY + 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(235, 245, 238);
  doc.text(
    `Student: ${studentDisplayName}   |   Class: ${studentDisplayClass}   |   Date: ${formatTextForPdf(
      report.generatedAt
    )}   |   Questions Answered: ${report.answeredCount}/${report.totalQuestions}`,
    marginX + 6,
    cursorY + 25.5
  );

  doc.setFontSize(8);
  doc.setTextColor(205, 228, 213);
  doc.text(
    `Report ID: ${formatTextForPdf(report.reportId)}   |   Mode: ${
      report.personalizationMode === "ai-enhanced"
        ? "Deterministic Scoring + AI Advisor Commentary"
        : "Deterministic Interest & Preference Engine"
    }`,
    marginX + 6,
    cursorY + 31
  );

  cursorY += 40;

  // =========================================================================
  // SECTION A: WELCOME & OVERVIEW
  // =========================================================================
  writeSectionHeading(
    "A. Welcome & Executive Overview",
    "A structured exploration of your stated interests, work-style preferences, leading combinations, and career possibilities."
  );

  const topDimensionsSummary = report.leadingDimensions
    .map((d) => `${d.shortLabel} (${d.normalizedScore}/100)`)
    .join(", ");

  writeWrappedParagraph(
    `Thank you${
      report.studentName
        ? `, ${report.studentName}${
            report.studentClass ? ` (${report.studentClass})` : ""
          },`
        : ""
    } for completing the Vidyakshara Career Intelligence Test. Based on your responses across ${
      report.answeredCount
    } of ${
      report.totalQuestions
    } questions, your leading relative interest areas today are: ${topDimensionsSummary}.`,
    {
      fontSize: 9.5,
      color: COLOR_DARK,
      spacingAfterMm: 2.5,
    }
  );

  writeWrappedParagraph(
    "Important Guidance Note: This assessment explores your current interests and work-style preferences rather than predicting destiny or measuring fixed ability. Use this report as a practical compass for curiosity, subject planning, and family conversation.",
    {
      fontSize: 9,
      color: COLOR_MUTED,
      spacingAfterMm: 3,
    }
  );

  if (report.aiNarrative) {
    ensureSpace(24);
    doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.roundedRect(marginX, cursorY, contentWidth, 6, 1, 1, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(
      "Personalized AI Advisor Commentary (Grounded in Your Scores)",
      marginX + 3,
      cursorY + 4.2
    );
    cursorY += 9;

    writeWrappedParagraph(report.aiNarrative.personalizedOverview, {
      fontSize: 9.2,
      color: COLOR_DARK,
      spacingAfterMm: 2,
    });
    writeWrappedParagraph(report.aiNarrative.encouragementNote, {
      fontSize: 9,
      color: COLOR_MUTED,
      spacingAfterMm: 3,
    });
  }

  // =========================================================================
  // SECTION B: INTEREST PROFILE ACROSS SIX DIMENSIONS (TABLE & SCORE BARS)
  // =========================================================================
  writeSectionHeading(
    "B. Your Interest Profile Across Six Dimensions (0-100 Scale)",
    "Scores are normalized to a 0-100 scale based on your responses and reflect your relative preference for different types of activities."
  );

  if (report.tieNote) {
    writeWrappedParagraph(`Note on Balanced / Close Scores: ${report.tieNote}`, {
      fontSize: 9,
      fontStyle: "italic",
      color: COLOR_DARK,
      spacingAfterMm: 3,
    });
  }

  for (const dim of report.dimensionScores) {
    const explLines: string[] = doc.splitTextToSize(
      formatTextForPdf(dim.explanation),
      contentWidth - 8
    );
    const boxHeight = 14 + explLines.length * 4.2;
    ensureSpace(boxHeight + 3);

    doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.roundedRect(marginX, cursorY, contentWidth, boxHeight, 1.5, 1.5, "FD");

    // Dimension Title + Level Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(
      `${formatTextForPdf(dim.name)}  (${formatTextForPdf(dim.levelLabel)})`,
      marginX + 4,
      cursorY + 5.2
    );

    // Score on Right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(
      `${dim.normalizedScore} / 100`,
      marginX + contentWidth - 4,
      cursorY + 5.2,
      { align: "right" }
    );

    // Visual Score Bar
    const barX = marginX + 4;
    const barY = cursorY + 7.2;
    const barMaxW = contentWidth - 8;
    const barFillW = Math.max(
      1.5,
      Math.min(barMaxW, (dim.normalizedScore / 100) * barMaxW)
    );

    doc.setFillColor(226, 229, 220);
    doc.roundedRect(barX, barY, barMaxW, 2.5, 0.8, 0.8, "F");
    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.roundedRect(barX, barY, barFillW, 2.5, 0.8, 0.8, "F");

    // Explanation text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    let lineY = cursorY + 13.5;
    for (const l of explLines) {
      doc.text(l, marginX + 4, lineY);
      lineY += 4.1;
    }

    cursorY += boxHeight + 2.8;
  }

  // =========================================================================
  // SECTION C: LEADING INTEREST COMBINATIONS & WORK-STYLE PREFERENCES
  // =========================================================================
  writeSectionHeading(
    "C. Leading Interest Combinations & Preferred Work Style",
    "Most rewarding careers sit at the intersection of two or more interests rather than inside a single box."
  );

  if (report.aiNarrative?.combinationCommentary) {
    writeWrappedParagraph(
      `How Your Top Dimensions Interact: ${report.aiNarrative.combinationCommentary}`,
      {
        fontSize: 9.2,
        color: COLOR_DARK,
        spacingAfterMm: 3,
      }
    );
  }

  for (const combo of report.leadingCombinations) {
    ensureSpace(24);
    writeWrappedParagraph(`${combo.combinationCode}: ${combo.title}`, {
      fontSize: 10,
      fontStyle: "bold",
      color: COLOR_PRIMARY,
      spacingAfterMm: 1,
    });
    writeWrappedParagraph(`What it suggests: ${combo.meaning}`, {
      x: marginX + 3,
      maxWidth: contentWidth - 3,
      fontSize: 9.2,
      color: COLOR_DARK,
      spacingAfterMm: 1.2,
    });
    writeWrappedParagraph(
      `Alternative perspective: ${combo.alternativeInterpretation}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 9,
        color: COLOR_MUTED,
        spacingAfterMm: 3,
      }
    );
  }

  // Work & Learning Preferences Summary Table
  ensureSpace(20);
  writeWrappedParagraph("Your Stated Learning & Work-Environment Preferences:", {
    fontSize: 10,
    fontStyle: "bold",
    color: COLOR_DARK,
    spacingAfterMm: 2,
  });

  const workStyleRows: [string, string][] = [
    ["Work Setting Preference", report.workStyleSummary.preferredEnvironment],
    ["Learning Approach", report.workStyleSummary.learningApproach],
    ["Collaboration & Focus", report.workStyleSummary.collaborationStyle],
    ["Interdisciplinary Openness", report.workStyleSummary.explorationOpenness],
  ];

  for (const [label, desc] of workStyleRows) {
    const col1W = 48;
    const col2W = contentWidth - col1W - 6;
    const descLines: string[] = doc.splitTextToSize(
      formatTextForPdf(desc),
      col2W
    );
    const rowH = Math.max(8, descLines.length * 4.2 + 3);
    ensureSpace(rowH + 1);

    doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.rect(marginX, cursorY, contentWidth, rowH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(label, marginX + 3, cursorY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    let ty = cursorY + 5;
    for (const l of descLines) {
      doc.text(l, marginX + col1W + 3, ty);
      ty += 4.1;
    }

    cursorY += rowH;
  }
  cursorY += 4;

  // =========================================================================
  // SECTION D: CAREER FIELDS TO EXPLORE
  // =========================================================================
  writeSectionHeading(
    "D. Recommended Career Fields to Explore",
    "Below are the top career clusters aligned with your responses. Treat this ranking as a starting menu for exploration rather than a restrictive prediction."
  );

  for (const matched of report.recommendedClusters) {
    ensureSpace(32);

    // Cluster Title Banner
    doc.setFillColor(COLOR_ACCENT_BG[0], COLOR_ACCENT_BG[1], COLOR_ACCENT_BG[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.roundedRect(marginX, cursorY, contentWidth, 9, 1.2, 1.2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.2);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(
      `#${matched.rank}. ${formatTextForPdf(matched.cluster.title)}`,
      marginX + 3.5,
      cursorY + 5.8
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(
      `Interest Alignment: ${matched.alignmentScore} / 100`,
      marginX + contentWidth - 3.5,
      cursorY + 5.8,
      { align: "right" }
    );
    cursorY += 12;

    writeWrappedParagraph(`Focus Areas: ${matched.cluster.subtitle}`, {
      fontSize: 8.8,
      fontStyle: "italic",
      color: COLOR_PRIMARY,
      spacingAfterMm: 1.5,
    });

    writeWrappedParagraph(
      `Why it may fit your stated interests: ${matched.whyItFits}`,
      {
        fontSize: 9.2,
        color: COLOR_DARK,
        spacingAfterMm: 2,
      }
    );

    writeWrappedParagraph(
      `Example Careers: ${matched.cluster.exampleCareers.join("  |  ")}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 8.8,
        color: COLOR_MUTED,
        spacingAfterMm: 1.5,
      }
    );

    writeWrappedParagraph(
      `Typical Activities & Problems: ${matched.cluster.typicalActivities.join(
        "; "
      )}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 8.8,
        color: COLOR_MUTED,
        spacingAfterMm: 1.5,
      }
    );

    writeWrappedParagraph(
      `Relevant Subjects & Skills: ${matched.cluster.relevantSubjectsAndSkills.join(
        "; "
      )}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 8.8,
        color: COLOR_MUTED,
        spacingAfterMm: 1.5,
      }
    );

    writeWrappedParagraph(
      `How Concepts & Models Appear in This Field: ${matched.cluster.quantitativeOrConceptExample}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 8.8,
        color: COLOR_MUTED,
        spacingAfterMm: 1.5,
      }
    );

    writeWrappedParagraph(
      `Practical, Zero-Cost Way to Test Your Interest: ${matched.cluster.lowCostTrialActivity}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 8.8,
        color: COLOR_DARK,
        spacingAfterMm: 1.5,
      }
    );

    writeWrappedParagraph(
      `Academic Eligibility & Pathway Reminder: ${matched.cluster.eligibilityAndPathwayNote}`,
      {
        x: marginX + 3,
        maxWidth: contentWidth - 3,
        fontSize: 8.8,
        color: COLOR_MUTED,
        spacingAfterMm: 4,
      }
    );
  }

  // Also include a concise summary table of all 10 career clusters so nothing is omitted
  if (report.allRankedClusters && report.allRankedClusters.length > 5) {
    ensureSpace(26);
    writeWrappedParagraph(
      "Complete 10-Cluster Alignment Summary (All Evaluated Career Fields):",
      {
        fontSize: 9.8,
        fontStyle: "bold",
        color: COLOR_DARK,
        spacingAfterMm: 2,
      }
    );

    for (const item of report.allRankedClusters) {
      ensureSpace(7);
      doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.rect(marginX, cursorY, contentWidth, 6.2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
      doc.text(
        `#${item.rank}. ${formatTextForPdf(item.cluster.title)}`,
        marginX + 3,
        cursorY + 4.3
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text(
        formatTextForPdf(item.cluster.subtitle),
        marginX + 74,
        cursorY + 4.3
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
      doc.text(
        `${item.alignmentScore} / 100`,
        marginX + contentWidth - 3,
        cursorY + 4.3,
        { align: "right" }
      );
      cursorY += 6.2;
    }
    cursorY += 4;
  }

  // =========================================================================
  // SECTION E: LEARNING & SKILL DEVELOPMENT
  // =========================================================================
  writeSectionHeading(
    "E. Learning & Skill Development",
    "Foundational capabilities that connect to your expressed interests and remain valuable across multiple career paths."
  );

  for (const skill of report.skillRecommendations) {
    ensureSpace(18);
    writeWrappedParagraph(`${skill.skillName} (${skill.category})`, {
      fontSize: 9.8,
      fontStyle: "bold",
      color: COLOR_DARK,
      spacingAfterMm: 1,
    });
    writeWrappedParagraph(`Why suggested: ${skill.whySuggested}`, {
      x: marginX + 3,
      maxWidth: contentWidth - 3,
      fontSize: 9,
      color: COLOR_MUTED,
      spacingAfterMm: 1,
    });
    writeWrappedParagraph(`How to practise: ${skill.starterActivity}`, {
      x: marginX + 3,
      maxWidth: contentWidth - 3,
      fontSize: 9,
      color: COLOR_PRIMARY,
      spacingAfterMm: 3,
    });
  }

  // =========================================================================
  // SECTION F: PERSONALIZED 7-DAY EXPLORATION PLAN
  // =========================================================================
  writeSectionHeading(
    "F. Your Personalized 7-Day Exploration Plan",
    "Spend 15-30 minutes a day over the next week testing your top career clusters through practical, zero-cost activities."
  );

  for (const dayPlan of report.sevenDayPlan) {
    const descLines: string[] = doc.splitTextToSize(
      formatTextForPdf(dayPlan.activity),
      contentWidth - 8
    );
    const boxH = 11 + descLines.length * 4.1;
    ensureSpace(boxH + 2.5);

    doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.roundedRect(marginX, cursorY, contentWidth, boxH, 1.2, 1.2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(
      `Day ${dayPlan.day}: ${formatTextForPdf(dayPlan.title)}`,
      marginX + 3.5,
      cursorY + 5.2
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text(
      `${formatTextForPdf(dayPlan.timeEstimate)}  |  Focus: ${formatTextForPdf(
        dayPlan.focusArea
      )}`,
      marginX + contentWidth - 3.5,
      cursorY + 5.2,
      { align: "right" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    let ay = cursorY + 9.8;
    for (const l of descLines) {
      doc.text(l, marginX + 3.5, ay);
      ay += 4.1;
    }

    cursorY += boxH + 2.2;
  }

  // =========================================================================
  // SECTION G: QUESTIONS FOR FURTHER REFLECTION
  // =========================================================================
  writeSectionHeading(
    "G. Questions for Further Reflection",
    "Use these questions in a notebook or in a calm conversation with your parents, teachers, or school counsellor."
  );

  report.reflectionQuestions.forEach((question, index) => {
    writeWrappedParagraph(`${index + 1}. ${question}`, {
      x: marginX + 2,
      maxWidth: contentWidth - 2,
      fontSize: 9.2,
      color: COLOR_DARK,
      spacingAfterMm: 2,
    });
  });

  // =========================================================================
  // SECTION H: IMPORTANT LIMITATIONS & EDUCATIONAL DISCLAIMERS
  // =========================================================================
  writeSectionHeading(
    "H. Important Limitations & Responsible Use",
    "Please keep these ethical and educational principles in mind when reviewing your report."
  );

  for (const lim of report.limitationsAndEthics) {
    writeWrappedParagraph(`- ${lim}`, {
      x: marginX + 2,
      maxWidth: contentWidth - 2,
      fontSize: 8.8,
      color: COLOR_MUTED,
      spacingAfterMm: 2,
    });
  }

  // =========================================================================
  // RUNNING HEADER (PAGES 2..N) & PAGE NUMBER FOOTERS (ALL PAGES)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    if (p > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(110, 123, 114);
      doc.text(
        `Vidyakshara Career Intelligence Report  |  ${studentDisplayName} (${studentDisplayClass})`,
        marginX,
        11
      );
      doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
      doc.line(marginX, 13, pageWidth - marginX, 13);
    }

    // Footer line and page number
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 123, 114);
    doc.text(
      "Vidyakshara Learning Platform  |  100% Free Exploratory Career-Interest Guidance",
      marginX,
      pageHeight - 8.5
    );
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 8.5,
      { align: "right" }
    );
  }

  const arrayBuffer = doc.output("arraybuffer");
  const bytes = new Uint8Array(arrayBuffer);

  // Verify %PDF- header signature
  const signature = String.fromCharCode(
    bytes[0] || 0,
    bytes[1] || 0,
    bytes[2] || 0,
    bytes[3] || 0,
    bytes[4] || 0
  );
  if (signature !== "%PDF-") {
    throw new Error("Generated document did not contain a valid %PDF- header.");
  }

  return bytes;
}

/**
 * Generates the genuine PDF report and triggers a browser file download
 * with MIME type application/pdf and a sanitized .pdf filename.
 */
export async function downloadCareerReportPdf(
  report: CareerGuidanceReport
): Promise<{
  ok: boolean;
  filename: string;
  byteLength: number;
  pageCountEstimate: number;
  error?: string;
}> {
  try {
    // Yield briefly so React can paint the "Generating PDF…" button state
    await new Promise((resolve) => setTimeout(resolve, 25));

    const pdfBytes = generateCareerReportPdfBytes(report);
    const filename = buildCareerReportPdfFilename(report);

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    const objectUrl = URL.createObjectURL(blob);

    try {
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      // Release the temporary object URL after the browser initiates the download
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // Ignore revoke errors
        }
      }, 5000);
    }

    const pdfStringSample = new TextDecoder("latin1").decode(pdfBytes);
    const pageMatches = pdfStringSample.match(/\/Type\s*\/Page\b/g);

    return {
      ok: true,
      filename,
      byteLength: pdfBytes.byteLength,
      pageCountEstimate: pageMatches ? pageMatches.length : 1,
    };
  } catch (err) {
    return {
      ok: false,
      filename: "",
      byteLength: 0,
      pageCountEstimate: 0,
      error:
        err instanceof Error && err.message
          ? err.message
          : "Failed to generate the PDF report. Please retry.",
    };
  }
}
