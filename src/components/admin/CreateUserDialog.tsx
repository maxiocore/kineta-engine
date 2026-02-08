import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Phone, Mail, User, Lock, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const createUserSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
  phone: z.string().trim().min(9, "رقم الجوال يجب أن يكون 9 أرقام على الأقل").max(15, "رقم الجوال طويل جداً")
    .regex(/^[\d+\s]+$/, "رقم الجوال يجب أن يحتوي على أرقام فقط"),
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255).optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(72).optional().or(z.literal("")),
});

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: () => void;
}

interface CreatedUserResult {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  generated_password?: string;
}

export const CreateUserDialog = ({ open, onOpenChange, onUserCreated }: CreateUserDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setErrors({});
    setCreatedUser(null);
    setCopiedField(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("فشل في النسخ");
    }
  };

  const handleCreate = async () => {
    setErrors({});

    const result = createUserSchema.safeParse({
      full_name: fullName,
      phone,
      email: email || undefined,
      password: password || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password: password.trim() || undefined,
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.success) {
        toast.success("تم إنشاء الحساب بنجاح");
        setCreatedUser({
          id: data.user.id,
          email: data.user.email,
          phone: data.user.phone,
          full_name: data.user.full_name,
          generated_password: data.generated_password,
        });
        onUserCreated();
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error("فشل في إنشاء الحساب");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            إنشاء حساب جديد
          </DialogTitle>
        </DialogHeader>

        {createdUser ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
              <Check className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="font-semibold text-sm">تم إنشاء الحساب بنجاح</p>
            </div>

            <div className="space-y-3">
              <InfoRow label="الاسم" value={createdUser.full_name} onCopy={handleCopy} copiedField={copiedField} field="name" />
              <InfoRow label="الجوال" value={createdUser.phone} onCopy={handleCopy} copiedField={copiedField} field="phone" />
              <InfoRow label="البريد" value={createdUser.email} onCopy={handleCopy} copiedField={copiedField} field="email" />
              {createdUser.generated_password && (
                <InfoRow label="كلمة المرور" value={createdUser.generated_password} onCopy={handleCopy} copiedField={copiedField} field="password" isPassword />
              )}
            </div>

            {createdUser.generated_password && (
              <p className="text-[11px] text-warning bg-warning/10 p-2 rounded-md">
                ⚠️ احفظ كلمة المرور الآن - لن تظهر مرة أخرى
              </p>
            )}

            <Button onClick={() => handleClose(false)} className="w-full">
              إغلاق
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                الاسم الكامل <span className="text-destructive">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="محمد أحمد"
                className="h-9 text-sm"
                maxLength={100}
              />
              {errors.full_name && <p className="text-destructive text-[11px]">{errors.full_name}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                رقم الجوال <span className="text-destructive">*</span>
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="h-9 text-sm"
                dir="ltr"
                maxLength={15}
              />
              {errors.phone && <p className="text-destructive text-[11px]">{errors.phone}</p>}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                البريد الإلكتروني <span className="text-muted-foreground text-[10px]">(اختياري)</span>
              </Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="h-9 text-sm"
                dir="ltr"
                type="email"
                maxLength={255}
              />
              {errors.email && <p className="text-destructive text-[11px]">{errors.email}</p>}
            </div>

            {/* Password (Optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                كلمة المرور <span className="text-muted-foreground text-[10px]">(اختياري - سيتم توليدها تلقائياً)</span>
              </Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-sm"
                dir="ltr"
                type="password"
                maxLength={72}
              />
              {errors.password && <p className="text-destructive text-[11px]">{errors.password}</p>}
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating}
              className="w-full gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  إنشاء الحساب
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper component for result display
const InfoRow = ({
  label,
  value,
  onCopy,
  copiedField,
  field,
  isPassword = false,
}: {
  label: string;
  value: string;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
  field: string;
  isPassword?: boolean;
}) => (
  <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border/30">
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-mono truncate ${isPassword ? "text-warning font-semibold" : ""}`} dir="ltr">
        {value}
      </p>
    </div>
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0 shrink-0"
      onClick={() => onCopy(value, field)}
    >
      {copiedField === field ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </Button>
  </div>
);
