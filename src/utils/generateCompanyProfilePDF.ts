import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ──────────────────────────────────────────────
// ASH Holding – Enhanced Company Profile PDF
// With SVG icons, richer content, professional layout
// ──────────────────────────────────────────────

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

// ─── SVG ICONS (inline for PDF rendering) ───
const ICONS = {
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
  globe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  palette: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  megaphone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  headphones: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  zap: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  briefcase: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  store: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>`,
  lightbulb: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  cpu: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  award: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
};

function iconHtml(name: keyof typeof ICONS, color: string, size = 24): string {
  return `<div style="color:${color};width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ICONS[name]}</div>`;
}

function createPageContainer(): HTMLDivElement {
  const page = document.createElement('div');
  page.style.cssText = `
    width: 794px;
    height: 1123px;
    background: linear-gradient(180deg, #0c1929 0%, #0f172a 40%, #111827 100%);
    direction: rtl;
    text-align: right;
    font-family: 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', 'Noto Kufi Arabic', sans-serif;
    color: #e2e8f0;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  `;
  return page;
}

function sectionHeader(title: string, iconName: keyof typeof ICONS, color = '#00d2d3'): string {
  return `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:30px;">
      <div style="width:48px;height:48px;border-radius:14px;background:${color}15;border:1px solid ${color}40;display:flex;align-items:center;justify-content:center;">
        ${iconHtml(iconName, color)}
      </div>
      <div>
        <div style="font-size:26px;font-weight:700;color:#ffffff;">${title}</div>
        <div style="width:40px;height:3px;background:${color};border-radius:2px;margin-top:6px;"></div>
      </div>
    </div>
  `;
}

