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
      dir="rtl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card className="card-elevated border-border/30 h-full">
        <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex flex-row-reverse items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base md:text-lg">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              تقويم الطلبات
            </CardTitle>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" onClick={prevMonth}>
                <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </Button>
              <span className="text-[10px] sm:text-xs md:text-sm font-medium min-w-[70px] sm:min-w-[90px] md:min-w-[100px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: ar })}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" onClick={nextMonth}>
                <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3 md:px-6 pb-3 sm:pb-4">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[8px] sm:text-[10px] md:text-xs text-muted-foreground py-0.5 sm:py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
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
                    aspect-square flex flex-col items-center justify-center rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm
                    transition-all cursor-default relative
                    ${isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""}
                    ${hasOrders && !isToday(day) ? "bg-success/10 text-success font-medium" : ""}
                    ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/30" : ""}
                    hover:bg-secondary/50
                  `}
                >
                  <span>{format(day, "d")}</span>
                  {hasOrders && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-success" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 border-t border-border/30">
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
              اليوم
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success" />
              يوم فيه طلبات
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderCalendar;
