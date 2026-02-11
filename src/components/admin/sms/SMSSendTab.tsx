import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, Users, User, FileText } from "lucide-react";

const SMSSendTab = () => {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sending, setSending] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["sms-templates-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .eq("is_active", true)
        .order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const handleTemplateSelect = (key: string) => {
    setSelectedTemplate(key);
    const tpl = templates?.find((t) => t.template_key === key);
    if (tpl) {
      setMessage(tpl.message_template);
    }
  };

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }
    if (!message.trim()) {
      toast.error("يرجى كتابة الرسالة");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("sms-notify", {
        body: {
          phone: phone.trim(),
          message: message.trim(),
          type: "manual",
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("تم إرسال الرسالة بنجاح!");
        setPhone("");
        setMessage("");
        setSelectedTemplate("");
      } else {
        toast.error(data?.error || "فشل إرسال الرسالة");
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Send Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-5 h-5" />
            إرسال رسالة يدوية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode */}
          <div className="flex gap-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => setMode("single")}
            >
              <User className="w-4 h-4" />
              فردي
            </Button>
            <Button
              variant={mode === "bulk" ? "default" : "outline"}
              size="sm"
              className="gap-1"
              onClick={() => setMode("bulk")}
              disabled
            >
              <Users className="w-4 h-4" />
              جماعي (قريباً)
            </Button>
          </div>

          {/* Template Selector */}
          <div>
            <Label>اختر قالب (اختياري)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="اختر قالب رسالة..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.template_key} value={t.template_key}>
                    {t.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <Label>رقم الهاتف</Label>
            <Input
              placeholder="05XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
          </div>

          {/* Message */}
          <div>
            <Label>نص الرسالة</Label>
            <Textarea
              placeholder="اكتب الرسالة هنا..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} حرف
            </p>
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            إرسال الرسالة
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5" />
            معاينة الرسالة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-2xl p-6 min-h-[300px]">
            <div className="max-w-[280px] mx-auto">
              {/* Phone mockup */}
              <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
                <div className="bg-primary/10 px-4 py-2 text-center">
                  <p className="text-xs font-bold">ASHHOLDING</p>
                </div>
                <div className="p-4 min-h-[200px]">
                  {message ? (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" dir="rtl">
                        {message}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center mt-16">
                      الرسالة ستظهر هنا...
                    </p>
                  )}
                </div>
                {phone && (
                  <div className="border-t px-4 py-2">
                    <p className="text-xs text-muted-foreground text-center" dir="ltr">
                      إلى: {phone}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSSendTab;
