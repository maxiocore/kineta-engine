/**
 * مكون عرض رصيد الخدمات
 * Service Credit Balance Display Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  FileText, 
  Info, 
  Lock, 
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Wallet
} from 'lucide-react';
import { useServiceCredit } from '@/hooks/useServiceCredit';
import { formatCurrency } from '@/lib/utils';
import { TransferToWalletButton } from './TransferToWalletButton';

interface ServiceCreditBalanceProps {
  showDetails?: boolean;
  compact?: boolean;
  showTransferButton?: boolean;
  applicationId?: string;
}

export function ServiceCreditBalance({ 
  showDetails = true, 
  compact = false,
  showTransferButton = true,
  applicationId
}: ServiceCreditBalanceProps) {
  const {
    summary,
    contractNumber,
    applicationNumber,
    credit,
    isLoading,
    error,
    hasCredit,
    isFrozen,
    refetch
  } = useServiceCredit();

  // Use provided applicationId or get from credit
  const effectiveApplicationId = applicationId || credit?.application_id;

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>حدث خطأ في تحميل رصيد الخدمات</AlertDescription>
      </Alert>
    );
  }

  if (!hasCredit) {
    if (compact) return null;
    
    return (
      <Card className="border-muted">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <CreditCard className="h-8 w-8" />
            <div>
              <p className="font-medium">لا يوجد رصيد خدمات</p>
              <p className="text-sm">سيتم إضافة الرصيد بعد اعتماد طلب التمويل</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">رصيد خدمات:</span>
        <span className="font-bold text-primary">
          {formatCurrency(summary?.availableBalance || 0)}
        </span>
        {isFrozen && (
          <Badge variant="destructive" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            مجمد
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            رصيد الخدمات
          </CardTitle>
          <div className="flex items-center gap-2">
            {isFrozen ? (
              <Badge variant="destructive">
                <Lock className="h-3 w-3 mr-1" />
                مجمد
              </Badge>
            ) : (
              <Badge variant="default" className="bg-emerald-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                نشط
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* الرصيد المتاح */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-1">الرصيد المتاح</p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(summary?.availableBalance || 0)}
          </p>
        </div>

        {/* تفاصيل الرصيد */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">إجمالي المُعتمد</p>
              <p className="text-lg font-semibold text-emerald-600">
                {formatCurrency(summary?.totalCredited || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">إجمالي المُستخدم</p>
              <p className="text-lg font-semibold text-orange-600">
                {formatCurrency(summary?.totalUsed || 0)}
              </p>
            </div>
          </div>
        )}

        {/* مصدر الرصيد */}
        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">مصدر الرصيد</p>
            <p className="text-sm font-medium truncate">{summary?.sourceAr}</p>
          </div>
          {contractNumber && (
            <Badge variant="outline" className="shrink-0">
              {contractNumber}
            </Badge>
          )}
        </div>

        {/* زر التحويل إلى رصيد المنصة */}
        {showTransferButton && effectiveApplicationId && !isFrozen && (summary?.availableBalance || 0) > 0 && (
          <div className="pt-2 border-t">
            <TransferToWalletButton
              applicationId={effectiveApplicationId}
              availableBalance={summary?.availableBalance || 0}
              onTransferComplete={refetch}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              حوّل رصيدك لشراء الخدمات مباشرة
            </p>
          </div>
        )}

        {/* تنبيه الاستخدام */}
        <Alert className="bg-blue-50 border-blue-200">
          <ShoppingBag className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            هذا الرصيد مخصص لشراء الخدمات داخل منصة MaxioCore فقط.
            <br />
            لا يمكن سحبه أو تحويله خارج المنصة.
          </AlertDescription>
        </Alert>

        {/* تحذير القيود */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-1 p-2 bg-background/50 rounded">
            <Ban className="h-4 w-4 text-red-400" />
            <span>لا سحب خارجي</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-background/50 rounded">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span>تحويل داخلي</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 bg-background/50 rounded">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <span>للخدمات فقط</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
