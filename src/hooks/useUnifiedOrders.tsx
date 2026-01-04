import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  UnifiedOrder,
  OrderDomain,
  UnifiedStatus,
  OrderFilters,
  OrderSort,
  OrderStats,
  domainLabels,
  unifiedStatusConfig,
  devOrderStatusMap,
  smmOrderStatusMap,
} from '@/types/unified-orders';

interface UseUnifiedOrdersOptions {
  filters?: OrderFilters;
  sort?: OrderSort;
  isAdmin?: boolean;
  realtime?: boolean;
}

interface UseUnifiedOrdersReturn {
  orders: UnifiedOrder[];
  loading: boolean;
  error: string | null;
  stats: OrderStats;
  refetch: () => Promise<void>;
}

// Normalize dev_orders to UnifiedOrder
function normalizeDevOrder(order: any): UnifiedOrder {
  const originalStatus = order.status || 'draft';
  const unifiedStatus = devOrderStatusMap[originalStatus] || 'submitted';
  const statusConfig = unifiedStatusConfig[unifiedStatus];
  
  return {
    id: order.id,
    order_no: order.order_no,
    domain: 'dev' as OrderDomain,
    domain_label: domainLabels.dev,
    service_id: order.service_id,
    service_title: order.service?.title_ar || 'خدمة برمجية',
    status: unifiedStatus,
    status_label: statusConfig.label,
    status_rank: statusConfig.rank,
    status_config: statusConfig,
    created_at: order.created_at,
    updated_at: order.updated_at,
    action_required: unifiedStatus === 'action_required',
    action_label: unifiedStatus === 'action_required' ? 'يرجى إضافة المعلومات المطلوبة' : undefined,
    user_id: order.user_id,
    user_email: order.contact_email,
    meta: {
      project_title: order.project_title,
      project_goal: order.project_goal,
      budget_range: order.budget_range,
      timeline_expectation: order.timeline_expectation,
      client_type: order.client_type,
      requirements_json: order.requirements_json,
      admin_notes: order.admin_notes,
      rejection_reason: order.rejection_reason,
    },
    source_table: 'dev_orders',
    source_id: order.id,
  };
}

// Normalize orders (SMM/regular) to UnifiedOrder
function normalizeOrder(order: any): UnifiedOrder {
  const originalStatus = order.status || 'pending';
  const unifiedStatus = smmOrderStatusMap[originalStatus] || 'submitted';
  const statusConfig = unifiedStatusConfig[unifiedStatus];
  
  return {
    id: order.id,
    order_no: order.order_number,
    domain: 'smm' as OrderDomain,
    domain_label: domainLabels.smm,
    service_id: order.service_id,
    service_title: order.service?.name_ar || order.service?.name || 'خدمة',
    status: unifiedStatus,
    status_label: statusConfig.label,
    status_rank: statusConfig.rank,
    status_config: statusConfig,
    created_at: order.created_at,
    updated_at: order.updated_at,
    action_required: false,
    user_id: order.user_id,
    total_price: order.total_price,
    meta: {
      link: order.link,
      quantity: order.quantity,
      start_count: order.start_count,
      remains: order.remains,
      external_order_id: order.external_order_id,
      external_status: order.external_status,
      notes: order.notes,
      admin_notes: order.admin_notes,
    },
    source_table: 'orders',
    source_id: order.id,
  };
}

