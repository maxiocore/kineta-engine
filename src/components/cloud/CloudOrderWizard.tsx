import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight, Cloud, HardDrive, MapPin, Cpu, Disc, Settings2, ClipboardCheck, CreditCard, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { db, useCatalog, useCloudTable, sar, EmptyState } from "./cloudShared";

const VAT = 0.15;

const CloudOrderWizard = ({ initialType }: { initialType?: "vps" | "dedicated" }) => {
  const { t, lang, isRtl } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: plans = [] } = useCatalog("cloud_plans");
  const { data: locations = [] } = useCatalog("cloud_locations");
  const { data: images = [] } = useCatalog("cloud_images");
  const { data: keys = [] } = useCloudTable("cloud_ssh_keys", "keys");

  const [step, setStep] = useState(initialType ? 1 : 0);
  const [type, setType] = useState<"vps" | "dedicated" | null>(initialType ?? null);
  const [loc, setLoc] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [sshKey, setSshKey] = useState<string | null>(null);
  const [backups, setBackups] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { icon: Cloud, ar: "نوع الخدمة", en: "Type" },
    { icon: MapPin, ar: "الموقع", en: "Location" },
    { icon: Cpu, ar: "الباقة", en: "Plan" },
    { icon: Disc, ar: "نظام التشغيل", en: "OS" },
    { icon: Settings2, ar: "الإعدادات", en: "Config" },
    { icon: ClipboardCheck, ar: "المراجعة", en: "Review" },
    { icon: CreditCard, ar: "الدفع", en: "Payment" },
  ];

  const availablePlans = useMemo(
    () => plans.filter((p) => p.server_type === type && (!p.location_codes?.length || (loc && p.location_codes.includes(loc)))),
    [plans, type, loc],
  );
  const plan = plans.find((p) => p.id === planId);
  const monthly = plan ? Number(plan.monthly_price) * (backups ? 1.2 : 1) : 0;
  const subtotal = plan ? monthly + Number(plan.setup_fee) : 0;
  const vat = subtotal * VAT;
  const total = subtotal + vat;

  const canNext = [!!type, !!loc, !!planId, !!image, name.trim().length >= 2, true, false][step];
  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  const submit = async () => {
    setSubmitting(true);
    const { error } = await db.rpc("order_cloud_server", {
      p_plan_id: planId, p_location: loc, p_image: image, p_name: name.trim(),
      p_hostname: hostname.trim() || null, p_ssh_key_id: sshKey, p_backups: backups,
      p_idempotency_key: (idemRef.current ||= crypto.randomUUID() + "-" + Date.now()),
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("insufficient")
        ? t("الرصيد غير كافٍ، يرجى شحن المحفظة", "Insufficient balance, please top up your wallet")
        : t("تعذر إتمام الطلب", "Could not complete the order");
      toast.error(msg);
      return;
    }
    toast.success(t("تم استلام طلبك وجاري تجهيز الخادم", "Order received, your server is being provisioned"));
    qc.invalidateQueries({ queryKey: ["cloud-servers"] });
    navigate("/dashboard/cloud/servers");
  };

  const Option = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick}
      className={cn("relative text-start p-4 rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40")}>
      {active && <span className="absolute top-3 end-3 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="w-3 h-3" /></span>}
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={i} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs shrink-0 transition-colors",
            i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            {i < step ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
            <span className="font-medium">{t(s.ar, s.en)}</span>
          </div>
        ))}
      </div>

      <div key={step} className="animate-fade-in">
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Option active={type === "vps"} onClick={() => { setType("vps"); setPlanId(null); }}>
              <Cloud className="w-6 h-6 text-primary mb-2" />
              <p className="font-semibold">Cloud VPS</p>
              <p className="text-xs text-muted-foreground mt-1">{t("خوادم سحابية مرنة بتفعيل سريع", "Flexible cloud servers, fast activation")}</p>
            </Option>
            <Option active={type === "dedicated"} onClick={() => { setType("dedicated"); setPlanId(null); }}>
              <HardDrive className="w-6 h-6 text-primary mb-2" />
              <p className="font-semibold">Dedicated Server</p>
              <p className="text-xs text-muted-foreground mt-1">{t("موارد مخصصة بالكامل لأعلى أداء", "Fully dedicated resources for peak performance")}</p>
            </Option>
          </div>
        )}

        {step === 1 && (locations.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map((l) => (
              <Option key={l.id} active={loc === l.code} onClick={() => { setLoc(l.code); setPlanId(null); }}>
                <MapPin className="w-5 h-5 text-primary mb-2" />
                <p className="font-semibold text-sm">{lang === "ar" ? l.name_ar : l.name_en}</p>
                <p className="text-xs text-muted-foreground">{l.country}</p>
              </Option>
            ))}
          </div>
        ) : <EmptyState icon={MapPin} title={t("لا توجد مواقع متاحة حالياً", "No locations available yet")} />)}

        {step === 2 && (availablePlans.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availablePlans.map((p) => (
              <Option key={p.id} active={planId === p.id} onClick={() => setPlanId(p.id)}>
                <p className="font-semibold">{lang === "ar" ? p.name_ar : p.name_en}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground my-3">
                  {p.server_type === "vps" ? <span>{p.vcpu} vCPU</span> : <span className="col-span-2">{p.cpu_model}</span>}
                  <span>{p.ram_gb} GB RAM</span>
                  <span>{p.storage_gb} GB {p.disk_type}</span>
                  <span>{p.traffic_tb} TB {t("نقل", "traffic")}</span>
                  {p.network && <span>{p.network}</span>}
                </div>
                <p className="text-primary font-bold">{sar(p.monthly_price, lang)} <span className="text-xs font-normal text-muted-foreground">/ {t("شهرياً", "month")}</span></p>
                {Number(p.setup_fee) > 0 && <p className="text-xs text-muted-foreground">{t("رسوم التجهيز", "Setup fee")}: {sar(p.setup_fee, lang)}</p>}
              </Option>
            ))}
          </div>
        ) : <EmptyState icon={Package} title={t("لا توجد باقات متاحة لهذا الموقع حالياً", "No plans available for this location yet")} desc={t("سيتم إضافة الباقات قريباً، يمكنك التواصل مع الدعم.", "Plans will be added soon; contact support for details.")} />)}

        {step === 3 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.map((im) => (
              <Option key={im.id} active={image === im.code} onClick={() => setImage(im.code)}>
                <Disc className="w-5 h-5 text-primary mb-2" />
                <p className="font-semibold text-sm">{im.name}</p>
              </Option>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            <div className="space-y-1.5"><Label>{t("اسم الخادم", "Server name")} *</Label><Input dir="ltr" value={name} maxLength={63} onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))} placeholder="my-server-01" /></div>
            <div className="space-y-1.5"><Label>Hostname</Label><Input dir="ltr" value={hostname} maxLength={253} onChange={(e) => setHostname(e.target.value)} placeholder="server.example.com" /></div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>SSH Key</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={sshKey === null ? "default" : "outline"} onClick={() => setSshKey(null)}>{t("بدون", "None")}</Button>
                {keys.map((k) => <Button key={k.id} type="button" size="sm" variant={sshKey === k.id ? "default" : "outline"} onClick={() => setSshKey(k.id)}>{k.name}</Button>)}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border md:col-span-2">
              <div><p className="font-medium text-sm">{t("النسخ الاحتياطي التلقائي", "Automatic backups")}</p><p className="text-xs text-muted-foreground">{t("+20% من السعر الشهري", "+20% of monthly price")}</p></div>
              <Switch checked={backups} onCheckedChange={setBackups} />
            </div>
          </div>
        )}

        {(step === 5 || step === 6) && plan && (
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card p-5 space-y-2 text-sm">
              {[
                [t("الخدمة", "Service"), type === "vps" ? "Cloud VPS" : "Dedicated Server"],
                [t("الباقة", "Plan"), lang === "ar" ? plan.name_ar : plan.name_en],
                [t("الموقع", "Location"), (() => { const l = locations.find((x) => x.code === loc); return l ? (lang === "ar" ? l.name_ar : l.name_en) : loc; })()],
                [t("النظام", "OS"), images.find((x) => x.code === image)?.name],
                [t("الاسم", "Name"), name],
                [t("النسخ الاحتياطي", "Backups"), backups ? t("مفعّل", "Enabled") : t("غير مفعّل", "Disabled")],
                [t("التجديد", "Renewal"), t("شهري", "Monthly")],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4 py-1.5 border-b last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium" dir="auto">{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-2 text-sm h-fit">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("السعر قبل الضريبة", "Subtotal")}</span><span>{sar(subtotal, lang)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("ضريبة القيمة المضافة 15%", "VAT 15%")}</span><span>{sar(vat, lang)}</span></div>
              <div className="flex justify-between pt-2 border-t font-bold text-primary"><span>{t("الإجمالي", "Total")}</span><span>{sar(total, lang)}</span></div>
              {step === 6 && (
                <Button className="w-full mt-3" disabled={submitting} onClick={submit}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {t("الدفع من رصيد المحفظة", "Pay from wallet balance")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><Prev className="w-4 h-4" />{t("السابق", "Back")}</Button>
        {step < 6 && <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>{t("التالي", "Next")}<Next className="w-4 h-4" /></Button>}
      </div>
    </div>
  );
};

export default CloudOrderWizard;
