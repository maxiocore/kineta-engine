/**
 * نظام سير عمل سند الأمر المستقل
 * Executive Bond Workflow System
 * 
 * الحالات:
 * - NOT_ISSUED: لم يصدر بعد
 * - ISSUING: جاري الإصدار
 * - SENT_TO_CLIENT: تم الإرسال للعميل
 * - SIGNED_BY_CLIENT: موقع من العميل
 * - VERIFIED_BY_ADMIN: معتمد من الأدمن
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// Types
// ============================================
type BondStatus = 'NOT_ISSUED' | 'ISSUING' | 'ISSUED' | 'SENT_TO_CLIENT' | 'SIGNED_BY_CLIENT' | 'VERIFIED_BY_ADMIN';
type ActionType = 'start_issuing' | 'mark_issued' | 'send_to_client' | 'client_confirm_signed' | 'admin_verify';

interface BondActionRequest {
  action: ActionType;
  application_id: string;
  bond_id?: string;
  admin_notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// WhatsApp Templates
// ============================================
const WHATSAPP_TEMPLATES = {
  ISSUING: {
    template: 'executive_bond_issuing',
    message: (name: string, appNumber: string) => 
      `عزيزي ${name}،\n\nجاري إصدار سند الأمر الخاص بطلب التمويل رقم ${appNumber}.\n\nسيتم إعلامك فور جاهزية السند للتوقيع.\n\nشركة علي صالح الشهري القابضة`
  },
  SENT_TO_CLIENT: {
    template: 'executive_bond_ready',
    message: (name: string, appNumber: string) => 
      `عزيزي ${name}،\n\n✅ سند الأمر جاهز للتوقيع!\n\nرقم الطلب: ${appNumber}\n\nيرجى الدخول لمنصة نافذ وتوقيع السند، ثم تأكيد التوقيع من خلال حسابك في منصتنا.\n\nشركة علي صالح الشهري القابضة`
  },
  SIGNED_BY_CLIENT: {
    template: 'executive_bond_signed',
    message: (name: string, appNumber: string) => 
      `عزيزي ${name}،\n\n🎉 تم استلام تأكيد توقيعك على السند!\n\nرقم الطلب: ${appNumber}\n\nجاري مراجعة واعتماد السند من قبل الإدارة.\n\nشركة علي صالح الشهري القابضة`
  },
  VERIFIED_BY_ADMIN: {
    template: 'executive_bond_verified',
    message: (name: string, appNumber: string) => 
      `عزيزي ${name}،\n\n✅ تم اعتماد سند الأمر بنجاح!\n\nرقم الطلب: ${appNumber}\n\nجميع المستندات مكتملة. سيتم تفعيل رصيد الخدمات قريباً.\n\nشركة علي صالح الشهري القابضة`
  }
};

// ============================================
// Transition Rules
// ============================================
const VALID_TRANSITIONS: Record<BondStatus, { nextStates: BondStatus[], actors: ('admin' | 'customer' | 'system')[] }[]> = {
  'NOT_ISSUED': [
    { nextStates: ['ISSUING'], actors: ['admin'] }
  ],
  'ISSUING': [
    { nextStates: ['ISSUED'], actors: ['admin'] },
    { nextStates: ['SENT_TO_CLIENT'], actors: ['admin'] } // يمكن الانتقال مباشرة
  ],
  'ISSUED': [
    { nextStates: ['SENT_TO_CLIENT'], actors: ['admin'] }
  ],
  'SENT_TO_CLIENT': [
    { nextStates: ['SIGNED_BY_CLIENT'], actors: ['customer'] }
  ],
  'SIGNED_BY_CLIENT': [
    { nextStates: ['VERIFIED_BY_ADMIN'], actors: ['admin'] }
  ],
  'VERIFIED_BY_ADMIN': []
};

// ============================================
// Main Handler
// ============================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      if (userId) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        isAdmin = roles?.some(r => r.role === 'admin') || false;
      }
    }

    const body: BondActionRequest = await req.json();
    const { action, application_id, bond_id, admin_notes, metadata } = body;

    console.log(`[ExecutiveBond] Action: ${action}, Application: ${application_id}, User: ${userId}, IsAdmin: ${isAdmin}`);

    // Get application and bond data
    const { data: application, error: appError } = await supabase
      .from('financing_applications')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          phone,
          email
        )
      `)
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: 'Application not found', errorAr: 'الطلب غير موجود' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create bond
    let bond = null;
    if (bond_id) {
      const { data } = await supabase
        .from('financing_executive_bonds')
        .select('*')
        .eq('id', bond_id)
        .single();
      bond = data;
    } else {
      const { data } = await supabase
        .from('financing_executive_bonds')
        .select('*')
        .eq('application_id', application_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      bond = data;
    }

    // Handle action
    let result;
    switch (action) {
      case 'start_issuing':
        result = await handleStartIssuing(supabase, application, bond, userId, isAdmin, metadata);
        break;
      case 'mark_issued':
        result = await handleMarkIssued(supabase, application, bond, userId, isAdmin, metadata);
        break;
      case 'send_to_client':
        result = await handleSendToClient(supabase, application, bond, userId, isAdmin, metadata);
        break;
      case 'client_confirm_signed':
        result = await handleClientConfirmSigned(supabase, application, bond, userId, req);
        break;
      case 'admin_verify':
        result = await handleAdminVerify(supabase, application, bond, userId, isAdmin, admin_notes);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', errorAr: 'إجراء غير صالح' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[ExecutiveBond] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, errorAr: 'حدث خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// Action Handlers
// ============================================

async function handleStartIssuing(
  supabase: any,
  application: any,
  bond: any,
  userId: string | null,
  isAdmin: boolean,
  metadata?: Record<string, unknown>
) {
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', errorAr: 'غير مصرح' };
  }

  const fromStatus = bond?.status || 'NOT_ISSUED';
  const toStatus: BondStatus = 'ISSUING';

  // Create or update bond
  let bondId = bond?.id;
  if (!bond) {
    const bondNumber = `BOND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { data: newBond, error } = await supabase
      .from('financing_executive_bonds')
      .insert({
        application_id: application.id,
        bond_number: bondNumber,
        bond_amount: application.approved_amount,
        status: toStatus
      })
      .select()
      .single();
    
    if (error) throw error;
    bondId = newBond.id;

    // Link to application
    await supabase
      .from('financing_applications')
      .update({ 
        executive_bond_id: bondId,
        executive_bond_state: toStatus
      })
      .eq('id', application.id);
  } else {
    await supabase
      .from('financing_executive_bonds')
      .update({ status: toStatus })
      .eq('id', bondId);

    await supabase
      .from('financing_applications')
      .update({ executive_bond_state: toStatus })
      .eq('id', application.id);
  }

  // Log event
  await logBondEvent(supabase, bondId, application.id, 'STATUS_CHANGED', fromStatus, toStatus, userId, 'admin', metadata);

  // Send WhatsApp notification
  await sendWhatsAppNotification(supabase, application, toStatus, bondId);

  return { 
    success: true, 
    bond_id: bondId,
    status: toStatus,
    message: 'Bond issuance started',
    messageAr: 'تم بدء إصدار السند'
  };
}

async function handleMarkIssued(
  supabase: any,
  application: any,
  bond: any,
  userId: string | null,
  isAdmin: boolean,
  metadata?: Record<string, unknown>
) {
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', errorAr: 'غير مصرح' };
  }

  if (!bond) {
    return { success: false, error: 'Bond not found', errorAr: 'السند غير موجود' };
  }

  const fromStatus = bond.status;
  const toStatus: BondStatus = 'ISSUED';

  await supabase
    .from('financing_executive_bonds')
    .update({ 
      status: toStatus,
      issued_at: new Date().toISOString(),
      issued_by: userId
    })
    .eq('id', bond.id);

  await supabase
    .from('financing_applications')
    .update({ executive_bond_state: toStatus })
    .eq('id', application.id);

  await logBondEvent(supabase, bond.id, application.id, 'STATUS_CHANGED', fromStatus, toStatus, userId, 'admin', metadata);

  return { 
    success: true, 
    bond_id: bond.id,
    status: toStatus,
    message: 'Bond marked as issued',
    messageAr: 'تم تسجيل إصدار السند'
  };
}

async function handleSendToClient(
  supabase: any,
  application: any,
  bond: any,
  userId: string | null,
  isAdmin: boolean,
  metadata?: Record<string, unknown>
) {
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', errorAr: 'غير مصرح' };
  }

  if (!bond) {
    return { success: false, error: 'Bond not found', errorAr: 'السند غير موجود' };
  }

  const fromStatus = bond.status;
  const toStatus: BondStatus = 'SENT_TO_CLIENT';

  await supabase
    .from('financing_executive_bonds')
    .update({ 
      status: toStatus,
      sent_to_client_at: new Date().toISOString(),
      sent_to_client_by: userId
    })
    .eq('id', bond.id);

  await supabase
    .from('financing_applications')
    .update({ 
      executive_bond_state: toStatus,
      executive_bond_sent_at: new Date().toISOString()
    })
    .eq('id', application.id);

  await logBondEvent(supabase, bond.id, application.id, 'SENT_TO_CLIENT', fromStatus, toStatus, userId, 'admin', metadata);

  // Send WhatsApp notification
  await sendWhatsAppNotification(supabase, application, toStatus, bond.id);

  return { 
    success: true, 
    bond_id: bond.id,
    status: toStatus,
    message: 'Bond sent to client',
    messageAr: 'تم إرسال السند للعميل'
  };
}

async function handleClientConfirmSigned(
  supabase: any,
  application: any,
  bond: any,
  userId: string | null,
  req: Request
) {
  // Verify the user owns this application
  if (application.user_id !== userId) {
    return { success: false, error: 'Unauthorized', errorAr: 'غير مصرح' };
  }

  if (!bond) {
    return { success: false, error: 'Bond not found', errorAr: 'السند غير موجود' };
  }

  if (bond.status !== 'SENT_TO_CLIENT') {
    return { success: false, error: 'Bond not ready for signing', errorAr: 'السند غير جاهز للتوقيع' };
  }

  const fromStatus = bond.status;
  const toStatus: BondStatus = 'SIGNED_BY_CLIENT';
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  await supabase
    .from('financing_executive_bonds')
    .update({ 
      status: toStatus,
      signed_by_client_at: new Date().toISOString(),
      signed_by_client_ip: clientIp,
      signed_by_client_user_agent: userAgent,
      customer_confirmation_at: new Date().toISOString(),
      customer_confirmation_ip: clientIp
    })
    .eq('id', bond.id);

  await supabase
    .from('financing_applications')
    .update({ 
      executive_bond_state: toStatus,
      executive_bond_signed_at: new Date().toISOString()
    })
    .eq('id', application.id);

  await logBondEvent(
    supabase, 
    bond.id, 
    application.id, 
    'CLIENT_CONFIRMED_SIGNED', 
    fromStatus, 
    toStatus, 
    userId, 
    'customer',
    { ip: clientIp, userAgent }
  );

  // Send WhatsApp notification
  await sendWhatsAppNotification(supabase, application, toStatus, bond.id);

  return { 
    success: true, 
    bond_id: bond.id,
    status: toStatus,
    message: 'Signature confirmed',
    messageAr: 'تم تأكيد التوقيع بنجاح'
  };
}

async function handleAdminVerify(
  supabase: any,
  application: any,
  bond: any,
  userId: string | null,
  isAdmin: boolean,
  adminNotes?: string
) {
  if (!isAdmin) {
    return { success: false, error: 'Unauthorized', errorAr: 'غير مصرح' };
  }

  if (!bond) {
    return { success: false, error: 'Bond not found', errorAr: 'السند غير موجود' };
  }

  if (bond.status !== 'SIGNED_BY_CLIENT') {
    return { success: false, error: 'Bond not ready for verification', errorAr: 'السند غير جاهز للاعتماد' };
  }

  const fromStatus = bond.status;
  const toStatus: BondStatus = 'VERIFIED_BY_ADMIN';

  await supabase
    .from('financing_executive_bonds')
    .update({ 
      status: toStatus,
      verified_by_admin_at: new Date().toISOString(),
      verified_by_admin_id: userId,
      admin_verification_notes: adminNotes
    })
    .eq('id', bond.id);

  // Update application to move to credit pending
  await supabase
    .from('financing_applications')
    .update({ 
      executive_bond_state: toStatus,
      workflow_status: 'CREDIT_PENDING',
      status: 'approved'
    })
    .eq('id', application.id);

  await logBondEvent(
    supabase, 
    bond.id, 
    application.id, 
    'ADMIN_VERIFIED', 
    fromStatus, 
    toStatus, 
    userId, 
    'admin',
    { notes: adminNotes }
  );

  // Send WhatsApp notification
  await sendWhatsAppNotification(supabase, application, toStatus, bond.id);

  return { 
    success: true, 
    bond_id: bond.id,
    status: toStatus,
    message: 'Bond verified and approved',
    messageAr: 'تم اعتماد السند بنجاح'
  };
}

// ============================================
// Helper Functions
// ============================================

async function logBondEvent(
  supabase: any,
  bondId: string,
  applicationId: string,
  eventType: string,
  fromStatus: string,
  toStatus: string,
  actorId: string | null,
  actorRole: 'admin' | 'customer' | 'system',
  metadata?: Record<string, unknown>
) {
  try {
    await supabase
      .from('executive_bond_events')
      .insert({
        bond_id: bondId,
        application_id: applicationId,
        event_type: eventType,
        from_status: fromStatus,
        to_status: toStatus,
        actor_id: actorId,
        actor_role: actorRole,
        metadata: metadata || {}
      });

    // Also log to financing_activity_log for unified timeline
    await supabase
      .from('financing_activity_log')
      .insert({
        application_id: applicationId,
        event_type: `BOND_${eventType}`,
        from_status: fromStatus,
        to_status: toStatus,
        actor_id: actorId,
        triggered_by: actorRole,
        is_visible_to_customer: true,
        metadata: {
          bond_id: bondId,
          ...metadata
        }
      });
  } catch (error) {
    console.error('[ExecutiveBond] Error logging event:', error);
  }
}

async function sendWhatsAppNotification(
  supabase: any,
  application: any,
  status: BondStatus,
  bondId: string
) {
  try {
    const template = WHATSAPP_TEMPLATES[status as keyof typeof WHATSAPP_TEMPLATES];
    if (!template) return;

    const phone = application.phone || application.profiles?.phone;
    const name = application.full_name || application.profiles?.full_name || 'العميل الكريم';
    const appNumber = application.application_number;

    if (!phone) {
      console.log('[ExecutiveBond] No phone number for WhatsApp notification');
      return;
    }

    // Format phone number
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '966' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('966')) {
      formattedPhone = '966' + formattedPhone;
    }

    const message = template.message(name, appNumber);

    // Call SmartWats API
    const smartwatsApiKey = Deno.env.get('SMARTWATS_API_KEY');
    const smartwatsInstanceId = Deno.env.get('SMARTWATS_INSTANCE_ID');

    if (!smartwatsApiKey || !smartwatsInstanceId) {
      console.log('[ExecutiveBond] SmartWats not configured, skipping WhatsApp');
      return;
    }

    const response = await fetch('https://api.smartwats.com/api/v1.3/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${smartwatsApiKey}`
      },
      body: JSON.stringify({
        instance_id: smartwatsInstanceId,
        phone: formattedPhone,
        message: message
      })
    });

    const result = await response.json();
    console.log('[ExecutiveBond] WhatsApp sent:', result);

    // Update bond with WhatsApp status
    await supabase
      .from('financing_executive_bonds')
      .update({
        whatsapp_notification_sent_at: new Date().toISOString(),
        whatsapp_notification_status: response.ok ? 'sent' : 'failed'
      })
      .eq('id', bondId);

    // Update event with WhatsApp info
    await supabase
      .from('executive_bond_events')
      .update({
        whatsapp_sent: response.ok,
        whatsapp_message_id: result.message_id
      })
      .eq('bond_id', bondId)
      .eq('to_status', status)
      .order('created_at', { ascending: false })
      .limit(1);

  } catch (error) {
    console.error('[ExecutiveBond] WhatsApp error:', error);
  }
}
