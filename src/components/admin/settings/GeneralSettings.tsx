import { useState, useEffect } from "react";
import { Globe, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SettingsCard from "./SettingsCard";
import { motion, AnimatePresence } from "framer-motion";

interface GeneralSettingsProps {
  settings: Record<string, any>;
  saving: string | null;
  onSave: (updates: { key: string; value: any }[]) => Promise<void>;
}

const GeneralSettings = ({ settings, saving, onSave }: GeneralSettingsProps) => {
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSiteName(settings.site_name || "");
    setSiteDescription(settings.site_description || "");
    setContactEmail(settings.contact_email || "");
    setContactPhone(settings.contact_phone || "");
  }, [settings]);

  useEffect(() => {
    const changed = 
      siteName !== settings.site_name ||
      siteDescription !== settings.site_description ||
      contactEmail !== settings.contact_email ||
      contactPhone !== settings.contact_phone;
    setHasChanges(changed);
  }, [siteName, siteDescription, contactEmail, contactPhone, settings]);

  const handleSave = async () => {
    await onSave([
      { key: 'site_name', value: siteName },
      { key: 'site_description', value: siteDescription },
      { key: 'contact_email', value: contactEmail },
      { key: 'contact_phone', value: contactPhone },
    ]);
  };

  return (
    <SettingsCard
      icon={Globe}
      title="الإعدادات العامة"
      description="إعدادات الموقع الأساسية"
      delay={0}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteName">اسم الموقع</Label>
          <Input
            id="siteName"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary transition-colors"
            placeholder="أدخل اسم الموقع"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="siteDescription">وصف الموقع</Label>
          <Textarea
            id="siteDescription"
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary transition-colors min-h-[80px]"
            placeholder="أدخل وصف الموقع"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactEmail">البريد الإلكتروني للتواصل</Label>
          <Input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary transition-colors"
            dir="ltr"
            placeholder="example@domain.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactPhone">رقم الهاتف</Label>
          <Input
            id="contactPhone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="bg-secondary/50 border-border/50 focus:border-primary transition-colors"
            dir="ltr"
            placeholder="+966500000000"
          />
        </div>

        <AnimatePresence>
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Button 
                onClick={handleSave}
                disabled={saving === 'multiple'}
                className="w-full bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                {saving === 'multiple' ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SettingsCard>
  );
};

export default GeneralSettings;
