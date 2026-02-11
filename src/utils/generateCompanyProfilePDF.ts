import jsPDF from 'jspdf';

// ──────────────────────────────────────────────
// ASH Holding – Professional Company Profile PDF
// Multi-page, modern corporate tech design
// ──────────────────────────────────────────────

const COLORS = {
  primary: [22, 78, 159] as [number, number, number],       // #164E9F
  primaryLight: [56, 132, 244] as [number, number, number], // #3884F4
  accent: [0, 210, 211] as [number, number, number],        // #00D2D3
  dark: [15, 23, 42] as [number, number, number],           // #0F172A
  darkCard: [30, 41, 59] as [number, number, number],       // #1E293B
  gray: [100, 116, 139] as [number, number, number],        // #64748B
  grayLight: [148, 163, 184] as [number, number, number],   // #94A3B8
  white: [255, 255, 255] as [number, number, number],
  purple: [124, 58, 237] as [number, number, number],       // #7C3AED
  gradEnd: [30, 58, 138] as [number, number, number],       // #1E3A8A
};

const W = 210; // A4 width mm
const H = 297; // A4 height mm
const M = 20;  // margin

// ─── Helper: draw gradient-like background ───
function drawDarkBg(pdf: jsPDF) {
  pdf.setFillColor(...COLORS.dark);
  pdf.rect(0, 0, W, H, 'F');
  // subtle gradient band
  pdf.setFillColor(20, 30, 60);
  pdf.rect(0, 0, W, H * 0.4, 'F');
}

// ─── Helper: draw section header ───
function drawSectionHeader(pdf: jsPDF, title: string, y: number, icon?: string): number {
  // Accent line
  pdf.setFillColor(...COLORS.accent);
  pdf.rect(W - M - 3, y, 3, 22, 'F');

  // Title
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(...COLORS.white);
  pdf.text(title, W - M - 10, y + 15, { align: 'right' });

  if (icon) {
    pdf.setFontSize(18);
    pdf.text(icon, W - M - 10 - pdf.getTextWidth(title) - 5, y + 15, { align: 'right' });
  }

  return y + 32;
}

// ─── Helper: draw a card ───
function drawCard(pdf: jsPDF, x: number, y: number, w: number, h: number) {
  pdf.setFillColor(...COLORS.darkCard);
  pdf.roundedRect(x, y, w, h, 4, 4, 'F');
  // subtle border
  pdf.setDrawColor(50, 70, 100);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, w, h, 4, 4, 'S');
}

// ─── Helper: draw circle icon ───
function drawCircleIcon(pdf: jsPDF, x: number, y: number, emoji: string, color: [number, number, number]) {
  pdf.setFillColor(...color);
  pdf.circle(x, y, 8, 'F');
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.white);
  pdf.text(emoji, x, y + 1, { align: 'center' });
}

