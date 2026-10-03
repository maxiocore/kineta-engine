import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ──────────────────────────────────────────────
// ASH Holding – Premium Company Profile PDF
// Light theme, rich content, 10 pages
// ──────────────────────────────────────────────

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

// Brand colors
const C = {
  primary: '#0891b2',
  primaryLight: '#06b6d4',
  primaryBg: '#ecfeff',
  accent: '#1e40af',
  accentLight: '#3b82f6',
  purple: '#7c3aed',
  purpleLight: '#a78bfa',
  orange: '#ea580c',
  green: '#059669',
  greenLight: '#10b981',
  red: '#dc2626',
  gold: '#d97706',
  bg: '#ffffff',
  bgSoft: '#f8fafc',
  bgCard: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: '#0f172a',
  textMd: '#334155',
  textLight: '#64748b',
  textMuted: '#94a3b8',
};

// ─── SVG ICONS ───
const ICONS = {
  building: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  target: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  rocket: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`,
  code: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  globe: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  palette: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  megaphone: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  shield: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  headphones: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  star: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  settings: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  zap: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  phone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mail: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  mapPin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  briefcase: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  store: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>`,
  lightbulb: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  cpu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  award: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  wallet: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
  creditCard: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
  barChart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>`,
  clock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  layers: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  database: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`,
  lock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  smartphone: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>`,
  trendingUp: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  fileText: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
  handshake: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`,
};

function icon(name: keyof typeof ICONS, color: string, size = 22): string {
  return `<div style="color:${color};width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ICONS[name]}</div>`;
}

function createPage(): HTMLDivElement {
  const page = document.createElement('div');
  page.style.cssText = `
    width:794px;height:1123px;background:${C.bg};
    direction:rtl;text-align:right;
    font-family:'IBM Plex Sans Arabic','Cairo','Tajawal',sans-serif;
    color:${C.text};position:relative;overflow:hidden;box-sizing:border-box;
  `;
  return page;
}

function pageFooter(num: number, total: number): string {
  return `
    <div style="position:absolute;bottom:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,${C.primary},${C.accent},${C.purple});"></div>
    <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:10px;color:${C.textMuted};">${num} / ${total}</div>
    <div style="position:absolute;bottom:12px;right:30px;font-size:9px;color:${C.textMuted};letter-spacing:1px;">ASH Holding</div>
  `;
}

function header(title: string, iconName: keyof typeof ICONS, color = C.primary): string {
  return `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:28px;">
      <div style="width:48px;height:48px;border-radius:14px;background:${color}12;border:2px solid ${color}25;display:flex;align-items:center;justify-content:center;">
        ${icon(iconName, color)}
      </div>
      <div>
        <div style="font-size:24px;font-weight:700;color:${C.text};">${title}</div>
        <div style="width:45px;height:3px;background:linear-gradient(90deg,${color},${color}50);border-radius:2px;margin-top:5px;"></div>
      </div>
    </div>
  `;
}

const TOTAL = 9;

// ─── PAGE 1: COVER ───
function buildCover(): HTMLDivElement {
  const page = createPage();
  page.style.background = `linear-gradient(160deg, #f0f9ff 0%, #ffffff 40%, #f8fafc 100%)`;

  page.innerHTML = `
    <!-- Decorative -->
    <div style="position:absolute;top:-120px;right:-120px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${C.primary}12,transparent 70%);"></div>
    <div style="position:absolute;bottom:100px;left:-100px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,${C.accent}08,transparent 70%);"></div>
    <div style="position:absolute;top:40%;left:50%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,${C.purple}05,transparent 60%);transform:translate(-50%,-50%);"></div>

    <!-- Corner accents -->
    <div style="position:absolute;top:30px;right:30px;width:70px;height:70px;border-top:3px solid ${C.primary}30;border-right:3px solid ${C.primary}30;border-radius:0 16px 0 0;"></div>
    <div style="position:absolute;bottom:50px;left:30px;width:70px;height:70px;border-bottom:3px solid ${C.accent}30;border-left:3px solid ${C.accent}30;border-radius:0 0 0 16px;"></div>

    <!-- Content -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;position:relative;z-index:2;">
      
      <!-- Badge -->
      <div style="background:${C.primaryBg};border:1px solid ${C.primary}30;border-radius:50px;padding:10px 30px;margin-bottom:45px;display:flex;align-items:center;gap:10px;">
        ${icon('star', C.primary, 18)}
        <span style="font-size:13px;color:${C.primary};letter-spacing:1.5px;font-weight:600;">COMPANY PROFILE ${new Date().getFullYear()}</span>
      </div>

      <!-- Logo container -->
      <div style="width:110px;height:110px;border-radius:28px;background:linear-gradient(135deg,${C.primary}15,${C.accent}10);border:2px solid ${C.primary}20;display:flex;align-items:center;justify-content:center;margin-bottom:35px;box-shadow:0 20px 60px ${C.primary}15;">
        ${icon('building', C.primary, 28)}
      </div>

      <!-- Company name -->
      <div style="font-size:64px;font-weight:800;background:linear-gradient(135deg,${C.primary},${C.accent});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:4px;margin-bottom:12px;text-align:center;">
        ASH Holding
      </div>

      <!-- English subtitle -->
      <div style="font-size:14px;color:${C.textMuted};letter-spacing:3px;margin-bottom:25px;text-transform:uppercase;">
        Digital Solutions & Technology
      </div>

      <!-- Divider -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <div style="width:80px;height:1.5px;background:linear-gradient(90deg,transparent,${C.primary});"></div>
        <div style="width:8px;height:8px;border-radius:50%;background:${C.primary};"></div>
        <div style="width:80px;height:1.5px;background:linear-gradient(90deg,${C.primary},transparent);"></div>
      </div>

      <!-- Arabic tagline -->
      <div style="font-size:24px;font-weight:600;color:${C.text};text-align:center;line-height:1.9;margin-bottom:10px;">
        شريكك الرقمي نحو النمو والابتكار
      </div>
      <div style="font-size:15px;color:${C.textLight};text-align:center;margin-bottom:45px;max-width:480px;line-height:1.9;">
        نقدم حلولاً رقمية متكاملة تجمع بين التقنية والإبداع والتمويل لتحقيق رؤيتك
      </div>

      <!-- Feature pills -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:40px;">
        ${[
          { ic: 'code' as const, text: 'تطوير برمجي', cl: C.primary },
          { ic: 'palette' as const, text: 'تصميم إبداعي', cl: C.purple },
          { ic: 'megaphone' as const, text: 'تسويق رقمي', cl: C.orange },
          { ic: 'wallet' as const, text: 'تمويل مرن', cl: C.green },
        ].map(f => `
          <div style="background:${f.cl}08;border:1.5px solid ${f.cl}20;border-radius:50px;padding:10px 22px;display:flex;align-items:center;gap:8px;">
            ${icon(f.ic, f.cl, 18)}
            <span style="font-size:12.5px;color:${C.textMd};font-weight:500;">${f.text}</span>
          </div>
        `).join('')}
      </div>

      <!-- Location -->
      <div style="display:flex;align-items:center;gap:8px;">
        ${icon('mapPin', C.textMuted, 16)}
        <span style="font-size:13px;color:${C.textMuted};">المملكة العربية السعودية</span>
      </div>
    </div>

    <div style="position:absolute;bottom:0;left:0;width:100%;height:6px;background:linear-gradient(90deg,${C.primary},${C.accent},${C.purple},${C.accent},${C.primary});"></div>
  `;
  return page;
}

