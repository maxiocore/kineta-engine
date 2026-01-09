/**
 * خدمة إدارة عقود التمويل
 * Financing Contract Service
 * 
 * تتعامل مع إنشاء العقود، تحديث حالاتها، وإدارة دورة حياة العقد
 */

import { supabase } from "@/integrations/supabase/client";
import type { ContractPlaceholders, ContractApprovalRecord } from "./serviceFinancingContract";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type ContractStatus = "draft" | "presented" | "accepted" | "finalized";

export interface FinancingContract {
  id: string;
  application_id: string;
  user_id: string;
  contract_number: string;
  version: number;
  parent_contract_id: string | null;
  status: ContractStatus;
  contract_data: ContractPlaceholders;
  pdf_url: string | null;
  pdf_hash: string | null;
  pdf_generated_at: string | null;
  viewed_at: string | null;
  viewed_count: number;
  accepted_at: string | null;
  acceptance_checkbox: boolean;
  acceptance_button_clicked: boolean;
  acceptance_ip_address: string | null;
  acceptance_user_agent: string | null;
  acceptance_device_info: Record<string, unknown> | null;
  finalized_at: string | null;
  finalized_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractEvent {
  id: string;
  contract_id: string;
  event_type: string;
  old_status: ContractStatus | null;
  new_status: ContractStatus | null;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateContractInput {
  application_id: string;
  user_id: string;
  contract_data: ContractPlaceholders;
}

export interface AcceptContractInput {
  contract_id: string;
  checkbox_accepted: boolean;
  button_clicked: boolean;
  pdf_hash: string;
  pdf_url?: string;
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

/**
 * جمع معلومات الجهاز
 */
function getDeviceInfo(): Record<string, unknown> {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════
// Contract Service
// ═══════════════════════════════════════════════════════════

export const contractService = {
  /**
   * إنشاء عقد جديد (حالة DRAFT)
   */
  async createContract(input: CreateContractInput): Promise<{
    success: boolean;
    contract?: FinancingContract;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("financing_contracts")
        .insert([{
          application_id: input.application_id,
          user_id: input.user_id,
          contract_data: JSON.parse(JSON.stringify(input.contract_data)),
          status: "draft" as const,
          contract_number: "",
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        contract: data as unknown as FinancingContract,
      };
    } catch (error: unknown) {
      console.error("Error creating contract:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل إنشاء العقد",
      };
    }
  },

  /**
   * جلب عقد بواسطة المعرف
   */
  async getContractById(contractId: string): Promise<{
    success: boolean;
    contract?: FinancingContract;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("financing_contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (error) throw error;

      return {
        success: true,
        contract: data as unknown as FinancingContract,
      };
    } catch (error: unknown) {
      console.error("Error fetching contract:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل جلب العقد",
      };
    }
  },

  /**
   * جلب عقد بواسطة معرف الطلب
   */
  async getContractByApplicationId(applicationId: string): Promise<{
    success: boolean;
    contract?: FinancingContract;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("financing_contracts")
        .select("*")
        .eq("application_id", applicationId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      return {
        success: true,
        contract: data as unknown as FinancingContract,
      };
    } catch (error: unknown) {
      console.error("Error fetching contract by application:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل جلب العقد",
      };
    }
  },

  /**
   * تسجيل مشاهدة العقد (تحويل إلى PRESENTED)
   */
  async markContractViewed(contractId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: contract, error: fetchError } = await supabase
        .from("financing_contracts")
        .select("status, viewed_count, viewed_at")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        viewed_count: (contract?.viewed_count || 0) + 1,
        viewed_at: contract?.viewed_at || now,
      };

      // تحويل إلى presented إذا كان draft
      if (contract?.status === "draft") {
        updates.status = "presented";
      }

      const { error } = await supabase
        .from("financing_contracts")
        .update(updates)
        .eq("id", contractId);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error("Error marking contract viewed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل تسجيل المشاهدة",
      };
    }
  },

  /**
   * قبول العقد (تحويل إلى ACCEPTED)
   */
  async acceptContract(input: AcceptContractInput): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const deviceInfo = getDeviceInfo();
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("financing_contracts")
        .update({
          status: "accepted" as const,
          acceptance_checkbox: input.checkbox_accepted,
          acceptance_button_clicked: input.button_clicked,
          pdf_hash: input.pdf_hash,
          pdf_url: input.pdf_url || null,
          pdf_generated_at: now,
          accepted_at: now,
          acceptance_user_agent: navigator.userAgent,
          acceptance_device_info: JSON.parse(JSON.stringify(deviceInfo)),
        })
        .eq("id", input.contract_id);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error("Error accepting contract:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل قبول العقد",
      };
    }
  },

