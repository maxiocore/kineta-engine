import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface KYCBlockedFeatureProps {
  featureName: string;
  description: string;
  onStartKYC?: () => void;
}

export function KYCBlockedFeature({
  featureName,
  description,
  onStartKYC,
}: KYCBlockedFeatureProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-dashed border-muted bg-muted/30" dir="rtl">
        <CardContent className="flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-4">
          <div className="p-3 bg-background rounded-full">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">{featureName}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            {onStartKYC && (
              <Button
                onClick={onStartKYC}
                size="sm"
                className="w-full sm:w-auto"
              >
                ابدأ التحقق الآن
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
