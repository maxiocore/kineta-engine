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
    
    toast.loading('جاري إنشاء الفاتورة العربية...');

    // Fetch customer profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const customerName = profile?.full_name || user.user_metadata?.full_name || 'غير محدد';
    const customerEmail = profile?.email || user.email || 'غير محدد';
    const customerPhone = user.phone || user.user_metadata?.phone || 'غير متوفر';
    
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
        case 'completed': return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
        case 'pending': return { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047' };
        case 'in_progress':
        case 'processing': return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };
        case 'cancelled':
        case 'refunded': return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
        default: return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
      }
    };

    const unitPrice = order.service?.price || 0;
    const basePrice = unitPrice * (order.quantity || 1);
    const statusStyle = getStatusColor(order.status);

    // Generate QR Code as SVG
    const qrData = `INV:${order.order_number}|AMT:${order.total_price}|DATE:${format(new Date(order.created_at), 'yyyyMMdd')}`;
    const generateQRCodeSVG = (data: string) => {
      // Simple QR-like pattern generator (visual representation)
      const size = 100;
      const cellSize = 4;
      const cells = Math.floor(size / cellSize);
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
      svg += `<rect width="${size}" height="${size}" fill="white"/>`;
      
      // Generate pseudo-random pattern based on data
      const hash = data.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
      for (let i = 0; i < cells; i++) {
        for (let j = 0; j < cells; j++) {
          const seed = (hash + i * cells + j) % 100;
          if (seed < 45 || (i < 3 && j < 3) || (i < 3 && j > cells - 4) || (i > cells - 4 && j < 3)) {
            svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1a1a1a"/>`;
          }
        }
      }
      // Position detection patterns
      const drawPositionPattern = (x: number, y: number) => {
        svg += `<rect x="${x}" y="${y}" width="28" height="28" fill="#1a1a1a"/>`;
        svg += `<rect x="${x + 4}" y="${y + 4}" width="20" height="20" fill="white"/>`;
        svg += `<rect x="${x + 8}" y="${y + 8}" width="12" height="12" fill="#1a1a1a"/>`;
      };
      drawPositionPattern(0, 0);
      drawPositionPattern(size - 28, 0);
      drawPositionPattern(0, size - 28);
      svg += '</svg>';
      return svg;
    };

    const qrCodeSVG = generateQRCodeSVG(qrData);
    const qrCodeBase64 = `data:image/svg+xml;base64,${btoa(qrCodeSVG)}`;

    // Create hidden container for HTML invoice - Premium Modern Design
    const container = document.createElement('div');
    container.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 595px; background: white;';
    container.innerHTML = `
      <div style="direction: rtl; font-family: 'Cairo', 'Tajawal', 'Noto Kufi Arabic', system-ui, sans-serif; background: linear-gradient(180deg, #FAFBFC 0%, #FFFFFF 100%); min-height: 842px; position: relative;">
        
        <!-- Premium Header with Glass Effect -->
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); padding: 0; position: relative; overflow: hidden;">
          <!-- Animated Gradient Orbs -->
          <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%); border-radius: 50%; filter: blur(40px);"></div>
          <div style="position: absolute; bottom: -30px; left: 20%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%); border-radius: 50%; filter: blur(30px);"></div>
          <div style="position: absolute; top: 30%; left: -30px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(34,211,238,0.3) 0%, transparent 70%); border-radius: 50%; filter: blur(25px);"></div>
          
          <div style="padding: 40px 50px 35px; position: relative; z-index: 1;">
            <table style="width: 100%;">
              <tr>
                <td style="vertical-align: middle; width: 55%;">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(99,102,241,0.4);">
                      <span style="font-size: 28px; font-weight: 900; color: white; font-family: 'Arial Black', sans-serif;">M</span>
                    </div>
                    <div>
                      <h1 style="color: white; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: 3px; font-family: 'Cairo', sans-serif; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">MAXIOCORE</h1>
                      <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 6px 0 0; font-weight: 500; letter-spacing: 2px;">DIGITAL SERVICES PLATFORM</p>
                    </div>
                  </div>
                </td>
                <td style="text-align: left; vertical-align: middle;">
                  <div style="background: rgba(255,255,255,0.08); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 18px 28px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.2);">
                    <p style="color: rgba(255,255,255,0.5); font-size: 10px; margin: 0; font-weight: 600; letter-spacing: 1px;">فاتورة ضريبية مبسطة</p>
                    <p style="color: white; font-size: 16px; margin: 6px 0 0; font-weight: 700; letter-spacing: 2px;">TAX INVOICE</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Invoice Number Banner - Gradient Strip -->
        <div style="background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 35%, #a855f7 65%, #ec4899 100%); padding: 20px 50px; position: relative;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);"></div>
          <table style="width: 100%; position: relative; z-index: 1;">
            <tr>
              <td style="text-align: right;">
                <span style="color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600;">رقم الفاتورة</span>
                <span style="color: white; font-size: 20px; font-weight: 800; margin-right: 12px; font-family: 'JetBrains Mono', 'Courier New', monospace; letter-spacing: 3px; text-shadow: 0 2px 8px rgba(0,0,0,0.2);">#ORD-${order.order_number}</span>
              </td>
              <td style="text-align: left;">
                <span style="display: inline-block; background: ${statusStyle.bg}; color: ${statusStyle.text}; border: 2px solid ${statusStyle.border}; padding: 10px 28px; border-radius: 50px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                  ${statusLabels[order.status] || order.status}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Main Content Area -->
        <div style="padding: 35px 50px;">
          
          <!-- Info Cards Row -->
          <table style="width: 100%; border-collapse: separate; border-spacing: 16px 0; margin-bottom: 28px;">
            <tr>
              <!-- Customer Info Card -->
              <td style="width: 50%; vertical-align: top;">
                <div style="background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #e2e8f0; border-radius: 20px; padding: 22px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -20px; left: -20px; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 70%); border-radius: 50%;"></div>
                  <div style="display: flex; align-items: center; margin-bottom: 18px; position: relative;">
                    <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-left: 12px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">
                      <span style="font-size: 20px;">👤</span>
                    </div>
                    <p style="color: #1e293b; font-size: 14px; font-weight: 700; margin: 0;">بيانات العميل</p>
                  </div>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 10px 0;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">الاسم</p>
                        <p style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 5px 0 0;">${customerName}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-top: 1px solid #f1f5f9;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">البريد الإلكتروني</p>
                        <p style="color: #475569; font-size: 12px; font-weight: 600; margin: 5px 0 0; direction: ltr; text-align: right;">${customerEmail}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-top: 1px solid #f1f5f9;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">رقم الجوال</p>
                        <p style="color: #475569; font-size: 13px; font-weight: 600; margin: 5px 0 0; direction: ltr; text-align: right;">${customerPhone}</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
              <!-- Invoice Date Card -->
              <td style="width: 50%; vertical-align: top;">
                <div style="background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%); border: 1px solid #e2e8f0; border-radius: 20px; padding: 22px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(236,72,153,0.1) 0%, transparent 70%); border-radius: 50%;"></div>
                  <div style="display: flex; align-items: center; margin-bottom: 18px; position: relative;">
                    <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-left: 12px; box-shadow: 0 4px 12px rgba(15,23,42,0.3);">
                      <span style="font-size: 20px;">📄</span>
                    </div>
                    <p style="color: #1e293b; font-size: 14px; font-weight: 700; margin: 0;">تفاصيل الفاتورة</p>
                  </div>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 10px 0;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">تاريخ الإصدار</p>
                        <p style="color: #0f172a; font-size: 18px; font-weight: 800; margin: 5px 0 0;">${format(new Date(order.created_at), 'yyyy/MM/dd')}</p>
                        <p style="color: #94a3b8; font-size: 11px; margin: 3px 0 0;">${format(new Date(order.created_at), 'hh:mm a')}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-top: 1px solid #f1f5f9;">
                        <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">التصنيف</p>
                        <p style="color: #475569; font-size: 13px; font-weight: 600; margin: 5px 0 0;">${order.service?.category || 'عام'}</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>

          <!-- Service Details Card - Premium Design -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 18px 28px; position: relative;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.1) 50%, transparent 100%);"></div>
              <h3 style="color: white; font-size: 15px; font-weight: 700; margin: 0; display: flex; align-items: center; position: relative;">
                <span style="display: inline-block; width: 10px; height: 10px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin-left: 12px; box-shadow: 0 0 12px rgba(34,197,94,0.5);"></span>
                تفاصيل الخدمة
              </h3>
            </div>
            <div style="padding: 28px;">
              <div style="margin-bottom: 24px;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600; margin-bottom: 10px;">اسم الخدمة</p>
                <p style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 0; line-height: 1.8; padding: 16px 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 14px; border-right: 5px solid #6366f1;">${order.service?.name || 'غير محدد'}</p>
              </div>
              <table style="width: 100%;">
                <tr>
                  <td style="width: 50%; padding: 18px 0; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">الكمية المطلوبة</p>
                    <p style="color: #6366f1; font-size: 32px; font-weight: 900; margin: 10px 0 0; letter-spacing: -1px;">${(order.quantity || 1).toLocaleString('ar-SA')}</p>
                  </td>
                  <td style="width: 50%; padding: 18px 0; border-top: 1px solid #f1f5f9; text-align: left;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">سعر الوحدة</p>
                    <p style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 10px 0 0;">${unitPrice.toFixed(4)} <span style="font-size: 13px; color: #94a3b8; font-weight: 600;">ر.س</span></p>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Payment Summary Card -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 18px 28px; position: relative;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.1) 50%, transparent 100%);"></div>
              <h3 style="color: white; font-size: 15px; font-weight: 700; margin: 0; display: flex; align-items: center; position: relative;">
                <span style="display: inline-block; width: 10px; height: 10px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin-left: 12px; box-shadow: 0 0 12px rgba(245,158,11,0.5);"></span>
                ملخص الدفع
              </h3>
            </div>
            <div style="padding: 24px 28px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 14px 0; color: #64748b; font-size: 14px; font-weight: 500;">المجموع الفرعي</td>
                  <td style="padding: 14px 0; color: #1e293b; font-size: 15px; font-weight: 600; text-align: left;">${basePrice.toFixed(2)} ر.س</td>
                </tr>
                ${order.discount_amount && order.discount_amount > 0 ? `
                <tr>
                  <td style="padding: 14px 0; color: #22c55e; font-size: 14px; font-weight: 500; border-top: 1px solid #f1f5f9;">
                    <span style="display: inline-block; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">خصم</span>
                  </td>
                  <td style="padding: 14px 0; color: #22c55e; font-size: 15px; font-weight: 700; text-align: left; border-top: 1px solid #f1f5f9;">- ${order.discount_amount.toFixed(2)} ر.س</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 14px 0; color: #94a3b8; font-size: 13px; font-weight: 500; border-top: 1px solid #f1f5f9;">ضريبة القيمة المضافة (0%)</td>
                  <td style="padding: 14px 0; color: #94a3b8; font-size: 13px; text-align: left; border-top: 1px solid #f1f5f9;">0.00 ر.س</td>
                </tr>
              </table>
            </div>
            <!-- Grand Total Section -->
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 24px 28px; position: relative;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.1) 100%);"></div>
              <table style="width: 100%; position: relative;">
                <tr>
                  <td>
                    <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0; font-weight: 600;">الإجمالي المستحق</p>
                    <p style="color: white; font-size: 32px; font-weight: 900; margin: 10px 0 0; letter-spacing: -1px;">${order.total_price.toFixed(2)} <span style="font-size: 16px; font-weight: 600; opacity: 0.8;">ريال سعودي</span></p>
                  </td>
                  <td style="text-align: left; vertical-align: bottom;">
                    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 16px;">
                      <p style="color: rgba(255,255,255,0.5); font-size: 11px; margin: 0; font-weight: 600;">SAR</p>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>

          ${order.link ? `
          <!-- Link Section -->
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px 24px; margin-bottom: 20px;">
            <p style="color: #1e40af; font-size: 12px; margin: 0 0 10px; font-weight: 700; display: flex; align-items: center;">
              <span style="display: inline-block; margin-left: 8px; font-size: 16px;">🔗</span> الرابط المستهدف
            </p>
            <p style="color: #1e3a8a; font-size: 11px; margin: 0; word-break: break-all; direction: ltr; text-align: left; font-family: 'JetBrains Mono', monospace; background: white; padding: 12px 16px; border-radius: 10px; border: 1px solid #93c5fd;">${order.link}</p>
          </div>
          ` : ''}

        </div>

        <!-- Premium Footer -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border-top: 1px solid #e2e8f0;">
          <div style="padding: 28px 50px;">
            <table style="width: 100%;">
              <tr>
                <td style="vertical-align: middle; width: 70%;">
                  <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.8; font-weight: 500;">
                    <span style="color: #0f172a; font-weight: 700;">ملاحظة:</span> فاتورة إلكترونية صادرة من منصة MAXIOCORE
                  </p>
                  <p style="color: #94a3b8; font-size: 10px; margin: 10px 0 0;">
                    تاريخ الإصدار: ${format(new Date(), 'dd/MM/yyyy')} - ${format(new Date(), 'HH:mm')} • لا تحتاج إلى توقيع أو ختم
                  </p>
                  <div style="margin-top: 14px; display: flex; gap: 20px;">
                    <span style="color: #64748b; font-size: 11px; font-weight: 500;">📧 info@maxiocore.com</span>
                    <span style="color: #64748b; font-size: 11px; font-weight: 500;">🌐 www.maxiocore.com</span>
                  </div>
                </td>
                <td style="text-align: left; vertical-align: middle;">
                  <div style="background: white; padding: 12px; border-radius: 16px; border: 2px solid #e2e8f0; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <img src="${qrCodeBase64}" width="75" height="75" style="display: block; border-radius: 8px;" />
                    <p style="color: #64748b; font-size: 9px; margin: 8px 0 0; text-align: center; font-weight: 600;">امسح للتحقق</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
          <!-- Gradient Bottom Bar -->
          <div style="height: 6px; background: linear-gradient(90deg, #1a1a2e 0%, #6366f1 33%, #ec4899 66%, #f59e0b 100%);"></div>
        </div>
        
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
      pdf.save(`فاتورة-${order.order_number}.pdf`);

      toast.dismiss();
      toast.success('تم تحميل الفاتورة العربية بنجاح');
    } catch (error) {
      toast.dismiss();
      toast.error('حدث خطأ في إنشاء الفاتورة');
      console.error(error);
    } finally {
      document.body.removeChild(container);
    }
  }, [order]);

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