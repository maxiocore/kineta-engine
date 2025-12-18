import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Loader2,
  TrendingUp,
  Star,
  Shield,
  ArrowLeft,
  Sparkles,
  Package
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  external_service_id: string | null;
  refill_enabled: boolean | null;
  features: any;
}

interface GlobalServiceSearchProps {
  trigger?: React.ReactNode;
  className?: string;
}

export default function GlobalServiceSearch({ trigger, className }: GlobalServiceSearchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all services
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services-global-search"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, category, price, external_service_id, refill_enabled, features")
        .eq("status", "active")
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data as Service[];
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Filter services based on query
  const filteredServices = query.trim()
    ? services.filter(service => 
        service.name.toLowerCase().includes(query.toLowerCase()) ||
        service.category.toLowerCase().includes(query.toLowerCase()) ||
        (service.description?.toLowerCase().includes(query.toLowerCase())) ||
        (service.external_service_id?.includes(query))
      ).slice(0, 20)
    : [];

  // Group by category
  const groupedResults = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Popular categories for quick access
  const popularCategories = [...new Set(services.map(s => s.category))].slice(0, 6);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [open]);

  // Keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectService = (service: Service) => {
    setOpen(false);
    navigate(`/dashboard/services?service=${service.id}&category=${encodeURIComponent(service.category)}`);
  };

  const handleCategoryClick = (category: string) => {
    setOpen(false);
    navigate(`/dashboard/services?category=${encodeURIComponent(category)}`);
  };

  return (
    <>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setOpen(true)} className={className}>
          {trigger}
        </div>
      ) : (
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-3 w-full max-w-xl mx-auto px-5 py-4 rounded-2xl",
            "bg-secondary/50 hover:bg-secondary/70 border border-border/50 hover:border-primary/30",
            "backdrop-blur-sm transition-all duration-300 group",
            className
          )}
        >
          <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="flex-1 text-right text-muted-foreground text-sm">
            ابحث عن خدمة...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-[10px] text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </motion.button>
      )}

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">بحث في الخدمات</DialogTitle>
          
          {/* Search Input */}
          <div className="relative border-b border-border/50">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن خدمة بالاسم أو الرقم أو الفئة..."
              className="pr-12 pl-12 h-14 text-base border-0 focus-visible:ring-0 rounded-none bg-transparent"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Results */}
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : query.trim() ? (
                filteredServices.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedResults).map(([category, categoryServices]) => (
                      <div key={category}>
                        <button
                          onClick={() => handleCategoryClick(category)}
                          className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          {category}
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {categoryServices.length}
                          </Badge>
                          <ArrowLeft className="w-3 h-3 mr-auto" />
                        </button>
                        <div className="space-y-1">
                          {categoryServices.map((service) => (
                            <motion.button
                              key={service.id}
                              onClick={() => handleSelectService(service)}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full text-right p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  {service.external_service_id || "#"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                    {service.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {service.refill_enabled && (
                                      <Badge className="text-[10px] h-4 px-1.5 bg-success/10 text-success border-success/20">
                                        <Shield className="w-2.5 h-2.5 ml-0.5" />
                                        ضمان
                                      </Badge>
                                    )}
                                    {service.features?.min && (
                                      <span className="text-[10px] text-muted-foreground">
                                        أدنى: {service.features.min.toLocaleString('ar-SA')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-left shrink-0">
                                  <p className="font-bold text-primary">{service.price.toFixed(2)}</p>
                                  <p className="text-[10px] text-muted-foreground">ر.س/1000</p>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">لا توجد نتائج لـ "{query}"</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">جرب كلمات مختلفة</p>
                  </div>
                )
              ) : (
                /* Quick Access - Popular Categories */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5" />
                    الأقسام الشائعة
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {popularCategories.map((category) => (
                      <motion.button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 transition-all text-right"
                      >
                        <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate">{category}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Search Tips */}
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      💡 ابحث برقم الخدمة أو اسمها أو اسم الفئة
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
