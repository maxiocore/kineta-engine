-- Function to refund balance when order is cancelled or refunded
CREATE OR REPLACE FUNCTION public.refund_balance_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only refund when status changes to cancelled or refunded
  IF (NEW.status IN ('cancelled', 'refunded')) AND (OLD.status NOT IN ('cancelled', 'refunded')) THEN
    -- Refund the order amount to user's balance
    UPDATE public.user_balances
    SET 
      balance = balance + NEW.total_price,
      total_spent = GREATEST(0, total_spent - NEW.total_price),
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Log the refund in balance_logs
    INSERT INTO public.balance_logs (
      user_id, 
      action_type, 
      amount, 
      balance_before, 
      balance_after, 
      reference_type,
      reference_id,
      notes
    )
    SELECT 
      NEW.user_id,
      'refund',
      NEW.total_price,
      ub.balance - NEW.total_price,
      ub.balance,
      'order',
      NEW.id,
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'استرداد الرصيد - إلغاء الطلب رقم ' || NEW.order_number
        ELSE 'استرداد الرصيد - استرجاع الطلب رقم ' || NEW.order_number
      END
    FROM public.user_balances ub
    WHERE ub.user_id = NEW.user_id;
    
    -- Create notification for user
    INSERT INTO public.notifications (user_id, title, message, type, related_order_id)
    VALUES (
      NEW.user_id,
      'تم استرداد الرصيد',
      'تم استرداد مبلغ $' || NEW.total_price || ' إلى رصيدك بعد ' || 
        CASE WHEN NEW.status = 'cancelled' THEN 'إلغاء' ELSE 'استرجاع' END || 
        ' الطلب رقم ' || NEW.order_number,
      'success',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic refund on order cancellation
DROP TRIGGER IF EXISTS refund_on_order_cancel ON public.orders;
CREATE TRIGGER refund_on_order_cancel
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.refund_balance_on_cancel();