export function useUnifiedOrders(options: UseUnifiedOrdersOptions = {}): UseUnifiedOrdersReturn {
  const { filters = {}, sort = { field: 'created_at', direction: 'desc' }, isAdmin = false, realtime = true } = options;
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    // For admin, we don't need user to be logged in
    // For client, we need user
    if (!isAdmin && !user) {
      console.log('useUnifiedOrders: No user logged in and not admin mode');
      setOrders([]);
      setLoading(false);
      return;
    }

    console.log('useUnifiedOrders: Fetching orders...', { isAdmin, userId: user?.id });
    setLoading(true);
    setError(null);

    try {
      const allOrders: UnifiedOrder[] = [];

      // Fetch dev_orders
      let devQuery = supabase
        .from('dev_orders')
        .select(`
          *,
          service:dev_services(title_ar, icon)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
        devQuery = devQuery.eq('user_id', user.id);
      }

      const { data: devOrders, error: devError } = await devQuery;
      
      if (devError) {
        console.error('Error fetching dev_orders:', devError);
      } else {
        console.log('useUnifiedOrders: Fetched dev_orders:', devOrders?.length || 0);
        if (devOrders) {
          allOrders.push(...devOrders.map(normalizeDevOrder));
        }
      }

      // Fetch regular orders (SMM)
      let ordersQuery = supabase
        .from('orders')
        .select(`
          *,
          service:services(name, name_ar)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
        ordersQuery = ordersQuery.eq('user_id', user.id);
      }

      const { data: regularOrders, error: ordersError } = await ordersQuery;
      
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        console.log('useUnifiedOrders: Fetched orders:', regularOrders?.length || 0);
        if (regularOrders) {
          allOrders.push(...regularOrders.map(normalizeOrder));
        }
      }

      console.log('useUnifiedOrders: Total orders before filters:', allOrders.length);

      // Apply filters
      let filteredOrders = allOrders;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order =>
          order.order_no.toLowerCase().includes(searchLower) ||
          order.service_title.toLowerCase().includes(searchLower) ||
          order.meta?.project_title?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.domain && filters.domain !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.domain === filters.domain);
      }

      if (filters.status && filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status);
      }

      if (filters.actionRequired) {
        filteredOrders = filteredOrders.filter(order => order.action_required);
      }

      if (filters.userId) {
        filteredOrders = filteredOrders.filter(order => order.user_id === filters.userId);
      }

      // Apply sorting
      filteredOrders.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sort.field) {
          case 'status_rank':
            aValue = a.status_rank;
            bValue = b.status_rank;
            break;
          case 'updated_at':
            aValue = new Date(a.updated_at).getTime();
            bValue = new Date(b.updated_at).getTime();
            break;
          case 'due_at':
            aValue = a.due_at ? new Date(a.due_at).getTime() : Infinity;
            bValue = b.due_at ? new Date(b.due_at).getTime() : Infinity;
            break;
          default:
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
        }

        if (sort.direction === 'asc') {
          return aValue - bValue;
        }
        return bValue - aValue;
      });

      console.log('useUnifiedOrders: Final orders count:', filteredOrders.length);
      setOrders(filteredOrders);
    } catch (err: any) {
      console.error('Error fetching unified orders:', err);
      setError(err.message || 'فشل في جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, filters.search, filters.domain, filters.status, filters.actionRequired, filters.userId, sort.field, sort.direction]);

  // Calculate stats
  const stats = useMemo<OrderStats>(() => {
    return {
      total: orders.length,
      inProgress: orders.filter(o => o.status === 'in_progress' || o.status === 'under_review').length,
      actionRequired: orders.filter(o => o.action_required).length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length,
      draft: orders.filter(o => o.status === 'draft').length,
    };
  }, [orders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscriptions
  useEffect(() => {
    if (!realtime) return;
    // For admin mode, don't require user
    if (!isAdmin && !user) return;

    console.log('useUnifiedOrders: Setting up realtime subscriptions...', { isAdmin, userId: user?.id });

    const devChannel = supabase
      .channel('unified-dev-orders-' + (user?.id || 'admin'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dev_orders',
        },
        (payload) => {
          console.log('useUnifiedOrders: dev_orders realtime update:', payload);
          // For client, only refetch if it's their order
          if (!isAdmin && user && payload.new && (payload.new as any).user_id !== user.id) {
            return;
          }
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('useUnifiedOrders: dev_orders channel status:', status);
      });

    const ordersChannel = supabase
      .channel('unified-orders-' + (user?.id || 'admin'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('useUnifiedOrders: orders realtime update:', payload);
          // For client, only refetch if it's their order
          if (!isAdmin && user && payload.new && (payload.new as any).user_id !== user.id) {
            return;
          }
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('useUnifiedOrders: orders channel status:', status);
      });

    return () => {
      console.log('useUnifiedOrders: Cleaning up realtime subscriptions');
      supabase.removeChannel(devChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [user, isAdmin, realtime, fetchOrders]);

  return {
    orders,
    loading,
    error,
    stats,
    refetch: fetchOrders,
  };
}

// Hook to fetch single order details
export function useUnifiedOrderDetails(orderId: string | undefined) {
  const [order, setOrder] = useState<UnifiedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try dev_orders first
      const { data: devOrder, error: devError } = await supabase
        .from('dev_orders')
        .select(`
          *,
          service:dev_services(title_ar, icon)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (devOrder) {
        setOrder(normalizeDevOrder(devOrder));
        setLoading(false);
        return;
      }

      // Try regular orders
      const { data: regularOrder, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          service:services(name, name_ar)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (regularOrder) {
        setOrder(normalizeOrder(regularOrder));
        setLoading(false);
        return;
      }

      setOrder(null);
      setError('الطلب غير موجود');
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'فشل في جلب تفاصيل الطلب');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}
