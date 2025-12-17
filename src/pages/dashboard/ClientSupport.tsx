import { motion } from "framer-motion";
import { HeadphonesIcon, Plus, MessageCircle, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ClientDashboardLayout from "@/components/dashboard/ClientDashboardLayout";
import { useState } from "react";

const tickets = [
  { id: "#T-001", subject: "استفسار عن خدمة التسويق", status: "مفتوح", date: "اليوم", messages: 3 },
  { id: "#T-002", subject: "مشكلة في الفاتورة", status: "قيد المعالجة", date: "أمس", messages: 5 },
  { id: "#T-003", subject: "طلب تعديل على التصميم", status: "مغلق", date: "منذ 3 أيام", messages: 8 },
];

const getStatusStyles = (status: string) => {
  switch (status) {
    case "مفتوح": return "bg-success/10 text-success";
    case "قيد المعالجة": return "bg-warning/10 text-warning";
    case "مغلق": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const ClientSupport = () => {
  const [showNewTicket, setShowNewTicket] = useState(false);

  return (
    <ClientDashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl font-bold mb-2"
            >
              الدعم الفني
            </motion.h1>
            <p className="text-muted-foreground">تواصل معنا وسنكون سعداء بمساعدتك</p>
          </div>
          <Button 
            className="bg-gradient-primary hover:opacity-90"
            onClick={() => setShowNewTicket(!showNewTicket)}
          >
            <Plus className="w-4 h-4 ms-2" />
            تذكرة جديدة
          </Button>
        </div>

        {/* New Ticket Form */}
        {showNewTicket && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <Card className="glass border-border/50 border-primary/30">
              <CardHeader>
                <CardTitle className="font-display">إنشاء تذكرة جديدة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">الموضوع</label>
                  <Input placeholder="أدخل موضوع التذكرة" className="bg-secondary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">الرسالة</label>
                  <Textarea placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..." className="bg-secondary/50 min-h-32" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewTicket(false)}>إلغاء</Button>
                  <Button className="bg-gradient-primary">إرسال التذكرة</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "التذاكر المفتوحة", value: "2", icon: MessageCircle, color: "from-primary to-cyan-400" },
            { label: "قيد المعالجة", value: "1", icon: Clock, color: "from-warning to-orange-400" },
            { label: "تم الحل", value: "15", icon: CheckCircle, color: "from-success to-emerald-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} p-3`}>
                    <stat.icon className="w-full h-full text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tickets List */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="font-display">التذاكر السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <HeadphonesIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground">{ticket.id} • {ticket.messages} رسائل</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <span className="text-sm text-muted-foreground hidden sm:block">{ticket.date}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
};

export default ClientSupport;