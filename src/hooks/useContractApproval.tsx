/**
 * useContractApproval Hook
 * 
 * يدير عملية الموافقة على عقد تمويل الخدمات
 * ويمنع إرسال الطلب بدون موافقة صريحة
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { 
  ContractApprovalRecord, 
  ContractPlaceholders 
} from "@/lib/financing/serviceFinancingContract";
import { 
  validateContractApproval,
  CONTRACT_INFO,
} from "@/lib/financing/serviceFinancingContract";
import { COMPANY_INFO } from "@/lib/financing/serviceFinancingPolicy";

interface UseContractApprovalOptions {
  applicationId: string;
  userId: string;
  onApprovalComplete?: (record: ContractApprovalRecord) => void;
}

interface ContractApprovalState {
  isContractViewed: boolean;
  isContractApproved: boolean;
  approvalRecord: ContractApprovalRecord | null;
  approvalTimestamp: string | null;
  viewStartTime: string | null;
  viewDurationMs: number;
}

export function useContractApproval({
  applicationId,
  userId,
  onApprovalComplete,
}: UseContractApprovalOptions) {
  const [state, setState] = useState<ContractApprovalState>({
    isContractViewed: false,
    isContractApproved: false,
    approvalRecord: null,
    approvalTimestamp: null,
    viewStartTime: null,
    viewDurationMs: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * تسجيل بدء عرض العقد
   */
  const markContractViewed = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isContractViewed: true,
      viewStartTime: new Date().toISOString(),
    }));
  }, []);

  /**
   * معالجة الموافقة على العقد
   */
  const approveContract = useCallback(
    async (additionalData?: Partial<ContractApprovalRecord>) => {
      if (!state.isContractViewed) {
        toast.error("يجب عرض العقد أولاً قبل الموافقة");
        return { success: false, error: "contract_not_viewed" };
      }

      setIsProcessing(true);

      try {
        const now = new Date();
        const viewDuration = state.viewStartTime
          ? now.getTime() - new Date(state.viewStartTime).getTime()
          : 0;

        const approvalRecord: ContractApprovalRecord = {
          contract_id: `CNT-${applicationId}-${now.getTime()}`,
          application_id: applicationId,
          user_id: userId,
          approved_at: now.toISOString(),
          checkbox_accepted: true,
          button_clicked: true,
          contract_version: CONTRACT_INFO.version,
          ...additionalData,
        };

        // Validate the approval record
        const validation = validateContractApproval(approvalRecord);
        if (!validation.isValid) {
          toast.error("خطأ في بيانات الموافقة: " + validation.errors.join("، "));
          return { success: false, errors: validation.errors };
        }

        // Simulate API call to save approval
        await new Promise((resolve) => setTimeout(resolve, 500));

        setState((prev) => ({
          ...prev,
          isContractApproved: true,
          approvalRecord,
          approvalTimestamp: now.toISOString(),
          viewDurationMs: viewDuration,
        }));

        toast.success("تم اعتماد العقد بنجاح");
        onApprovalComplete?.(approvalRecord);

        return { success: true, record: approvalRecord };
      } catch (error) {
        console.error("Contract approval error:", error);
        toast.error("حدث خطأ أثناء اعتماد العقد");
        return { success: false, error: "approval_failed" };
      } finally {
        setIsProcessing(false);
      }
    },
    [applicationId, userId, state.isContractViewed, state.viewStartTime, onApprovalComplete]
  );

  /**
   * التحقق من إمكانية إرسال الطلب
   */
  const canSubmitApplication = useCallback((): {
    canSubmit: boolean;
    reason?: string;
  } => {
    if (!state.isContractViewed) {
      return {
        canSubmit: false,
        reason: "يجب عرض العقد أولاً",
      };
    }

    if (!state.isContractApproved) {
      return {
        canSubmit: false,
        reason: "يجب الموافقة على العقد واعتماده",
      };
    }

    if (!state.approvalRecord) {
      return {
        canSubmit: false,
        reason: "لم يتم تسجيل الموافقة بشكل صحيح",
      };
    }

    return { canSubmit: true };
  }, [state]);

  /**
   * إعادة تعيين حالة الموافقة
   */
  const resetApproval = useCallback(() => {
    setState({
      isContractViewed: false,
      isContractApproved: false,
      approvalRecord: null,
      approvalTimestamp: null,
      viewStartTime: null,
      viewDurationMs: 0,
    });
  }, []);

  /**
   * توليد بيانات العقد من بيانات الطلب
   */
  const generateContractData = useCallback(
    (applicationData: {
      fullName: string;
      nationalId: string;
      phone: string;
      email: string;
      address?: string;
      services: Array<{ name: string; price: number; quantity: number }>;
      amount: number;
      adminFees: number;
      vatAmount: number;
      totalAmount: number;
      downPayment?: number;
      installmentsCount: number;
      installmentAmount: number;
      firstDueDate: string;
    }): ContractPlaceholders => {
      const servicesTable = applicationData.services.map((s) => ({
        name: s.name,
        price: s.price,
        quantity: s.quantity,
        total: s.price * s.quantity,
      }));

      // Generate installments schedule
      const installmentsSchedule = Array.from(
        { length: applicationData.installmentsCount },
        (_, i) => {
          const dueDate = new Date(applicationData.firstDueDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          return {
            number: i + 1,
            amount: applicationData.installmentAmount,
            dueDate: dueDate.toLocaleDateString("ar-SA"),
            status: "pending" as const,
          };
        }
      );

      const lastDueDate = new Date(applicationData.firstDueDate);
      lastDueDate.setMonth(
        lastDueDate.getMonth() + applicationData.installmentsCount - 1
      );

      return {
        customer_name: applicationData.fullName,
        customer_national_id: applicationData.nationalId,
        customer_phone: applicationData.phone,
        customer_email: applicationData.email,
        customer_address: applicationData.address,
        order_id: applicationId,
        application_number: `FIN-${applicationId.slice(0, 8).toUpperCase()}`,
        application_date: new Date().toLocaleDateString("ar-SA"),
        services_table: servicesTable,
        total_services_value: applicationData.amount,
        admin_fees: applicationData.adminFees,
        vat_amount: applicationData.vatAmount,
        total_amount: applicationData.totalAmount,
        down_payment: applicationData.downPayment,
        financed_amount:
          applicationData.totalAmount - (applicationData.downPayment || 0),
        installments_count: applicationData.installmentsCount,
        installment_amount: applicationData.installmentAmount,
        first_due_date: applicationData.firstDueDate,
        last_due_date: lastDueDate.toLocaleDateString("ar-SA"),
        installments_schedule: installmentsSchedule,
        service_provider: COMPANY_INFO.name,
      };
    },
    [applicationId]
  );

  return {
    // State
    isContractViewed: state.isContractViewed,
    isContractApproved: state.isContractApproved,
    approvalRecord: state.approvalRecord,
    approvalTimestamp: state.approvalTimestamp,
    viewDurationMs: state.viewDurationMs,
    isProcessing,

    // Actions
    markContractViewed,
    approveContract,
    canSubmitApplication,
    resetApproval,
    generateContractData,
  };
}

/**
 * منع إرسال الطلب بدون موافقة العقد
 */
export function requireContractApproval(
  isApproved: boolean,
  approvalRecord: ContractApprovalRecord | null
): void {
  if (!isApproved || !approvalRecord) {
    throw new Error("CONTRACT_APPROVAL_REQUIRED: لا يمكن إرسال الطلب بدون موافقة على العقد");
  }
}
