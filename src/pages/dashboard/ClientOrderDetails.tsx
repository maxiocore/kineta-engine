import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, Hash, Calendar, ShoppingBag, LinkIcon, 
  Copy, Check, ExternalLink, Zap, Shield, Loader2,
  CheckCircle, XCircle, AlertCircle, Package, ArrowRight,
  MessageCircle, RefreshCw, History, Download,
  Sparkles, TrendingUp, RotateCcw, DollarSign, 
  FileText, Share2, Printer, Star, ChevronDown, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_price: number;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  link: string | null;
  quantity: number | null;
  external_order_id: string | null;
  external_status: string | null;
  discount_amount: number | null;
  service: {
    id: string;
    name: string;
    price: number;
    category: string;
    description: string | null;
  };
}

interface OrderStatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

interface ProviderStatus {
  success: boolean;
  hasExternalOrder: boolean;
  externalOrderId?: string;
  providerName?: string;
  status?: string;
  startCount?: number | null;
  remains?: number | null;
  charge?: number | null;
  currency?: string;
  delivered?: number | null;
  orderedQuantity?: number | null;
  error?: string;
  message?: string;
}

// ترجمة حالة الطلب من الإنجليزية إلى العربية
const translateProviderStatus = (status: string | undefined): string => {
  if (!status) return '-';
  const statusMap: Record<string, string> = {
    'Pending': 'قيد الانتظار',
    'pending': 'قيد الانتظار',
    'In progress': 'قيد التنفيذ',
    'in_progress': 'قيد التنفيذ',
    'In Progress': 'قيد التنفيذ',
    'Processing': 'قيد المعالجة',
    'processing': 'قيد المعالجة',
    'Completed': 'مكتمل',
    'completed': 'مكتمل',
    'Partial': 'جزئي',
    'partial': 'جزئي',
    'Cancelled': 'ملغي',
    'cancelled': 'ملغي',
    'Canceled': 'ملغي',
    'canceled': 'ملغي',
    'Refunded': 'مسترد',
    'refunded': 'مسترد',
    'Failed': 'فشل',
    'failed': 'فشل',
    'Error': 'خطأ',
    'error': 'خطأ',
    'Active': 'نشط',
    'active': 'نشط',
    'Running': 'قيد التشغيل',
    'running': 'قيد التشغيل',
    'Started': 'بدأ',
    'started': 'بدأ',
  };
  return statusMap[status] || status;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": 
      return { 
        label: "قيد الانتظار", 
        color: "text-amber-600 dark:text-amber-400", 
        bg: "bg-amber-50 dark:bg-amber-950/30", 
        border: "border-amber-200 dark:border-amber-800", 
        gradient: "from-amber-500 to-orange-500",
        glowColor: "shadow-amber-500/30",
        icon: Clock, 
        progress: 10 
      };
    case "processing": 
      return { 
        label: "قيد المعالجة", 
        color: "text-blue-600 dark:text-blue-400", 
        bg: "bg-blue-50 dark:bg-blue-950/30", 
        border: "border-blue-200 dark:border-blue-800", 
        gradient: "from-blue-500 to-cyan-500",
        glowColor: "shadow-blue-500/30",
        icon: Loader2, 
        progress: 30 
      };
    case "in_progress": 
      return { 
        label: "قيد التنفيذ", 
        color: "text-violet-600 dark:text-violet-400", 
        bg: "bg-violet-50 dark:bg-violet-950/30", 
        border: "border-violet-200 dark:border-violet-800", 
        gradient: "from-violet-500 to-purple-500",
        glowColor: "shadow-violet-500/30",
        icon: Zap, 
        progress: 60 
      };
    case "completed": 
      return { 
        label: "مكتمل", 
        color: "text-emerald-600 dark:text-emerald-400", 
        bg: "bg-emerald-50 dark:bg-emerald-950/30", 
        border: "border-emerald-200 dark:border-emerald-800", 
        gradient: "from-emerald-500 to-green-500",
        glowColor: "shadow-emerald-500/30",
        icon: CheckCircle, 
        progress: 100 
      };
    case "partial": 
      return { 
        label: "مكتمل جزئي", 
        color: "text-orange-600 dark:text-orange-400", 
        bg: "bg-orange-50 dark:bg-orange-950/30", 
        border: "border-orange-200 dark:border-orange-800", 
        gradient: "from-orange-500 to-amber-500",
        glowColor: "shadow-orange-500/30",
        icon: AlertCircle, 
        progress: 80 
      };
    case "cancelled": 
      return { 
        label: "ملغي", 
        color: "text-rose-600 dark:text-rose-400", 
        bg: "bg-rose-50 dark:bg-rose-950/30", 
        border: "border-rose-200 dark:border-rose-800", 
        gradient: "from-rose-500 to-red-500",
        glowColor: "shadow-rose-500/30",
        icon: XCircle, 
        progress: 0 
      };
    case "refunded": 
      return { 
        label: "مسترد", 
        color: "text-slate-600 dark:text-slate-400", 
        bg: "bg-slate-50 dark:bg-slate-950/30", 
        border: "border-slate-200 dark:border-slate-800", 
        gradient: "from-slate-500 to-gray-500",
        glowColor: "shadow-slate-500/30",
        icon: RotateCcw, 
        progress: 0 
      };
    default: 
      return { 
        label: status, 
        color: "text-muted-foreground", 
        bg: "bg-muted/50", 
        border: "border-border", 
        gradient: "from-muted to-muted",
        glowColor: "shadow-muted/30",
        icon: Clock, 
        progress: 0 
      };
  }
};

const ClientOrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [loadingProviderStatus, setLoadingProviderStatus] = useState(false);

  useEffect(() => {
    if (user && orderId) {
      fetchOrder();
      fetchOrderHistory();
      fetchProviderStatus();

      // Realtime subscription
      const channel = supabase
        .channel(`order-${orderId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null);
          fetchOrderHistory();
          toast.info("تم تحديث حالة الطلب");
        })
        .subscribe();

      // Auto-refresh provider status every 30 seconds
      const providerStatusInterval = setInterval(() => {
        fetchProviderStatus();
      }, 30000);

      return () => { 
        supabase.removeChannel(channel);
        clearInterval(providerStatusInterval);
      };
    }
  }, [user, orderId]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_price, notes, admin_notes, 
        created_at, updated_at, link, quantity, external_order_id, 
        external_status, discount_amount, 
        service:services(id, name, price, category, description)
      `)
      .eq("id", orderId)
      .eq("user_id", user?.id)
      .single();
    
    if (error || !data) {
      toast.error("لم يتم العثور على الطلب");
      navigate('/dashboard/orders');
    } else {
      setOrder(data as unknown as Order);
    }
    setLoading(false);
  };

  const fetchOrderHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    
    if (!error && data) setOrderHistory(data);
    setLoadingHistory(false);
  };

  const fetchProviderStatus = async () => {
    if (!orderId) return;
    setLoadingProviderStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-order-provider-status', {
        body: { orderId }
      });
      
      if (error) {
        console.error('Error fetching provider status:', error);
        setProviderStatus({ success: false, hasExternalOrder: false, error: error.message });
      } else {
        setProviderStatus(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setProviderStatus({ success: false, hasExternalOrder: false, error: 'فشل في جلب البيانات' });
    }
    setLoadingProviderStatus(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("تم نسخ الرابط");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const generatePDF = useCallback(() => {
    if (!order) return;
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      in_progress: 'In Progress',
      completed: 'Completed',
      partial: 'Partial',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };
    
    // Header
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 55, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('MARKETO', 105, 28, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice', 105, 42, { align: 'center' });
    
    // Invoice Details Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 65, 180, 35, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, 65, 180, 35, 4, 4, 'S');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text('Invoice Number:', 185, 77, { align: 'right' });
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(order.order_number, 185, 85, { align: 'right' });
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 25, 77);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(format(new Date(order.created_at), 'dd/MM/yyyy'), 25, 85);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(format(new Date(order.created_at), 'HH:mm'), 25, 92);
    
    const statusText = statusLabels[order.status] || order.status;
    let statusColor: [number, number, number] = [100, 116, 139];
    if (order.status === 'completed') statusColor = [16, 185, 129];
    else if (order.status === 'pending') statusColor = [245, 158, 11];
    else if (order.status === 'in_progress' || order.status === 'processing') statusColor = [59, 130, 246];
    else if (order.status === 'cancelled' || order.status === 'refunded') statusColor = [239, 68, 68];
    
    doc.setFillColor(...statusColor);
    doc.roundedRect(80, 88, 50, 10, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText.toUpperCase(), 105, 95, { align: 'center' });
    
    let yPos = 115;
    
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(15, yPos, 180, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Details', 105, yPos + 7, { align: 'center' });
    
    yPos += 18;
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPos, 180, 45, 4, 4, 'F');
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Service Name:', 25, yPos + 10);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const serviceName = order.service?.name || 'N/A';
    doc.text(serviceName.length > 50 ? serviceName.substring(0, 50) + '...' : serviceName, 25, yPos + 18);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Category:', 25, yPos + 30);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(order.service?.category || 'N/A', 25, yPos + 38);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('Quantity:', 140, yPos + 10);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text((order.quantity || 1).toLocaleString(), 140, yPos + 20);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Unit Price:', 140, yPos + 30);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    const unitPrice = order.service?.price || 0;
    doc.text(unitPrice.toFixed(4) + ' SAR', 140, yPos + 38);
    
    yPos += 55;
    
    doc.setFillColor(14, 165, 233);
    doc.roundedRect(15, yPos, 180, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary', 105, yPos + 7, { align: 'center' });
    
    yPos += 18;
    
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, 180, 55, 4, 4, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, yPos, 180, 55, 4, 4, 'S');
    
    const basePrice = (order.service?.price || 0) * (order.quantity || 1);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Unit Price x Quantity', 25, yPos + 12);
    doc.setTextColor(30, 41, 59);
    doc.text(`${unitPrice.toFixed(4)} x ${(order.quantity || 1).toLocaleString()}`, 185, yPos + 12, { align: 'right' });
    
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal', 25, yPos + 24);
    doc.setTextColor(30, 41, 59);
    doc.text(basePrice.toFixed(2) + ' SAR', 185, yPos + 24, { align: 'right' });
    
    if (order.discount_amount && order.discount_amount > 0) {
      doc.setTextColor(16, 185, 129);
      doc.text('Discount', 25, yPos + 36);
      doc.text('-' + order.discount_amount.toFixed(2) + ' SAR', 185, yPos + 36, { align: 'right' });
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(25, yPos + 42, 185, yPos + 42);
    
    doc.setTextColor(14, 165, 233);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid', 25, yPos + 52);
    doc.setFontSize(14);
    doc.text(order.total_price.toFixed(2) + ' SAR', 185, yPos + 52, { align: 'right' });
    
    yPos += 65;
    
    if (order.link) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, yPos, 180, 20, 4, 4, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Link:', 25, yPos + 8);
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(8);
      const displayLink = order.link.length > 70 ? order.link.substring(0, 70) + '...' : order.link;
      doc.text(displayLink, 25, yPos + 16);
      yPos += 28;
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(15, 270, 195, 270);
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an electronically generated invoice. No signature required.', 105, 278, { align: 'center' });
    doc.text('Generated: ' + format(new Date(), 'dd/MM/yyyy HH:mm'), 105, 284, { align: 'center' });
    
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 290, 210, 7, 'F');
    
    doc.save(`Invoice-${order.order_number}.pdf`);
    toast.success('تم تحميل الفاتورة بنجاح');
  }, [order]);

  const generateArabicPDF = useCallback(async () => {
    if (!order || !user) return;
    
    toast.loading('جاري إنشاء الفاتورة...');

    // Fetch customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const customerName = profile?.full_name || user.user_metadata?.full_name || 'العميل';
    const customerEmail = profile?.email || user.email || '-';
    const customerPhone = user.phone || user.user_metadata?.phone || '-';
    
    const statusLabels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      partial: 'مكتمل جزئياً',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return { bg: '#D1FAE5', text: '#065F46' };
        case 'pending': return { bg: '#FEF3C7', text: '#92400E' };
        case 'in_progress':
        case 'processing': return { bg: '#DBEAFE', text: '#1E40AF' };
        case 'cancelled':
        case 'refunded': return { bg: '#FEE2E2', text: '#991B1B' };
        default: return { bg: '#F3F4F6', text: '#374151' };
      }
    };

    const unitPrice = order.service?.price || 0;
    const basePrice = unitPrice * (order.quantity || 1);
    const statusStyle = getStatusColor(order.status);
    const invoiceDate = format(new Date(order.created_at), 'dd/MM/yyyy');
    const invoiceTime = format(new Date(order.created_at), 'HH:mm');

    // Create clean professional invoice HTML - A4 size optimized
    const container = document.createElement('div');
    container.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 794px; background: white;';
    
    // Load Cairo font for Arabic support
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Wait for font to load
    await new Promise(resolve => setTimeout(resolve, 500));

    container.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        * { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif !important; }
      </style>
      <div style="direction: rtl; font-family: 'Cairo', sans-serif; background: #ffffff; min-height: 842px; position: relative; padding: 0;">
        
        <!-- Header -->
        <div style="background: #1F2937; padding: 30px 40px;">
          <table style="width: 100%;">
            <tr>
              <td style="width: 50%;">
                <p style="color: #FFFFFF; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: 2px;">ASH HOLDING</p>
                <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0; font-weight: 400;">منصة الخدمات الرقمية</p>
              </td>
              <td style="width: 50%; text-align: left;">
                <p style="color: #9CA3AF; font-size: 11px; margin: 0; font-weight: 600;">فاتورة ضريبية مبسطة</p>
                <p style="color: #FFFFFF; font-size: 14px; margin: 5px 0 0; font-weight: 700;">TAX INVOICE</p>
              </td>
            </tr>
          </table>
        </div>

        <!-- Invoice Info Bar -->
        <div style="background: #4F46E5; padding: 16px 40px;">
          <table style="width: 100%;">
            <tr>
              <td>
                <span style="color: rgba(255,255,255,0.7); font-size: 12px;">رقم الفاتورة:</span>
                <span style="color: #FFFFFF; font-size: 16px; font-weight: 700; margin-right: 8px;">#ORD-${order.order_number}</span>
              </td>
              <td style="text-align: left;">
                <span style="background: ${statusStyle.bg}; color: ${statusStyle.text}; padding: 6px 20px; border-radius: 20px; font-size: 12px; font-weight: 700;">${statusLabels[order.status] || order.status}</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Main Content -->
        <div style="padding: 30px 40px;">
          
          <!-- Two Column Info -->
          <table style="width: 100%; margin-bottom: 25px;">
            <tr>
              <td style="width: 48%; vertical-align: top; padding-left: 15px;">
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px;">
                  <p style="color: #6B7280; font-size: 11px; margin: 0 0 12px; font-weight: 600; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">بيانات العميل</p>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 6px 0;">
                        <p style="color: #9CA3AF; font-size: 10px; margin: 0;">الاسم</p>
                        <p style="color: #111827; font-size: 13px; font-weight: 700; margin: 3px 0 0;">${customerName}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0;">
                        <p style="color: #9CA3AF; font-size: 10px; margin: 0;">البريد الإلكتروني</p>
                        <p style="color: #374151; font-size: 11px; font-weight: 600; margin: 3px 0 0; direction: ltr; text-align: right;">${customerEmail}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0;">
                        <p style="color: #9CA3AF; font-size: 10px; margin: 0;">رقم الجوال</p>
                        <p style="color: #374151; font-size: 12px; font-weight: 600; margin: 3px 0 0; direction: ltr; text-align: right;">${customerPhone}</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
              <td style="width: 48%; vertical-align: top; padding-right: 15px;">
                <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px;">
                  <p style="color: #6B7280; font-size: 11px; margin: 0 0 12px; font-weight: 600; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">تفاصيل الفاتورة</p>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 6px 0;">
                        <p style="color: #9CA3AF; font-size: 10px; margin: 0;">تاريخ الإصدار</p>
                        <p style="color: #111827; font-size: 14px; font-weight: 700; margin: 3px 0 0;">${invoiceDate}</p>
                        <p style="color: #9CA3AF; font-size: 10px; margin: 2px 0 0;">${invoiceTime}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0;">
                        <p style="color: #9CA3AF; font-size: 10px; margin: 0;">التصنيف</p>
                        <p style="color: #374151; font-size: 12px; font-weight: 600; margin: 3px 0 0;">${order.service?.category || 'عام'}</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>

          <!-- Service Details Table -->
          <div style="margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #1F2937;">
                  <th style="color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 12px 15px; text-align: right; border-radius: 6px 0 0 0;">الخدمة</th>
                  <th style="color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 12px 15px; text-align: center;">الكمية</th>
                  <th style="color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 12px 15px; text-align: center;">سعر الوحدة</th>
                  <th style="color: #FFFFFF; font-size: 11px; font-weight: 600; padding: 12px 15px; text-align: left; border-radius: 0 6px 0 0;">المجموع</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                  <td style="padding: 15px; font-size: 12px; color: #111827; font-weight: 600; max-width: 200px;">
                    ${order.service?.name || 'خدمة'}
                  </td>
                  <td style="padding: 15px; font-size: 13px; color: #4F46E5; font-weight: 700; text-align: center;">
                    ${(order.quantity || 1).toLocaleString()}
                  </td>
                  <td style="padding: 15px; font-size: 12px; color: #374151; font-weight: 600; text-align: center;">
                    ${unitPrice.toFixed(4)} ر.س
                  </td>
                  <td style="padding: 15px; font-size: 13px; color: #111827; font-weight: 700; text-align: left;">
                    ${basePrice.toFixed(2)} ر.س
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Payment Summary -->
          <div style="margin-bottom: 25px;">
            <table style="width: 100%; max-width: 350px; margin-right: auto;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 12px;">المجموع الفرعي</td>
                <td style="padding: 8px 0; color: #111827; font-size: 12px; font-weight: 600; text-align: left;">${basePrice.toFixed(2)} ر.س</td>
              </tr>
              ${order.discount_amount && order.discount_amount > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #059669; font-size: 12px;">الخصم</td>
                <td style="padding: 8px 0; color: #059669; font-size: 12px; font-weight: 600; text-align: left;">- ${order.discount_amount.toFixed(2)} ر.س</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-size: 12px;">ضريبة القيمة المضافة (0%)</td>
                <td style="padding: 8px 0; color: #6B7280; font-size: 12px; text-align: left;">0.00 ر.س</td>
              </tr>
              <tr style="border-top: 2px solid #1F2937;">
                <td style="padding: 15px 0 8px; color: #111827; font-size: 14px; font-weight: 700;">الإجمالي</td>
                <td style="padding: 15px 0 8px; color: #4F46E5; font-size: 18px; font-weight: 800; text-align: left;">${order.total_price.toFixed(2)} ر.س</td>
              </tr>
            </table>
          </div>

          ${order.link ? `
          <!-- Target Link -->
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 12px 15px; margin-bottom: 20px;">
            <p style="color: #1E40AF; font-size: 10px; margin: 0 0 5px; font-weight: 600;">الرابط المستهدف</p>
            <p style="color: #1E3A8A; font-size: 10px; margin: 0; word-break: break-all; direction: ltr; text-align: left;">${order.link}</p>
          </div>
          ` : ''}

        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 20px 40px;">
          <table style="width: 100%;">
            <tr>
              <td style="vertical-align: middle;">
                <p style="color: #6B7280; font-size: 10px; margin: 0; line-height: 1.6;">
                  فاتورة إلكترونية صادرة من منصة ASH HOLDING
                </p>
                <p style="color: #9CA3AF; font-size: 9px; margin: 5px 0 0;">
                  تاريخ الطباعة: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
                </p>
                <p style="color: #9CA3AF; font-size: 9px; margin: 5px 0 0;">
                  info@ash-holding.sa | www.ash-holding.sa
                </p>
              </td>
              <td style="text-align: left; vertical-align: middle;">
                <p style="color: #6B7280; font-size: 9px; margin: 0; text-align: center;">شكراً لتعاملكم معنا</p>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Bottom Bar -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #1F2937 0%, #4F46E5 100%);"></div>
        
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`فاتورة-ORD-${order.order_number}.pdf`);

      toast.dismiss();
      toast.success('تم تحميل الفاتورة بنجاح');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.dismiss();
      toast.error('حدث خطأ أثناء إنشاء الفاتورة');
    } finally {
      document.body.removeChild(container);
      document.head.removeChild(fontLink);
    }
  }, [order, user]);

  const shareViaWhatsApp = useCallback(() => {
    if (!order) return;
    
    const statusLabels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      partial: 'مكتمل جزئياً',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
    };
    
    const message = `
🧾 *فاتورة طلب - MARKETO*

📋 *رقم الطلب:* ${order.order_number}
📅 *التاريخ:* ${format(new Date(order.created_at), 'dd/MM/yyyy - HH:mm')}
📊 *الحالة:* ${statusLabels[order.status] || order.status}

🛍️ *تفاصيل الخدمة:*
• الخدمة: ${order.service?.name || 'غير محدد'}
• التصنيف: ${order.service?.category || 'غير محدد'}
• الكمية: ${(order.quantity || 1).toLocaleString('ar-SA')}
• سعر الوحدة: ${(order.service?.price || 0).toFixed(4)} ر.س

💰 *ملخص الدفع:*
• المجموع الفرعي: ${((order.service?.price || 0) * (order.quantity || 1)).toFixed(2)} ر.س
${order.discount_amount && order.discount_amount > 0 ? `• الخصم: -${order.discount_amount.toFixed(2)} ر.س` : ''}
• *المجموع المدفوع: ${order.total_price.toFixed(2)} ر.س*

${order.link ? `🔗 *الرابط:* ${order.link}` : ''}
    `.trim();
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    toast.success('تم فتح واتساب للمشاركة');
  }, [order]);

  const shareViaEmail = useCallback(() => {
    if (!order) return;
    
    const statusLabels: Record<string, string> = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      in_progress: 'قيد التنفيذ',
      completed: 'مكتمل',
      partial: 'مكتمل جزئياً',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
    };
    
    const subject = `فاتورة طلب #${order.order_number} - MARKETO`;
    const body = `
فاتورة طلب - MARKETO
========================

رقم الطلب: ${order.order_number}
التاريخ: ${format(new Date(order.created_at), 'dd/MM/yyyy - HH:mm')}
الحالة: ${statusLabels[order.status] || order.status}

تفاصيل الخدمة:
--------------
الخدمة: ${order.service?.name || 'غير محدد'}
التصنيف: ${order.service?.category || 'غير محدد'}
الكمية: ${(order.quantity || 1).toLocaleString('ar-SA')}
سعر الوحدة: ${(order.service?.price || 0).toFixed(4)} ر.س

ملخص الدفع:
-----------
المجموع الفرعي: ${((order.service?.price || 0) * (order.quantity || 1)).toFixed(2)} ر.س
${order.discount_amount && order.discount_amount > 0 ? `الخصم: -${order.discount_amount.toFixed(2)} ر.س\n` : ''}المجموع المدفوع: ${order.total_price.toFixed(2)} ر.س

${order.link ? `الرابط: ${order.link}` : ''}

========================
هذه فاتورة إلكترونية من MARKETO
    `.trim();
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    toast.success('تم فتح البريد الإلكتروني للمشاركة');
  }, [order]);

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6 p-4" dir="rtl">
          <Skeleton className="h-10 w-48" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const isAnimating = order.status === "in_progress" || order.status === "processing";
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  const steps = [
    { key: "pending", label: "تم الاستلام", icon: Package },
    { key: "processing", label: "قيد المعالجة", icon: Loader2 },
    { key: "in_progress", label: "قيد التنفيذ", icon: Zap },
    { key: "completed", label: "مكتمل", icon: CheckCircle },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === order.status);

  return (
    <ClientDashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard/orders')}
              className="rounded-xl"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
              <p className="text-sm text-muted-foreground font-mono">{order.order_number}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* أزرار الفاتورة تظهر فقط عند اكتمال الطلب */}
            {order.status === 'completed' && (
              <>
                <Button variant="outline" size="sm" onClick={generatePDF} className="gap-2 rounded-xl">
                  <Download className="w-4 h-4" />
                  EN
                </Button>
                <Button variant="outline" size="sm" onClick={generateArabicPDF} className="gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
                  <FileText className="w-4 h-4" />
                  عربي
                </Button>
                <Button variant="outline" size="sm" onClick={shareViaWhatsApp} className="gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40">
                  <MessageCircle className="w-4 h-4" />
                  واتساب
                </Button>
                <Button variant="outline" size="sm" onClick={shareViaEmail} className="gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  <Mail className="w-4 h-4" />
                  إيميل
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={fetchOrder} className="gap-2 rounded-xl">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden border-0 shadow-xl">
                <div className={cn("p-6 relative", statusConfig.bg)}>
                  <motion.div 
                    className={cn("absolute inset-0 bg-gradient-to-br opacity-20", statusConfig.gradient)}
                    animate={{ opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div className="relative flex items-center gap-4">
                    <motion.div
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl",
                        "bg-gradient-to-br", statusConfig.gradient
                      )}
                      animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <StatusIcon className={cn("w-8 h-8 text-white", isAnimating && "animate-pulse")} />
                      {order.status === "completed" && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        </motion.div>
                      )}
                    </motion.div>
                    <div>
                      <Badge 
                        className={cn(
                          "text-sm font-bold px-4 py-1.5 rounded-xl border-0 bg-gradient-to-r text-white shadow-lg",
                          statusConfig.gradient
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        آخر تحديث: {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Steps */}
                {!isCancelled && (
                  <CardContent className="pt-6">
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute top-6 right-8 left-8 h-1 bg-muted rounded-full">
                        <motion.div
                          className="h-full bg-gradient-to-l from-primary to-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, currentStepIndex) / (steps.length - 1) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>

                      <div className="relative flex justify-between">
                        {steps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;
                          const stepConfig = getStatusConfig(step.key);

                          return (
                            <motion.div
                              key={step.key}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex flex-col items-center"
                            >
                              <motion.div
                                className={cn(
                                  "relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg z-10",
                                  isCompleted 
                                    ? `bg-gradient-to-br ${stepConfig.gradient}` 
                                    : "bg-muted"
                                )}
                                animate={isCurrent ? { 
                                  boxShadow: ["0 0 0 0 rgba(0,0,0,0)", "0 0 20px 5px rgba(147,51,234,0.3)", "0 0 0 0 rgba(0,0,0,0)"]
                                } : {}}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <StepIcon className={cn(
                                  "w-5 h-5",
                                  isCompleted ? "text-white" : "text-muted-foreground"
                                )} />
                              </motion.div>
                              <p className={cn(
                                "mt-2 text-xs font-medium text-center",
                                isCurrent ? "text-primary" : isCompleted ? stepConfig.color : "text-muted-foreground"
                              )}>
                                {step.label}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                )}

                {/* Cancelled/Refunded State */}
                {isCancelled && (
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-4 py-4">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-xl"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {order.status === "cancelled" ? (
                          <XCircle className="w-8 h-8 text-white" />
                        ) : (
                          <RotateCcw className="w-8 h-8 text-white" />
                        )}
                      </motion.div>
                      <div>
                        <p className="font-bold text-lg text-rose-600 dark:text-rose-400">
                          {order.status === "cancelled" ? "تم إلغاء الطلب" : "تم استرداد المبلغ"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.status === "cancelled" ? "لقد تم إلغاء هذا الطلب" : "تم إرجاع المبلغ لرصيدك"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* Provider Status Card */}
            {order.external_order_id && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        بيانات الحساب
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchProviderStatus}
                        disabled={loadingProviderStatus}
                        className="gap-2 h-8 rounded-lg text-xs"
                      >
                        {loadingProviderStatus ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        تحديث
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!providerStatus && !loadingProviderStatus && (
                      <div className="text-center py-4">
                        <Button
                          variant="outline"
                          onClick={fetchProviderStatus}
                          className="gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          جلب بيانات المزود
                        </Button>
                      </div>
                    )}

                    {loadingProviderStatus && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
                      </div>
                    )}

                    {providerStatus && !loadingProviderStatus && (
                      <>
                        {providerStatus.success && providerStatus.hasExternalOrder ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-cyan-200/50 dark:border-cyan-800/50 text-center">
                              <p className="text-xs text-muted-foreground mb-1">عدد البدء</p>
                              <p className="font-bold text-lg text-cyan-600 dark:text-cyan-400">
                                {providerStatus.startCount?.toLocaleString() ?? '-'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                              <p className="text-xs text-muted-foreground mb-1">تم التسليم</p>
                              <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                {providerStatus.delivered?.toLocaleString() ?? '-'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-amber-200/50 dark:border-amber-800/50 text-center">
                              <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
                              <p className="font-bold text-lg text-amber-600 dark:text-amber-400">
                                {providerStatus.remains?.toLocaleString() ?? '-'}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-200/50 dark:border-purple-800/50 text-center">
                              <p className="text-xs text-muted-foreground mb-1">حالة الطلب</p>
                              <p className="font-bold text-sm text-purple-600 dark:text-purple-400">
                                {translateProviderStatus(providerStatus.status)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">
                              {providerStatus.error || providerStatus.message || 'لا تتوفر بيانات من المزود'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Service Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    معلومات الخدمة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">اسم الخدمة</p>
                      <p className="font-medium">{order.service?.name}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">التصنيف</p>
                      <p className="font-medium">{order.service?.category}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">عدد البدء</p>
                      <p className="font-medium">{order.quantity?.toLocaleString() || "-"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">تاريخ الطلب</p>
                      <p className="font-medium">{format(new Date(order.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}</p>
                    </div>
                  </div>

                  {/* Link */}
                  {order.link && (
                    <div className="p-4 rounded-xl border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">الرابط</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => copyToClipboard(order.link!)}
                          >
                            {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" asChild>
                            <a href={order.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <p className="font-mono text-xs break-all bg-muted/50 rounded-lg p-2 text-muted-foreground" dir="ltr">
                        {order.link}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Order History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    سجل التحديثات
                    {orderHistory.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{orderHistory.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>لا يوجد سجل تحديثات</p>
                    </div>
                  ) : (
                    <div className="relative pr-6 space-y-4">
                      {/* Timeline Line */}
                      <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-accent to-muted rounded-full" />
                      
                      {(showAllHistory ? orderHistory : orderHistory.slice(0, 3)).map((item, index) => {
                        const historyStatus = getStatusConfig(item.new_status);
                        const HistoryIcon = historyStatus.icon;
                        
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                          >
                            <div className={cn(
                              "absolute -right-[1.15rem] w-5 h-5 rounded-full flex items-center justify-center z-10",
                              "bg-gradient-to-br shadow-lg",
                              historyStatus.gradient
                            )}>
                              <HistoryIcon className="w-2.5 h-2.5 text-white" />
                            </div>

                            <div className={cn(
                              "mr-4 rounded-xl border overflow-hidden",
                              index === 0 ? "bg-card shadow-md" : "bg-card/50",
                              historyStatus.border
                            )}>
                              <div className={cn("px-4 py-3 flex items-center justify-between", historyStatus.bg)}>
                                <Badge className={cn(
                                  "text-xs font-semibold px-2.5 py-1 rounded-lg border-0 bg-gradient-to-r text-white",
                                  historyStatus.gradient
                                )}>
                                  {historyStatus.label}
                                </Badge>
                                {index === 0 && (
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div className="px-4 py-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{format(new Date(item.created_at), "d MMMM yyyy - HH:mm", { locale: ar })}</span>
                                </div>
                                {item.notes && (
                                  <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                                    <MessageCircle className="w-3 h-3 inline-block ml-1" />
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {orderHistory.length > 3 && !showAllHistory && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAllHistory(true)}
                          className="w-full mt-4 gap-2"
                        >
                          <ChevronDown className="w-4 h-4" />
                          عرض المزيد ({orderHistory.length - 3})
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            {(order.notes || order.admin_notes) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                {order.notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        ملاحظاتك
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted/30 rounded-xl p-4">{order.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* ملاحظات الإدارة مخفية عن العملاء - تظهر فقط للمسؤولين */}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    ملخص السعر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* سعر الوحدة */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">سعر الوحدة</span>
                    <span className="font-medium font-mono">
                      {(order.service?.price || 0).toFixed(4)} ر.س
                    </span>
                  </div>
                  
                  {/* الكمية */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">الكمية</span>
                    <span className="font-medium">
                      {(order.quantity || 1).toLocaleString()}
                    </span>
                  </div>
                  
                  <Separator className="opacity-50" />
                  
                  {/* السعر الأساسي */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">السعر الأساسي</span>
                    <span className="font-medium">
                      {((order.service?.price || 0) * (order.quantity || 1)).toFixed(2)} ر.س
                    </span>
                  </div>
                  
                  {/* الخصم */}
                  {order.discount_amount && order.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-2">
                        <Badge className="text-[10px] bg-emerald-500/20 text-emerald-600 border-0">خصم</Badge>
                      </span>
                      <span className="font-medium">-{order.discount_amount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* الإجمالي */}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">الإجمالي المدفوع</span>
                    <motion.span 
                      className="text-2xl font-bold text-primary"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {order.total_price.toFixed(2)}
                      <span className="text-sm text-muted-foreground mr-1">ر.س</span>
                    </motion.span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Download Invoice */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={generatePDF}
                className="w-full gap-3 rounded-2xl h-12 bg-gradient-to-l from-primary to-accent hover:shadow-xl hover:shadow-primary/30 transition-all"
                size="lg"
              >
                <FileText className="w-5 h-5" />
                تحميل الفاتورة (English)
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={generateArabicPDF}
                className="w-full gap-3 rounded-2xl h-12 bg-gradient-to-l from-emerald-500 to-green-500 hover:shadow-xl hover:shadow-emerald-500/30 transition-all text-white"
                size="lg"
              >
                <Download className="w-5 h-5" />
                تحميل الفاتورة (عربي)
              </Button>
            </motion.div>

          </div>
        </div>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientOrderDetails;