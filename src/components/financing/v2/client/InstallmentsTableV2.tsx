/**
 * ASH HOLDING Financing System v2 - Installments Table Component
 * جدول الأقساط
 */

import { motion } from 'framer-motion';
import { 
  Check, 
  Clock, 
  AlertTriangle,
  XCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FinancingInstallment } from '../types';

interface InstallmentsTableV2Props {
  installments: FinancingInstallment[];
  className?: string;
}

export function InstallmentsTableV2({ installments, className }: InstallmentsTableV2Props) {
  if (installments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>لا توجد أقساط مسجلة</p>
      </div>
    );
  }

  // Calculate totals
  const totalAmount = installments.reduce((sum, i) => sum + Number(i.amount), 0);
  const paidAmount = installments
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const remainingAmount = totalAmount - paidAmount;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="إجمالي الأقساط"
          value={totalAmount}
          variant="default"
        />
        <SummaryCard
          label="المدفوع"
          value={paidAmount}
          variant="success"
        />
        <SummaryCard
          label="المتبقي"
          value={remainingAmount}
          variant="warning"
        />
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right">رقم القسط</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments.map((installment, index) => (
              <motion.tr
                key={installment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'border-b last:border-0',
                  installment.status === 'overdue' && 'bg-destructive/5'
                )}
              >
                <TableCell className="font-medium">
                  القسط {installment.installment_number}
                </TableCell>
                <TableCell>
                  <span className="font-semibold tabular-nums">
                    {Number(installment.amount).toLocaleString('ar-SA')}
                  </span>
                  <span className="text-muted-foreground text-sm mr-1">ر.س</span>
                </TableCell>
                <TableCell>
                  {new Date(installment.due_date).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <InstallmentStatusBadge status={installment.status} />
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Summary Card
// ═══════════════════════════════════════════════════════════════════

interface SummaryCardProps {
  label: string;
  value: number;
  variant: 'default' | 'success' | 'warning';
}

function SummaryCard({ label, value, variant }: SummaryCardProps) {
  const variantClasses = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums', variantClasses[variant])}>
        {value.toLocaleString('ar-SA')}
        <span className="text-sm font-normal text-muted-foreground mr-1">ر.س</span>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Status Badge
// ═══════════════════════════════════════════════════════════════════

interface InstallmentStatusBadgeProps {
  status: string;
}

function InstallmentStatusBadge({ status }: InstallmentStatusBadgeProps) {
  const config = {
    pending: {
      label: 'قيد الانتظار',
      icon: Clock,
      className: 'bg-muted text-muted-foreground',
    },
    paid: {
      label: 'مدفوع',
      icon: Check,
      className: 'bg-success/10 text-success',
    },
    overdue: {
      label: 'متأخر',
      icon: AlertTriangle,
      className: 'bg-destructive/10 text-destructive',
    },
    waived: {
      label: 'ملغي',
      icon: XCircle,
      className: 'bg-muted text-muted-foreground',
    },
  };

  const { label, icon: Icon, className } = config[status as keyof typeof config] || config.pending;

  return (
    <Badge variant="secondary" className={cn('gap-1', className)}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Mobile-friendly Card Layout
// ═══════════════════════════════════════════════════════════════════

interface InstallmentsCardsProps {
  installments: FinancingInstallment[];
  className?: string;
}

export function InstallmentsCards({ installments, className }: InstallmentsCardsProps) {
  if (installments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>لا توجد أقساط مسجلة</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {installments.map((installment, index) => (
        <motion.div
          key={installment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            'p-4 rounded-xl border bg-card',
            installment.status === 'overdue' && 'border-destructive/30 bg-destructive/5'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold">
              القسط {installment.installment_number}
            </span>
            <InstallmentStatusBadge status={installment.status} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">المبلغ</span>
            <span className="font-medium">
              {Number(installment.amount).toLocaleString('ar-SA')} ر.س
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">تاريخ الاستحقاق</span>
            <span>
              {new Date(installment.due_date).toLocaleDateString('ar-SA')}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
