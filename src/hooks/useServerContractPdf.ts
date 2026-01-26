/**
 * Hook لإدارة توليد وتحميل عقود PDF السيرفرية
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  generateServerContractPdf,
  downloadContractAsPdf,
  previewContract,
  type ContractPdfResponse,
} from '@/lib/financing/serverContractPdf';

interface UseServerContractPdfReturn {
  isLoading: boolean;
  contractHtml: string | null;
  contractData: ContractPdfResponse | null;
  error: string | null;
  generateContract: (applicationId: string) => Promise<ContractPdfResponse | null>;
  downloadContract: (applicationNumber: string) => void;
  previewContract: () => Window | null;
}

export function useServerContractPdf(): UseServerContractPdfReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [contractHtml, setContractHtml] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractPdfResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateContract = useCallback(async (applicationId: string): Promise<ContractPdfResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await generateServerContractPdf(applicationId, true);
      setContractHtml(response.html);
      setContractData(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل توليد العقد';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadContract = useCallback((applicationNumber: string) => {
    if (!contractHtml) {
      toast.error('لم يتم توليد العقد بعد');
      return;
    }
    
    try {
      downloadContractAsPdf(contractHtml, applicationNumber);
      toast.success('سيتم فتح نافذة الطباعة لحفظ العقد كـ PDF');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل تحميل العقد';
      toast.error(errorMessage);
    }
  }, [contractHtml]);

  const handlePreviewContract = useCallback((): Window | null => {
    if (!contractHtml) {
      toast.error('لم يتم توليد العقد بعد');
      return null;
    }
    
    const previewWindow = previewContract(contractHtml);
    if (!previewWindow) {
      toast.error('تم حظر النوافذ المنبثقة. يرجى السماح بها لعرض العقد.');
    }
    return previewWindow;
  }, [contractHtml]);

  return {
    isLoading,
    contractHtml,
    contractData,
    error,
    generateContract,
    downloadContract,
    previewContract: handlePreviewContract,
  };
}
