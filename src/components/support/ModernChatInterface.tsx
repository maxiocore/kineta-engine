import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Clock, 
  HeadphonesIcon,
  Loader2,
  ArrowRight,
  Star,
  User,
  Paperclip,
  Image,
  X,
  Check,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  SupportTicket, 
  TicketMessage, 
  Attachment,
  formatRelativeTime,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor
} from '@/hooks/useSupportSystem';
import { AttachmentDisplay } from '@/components/support/FileAttachment';
import { cn } from '@/lib/utils';

interface ModernChatInterfaceProps {
  ticket: SupportTicket;
  messages: TicketMessage[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onSendMessage: (message: string, attachments?: Attachment[]) => Promise<void>;
  onBack?: () => void;
  onStatusChange?: (status: SupportTicket['status']) => void;
  onUploadAttachment?: (file: File) => Promise<Attachment | null>;
}

export const ModernChatInterface = ({
  ticket,
  messages,
  isLoading,
  isSubmitting,
  isAdmin = false,
  currentUserId,
  onSendMessage,
  onBack,
  onStatusChange,
  onUploadAttachment,
}: ModernChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUploadAttachment) return;
    
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) continue;
        const attachment = await onUploadAttachment(file);
        if (attachment) {
          setPendingAttachments(prev => [...prev, attachment]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || isSubmitting) return;
    
    const messageToSend = newMessage;
    const attachmentsToSend = [...pendingAttachments];
    setNewMessage('');
    setPendingAttachments([]);
    
    try {
      await onSendMessage(messageToSend, attachmentsToSend);
    } catch (error) {
      setNewMessage(messageToSend);
      setPendingAttachments(attachmentsToSend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <motion.div 
        className="shrink-0 p-4 border-b border-border/40 bg-background/80 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
          
          <motion.div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25"
            animate={{ 
              boxShadow: [
                '0 10px 25px -5px rgba(var(--primary), 0.25)',
                '0 10px 35px -5px rgba(var(--primary), 0.35)',
                '0 10px 25px -5px rgba(var(--primary), 0.25)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg truncate">{ticket.subject}</h3>
              {ticket.ticket_number && (
                <span className="text-xs text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded-full">
                  #{ticket.ticket_number}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isAdmin && onStatusChange ? (
                <Select
                  value={ticket.status}
                  onValueChange={(value) => onStatusChange(value as SupportTicket['status'])}
                >
                  <SelectTrigger className={cn(
                    "h-7 w-auto text-xs border rounded-full px-3",
                    getStatusColor(ticket.status)
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">جديد</SelectItem>
                    <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                    <SelectItem value="resolved">تم الحل</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className={cn("text-xs rounded-full", getStatusColor(ticket.status))}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              )}
              <Badge variant="outline" className={cn("text-xs rounded-full", getPriorityColor(ticket.priority))}>
                {getPriorityLabel(ticket.priority)}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            {/* Original ticket description */}
            <motion.div 
              className="flex justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="max-w-[85%] relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-2xl rounded-tr-md blur-xl opacity-30 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-tr-md p-4 shadow-xl">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                  <div className="flex items-center justify-end gap-2 mt-3 text-xs text-primary-foreground/60">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(ticket.created_at)}</span>
                    <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Messages */}
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => {
                const isFromAdmin = msg.is_admin;
                const isOwn = isAdmin ? isFromAdmin : !isFromAdmin;
                
                return (
                  <motion.div 
                    key={msg.id}
                    layout
                    className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 25,
                      delay: index * 0.02 
                    }}
                  >
                    <div className={cn("max-w-[85%] relative group", !isOwn && "flex gap-2")}>
                      {!isOwn && (
                        <Avatar className="w-8 h-8 shrink-0 mt-1">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs">
                            {isFromAdmin ? (
                              <HeadphonesIcon className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "rounded-2xl p-4 transition-all duration-200",
                        isOwn ? (
                          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-md shadow-lg shadow-primary/20"
                        ) : (
                          "bg-secondary/80 backdrop-blur-sm rounded-tl-md border border-border/50 hover:bg-secondary"
                        )
                      )}>
                        {!isOwn && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "text-xs font-semibold",
                              isFromAdmin ? "text-primary" : "text-muted-foreground"
                            )}>
                              {isFromAdmin ? 'فريق الدعم' : 'العميل'}
                            </span>
                            {isFromAdmin && <Sparkles className="w-3 h-3 text-primary" />}
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3">
                            <AttachmentDisplay attachments={msg.attachments} />
                          </div>
                        )}
                        
                        <div className={cn(
                          "flex items-center gap-2 mt-3 text-xs",
                          isOwn ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
                        )}>
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(msg.created_at)}</span>
                          {isOwn && <CheckCheck className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Typing indicator */}
            {isSubmitting && (
              <motion.div 
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                      <HeadphonesIcon className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary/80 rounded-2xl rounded-tl-md px-4 py-3 border border-border/50">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary/60"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      {!isClosed ? (
        <motion.div 
          className="shrink-0 p-4 border-t border-border/40 bg-background/80 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Pending attachments */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingAttachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-lg text-xs">
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-[100px] truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(idx)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className={cn(
            "flex items-end gap-2 p-2 rounded-2xl border transition-all duration-200",
            isFocused 
              ? "border-primary/50 bg-secondary/50 shadow-lg shadow-primary/5" 
              : "border-border/50 bg-secondary/30"
          )}>
            {/* Attachment button */}
            {onUploadAttachment && (
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary hover:bg-secondary/80 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                )}
              </motion.button>
            )}
            
            <Textarea
              ref={textareaRef}
              placeholder={isAdmin ? "اكتب ردك للعميل..." : "اكتب رسالتك..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px] max-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 text-sm"
              rows={1}
            />
            <motion.button
              onClick={handleSend}
              disabled={isSubmitting || (!newMessage.trim() && pendingAttachments.length === 0)}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
                (newMessage.trim() || pendingAttachments.length > 0)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40" 
                  : "bg-secondary text-muted-foreground"
              )}
              whileHover={{ scale: (newMessage.trim() || pendingAttachments.length > 0) ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="shrink-0 p-4 border-t border-border/40 bg-muted/30 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            تم إغلاق هذه التذكرة
          </p>
        </motion.div>
      )}
    </div>
  );
};