// ─── Helper: text wrap ───
function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    if (pdf.getTextWidth(testLine) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ═══════════════════════════════════════
// PAGE 1: COVER
// ═══════════════════════════════════════
function drawCoverPage(pdf: jsPDF) {
  // Background
  pdf.setFillColor(...COLORS.dark);
  pdf.rect(0, 0, W, H, 'F');

  // Top gradient band
  pdf.setFillColor(15, 30, 70);
  pdf.rect(0, 0, W, 130, 'F');

  // Decorative geometric shapes
  pdf.setFillColor(22, 78, 159);
  pdf.setGState(pdf.GState({ opacity: 0.15 }));
  pdf.circle(30, 40, 60, 'F');
  pdf.circle(190, 100, 45, 'F');
  pdf.circle(50, 250, 35, 'F');

  // Abstract tech lines
  pdf.setDrawColor(0, 210, 211);
  pdf.setGState(pdf.GState({ opacity: 0.12 }));
  pdf.setLineWidth(0.5);
  for (let i = 0; i < 8; i++) {
    pdf.line(0, 60 + i * 25, W, 80 + i * 20);
  }

  // Diamond shapes
  pdf.setFillColor(...COLORS.purple);
  pdf.setGState(pdf.GState({ opacity: 0.08 }));
  const diamondPoints = [
    { x: 170, y: 50 }, { x: 40, y: 200 }, { x: 180, y: 230 }
  ];
  diamondPoints.forEach(p => {
    const s = 12;
    pdf.triangle(p.x, p.y - s, p.x + s, p.y, p.x, p.y + s, 'F');
  });

  pdf.setGState(pdf.GState({ opacity: 1 }));

  // Company name
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(52);
  pdf.setTextColor(...COLORS.accent);
  pdf.text('ASH Holding', W / 2, 115, { align: 'center' });

  // Tagline
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(16);
  pdf.setTextColor(...COLORS.grayLight);
  const tagline = '\u0646\u062D\u0648 \u062D\u0644\u0648\u0644 \u0631\u0642\u0645\u064A\u0629 \u0630\u0643\u064A\u0629 \u0644\u0646\u0645\u0648 \u0623\u0639\u0645\u0627\u0644\u0643';
  pdf.text(tagline, W / 2, 140, { align: 'center' });

  // Decorative line
  pdf.setFillColor(...COLORS.accent);
  pdf.rect(W / 2 - 30, 150, 60, 1.5, 'F');

  // Bottom decorative bar
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, H - 12, W, 12, 'F');
  pdf.setFillColor(...COLORS.accent);
  pdf.rect(0, H - 12, W * 0.4, 12, 'F');

  // Year
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.white);
  pdf.text(new Date().getFullYear().toString(), W / 2, H - 20, { align: 'center' });

  // "Company Profile" label
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.grayLight);
  pdf.text('Company Profile', W / 2, 170, { align: 'center' });

  // Arabic subtitle
  pdf.setFontSize(13);
  const subtitle = '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062A\u0639\u0631\u064A\u0641\u064A \u0644\u0644\u0634\u0631\u0643\u0629';
  pdf.text(subtitle, W / 2, 183, { align: 'center' });
}

