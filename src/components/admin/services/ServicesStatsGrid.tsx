import { Package, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ServicesStatsGridProps {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalRevenue: number;
  totalOrders: number;
  avgPrice: number;
}

const ServicesStatsGrid = ({ 
  totalServices, 
  activeServices, 
  totalRevenue, 
  totalOrders,
}: ServicesStatsGridProps) => {
  const stats = [
    {
      label: "الخدمات",
      value: totalServices,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "النشطة",
      value: activeServices,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "الطلبات",
      value: totalOrders,
      icon: ShoppingCart,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "الإيرادات",
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <ScrollArea className="w-full -mx-1 px-1">
      <div className="flex items-center gap-2 pb-1">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50 shrink-0"
          >
            <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
              <p className="text-sm font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="h-0" />
    </ScrollArea>
  );
};

export default ServicesStatsGrid;
