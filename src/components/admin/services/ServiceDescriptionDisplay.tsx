import { motion } from "framer-motion";
import { 
  Info, 
  Hash, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  RefreshCw,
  Zap,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Package,
  Gauge
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ParsedDescription {
  type?: string;
  minQuantity?: string;
  maxQuantity?: string;
  refill?: string;
  speed?: string;
  start?: string;
  quality?: string;
  cancel?: string;
  drops?: string;
  raw?: string;
}

const parseDescription = (description: string): ParsedDescription => {
  if (!description) return { raw: "غير متوفر" };
  
  const result: ParsedDescription = { raw: description };
  
  // Parse common patterns from provider descriptions
  const patterns = [
    { key: 'type', patterns: [/(?:Type|النوع)[:\s]*([^\n|]+)/i] },
    { key: 'minQuantity', patterns: [/(?:Min|الحد الأدنى)[:\s]*(\d+)/i, /minimum[:\s]*(\d+)/i] },
    { key: 'maxQuantity', patterns: [/(?:Max|الحد الأقصى)[:\s]*(\d+)/i, /maximum[:\s]*(\d+)/i] },
    { key: 'refill', patterns: [/(?:Refill|إعادة التعبئة)[:\s]*([^\n|]+)/i, /(?:ضمان)[:\s]*([^\n|]+)/i] },
    { key: 'speed', patterns: [/(?:Speed|السرعة)[:\s]*([^\n|]+)/i, /(?:start)[:\s]*([^\n|]+)/i] },
    { key: 'start', patterns: [/(?:Start Time|وقت البدء)[:\s]*([^\n|]+)/i] },
    { key: 'quality', patterns: [/(?:Quality|الجودة)[:\s]*([^\n|]+)/i] },
    { key: 'cancel', patterns: [/(?:Cancel|الإلغاء)[:\s]*([^\n|]+)/i] },
    { key: 'drops', patterns: [/(?:Drops?|الانخفاض)[:\s]*([^\n|]+)/i] },
  ];

  for (const { key, patterns: patternList } of patterns) {
    for (const pattern of patternList) {
      const match = description.match(pattern);
      if (match && match[1]) {
        (result as any)[key] = match[1].trim();
        break;
      }
    }
  }

  return result;
};

interface ServiceDescriptionDisplayProps {
  description: string;
  className?: string;
}

const DetailItem = ({ 
  icon: Icon, 
  label, 
  value, 
  colorClass = "text-muted-foreground",
  valueColorClass = "text-foreground"
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  colorClass?: string;
  valueColorClass?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30 hover:border-primary/20 transition-all duration-300"
    dir="rtl"
  >
    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10", colorClass)}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 text-right">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm font-medium", valueColorClass)}>{value}</p>
    </div>
  </motion.div>
);

export const ServiceDescriptionDisplay = ({ description, className }: ServiceDescriptionDisplayProps) => {
  const parsed = parseDescription(description);
  
  const hasStructuredData = parsed.type || parsed.minQuantity || parsed.maxQuantity || 
                            parsed.refill || parsed.speed || parsed.quality;

  if (!hasStructuredData) {
    // Show raw description in a styled container
    return (
      <div className={cn("space-y-3", className)} dir="rtl">
        <div className="p-4 rounded-xl bg-gradient-to-r from-secondary/60 to-muted/40 border border-border/50">
          <div className="flex items-start gap-3">
            <div className="flex-1 text-right">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {description || "غير متوفر"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} dir="rtl">
      {/* Structured Data Grid */}
      <div className="grid grid-cols-2 gap-3">
        {parsed.type && (
          <DetailItem 
            icon={Package} 
            label="النوع" 
            value={parsed.type}
            colorClass="text-primary"
          />
        )}
        
        {parsed.minQuantity && (
          <DetailItem 
            icon={ArrowDown} 
            label="الحد الأدنى" 
            value={`${parseInt(parsed.minQuantity).toLocaleString()} وحدة`}
            colorClass="text-amber-500"
          />
        )}
        
        {parsed.maxQuantity && (
          <DetailItem 
            icon={ArrowUp} 
            label="الحد الأقصى" 
            value={`${parseInt(parsed.maxQuantity).toLocaleString()} وحدة`}
            colorClass="text-success"
          />
        )}
        
        {parsed.speed && (
          <DetailItem 
            icon={Zap} 
            label="السرعة" 
            value={parsed.speed}
            colorClass="text-yellow-500"
          />
        )}
        
        {parsed.quality && (
          <DetailItem 
            icon={Gauge} 
            label="الجودة" 
            value={parsed.quality}
            colorClass="text-blue-500"
          />
        )}
        
        {parsed.start && (
          <DetailItem 
            icon={Clock} 
            label="وقت البدء" 
            value={parsed.start}
            colorClass="text-cyan-500"
          />
        )}
      </div>

      {/* Additional Info Badges */}
      <div className="flex flex-wrap gap-2 justify-end">
        {parsed.refill && (
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 px-3 py-1.5",
              parsed.refill.toLowerCase().includes('no') || parsed.refill.includes('لا')
                ? "bg-destructive/10 text-destructive border-destructive/30"
                : "bg-success/10 text-success border-success/30"
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ضمان: {parsed.refill}
          </Badge>
        )}
        
        {parsed.cancel && (
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1.5 px-3 py-1.5",
              parsed.cancel.toLowerCase().includes('yes') || parsed.cancel.includes('نعم')
                ? "bg-success/10 text-success border-success/30"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            <XCircle className="w-3.5 h-3.5" />
            الإلغاء: {parsed.cancel}
          </Badge>
        )}
        
        {parsed.drops && (
          <Badge 
            variant="outline" 
            className="gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-600 border-amber-500/30"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            الانخفاض: {parsed.drops}
          </Badge>
        )}
      </div>

      {/* Raw Description if exists and different from structured */}
      {parsed.raw && parsed.raw !== "غير متوفر" && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-muted/30 border border-border/30"
        >
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {parsed.raw}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ServiceDescriptionDisplay;
