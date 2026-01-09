/**
 * هوك إدارة عقود التمويل
 * Financing Contract Hook
 * 
 * يوفر واجهة React للتعامل مع عقود التمويل
 */

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contractService, type FinancingContract, type ContractStatus } from "@/lib/financing/contractService";
import type { ContractPlaceholders } from "@/lib/financing/serviceFinancingContract";

interface UseFinancingContractOptions {
  applicationId?: string;
  contractId?: string;
  userId?: string;
  autoMarkViewed?: boolean;
}

export function useFinancingContract(options: UseFinancingContractOptions = {}) {
  const { applicationId, contractId, userId, autoMarkViewed = false } = options;
  const queryClient = useQueryClient();
  const [hasMarkedViewed, setHasMarkedViewed] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // Queries
  // ═══════════════════════════════════════════════════════════

  // جلب العقد بواسطة المعرف
  const contractByIdQuery = useQuery({
    queryKey: ["financing-contract", contractId],
    queryFn: async () => {
      if (!contractId) return null;
      const result = await contractService.getContractById(contractId);
      if (!result.success) throw new Error(result.error);
      return result.contract;
    },
    enabled: !!contractId,
  });

  // جلب العقد بواسطة معرف الطلب
  const contractByAppQuery = useQuery({
    queryKey: ["financing-contract-by-app", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const result = await contractService.getContractByApplicationId(applicationId);
      if (!result.success) return null; // قد لا يوجد عقد
      return result.contract;
    },
    enabled: !!applicationId && !contractId,
  });

  // جلب أحداث العقد
  const eventsQuery = useQuery({
    queryKey: ["financing-contract-events", contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const result = await contractService.getContractEvents(contractId);
      if (!result.success) throw new Error(result.error);
      return result.events || [];
    },
    enabled: !!contractId,
  });

  // العقد الحالي
  const contract = contractByIdQuery.data || contractByAppQuery.data;
  const isLoading = contractByIdQuery.isLoading || contractByAppQuery.isLoading;
  const error = contractByIdQuery.error || contractByAppQuery.error;

  // ═══════════════════════════════════════════════════════════
  // Mutations
  // ═══════════════════════════════════════════════════════════

  // إنشاء عقد جديد
  const createMutation = useMutation({
    mutationFn: async (data: { applicationId: string; userId: string; contractData: ContractPlaceholders }) => {
      const result = await contractService.createContract({
        application_id: data.applicationId,
        user_id: data.userId,
        contract_data: data.contractData,
      });
      if (!result.success) throw new Error(result.error);
      return result.contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      queryClient.invalidateQueries({ queryKey: ["financing-contract-by-app"] });
      toast.success("تم إنشاء العقد بنجاح");
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل إنشاء العقد");
    },
  });

  // تسجيل المشاهدة
  const markViewedMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await contractService.markContractViewed(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      queryClient.invalidateQueries({ queryKey: ["financing-contract-by-app"] });
    },
  });

  // قبول العقد
  const acceptMutation = useMutation({
    mutationFn: async (data: { contractId: string; pdfHash: string; pdfUrl?: string }) => {
      const result = await contractService.acceptContract({
        contract_id: data.contractId,
        checkbox_accepted: true,
        button_clicked: true,
        pdf_hash: data.pdfHash,
        pdf_url: data.pdfUrl,
      });
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      queryClient.invalidateQueries({ queryKey: ["financing-contract-by-app"] });
      toast.success("تم قبول العقد بنجاح");
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل قبول العقد");
    },
  });

  // اعتماد العقد نهائياً
  const finalizeMutation = useMutation({
    mutationFn: async (data: { contractId: string; userId: string }) => {
      const result = await contractService.finalizeContract(data.contractId, data.userId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      queryClient.invalidateQueries({ queryKey: ["financing-contract-by-app"] });
      toast.success("تم اعتماد العقد نهائياً", {
        description: "لا يمكن تعديل العقد بعد الاعتماد",
      });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل اعتماد العقد");
    },
  });

  // إنشاء نسخة جديدة
  const createNewVersionMutation = useMutation({
    mutationFn: async (data: { originalContractId: string; newData?: ContractPlaceholders; reason?: string }) => {
      const result = await contractService.createNewVersion(
        data.originalContractId,
        data.newData,
        data.reason
      );
      if (!result.success) throw new Error(result.error);
      return result.newContractId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      toast.success("تم إنشاء نسخة جديدة من العقد");
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل إنشاء نسخة جديدة");
    },
  });

  // إلغاء العقد
  const cancelMutation = useMutation({
    mutationFn: async (data: { contractId: string; reason: string }) => {
      const result = await contractService.cancelContract(data.contractId, data.reason);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financing-contract"] });
      toast.success("تم إلغاء العقد");
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل إلغاء العقد");
    },
  });

  // ═══════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════

  // تسجيل المشاهدة تلقائياً
  useEffect(() => {
    if (autoMarkViewed && contract && !hasMarkedViewed && contract.status === "draft") {
      markViewedMutation.mutate(contract.id);
      setHasMarkedViewed(true);
    }
  }, [autoMarkViewed, contract, hasMarkedViewed]);

  // ═══════════════════════════════════════════════════════════
  // Helper Functions
  // ═══════════════════════════════════════════════════════════

  const canModify = useCallback((): boolean => {
    if (!contract) return false;
    return contractService.canModifyContract(contract);
  }, [contract]);

  const getStatusLabel = useCallback((status?: ContractStatus): string => {
    return contractService.getStatusLabel(status || contract?.status || "draft");
  }, [contract]);

  const getStatusColor = useCallback((status?: ContractStatus): string => {
    return contractService.getStatusColor(status || contract?.status || "draft");
  }, [contract]);

  // ═══════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════

  const createContract = useCallback(
    async (contractData: ContractPlaceholders) => {
      if (!applicationId || !userId) {
        toast.error("بيانات غير مكتملة لإنشاء العقد");
        return null;
      }
      return createMutation.mutateAsync({
        applicationId,
        userId,
        contractData,
      });
    },
    [applicationId, userId, createMutation]
  );

  const markViewed = useCallback(async () => {
    if (!contract?.id) return;
    await markViewedMutation.mutateAsync(contract.id);
  }, [contract, markViewedMutation]);

  const acceptContract = useCallback(
    async (pdfHash: string, pdfUrl?: string) => {
      if (!contract?.id) {
        toast.error("العقد غير موجود");
        return;
      }
      await acceptMutation.mutateAsync({
        contractId: contract.id,
        pdfHash,
        pdfUrl,
      });
    },
    [contract, acceptMutation]
  );

  const finalizeContract = useCallback(async () => {
    if (!contract?.id || !userId) {
      toast.error("بيانات غير مكتملة للاعتماد");
      return;
    }
    await finalizeMutation.mutateAsync({
      contractId: contract.id,
      userId,
    });
  }, [contract, userId, finalizeMutation]);

  const createNewVersion = useCallback(
    async (newData?: ContractPlaceholders, reason?: string) => {
      if (!contract?.id) {
        toast.error("العقد غير موجود");
        return null;
      }
      return createNewVersionMutation.mutateAsync({
        originalContractId: contract.id,
        newData,
        reason,
      });
    },
    [contract, createNewVersionMutation]
  );

  const cancelContract = useCallback(
    async (reason: string) => {
      if (!contract?.id) {
        toast.error("العقد غير موجود");
        return;
      }
      await cancelMutation.mutateAsync({
        contractId: contract.id,
        reason,
      });
    },
    [contract, cancelMutation]
  );

  // ═══════════════════════════════════════════════════════════
  // Return
  // ═══════════════════════════════════════════════════════════

  return {
    // Data
    contract,
    events: eventsQuery.data || [],
    isLoading,
    error,

    // Status helpers
    canModify,
    getStatusLabel,
    getStatusColor,
    isFinalized: contract?.status === "finalized",
    isAccepted: contract?.status === "accepted",
    isPresented: contract?.status === "presented",
    isDraft: contract?.status === "draft",

    // Actions
    createContract,
    markViewed,
    acceptContract,
    finalizeContract,
    createNewVersion,
    cancelContract,

    // Mutation states
    isCreating: createMutation.isPending,
    isAccepting: acceptMutation.isPending,
    isFinalizing: finalizeMutation.isPending,
    isCreatingNewVersion: createNewVersionMutation.isPending,
    isCancelling: cancelMutation.isPending,

    // Refetch
    refetch: () => {
      contractByIdQuery.refetch();
      contractByAppQuery.refetch();
      eventsQuery.refetch();
    },
  };
}

export default useFinancingContract;
