import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('user_favorites')
      .select('service_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setFavorites(data.map(f => f.service_id));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (serviceId: string) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    const { error } = await supabase
      .from('user_favorites')
      .insert({ user_id: user.id, service_id: serviceId });

    if (error) {
      if (error.code === '23505') {
        toast.info('الخدمة موجودة بالفعل في المفضلة');
      } else {
        toast.error('فشل في إضافة الخدمة للمفضلة');
      }
      return false;
    }

    setFavorites(prev => [...prev, serviceId]);
    toast.success('تمت إضافة الخدمة للمفضلة');
    return true;
  };

  const removeFavorite = async (serviceId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('service_id', serviceId);

    if (error) {
      toast.error('فشل في إزالة الخدمة من المفضلة');
      return false;
    }

    setFavorites(prev => prev.filter(id => id !== serviceId));
    toast.success('تمت إزالة الخدمة من المفضلة');
    return true;
  };

  const toggleFavorite = async (serviceId: string) => {
    if (favorites.includes(serviceId)) {
      return removeFavorite(serviceId);
    } else {
      return addFavorite(serviceId);
    }
  };

  const isFavorite = (serviceId: string) => favorites.includes(serviceId);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};