// ═══════════════════════════════════════
// PAGE 2: ABOUT US
// ═══════════════════════════════════════
function drawAboutPage(pdf: jsPDF) {
  drawDarkBg(pdf);

  let y = 30;

  // Page title
  y = drawSectionHeader(pdf, '\u0645\u0646 \u0646\u062D\u0646', y);

  // Main about card
  drawCard(pdf, M, y, W - 2 * M, 70);

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.grayLight);

  const aboutText = 'ASH Holding \u0634\u0631\u0643\u0629 \u062A\u0642\u0646\u064A\u0629 \u0633\u0639\u0648\u062F\u064A\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u062A\u0642\u062F\u064A\u0645 \u062D\u0644\u0648\u0644 \u0631\u0642\u0645\u064A\u0629 \u0634\u0627\u0645\u0644\u0629 \u062A\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0631\u0627\u062F \u0639\u0644\u0649 \u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A \u0648\u062A\u062D\u0642\u064A\u0642 \u0627\u0644\u0646\u0645\u0648 \u0627\u0644\u0645\u0633\u062A\u062F\u0627\u0645.';
  const aboutLines = wrapText(pdf, aboutText, W - 2 * M - 16);
  aboutLines.forEach((line, i) => {
    pdf.text(line, W - M - 8, y + 18 + i * 7, { align: 'right' });
  });

  const aboutText2 = '\u0646\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062E\u0628\u0631\u0629 \u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0627\u0644\u0639\u0645\u064A\u0642\u0629 \u0648\u0627\u0644\u0631\u0624\u064A\u0629 \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0644\u0646\u0642\u062F\u0645 \u0646\u062A\u0627\u0626\u062C \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u062A\u062A\u062C\u0627\u0648\u0632 \u062A\u0648\u0642\u0639\u0627\u062A \u0639\u0645\u0644\u0627\u0626\u0646\u0627. \u0641\u0631\u064A\u0642\u0646\u0627 \u0627\u0644\u0645\u062A\u062E\u0635\u0635 \u064A\u0639\u0645\u0644 \u0628\u062C\u062F \u0644\u0636\u0645\u0627\u0646 \u0623\u0646 \u0643\u0644 \u0645\u0634\u0631\u0648\u0639 \u064A\u062D\u0642\u0642 \u0623\u0647\u062F\u0627\u0641\u0647 \u0628\u0623\u0639\u0644\u0649 \u0645\u0639\u0627\u064A\u064A\u0631 \u0627\u0644\u062C\u0648\u062F\u0629.';
  const aboutLines2 = wrapText(pdf, aboutText2, W - 2 * M - 16);
  aboutLines2.forEach((line, i) => {
    pdf.text(line, W - M - 8, y + 42 + i * 7, { align: 'right' });
  });

  y += 85;

  // Vision & Mission cards
  const cardW = (W - 2 * M - 10) / 2;

  // Vision
  drawCard(pdf, M, y, cardW, 55);
  pdf.setFillColor(...COLORS.accent);
  pdf.circle(M + cardW - 14, y + 14, 6, 'F');
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.white);
  pdf.text('\u0631\u0624\u064A\u062A\u0646\u0627', M + cardW - 8, y + 16, { align: 'right' });
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.grayLight);
  const visionText = '\u0623\u0646 \u0646\u0643\u0648\u0646 \u0627\u0644\u0634\u0631\u064A\u0643 \u0627\u0644\u0631\u0642\u0645\u064A \u0627\u0644\u0623\u0648\u0644 \u0644\u0644\u0634\u0631\u0643\u0627\u062A \u0641\u064A \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629';
  const vLines = wrapText(pdf, visionText, cardW - 16);
  vLines.forEach((line, i) => {
    pdf.text(line, M + cardW - 8, y + 30 + i * 6, { align: 'right' });
  });

  // Mission
  drawCard(pdf, M + cardW + 10, y, cardW, 55);
  pdf.setFillColor(...COLORS.primary);
  pdf.circle(M + 2 * cardW + 10 - 14, y + 14, 6, 'F');
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...COLORS.white);
  pdf.text('\u0631\u0633\u0627\u0644\u062A\u0646\u0627', M + 2 * cardW + 10 - 8, y + 16, { align: 'right' });
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.grayLight);
  const missionText = '\u062A\u0642\u062F\u064A\u0645 \u062D\u0644\u0648\u0644 \u0631\u0642\u0645\u064A\u0629 \u0645\u0628\u062A\u0643\u0631\u0629 \u062A\u062D\u0642\u0642 \u0627\u0644\u062A\u0645\u064A\u0632 \u0648\u0627\u0644\u0646\u0645\u0648 \u0644\u0639\u0645\u0644\u0627\u0626\u0646\u0627';
  const mLines = wrapText(pdf, missionText, cardW - 16);
  mLines.forEach((line, i) => {
    pdf.text(line, M + 2 * cardW + 10 - 8, y + 30 + i * 6, { align: 'right' });
  });

  y += 70;

  // Stats row
  const stats = [
    { num: '+500', label: '\u0639\u0645\u064A\u0644' },
    { num: '+200', label: '\u0645\u0634\u0631\u0648\u0639' },
    { num: '+50', label: '\u062E\u062F\u0645\u0629' },
    { num: '24/7', label: '\u062F\u0639\u0645' },
  ];
  const statW = (W - 2 * M - 30) / 4;
  stats.forEach((s, i) => {
    const sx = M + i * (statW + 10);
    drawCard(pdf, sx, y, statW, 40);
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(...COLORS.accent);
    pdf.text(s.num, sx + statW / 2, y + 18, { align: 'center' });
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.grayLight);
    pdf.text(s.label, sx + statW / 2, y + 30, { align: 'center' });
  });

  // Bottom bar
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, H - 6, W, 6, 'F');
}

