import { useSearchParams } from "react-router-dom";
import { Cloud } from "lucide-react";
import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import OverviewSection from "@/components/admin/cloud/OverviewSection";
import ServersSection from "@/components/admin/cloud/ServersSection";
import { OrdersSection, ProvisioningSection } from "@/components/admin/cloud/OrdersSection";
import PlansSection from "@/components/admin/cloud/PlansSection";
import PricingSection from "@/components/admin/cloud/PricingSection";
import StarterPlanBuilder from "@/components/admin/cloud/StarterPlanBuilder";
import ProvisioningTestsSection from "@/components/admin/cloud/ProvisioningTestsSection";
import AdvancedLifecycleTestSection from "@/components/admin/cloud/AdvancedLifecycleTestSection";
import ProvidersSection from "@/components/admin/cloud/ProvidersSection";
import { LocationsSection, ImagesSection, MappingsSection, NetworksSection, BackupsSnapshotsSection, BillingSection, ActivitySection, SettingsSection } from "@/components/admin/cloud/ResourcesSections";

const AdminCloud = () => {
  const { t, lang, isRtl } = useLanguage();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") ?? "overview";
  const go = (k: string) => setSp({ tab: k }, { replace: true });

  const tabs: [string, string, string][] = [
    ["overview", "نظرة عامة", "Overview"], ["servers", "الخوادم", "Servers"], ["orders", "الطلبات", "Orders"],
    ["vps", "Cloud VPS", "Cloud VPS"], ["dedicated", "Dedicated Servers", "Dedicated Servers"], ["plans", "الباقات والأسعار", "Plans & pricing"], ["pricing", "التسعير والعملات", "Pricing & currency"], ["builder", "Starter Plan Builder", "Starter Plan Builder"],
    ["locations", "المواقع", "Locations"], ["images", "أنظمة التشغيل", "Operating systems"], ["networks", "الشبكات وعناوين IP", "Networks & IPs"],
    ["backups", "النسخ الاحتياطية", "Backups"], ["snapshots", "Snapshots", "Snapshots"], ["provisioning", "عمليات Provisioning", "Provisioning"], ["e2e-tests", "اختبارات Provisioning", "Provisioning Tests"],
    ["providers", "مزودو البنية التحتية", "Providers"], ["billing", "الفوترة والاشتراكات", "Billing & subscriptions"],
    ["suspensions", "الإيقافات والإلغاءات", "Suspensions & cancellations"], ["activity", "سجل العمليات", "Activity log"], ["settings", "الإعدادات", "Settings"],
  ];

  const body = () => {
    switch (tab) {
      case "servers": return <ServersSection t={t} lang={lang} />;
      case "orders": return <OrdersSection t={t} lang={lang} />;
      case "vps": return <PlansSection t={t} lang={lang} type="vps" />;
      case "dedicated": return <PlansSection t={t} lang={lang} type="dedicated" />;
      case "plans": return <div className="space-y-6"><h3 className="font-semibold">Cloud VPS</h3><PlansSection t={t} lang={lang} type="vps" /><h3 className="font-semibold">Dedicated</h3><PlansSection t={t} lang={lang} type="dedicated" /></div>;
      case "locations": return <div className="space-y-6"><LocationsSection t={t} /><MappingsSection t={t} /></div>;
      case "images": return <div className="space-y-6"><ImagesSection t={t} /><MappingsSection t={t} /></div>;
      case "networks": return <NetworksSection t={t} />;
      case "backups": return <BackupsSnapshotsSection t={t} lang={lang} table="cloud_backups" />;
      case "snapshots": return <BackupsSnapshotsSection t={t} lang={lang} table="cloud_snapshots" />;
      case "provisioning": return <ProvisioningSection t={t} lang={lang} />;
      case "e2e-tests": return <div className="space-y-8"><AdvancedLifecycleTestSection t={t} lang={lang} /><ProvisioningTestsSection t={t} lang={lang} /></div>;
      case "builder": return <StarterPlanBuilder t={t} />;
      case "pricing": return <PricingSection t={t} lang={lang} />;
      case "providers": return <ProvidersSection t={t} lang={lang} />;
      case "billing": return <BillingSection t={t} lang={lang} />;
      case "suspensions": return <ServersSection t={t} lang={lang} statusFilter={["suspended", "cancelled"]} />;
      case "activity": return <ActivitySection t={t} lang={lang} />;
      case "settings": return <SettingsSection t={t} />;
      default: return <OverviewSection t={t} lang={lang} go={go} />;
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-5 min-w-0" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Cloud className="w-5 h-5" /></div>
          <div><h1 className="text-lg font-bold">{t("الخوادم والبنية السحابية", "Cloud Infrastructure")}</h1>
            <p className="text-xs text-muted-foreground">{t("بيانات حقيقية فقط", "Live data only")}</p></div>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1" aria-label="cloud sections">
          {tabs.map(([k, ar, en]) => (
            <button key={k} onClick={() => go(k)} className={cn("shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              tab === k ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-muted")}>{t(ar, en)}</button>
          ))}
        </nav>
        <div className="min-w-0">{body()}</div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminCloud;
