import jsPDF from "jspdf";

interface ReportData {
  tailNumber: string;
  matchType: string;
  registry: Record<string, string> | null;
  count: number;
  topFailures: { partName: string; count: number }[];
  ads: {
    adNumber: string;
    subject: string;
    applicable: boolean;
    confidence: number;
    reasoning: string;
  }[];
  riskScore: number;
  failedCount: number;
  excessWearCount: number;
  applicableCount: number;
  totalADsMatched: number;
}

export function generateReport(data: ReportData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  // ── Helper functions ─────────────────────────────────────────────────────

  function checkPage(needed = 10) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
      addPageNumber();
    }
  }

  function addPageNumber() {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    doc.text(`Page ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    doc.setTextColor(0);
  }

  function hRule() {
    checkPage(6);
    doc.setDrawColor(180);
    doc.line(margin, y, margin + contentWidth, y);
    y += 4;
  }

  function sectionHeader(text: string) {
    checkPage(10);
    y += 2;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }

  function bodyText(text: string, indent = 0) {
    checkPage(7);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5 + 1;
  }

  function monoText(text: string, indent = 0) {
    checkPage(7);
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5 + 1;
    doc.setFont("helvetica", "normal");
  }

  // ── Header ────────────────────────────────────────────────────────────────

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AeroGuard \u2014 Aviation Safety Intelligence", margin, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Aircraft Analysis Report", margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${dateStr}`, margin, y);
  doc.setTextColor(0);
  y += 6;

  hRule();

  // ── Aircraft Information ──────────────────────────────────────────────────

  sectionHeader("Aircraft Information");

  const manufacturer = data.registry?.manufacturer ?? "Unknown";
  const model = data.registry?.model ?? "Unknown";
  const serialNumber = data.registry?.serialNumber ?? "Unknown";

  bodyText(`Tail Number:         ${data.tailNumber}`);
  bodyText(`Manufacturer & Model: ${manufacturer} ${model}`);
  monoText(`Serial Number:       ${serialNumber}`);

  if (data.matchType === "model") {
    y += 2;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text("Note: No direct tail match \u2014 showing model-wide data", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    y += 6;
  }

  hRule();

  // ── Risk Assessment ───────────────────────────────────────────────────────

  sectionHeader("Risk Assessment");

  const riskLabel =
    data.riskScore > 70 ? "High" : data.riskScore > 30 ? "Moderate" : "Low";

  monoText(`Risk Score:  ${data.riskScore}/100`);
  bodyText(`Risk Level:  ${riskLabel}`);
  y += 2;

  bodyText("Score Breakdown:");
  monoText(`  Base:                     +10pts`, 4);
  monoText(
    `  Applicable ADs:           +${data.applicableCount * 40}pts  (${data.applicableCount} ADs \xd7 40)`,
    4
  );
  monoText(
    `  Failed/Cracked Parts:     +${data.failedCount * 10}pts  (${data.failedCount} parts \xd7 10)`,
    4
  );
  monoText(
    `  Excess Wear:              +${data.excessWearCount * 2}pts  (${data.excessWearCount} parts \xd7 2)`,
    4
  );

  hRule();

  // ── Failure Analytics ─────────────────────────────────────────────────────

  sectionHeader("Failure Analytics");

  bodyText(`Total SDRs found: ${data.count}`);
  y += 2;

  if (data.topFailures.length > 0) {
    bodyText("Top Part Failures:");
    y += 1;

    // Table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Rank", margin + 2, y);
    doc.text("Part Name", margin + 18, y);
    doc.text("Count", margin + contentWidth - 20, y, { align: "left" });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setDrawColor(200);
    doc.line(margin, y, margin + contentWidth, y);
    y += 3;

    data.topFailures.forEach((f, i) => {
      checkPage(7);
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      doc.text(`${i + 1}`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      const partLines = doc.splitTextToSize(f.partName, contentWidth - 40);
      doc.text(partLines, margin + 18, y);
      doc.text(`${f.count}`, margin + contentWidth - 20, y);
      y += Math.max(partLines.length * 4.5, 5) + 1;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("No part failures recorded.", margin, y);
    doc.setTextColor(0);
    y += 5;
  }

  hRule();

  // ── Airworthiness Directive Compliance ───────────────────────────────────

  sectionHeader("Airworthiness Directive Compliance");

  bodyText(
    `Summary: ${data.applicableCount} of ${data.totalADsMatched} ADs applicable`
  );
  y += 3;

  if (data.ads.length > 0) {
    data.ads.forEach((ad) => {
      checkPage(28);

      doc.setFontSize(10);
      doc.setFont("courier", "bold");
      doc.text(ad.adNumber, margin, y);
      doc.setFont("helvetica", "normal");
      y += 5;

      const subjectLines = doc.splitTextToSize(`Subject: ${ad.subject}`, contentWidth - 4);
      doc.setFontSize(9);
      doc.text(subjectLines, margin + 4, y);
      y += subjectLines.length * 4.5 + 1;

      const status = ad.applicable ? "Applicable" : "Not Applicable";
      doc.text(`Status: ${status}   Confidence: ${ad.confidence}%`, margin + 4, y);
      y += 5;

      const reasoningLines = doc.splitTextToSize(`AI Reasoning: ${ad.reasoning}`, contentWidth - 4);
      doc.setFontSize(8);
      doc.setTextColor(80);
      doc.text(reasoningLines, margin + 4, y);
      doc.setTextColor(0);
      y += reasoningLines.length * 4 + 4;

      doc.setDrawColor(220);
      doc.line(margin, y, margin + contentWidth, y);
      y += 3;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("No airworthiness directives found.", margin, y);
    doc.setTextColor(0);
    y += 5;
  }

  // ── Footer on last page ───────────────────────────────────────────────────

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(7);
  doc.setTextColor(130);
  doc.setFont("helvetica", "italic");
  const footerText =
    "Generated by AeroGuard \u2014 This report is for informational purposes only and does not constitute official FAA compliance documentation.";
  doc.text(footerText, pageWidth / 2, footerY, { align: "center" });
  doc.setTextColor(0);

  addPageNumber();

  // ── Save ──────────────────────────────────────────────────────────────────

  const fileDateStr = now.toISOString().slice(0, 10);
  doc.save(`AeroGuard-${data.tailNumber}-${fileDateStr}.pdf`);
}