// ═══════════════════════════════════════
// PAGE 3: SERVICES
// ═══════════════════════════════════════
function drawServicesPage(pdf: jsPDF) {
  drawDarkBg(pdf);

  let y = 30;
  y = drawSectionHeader(pdf, '\u062E\u062F\u0645\u0627\u062A\u0646\u0627', y);

  const services = [
    {
      title: '\u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0646\u0638\u0645\u0629',
      color: COLORS.primary,
      items: ['ERP / CRM', '\u0623\u0646\u0638\u0645\u0629 \u0645\u062D\u0627\u0633\u0628\u064A\u0629', '\u062D\u0644\u0648\u0644 \u0645\u062E\u0635\u0635\u0629', '\u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0623\u0639\u0645\u0627\u0644'],
    },
    {
      title: '\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A',
      color: COLORS.accent,
      items: ['\u0645\u0648\u0627\u0642\u0639 \u0634\u0631\u0643\u0627\u062A', '\u0645\u062A\u0627\u062C\u0631 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629', '\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u064A\u0628 \u0648\u062C\u0648\u0627\u0644'],
    },
    {
      title: '\u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0648\u0627\u0644\u0647\u0648\u064A\u0629',
      color: COLORS.purple,
      items: ['UI/UX', '\u0647\u0648\u064A\u0629 \u0628\u0635\u0631\u064A\u0629', '\u062A\u0635\u0627\u0645\u064A\u0645 \u0631\u0642\u0645\u064A\u0629'],
    },
    {
      title: '\u0627\u0644\u062A\u0633\u0648\u064A\u0642 \u0627\u0644\u0631\u0642\u0645\u064A',
      color: [234, 88, 12] as [number, number, number],
      items: ['\u062D\u0645\u0644\u0627\u062A \u0625\u0639\u0644\u0627\u0646\u064A\u0629', 'SEO', '\u0625\u062F\u0627\u0631\u0629 \u0645\u0646\u0635\u0627\u062A \u0627\u0644\u062A\u0648\u0627\u0635\u0644'],
    },
  ];

  const cardW = (W - 2 * M - 10) / 2;
  const cardH = 75;

  services.forEach((svc, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (cardW + 10);
    const cy = y + row * (cardH + 10);

    drawCard(pdf, x, cy, cardW, cardH);

    // Color accent bar
    pdf.setFillColor(...svc.color);
    pdf.rect(x + cardW - 3, cy + 8, 3, 20, 'F');

    // Title
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...COLORS.white);
    pdf.text(svc.title, x + cardW - 10, cy + 18, { align: 'right' });

    // Items
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.grayLight);
    svc.items.forEach((item, j) => {
      // Bullet
      pdf.setFillColor(...svc.color);
      pdf.circle(x + cardW - 14, cy + 32 + j * 10, 1.5, 'F');
      pdf.text(item, x + cardW - 18, cy + 34 + j * 10, { align: 'right' });
    });
  });

  // Bottom bar
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, H - 6, W, 6, 'F');
}

