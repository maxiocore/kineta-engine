export type EmailTone = "brand" | "info" | "success" | "warning" | "danger" | "security" | "financial";

export interface EmailDetail {
  label: string;
  value: string | number;
  dir?: "rtl" | "ltr";
  emphasis?: boolean;
}

export interface BrandedEmailOptions {
  title: string;
  preheader?: string;
  department?: string;
  recipientName?: string;
  intro?: string;
  tone?: EmailTone;
  status?: string;
  amount?: string;
  code?: string;
  details?: EmailDetail[];
  content?: string;
  action?: { label: string; url: string };
  notice?: string;
  noticeTitle?: string;
  replyEmail?: string;
  reference?: string;
  legal?: "standard" | "financial" | "security" | "privacy" | "employment";
}

const palette: Record<EmailTone, { accent: string; soft: string; dark: string }> = {
  brand: { accent: "#0f9ea8", soft: "#e8f8f8", dark: "#083344" },
  info: { accent: "#1677c8", soft: "#eaf4fc", dark: "#123a5a" },
  success: { accent: "#14866d", soft: "#e9f7f2", dark: "#103f35" },
  warning: { accent: "#b7791f", soft: "#fff8e7", dark: "#5f3b08" },
  danger: { accent: "#c24141", soft: "#fff0f0", dark: "#641d1d" },
  security: { accent: "#2563a9", soft: "#edf5fc", dark: "#102f4c" },
  financial: { accent: "#087f68", soft: "#e8f7f3", dark: "#103c34" },
};

export function escapeEmailHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function safeEmailUrl(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? escapeEmailHtml(url.toString()) : "https://ash-holding.sa";
  } catch {
    return "https://ash-holding.sa";
  }
}

function legalCopy(type: BrandedEmailOptions["legal"]): string {
  if (type === "financial") return "هذا إشعار إلكتروني بالعملية المسجلة في حسابك، ولا يُعد فاتورة ضريبية أو كشف حساب مصرفياً. عند وجود اختلاف، يُعتد بالسجلات والمستندات المعتمدة في حسابك.";
  if (type === "security") return "هذه رسالة أمنية آلية. لا تشارك رموز التحقق أو بيانات الدخول مع أي شخص؛ لن يطلبها فريق ASH HOLDING منك عبر الهاتف أو الرسائل.";
  if (type === "privacy") return "تُعالج بياناتك وفق سياسة الخصوصية ولغرض تنفيذ الخدمة فقط. قد نحتفظ بسجل هذا الإشعار للامتثال وحماية الحساب.";
  if (type === "employment") return "تُعامل بيانات طلب التوظيف بسرية وتستخدم لأغراض التقييم والتواصل المهني فقط. لا تمثل هذه الرسالة عرضاً وظيفياً أو التزاماً بالتوظيف.";
  return "هذه رسالة خدمية مرتبطة بإجراء أو تحديث في حسابك. التفاصيل المعتمدة هي الظاهرة داخل حسابك على المنصة.";
}

