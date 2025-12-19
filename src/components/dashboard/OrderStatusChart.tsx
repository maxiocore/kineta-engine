import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";

interface OrderStatusChartProps {
  statusData: {
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    refunded: number;
    partial: number;
  };
}

const statusConfig = [
  { key: "completed", label: "مكتمل", color: "hsl(var(--success))" },
  { key: "inProgress", label: "قيد التنفيذ", color: "hsl(var(--accent))" },
  { key: "pending", label: "قيد الانتظار", color: "hsl(var(--warning))" },
  { key: "confirmed", label: "مؤكد", color: "hsl(var(--primary))" },
  { key: "cancelled", label: "ملغي", color: "hsl(var(--destructive))" },
  { key: "refunded", label: "مسترد", color: "hsl(280, 60%, 50%)" },
  { key: "partial", label: "جزئي", color: "hsl(30, 80%, 55%)" },
];

const OrderStatusChart = ({ statusData }: OrderStatusChartProps) => {
  const chartData = statusConfig
    .map(({ key, label, color }) => ({
      name: label,
      value: statusData[key as keyof typeof statusData] || 0,
      color,
    }))
    .filter((item) => item.value > 0);

  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalOrders) * 100).toFixed(1);
      return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-muted-foreground text-xs">
            {data.value} طلب ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {payload?.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted/50"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (totalOrders === 0) {
    return (
      <Card className="card-elevated border-border/30">
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            توزيع الطلبات حسب الحالة
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PieChartIcon className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">لا توجد بيانات لعرضها</p>
            <p className="text-xs text-muted-foreground mt-1">
              ابدأ بطلب خدماتنا لرؤية الإحصائيات
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="card-elevated border-border/30">
        <CardHeader className="py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            توزيع الطلبات حسب الحالة
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[250px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center Stats */}
          <div className="text-center -mt-4">
            <p className="text-2xl sm:text-3xl font-bold">{totalOrders}</p>
            <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderStatusChart;
