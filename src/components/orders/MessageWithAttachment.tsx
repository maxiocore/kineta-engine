import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  Send,
  Loader2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

interface MessageWithAttachmentProps {
  orderId: string;
  isAdmin?: boolean;
  onMessageSent?: () => void;
}

interface AttachedFile {
  file: File;
  preview?: string;
}

export default function MessageWithAttachment({
  orderId,
  isAdmin = false,
  onMessageSent,
}: MessageWithAttachmentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [sending, setSending] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast({
          title: "حجم الملف كبير جداً",
          description: `الملف ${file.name} أكبر من 10 ميجابايت`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    const newAttachments: AttachedFile[] = validFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("dev-order-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save file reference
      await supabase.from("dev_order_files").insert({
        order_id: orderId,
        user_id: user?.id,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        file_type: file.type,
      });

      return fileName;
    } catch (err) {
      console.error("Error uploading file:", err);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    if (!user) return;

    setSending(true);
    try {
      // Upload files first
      const uploadedFiles: string[] = [];
      for (const attachment of attachedFiles) {
        const path = await uploadFile(attachment.file);
        if (path) {
          uploadedFiles.push(path);
        }
      }

      // Create message event
      const eventPayload: any = {};
      if (uploadedFiles.length > 0) {
        eventPayload.attachments = uploadedFiles;
        eventPayload.attachment_count = uploadedFiles.length;
      }

      await supabase.from("dev_order_events").insert({
        order_id: orderId,
        actor_role: isAdmin ? "admin" : "user",
        actor_id: user.id,
        event_type: uploadedFiles.length > 0 ? "message_with_files" : "message",
        message_text: message.trim() || (uploadedFiles.length > 0 ? `تم إرفاق ${uploadedFiles.length} ملف` : null),
        payload: Object.keys(eventPayload).length > 0 ? eventPayload : null,
      });

      // Add file_uploaded events for each file
      if (uploadedFiles.length > 0) {
        await supabase.from("dev_order_events").insert({
          order_id: orderId,
          actor_role: isAdmin ? "admin" : "user",
          actor_id: user.id,
          event_type: "file_uploaded",
          message_text: `تم رفع ${uploadedFiles.length} ملف`,
          payload: { files: uploadedFiles },
        });
      }

      // Clean up
      attachedFiles.forEach((attachment) => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });

      setMessage("");
      setAttachedFiles([]);
      toast({ title: "تم إرسال الرسالة بنجاح" });
      onMessageSent?.();
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "خطأ في إرسال الرسالة",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          {isAdmin ? "إرسال رسالة للعميل" : "إرسال رسالة"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder={isAdmin ? "اكتب رسالتك للعميل..." : "اكتب رسالتك هنا..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mb-3"
          rows={3}
        />

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachedFiles.map((attachment, index) => (
              <div
                key={index}
                className="relative flex items-center gap-2 p-2 rounded-lg bg-muted/50 border"
              >
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-muted rounded">
                    {getFileIcon(attachment.file)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate max-w-[100px]">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="إرفاق ملف"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            onClick={sendMessage}
            disabled={(!message.trim() && attachedFiles.length === 0) || sending}
            className="flex-1 md:flex-none gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            إرسال
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}