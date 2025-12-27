import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  ChevronDown,
  Package,
  Loader2,
  Check,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ServiceCardModern from "./ServiceCardModern";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  category_id: string | null;
  price: number;
  status: string;
  features: any;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  refill_days: number | null;
}

interface ServicesCategorySectionProps {
  categoryName: string;
  categoryNameAr: string;
  categoryColor?: string;
  services: Service[];
  isExpanded: boolean;
  onToggle: () => void;
  onOrder: (service: Service) => void;
  onViewDetails: (service: Service) => void;
  favorites: string[];
  onToggleFavorite: (serviceId: string) => void;
  itemsPerPage?: number;
}

const ServicesCategorySection = ({
  categoryName,
  categoryNameAr,
  categoryColor = "from-primary to-primary/70",
  services,
  isExpanded,
  onToggle,
  onOrder,
  onViewDetails,
  favorites,
  onToggleFavorite,
  itemsPerPage = 20
}: ServicesCategorySectionProps) => {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const visibleServices = services.slice(0, visibleCount);
  const hasMore = visibleCount < services.length;

  // Infinite scroll observer
  useEffect(() => {
    if (!isExpanded || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(prev => prev + itemsPerPage);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const element = loadMoreRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) observer.unobserve(element);
      observer.disconnect();
    };
  }, [isExpanded, hasMore, isLoadingMore, itemsPerPage]);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [categoryName, itemsPerPage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm"
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors duration-300 group">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                categoryColor
              )}>
                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow" />
              </div>
              
              {/* Info */}
              <div className="text-right">
                <h3 className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors">
                  {categoryNameAr}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{services.length} خدمة</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-500 font-medium">متاحة</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className="h-8 px-4 text-sm font-bold bg-muted/70"
              >
                {services.length}
              </Badge>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-t border-border/40"
              >
                <div className="p-4 sm:p-6">
                  {/* Services Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleServices.map((service, index) => (
                      <ServiceCardModern
                        key={service.id}
                        service={service}
                        index={index}
                        onOrder={() => onOrder(service)}
                        onViewDetails={() => onViewDetails(service)}
                        isFavorite={favorites.includes(service.id)}
                        onToggleFavorite={() => onToggleFavorite(service.id)}
                      />
                    ))}
                  </div>
                  
                  {/* Loading More Indicator */}
                  {hasMore && (
                    <div 
                      ref={loadMoreRef}
                      className="flex items-center justify-center py-8"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
                        >
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </motion.div>
                        <span className="text-sm text-muted-foreground">
                          جاري تحميل المزيد... ({visibleCount} / {services.length})
                        </span>
                      </motion.div>
                    </div>
                  )}
                  
                  {/* All Loaded */}
                  {!hasMore && visibleServices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center py-6 mt-4 border-t border-border/30"
                    >
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium">
                          تم عرض جميع الخدمات ({services.length})
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default ServicesCategorySection;
