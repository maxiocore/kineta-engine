import { useState } from "react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileText, Send, BarChart3 } from "lucide-react";
import SMSTemplatesTab from "@/components/admin/sms/SMSTemplatesTab";
import SMSLogsTab from "@/components/admin/sms/SMSLogsTab";
import SMSSendTab from "@/components/admin/sms/SMSSendTab";
import SMSStatsTab from "@/components/admin/sms/SMSStatsTab";

const AdminSMSHub = () => {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">إدارة الرسائل النصية SMS</h1>
            <p className="text-sm text-muted-foreground">تحكم كامل بقوالب الرسائل وسجل الإرسال والإحصائيات</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="templates" className="gap-2 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">القوالب</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">سجل الرسائل</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-2 text-xs sm:text-sm">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">إرسال يدوي</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">إحصائيات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <SMSTemplatesTab />
          </TabsContent>
          <TabsContent value="logs">
            <SMSLogsTab />
          </TabsContent>
          <TabsContent value="send">
            <SMSSendTab />
          </TabsContent>
          <TabsContent value="stats">
            <SMSStatsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSMSHub;
