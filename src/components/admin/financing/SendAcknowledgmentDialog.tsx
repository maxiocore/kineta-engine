/**
 * دايلوج إرسال الإقرار للعميل
 * Send Acknowledgment to Customer Dialog
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Send, 
  FileText, 
  Loader2, 
  User, 
  Hash,
  Mail,
  CheckCircle2
} from 'lucide-react';

interface SendAcknowledgmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: {
    id: string;
    application_number: string;
    full_name: string;
    contract_override_name?: string;
    email: string;
    approved_amount?: number;
    requested_amount: number;
  };
  onSent?: () => void;
}

export function SendAcknowledgmentDialog({
  open,
  onOpenChange,
  application,
  onSent
}: SendAcknowledgmentDialogProps) {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [acknowledgmentNumber, setAcknowledgmentNumber] = useState(
    `ACK-${application.application_number}`
  );

  const customerName = application.contract_override_name || application.full_name;

  const handleSend = async () => {
    setIsSending(true);

    try {
      // Check if acknowledgment already exists
      const { data: existing } = await supabase
        .from('financing_acknowledgments')
        .select('id, status')
        .eq('application_id', application.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('financing_acknowledgments')
          .update({
            status: 'SENT',
            sent_at: new Date().toISOString(),
            sent_by: user?.id,
            acknowledgment_number: acknowledgmentNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new acknowledgment
        const { error } = await supabase
          .from('financing_acknowledgments')
          .insert([{
            application_id: application.id,
            acknowledgment_number: acknowledgmentNumber,
            acknowledgment_type: 'terms_conditions',
            status: 'SENT' as const,
            sent_at: new Date().toISOString(),
            sent_by: user?.id
          }]);

        if (error) throw error;
      }

      // Update application workflow status
      await supabase
        .from('financing_applications')
        .update({
          workflow_status: 'ACK_SENT',
          phase_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      // Log activity
      await supabase.from('financing_activity_log').insert({
        application_id: application.id,
        event_type: 'acknowledgment_sent',
        from_status: null,
        to_status: 'ACK_SENT',
        triggered_by: 'admin',
        actor_id: user?.id,
        is_visible_to_customer: true,
        metadata: {
          acknowledgment_number: acknowledgmentNumber
        }
      });

      toast.success('تم إرسال الإقرار للعميل');
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error sending acknowledgment:', err);
      toast.error('فشل إرسال الإقرار');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            إرسال إقرار الشروط للعميل
          </DialogTitle>
          <DialogDescription>
            سيتم إرسال إقرار قراءة الشروط للعميل للتوقيع عليه إلكترونياً
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Application Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">رقم الطلب:</span>
              <Badge variant="outline">{application.application_number}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">اسم العميل:</span>
              <span className="font-medium">{customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">البريد:</span>
              <span className="text-sm">{application.email}</span>
            </div>
          </div>

          {/* Acknowledgment Number */}
          <div className="space-y-2">
            <Label htmlFor="ack-number">رقم الإقرار</Label>
            <Input
              id="ack-number"
              value={acknowledgmentNumber}
              onChange={(e) => setAcknowledgmentNumber(e.target.value)}
              dir="ltr"
              className="text-left"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">ما سيحدث:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600">
                  <li>سيظهر الإقرار للعميل في لوحة التحكم</li>
                  <li>لن يتمكن من التوقيع إلا بعد قراءة الوثيقة كاملة</li>
                  <li>مطلوب وقت قراءة أدنى (30 ثانية)</li>
                  <li>يجب تأكيد الموافقة قبل التوقيع</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جارٍ الإرسال...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                إرسال الإقرار
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
