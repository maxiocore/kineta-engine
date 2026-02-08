import { supabase } from "@/integrations/supabase/client";

/**
 * Send SMS notification for badges and rewards events
 * Fetches user phone from profiles and calls sms-notify edge function
 */
async function getUserPhone(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", userId)
      .maybeSingle();
    return data?.phone || null;
  } catch {
    return null;
  }
}

export async function sendBadgeAwardedSms(
  userId: string,
  badgeName: string,
  badgeIcon: string,
  badgeTier: number
) {
  const phone = await getUserPhone(userId);
  if (!phone) return;

  const message = [
    `🏆 تهانينا! حصلت على شارة جديدة`,
    ``,
    `مرحباً بك 👋`,
    `لقد حصلت على شارة "${badgeName}"`,
    ``,
    `🎖️ الشارة: ${badgeIcon} ${badgeName}`,
    `📊 المستوى: ${badgeTier}`,
    ``,
    `💡 استمر في التقدم للحصول على المزيد!`,
    `━━━━━━━━━━━━━━`,
    `فريق المكافآت | ASH HOLDING`,
    `ash-holding.sa`,
  ].join('\n');

  try {
    await supabase.functions.invoke('sms-notify', {
      body: {
        phone,
        message,
        type: 'notification',
        userId,
      },
    });
  } catch (err) {
    console.error('[Badge SMS] Error:', err);
  }
}

export async function sendBadgeRevokedSms(
  userId: string,
  badgeName: string
) {
  const phone = await getUserPhone(userId);
  if (!phone) return;

  const message = [
    `📋 تحديث على الشارات`,
    ``,
    `مرحباً بك 👋`,
    `تم تحديث شاراتك - تمت إزالة شارة "${badgeName}"`,
    ``,
    `📱 يمكنك مراجعة شاراتك من حسابك`,
    `━━━━━━━━━━━━━━`,
    `فريق المكافآت | ASH HOLDING`,
    `ash-holding.sa`,
  ].join('\n');

  try {
    await supabase.functions.invoke('sms-notify', {
      body: {
        phone,
        message,
        type: 'notification',
        userId,
      },
    });
  } catch (err) {
    console.error('[Badge SMS] Error:', err);
  }
}

export async function sendPointsEarnedSms(
  userId: string,
  points: number,
  reason: string,
  totalPoints?: number
) {
  const phone = await getUserPhone(userId);
  if (!phone) return;

  const message = [
    `⭐ تم إضافة نقاط مكافآت`,
    ``,
    `مرحباً بك 👋`,
    `تم إضافة نقاط جديدة إلى رصيدك!`,
    ``,
    `🎯 النقاط المضافة: +${points.toLocaleString('ar-SA')} نقطة`,
    `📝 السبب: ${reason}`,
    totalPoints != null ? `💰 رصيدك الحالي: ${totalPoints.toLocaleString('ar-SA')} نقطة` : '',
    ``,
    `💡 اجمع نقاط أكثر واستبدلها بخصومات!`,
    `━━━━━━━━━━━━━━`,
    `فريق المكافآت | ASH HOLDING`,
    `ash-holding.sa`,
  ].filter(Boolean).join('\n');

  try {
    await supabase.functions.invoke('sms-notify', {
      body: {
        phone,
        message,
        type: 'notification',
        userId,
      },
    });
  } catch (err) {
    console.error('[Points SMS] Error:', err);
  }
}

export async function sendPointsDeductedSms(
  userId: string,
  points: number,
  reason: string,
  remainingPoints?: number
) {
  const phone = await getUserPhone(userId);
  if (!phone) return;

  const message = [
    `📋 تحديث على نقاط المكافآت`,
    ``,
    `مرحباً بك 👋`,
    `تم تحديث رصيد نقاطك`,
    ``,
    `🔻 النقاط المخصومة: -${points.toLocaleString('ar-SA')} نقطة`,
    `📝 السبب: ${reason}`,
    remainingPoints != null ? `💰 الرصيد المتبقي: ${remainingPoints.toLocaleString('ar-SA')} نقطة` : '',
    ``,
    `📱 يمكنك مراجعة التفاصيل من حسابك`,
    `━━━━━━━━━━━━━━`,
    `فريق المكافآت | ASH HOLDING`,
    `ash-holding.sa`,
  ].filter(Boolean).join('\n');

  try {
    await supabase.functions.invoke('sms-notify', {
      body: {
        phone,
        message,
        type: 'notification',
        userId,
      },
    });
  } catch (err) {
    console.error('[Points SMS] Error:', err);
  }
}

export async function sendPointsRedeemedSms(
  userId: string,
  points: number,
  balanceAdded: number,
  remainingPoints?: number
) {
  const phone = await getUserPhone(userId);
  if (!phone) return;

  const message = [
    `🎁 تم استبدال نقاطك بنجاح`,
    ``,
    `مرحباً بك 👋`,
    `تم استبدال نقاطك بخصم على رصيدك!`,
    ``,
    `🔄 النقاط المستبدلة: ${points.toLocaleString('ar-SA')} نقطة`,
    `💵 المبلغ المضاف: ${balanceAdded.toFixed(2)} ر.س`,
    remainingPoints != null ? `💰 الرصيد المتبقي: ${remainingPoints.toLocaleString('ar-SA')} نقطة` : '',
    ``,
    `✅ تم إضافة المبلغ لرصيدك`,
    `━━━━━━━━━━━━━━`,
    `فريق المكافآت | ASH HOLDING`,
    `ash-holding.sa`,
  ].filter(Boolean).join('\n');

  try {
    await supabase.functions.invoke('sms-notify', {
      body: {
        phone,
        message,
        type: 'notification',
        userId,
      },
    });
  } catch (err) {
    console.error('[Points SMS] Error:', err);
  }
}
