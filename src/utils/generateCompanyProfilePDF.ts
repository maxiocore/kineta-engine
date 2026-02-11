import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ──────────────────────────────────────────────
// ASH Holding – Professional Company Profile PDF
// Uses html2canvas for full Arabic/RTL support
// ──────────────────────────────────────────────

const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;

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

// ─── PAGE 1: COVER ───
function buildCoverPage(): HTMLDivElement {
  const page = createPageContainer();
  page.style.background = 'linear-gradient(160deg, #0a1628 0%, #0f172a 30%, #132040 60%, #0f172a 100%)';

  page.innerHTML = `
    <!-- Decorative circles -->
    <div style="position:absolute;top:-80px;left:-60px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(22,78,159,0.2),transparent 70%);"></div>
    <div style="position:absolute;bottom:100px;right:-80px;width:250px;height:250px;border-radius:50%;background:radial-gradient(circle,rgba(0,210,211,0.12),transparent 70%);"></div>
    <div style="position:absolute;top:200px;right:100px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.08),transparent 70%);"></div>

    <!-- Tech lines -->
    <div style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.04;">
      ${Array.from({length: 12}, (_, i) => 
        `<div style="position:absolute;top:${50 + i * 85}px;left:0;width:100%;height:1px;background:linear-gradient(90deg,transparent,#00d2d3,transparent);"></div>`
      ).join('')}
    </div>

    <!-- Content -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:60px;position:relative;z-index:2;">
      
      <!-- Top badge -->
      <div style="background:rgba(0,210,211,0.1);border:1px solid rgba(0,210,211,0.25);border-radius:50px;padding:8px 28px;margin-bottom:50px;font-size:14px;color:#00d2d3;letter-spacing:1px;">
        Company Profile
      </div>

      <!-- Company name -->
      <div style="font-size:72px;font-weight:700;color:#00d2d3;letter-spacing:3px;margin-bottom:20px;text-align:center;">
        ASH Holding
      </div>

      <!-- Divider -->
      <div style="width:80px;height:3px;background:linear-gradient(90deg,#164e9f,#00d2d3);border-radius:2px;margin-bottom:30px;"></div>

      <!-- Arabic tagline -->
      <div style="font-size:26px;font-weight:500;color:#94a3b8;text-align:center;line-height:1.8;margin-bottom:15px;">
        نحو حلول رقمية ذكية لنمو أعمالك
      </div>

      <!-- Subtitle -->
      <div style="font-size:18px;color:#64748b;text-align:center;margin-bottom:60px;">
        الملف التعريفي للشركة
      </div>

      <!-- Year badge -->
      <div style="background:rgba(22,78,159,0.2);border:1px solid rgba(22,78,159,0.3);border-radius:12px;padding:12px 30px;">
        <span style="font-size:18px;font-weight:600;color:#3884f4;">${new Date().getFullYear()}</span>
      </div>
    </div>

    <!-- Bottom bar -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:8px;background:linear-gradient(90deg,#00d2d3,#164e9f,#7c3aed);"></div>
  `;
  return page;
}