// ═══════════════════════════════════════
// PAGE 4: TECHNOLOGIES
// ═══════════════════════════════════════
function drawTechPage(pdf: jsPDF) {
  drawDarkBg(pdf);

  let y = 30;
  y = drawSectionHeader(pdf, '\u0627\u0644\u062A\u0642\u0646\u064A\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629', y);

  const techs = [
    { name: 'React / Next.js', desc: '\u0648\u0627\u062C\u0647\u0627\u062A \u0645\u0633\u062A\u062E\u062F\u0645 \u062D\u062F\u064A\u062B\u0629', color: COLORS.accent },
    { name: 'Laravel / PHP', desc: '\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u062E\u0627\u062F\u0645 \u0648\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A', color: COLORS.primary },
    { name: 'Python', desc: '\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u062A\u0645\u062A\u0629', color: [234, 179, 8] as [number, number, number] },
    { name: 'Cloud Services', desc: '\u062E\u062F\u0645\u0627\u062A \u0633\u062D\u0627\u0628\u064A\u0629 \u0645\u062A\u0642\u062F\u0645\u0629', color: COLORS.purple },
    { name: 'APIs & Integrations', desc: '\u0631\u0628\u0637 \u0627\u0644\u0623\u0646\u0638\u0645\u0629 \u0648\u0627\u0644\u062E\u062F\u0645\u0627\u062A', color: [16, 185, 129] as [number, number, number] },
    { name: 'Google Analytics 4', desc: '\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0627\u0621', color: [239, 68, 68] as [number, number, number] },
    { name: 'Meta & Ads Platforms', desc: '\u0645\u0646\u0635\u0627\u062A \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629', color: COLORS.primaryLight },
    { name: 'TypeScript', desc: '\u0628\u0631\u0645\u062C\u0629 \u0622\u0645\u0646\u0629 \u0648\u0645\u0648\u062B\u0648\u0642\u0629', color: [59, 130, 246] as [number, number, number] },
  ];

  const cols = 2;
  const cardW = (W - 2 * M - 10) / cols;
  const cardH = 40;

  techs.forEach((tech, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cardW + 10);
    const cy = y + row * (cardH + 8);

    drawCard(pdf, x, cy, cardW, cardH);

    // Color dot
    pdf.setFillColor(...tech.color);
    pdf.circle(x + cardW - 12, cy + 14, 4, 'F');

    // Tech name
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.white);
    pdf.text(tech.name, x + cardW - 20, cy + 16, { align: 'right' });

    // Description
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.grayLight);
    pdf.text(tech.desc, x + cardW - 12, cy + 30, { align: 'right' });
  });

  y += Math.ceil(techs.length / cols) * (cardH + 8) + 15;

  // Why ASH Holding section
  y = drawSectionHeader(pdf, '\u0644\u0645\u0627\u0630\u0627 ASH Holding\u061F', y);

  const advantages = [
    { title: '\u062D\u0644\u0648\u0644 \u0645\u062E\u0635\u0635\u0629', desc: '\u0646\u0635\u0645\u0645 \u062D\u0644\u0648\u0644\u0627\u064B \u0641\u0631\u064A\u062F\u0629 \u062A\u0646\u0627\u0633\u0628 \u0637\u0628\u064A\u0639\u0629 \u0639\u0645\u0644\u0643', color: COLORS.accent },
    { title: '\u0645\u0639\u0627\u064A\u064A\u0631 \u0639\u0627\u0644\u0645\u064A\u0629', desc: '\u0646\u0644\u062A\u0632\u0645 \u0628\u0623\u0641\u0636\u0644 \u0627\u0644\u0645\u0645\u0627\u0631\u0633\u0627\u062A \u0627\u0644\u062F\u0648\u0644\u064A\u0629', color: COLORS.primary },
    { title: '\u0641\u0631\u064A\u0642 \u0645\u062D\u062A\u0631\u0641', desc: '\u062E\u0628\u0631\u0627\u0621 \u0645\u062A\u062E\u0635\u0635\u0648\u0646 \u0641\u064A \u0645\u062E\u062A\u0644\u0641 \u0627\u0644\u0645\u062C\u0627\u0644\u0627\u062A', color: COLORS.purple },
    { title: '\u062F\u0639\u0645 \u0645\u0633\u062A\u0645\u0631', desc: '\u062F\u0639\u0645 \u0641\u0646\u064A \u0645\u062A\u0648\u0627\u0635\u0644 24/7', color: [234, 88, 12] as [number, number, number] },
  ];

  const advW = (W - 2 * M - 10) / 2;
  const advH = 45;

  advantages.forEach((adv, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = M + col * (advW + 10);
    const cy = y + row * (advH + 8);

    drawCard(pdf, x, cy, advW, advH);

    // Accent dot
    pdf.setFillColor(...adv.color);
    pdf.circle(x + advW - 12, cy + 14, 4, 'F');

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.white);
    pdf.text(adv.title, x + advW - 20, cy + 16, { align: 'right' });

    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.grayLight);
    pdf.text(adv.desc, x + advW - 12, cy + 30, { align: 'right' });
  });

  // Bottom bar
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, H - 6, W, 6, 'F');
}

