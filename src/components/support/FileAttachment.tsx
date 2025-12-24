import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, X, Image, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileAttachmentProps {
  userId: string;
  ticketId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const FileAttachment = ({
  userId,
  ticketId,
  attachments,
  onAttachmentsChange,
  disabled = false
}: FileAttachmentProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-orange-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "نوع الملف غير مدعوم",
        description: "يمكنك رفع صور (JPEG, PNG, GIF, WebP) أو ملفات PDF و Word فقط",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "الحد الأقصى لحجم الملف هو 10 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${ticketId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(filePath);

      const newAttachment: Attachment = {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size
      };

      onAttachmentsChange([...attachments, newAttachment]);
      
      toast({
        title: "تم رفع الملف",
        description: "تم إرفاق الملف بنجاح",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "فشل رفع الملف",
        description: "حدث خطأ أثناء رفع الملف",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(newAttachments);
  };

  return (
    <div className="space-y-2">
      {/* Attachments List */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {attachments.map((attachment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 max-w-[200px]"
              >
                {getFileIcon(attachment.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{attachment.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
                </div>
                {!disabled && (
                  <button
                    onClick={() => removeAttachment(index)}
                    className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {!disabled && (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 text-xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Paperclip className="w-3.5 h-3.5" />
                إرفاق ملف
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export const AttachmentDisplay = ({ attachments }: { attachments: Attachment[] }) => {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-orange-500" />;
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment, index) => (
        <motion.a
          key={index}
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          whileHover={{ scale: 1.02 }}
        >
          {isImage(attachment.type) ? (
            <div className="rounded-lg overflow-hidden border border-border/50 max-w-xs">
              <img 
                src={attachment.url} 
                alt={attachment.name}
                className="w-full h-auto object-cover max-h-48"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50 hover:bg-background transition-colors max-w-xs">
              {getFileIcon(attachment.type)}
              <span className="text-xs font-medium truncate">{attachment.name}</span>
            </div>
          )}
        </motion.a>
      ))}
    </div>
  );
};

export type { Attachment };
