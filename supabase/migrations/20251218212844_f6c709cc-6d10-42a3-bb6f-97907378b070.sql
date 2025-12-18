-- Add new order status values: partial and processing
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'partial';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';