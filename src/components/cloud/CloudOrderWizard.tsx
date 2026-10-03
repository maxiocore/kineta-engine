import { useMemo, useRef, useState } from "react";
import { useQuery as useBillingQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

const PUBKEY_RE = /^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com) [A-Za-z0-9+/]+={0,3}( [^\r\n]{0,200})?$/;


const CloudOrderWizard = ({ initialType }: { initialType?: "vps" | "dedicated" }) => {
  const { t, lang, isRtl } = useLanguage();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: plans = [] } = useCatalog("cloud_plans");
  const { data: locations = [] } = useCatalog("cloud_locations");
  const { data: images = [] } = useCatalog("cloud_images");
  const { data: keys = [] } = useCloudTable("cloud_ssh_keys", "keys");

  const idemRef = useRef<string>("");
  // Only the public checkout whitelist (VAT, backup surcharge, currency); internal billing settings are admin-only.
  const { data: billing } = useBillingQuery({ queryKey: ["cloud-checkout-config"], queryFn: async () => ((await db.rpc("cloud_public_checkout_config")).data as any) ?? null });
  const VAT = Number(billing?.vat_rate ?? 0.15);
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [type, setType] = useState<"vps" | "dedicated" | null>(initialType ?? null);
  const [loc, setLoc] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [access, setAccess] = useState<"auto" | "ssh_key">("auto");
  const [advanced, setAdvanced] = useState(false);
  const [sshKey, setSshKey] = useState<string | null>(null);
  const { user } = useAuth();
  const [newKeyOpen, setNewKeyOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyVal, setNewKeyVal] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const saveNewKey = async () => {
    const v = newKeyVal.trim().replace(/\s+/g, " ");
    if (/PRIVATE KEY|-----/i.test(v)) { toast.error(t("لا تشارك مفتاحك الخاص أبداً. الصق المفتاح العام فقط (ملف ‎.pub)", "Never share your private key. Paste the public key only (.pub file)")); return; }
    if (!PUBKEY_RE.test(v) || v.length > 8000) { toast.error(t("صيغة المفتاح العام غير صحيحة", "Invalid public key format")); return; }
    if (newKeyName.trim().length < 1) { toast.error(t("أدخل اسماً للمفتاح", "Enter a key name")); return; }
    setSavingKey(true);
    const { data, error } = await db.from("cloud_ssh_keys").insert({ user_id: user!.id, name: newKeyName.trim().slice(0, 64), public_key: v }).select("id").single();
    setSavingKey(false);
    if (error) { toast.error(error.message.includes("already") ? t("هذا المفتاح مضاف مسبقاً", "This key is already added") : t("تعذر حفظ المفتاح، تحقق من صيغته", "Could not save the key, check its format")); return; }
    setSshKey((data as any).id); setNewKeyOpen(false); setNewKeyName(""); setNewKeyVal("");
    qc.invalidateQueries({ queryKey: ["cloud_ssh_keys"] }); toast.success(t("تمت إضافة المفتاح", "Key added"));
  };
  const [backups, setBackups] = useState(false);
  const [ipv4, setIpv4] = useState(false);
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

  const { data: locPrices = [] } = useBillingQuery({ queryKey: ["cloud-location-prices"], queryFn: async () => (await db.from("cloud_plan_location_prices").select("plan_id, location_code, monthly_price")).data ?? [] });
  const { data: traffic = [] } = useBillingQuery({ queryKey: ["cloud-plan-traffic"], queryFn: async () => ((await db.rpc("get_cloud_plan_traffic")).data as any[]) ?? [] });
  const trafficOf = (planIdArg: string, code: string | null) => traffic.find((x: any) => x.plan_id === planIdArg && x.location_code === code);
  const trafficLabel = (p: any) => {
    const tr = trafficOf(p.id, loc);
    if (tr?.included_traffic_tb != null) return `${Number(tr.included_traffic_tb)} TB / ${t("شهرياً", "month")}`;
    return t("يختلف حسب الموقع", "Varies by location");
  };
  // Display only; the server recalculates the real price at checkout.
  const priceOf = (p: any) => p?.pricing_mode === "location" ? Number(locPrices.find((x: any) => x.plan_id === p.id && x.location_code === loc)?.monthly_price ?? 0) : Number(p?.monthly_price ?? 0);
  const availablePlans = useMemo(
    () => plans.filter((p) => p.server_type === type && (loc && p.location_codes?.includes(loc)) && priceOf(p) > 0),
    [plans, type, loc, locPrices],
  );
  const plan = plans.find((p) => p.id === planId);
  const backupPrice = plan?.retail_backup_price != null ? Number(plan.retail_backup_price) : null;
  const ipv4Price = plan?.ipv4_mode === "optional" && plan?.ipv4_retail_price != null ? Number(plan.ipv4_retail_price) : null;
  const archOk = (im: any) => (im.architecture ?? "x86").toLowerCase() === (plan?.architecture ?? "x86").toLowerCase();
  const monthly = plan ? priceOf(plan) + (backups && backupPrice != null ? backupPrice : 0) + (ipv4 && ipv4Price != null ? ipv4Price : 0) : 0;
  const subtotal = plan ? monthly + Number(plan.setup_fee) : 0;
  const vat = subtotal * VAT;
  const total = subtotal + vat;

  const keyOk = access === "auto" || (!!sshKey && keys.some((k: any) => k.id === sshKey));
  const canNext = [!!type, !!loc, !!planId, !!image, name.trim().length >= 2 && keyOk, true, false][step];
  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  const capacityMsg = t("الخدمة متاحة حالياً بالطلب والمراجعة، التفعيل الفوري غير متاح مؤقتاً", "Temporarily unavailable for instant activation, available on request and review");
  const submit = async () => {
    setSubmitting(true);
    const key = (idemRef.current ||= crypto.randomUUID() + "-" + Date.now());
    // Launch Guard: reserve a launch slot BEFORE any charge.
    const { data: slot } = await db.rpc("cloud_reserve_launch_slot", { p_plan_id: planId, p_idempotency_key: "slot:" + key });
    if (!(slot as any)?.ok) { setSubmitting(false); toast.error((slot as any)?.reason === "capacity_full" ? capacityMsg : t("تعذر إتمام الطلب", "Could not complete the order")); return; }
    const { error } = await db.rpc("order_cloud_server", {
      p_plan_id: planId, p_location: loc, p_image: image, p_name: name.trim(),
      p_hostname: null, p_ssh_key_id: access === "ssh_key" ? sshKey : null, p_backups: backups && backupPrice != null, p_ipv4: ipv4 && ipv4Price != null,
      p_idempotency_key: key, p_reservation_id: (slot as any).reservation_id,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message.includes("insufficient")
        ? t("الرصيد غير كافٍ، يرجى شحن المحفظة", "Insufficient balance, please top up your wallet")
        : error.message.includes("capacity") || error.message.includes("reservation") ? capacityMsg
        : error.message.includes("ssh key") ? t("أضف مفتاح SSH للوصول الآمن إلى خادمك بعد التفعيل.", "Add an SSH key for secure access to your server after activation.")
        : error.message.includes("architecture") ? t("نظام التشغيل غير متوافق مع معالج الباقة", "OS image not compatible with this plan")
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
              <Option key={p.id} active={planId === p.id} onClick={() => { setPlanId(p.id); setImage(null); setIpv4(false); setBackups(false); }}>
                <p className="font-semibold">{lang === "ar" ? p.name_ar : p.name_en}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground my-3">
                  {p.server_type === "vps" ? <span>{p.vcpu} vCPU</span> : <span className="col-span-2">{p.cpu_model}</span>}
                  <span>{p.ram_gb} GB RAM</span>
                  <span>{p.storage_gb} GB {p.disk_type}</span>
                  <span className="col-span-2">{t("النقل المضمّن", "Included traffic")}: <span dir="ltr">{trafficLabel(p)}</span></span>
                  {trafficOf(p.id, loc)?.extra_traffic_sar_per_tb != null && <span className="col-span-2">{t("نقل إضافي", "Additional traffic")}: {sar(trafficOf(p.id, loc).extra_traffic_sar_per_tb, lang)} / TB</span>}
                  {p.network && <span>{p.network}</span>}
                </div>
                <p className="text-primary font-bold">{sar(priceOf(p), lang)} <span className="text-xs font-normal text-muted-foreground">/ {t("شهرياً", "month")}</span></p>
                {Number(p.setup_fee) > 0 && <p className="text-xs text-muted-foreground">{t("رسوم التجهيز", "Setup fee")}: {sar(p.setup_fee, lang)}</p>}
              </Option>
            ))}
          </div>
        ) : <EmptyState icon={Package} title={t("لا توجد باقات متاحة لهذا الموقع حالياً", "No plans available for this location yet")} desc={t("سيتم إضافة الباقات قريباً، يمكنك التواصل مع الدعم.", "Plans will be added soon; contact support for details.")} />)}

        {step === 3 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {images.filter(archOk).map((im) => (
              <Option key={im.id} active={image === im.code} onClick={() => setImage(im.code)}>
                <Disc className="w-5 h-5 text-primary mb-2" />
                <p className="font-semibold text-sm">{im.name}</p>
              </Option>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            <div className="space-y-1.5 md:col-span-2"><Label htmlFor="srv-name">{t("اسم الخادم", "Server name")} *</Label><Input id="srv-name" dir="auto" value={name} maxLength={63} onChange={(e) => setName(e.target.value.replace(/[<>\r\n\t]/g, ""))} placeholder={t("مثال: خادم المتجر", "e.g. Store server")} /><p className="text-xs text-muted-foreground">{t("اسم يساعدك على تمييز خادمك.", "A name to help you recognise your server.")}</p></div>
            <div className="space-y-2 md:col-span-2" role="radiogroup" aria-label={t("طريقة الوصول إلى الخادم", "Server access method")}>
              <Label>{t("طريقة الوصول إلى الخادم", "Server access method")}</Label>
              <button type="button" role="radio" aria-checked={access === "auto"} onClick={() => setAccess("auto")}
                className={cn("w-full text-start p-4 rounded-xl border transition-colors", access === "auto" ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40")}>
                <div className="flex items-center gap-2"><span className={cn("w-4 h-4 rounded-full border-2", access === "auto" ? "border-primary bg-primary" : "border-muted-foreground")} /><span className="font-medium text-sm">{t("إعداد الوصول تلقائياً", "Set up access automatically")}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t("موصى به", "Recommended")}</span></div>
                <p className="text-xs text-muted-foreground mt-1 ps-6">{t("سنجهز بيانات الوصول إلى خادمك تلقائياً بعد التفعيل.", "We'll prepare your server access details automatically after activation.")}</p>
              </button>
              <button type="button" onClick={() => setAdvanced(!advanced)} className="text-xs text-primary underline-offset-2 hover:underline">{advanced ? t("إخفاء الخيارات المتقدمة", "Hide advanced options") : t("خيارات متقدمة", "Advanced options")}</button>
              {advanced && <button type="button" role="radio" aria-checked={access === "ssh_key"} onClick={() => setAccess("ssh_key")}
                className={cn("w-full text-start p-4 rounded-xl border transition-colors", access === "ssh_key" ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40")}>
                <div className="flex items-center gap-2"><span className={cn("w-4 h-4 rounded-full border-2", access === "ssh_key" ? "border-primary bg-primary" : "border-muted-foreground")} /><span className="font-medium text-sm">{t("استخدام مفتاح SSH الخاص بي", "Use my own SSH key")}</span></div>
                <p className="text-xs text-muted-foreground mt-1 ps-6">{t("للمستخدمين المتقدمين.", "For advanced users.")}</p>
              </button>}
            </div>
            {access === "ssh_key" && <div className="space-y-1.5 md:col-span-2">
              <Label>{t("مفتاح SSH العام", "SSH public key")} *</Label>
              <div className="flex flex-wrap gap-2">
                {keys.map((k: any) => <Button key={k.id} type="button" size="sm" variant={sshKey === k.id ? "default" : "outline"} onClick={() => setSshKey(k.id)}>{k.name}</Button>)}
                <Button type="button" size="sm" variant={newKeyOpen ? "secondary" : "outline"} onClick={() => setNewKeyOpen(!newKeyOpen)}>+ {t("إضافة مفتاح جديد", "Add new key")}</Button>
              </div>
              {newKeyOpen && <div className="rounded-xl border p-3 space-y-2">
                <Input value={newKeyName} maxLength={64} onChange={(e) => setNewKeyName(e.target.value)} placeholder={t("اسم المفتاح، مثل: جهازي", "Key name, e.g. my-laptop")} />
                <Textarea dir="ltr" rows={3} className="font-mono text-xs" value={newKeyVal} onChange={(e) => setNewKeyVal(e.target.value)} placeholder="ssh-ed25519 AAAA... user@host" />
                <p className="text-xs text-muted-foreground">{t("الصق المفتاح العام فقط (محتوى ملف ‎.pub). لا تشارك المفتاح الخاص أبداً.", "Paste the public key only (contents of the .pub file). Never share your private key.")}</p>
                <Button type="button" size="sm" onClick={saveNewKey} disabled={savingKey}>{savingKey && <Loader2 className="w-4 h-4 animate-spin" />}{t("حفظ واستخدام المفتاح", "Save and use key")}</Button>
              </div>}
            </div>}
            {backupPrice != null && <div className="flex items-center justify-between p-4 rounded-xl border md:col-span-2">
              <div><p className="font-medium text-sm">{t("النسخ الاحتياطي التلقائي", "Automatic backups")}</p><p className="text-xs text-muted-foreground">+{sar(backupPrice, lang)} / {t("شهرياً", "month")}</p></div>
              <Switch checked={backups} onCheckedChange={setBackups} />
            </div>}
            {plan?.ipv4_mode === "included" && <p className="text-xs text-muted-foreground md:col-span-2">{t("يشمل عنوان IPv4 و IPv6", "Includes IPv4 and IPv6 address")}</p>}
            {ipv4Price != null && <div className="flex items-center justify-between p-4 rounded-xl border md:col-span-2">
              <div><p className="font-medium text-sm">{t("عنوان IPv4 عام", "Public IPv4 address")}</p><p className="text-xs text-muted-foreground">+{sar(ipv4Price, lang)} / {t("شهرياً", "month")} · {t("IPv6 مشمول", "IPv6 included")}</p></div>
              <Switch checked={ipv4} onCheckedChange={setIpv4} />
            </div>}
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
                [t("اسم الخادم", "Server name"), name],
                [t("طريقة الوصول", "Access method"), access === "auto" ? t("إعداد تلقائي", "Automatic setup") : t("مفتاح SSH الخاص بي", "My own SSH key")],
                [t("النسخ الاحتياطي", "Backups"), backups && backupPrice != null ? t("مفعّل", "Enabled") : t("غير مفعّل", "Disabled")],
                ["IPv4", plan.ipv4_mode === "included" ? t("مشمول", "Included") : ipv4 && ipv4Price != null ? `${t("مضاف", "Added")} (+${sar(ipv4Price, lang)})` : plan.ipv4_mode === "optional" ? t("غير مختار", "Not selected") : t("غير متاح (IPv6 فقط)", "Not available (IPv6 only)")],
                [t("النقل المضمّن", "Included traffic"), trafficLabel(plan)],
                [t("نقل إضافي", "Additional traffic"), trafficOf(plan.id, loc)?.extra_traffic_sar_per_tb != null ? `${sar(trafficOf(plan.id, loc).extra_traffic_sar_per_tb, lang)} / TB` : "—"],
                [t("التجديد", "Renewal"), t("شهري", "Monthly")],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4 py-1.5 border-b last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium" dir="auto">{v}</span></div>
              ))}
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-2 text-sm h-fit">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("السعر قبل الضريبة", "Subtotal")}</span><span>{sar(subtotal, lang)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t(`ضريبة القيمة المضافة ${Math.round(VAT*100)}%`, `VAT ${Math.round(VAT*100)}%`)}</span><span>{sar(vat, lang)}</span></div>
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
