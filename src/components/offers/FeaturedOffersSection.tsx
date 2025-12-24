import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Sparkles, Clock, Percent, ArrowLeft, Star, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedOffer {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  discount_percentage: number | null;
  original_price: number | null;
  offer_price: number | null;
  image_url: string | null;
  badge_text: string | null;
  badge_text_ar: string | null;
  badge_color: string | null;
  category: string;
  is_featured: boolean;
  end_date: string | null;
}

interface FeaturedOffersSectionProps {
  category: 'design' | 'dev' | 'smm';
}

const FeaturedOffersSection = ({ category }: FeaturedOffersSectionProps) => {
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: string }>({});

  const { data: offers, isLoading } = useQuery({
    queryKey: ['featured-offers', category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('featured_offers')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as FeaturedOffer[];
    }
  });

  // Countdown timer for offers with end_date
  useEffect(() => {
    const interval = setInterval(() => {
      if (!offers) return;
      
      const newTimeLeft: { [key: string]: string } = {};
      offers.forEach((offer) => {
        if (offer.end_date) {
          const end = new Date(offer.end_date).getTime();
          const now = new Date().getTime();
          const diff = end - now;
          
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            if (days > 0) {
              newTimeLeft[offer.id] = `${days} يوم ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
              newTimeLeft[offer.id] = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
          } else {
            newTimeLeft[offer.id] = 'انتهى العرض';
          }
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [offers]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) return null;

  const featuredOffers = offers.filter(o => o.is_featured);
  const regularOffers = offers.filter(o => !o.is_featured);

  return (
    <div className="mb-8 space-y-6">
      {/* Featured Offers - Hero Style */}
      {featuredOffers.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 p-6 md:p-8 border border-primary/20">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  العروض المميزة
                </h2>
                <p className="text-sm text-muted-foreground">عروض حصرية لفترة محدودة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {featuredOffers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-5 border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
                >
                  {/* Badge */}
                  {offer.badge_text_ar && (
                    <Badge 
                      className={`absolute -top-2 -right-2 bg-gradient-to-r ${offer.badge_color || 'from-primary to-accent'} text-white border-0 shadow-lg`}
                    >
                      {offer.badge_text_ar}
                    </Badge>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon/Image */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      {offer.discount_percentage && offer.discount_percentage > 0 ? (
                        <div className="text-center">
                          <span className="text-2xl font-bold text-primary">{offer.discount_percentage}%</span>
                        </div>
                      ) : (
                        <Gift className="h-8 w-8 text-primary" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {offer.title_ar}
                      </h3>
                      {offer.description_ar && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {offer.description_ar}
                        </p>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {/* Price */}
                        {offer.offer_price && (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary">${offer.offer_price}</span>
                            {offer.original_price && (
                              <span className="text-sm text-muted-foreground line-through">${offer.original_price}</span>
                            )}
                          </div>
                        )}

                        {/* Timer */}
                        {timeLeft[offer.id] && (
                          <div className="flex items-center gap-1.5 text-sm bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-mono font-medium">{timeLeft[offer.id]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
                  >
                    <span>اطلب الآن</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regular Offers - Compact Cards */}
      {regularOffers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">عروض خاصة</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {regularOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {offer.discount_percentage && offer.discount_percentage > 0 && (
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    -{offer.discount_percentage}%
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {offer.title_ar}
                    </h4>
                    {offer.offer_price && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-primary font-bold">${offer.offer_price}</span>
                        {offer.original_price && (
                          <span className="text-xs text-muted-foreground line-through">${offer.original_price}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {timeLeft[offer.id] && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{timeLeft[offer.id]}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedOffersSection;
