/**
 * MaxioCore Financing Admin V2 - Applications Table
 * جدول طلبات التمويل للأدمن
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  MoreHorizontal,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Wallet
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { AdminApplicationView } from '../types';
import { STATUS_CONFIG, STATUS_COLORS } from '../../config/statusConfig';
import { cn } from '@/lib/utils';

interface ApplicationsTableProps {
  applications: AdminApplicationView[];
  isLoading?: boolean;
  onSelect: (app: AdminApplicationView) => void;
  selectedId?: string;
}

export function ApplicationsTable({
  applications,
  isLoading,
  onSelect,
  selectedId,
}: ApplicationsTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-lg">لا توجد طلبات</p>
          <p className="text-muted-foreground/70 text-sm mt-1">
            ستظهر طلبات التمويل هنا عند تقديمها
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>طلبات التمويل</span>
          <Badge variant="secondary">{applications.length} طلب</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right w-[140px]">رقم الطلب</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">تاريخ التقديم</TableHead>
                <TableHead className="text-center w-[100px]">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {applications.map((app, index) => {
                  const statusConfig = STATUS_CONFIG[app.status];
                  const colors = STATUS_COLORS[statusConfig?.color || 'gray'];
                  const isSelected = selectedId === app.id;

                  return (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "cursor-pointer transition-colors group",
                        isSelected 
                          ? "bg-primary/5 border-r-2 border-r-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => onSelect(app)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">#</span>
                          {app.application_number}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{app.full_name}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {app.phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-success">
                            {(app.approved_amount || app.requested_amount).toLocaleString('ar-SA')} ر.س
                          </span>
                          {app.approved_amount && app.approved_amount !== app.requested_amount && (
                            <span className="text-xs text-muted-foreground line-through">
                              {app.requested_amount.toLocaleString('ar-SA')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={cn(
                          "font-normal",
                          colors?.badge
                        )}>
                          {statusConfig?.nameAr || app.status}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(app.submitted_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(app);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => onSelect(app)}>
                                <Eye className="h-4 w-4 ml-2" />
                                عرض التفاصيل
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(app.application_number);
                                }}
                              >
                                نسخ رقم الطلب
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-28 bg-muted animate-pulse rounded" />
              <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