export function renderBrandedEmail(options: BrandedEmailOptions): string {
  const tone = palette[options.tone ?? "brand"];
  const name = escapeEmailHtml(options.recipientName || "عميلنا العزيز");
  const department = escapeEmailHtml(options.department || "خدمات العملاء");
  const title = escapeEmailHtml(options.title);
  const preheader = escapeEmailHtml(options.preheader || options.title);
  const intro = options.intro ? `<p style="margin:0 0 22px;color:#43546a;font-size:15px;line-height:1.9;">${escapeEmailHtml(options.intro)}</p>` : "";
  const status = options.status ? `<span style="display:inline-block;padding:7px 13px;border-radius:6px;background:${tone.soft};color:${tone.dark};border:1px solid ${tone.accent};font-size:12px;font-weight:700;">${escapeEmailHtml(options.status)}</span>` : "";
  const amount = options.amount ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${tone.dark};border-radius:8px;"><tr><td align="center" style="padding:24px 16px;"><span style="display:block;color:#b8dfe1;font-size:12px;margin-bottom:8px;">المبلغ</span><strong dir="ltr" style="display:block;color:#ffffff;font-size:30px;line-height:1.2;">${escapeEmailHtml(options.amount)}</strong></td></tr></table>` : "";
  const code = options.code ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:#f4f8fa;border:1px solid #bddde0;border-radius:8px;"><tr><td align="center" style="padding:24px 12px;"><span style="display:block;color:#64748b;font-size:12px;margin-bottom:10px;">رمز التحقق</span><strong dir="ltr" style="display:block;color:${tone.dark};font-family:'Courier New',monospace;font-size:36px;letter-spacing:8px;">${escapeEmailHtml(options.code)}</strong></td></tr></table>` : "";
  const details = options.details?.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border:1px solid #dbe4ea;border-radius:8px;border-collapse:separate;overflow:hidden;">${options.details.map((row, index) => `<tr><td style="width:42%;padding:13px 16px;${index ? "border-top:1px solid #e6edf1;" : ""}background:#f7f9fb;color:#64748b;font-size:13px;">${escapeEmailHtml(row.label)}</td><td dir="${row.dir || "rtl"}" style="padding:13px 16px;${index ? "border-top:1px solid #e6edf1;" : ""}color:#102a43;font-size:14px;font-weight:${row.emphasis ? "700" : "600"};text-align:left;">${escapeEmailHtml(row.value)}</td></tr>`).join("")}</table>` : "";
  const action = options.action ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px;"><tr><td style="background:${tone.accent};border-radius:7px;"><a href="${safeEmailUrl(options.action.url)}" style="display:inline-block;padding:14px 30px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${escapeEmailHtml(options.action.label)}</a></td></tr></table>` : "";
  const notice = options.notice ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:${tone.soft};border-right:4px solid ${tone.accent};border-radius:6px;"><tr><td style="padding:15px 17px;color:${tone.dark};font-size:12px;line-height:1.8;"><strong style="display:block;margin-bottom:3px;">${escapeEmailHtml(options.noticeTitle || "تنبيه مهم")}</strong>${escapeEmailHtml(options.notice)}</td></tr></table>` : "";
  const reply = escapeEmailHtml(options.replyEmail || "info@ash-holding.sa");
  const ref = options.reference ? ` · المرجع: <span dir="ltr">${escapeEmailHtml(options.reference)}</span>` : "";

  return `<!doctype html><html lang="ar" dir="rtl" data-ash-email="v2"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${title}</title></head><body style="margin:0;padding:0;background:#f2f6f8;font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif;color:#102a43;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#f2f6f8;border-collapse:collapse;"><tr><td align="center" style="padding:28px 12px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce7ec;border-radius:8px;border-collapse:separate;overflow:hidden;box-shadow:0 12px 30px rgba(8,51,68,.08);"><tr><td style="height:6px;background:${tone.accent};font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:24px 28px;background:#0b1f33;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="right"><div style="color:#ffffff;font-size:21px;font-weight:800;">ASH HOLDING</div><div style="color:#9fcbd0;font-size:12px;margin-top:5px;">حلول رقمية موثوقة</div></td><td align="left" style="color:#d9eef0;font-size:12px;">${department}</td></tr></table></td></tr><tr><td style="padding:30px 28px 8px;">${status}<h1 style="margin:14px 0 12px;color:#0b1f33;font-size:24px;line-height:1.5;">${title}</h1><p style="margin:0 0 10px;color:#102a43;font-size:15px;line-height:1.8;">مرحباً ${name}،</p>${intro}${amount}${code}${details}${options.content || ""}${action}${notice}</td></tr><tr><td style="padding:22px 28px 28px;"><div style="height:1px;background:#dce7ec;margin-bottom:18px;"></div><p style="margin:0 0 8px;color:#5f7183;font-size:11px;line-height:1.8;">${legalCopy(options.legal)}</p><p style="margin:0;color:#7b8c9d;font-size:11px;line-height:1.8;">للمساعدة: <a href="mailto:${reply}" style="color:${tone.accent};text-decoration:none;">${reply}</a> · <a href="tel:+966555812567" dir="ltr" style="color:${tone.accent};text-decoration:none;">+966 55 581 2567</a>${ref}</p></td></tr><tr><td align="center" style="padding:16px 24px;background:#edf3f5;border-top:1px solid #dce7ec;color:#738496;font-size:10px;line-height:1.7;">© ${new Date().getFullYear()} ASH HOLDING. جميع الحقوق محفوظة.<br><a href="https://ash-holding.sa/privacy" style="color:#52697c;text-decoration:underline;">سياسة الخصوصية</a> · <a href="https://ash-holding.sa/terms" style="color:#52697c;text-decoration:underline;">الشروط والأحكام</a></td></tr></table></td></tr></table></body></html>`;
}

export function ensureBrandedEmail(
  html: string,
  title: string,
  department = "الإشعارات",
  tone: EmailTone = "brand",
  legal: BrandedEmailOptions["legal"] = "standard",
  replyEmail = "info@ash-holding.sa",
) {
  if (html.includes('data-ash-email="v2"')) return html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch?.[1] || html;
  return renderBrandedEmail({
    title,
    department,
    tone,
    intro: "نرفق لك تفاصيل الإشعار أدناه.",
    content: `<div data-ash-email="v2" style="margin-top:20px;">${body}</div>`,
    legal,
    replyEmail,
  });
}