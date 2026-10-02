import { ensureBrandedEmail } from "./email-template.ts";

// Shared email gateway client for Resend (connector-gateway backed).
// All Resend email sends MUST go through the Lovable connector gateway,
// not api.resend.com directly — why: the linked RESEND_API_KEY is a
// gateway connection key and is rejected by the direct Resend API.
export const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend/emails";

export interface EmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: { filename: string; content: string }[];
  tags?: { name: string; value: string }[];
}

export interface EmailGatewayError {
  message: string;
  name?: string;
  statusCode?: number;
}

export interface EmailSendResult {
  data: { id?: string } | null;
  error: EmailGatewayError | null;
}

export function brandedEmailPayload(payload: EmailPayload): EmailPayload {
  const sender = payload.from.toLowerCase();
  const department = sender.includes("billing") ? "الشؤون المالية"
    : sender.includes("orders") ? "إدارة الطلبات"
    : sender.includes("support") ? "خدمة العملاء"
    : sender.includes("security") ? "الأمن الرقمي"
    : sender.includes("hr") ? "الموارد البشرية"
    : sender.includes("kyc") ? "التحقق من الهوية"
    : "الإشعارات الرسمية";
  return { ...payload, html: ensureBrandedEmail(payload.html, payload.subject, department) };
}

export function emailGatewayHeaders(): Record<string, string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const connectionKey = Deno.env.get("RESEND_API_KEY");
  if (!lovableApiKey || !connectionKey) {
    throw new Error("Email gateway credentials are not configured");
  }
  return {
    "Authorization": `Bearer ${lovableApiKey}`,
    "X-Connection-Api-Key": connectionKey,
  };
}

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  try {
    const normalizedPayload = brandedEmailPayload(payload);
    const response = await fetch(RESEND_GATEWAY_URL, {
      method: "POST",
      headers: {
        ...emailGatewayHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedPayload),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error(`Resend gateway request failed [${response.status}]: ${text}`);
      return {
        data: null,
        error: { message: text || `Email send failed (${response.status})`, statusCode: response.status, name: "gateway_error" },
      };
    }
    let data: { id?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      // keep empty data on non-JSON 2xx body
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e), name: "gateway_error" } };
  }
}
