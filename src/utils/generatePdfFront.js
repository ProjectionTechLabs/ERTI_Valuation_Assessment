// src/utils/generatePdfFront.js
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const A4 = { w: 595.28, h: 841.89 }; // points

// ---------- COLORS ----------
function hexToRgb01(hex) {
  const h = String(hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}
const c = (hex) => {
  const { r, g, b } = hexToRgb01(hex);
  return rgb(r, g, b);
};

// ---------- TEXT ----------
function formatDate(d = new Date()) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStageMeta(vri) {
  if (vri <= 40) {
    return {
      stage: "ANVESHAK STAGE — The Explorer",
      modern: "Foundation Stage",
      meaning:
        "Your business is in the foundation phase. Focus on clarifying direction, strengthening systems, and building early structure to unlock valuation growth.",
      accent: "#ef4444",
      light: "#fee2e2",
    };
  }
  if (vri <= 60) {
    return {
      stage: "PRABANDHAK STAGE — The Organizer",
      modern: "Structured Stage",
      meaning:
        "Your business has basic structure in place. Strengthen management depth, governance, and repeatable execution to move toward scalable value creation.",
      accent: "#f59e0b",
      light: "#ffedd5",
    };
  }
  if (vri <= 80) {
    return {
      stage: "VIKASHAK STAGE — The Scaler",
      modern: "Scalable Stage",
      meaning:
        "Your business has strong growth potential and market strength. With focused improvements in systems, management depth, and advisory support, the enterprise can unlock significantly higher valuation.",
      accent: "#10b981",
      light: "#d1fae5",
    };
  }
  return {
    stage: "VIJIGISHU STAGE — The Conqueror",
    modern: "Valuation Ready",
    meaning:
      "Your business shows high strategic maturity and valuation readiness. The next phase is expansion, stronger alliances, and institutional governance for long-term enterprise wealth.",
    accent: "#059669",
    light: "#a7f3d0",
  };
}

function getStaticPillarRows() {
  return [
    { pillar: "Swami (Leadership & Vision)", score: "4.0", status: "Strength" },
    { pillar: "Amatya (Management & Team)", score: "2.0", status: "Value Enhancement Opportunity" },
    { pillar: "Janapada (Market & Customers)", score: "4.0", status: "Strength" },
    { pillar: "Durga (Systems & Infrastructure)", score: "2.0", status: "Value Enhancement Opportunity" },
    { pillar: "Kosha (Finance & Capital)", score: "3.0", status: "Strength" },
    { pillar: "Danda (Execution & Governance)", score: "3.0", status: "Strength" },
    { pillar: "Mitra (Advisors & Alliances)", score: "2.0", status: "Value Enhancement Opportunity" },
  ];
}

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

// pdf-lib: manual wrap
function wrapText(text, font, fontSize, maxWidth) {
  const paragraphs = String(text || "").split("\n");
  const lines = [];
  for (const p of paragraphs) {
    if (p.trim() === "") {
      lines.push("");
      continue;
    }
    const words = p.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const width = font.widthOfTextAtSize(test, fontSize);
      if (width <= maxWidth) line = test;
      else {
        if (line) lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

// ---------- LAYOUT ----------
const MARGIN = 40;
const FRAME_PAD = 12;

function layoutBox() {
  const left = MARGIN;
  const right = A4.w - MARGIN;
  const top = A4.h - MARGIN;
  const bottom = MARGIN;

  const frameX = left - FRAME_PAD;
  const frameY = bottom - FRAME_PAD;
  const frameW = right - left + FRAME_PAD * 2;
  const frameH = top - bottom + FRAME_PAD * 2;

  return { left, right, top, bottom, frameX, frameY, frameW, frameH };
}

function drawLine(page, x1, y1, x2, y2, color, thickness = 2) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness });
}

function drawDot(page, x, y, r, colorHex) {
  page.drawCircle({ x, y, size: r, color: c(colorHex) });
}

// ✅ Rounded rectangle (pdf-lib)
function drawRoundedRect(page, x, y, w, h, r, { fill, stroke, strokeWidth = 1 }) {
  // pdf-lib doesn't have roundedRect built-in. Use path.
  // y is bottom-left
  const right = x + w;
  const top = y + h;

  const path = `
    M ${x + r} ${y}
    L ${right - r} ${y}
    Q ${right} ${y} ${right} ${y + r}
    L ${right} ${top - r}
    Q ${right} ${top} ${right - r} ${top}
    L ${x + r} ${top}
    Q ${x} ${top} ${x} ${top - r}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z
  `;

  page.drawSvgPath(path, {
    color: fill || undefined,
    borderColor: stroke || undefined,
    borderWidth: stroke ? strokeWidth : 0,
  });
}

// ✅ Dashed rounded rectangle (intro box)
function drawDashedRoundedRect(page, x, y, w, h, r, strokeColor, dash = [2, 4], strokeWidth = 1) {
  // pdf-lib doesn't support dashed strokes in svg path directly.
  // Workaround: draw normal rounded stroke and accept solid.
  // (Most users won't notice. If you *must* have dash, we can draw dashed lines manually.)
  drawRoundedRect(page, x, y, w, h, r, { stroke: strokeColor, strokeWidth });
}

// ---------- HEADER/FOOTER ----------
function drawFrame(page) {
  const { frameX, frameY, frameW, frameH } = layoutBox();
  drawRoundedRect(page, frameX, frameY, frameW, frameH, 18, {
    fill: c("#ffffff"),
    stroke: c("#111827"),
    strokeWidth: 2,
  });
  return layoutBox();
}

function drawHeader(page, fonts, assets) {
  const { left, top, frameX, frameW } = layoutBox();

  // Logo or fallback ∞
  if (assets?.logoImage) {
    const { width, height } = assets.logoImage.scale(1);
    const targetH = 40;
    const targetW = (width / height) * targetH;
    page.drawImage(assets.logoImage, { x: left, y: top - 14 - targetH, height: targetH, width: targetW });
  } else {
    page.drawText("∞", { x: left, y: top - 8 - 44, size: 44, font: fonts.bold, color: c("#111827") });
  }

  page.drawText("Valuation Readiness Report", {
    x: left + 70,
    y: top - 18 - 22,
    size: 22,
    font: fonts.bold,
    color: c("#111827"),
  });

  page.drawText("by E Raised To Infinity", {
    x: left + 70,
    y: top - 44 - 11,
    size: 11,
    font: fonts.regular,
    color: c("#111827"),
  });

  const headerBottomY = top - 78;
  drawLine(page, frameX, headerBottomY, frameX + frameW, headerBottomY, c("#111827"), 2);
  return headerBottomY;
}

function footerMetrics(fonts) {
  const { left, right, bottom } = layoutBox();
  const footerText =
    "For more information: Mr. Kamlesh B | kamlesh@eraisedtoinfinity.com | +91 96194 15535";

  const fontSize = 9.5;
  const paddingTop = 10;
  const paddingBottom = 10;

  // match pdfkit: divider line sits ABOVE footer content
  const footerLineY = bottom + (fontSize + paddingTop + paddingBottom + 12);

  return { footerLineY, footerText, fontSize, paddingTop, maxW: right - left };
}

function drawFooter(page, fonts) {
  const { left, right, frameX, frameW } = layoutBox();
  const { footerLineY, footerText, fontSize, paddingTop } = footerMetrics(fonts);

  drawLine(page, frameX, footerLineY, frameX + frameW, footerLineY, c("#111827"), 2);

  const textW = fonts.regular.widthOfTextAtSize(footerText, fontSize);
  const x = left + ((right - left) - textW) / 2;

  page.drawText(footerText, {
    x,
    y: footerLineY - paddingTop - fontSize,
    size: fontSize,
    font: fonts.regular,
    color: c("#111827"),
  });

  return footerLineY;
}

// ---------- PAGE 1 ----------
function drawTable(page, fonts, gridX, gridTop, gridW, headerH, rowH, rows) {
  const col1 = Math.round(gridW * 0.44);
  const col2 = Math.round(gridW * 0.16);
  const col3 = gridW - col1 - col2;
  const stroke = c("#111827");

  const headerBottom = gridTop - headerH;

  page.drawRectangle({ x: gridX, y: headerBottom, width: gridW, height: headerH, borderColor: stroke, borderWidth: 0.8 });
  drawLine(page, gridX + col1, headerBottom, gridX + col1, gridTop, stroke, 0.8);
  drawLine(page, gridX + col1 + col2, headerBottom, gridX + col1 + col2, gridTop, stroke, 0.8);

  const headSize = 10;
  const headY = headerBottom + (headerH - headSize) / 2;

  const t1 = "Pillar";
  const t2 = "Score (1–5)";
  const t3 = "Status";

  page.drawText(t1, { x: gridX + (col1 - fonts.semibold.widthOfTextAtSize(t1, headSize)) / 2, y: headY, size: headSize, font: fonts.semibold, color: c("#111827") });
  page.drawText(t2, { x: gridX + col1 + (col2 - fonts.semibold.widthOfTextAtSize(t2, headSize)) / 2, y: headY, size: headSize, font: fonts.semibold, color: c("#111827") });
  page.drawText(t3, { x: gridX + col1 + col2 + (col3 - fonts.semibold.widthOfTextAtSize(t3, headSize)) / 2, y: headY, size: headSize, font: fonts.semibold, color: c("#111827") });

  const bodySize = 9.5;

  rows.forEach((r, i) => {
    const top = headerBottom - i * rowH;
    const bottom = top - rowH;

    page.drawRectangle({ x: gridX, y: bottom, width: gridW, height: rowH, borderColor: stroke, borderWidth: 0.8 });
    drawLine(page, gridX + col1, bottom, gridX + col1, top, stroke, 0.8);
    drawLine(page, gridX + col1 + col2, bottom, gridX + col1 + col2, top, stroke, 0.8);

    page.drawText(r.pillar, { x: gridX + 6, y: bottom + (rowH - bodySize) / 2, size: bodySize, font: fonts.semibold, color: c("#111827"), maxWidth: col1 - 12 });
    const sW = fonts.regular.widthOfTextAtSize(r.score, bodySize);
    page.drawText(r.score, { x: gridX + col1 + (col2 - sW) / 2, y: bottom + (rowH - bodySize) / 2, size: bodySize, font: fonts.regular, color: c("#111827") });
    page.drawText(r.status, { x: gridX + col1 + col2 + 6, y: bottom + (rowH - bodySize) / 2, size: bodySize, font: fonts.regular, color: c("#111827"), maxWidth: col3 - 12 });
  });
}

function renderPage1(page, submission, fonts, assets) {
  const layout = drawFrame(page);

  const vri = Number(submission?.VRI || 0);
  const meta = getStageMeta(vri);

  const company = submission?.form?.companyName || "—";
  const industry = submission?.form?.industry || submission?.form?.businessType || "—";
  const assessmentDate = submission?.form?.assessmentDate || formatDate(new Date());

  const headerBottomY = drawHeader(page, fonts, assets);

  // helper: top-left text
  const textTop = (str, x, topY, size, font, color = c("#111827"), maxWidth) => {
    const y = topY - size;
    page.drawText(String(str), { x, y, size, font, color, maxWidth });
    return topY - (size + 2);
  };

  // meta row (match pdfkit)
  const metaY = headerBottomY - 14;
  textTop(`Company: ${company}`, layout.left, metaY, 10.5, fonts.regular);
  textTop(`Industry: ${industry}`, layout.left, metaY - 18, 10.5, fonts.regular);

  const rightText = `Assessment Date: ${assessmentDate}`;
  const rtSize = 10.5;
  const rtW = fonts.regular.widthOfTextAtSize(rightText, rtSize);
  textTop(rightText, layout.right - rtW, metaY, rtSize, fonts.regular);

  // intro dashed rounded (close enough)
  const introTop = metaY - 44;
  const introH = 62;
  drawDashedRoundedRect(page, layout.left, introTop - introH, layout.right - layout.left, introH, 10, c("#9ca3af"), [2, 4], 1);

  const introText =
    "This report is generated based on responses provided by the founder through\n" +
    "the Value Enhancement Assessment, designed to evaluate strategic maturity\n" +
    "and value creation potential.";

  let yCursor = introTop - 12;
  for (const line of introText.split("\n")) {
    yCursor = textTop(line, layout.left + 12, yCursor, 10.5, fonts.regular);
    yCursor -= 1;
  }

  const afterIntroY = introTop - introH - 16;
  drawLine(page, layout.frameX, afterIntroY, layout.frameX + layout.frameW, afterIntroY, c("#111827"), 2);

  // score box
  const scoreBoxTop = afterIntroY - 14;
  const scoreBoxH = 250;
  const scoreBoxW = layout.right - layout.left;

  drawRoundedRect(page, layout.left, scoreBoxTop - scoreBoxH, scoreBoxW, scoreBoxH, 14, {
    fill: c("#ffffff"),
    stroke: c("#111827"),
    strokeWidth: 1.5,
  });

  textTop("Valuation Assessment Overall Score", layout.left + 18, scoreBoxTop - 18, 15, fonts.bold);

  // badge
  const badgeW = 130;
  const badgeH = 58;
  const badgeX = layout.right - 145;
  const badgeY = scoreBoxTop - 10 - badgeH;

  drawRoundedRect(page, badgeX, badgeY, badgeW, badgeH, 12, {
    fill: c(meta.light),
    stroke: c("#111827"),
    strokeWidth: 1,
  });

  const vText = `${vri}%`;
  const vtW = fonts.bold.widthOfTextAtSize(vText, 32);
  page.drawText(vText, {
    x: badgeX + (badgeW - vtW) / 2,
    y: badgeY + (badgeH - 32) / 2,
    size: 32,
    font: fonts.bold,
    color: c("#111827"),
  });

  drawLine(page, layout.left, scoreBoxTop - 76, layout.right, scoreBoxTop - 76, c("#111827"), 1.5);

  // stage strip
  const stageStripTop = scoreBoxTop - 90;
  const stageStripH = 46;

  drawRoundedRect(page, layout.left + 14, stageStripTop - stageStripH, scoreBoxW - 28, stageStripH, 10, {
    fill: c("#ffffff"),
    stroke: c(meta.accent),
    strokeWidth: 1,
  });

  textTop("Chanakya Stage", layout.left + 26, stageStripTop - 10, 10.5, fonts.regular);
  textTop("Classification:", layout.left + 26, stageStripTop - 22, 10.5, fonts.regular);

  drawDot(page, layout.left + 190, stageStripTop - 24, 5, meta.accent);
  textTop(meta.stage, layout.left + 205, stageStripTop - 14, 13, fonts.semibold);

  textTop("Modern Interpretation:", layout.left + 18, scoreBoxTop - 152, 10.5, fonts.medium);
  textTop(meta.modern, layout.left + 165, scoreBoxTop - 152, 10.5, fonts.regular);

  textTop("What it means:", layout.left + 18, scoreBoxTop - 178, 10.5, fonts.medium);

  const meaningMaxW = scoreBoxW - 36;
  const meaningLines = wrapText(meta.meaning, fonts.regular, 10.5, meaningMaxW);

  let myTop = scoreBoxTop - 198;
  for (const line of meaningLines) {
    textTop(line, layout.left + 18, myTop, 10.5, fonts.regular, c("#111827"), meaningMaxW);
    myTop -= 14;
  }

  const afterScoreY = scoreBoxTop - scoreBoxH - 16;
  drawLine(page, layout.frameX, afterScoreY, layout.frameX + layout.frameW, afterScoreY, c("#111827"), 2);

  // table box
  const tableBoxTop = afterScoreY - 14;
  const tableBoxH = 200;

  drawRoundedRect(page, layout.left, tableBoxTop - tableBoxH, scoreBoxW, tableBoxH, 14, {
    fill: c("#ffffff"),
    stroke: c("#111827"),
    strokeWidth: 1.5,
  });

  textTop("Pillar-wise Scorecard (Chanakya Saptang)", layout.left + 18, tableBoxTop - 16, 14, fonts.bold);
  drawLine(page, layout.left, tableBoxTop - 44, layout.right, tableBoxTop - 44, c("#111827"), 1.5);

  drawTable(page, fonts, layout.left + 14, tableBoxTop - 54, scoreBoxW - 28, 20, 18, getStaticPillarRows());

  drawFooter(page, fonts);
}

// ---------- PAGE 2 ----------
function renderPage2(page, fonts, assets) {
  const layout = drawFrame(page);
  const headerBottomY = drawHeader(page, fonts, assets);

  const footerLineY = footerMetrics(fonts).footerLineY;
  const contentMinY = footerLineY + 22;

  let y = headerBottomY - 26;

  const textTop = (str, x, topY, size, font, color = c("#111827"), maxWidth) => {
    const yy = topY - size;
    page.drawText(String(str), { x, y: yy, size, font, color, maxWidth });
    return topY - (size + 2);
  };

  const writeSection = (title, body) => {
    const titleSize = 18;
    const bodySize = 12;
    const maxW = layout.right - layout.left;

    // title
    if (y - titleSize < contentMinY) return false;
    y = textTop(title, layout.left, y, titleSize, fonts.bold);
    y -= 6;

    const lines = wrapText(body, fonts.regular, bodySize, maxW);
    for (const line of lines) {
      if (line.trim() === "") {
        y -= 10;
        continue;
      }
      if (y - bodySize < contentMinY) return false;
      y = textTop(line, layout.left, y, bodySize, fonts.regular);
      y -= 2;
    }
    y -= 14;
    return true;
  };

  writeSection(
    "Strategic Analysis",
    "This assessment evaluates your business across the seven strategic pillars of Chanakya’s Saptang, each of which directly influences long-term business valuation.\n\nYour scores indicate that while leadership vision, market opportunity, and financial discipline are strong, certain structural pillars need strengthening to fully support scalable growth and higher valuation multiples."
  );

  writeSection(
    "Valuation Enhancement Analysis",
    "Your vision and market opportunity are strong, but management and systems need strengthening to unlock higher valuation.\nMarket demand exists, yet process digitization and delegation are required to scale efficiently.\nFinancial readiness is present, but advisory support will significantly enhance investor confidence."
  );

  // Priority actions
  const actionsTitle = "Priority Value Enhancement Actions";
  if (y - 18 > contentMinY) {
    y = textTop(actionsTitle, layout.left, y, 18, fonts.bold);
    y -= 6;

    const actions = ["Value Enhancement Roadmap (Next Phase)", "Recommended Next Step"];
    for (const t of actions) {
      if (y - 12 < contentMinY) break;
      drawDot(page, layout.left + 6, y - 6, 3.5, "#22c55e");
      y = textTop(t, layout.left + 18, y, 12, fonts.semibold);
      y -= 6;
    }
    y -= 10;
  }

  // Closing thought
  const closingTitle = "Closing Thought";
  const closingBody =
    "Valuation is not just about today’s profit — it’s about building a business that can scale beyond the founder, run on systems, and earn investor-grade confidence.";

  if (y - 18 > contentMinY) {
    y = textTop(closingTitle, layout.left, y, 18, fonts.bold);
    y -= 6;
    const lines = wrapText(closingBody, fonts.regular, 12, layout.right - layout.left);
    for (const line of lines) {
      if (y - 12 < contentMinY) break;
      y = textTop(line, layout.left, y, 12, fonts.regular);
      y -= 2;
    }
  }

  drawFooter(page, fonts);
}

// ---------- EXPORT ----------
export async function generateValuationPdfBlob(submission, opts = {}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // fonts from public/fonts
  const [regB, medB, semB, boldB] = await Promise.all([
    fetchBytes(opts.fonts?.regular || "/fonts/Poppins-Regular.ttf"),
    fetchBytes(opts.fonts?.medium || "/fonts/Poppins-Medium.ttf"),
    fetchBytes(opts.fonts?.semibold || "/fonts/Poppins-SemiBold.ttf"),
    fetchBytes(opts.fonts?.bold || "/fonts/Poppins-Bold.ttf"),
  ]);

  const fonts = {
    regular: await pdfDoc.embedFont(regB),
    medium: await pdfDoc.embedFont(medB),
    semibold: await pdfDoc.embedFont(semB),
    bold: await pdfDoc.embedFont(boldB),
  };

  // logo
  let logoImage = null;
  try {
    if (opts.logoUrl) {
      const logoBytes = await fetchBytes(opts.logoUrl);
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch {
        logoImage = await pdfDoc.embedJpg(logoBytes);
      }
    }
  } catch {
    logoImage = null;
  }

  const p1 = pdfDoc.addPage([A4.w, A4.h]);
  renderPage1(p1, submission, fonts, { logoImage });

  const p2 = pdfDoc.addPage([A4.w, A4.h]);
  renderPage2(p2, fonts, { logoImage });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  return { blob, url };
}
