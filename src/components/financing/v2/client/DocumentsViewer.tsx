/**
 * MaxioCore Financing V2 - Documents Viewer
 * عارض المستندات للعميل
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  FileCheck,
  Download,
  Eye,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  type: 'acknowledgment' | 'contract' | 'bond';
  title: string;
  status: 'pending' | 'signed' | 'expired';
  pdfUrl?: string;
  signedAt?: string;
  createdAt: string;
  number: string;
}

interface DocumentsViewerProps {
  applicationId: string;
}

const DOCUMENT_ICONS = {
  acknowledgment: FileCheck,
  contract: FileText,
  bond: FileText,
};

const DOCUMENT_TITLES = {
  acknowledgment: 'إقرار الشروط والأحكام',
  contract: 'عقد التمويل',
  bond: 'سند الأمر التنفيذي',
};

const STATUS_CONFIG = {
  pending: {
    label: 'بانتظار التوقيع',
    color: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  signed: {
    label: 'موقّع',
    color: 'bg-success/10 text-success',
    icon: CheckCircle2,
  },
  expired: {
    label: 'منتهي الصلاحية',
    color: 'bg-destructive/10 text-destructive',
    icon: AlertCircle,
  },
};

export function DocumentsViewer({ applicationId }: DocumentsViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['financing-documents-v2', applicationId],
    queryFn: async (): Promise<Document[]> => {
      const docs: Document[] = [];

      // Fetch acknowledgment
      const { data: ack } = await supabase
        .from('financing_acknowledgments')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (ack) {
        docs.push({
          id: ack.id,
          type: 'acknowledgment',
          title: DOCUMENT_TITLES.acknowledgment,
          status: ack.signed_at ? 'signed' : 'pending',
          pdfUrl: ack.pdf_url || undefined,
          signedAt: ack.signed_at || undefined,
          createdAt: ack.created_at || '',
          number: ack.acknowledgment_number,
        });
      }

      // Fetch contract
      const { data: contract } = await supabase
        .from('financing_contract_documents')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (contract) {
        const isExpired = contract.expired_at && new Date(contract.expired_at) < new Date();
        docs.push({
          id: contract.id,
          type: 'contract',
          title: DOCUMENT_TITLES.contract,
          status: contract.signed_at ? 'signed' : isExpired ? 'expired' : 'pending',
          pdfUrl: contract.pdf_url || undefined,
          signedAt: contract.signed_at || undefined,
          createdAt: contract.created_at || '',
          number: contract.contract_number,
        });
      }

      // Fetch bond
      const { data: bond } = await supabase
        .from('financing_executive_bonds')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle();

      if (bond) {
        docs.push({
          id: bond.id,
          type: 'bond',
          title: DOCUMENT_TITLES.bond,
          status: bond.signed_at ? 'signed' : 'pending',
          pdfUrl: undefined, // Bond PDFs are managed via Nafith
          signedAt: bond.signed_at || undefined,
          createdAt: bond.created_at || '',
          number: bond.bond_number || '',
        });
      }

      return docs;
    },
    enabled: !!applicationId,
  });

  const handlePreview = (doc: Document) => {
    if (doc.pdfUrl) {
      setPreviewUrl(doc.pdfUrl);
      setPreviewTitle(doc.title);
    }
  };

  const handleDownload = (doc: Document) => {
    if (doc.pdfUrl) {
      window.open(doc.pdfUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>لا توجد مستندات متاحة حالياً</p>
        <p className="text-sm mt-1">ستظهر المستندات هنا عند إصدارها</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {documents.map((doc, index) => {
          const Icon = DOCUMENT_ICONS[doc.type];
          const statusConfig = STATUS_CONFIG[doc.status];
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "p-3 rounded-xl",
                      doc.status === 'signed' ? 'bg-success/10' : 'bg-muted'
                    )}>
                      <Icon className={cn(
                        "w-6 h-6",
                        doc.status === 'signed' ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <Badge className={cn("text-xs font-normal", statusConfig.color)}>
                          <StatusIcon className="w-3 h-3 ml-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        رقم المستند: {doc.number}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          تاريخ الإصدار: {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: ar })}
                        </span>
                        {doc.signedAt && (
                          <span className="text-success">
                            تاريخ التوقيع: {format(new Date(doc.signedAt), 'dd MMM yyyy', { locale: ar })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {doc.pdfUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(doc)}
                            title="معاينة"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(doc)}
                            title="تحميل"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewTitle}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(previewUrl!, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                فتح في نافذة جديدة
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg border"
                title={previewTitle}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
