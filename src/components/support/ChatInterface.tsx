import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Clock, 
  HeadphonesIcon,
  Loader2,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  SupportTicket, 
  TicketMessage, 
  CannedResponse,
  Attachment,
  formatRelativeTime,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor
} from '@/hooks/useSupportSystem';
import { FileAttachment, AttachmentDisplay } from '@/components/support/FileAttachment';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  ticket: SupportTicket;
  messages: TicketMessage[];
  isLoading?: boolean;
  isSubmitting?: boolean;
  cannedResponses?: CannedResponse[];
  isAdmin?: boolean;
  currentUserId?: string;
  onSendMessage: (message: string, attachments?: Attachment[]) => Promise<void>;
  onBack?: () => void;
  onStatusChange?: (status: SupportTicket['status']) => void;
  onRate?: (rating: number, comment?: string) => void;
}

export const ChatInterface = ({
  ticket,
  messages,
  isLoading,
  isSubmitting,
  cannedResponses = [],
  isAdmin = false,
  currentUserId,
  onSendMessage,
  onBack,
  onStatusChange,
  onRate,
}: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    
    try {
      await onSendMessage(newMessage, attachments);
      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCannedResponse = (response: CannedResponse) => {
    setNewMessage(response.content);
  };

  const handleRatingSubmit = () => {
    if (rating > 0 && onRate) {
      onRate(rating, ratingComment);
      setShowRating(false);
    }
  };

  const canRate = !isAdmin && ticket.status === 'resolved' && !ticket.rating;
  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="shrink-0 rounded-xl hover:bg-secondary rtl-flip"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
          
          <motion.div 
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{ticket.subject}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant="outline" className={cn("text-xs", getStatusColor(ticket.status))}>
                {getStatusLabel(ticket.status)}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", getPriorityColor(ticket.priority))}>
                {getPriorityLabel(ticket.priority)}
              </Badge>
              {ticket.ticket_number && (
                <span className="text-xs text-muted-foreground font-mono">
                  #{ticket.ticket_number}
                </span>
              )}
            </div>
          </div>
          
          {/* Status change for admin */}
          {isAdmin && onStatusChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  تغيير الحالة
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                  {(['open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => onStatusChange(status)}
                    >
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Original ticket description */}
            <motion.div 
              className="flex justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="max-w-[85%] relative">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-tr-md p-4 shadow-lg shadow-primary/20">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                  <p className="text-xs text-primary-foreground/60 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(ticket.created_at)}
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Messages */}
            <AnimatePresence>
              {messages.map((msg, index) => {
                const isFromAdmin = msg.is_admin;
                
                return (
                  <motion.div 
                    key={msg.id} 
                    className={`flex ${isFromAdmin ? "justify-start" : "justify-end"}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
                  >
                    <div className="max-w-[85%] relative">
                      <div className={cn(
                        "rounded-2xl p-4",
                        isFromAdmin 
                          ? "bg-secondary/80 backdrop-blur-sm rounded-tl-md border border-border/50" 
                          : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-md shadow-lg shadow-primary/20"
                      )}>
                        {isFromAdmin && (
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                <HeadphonesIcon className="w-3.5 h-3.5" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-primary">
                              فريق الدعم
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <AttachmentDisplay attachments={msg.attachments} />
                        )}
                        
                        <p className={cn(
                          "text-xs mt-3 flex items-center gap-1",
                          isFromAdmin ? "text-muted-foreground" : "text-primary-foreground/60"
                        )}>
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {/* Rating prompt */}
            {canRate && !showRating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setShowRating(true)}
                >
                  <Star className="w-4 h-4" />
                  قيّم تجربتك مع الدعم
                </Button>
              </motion.div>
            )}
            
            {/* Rating form */}
            {showRating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl p-6 border border-border/50 text-center space-y-4"
              >
                <h4 className="font-semibold">كيف تقيّم تجربتك مع الدعم الفني؟</h4>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={cn(
                        "text-3xl transition-transform hover:scale-110",
                        star <= rating ? "text-amber-400" : "text-muted"
                      )}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="أضف تعليقاً (اختياري)"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRatingSubmit} disabled={rating === 0}>
                    إرسال التقييم
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRating(false)}>
                    لاحقاً
                  </Button>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      {!isClosed && (
        <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="space-y-3">
            {/* Canned responses for admin */}
            {isAdmin && cannedResponses.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {cannedResponses.slice(0, 5).map((response) => (
                  <Button
                    key={response.id}
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={() => handleCannedResponse(response)}
                  >
                    <Zap className="w-3 h-3 me-1" />
                    {response.title}
                  </Button>
                ))}
              </div>
            )}
            
            {/* File attachments */}
            {currentUserId && (
              <FileAttachment
                userId={currentUserId}
                ticketId={ticket.id}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                disabled={isSubmitting}
              />
            )}
            
            {/* Input field */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={isAdmin ? "اكتب ردك للعميل..." : "اكتب رسالتك..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSubmitting}
                  className="pe-12 bg-secondary/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <Button 
                onClick={handleSend}
                disabled={isSubmitting || (!newMessage.trim() && attachments.length === 0)}
                className="shrink-0 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isClosed && (
        <div className="p-4 border-t border-border/50 bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            تم إغلاق هذه التذكرة
          </p>
        </div>
      )}
    </div>
  );
};