// ─── PAGE 2: ABOUT US ───
function buildAbout(): HTMLDivElement {
  const page = createPage();
  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('من نحن', 'building')}

      <div style="background:${C.bgSoft};border:1.5px solid ${C.border};border-radius:16px;padding:26px;margin-bottom:22px;">
        <div style="font-size:14.5px;line-height:2.3;color:${C.textMd};">
          <p style="margin:0 0 12px;">شركة <strong style="color:${C.primary};">ASH Holding</strong> هي شركة تقنية سعودية رائدة تأسست عام <strong style="color:${C.text};">2020</strong>، متخصصة في تقديم حلول رقمية شاملة ومبتكرة. نساعد المؤسسات والأفراد والشركات الناشئة على التحول الرقمي وتحقيق النمو المستدام من خلال أحدث التقنيات العالمية.</p>
          <p style="margin:0 0 12px;">نجمع بين الخبرة التقنية العميقة والرؤية الإبداعية لنقدم نتائج استثنائية. فريقنا المتخصص من المطورين والمصممين والمسوّقين يعمل بشغف لضمان تحقيق كل مشروع لأهدافه بأعلى معايير الجودة والاحترافية.</p>
          <p style="margin:0;">نؤمن بأن التكنولوجيا هي المحرك الأساسي للنمو، ونسعى دائماً لنكون في طليعة الابتكار الرقمي في المنطقة العربية.</p>
        </div>
      </div>

      <!-- Vision & Mission -->
      <div style="display:flex;gap:14px;margin-bottom:22px;">
        <div style="flex:1;background:${C.primaryBg};border:1.5px solid ${C.primary}20;border-radius:16px;padding:22px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            ${icon('target', C.primary)}
            <div style="font-size:17px;font-weight:700;color:${C.text};">رؤيتنا</div>
          </div>
          <div style="font-size:13px;line-height:2.1;color:${C.textMd};">
            أن نكون الشريك الرقمي الأول والأكثر موثوقية في المنطقة العربية، ونقود التحول الرقمي بحلول مبتكرة تسهم في بناء اقتصاد رقمي مزدهر يتوافق مع رؤية المملكة 2030.
          </div>
        </div>
        <div style="flex:1;background:#eff6ff;border:1.5px solid ${C.accent}15;border-radius:16px;padding:22px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            ${icon('rocket', C.accent)}
            <div style="font-size:17px;font-weight:700;color:${C.text};">رسالتنا</div>
          </div>
          <div style="font-size:13px;line-height:2.1;color:${C.textMd};">
            تمكين عملائنا من تحقيق أقصى إمكاناتهم الرقمية عبر تقديم خدمات تقنية عالية الجودة وحلول تمويلية مرنة، مدعومة بالابتكار المستمر والدعم الفني المتواصل.
          </div>
        </div>
      </div>

      <!-- Values -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.border};border-radius:16px;padding:20px;margin-bottom:22px;">
        <div style="font-size:15px;font-weight:700;color:${C.text};margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          ${icon('award', C.purple, 20)}
          قيمنا الأساسية
        </div>
        <div style="display:flex;gap:10px;">
          ${[
            { t: 'الجودة والتميز', d: 'معايير عالمية في كل مشروع', c: C.primary },
            { t: 'الابتكار المستمر', d: 'أحدث التقنيات والحلول', c: C.accent },
            { t: 'الشفافية والثقة', d: 'تواصل واضح ومستمر', c: C.purple },
            { t: 'الشراكة الحقيقية', d: 'نجاحكم هو نجاحنا', c: C.orange },
          ].map(v => `
            <div style="flex:1;text-align:center;padding:8px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${v.c};margin:0 auto 8px;"></div>
              <div style="font-size:12.5px;font-weight:600;color:${C.text};margin-bottom:3px;">${v.t}</div>
              <div style="font-size:10.5px;color:${C.textLight};line-height:1.5;">${v.d}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:12px;">
        ${[
          { n: '+500', l: 'عميل سعيد', ic: 'users' as const, c: C.primary },
          { n: '+200', l: 'مشروع منجز', ic: 'briefcase' as const, c: C.accent },
          { n: '+50', l: 'خدمة رقمية', ic: 'zap' as const, c: C.purple },
          { n: '24/7', l: 'دعم متواصل', ic: 'headphones' as const, c: C.orange },
          { n: '+5', l: 'سنوات خبرة', ic: 'award' as const, c: C.green },
        ].map(s => `
          <div style="flex:1;background:${s.c}06;border:1.5px solid ${s.c}15;border-radius:14px;padding:16px 8px;text-align:center;">
            <div style="margin:0 auto 6px;display:flex;justify-content:center;">${icon(s.ic, s.c, 20)}</div>
            <div style="font-size:22px;font-weight:700;color:${s.c};margin-bottom:3px;">${s.n}</div>
            <div style="font-size:10px;color:${C.textLight};">${s.l}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ${pageFooter(2, TOTAL)}
  `;
  return page;
}

// ─── PAGE 3: SERVICES (Software & Web) ───
function buildServices1(): HTMLDivElement {
  const page = createPage();
  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('خدماتنا — البرمجيات والمواقع', 'code')}

      <!-- Software -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.accent}15;border-radius:18px;padding:26px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <div style="width:44px;height:44px;border-radius:12px;background:${C.accent}10;border:1.5px solid ${C.accent}20;display:flex;align-items:center;justify-content:center;">
            ${icon('code', C.accent)}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:${C.text};">البرمجيات والأنظمة المتكاملة</div>
            <div style="font-size:12px;color:${C.textLight};margin-top:2px;">حلول تقنية ذكية لإدارة وتشغيل أعمالك</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          ${[
            'أنظمة ERP / CRM متكاملة للشركات',
            'أنظمة محاسبية ومالية متقدمة',
            'أنظمة إدارة الموارد البشرية HR',
            'أنظمة نقاط البيع POS',
            'حلول برمجية مخصصة بالكامل',
            'أتمتة العمليات والإجراءات الداخلية',
            'لوحات تحكم وتقارير تفاعلية',
            'ربط وتكامل الأنظمة APIs',
          ].map(item => `
            <div style="width:calc(50% - 5px);display:flex;align-items:center;gap:7px;padding:8px 12px;background:white;border:1px solid ${C.border};border-radius:10px;">
              <div style="color:${C.accent};">${ICONS.check}</div>
              <span style="font-size:12px;color:${C.textMd};">${item}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Web & Apps -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.primary}15;border-radius:18px;padding:26px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <div style="width:44px;height:44px;border-radius:12px;background:${C.primary}10;border:1.5px solid ${C.primary}20;display:flex;align-items:center;justify-content:center;">
            ${icon('globe', C.primary)}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:${C.text};">المواقع والتطبيقات</div>
            <div style="font-size:12px;color:${C.textLight};margin-top:2px;">تواجد رقمي قوي واحترافي على كل المنصات</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          ${[
            'مواقع شركات احترافية متجاوبة',
            'متاجر إلكترونية متكاملة',
            'تطبيقات ويب حديثة SPA / PWA',
            'تطبيقات جوال iOS و Android',
            'صفحات هبوط تسويقية Landing Pages',
            'بوابات عملاء ولوحات إدارة',
            'منصات تعليمية إلكترونية',
            'مواقع حجز مواعيد متقدمة',
          ].map(item => `
            <div style="width:calc(50% - 5px);display:flex;align-items:center;gap:7px;padding:8px 12px;background:white;border:1px solid ${C.border};border-radius:10px;">
              <div style="color:${C.primary};">${ICONS.check}</div>
              <span style="font-size:12px;color:${C.textMd};">${item}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Highlight -->
      <div style="background:linear-gradient(135deg,${C.primary}06,${C.accent}06);border:1.5px solid ${C.primary}12;border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;">
        ${icon('lightbulb', C.primary)}
        <div style="font-size:13px;color:${C.textMd};line-height:1.8;">
          جميع حلولنا البرمجية مبنية بتقنيات حديثة وقابلة للتوسع، مع ضمان كامل ودعم فني متواصل بعد التسليم.
        </div>
      </div>
    </div>
    ${pageFooter(3, TOTAL)}
  `;
  return page;
}

// ─── PAGE 4: SERVICES (Design & Marketing) ───
function buildServices2(): HTMLDivElement {
  const page = createPage();
  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('خدماتنا — التصميم والتسويق', 'palette')}

      <!-- Design -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.purple}15;border-radius:18px;padding:26px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <div style="width:44px;height:44px;border-radius:12px;background:${C.purple}10;border:1.5px solid ${C.purple}20;display:flex;align-items:center;justify-content:center;">
            ${icon('palette', C.purple)}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:${C.text};">التصميم والهوية البصرية</div>
            <div style="font-size:12px;color:${C.textLight};margin-top:2px;">هوية بصرية متكاملة تعكس تميز علامتك التجارية</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          ${[
            'تصميم واجهات المستخدم UI/UX',
            'هوية بصرية كاملة ودليل العلامة',
            'تصميم شعارات احترافية',
            'تصاميم سوشال ميديا شهرية',
            'موشن جرافيك وفيديوهات ترويجية',
            'عروض تقديمية Presentations',
            'تصميم مطبوعات وكروت أعمال',
            'تصاميم إعلانية ولافتات',
          ].map(item => `
            <div style="width:calc(50% - 5px);display:flex;align-items:center;gap:7px;padding:8px 12px;background:white;border:1px solid ${C.border};border-radius:10px;">
              <div style="color:${C.purple};">${ICONS.check}</div>
              <span style="font-size:12px;color:${C.textMd};">${item}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Marketing -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.orange}15;border-radius:18px;padding:26px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <div style="width:44px;height:44px;border-radius:12px;background:${C.orange}10;border:1.5px solid ${C.orange}20;display:flex;align-items:center;justify-content:center;">
            ${icon('megaphone', C.orange)}
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:${C.text};">التسويق الرقمي</div>
            <div style="font-size:12px;color:${C.textLight};margin-top:2px;">استراتيجيات تسويقية فعّالة لتحقيق نتائج ملموسة</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          ${[
            'حملات إعلانية مدفوعة Google Ads',
            'إعلانات Meta (Facebook & Instagram)',
            'تحسين محركات البحث SEO',
            'إدارة حسابات التواصل الاجتماعي',
            'تسويق بالمحتوى Content Marketing',
            'حملات البريد الإلكتروني',
            'تحليل البيانات وقياس الأداء',
            'استراتيجيات نمو Growth Hacking',
          ].map(item => `
            <div style="width:calc(50% - 5px);display:flex;align-items:center;gap:7px;padding:8px 12px;background:white;border:1px solid ${C.border};border-radius:10px;">
              <div style="color:${C.orange};">${ICONS.check}</div>
              <span style="font-size:12px;color:${C.textMd};">${item}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="background:linear-gradient(135deg,${C.purple}06,${C.orange}06);border:1.5px solid ${C.purple}12;border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;">
        ${icon('trendingUp', C.orange)}
        <div style="font-size:13px;color:${C.textMd};line-height:1.8;">
          نقدم تقارير أداء شهرية مفصّلة لجميع الحملات التسويقية مع توصيات مستمرة لتحسين النتائج وزيادة العائد على الاستثمار.
        </div>
      </div>
    </div>
    ${pageFooter(4, TOTAL)}
  `;
  return page;
}

// ─── PAGE 5: READY-MADE WEBSITES ───
function buildReadyMade(): HTMLDivElement {
  const page = createPage();
  const categories = [
    { name: 'استشارات ومحاماة', count: '4 قوالب', c: C.accent },
    { name: 'عقارات وبناء', count: '3 قوالب', c: C.primary },
    { name: 'تقنية وبرمجيات', count: '4 قوالب', c: C.purple },
    { name: 'صحة وطب', count: '3 قوالب', c: C.green },
    { name: 'تعليم وتدريب', count: '3 قوالب', c: C.orange },
    { name: 'لوجستيات ونقل', count: '2 قوالب', c: C.red },
    { name: 'مطاعم وضيافة', count: '3 قوالب', c: C.gold },
    { name: 'تجارة ومتاجر', count: '3 قوالب', c: C.accent },
    { name: 'سياحة وسفر', count: '2 قوالب', c: C.primary },
    { name: 'خدمات مهنية', count: '1 قالب', c: C.purple },
  ];

  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('المواقع الجاهزة', 'store')}

      <div style="background:${C.bgSoft};border:1.5px solid ${C.border};border-radius:16px;padding:24px;margin-bottom:22px;">
        <div style="font-size:14.5px;line-height:2.2;color:${C.textMd};">
          نوفر أكثر من <strong style="color:${C.primary};">28 قالب موقع احترافي</strong> جاهز للتخصيص، مصمم خصيصاً للسوق العربي والسعودي. جميع القوالب ثنائية اللغة (عربي/إنجليزي) ومتجاوبة مع جميع الأجهزة، مع دعم فني كامل وتخصيص حسب الطلب.
        </div>
      </div>

      <!-- Categories grid -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:22px;">
        ${categories.map(cat => `
          <div style="width:calc(50% - 6px);background:white;border:1.5px solid ${cat.c}15;border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;box-sizing:border-box;">
            <div style="width:40px;height:40px;border-radius:10px;background:${cat.c}08;border:1px solid ${cat.c}20;display:flex;align-items:center;justify-content:center;">
              ${icon('globe', cat.c, 20)}
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:${C.text};">${cat.name}</div>
              <div style="font-size:11px;color:${C.textLight};margin-top:2px;">${cat.count}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Features -->
      <div style="background:${C.primaryBg};border:1.5px solid ${C.primary}15;border-radius:16px;padding:22px;">
        <div style="font-size:15px;font-weight:700;color:${C.text};margin-bottom:14px;">مميزات القوالب الجاهزة</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${['تصميم متجاوب', 'ثنائي اللغة', 'سرعة تحميل عالية', 'SEO محسّن', 'لوحة تحكم', 'دعم فني', 'تخصيص كامل', 'استضافة مجانية'].map(f => `
            <div style="display:flex;align-items:center;gap:5px;background:white;border:1px solid ${C.primary}15;border-radius:8px;padding:7px 14px;">
              <div style="color:${C.primary};">${ICONS.check}</div>
              <span style="font-size:11.5px;color:${C.textMd};">${f}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ${pageFooter(5, TOTAL)}
  `;
  return page;
}

// ─── PAGE 6: FINANCING SYSTEM ───
function buildFinancing(): HTMLDivElement {
  const page = createPage();
  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('نظام التمويل الداخلي', 'wallet', C.green)}

      <div style="background:linear-gradient(135deg,${C.green}06,${C.primary}04);border:1.5px solid ${C.green}15;border-radius:16px;padding:24px;margin-bottom:20px;">
        <div style="font-size:14.5px;line-height:2.3;color:${C.textMd};">
          نوفر في <strong style="color:${C.green};">ASH Holding</strong> نظام تمويل داخلي مرن ومبتكر يتيح للعملاء الحصول على خدماتنا الرقمية بنظام <strong style="color:${C.text};">الأقساط الميسّرة</strong>. هذا النظام مصمم لدعم رواد الأعمال والشركات الناشئة التي ترغب في بناء حضورها الرقمي دون تحمل التكلفة الكاملة مقدماً.
        </div>
      </div>

      <!-- How it works -->
      <div style="font-size:16px;font-weight:700;color:${C.text};margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        ${icon('settings', C.green, 20)}
        كيف يعمل نظام التمويل؟
      </div>
      <div style="display:flex;gap:10px;margin-bottom:22px;">
        ${[
          { step: '01', title: 'تقديم الطلب', desc: 'اختر الخدمة وقدّم طلب التمويل عبر المنصة', c: C.primary },
          { step: '02', title: 'المراجعة والموافقة', desc: 'مراجعة سريعة والرد خلال 24 ساعة', c: C.accent },
          { step: '03', title: 'توقيع العقد', desc: 'عقد إلكتروني شفاف بشروط واضحة', c: C.green },
          { step: '04', title: 'بدء التنفيذ', desc: 'نبدأ العمل فوراً بعد الموافقة', c: C.purple },
          { step: '05', title: 'سداد مرن', desc: 'أقساط شهرية مريحة حسب الاتفاق', c: C.orange },
        ].map(s => `
          <div style="flex:1;text-align:center;">
            <div style="width:40px;height:40px;border-radius:50%;background:${s.c}10;border:2px solid ${s.c}25;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
              <span style="font-size:13px;font-weight:700;color:${s.c};">${s.step}</span>
            </div>
            <div style="font-size:11.5px;font-weight:600;color:${C.text};margin-bottom:3px;">${s.title}</div>
            <div style="font-size:9.5px;color:${C.textLight};line-height:1.5;">${s.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Features grid -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
        ${[
          { title: 'بدون فوائد ربوية', desc: 'تمويل متوافق مع الشريعة الإسلامية', ic: 'shield' as const, c: C.green },
          { title: 'موافقة سريعة', desc: 'الرد على طلبك خلال 24 ساعة فقط', ic: 'zap' as const, c: C.primary },
          { title: 'عقود إلكترونية', desc: 'عقود رقمية آمنة وشفافة بالكامل', ic: 'fileText' as const, c: C.accent },
          { title: 'أقساط مرنة', desc: 'خطط سداد مخصصة حسب قدرتك', ic: 'creditCard' as const, c: C.purple },
          { title: 'بدء فوري', desc: 'نبدأ تنفيذ مشروعك فور الموافقة', ic: 'rocket' as const, c: C.orange },
          { title: 'متابعة شفافة', desc: 'تتبع أقساطك ومدفوعاتك لحظياً', ic: 'barChart' as const, c: C.gold },
        ].map(f => `
          <div style="width:calc(50% - 6px);background:${C.bgSoft};border:1.5px solid ${f.c}12;border-radius:14px;padding:16px;display:flex;gap:12px;align-items:flex-start;box-sizing:border-box;">
            <div style="width:38px;height:38px;border-radius:10px;background:${f.c}08;border:1px solid ${f.c}20;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${icon(f.ic, f.c, 20)}
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:${C.text};margin-bottom:3px;">${f.title}</div>
              <div style="font-size:11px;color:${C.textLight};line-height:1.6;">${f.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- CTA -->
      <div style="background:${C.green}08;border:1.5px solid ${C.green}15;border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:15px;font-weight:700;color:${C.green};margin-bottom:5px;">ابدأ مشروعك اليوم — ادفع لاحقاً!</div>
        <div style="font-size:12px;color:${C.textLight};">تقدّم بطلب التمويل عبر منصتنا أو منصة ash.holdings</div>
      </div>
    </div>
    ${pageFooter(6, TOTAL)}
  `;
  return page;
}

// ─── PAGE 7: TECHNOLOGIES ───
function buildTech(): HTMLDivElement {
  const page = createPage();
  const cats = [
    { title: 'تطوير الواجهات الأمامية', c: '#61dafb', items: [
      { n: 'React / Next.js', d: 'واجهات حديثة وتفاعلية' },
      { n: 'TypeScript', d: 'برمجة آمنة وموثوقة' },
      { n: 'Tailwind CSS', d: 'تصميم مرن ومتجاوب' },
      { n: 'React Native', d: 'تطبيقات جوال متعددة المنصات' },
    ]},
    { title: 'تطوير الخوادم والبنية الخلفية', c: '#ff2d20', items: [
      { n: 'Laravel / PHP', d: 'أنظمة خلفية قوية ومستقرة' },
      { n: 'Node.js / Express', d: 'تطبيقات سريعة وقابلة للتوسع' },
      { n: 'Python / Django', d: 'ذكاء اصطناعي وتحليل بيانات' },
      { n: 'PostgreSQL / MySQL', d: 'قواعد بيانات موثوقة' },
    ]},
    { title: 'البنية التحتية السحابية', c: C.purple, items: [
      { n: 'AWS / Azure / GCP', d: 'استضافة سحابية متقدمة' },
      { n: 'Docker / Kubernetes', d: 'حاويات ونشر تلقائي' },
      { n: 'CI/CD Pipelines', d: 'تحديث واختبار مستمر' },
      { n: 'CDN & Edge Computing', d: 'أداء فائق السرعة عالمياً' },
    ]},
    { title: 'الأدوات والتحليلات', c: C.orange, items: [
      { n: 'Google Analytics', d: 'تحليل سلوك الزوار والعملاء' },
      { n: 'Meta & Google Ads', d: 'منصات إعلانية فعّالة' },
      { n: 'SEO & SEM Tools', d: 'أدوات تحسين الظهور' },
      { n: 'A/B Testing', d: 'اختبار وتحسين مستمر' },
    ]},
  ];

  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('التقنيات المستخدمة', 'cpu')}

      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${cats.map(cat => `
          <div style="width:calc(50% - 7px);background:${C.bgSoft};border:1.5px solid ${cat.c}15;border-radius:16px;padding:22px;box-sizing:border-box;">
            <div style="font-size:14px;font-weight:700;color:${C.text};margin-bottom:16px;display:flex;align-items:center;gap:8px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${cat.c};"></div>
              ${cat.title}
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${cat.items.map(t => `
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:34px;height:34px;border-radius:8px;background:${cat.c}08;border:1px solid ${cat.c}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <div style="width:10px;height:10px;border-radius:3px;background:${cat.c};opacity:0.5;"></div>
                  </div>
                  <div>
                    <div style="font-size:12.5px;font-weight:600;color:${C.text};">${t.n}</div>
                    <div style="font-size:10.5px;color:${C.textLight};">${t.d}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Security note -->
      <div style="margin-top:20px;background:${C.green}06;border:1.5px solid ${C.green}12;border-radius:14px;padding:16px;display:flex;align-items:center;gap:12px;">
        ${icon('shield', C.green)}
        <div style="font-size:13px;color:${C.textMd};line-height:1.8;">
          نطبق أعلى معايير الأمان السيبراني وحماية البيانات في جميع مشاريعنا، مع تشفير كامل وجدران حماية متقدمة.
        </div>
      </div>
    </div>
    ${pageFooter(6, TOTAL)}
  `;
  return page;
}

// ─── PAGE 8: METHODOLOGY ───
function buildMethodology(): HTMLDivElement {
  const page = createPage();
  const phases = [
    { num: '01', title: 'الاستشارة والتحليل', desc: 'نبدأ بفهم عميق لأعمالك وأهدافك ومتطلباتك. نجري جلسات استشارية مكثفة لتحديد نطاق العمل وتحليل المنافسين والسوق المستهدف.', items: ['تحليل المتطلبات', 'دراسة المنافسين', 'تحديد الأهداف', 'خارطة المشروع'], c: C.primary, ic: 'target' as const },
    { num: '02', title: 'التصميم والنمذجة', desc: 'نصمم واجهات المستخدم وتجربة الاستخدام بناءً على أفضل الممارسات العالمية. نقدم نماذج أولية تفاعلية للمراجعة والاعتماد قبل البدء بالتطوير.', items: ['تصميم UI/UX', 'نماذج تفاعلية', 'اعتماد التصاميم', 'دليل التصميم'], c: C.purple, ic: 'palette' as const },
    { num: '03', title: 'التطوير والبناء', desc: 'نبني الحل باستخدام أحدث التقنيات وأفضل ممارسات البرمجة. نتبع منهجية Agile لضمان مرونة التطوير والتسليم التدريجي.', items: ['برمجة متقدمة', 'مراجعة الكود', 'تحديثات أسبوعية', 'توثيق شامل'], c: C.accent, ic: 'code' as const },
    { num: '04', title: 'الاختبار وضمان الجودة', desc: 'نجري اختبارات شاملة تغطي الأداء والأمان وتجربة المستخدم. نضمن أن المنتج النهائي خالٍ من الأخطاء وجاهز للإطلاق.', items: ['اختبارات الأداء', 'اختبارات الأمان', 'اختبار التوافق', 'فحص شامل'], c: C.green, ic: 'shield' as const },
    { num: '05', title: 'الإطلاق والدعم المستمر', desc: 'نطلق المشروع ونوفر دعماً فنياً متواصلاً مع تحديثات وتحسينات مستمرة. فريقنا متاح على مدار الساعة لضمان استمرارية الأعمال.', items: ['نشر آمن', 'تدريب الفريق', 'دعم 24/7', 'تحديثات دورية'], c: C.orange, ic: 'rocket' as const },
  ];

  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('منهجية العمل', 'layers', C.accent)}

      <div style="display:flex;flex-direction:column;gap:14px;">
        ${phases.map(p => `
          <div style="background:${C.bgSoft};border:1.5px solid ${p.c}12;border-radius:16px;padding:20px;display:flex;gap:16px;align-items:flex-start;">
            <div style="width:44px;height:44px;border-radius:50%;background:${p.c}10;border:2px solid ${p.c}25;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <span style="font-size:15px;font-weight:700;color:${p.c};">${p.num}</span>
            </div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                ${icon(p.ic, p.c, 18)}
                <span style="font-size:15px;font-weight:700;color:${C.text};">${p.title}</span>
              </div>
              <div style="font-size:12px;color:${C.textMd};line-height:1.9;margin-bottom:10px;">${p.desc}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                ${p.items.map(i => `
                  <span style="background:${p.c}08;border:1px solid ${p.c}15;border-radius:6px;padding:4px 10px;font-size:10px;color:${C.textMd};">${i}</span>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ${pageFooter(7, TOTAL)}
  `;
  return page;
}

// ─── PAGE 9: WHY US + SECTORS ───
function buildWhyUs(): HTMLDivElement {
  const page = createPage();
  const advs = [
    { t: 'حلول مخصصة 100%', d: 'كل مشروع فريد ومصمم خصيصاً لاحتياجاتك', ic: 'settings' as const, c: C.primary },
    { t: 'معايير عالمية', d: 'نلتزم بأفضل الممارسات الدولية', ic: 'award' as const, c: C.accent },
    { t: 'فريق محترف', d: 'خبراء في التطوير والتصميم والتسويق', ic: 'users' as const, c: C.purple },
    { t: 'دعم متواصل 24/7', d: 'فريق دعم جاهز في أي وقت', ic: 'headphones' as const, c: C.orange },
    { t: 'أمان متقدم', d: 'حماية بيانات بأعلى المعايير', ic: 'shield' as const, c: C.green },
    { t: 'تمويل مرن', d: 'نظام أقساط ميسّر بدون فوائد', ic: 'wallet' as const, c: C.gold },
    { t: 'سرعة التسليم', d: 'التزام بالمواعيد والتسليم المبكر', ic: 'zap' as const, c: C.red },
    { t: 'ضمان الجودة', d: 'ضمان شامل على جميع المشاريع', ic: 'star' as const, c: C.primary },
  ];

  const sectors = [
    { n: 'الشركات والمؤسسات', ic: 'building' as const, c: C.accent },
    { n: 'المتاجر الإلكترونية', ic: 'store' as const, c: C.primary },
    { n: 'رواد الأعمال', ic: 'lightbulb' as const, c: C.purple },
    { n: 'القطاع التقني', ic: 'cpu' as const, c: C.green },
    { n: 'القطاع الصحي', ic: 'shield' as const, c: C.red },
    { n: 'القطاع التعليمي', ic: 'award' as const, c: C.orange },
    { n: 'المطاعم والضيافة', ic: 'store' as const, c: C.gold },
    { n: 'الخدمات المهنية', ic: 'briefcase' as const, c: C.accent },
  ];

  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('لماذا ASH Holding؟', 'star', C.gold)}

      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:30px;">
        ${advs.map(a => `
          <div style="width:calc(50% - 5px);background:${C.bgSoft};border:1.5px solid ${a.c}10;border-radius:12px;padding:14px;display:flex;gap:10px;align-items:center;box-sizing:border-box;">
            <div style="width:36px;height:36px;border-radius:10px;background:${a.c}08;border:1px solid ${a.c}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${icon(a.ic, a.c, 18)}
            </div>
            <div>
              <div style="font-size:12.5px;font-weight:600;color:${C.text};">${a.t}</div>
              <div style="font-size:10.5px;color:${C.textLight};line-height:1.5;">${a.d}</div>
            </div>
          </div>
        `).join('')}
      </div>

      ${header('القطاعات التي نخدمها', 'briefcase', C.purple)}

      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${sectors.map(s => `
          <div style="width:calc(25% - 9px);background:${C.bgSoft};border:1.5px solid ${s.c}12;border-radius:14px;padding:18px 10px;text-align:center;box-sizing:border-box;">
            <div style="width:42px;height:42px;border-radius:12px;background:${s.c}08;border:1px solid ${s.c}18;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
              ${icon(s.ic, s.c, 20)}
            </div>
            <div style="font-size:11.5px;font-weight:600;color:${C.text};">${s.n}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ${pageFooter(8, TOTAL)}
  `;
  return page;
}

// ─── PAGE 10: CONTACT ───
function buildContact(): HTMLDivElement {
  const page = createPage();
  page.innerHTML = `
    <div style="padding:42px 42px 30px;">
      ${header('تواصل معنا', 'mail', C.accent)}

      <!-- CTA -->
      <div style="background:linear-gradient(135deg,${C.primary}06,${C.accent}05);border:1.5px solid ${C.primary}12;border-radius:22px;padding:35px;text-align:center;margin-bottom:24px;">
        <div style="margin:0 auto 18px;display:flex;justify-content:center;">
          <div style="width:70px;height:70px;border-radius:20px;background:${C.primary}10;border:2px solid ${C.primary}18;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 40px ${C.primary}12;">
            ${icon('rocket', C.primary, 28)}
          </div>
        </div>
        <div style="font-size:26px;font-weight:800;color:${C.text};margin-bottom:8px;line-height:1.5;">
          ابدأ مشروعك الرقمي معنا اليوم
        </div>
        <div style="font-size:14px;color:${C.textLight};margin-bottom:20px;line-height:1.7;">
          نحن مستعدون لتحويل أفكارك إلى واقع رقمي يتجاوز توقعاتك
        </div>
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
          <div style="width:50px;height:1.5px;background:linear-gradient(90deg,transparent,${C.primary});"></div>
          <div style="width:6px;height:6px;border-radius:50%;background:${C.primary};"></div>
          <div style="width:50px;height:1.5px;background:linear-gradient(90deg,${C.primary},transparent);"></div>
        </div>
      </div>

      <!-- Contact cards -->
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:22px;">
        ${[
          { ic: 'globe' as const, l: 'الموقع الإلكتروني', v: 'ash-holding.sa', c: C.primary },
          { ic: 'mail' as const, l: 'البريد الإلكتروني', v: 'info@ash-holding.sa', c: C.accent },
          { ic: 'phone' as const, l: 'الهاتف', v: '0555812567', c: C.purple },
          { ic: 'headphones' as const, l: 'الدعم الفني', v: 'support@ash-holding.sa', c: C.green },
        ].map(c => `
          <div style="width:calc(50% - 7px);background:${C.bgSoft};border:1.5px solid ${c.c}12;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px;box-sizing:border-box;">
            <div style="width:44px;height:44px;border-radius:12px;background:${c.c}08;border:1.5px solid ${c.c}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${icon(c.ic, c.c, 20)}
            </div>
            <div>
              <div style="font-size:11px;color:${C.textLight};margin-bottom:2px;">${c.l}</div>
              <div style="font-size:13.5px;font-weight:600;color:${C.text};direction:ltr;text-align:left;">${c.v}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Location -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.orange}12;border-radius:16px;padding:20px;display:flex;align-items:center;gap:14px;margin-bottom:22px;">
        <div style="width:44px;height:44px;border-radius:12px;background:${C.orange}08;border:1.5px solid ${C.orange}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${icon('mapPin', C.orange, 20)}
        </div>
        <div>
          <div style="font-size:11px;color:${C.textLight};margin-bottom:2px;">الموقع</div>
          <div style="font-size:13.5px;font-weight:600;color:${C.text};">المملكة العربية السعودية</div>
        </div>
      </div>

      <!-- Platforms -->
      <div style="background:${C.bgSoft};border:1.5px solid ${C.border};border-radius:16px;padding:18px;margin-bottom:22px;">
        <div style="font-size:14px;font-weight:700;color:${C.text};margin-bottom:12px;">منصاتنا الإلكترونية</div>
        <div style="display:flex;gap:10px;">
          ${[
            { n: 'ash-holding.sa', d: 'المنصة الرئيسية', c: C.primary },
            { n: 'ash.holdings', d: 'منصة التمويل', c: C.green },
          ].map(p => `
            <div style="flex:1;background:white;border:1.5px solid ${p.c}12;border-radius:12px;padding:14px;text-align:center;">
              <div style="font-size:14px;font-weight:600;color:${p.c};margin-bottom:3px;direction:ltr;">${p.n}</div>
              <div style="font-size:11px;color:${C.textLight};">${p.d}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Trust badges -->
      <div style="display:flex;gap:10px;justify-content:center;">
        ${['سجل تجاري موثق', 'ضمان جودة شامل', 'حماية البيانات', 'متوافق مع الشريعة'].map(b => `
          <div style="background:${C.bgSoft};border:1px solid ${C.border};border-radius:50px;padding:8px 16px;display:flex;align-items:center;gap:5px;">
            <div style="color:${C.green};">${ICONS.check}</div>
            <span style="font-size:10.5px;color:${C.textMd};">${b}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Footer -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:55px;background:linear-gradient(90deg,${C.primary},${C.accent},${C.purple});display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:3px;">ASH Holding</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.8);margin-top:2px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</div>
      </div>
    </div>
    <div style="position:absolute;bottom:62px;left:50%;transform:translateX(-50%);font-size:10px;color:${C.textMuted};">9 / ${TOTAL}</div>
  `;
  return page;
}

// ═══════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════
export const generateCompanyProfilePDF = async () => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  
  const pages = [
    buildCover(),
    buildAbout(),
    buildServices1(),
    buildServices2(),
    buildReadyMade(),
    buildFinancing(),
    buildTech(),
    buildMethodology(),
    buildWhyUs(),
    buildContact(),
  ];

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
  document.body.appendChild(wrapper);

  try {
    for (let i = 0; i < pages.length; i++) {
      wrapper.innerHTML = '';
      wrapper.appendChild(pages[i]);

      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 150));

      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.93);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, 'FAST');
    }

    pdf.save('ASH-Holding-Company-Profile.pdf');
  } finally {
    document.body.removeChild(wrapper);
  }
};
