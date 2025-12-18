import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
  variant?: "danger" | "warning";
  progress?: {
    current: number;
    total: number;
  };
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "تأكيد الحذف",
  description = "هل أنت متأكد من هذا الإجراء؟ لا يمكن التراجع عنه.",
  confirmText = "حذف",
  cancelText = "إلغاء",
  onConfirm,
  loading = false,
  variant = "danger",
  progress,
}: ConfirmDialogProps) {
  const isDeleting = loading && progress;
  const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${variant === "danger" ? "bg-destructive/10" : "bg-warning/10"}`}>
              {variant === "danger" ? (
                <Trash2 className="w-5 h-5 text-destructive" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-warning" />
              )}
            </div>
            <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {isDeleting && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>جاري الحذف...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
        
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className={variant === "danger" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-warning text-warning-foreground hover:bg-warning/90"}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                {isDeleting ? `${progress.current}/${progress.total}` : "جاري الحذف..."}
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
