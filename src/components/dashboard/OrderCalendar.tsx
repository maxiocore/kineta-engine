import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";

interface OrderDate {
  date: Date;
  count: number;
}

interface OrderCalendarProps {
  orderDates: OrderDate[];
}

const OrderCalendar = ({ orderDates }: OrderCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekDays = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  const getOrderCount = (date: Date) => {
    const orderDate = orderDates.find(o => isSameDay(o.date, date));
    return orderDate?.count || 0;
  };

  const prevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  // Get the day of week for the first day (0-6, where 0 is Sunday)
  const firstDayOfWeek = monthStart.getDay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card className="card-elevated border-border/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              تقويم الطلبات
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: ar })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] sm:text-xs text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {/* Days of the month */}
            {days.map((day, index) => {
              const orderCount = getOrderCount(day);
              const hasOrders = orderCount > 0;
              
              return (
                <motion.div
                  key={day.toISOString()}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-xs sm:text-sm
                    transition-all cursor-default relative
                    ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""}
                    ${hasOrders && !isToday(day) ? "bg-success/10 text-success font-medium" : ""}
                    ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/30" : ""}
                    hover:bg-secondary/50
                  `}
                >
                  <span>{format(day, "d")}</span>
                  {hasOrders && (
                    <span className="absolute bottom-0.5 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-success" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              اليوم
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success" />
              يوم فيه طلبات
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderCalendar;