// ═══════════════════════════════════════
// PAGE 5: SECTORS & CONTACT
// ═══════════════════════════════════════
function drawSectorsAndContactPage(pdf: jsPDF) {
  drawDarkBg(pdf);

  let y = 30;
  y = drawSectionHeader(pdf, '\u0627\u0644\u0642\u0637\u0627\u0639\u0627\u062A \u0627\u0644\u062A\u064A \u0646\u062E\u062F\u0645\u0647\u0627', y);

  const sectors = [
    { name: '\u0634\u0631\u0643\u0627\u062A', color: COLORS.primary },
    { name: '\u0645\u062A\u0627\u062C\u0631', color: COLORS.accent },
    { name: '\u0631\u0648\u0627\u062F \u0623\u0639\u0645\u0627\u0644', color: COLORS.purple },
    { name: '\u0645\u0624\u0633\u0633\u0627\u062A', color: [234, 88, 12] as [number, number, number] },
    { name: '\u0634\u0631\u0643\u0627\u062A \u062A\u0642\u0646\u064A\u0629', color: [16, 185, 129] as [number, number, number] },
  ];

  const sectorW = (W - 2 * M - 40) / 5;
  sectors.forEach((sec, i) => {
    const x = M + i * (sectorW + 10);
    drawCard(pdf, x, y, sectorW, 50);

    // Circle icon
    pdf.setFillColor(...sec.color);
    pdf.circle(x + sectorW / 2, y + 18, 8, 'F');

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.white);
    pdf.text(sec.name, x + sectorW / 2, y + 40, { align: 'center' });
  });

  y += 75;

  // Contact section
  y = drawSectionHeader(pdf, '\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627', y);

  drawCard(pdf, M, y, W - 2 * M, 80);

  // CTA
  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...COLORS.accent);
  const cta = '\u0627\u0628\u062F\u0623 \u0645\u0634\u0631\u0648\u0639\u0643 \u0627\u0644\u0631\u0642\u0645\u064A \u0645\u0639\u0646\u0627 \u0627\u0644\u064A\u0648\u0645';
  pdf.text(cta, W / 2, y + 20, { align: 'center' });

  // Divider
  pdf.setFillColor(...COLORS.accent);
  pdf.rect(W / 2 - 25, y + 28, 50, 1, 'F');

  // Contact details
  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(...COLORS.grayLight);

  const contacts = [
    '\u0627\u0644\u0645\u0648\u0642\u0639: ash-holding.sa',
    '\u0627\u0644\u0628\u0631\u064A\u062F: info@ash-holding.sa',
    '\u0627\u0644\u062F\u0639\u0645: support@ash-holding.sa',
    '\u0627\u0644\u0647\u0627\u062A\u0641: 0555812567',
  ];

  contacts.forEach((c, i) => {
    pdf.text(c, W / 2, y + 42 + i * 10, { align: 'center' });
  });

  // Bottom large decorative block
  y += 100;

  // Footer
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, H - 40, W, 40, 'F');
  pdf.setFillColor(...COLORS.accent);
  pdf.rect(0, H - 40, W * 0.35, 40, 'F');

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(...COLORS.white);
  pdf.text('ASH Holding', W / 2, H - 22, { align: 'center' });

  pdf.setFont('Helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`\u00A9 ${new Date().getFullYear()} - \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629`, W / 2, H - 10, { align: 'center' });
}

// ═══════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════
export const generateCompanyProfilePDF = async () => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  // Page 1: Cover
  drawCoverPage(pdf);

  // Page 2: About
  pdf.addPage();
  drawAboutPage(pdf);

  // Page 3: Services
  pdf.addPage();
  drawServicesPage(pdf);

  // Page 4: Technologies + Why Us
  pdf.addPage();
  drawTechPage(pdf);

  // Page 5: Sectors + Contact
  pdf.addPage();
  drawSectorsAndContactPage(pdf);

  // Add page numbers
  const totalPages = pdf.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('Helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.grayLight);
    pdf.text(`${i} / ${totalPages}`, W / 2, H - 2, { align: 'center' });
  }

  pdf.save('ASH-Holding-Company-Profile.pdf');
};