  /**
   * اعتماد العقد نهائياً (تحويل إلى FINALIZED)
   */
  async finalizeContract(contractId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // التحقق من المتطلبات
      const { data: contract, error: fetchError } = await supabase
        .from("financing_contracts")
        .select("*")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      if (!contract) {
        return { success: false, error: "العقد غير موجود" };
      }

      if (contract.status !== "accepted") {
        return { success: false, error: "يجب قبول العقد أولاً قبل الاعتماد النهائي" };
      }

      if (!contract.viewed_at) {
        return { success: false, error: "يجب مشاهدة العقد أولاً" };
      }

      if (!contract.acceptance_checkbox || !contract.acceptance_button_clicked) {
        return { success: false, error: "يجب الموافقة على الشروط أولاً" };
      }

      if (!contract.pdf_hash) {
        return { success: false, error: "يجب توليد نسخة PDF أولاً" };
      }

      const { error } = await supabase
        .from("financing_contracts")
        .update({
          status: "finalized",
          finalized_by: userId,
        })
        .eq("id", contractId);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error("Error finalizing contract:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل اعتماد العقد",
      };
    }
  },

  /**
   * إنشاء نسخة جديدة من العقد (للتعديلات بعد الاعتماد)
   */
  async createNewVersion(
    originalContractId: string,
    newContractData?: ContractPlaceholders,
    reason?: string
  ): Promise<{
    success: boolean;
    newContractId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("create_contract_new_version", {
        p_original_contract_id: originalContractId,
        p_new_contract_data: newContractData ? JSON.parse(JSON.stringify(newContractData)) : null,
        p_reason: reason || "تعديل بناءً على طلب العميل",
      });

      if (error) throw error;

      return {
        success: true,
        newContractId: data as string,
      };
    } catch (error: unknown) {
      console.error("Error creating new version:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل إنشاء نسخة جديدة",
      };
    }
  },

  /**
   * جلب سجل أحداث العقد
   */
  async getContractEvents(contractId: string): Promise<{
    success: boolean;
    events?: ContractEvent[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("financing_contract_events")
        .select("*")
        .eq("contract_id", contractId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        events: data as unknown as ContractEvent[],
      };
    } catch (error: unknown) {
      console.error("Error fetching contract events:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل جلب سجل الأحداث",
      };
    }
  },

  /**
   * جلب جميع عقود المستخدم
   */
  async getUserContracts(userId: string): Promise<{
    success: boolean;
    contracts?: FinancingContract[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("financing_contracts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        contracts: data as unknown as FinancingContract[],
      };
    } catch (error: unknown) {
      console.error("Error fetching user contracts:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل جلب العقود",
      };
    }
  },

  /**
   * إلغاء العقد
   */
  async cancelContract(contractId: string, reason: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: contract, error: fetchError } = await supabase
        .from("financing_contracts")
        .select("status")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      if (contract?.status === "finalized") {
        return { success: false, error: "لا يمكن إلغاء عقد تم اعتماده نهائياً" };
      }

      const { error } = await supabase
        .from("financing_contracts")
        .update({
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq("id", contractId);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error("Error cancelling contract:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل إلغاء العقد",
      };
    }
  },

  /**
   * التحقق من إمكانية تعديل العقد
   */
  canModifyContract(contract: FinancingContract): boolean {
    return contract.status !== "finalized" && !contract.cancelled_at;
  },

  /**
   * الحصول على مسمى الحالة بالعربية
   */
  getStatusLabel(status: ContractStatus): string {
    const labels: Record<ContractStatus, string> = {
      draft: "مسودة",
      presented: "معروض",
      accepted: "مقبول",
      finalized: "معتمد نهائياً",
    };
    return labels[status] || status;
  },

  /**
   * الحصول على لون الحالة
   */
  getStatusColor(status: ContractStatus): string {
    const colors: Record<ContractStatus, string> = {
      draft: "bg-gray-500",
      presented: "bg-blue-500",
      accepted: "bg-amber-500",
      finalized: "bg-emerald-500",
    };
    return colors[status] || "bg-gray-500";
  },
};

export default contractService;