// ─── PAGE 1: COVER ───
function buildCoverPage(): HTMLDivElement {
  const page = createPageContainer();
  page.style.background = 'linear-gradient(160deg, #0a1628 0%, #0f172a 30%, #132040 60%, #0f172a 100%)';

  page.innerHTML = `
    <!-- Decorative elements -->
    <div style="position:absolute;top:-100px;left:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(22,78,159,0.25),transparent 70%);"></div>
    <div style="position:absolute;bottom:80px;right:-100px;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(0,210,211,0.15),transparent 70%);"></div>
    <div style="position:absolute;top:300px;right:60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.1),transparent 70%);"></div>

    <!-- Geometric pattern -->
    <div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.03;">
      ${Array.from({length: 8}, (_, i) => 
        `<div style="position:absolute;top:${80 + i * 120}px;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent 10%,#00d2d3 50%,transparent 90%);"></div>`
      ).join('')}
      ${Array.from({length: 6}, (_, i) => 
        `<div style="position:absolute;top:0;left:${100 + i * 120}px;width:1px;height:100%;background:linear-gradient(180deg,transparent 10%,#164e9f 50%,transparent 90%);"></div>`
      ).join('')}
    </div>

    <!-- Corner accents -->
    <div style="position:absolute;top:30px;right:30px;width:60px;height:60px;border-top:2px solid rgba(0,210,211,0.3);border-right:2px solid rgba(0,210,211,0.3);border-radius:0 12px 0 0;"></div>
    <div style="position:absolute;bottom:70px;left:30px;width:60px;height:60px;border-bottom:2px solid rgba(22,78,159,0.3);border-left:2px solid rgba(22,78,159,0.3);border-radius:0 0 0 12px;"></div>

    <!-- Content -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;position:relative;z-index:2;">
      
      <!-- Top badge -->
      <div style="background:rgba(0,210,211,0.08);border:1px solid rgba(0,210,211,0.25);border-radius:50px;padding:10px 32px;margin-bottom:50px;display:flex;align-items:center;gap:10px;">
        ${iconHtml('star', '#00d2d3', 18)}
        <span style="font-size:14px;color:#00d2d3;letter-spacing:1.5px;font-weight:500;">COMPANY PROFILE ${new Date().getFullYear()}</span>
      </div>

      <!-- Logo area -->
      <div style="width:100px;height:100px;border-radius:24px;background:linear-gradient(135deg,rgba(0,210,211,0.15),rgba(22,78,159,0.15));border:2px solid rgba(0,210,211,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:40px;">
        ${iconHtml('building', '#00d2d3', 28)}
      </div>

      <!-- Company name -->
      <div style="font-size:68px;font-weight:800;background:linear-gradient(135deg,#00d2d3,#3884f4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:4px;margin-bottom:15px;text-align:center;">
        ASH Holding
      </div>

      <!-- Divider -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <div style="width:80px;height:1px;background:linear-gradient(90deg,transparent,#00d2d3);"></div>
        <div style="width:8px;height:8px;border-radius:50%;background:#00d2d3;"></div>
        <div style="width:80px;height:1px;background:linear-gradient(90deg,#00d2d3,transparent);"></div>
      </div>

      <!-- Arabic tagline -->
      <div style="font-size:26px;font-weight:600;color:#e2e8f0;text-align:center;line-height:1.8;margin-bottom:12px;">
        شريكك الرقمي نحو النمو والابتكار
      </div>

      <!-- Subtitle -->
      <div style="font-size:16px;color:#64748b;text-align:center;margin-bottom:50px;max-width:500px;line-height:1.8;">
        نقدم حلولاً رقمية متكاملة تجمع بين التقنية والإبداع لتحقيق رؤيتك
      </div>

      <!-- Feature pills -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:40px;">
        ${[
          { icon: 'code' as const, text: 'تطوير برمجي' },
          { icon: 'palette' as const, text: 'تصميم إبداعي' },
          { icon: 'megaphone' as const, text: 'تسويق رقمي' },
          { icon: 'shield' as const, text: 'أمن وحماية' },
        ].map(f => `
          <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:50px;padding:10px 22px;display:flex;align-items:center;gap:8px;">
            ${iconHtml(f.icon, '#00d2d3', 18)}
            <span style="font-size:13px;color:#94a3b8;font-weight:500;">${f.text}</span>
          </div>
        `).join('')}
      </div>

      <!-- Saudi Arabia badge -->
      <div style="display:flex;align-items:center;gap:8px;background:rgba(22,78,159,0.15);border:1px solid rgba(22,78,159,0.3);border-radius:12px;padding:10px 24px;">
        ${iconHtml('mapPin', '#3884f4', 18)}
        <span style="font-size:14px;color:#94a3b8;">المملكة العربية السعودية</span>
      </div>
    </div>

    <!-- Bottom gradient bar -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:6px;background:linear-gradient(90deg,#00d2d3,#164e9f,#7c3aed,#164e9f,#00d2d3);"></div>
  `;
  return page;
}

