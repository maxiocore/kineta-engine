import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Eye, 
  Calendar, 
  Receipt,
  Banknote,
  ChevronLeft,
  ArrowLeftRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransferToWalletButton } from "@/components/financing/TransferToWalletButton";

interface FinancingActionButtonsProps {
  applicationId: string;
  showPaymentButton?: boolean;
  showReceiptsButton?: boolean;
  showTransferButton?: boolean;
  availableBalance?: number;
  onTransferComplete?: () => void;
}

export default function FinancingActionButtons({ 
  applicationId,
  showPaymentButton = true,
  showReceiptsButton = true,
  showTransferButton = false,
  availableBalance = 0,
  onTransferComplete
}: FinancingActionButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap gap-2 sm:gap-3"
      dir="rtl"
    >
      {/* زر التحويل للرصيد - يظهر أولاً إذا كان متاحاً */}
      {showTransferButton && availableBalance > 0 && (
        <TransferToWalletButton
          applicationId={applicationId}
          availableBalance={availableBalance}
          onTransferComplete={onTransferComplete}
          className="flex-1 sm:flex-none"
        />
      )}

      <Button 
        asChild 
        variant="default"
        className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
      >
        <Link to="/dashboard/financing">
          <Eye className="h-4 w-4 ml-2" />
          عرض تفاصيل التمويل
          <ChevronLeft className="h-4 w-4 mr-1" />
        </Link>
      </Button>

      <Button 
        asChild 
        variant="outline"
        className="flex-1 sm:flex-none"
      >
        <Link to="/dashboard/financing">
          <Calendar className="h-4 w-4 ml-2" />
          سجل الأقساط
        </Link>
      </Button>

      {showPaymentButton && (
        <Button 
          asChild 
          variant="outline"
          className="flex-1 sm:flex-none border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500"
        >
          <Link to="/dashboard/financing/payment">
            <Banknote className="h-4 w-4 ml-2" />
            سداد القسط
          </Link>
        </Button>
      )}

      {showReceiptsButton && (
        <Button 
          asChild 
          variant="ghost"
          className="flex-1 sm:flex-none"
        >
          <Link to="/dashboard/financing/payments">
            <Receipt className="h-4 w-4 ml-2" />
            إيصالات السداد
          </Link>
        </Button>
      )}
    </motion.div>
  );
}
