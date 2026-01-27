import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Generating weekly admin report...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get all admins
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins || admins.length === 0) {
      console.log("No admins found");
      return new Response(JSON.stringify({ success: false, error: "No admins found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get admin emails
    const adminIds = admins.map(a => a.user_id);
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', adminIds);

    // ============ ORDERS STATISTICS ============
    // This week orders
    const { data: thisWeekOrders, count: thisWeekOrdersCount } = await supabase
      .from('orders')
      .select('id, status, total_price', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    // Last week orders (for comparison)
    const { count: lastWeekOrdersCount } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    // Revenue (only completed, in_progress, processing)
    const thisWeekRevenue = thisWeekOrders
      ?.filter(o => ['completed', 'in_progress', 'processing'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

    // Orders by status
    const ordersByStatus = {
      pending: thisWeekOrders?.filter(o => o.status === 'pending').length || 0,
      confirmed: thisWeekOrders?.filter(o => o.status === 'confirmed').length || 0,
      in_progress: thisWeekOrders?.filter(o => o.status === 'in_progress').length || 0,
      processing: thisWeekOrders?.filter(o => o.status === 'processing').length || 0,
      completed: thisWeekOrders?.filter(o => o.status === 'completed').length || 0,
      cancelled: thisWeekOrders?.filter(o => o.status === 'cancelled').length || 0,
      refunded: thisWeekOrders?.filter(o => o.status === 'refunded').length || 0,
    };

    // ============ DEPOSITS STATISTICS ============
    const { data: thisWeekDeposits, count: thisWeekDepositsCount } = await supabase
      .from('deposits')
      .select('id, amount, status, total_credited', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    const { count: lastWeekDepositsCount } = await supabase
      .from('deposits')
      .select('id', { count: 'exact' })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    const completedDeposits = thisWeekDeposits?.filter(d => d.status === 'completed') || [];
    const totalDepositsAmount = completedDeposits.reduce((sum, d) => sum + Number(d.total_credited), 0);
    const pendingDepositsCount = thisWeekDeposits?.filter(d => d.status === 'pending').length || 0;

    // ============ NEW USERS STATISTICS ============
    const { count: thisWeekUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    const { count: lastWeekUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    // ============ SUPPORT TICKETS ============
    const { data: thisWeekTickets, count: thisWeekTicketsCount } = await supabase
      .from('support_tickets')
      .select('id, status', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    const openTickets = thisWeekTickets?.filter(t => t.status === 'open').length || 0;
    const resolvedTickets = thisWeekTickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

    // ============ TOP SERVICES ============
    const { data: topServicesData } = await supabase
      .from('orders')
      .select('service_id, services(name)')
      .gte('created_at', weekAgo.toISOString())
      .eq('status', 'completed');

    const serviceCount: Record<string, { name: string; count: number }> = {};
    topServicesData?.forEach(order => {
      const serviceId = order.service_id;
      const serviceName = (order.services as any)?.name || 'غير معروف';
      if (!serviceCount[serviceId]) {
        serviceCount[serviceId] = { name: serviceName, count: 0 };
      }
      serviceCount[serviceId].count++;
    });

    const topServices = Object.entries(serviceCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Calculate changes
    const ordersChange = lastWeekOrdersCount ? 
      (((thisWeekOrdersCount || 0) - lastWeekOrdersCount) / lastWeekOrdersCount * 100).toFixed(1) : '0';
    const depositsChange = lastWeekDepositsCount ? 
      (((thisWeekDepositsCount || 0) - lastWeekDepositsCount) / lastWeekDepositsCount * 100).toFixed(1) : '0';
    const usersChange = lastWeekUsersCount ? 
      (((thisWeekUsersCount || 0) - lastWeekUsersCount) / lastWeekUsersCount * 100).toFixed(1) : '0';

    const reportDate = now.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const weekStartDate = weekAgo.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric'
    });

    const weekEndDate = now.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric'
    });

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>التقرير الأسبوعي</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; color: #ffffff;">
  <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 20px 20px 0 0;">
      <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 35px; font-weight: bold; color: white;">M</span>
      </div>
      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: white;">📊 التقرير الأسبوعي</h1>
      <p style="margin: 15px 0 0; font-size: 16px; color: rgba(255,255,255,0.9);">
        ${weekStartDate} - ${weekEndDate}
      </p>
    </div>
    
    <!-- Main Content -->
    <div style="background: linear-gradient(180deg, #13131a 0%, #1a1a24 100%); padding: 30px; border-radius: 0 0 20px 20px; border: 1px solid rgba(99, 102, 241, 0.2); border-top: none;">
      
      <!-- Quick Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
        
        <!-- Orders Card -->
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">📦</div>
          <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${thisWeekOrdersCount || 0}</div>
          <div style="font-size: 14px; color: #a0a0b0; margin-top: 5px;">إجمالي الطلبات</div>
          <div style="font-size: 12px; margin-top: 8px; color: ${Number(ordersChange) >= 0 ? '#22c55e' : '#ef4444'};">
            ${Number(ordersChange) >= 0 ? '↑' : '↓'} ${Math.abs(Number(ordersChange))}% عن الأسبوع السابق
          </div>
        </div>
        
        <!-- Revenue Card -->
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 16px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">💰</div>
          <div style="font-size: 28px; font-weight: bold; color: #22c55e;">$${thisWeekRevenue.toFixed(2)}</div>
          <div style="font-size: 14px; color: #a0a0b0; margin-top: 5px;">الإيرادات</div>
        </div>
        
        <!-- Deposits Card -->
        <div style="background: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 16px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">💳</div>
          <div style="font-size: 28px; font-weight: bold; color: #f97316;">$${totalDepositsAmount.toFixed(2)}</div>
          <div style="font-size: 14px; color: #a0a0b0; margin-top: 5px;">الإيداعات (${completedDeposits.length})</div>
          <div style="font-size: 12px; margin-top: 8px; color: ${Number(depositsChange) >= 0 ? '#22c55e' : '#ef4444'};">
            ${Number(depositsChange) >= 0 ? '↑' : '↓'} ${Math.abs(Number(depositsChange))}% عن الأسبوع السابق
          </div>
        </div>
        
        <!-- New Users Card -->
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; padding: 20px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">👥</div>
          <div style="font-size: 28px; font-weight: bold; color: #a855f7;">${thisWeekUsersCount || 0}</div>
          <div style="font-size: 14px; color: #a0a0b0; margin-top: 5px;">مستخدمين جدد</div>
          <div style="font-size: 12px; margin-top: 8px; color: ${Number(usersChange) >= 0 ? '#22c55e' : '#ef4444'};">
            ${Number(usersChange) >= 0 ? '↑' : '↓'} ${Math.abs(Number(usersChange))}% عن الأسبوع السابق
          </div>
        </div>
        
      </div>
      
      <!-- Orders Breakdown -->
      <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 20px; font-size: 18px; color: #8b5cf6;">
          📋 تفاصيل الطلبات
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #a0a0b0;">قيد الانتظار</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fbbf24; text-align: left; font-weight: bold;">${ordersByStatus.pending}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #a0a0b0;">مؤكد</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #3b82f6; text-align: left; font-weight: bold;">${ordersByStatus.confirmed}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #a0a0b0;">قيد التنفيذ</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #8b5cf6; text-align: left; font-weight: bold;">${ordersByStatus.in_progress + ordersByStatus.processing}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #a0a0b0;">مكتمل</td>
            <td style="padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #22c55e; text-align: left; font-weight: bold;">${ordersByStatus.completed}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #a0a0b0;">ملغي / مسترد</td>
            <td style="padding: 10px 0; color: #ef4444; text-align: left; font-weight: bold;">${ordersByStatus.cancelled + ordersByStatus.refunded}</td>
          </tr>
        </table>
      </div>
      
      <!-- Support Tickets -->
      <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 16px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; font-size: 18px; color: #eab308;">
          🎫 تذاكر الدعم
        </h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #ffffff;">${thisWeekTicketsCount || 0}</div>
            <div style="font-size: 13px; color: #a0a0b0;">إجمالي التذاكر</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #fbbf24;">${openTickets}</div>
            <div style="font-size: 13px; color: #a0a0b0;">مفتوحة</div>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: bold; color: #22c55e;">${resolvedTickets}</div>
            <div style="font-size: 13px; color: #a0a0b0;">محلولة</div>
          </div>
        </div>
      </div>
      
      <!-- Top Services -->
      ${topServices.length > 0 ? `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 25px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 20px; font-size: 18px; color: #10b981;">
          🏆 أفضل الخدمات
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${topServices.map(([_, service], index) => `
          <tr>
            <td style="padding: 10px 0; ${index < topServices.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.1);' : ''} color: #ffffff;">
              <span style="background: rgba(16, 185, 129, 0.3); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">#${index + 1}</span>
              ${service.name.substring(0, 40)}${service.name.length > 40 ? '...' : ''}
            </td>
            <td style="padding: 10px 0; ${index < topServices.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.1);' : ''} color: #10b981; text-align: left; font-weight: bold;">${service.count} طلب</td>
          </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
      
      <!-- Pending Actions Alert -->
      ${pendingDepositsCount > 0 || openTickets > 0 ? `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; font-size: 16px; color: #ef4444;">
          ⚠️ تتطلب انتباهك
        </h3>
        <ul style="margin: 0; padding: 0 20px; color: #a0a0b0; font-size: 14px;">
          ${pendingDepositsCount > 0 ? `<li style="margin-bottom: 8px;">${pendingDepositsCount} إيداعات في انتظار الموافقة</li>` : ''}
          ${openTickets > 0 ? `<li>${openTickets} تذاكر دعم مفتوحة</li>` : ''}
        </ul>
      </div>
      ` : ''}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://maxiocore.com/admin" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: bold; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);">
          🚀 فتح لوحة التحكم
        </a>
      </div>
      
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 25px 20px;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #a0a0b0;">
        تقرير آلي من MaxioCore • ${reportDate}
      </p>
      <p style="margin: 0; font-size: 11px; color: #606070;">
        يُرسل هذا التقرير أسبوعياً كل يوم أحد
      </p>
    </div>
    
  </div>
</body>
</html>
    `;

    // Send email to all admins
    let sentCount = 0;
    for (const admin of adminProfiles || []) {
      if (admin.email) {
        try {
          await resend.emails.send({
            from: "MaxioCore <onboarding@resend.dev>",
            to: [admin.email],
            subject: `📊 التقرير الأسبوعي - ${weekStartDate} إلى ${weekEndDate}`,
            html: emailHtml,
          });
          
          // Log email
          await supabase.from('emails').insert({
            recipient_email: admin.email,
            recipient_name: admin.full_name,
            subject: `التقرير الأسبوعي - ${weekStartDate} إلى ${weekEndDate}`,
            content: emailHtml,
            status: 'sent',
            sent_at: new Date().toISOString()
          });
          
          sentCount++;
          console.log(`Weekly report sent to: ${admin.email}`);
        } catch (err) {
          console.error(`Failed to send to ${admin.email}:`, err);
        }
      }
    }

    console.log(`Weekly report sent to ${sentCount} admins`);

    return new Response(JSON.stringify({ 
      success: true, 
      sentCount,
      stats: {
        orders: thisWeekOrdersCount,
        revenue: thisWeekRevenue,
        deposits: completedDeposits.length,
        depositsAmount: totalDepositsAmount,
        newUsers: thisWeekUsersCount,
        tickets: thisWeekTicketsCount
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in weekly-admin-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