// ─── PAGE 2: ABOUT US ───
function buildAboutPage(): HTMLDivElement {
  const page = createPageContainer();
  page.innerHTML = `
    <div style="padding:45px 45px 30px;">
      
      ${sectionHeader('من نحن', 'building')}

      <!-- About card -->
      <div style="background:linear-gradient(135deg,rgba(30,41,59,0.9),rgba(30,41,59,0.7));border:1px solid rgba(0,210,211,0.15);border-radius:18px;padding:28px;margin-bottom:24px;">
        <div style="font-size:15px;line-height:2.2;color:#cbd5e1;">
          <p style="margin:0 0 14px;">شركة <strong style="color:#00d2d3;">ASH Holding</strong> هي شركة تقنية سعودية رائدة تأسست عام <strong style="color:#ffffff;">2020</strong>، متخصصة في تقديم حلول رقمية شاملة ومبتكرة. نساعد المؤسسات والأفراد والشركات الناشئة على التحول الرقمي وتحقيق النمو المستدام من خلال أحدث التقنيات العالمية.</p>
          <p style="margin:0;">نجمع بين الخبرة التقنية العميقة والرؤية الإبداعية لنقدم نتائج استثنائية. فريقنا من المطورين والمصممين والمسوّقين يعمل بشغف لضمان تحقيق كل مشروع لأهدافه بأعلى معايير الجودة والاحترافية والأمان.</p>
        </div>
      </div>

      <!-- Vision & Mission -->
      <div style="display:flex;gap:14px;margin-bottom:24px;">
        <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(0,210,211,0.2);border-radius:16px;padding:24px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            ${iconHtml('target', '#00d2d3')}
            <div style="font-size:18px;font-weight:700;color:#ffffff;">رؤيتنا</div>
          </div>
          <div style="font-size:13.5px;line-height:2.1;color:#94a3b8;">
            أن نكون الشريك الرقمي الأول والأكثر موثوقية للشركات في المنطقة العربية، ونقود التحول الرقمي بحلول مبتكرة تسهم في بناء اقتصاد رقمي مزدهر.
          </div>
        </div>
        <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(22,78,159,0.3);border-radius:16px;padding:24px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            ${iconHtml('rocket', '#3884f4')}
            <div style="font-size:18px;font-weight:700;color:#ffffff;">رسالتنا</div>
          </div>
          <div style="font-size:13.5px;line-height:2.1;color:#94a3b8;">
            تمكين عملائنا من تحقيق أقصى إمكاناتهم الرقمية عبر تقديم خدمات تقنية عالية الجودة، مدعومة بالابتكار المستمر والدعم الفني المتواصل.
          </div>
        </div>
      </div>

      <!-- Values -->
      <div style="background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.4);border-radius:16px;padding:22px;margin-bottom:24px;">
        <div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
          ${iconHtml('award', '#a855f7', 20)}
          قيمنا الأساسية
        </div>
        <div style="display:flex;gap:12px;">
          ${[
            { title: 'الجودة', desc: 'نلتزم بأعلى معايير التميز', color: '#00d2d3' },
            { title: 'الابتكار', desc: 'نواكب أحدث التقنيات', color: '#3884f4' },
            { title: 'الشفافية', desc: 'تواصل واضح ومستمر', color: '#a855f7' },
            { title: 'الشراكة', desc: 'نجاحكم هو نجاحنا', color: '#f97316' },
          ].map(v => `
            <div style="flex:1;text-align:center;">
              <div style="width:10px;height:10px;border-radius:50%;background:${v.color};margin:0 auto 8px;"></div>
              <div style="font-size:13px;font-weight:600;color:#ffffff;margin-bottom:4px;">${v.title}</div>
              <div style="font-size:11px;color:#64748b;line-height:1.5;">${v.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:12px;">
        ${[
          { num: '+500', label: 'عميل سعيد', icon: 'users' as const, color: '#00d2d3' },
          { num: '+200', label: 'مشروع منجز', icon: 'briefcase' as const, color: '#3884f4' },
          { num: '+50', label: 'خدمة رقمية', icon: 'zap' as const, color: '#a855f7' },
          { num: '24/7', label: 'دعم متواصل', icon: 'headphones' as const, color: '#f97316' },
        ].map(s => `
          <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:14px;padding:18px 12px;text-align:center;">
            <div style="margin:0 auto 8px;display:flex;justify-content:center;">
              ${iconHtml(s.icon, s.color, 20)}
            </div>
            <div style="font-size:26px;font-weight:700;color:${s.color};margin-bottom:4px;">${s.num}</div>
            <div style="font-size:11px;color:#94a3b8;">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="position:absolute;bottom:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:11px;color:#475569;">2 / 6</div>
  `;
  return page;
}

// ─── PAGE 3: SERVICES ───
function buildServicesPage(): HTMLDivElement {
  const page = createPageContainer();

  const services = [
    {
      title: 'البرمجيات والأنظمة',
      icon: 'code' as const,
      color: '#3884f4',
      desc: 'نبني أنظمة ذكية تدعم نمو أعمالك',
      items: ['أنظمة ERP / CRM متكاملة', 'أنظمة محاسبية ومالية متقدمة', 'حلول برمجية مخصصة بالكامل', 'أتمتة العمليات والإجراءات', 'لوحات تحكم وتقارير تفاعلية'],
    },
    {
      title: 'المواقع والتطبيقات',
      icon: 'globe' as const,
      color: '#00d2d3',
      desc: 'تواجد رقمي قوي واحترافي',
      items: ['مواقع شركات احترافية متجاوبة', 'متاجر إلكترونية متكاملة', 'تطبيقات ويب حديثة (SPA/PWA)', 'تطبيقات جوال iOS و Android', 'صفحات هبوط تسويقية'],
    },
    {
      title: 'التصميم والهوية',
      icon: 'palette' as const,
      color: '#a855f7',
      desc: 'هوية بصرية تعكس تميزك',
      items: ['تصميم واجهات UI/UX احترافي', 'هوية بصرية كاملة ودليل العلامة', 'تصاميم سوشال ميديا', 'موشن جرافيك وفيديوهات', 'عروض تقديمية احترافية'],
    },
    {
      title: 'التسويق الرقمي',
      icon: 'megaphone' as const,
      color: '#f97316',
      desc: 'استراتيجيات تسويقية فعّالة',
      items: ['حملات إعلانية مدفوعة (Google/Meta)', 'تحسين محركات البحث SEO', 'إدارة منصات التواصل', 'تسويق بالمحتوى والبريد', 'تحليل البيانات وقياس الأداء'],
    },
  ];

  page.innerHTML = `
    <div style="padding:45px 45px 30px;">
      ${sectionHeader('خدماتنا', 'settings')}

      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${services.map(svc => `
          <div style="width:calc(50% - 7px);background:rgba(30,41,59,0.8);border:1px solid ${svc.color}30;border-radius:18px;padding:24px;box-sizing:border-box;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
              <div style="width:42px;height:42px;border-radius:12px;background:${svc.color}15;border:1px solid ${svc.color}30;display:flex;align-items:center;justify-content:center;">
                ${iconHtml(svc.icon, svc.color)}
              </div>
              <div>
                <div style="font-size:16px;font-weight:700;color:#ffffff;">${svc.title}</div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">${svc.desc}</div>
              </div>
            </div>
            <div style="width:100%;height:1px;background:linear-gradient(90deg,${svc.color}20,transparent);margin:14px 0;"></div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${svc.items.map(item => `
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="color:${svc.color};flex-shrink:0;">${ICONS.check}</div>
                  <div style="font-size:12.5px;color:#94a3b8;line-height:1.5;">${item}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Process note -->
      <div style="margin-top:22px;background:linear-gradient(135deg,rgba(0,210,211,0.06),rgba(22,78,159,0.06));border:1px solid rgba(0,210,211,0.12);border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;">
        ${iconHtml('lightbulb', '#00d2d3')}
        <div style="font-size:13.5px;color:#94a3b8;line-height:1.8;">
          جميع خدماتنا مصممة خصيصاً لتلبية احتياجات عملك، مع ضمان أعلى معايير الجودة والأداء والتسليم في الوقت المحدد.
        </div>
      </div>
    </div>

    <div style="position:absolute;bottom:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:11px;color:#475569;">3 / 6</div>
  `;
  return page;
}

// ─── PAGE 4: TECHNOLOGIES ───
function buildTechPage(): HTMLDivElement {
  const page = createPageContainer();

  const techCategories = [
    {
      title: 'تطوير الواجهات',
      color: '#61dafb',
      items: [
        { name: 'React / Next.js', desc: 'واجهات حديثة وتفاعلية' },
        { name: 'TypeScript', desc: 'برمجة آمنة وموثوقة' },
        { name: 'Tailwind CSS', desc: 'تصميم مرن ومتجاوب' },
      ],
    },
    {
      title: 'تطوير الخادم',
      color: '#ff2d20',
      items: [
        { name: 'Laravel / PHP', desc: 'أنظمة خلفية قوية' },
        { name: 'Node.js', desc: 'تطبيقات سريعة وقابلة للتوسع' },
        { name: 'Python', desc: 'ذكاء اصطناعي وتحليل بيانات' },
      ],
    },
    {
      title: 'البنية التحتية',
      color: '#a855f7',
      items: [
        { name: 'Cloud Services', desc: 'استضافة سحابية متقدمة' },
        { name: 'Docker / CI/CD', desc: 'نشر وتحديث تلقائي' },
        { name: 'Database Systems', desc: 'قواعد بيانات محسّنة' },
      ],
    },
    {
      title: 'التسويق والتحليل',
      color: '#f97316',
      items: [
        { name: 'Google Analytics', desc: 'تحليل البيانات والأداء' },
        { name: 'Meta/Google Ads', desc: 'إعلانات رقمية فعّالة' },
        { name: 'SEO Tools', desc: 'أدوات تحسين محركات البحث' },
      ],
    },
  ];

  page.innerHTML = `
    <div style="padding:45px 45px 30px;">
      ${sectionHeader('التقنيات المستخدمة', 'cpu')}

      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:35px;">
        ${techCategories.map(cat => `
          <div style="width:calc(50% - 7px);background:rgba(30,41,59,0.8);border:1px solid ${cat.color}25;border-radius:16px;padding:22px;box-sizing:border-box;">
            <div style="font-size:15px;font-weight:700;color:#ffffff;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${cat.color};"></div>
              ${cat.title}
            </div>
            <div style="display:flex;flex-direction:column;gap:14px;">
              ${cat.items.map(t => `
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:36px;height:36px;border-radius:10px;background:${cat.color}12;border:1px solid ${cat.color}25;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <div style="width:12px;height:12px;border-radius:3px;background:${cat.color};opacity:0.6;"></div>
                  </div>
                  <div>
                    <div style="font-size:13px;font-weight:600;color:#ffffff;">${t.name}</div>
                    <div style="font-size:11px;color:#64748b;">${t.desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Work methodology -->
      ${sectionHeader('منهجية العمل', 'settings', '#3884f4')}
      
      <div style="display:flex;gap:10px;">
        ${[
          { step: '01', title: 'الاستشارة', desc: 'فهم متطلباتك وأهدافك بدقة', color: '#00d2d3' },
          { step: '02', title: 'التخطيط', desc: 'وضع خطة عمل واضحة ومحددة', color: '#3884f4' },
          { step: '03', title: 'التنفيذ', desc: 'بناء الحل بأعلى معايير الجودة', color: '#a855f7' },
          { step: '04', title: 'الاختبار', desc: 'فحص شامل لضمان الأداء', color: '#10b981' },
          { step: '05', title: 'الإطلاق', desc: 'نشر المشروع والدعم المتواصل', color: '#f97316' },
        ].map((s, i) => `
          <div style="flex:1;text-align:center;">
            <div style="width:44px;height:44px;border-radius:50%;background:${s.color}15;border:2px solid ${s.color}40;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
              <span style="font-size:14px;font-weight:700;color:${s.color};">${s.step}</span>
            </div>
            <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:4px;">${s.title}</div>
            <div style="font-size:10px;color:#64748b;line-height:1.5;">${s.desc}</div>
            ${i < 4 ? '' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div style="position:absolute;bottom:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:11px;color:#475569;">4 / 6</div>
  `;
  return page;
}

// ─── PAGE 5: WHY US + SECTORS ───
function buildWhyUsPage(): HTMLDivElement {
  const page = createPageContainer();

  const advantages = [
    { title: 'حلول مخصصة 100%', desc: 'نصمم حلولاً فريدة تتناسب تماماً مع طبيعة عملك واحتياجاتك الخاصة، بدون قوالب جاهزة.', icon: 'settings' as const, color: '#00d2d3' },
    { title: 'معايير عالمية', desc: 'نلتزم بأفضل الممارسات الدولية في التطوير والأمان والأداء لضمان منتج عالمي المستوى.', icon: 'award' as const, color: '#3884f4' },
    { title: 'فريق محترف', desc: 'فريقنا يضم خبراء متخصصين في مختلف المجالات التقنية والتصميمية والتسويقية.', icon: 'users' as const, color: '#a855f7' },
    { title: 'دعم مستمر 24/7', desc: 'دعم فني متواصل على مدار الساعة لضمان استمرارية أعمالك بدون انقطاع.', icon: 'headphones' as const, color: '#f97316' },
    { title: 'أمان متقدم', desc: 'نطبق أعلى معايير الأمان وحماية البيانات لضمان سلامة أنظمتك ومعلوماتك.', icon: 'shield' as const, color: '#10b981' },
    { title: 'سرعة التسليم', desc: 'نلتزم بالجداول الزمنية المحددة ونسعى دائماً لتسليم المشاريع قبل الموعد.', icon: 'zap' as const, color: '#ef4444' },
  ];

  const sectors = [
    { name: 'الشركات والمؤسسات', icon: 'building' as const, color: '#3884f4', desc: 'أنظمة متكاملة لإدارة الأعمال' },
    { name: 'المتاجر الإلكترونية', icon: 'store' as const, color: '#00d2d3', desc: 'منصات تجارة إلكترونية متقدمة' },
    { name: 'رواد الأعمال', icon: 'lightbulb' as const, color: '#a855f7', desc: 'حلول ذكية للمشاريع الناشئة' },
    { name: 'القطاع التقني', icon: 'cpu' as const, color: '#10b981', desc: 'شراكات تقنية وتكامل أنظمة' },
    { name: 'القطاع التعليمي', icon: 'award' as const, color: '#f97316', desc: 'منصات تعليمية وتدريبية' },
  ];

  page.innerHTML = `
    <div style="padding:45px 45px 30px;">
      ${sectionHeader('لماذا ASH Holding؟', 'star', '#f59e0b')}

      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:35px;">
        ${advantages.map(a => `
          <div style="width:calc(50% - 6px);background:rgba(30,41,59,0.8);border:1px solid ${a.color}20;border-radius:14px;padding:18px;box-sizing:border-box;display:flex;gap:12px;align-items:flex-start;">
            <div style="width:38px;height:38px;border-radius:10px;background:${a.color}12;border:1px solid ${a.color}30;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${iconHtml(a.icon, a.color, 20)}
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:4px;">${a.title}</div>
              <div style="font-size:11.5px;color:#94a3b8;line-height:1.7;">${a.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>

      ${sectionHeader('القطاعات التي نخدمها', 'briefcase', '#a855f7')}

      <div style="display:flex;gap:12px;">
        ${sectors.map(s => `
          <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid ${s.color}20;border-radius:14px;padding:18px 12px;text-align:center;">
            <div style="width:46px;height:46px;border-radius:14px;background:${s.color}12;border:1px solid ${s.color}25;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
              ${iconHtml(s.icon, s.color, 22)}
            </div>
            <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:4px;">${s.name}</div>
            <div style="font-size:10px;color:#64748b;line-height:1.5;">${s.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="position:absolute;bottom:0;left:0;width:100%;height:4px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:11px;color:#475569;">5 / 6</div>
  `;
  return page;
}

// ─── PAGE 6: CONTACT ───
function buildContactPage(): HTMLDivElement {
  const page = createPageContainer();

  page.innerHTML = `
    <div style="padding:45px 45px 30px;">
      ${sectionHeader('تواصل معنا', 'mail', '#3884f4')}

      <!-- Main CTA -->
      <div style="background:linear-gradient(135deg,rgba(0,210,211,0.08),rgba(22,78,159,0.08));border:1px solid rgba(0,210,211,0.15);border-radius:22px;padding:40px;text-align:center;margin-bottom:28px;">
        <div style="margin:0 auto 20px;display:flex;justify-content:center;">
          <div style="width:70px;height:70px;border-radius:20px;background:linear-gradient(135deg,rgba(0,210,211,0.15),rgba(22,78,159,0.15));border:2px solid rgba(0,210,211,0.2);display:flex;align-items:center;justify-content:center;">
            ${iconHtml('rocket', '#00d2d3', 28)}
          </div>
        </div>
        <div style="font-size:28px;font-weight:800;color:#ffffff;margin-bottom:10px;line-height:1.5;">
          ابدأ مشروعك الرقمي معنا
        </div>
        <div style="font-size:15px;color:#64748b;margin-bottom:25px;line-height:1.7;">
          نحن مستعدون لتحويل أفكارك إلى واقع رقمي يتجاوز توقعاتك
        </div>

        <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:20px;">
          <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#00d2d3);"></div>
          <div style="width:6px;height:6px;border-radius:50%;background:#00d2d3;"></div>
          <div style="width:60px;height:1px;background:linear-gradient(90deg,#00d2d3,transparent);"></div>
        </div>
      </div>

      <!-- Contact info cards -->
      <div style="display:flex;flex-wrap:wrap;gap:14px;margin-bottom:28px;">
        ${[
          { icon: 'globe' as const, label: 'الموقع الإلكتروني', value: 'ash-holding.sa', color: '#00d2d3' },
          { icon: 'mail' as const, label: 'البريد الإلكتروني', value: 'info@ash-holding.sa', color: '#3884f4' },
          { icon: 'phone' as const, label: 'الهاتف', value: '0555812567', color: '#a855f7' },
          { icon: 'headphones' as const, label: 'الدعم الفني', value: 'support@ash-holding.sa', color: '#10b981' },
        ].map(c => `
          <div style="width:calc(50% - 7px);background:rgba(30,41,59,0.8);border:1px solid ${c.color}20;border-radius:16px;padding:22px;box-sizing:border-box;display:flex;align-items:center;gap:14px;">
            <div style="width:46px;height:46px;border-radius:14px;background:${c.color}12;border:1px solid ${c.color}25;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              ${iconHtml(c.icon, c.color, 22)}
            </div>
            <div>
              <div style="font-size:12px;color:#64748b;margin-bottom:3px;">${c.label}</div>
              <div style="font-size:14px;font-weight:600;color:#ffffff;direction:ltr;text-align:left;">${c.value}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Location -->
      <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.4);border-radius:16px;padding:22px;display:flex;align-items:center;gap:14px;margin-bottom:28px;">
        <div style="width:46px;height:46px;border-radius:14px;background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${iconHtml('mapPin', '#f97316', 22)}
        </div>
        <div>
          <div style="font-size:12px;color:#64748b;margin-bottom:3px;">الموقع</div>
          <div style="font-size:14px;font-weight:600;color:#ffffff;">المملكة العربية السعودية</div>
        </div>
      </div>

      <!-- Trust badges -->
      <div style="display:flex;gap:12px;justify-content:center;">
        ${[
          { text: 'سجل تجاري موثق', color: '#00d2d3' },
          { text: 'ضمان جودة 100%', color: '#3884f4' },
          { text: 'حماية البيانات', color: '#a855f7' },
        ].map(b => `
          <div style="background:rgba(30,41,59,0.8);border:1px solid ${b.color}25;border-radius:50px;padding:10px 20px;display:flex;align-items:center;gap:6px;">
            <div style="color:${b.color};">${ICONS.check}</div>
            <span style="font-size:12px;color:#94a3b8;">${b.text}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Footer -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:60px;background:linear-gradient(90deg,#00d2d3,#164e9f,#7c3aed);display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:3px;">ASH Holding</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:3px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</div>
      </div>
    </div>
    <div style="position:absolute;bottom:68px;left:50%;transform:translateX(-50%);font-size:11px;color:#475569;">6 / 6</div>
  `;
  return page;
}

// ═══════════════════════════════════════
// MAIN: Render each page via html2canvas
// ═══════════════════════════════════════
export const generateCompanyProfilePDF = async () => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  
  const pages = [
    buildCoverPage(),
    buildAboutPage(),
    buildServicesPage(),
    buildTechPage(),
    buildWhyUsPage(),
    buildContactPage(),
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
        backgroundColor: null,
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, 'FAST');
    }

    pdf.save('ASH-Holding-Company-Profile.pdf');
  } finally {
    document.body.removeChild(wrapper);
  }
};
