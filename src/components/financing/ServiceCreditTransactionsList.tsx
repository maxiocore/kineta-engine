/**
 * قائمة حركات رصيد الخدمات
 * Service Credit Transactions List
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RotateCcw,
  Lock,
  Unlock,
  History,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { useServiceCredit, type ServiceCreditTransaction } from '@/hooks/useServiceCredit';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const transactionTypeConfig: Record<string, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}> = {
  credit: {
    icon: ArrowDownCircle,
    label: 'إيداع',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  debit: {
    icon: ArrowUpCircle,
    label: 'خصم',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  reversal: {
    icon: RotateCcw,
    label: 'استرداد',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  freeze: {
    icon: Lock,
    label: 'تجميد',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  unfreeze: {
    icon: Unlock,
    label: 'إلغاء تجميد',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
};

function TransactionItem({ transaction }: { transaction: ServiceCreditTransaction }) {
  const config = transactionTypeConfig[transaction.transaction_type] || {
    icon: History,
    label: transaction.transaction_type,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  };
  
  const Icon = config.icon;
  const isPositive = transaction.transaction_type === 'credit' || transaction.transaction_type === 'reversal';

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      {/* الأيقونة */}
      <div className={`p-2 rounded-full ${config.bgColor}`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* التفاصيل */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {transaction.description_ar || transaction.description || config.label}
          </span>
          {transaction.service_name && (
            <Badge variant="outline" className="text-xs shrink-0">
              <ShoppingBag className="h-3 w-3 mr-1" />
              {transaction.service_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>
            {format(new Date(transaction.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
          </span>
          <span className="text-muted-foreground/50">•</span>
          <span>الرصيد: {formatCurrency(transaction.balance_after)}</span>
        </div>
      </div>

      {/* المبلغ */}
      <div className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
        {isPositive ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
      </div>
    </div>
  );
}

interface ServiceCreditTransactionsListProps {
  maxHeight?: number;
  showHeader?: boolean;
}

export function ServiceCreditTransactionsList({ 
  maxHeight = 400,
  showHeader = true 
}: ServiceCreditTransactionsListProps) {
  const { transactions, isTransactionsLoading, totalTransactions } = useServiceCredit();

  if (isTransactionsLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              سجل استخدام الرصيد
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions.length) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              سجل استخدام الرصيد
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">لا توجد حركات حتى الآن</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              سجل استخدام الرصيد
            </CardTitle>
            <Badge variant="secondary">{totalTransactions} حركة</Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="divide-y p-2">
            {transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
