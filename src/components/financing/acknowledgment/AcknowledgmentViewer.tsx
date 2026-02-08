/**
 * عارض إقرار الشروط مع آلية التحقق من القراءة
 * Terms Acknowledgment Viewer with Reading Verification
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ScrollText,
  Eye
} from 'lucide-react';

interface AcknowledgmentViewerProps {
  applicationId: string;
  acknowledgmentId?: string;
  onSigned?: () => void;
  readOnly?: boolean;
}

// الحد الأدنى للقراءة: 30 ثانية
const MIN_READING_TIME_SECONDS = 30;
// نسبة التمرير المطلوبة: 95%
const MIN_SCROLL_PERCENTAGE = 95;

export function AcknowledgmentViewer({
  applicationId,
  acknowledgmentId,
  onSigned,
  readOnly = false
}: AcknowledgmentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [acknowledgmentData, setAcknowledgmentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Reading verification state
  const [readingStartTime] = useState<number>(Date.now());
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [readingTimeSeconds, setReadingTimeSeconds] = useState(0);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch acknowledgment HTML
  useEffect(() => {
    async function fetchAcknowledgment() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase.functions.invoke(
          'generate-acknowledgment-pdf',
          {
            body: {
              application_id: applicationId,
              acknowledgment_id: acknowledgmentId
            }
          }
        );
        
        if (fetchError) throw fetchError;
        if (!data.success) throw new Error(data.error);
        
        setHtmlContent(data.html);
        setAcknowledgmentData(data);
        
        // If already signed, mark as read
        if (data.status === 'signed') {
          setHasReachedBottom(true);
          setReadingTimeSeconds(MIN_READING_TIME_SECONDS);
        }
      } catch (err) {
        console.error('Error fetching acknowledgment:', err);
        setError(err instanceof Error ? err.message : 'فشل تحميل الإقرار');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAcknowledgment();
  }, [applicationId, acknowledgmentId]);

  // Update reading time
  useEffect(() => {
    if (readOnly || acknowledgmentData?.status === 'signed') return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - readingStartTime) / 1000);
      setReadingTimeSeconds(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [readingStartTime, readOnly, acknowledgmentData?.status]);

  // Handle scroll in iframe
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    
    const handleScroll = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      
      const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
      const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight;
      const clientHeight = doc.documentElement.clientHeight || doc.body.clientHeight;
      
      const percentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollPercentage(Math.min(percentage, 100));
      
      if (percentage >= MIN_SCROLL_PERCENTAGE) {
        setHasReachedBottom(true);
      }
    };
    
    iframe.contentWindow.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => {
      iframe.contentWindow?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check if can sign
  const canSign = hasReachedBottom && 
                  readingTimeSeconds >= MIN_READING_TIME_SECONDS && 
                  hasConfirmed &&
                  !readOnly &&
                  acknowledgmentData?.status !== 'signed';

  // Handle signature
  const handleSign = async () => {
    if (!canSign) return;
    
    setIsSigning(true);
    
    try {
      const now = new Date().toISOString();
      const deviceInfo = {
        platform: navigator.platform,
        language: navigator.language,
        screen: {
          width: window.screen.width,
          height: window.screen.height
        }
      };

      let ackId = acknowledgmentData?.acknowledgment_id;

      // If no acknowledgment record exists, create one
      if (!ackId) {
        const ackNumber = acknowledgmentData?.acknowledgment_data?.acknowledgment_number 
          || `ACK-${applicationId.substring(0, 8).toUpperCase()}`;
        
        const { data: newAck, error: insertError } = await supabase
          .from('financing_acknowledgments')
          .insert({
            application_id: applicationId,
            acknowledgment_number: ackNumber,
            acknowledgment_type: 'terms_and_conditions',
            status: 'SIGNED' as any,
            signed_at: now,
            reading_time_seconds: readingTimeSeconds,
            signature_user_agent: navigator.userAgent,
            signature_device_info: deviceInfo,
            sent_at: now,
            viewed_at: now,
            viewed_count: 1,
          })
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        ackId = newAck.id;
      } else {
        // Update existing acknowledgment record
        const { error: updateError } = await supabase
          .from('financing_acknowledgments')
          .update({
            status: 'SIGNED' as any,
            signed_at: now,
            reading_time_seconds: readingTimeSeconds,
            signature_user_agent: navigator.userAgent,
            signature_device_info: deviceInfo,
            updated_at: now
          })
          .eq('id', ackId);
        
        if (updateError) throw updateError;
      }
      
      // Update application workflow status
      const { error: appError } = await supabase
        .from('financing_applications')
        .update({
          workflow_status: 'ACK_SIGNED',
          phase_updated_at: now,
          updated_at: now
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // Verify the acknowledgment is readable
      const { data: verified } = await supabase
        .from('financing_acknowledgments')
        .select('id')
        .eq('id', ackId)
        .single();

      if (!verified) {
        throw new Error('تم إنشاء الإقرار لكن لم يتم حفظه بشكل صحيح');
      }
      
      toast.success('تم توقيع الإقرار بنجاح');
      onSigned?.();
    } catch (err) {
      console.error('Error signing acknowledgment:', err);
      toast.error(err instanceof Error ? err.message : 'فشل توقيع الإقرار');
    } finally {
      setIsSigning(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">جارٍ تحميل الإقرار...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSigned = acknowledgmentData?.status === 'signed';

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-lg">إقرار بقراءة الشروط والأحكام</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                رقم الإقرار: {acknowledgmentData?.acknowledgment_data?.acknowledgment_number}
              </p>
            </div>
          </div>
          {isSigned ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="h-3 w-3" />
              تم التوقيع
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              في انتظار التوقيع
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Reading Progress Bar */}
        {!isSigned && !readOnly && (
          <div className="px-4 py-3 bg-muted/50 border-b space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  <span className={scrollPercentage >= MIN_SCROLL_PERCENTAGE ? 'text-green-600 font-medium' : ''}>
                    التمرير: {scrollPercentage}%
                  </span>
                  {hasReachedBottom && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className={readingTimeSeconds >= MIN_READING_TIME_SECONDS ? 'text-green-600 font-medium' : ''}>
                    وقت القراءة: {Math.floor(readingTimeSeconds / 60)}:{String(readingTimeSeconds % 60).padStart(2, '0')}
                  </span>
                  {readingTimeSeconds >= MIN_READING_TIME_SECONDS && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {hasReachedBottom && readingTimeSeconds >= MIN_READING_TIME_SECONDS 
                    ? 'جاهز للتوقيع' 
                    : 'يرجى قراءة الوثيقة كاملة'}
                </span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(scrollPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Document Viewer */}
        <div className="relative" style={{ height: '60vh' }}>
          {htmlContent && (
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              title="إقرار الشروط"
            />
          )}
        </div>
        
        {/* Signature Section */}
        {!isSigned && !readOnly && (
          <div className="p-4 bg-muted/30 border-t space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="confirm-read"
                checked={hasConfirmed}
                onCheckedChange={(checked) => setHasConfirmed(checked === true)}
                disabled={!hasReachedBottom || readingTimeSeconds < MIN_READING_TIME_SECONDS}
              />
              <label 
                htmlFor="confirm-read" 
                className={`text-sm leading-relaxed ${
                  !hasReachedBottom || readingTimeSeconds < MIN_READING_TIME_SECONDS 
                    ? 'text-muted-foreground cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
              >
                أُقرّ بأنني قرأت وفهمت جميع الشروط والأحكام المذكورة أعلاه، وأوافق على الالتزام بها كاملة.
                هذا الإقرار ملزم قانوناً ويُعتبر توقيعي الإلكتروني موافقة صريحة.
              </label>
            </div>
            
            <Button
              onClick={handleSign}
              disabled={!canSign || isSigning}
              className="w-full gap-2"
              size="lg"
            >
              {isSigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ التوقيع...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  توقيع الإقرار إلكترونياً
                </>
              )}
            </Button>
            
            {!canSign && !isSigning && (
              <p className="text-xs text-center text-muted-foreground">
                {!hasReachedBottom 
                  ? `يرجى التمرير حتى نهاية الوثيقة (${scrollPercentage}% من ${MIN_SCROLL_PERCENTAGE}%)`
                  : readingTimeSeconds < MIN_READING_TIME_SECONDS
                  ? `يرجى الانتظار ${MIN_READING_TIME_SECONDS - readingTimeSeconds} ثانية إضافية`
                  : !hasConfirmed
                  ? 'يرجى تأكيد قراءة الشروط'
                  : ''}
              </p>
            )}
          </div>
        )}
        
        {/* Signed Info */}
        {isSigned && acknowledgmentData?.signature_record && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">تم التوقيع إلكترونياً</span>
            </div>
            <div className="text-sm text-green-600 space-y-1">
              <p>تاريخ التوقيع: {new Date(acknowledgmentData.signature_record.signed_at).toLocaleString('ar-SA')}</p>
              {acknowledgmentData.signature_record.reading_time_seconds && (
                <p>مدة القراءة: {Math.floor(acknowledgmentData.signature_record.reading_time_seconds / 60)} دقيقة</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