// ─── PAGE 2: ABOUT US ───
function buildAboutPage(): HTMLDivElement {
  const page = createPageContainer();
  page.innerHTML = `
    <div style="padding:50px 50px 30px;">
      
      <!-- Section header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:35px;">
        <div style="width:4px;height:35px;background:#00d2d3;border-radius:2px;"></div>
        <div style="font-size:28px;font-weight:700;color:#ffffff;">من نحن</div>
      </div>

      <!-- About card -->
      <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:16px;padding:30px;margin-bottom:30px;">
        <div style="font-size:15px;line-height:2.2;color:#cbd5e1;">
          <p style="margin-bottom:12px;">شركة ASH Holding هي شركة تقنية سعودية متخصصة في تقديم حلول رقمية شاملة تساعد المؤسسات والأفراد على التحول الرقمي وتحقيق النمو المستدام.</p>
          <p>نجمع بين الخبرة التقنية العميقة والرؤية الإبداعية لنقدم نتائج استثنائية تتجاوز توقعات عملائنا. فريقنا المتخصص يعمل بشغف لضمان أن كل مشروع يحقق أهدافه بأعلى معايير الجودة والاحترافية.</p>
        </div>
      </div>

      <!-- Vision & Mission -->
      <div style="display:flex;gap:16px;margin-bottom:30px;">
        <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(0,210,211,0.2);border-radius:16px;padding:25px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#00d2d3;"></div>
            <div style="font-size:18px;font-weight:700;color:#ffffff;">رؤيتنا</div>
          </div>
          <div style="font-size:14px;line-height:2;color:#94a3b8;">
            أن نكون الشريك الرقمي الأول للشركات في المنطقة العربية، ونقدم حلولاً تقنية مبتكرة تسهم في تحقيق التميز الرقمي.
          </div>
        </div>
        <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(22,78,159,0.3);border-radius:16px;padding:25px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:15px;">
            <div style="width:12px;height:12px;border-radius:50%;background:#164e9f;"></div>
            <div style="font-size:18px;font-weight:700;color:#ffffff;">رسالتنا</div>
          </div>
          <div style="font-size:14px;line-height:2;color:#94a3b8;">
            تقديم حلول رقمية مبتكرة وعالية الجودة تحقق التميز والنمو المستدام لعملائنا في جميع القطاعات.
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:14px;">
        ${[
          { num: '+500', label: 'عميل سعيد' },
          { num: '+200', label: 'مشروع منجز' },
          { num: '+50', label: 'خدمة رقمية' },
          { num: '24/7', label: 'دعم متواصل' },
        ].map(s => `
          <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:14px;padding:20px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#00d2d3;margin-bottom:6px;">${s.num}</div>
            <div style="font-size:12px;color:#94a3b8;">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Bottom bar -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <!-- Page number -->
    <div style="position:absolute;bottom:15px;left:50%;transform:translateX(-50%);font-size:11px;color:#64748b;">2 / 5</div>
  `;
  return page;
}

// ─── PAGE 3: SERVICES ───
function buildServicesPage(): HTMLDivElement {
  const page = createPageContainer();

  const services = [
    {
      title: 'البرمجيات والأنظمة',
      color: '#3884f4',
      borderColor: 'rgba(56,132,244,0.3)',
      items: ['أنظمة ERP / CRM متكاملة', 'أنظمة محاسبية ومالية', 'حلول برمجية مخصصة', 'أتمتة العمليات التجارية'],
    },
    {
      title: 'المواقع والتطبيقات',
      color: '#00d2d3',
      borderColor: 'rgba(0,210,211,0.3)',
      items: ['مواقع شركات احترافية', 'متاجر إلكترونية متكاملة', 'تطبيقات ويب وجوال حديثة'],
    },
    {
      title: 'التصميم والهوية البصرية',
      color: '#a855f7',
      borderColor: 'rgba(168,85,247,0.3)',
      items: ['تصميم واجهات UI/UX', 'هوية بصرية كاملة', 'تصاميم رقمية إبداعية'],
    },
    {
      title: 'التسويق الرقمي',
      color: '#f97316',
      borderColor: 'rgba(249,115,22,0.3)',
      items: ['حملات إعلانية مدفوعة', 'تحسين محركات البحث SEO', 'إدارة منصات التواصل الاجتماعي'],
    },
  ];

  page.innerHTML = `
    <div style="padding:50px 50px 30px;">
      <!-- Section header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:35px;">
        <div style="width:4px;height:35px;background:#00d2d3;border-radius:2px;"></div>
        <div style="font-size:28px;font-weight:700;color:#ffffff;">خدماتنا</div>
      </div>

      <!-- Services grid -->
      <div style="display:flex;flex-wrap:wrap;gap:16px;">
        ${services.map(svc => `
          <div style="width:calc(50% - 8px);background:rgba(30,41,59,0.8);border:1px solid ${svc.borderColor};border-radius:16px;padding:25px;box-sizing:border-box;">
            <!-- Header -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${svc.color};"></div>
              <div style="font-size:17px;font-weight:700;color:#ffffff;">${svc.title}</div>
            </div>
            <!-- Items -->
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${svc.items.map(item => `
                <div style="display:flex;align-items:center;gap:8px;">
                  <div style="width:6px;height:6px;border-radius:50%;background:${svc.color};flex-shrink:0;"></div>
                  <div style="font-size:13px;color:#94a3b8;line-height:1.6;">${item}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Additional note -->
      <div style="margin-top:30px;background:rgba(0,210,211,0.06);border:1px solid rgba(0,210,211,0.15);border-radius:14px;padding:22px;text-align:center;">
        <div style="font-size:15px;color:#94a3b8;line-height:1.8;">
          نقدم حلولاً متكاملة مصممة خصيصاً لتلبية احتياجات عملك، مع ضمان أعلى معايير الجودة والأداء
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <div style="position:absolute;bottom:15px;left:50%;transform:translateX(-50%);font-size:11px;color:#64748b;">3 / 5</div>
  `;
  return page;
}

// ─── PAGE 4: TECHNOLOGIES + WHY US ───
function buildTechPage(): HTMLDivElement {
  const page = createPageContainer();

  const techs = [
    { name: 'React / Next.js', desc: 'واجهات مستخدم حديثة وتفاعلية', color: '#61dafb' },
    { name: 'Laravel / PHP', desc: 'تطوير الخادم والتطبيقات القوية', color: '#ff2d20' },
    { name: 'Python', desc: 'تحليل البيانات والذكاء الاصطناعي', color: '#ffd43b' },
    { name: 'Cloud Services', desc: 'خدمات سحابية متقدمة وآمنة', color: '#a855f7' },
    { name: 'APIs', desc: 'ربط الأنظمة والخدمات بسلاسة', color: '#10b981' },
    { name: 'Google Analytics', desc: 'تحليل البيانات وقياس الأداء', color: '#f97316' },
    { name: 'Meta Ads', desc: 'منصات الإعلانات الرقمية', color: '#3b82f6' },
    { name: 'TypeScript', desc: 'برمجة آمنة وموثوقة', color: '#3178c6' },
  ];

  const advantages = [
    { title: 'حلول مخصصة', desc: 'نصمم حلولاً فريدة تناسب طبيعة عملك الخاص', color: '#00d2d3' },
    { title: 'معايير عالمية', desc: 'نلتزم بأفضل الممارسات والمعايير الدولية في كل مشروع', color: '#3884f4' },
    { title: 'فريق محترف', desc: 'خبراء متخصصون في مختلف المجالات التقنية', color: '#a855f7' },
    { title: 'دعم مستمر', desc: 'دعم فني متواصل على مدار الساعة لضمان استمرارية أعمالك', color: '#f97316' },
  ];

  page.innerHTML = `
    <div style="padding:50px 50px 30px;">
      <!-- Technologies header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:25px;">
        <div style="width:4px;height:35px;background:#00d2d3;border-radius:2px;"></div>
        <div style="font-size:28px;font-weight:700;color:#ffffff;">التقنيات المستخدمة</div>
      </div>

      <!-- Tech grid -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:40px;">
        ${techs.map(t => `
          <div style="width:calc(25% - 9px);background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:12px;padding:16px;text-align:center;box-sizing:border-box;">
            <div style="width:14px;height:14px;border-radius:50%;background:${t.color};margin:0 auto 10px;"></div>
            <div style="font-size:12px;font-weight:600;color:#ffffff;margin-bottom:5px;">${t.name}</div>
            <div style="font-size:10px;color:#94a3b8;line-height:1.5;">${t.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Why Us header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:25px;">
        <div style="width:4px;height:35px;background:#00d2d3;border-radius:2px;"></div>
        <div style="font-size:28px;font-weight:700;color:#ffffff;">لماذا ASH Holding؟</div>
      </div>

      <!-- Advantages grid -->
      <div style="display:flex;flex-wrap:wrap;gap:14px;">
        ${advantages.map(a => `
          <div style="width:calc(50% - 7px);background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:14px;padding:22px;box-sizing:border-box;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <div style="width:10px;height:10px;border-radius:50%;background:${a.color};"></div>
              <div style="font-size:16px;font-weight:700;color:#ffffff;">${a.title}</div>
            </div>
            <div style="font-size:13px;color:#94a3b8;line-height:1.8;">${a.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Bottom bar -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:5px;background:linear-gradient(90deg,#164e9f,#00d2d3);"></div>
    <div style="position:absolute;bottom:15px;left:50%;transform:translateX(-50%);font-size:11px;color:#64748b;">4 / 5</div>
  `;
  return page;
}

// ─── PAGE 5: SECTORS + CONTACT ───
function buildContactPage(): HTMLDivElement {
  const page = createPageContainer();

  const sectors = [
    { name: 'شركات', color: '#3884f4' },
    { name: 'متاجر', color: '#00d2d3' },
    { name: 'رواد أعمال', color: '#a855f7' },
    { name: 'مؤسسات', color: '#f97316' },
    { name: 'شركات تقنية', color: '#10b981' },
  ];

  page.innerHTML = `
    <div style="padding:50px 50px 30px;">
      <!-- Sectors header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:30px;">
        <div style="width:4px;height:35px;background:#00d2d3;border-radius:2px;"></div>
        <div style="font-size:28px;font-weight:700;color:#ffffff;">القطاعات التي نخدمها</div>
      </div>

      <!-- Sectors -->
      <div style="display:flex;gap:14px;margin-bottom:50px;">
        ${sectors.map(s => `
          <div style="flex:1;background:rgba(30,41,59,0.8);border:1px solid rgba(51,65,85,0.5);border-radius:14px;padding:25px 15px;text-align:center;">
            <div style="width:40px;height:40px;border-radius:50%;background:${s.color};margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
              <div style="width:16px;height:16px;border-radius:3px;background:rgba(255,255,255,0.3);"></div>
            </div>
            <div style="font-size:13px;font-weight:600;color:#ffffff;">${s.name}</div>
          </div>
        `).join('')}
      </div>

      <!-- Contact header -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:30px;">
        <div style="width:4px;height:35px;background:#00d2d3;border-radius:2px;"></div>
        <div style="font-size:28px;font-weight:700;color:#ffffff;">تواصل معنا</div>
      </div>

      <!-- Contact card -->
      <div style="background:rgba(30,41,59,0.8);border:1px solid rgba(0,210,211,0.2);border-radius:20px;padding:40px;text-align:center;">
        
        <!-- CTA -->
        <div style="font-size:24px;font-weight:700;color:#00d2d3;margin-bottom:8px;line-height:1.6;">
          ابدأ مشروعك الرقمي معنا اليوم
        </div>
        <div style="font-size:14px;color:#64748b;margin-bottom:25px;">
          نحن مستعدون لتحويل أفكارك إلى واقع رقمي
        </div>

        <!-- Divider -->
        <div style="width:60px;height:2px;background:linear-gradient(90deg,#164e9f,#00d2d3);border-radius:1px;margin:0 auto 25px;"></div>

        <!-- Contact info -->
        <div style="display:flex;flex-direction:column;gap:14px;align-items:center;">
          <div style="font-size:15px;color:#cbd5e1;">
            <span style="color:#94a3b8;">الموقع الإلكتروني: </span>
            <span style="color:#00d2d3;font-weight:600;">ash-holding.sa</span>
          </div>
          <div style="font-size:15px;color:#cbd5e1;">
            <span style="color:#94a3b8;">البريد الإلكتروني: </span>
            <span style="color:#3884f4;font-weight:600;">info@ash-holding.sa</span>
          </div>
          <div style="font-size:15px;color:#cbd5e1;">
            <span style="color:#94a3b8;">الدعم الفني: </span>
            <span style="color:#3884f4;font-weight:600;">support@ash-holding.sa</span>
          </div>
          <div style="font-size:15px;color:#cbd5e1;">
            <span style="color:#94a3b8;">الهاتف: </span>
            <span style="font-weight:600;color:#ffffff;direction:ltr;display:inline-block;">0555812567</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="position:absolute;bottom:0;left:0;width:100%;height:50px;background:linear-gradient(90deg,#00d2d3,#164e9f,#7c3aed);display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:2px;">ASH Holding</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</div>
      </div>
    </div>
    <div style="position:absolute;bottom:58px;left:50%;transform:translateX(-50%);font-size:11px;color:#64748b;">5 / 5</div>
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
    buildContactPage(),
  ];

  // Hidden container
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;z-index:-1;';
  document.body.appendChild(wrapper);

  try {
    for (let i = 0; i < pages.length; i++) {
      wrapper.innerHTML = '';
      wrapper.appendChild(pages[i]);

      // Wait for fonts to load
      await document.fonts.ready;
      // Small delay to ensure rendering
      await new Promise(r => setTimeout(r, 100));

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
