import { motion } from "framer-motion";
import { Package, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyServicesStateProps {
  hasFilters: boolean;
  onAddNew: () => void;
  onClearFilters: () => void;
}

const EmptyServicesState = ({ hasFilters, onAddNew, onClearFilters }: EmptyServicesStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 border-dashed bg-card/50">
        <CardContent className="py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
          >
            {hasFilters ? (
              <Search className="w-10 h-10 text-muted-foreground" />
            ) : (
              <Package className="w-10 h-10 text-muted-foreground" />
            )}
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold mb-2"
          >
            {hasFilters ? "لا توجد نتائج" : "لا توجد خدمات"}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-6 max-w-sm mx-auto"
          >
            {hasFilters
              ? "لم يتم العثور على خدمات تطابق معايير البحث. جرب تعديل الفلاتر."
              : "ابدأ بإضافة خدماتك الأولى لعرضها للعملاء."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3"
          >
            {hasFilters ? (
              <Button onClick={onClearFilters} variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                مسح الفلاتر
              </Button>
            ) : (
              <Button onClick={onAddNew} className="gap-2 bg-gradient-to-l from-primary to-accent">
                <Plus className="w-4 h-4" />
                إضافة خدمة جديدة
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmptyServicesState;
