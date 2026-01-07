export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          related_order_id: string | null
          related_ticket_id: string | null
          related_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          related_order_id?: string | null
          related_ticket_id?: string | null
          related_user_id?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          related_order_id?: string | null
          related_ticket_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_related_ticket_id_fkey"
            columns: ["related_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          name?: string
          prefix: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          user_id?: string
        }
        Relationships: []
      }
      api_providers: {
        Row: {
          api_key: string
          api_url: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          last_sync_at: string | null
          name: string
          name_ar: string
          profit_margin: number
          services_count: number
          updated_at: string
        }
        Insert: {
          api_key: string
          api_url: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          name: string
          name_ar: string
          profit_margin?: number
          services_count?: number
          updated_at?: string
        }
        Update: {
          api_key?: string
          api_url?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          name?: string
          name_ar?: string
          profit_margin?: number
          services_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          response_time_ms: number | null
          status_code: number | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      app_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          message: string
          message_ar: string
          read_count: number
          scheduled_at: string | null
          send_email: boolean
          send_push: boolean
          sent_at: string | null
          sent_count: number
          target_audience: string
          target_user_ids: string[] | null
          title: string
          title_ar: string
          type: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          message: string
          message_ar: string
          read_count?: number
          scheduled_at?: string | null
          send_email?: boolean
          send_push?: boolean
          sent_at?: string | null
          sent_count?: number
          target_audience?: string
          target_user_ids?: string[] | null
          title: string
          title_ar: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string
          message_ar?: string
          read_count?: number
          scheduled_at?: string | null
          send_email?: boolean
          send_push?: boolean
          sent_at?: string | null
          sent_count?: number
          target_audience?: string
          target_user_ids?: string[] | null
          title?: string
          title_ar?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          color: string
          created_at: string
          description: string | null
          description_ar: string | null
          icon: string
          id: string
          is_active: boolean
          min_orders: number
          min_spending: number
          name: string
          name_ar: string
          tier: number
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon: string
          id?: string
          is_active?: boolean
          min_orders?: number
          min_spending?: number
          name: string
          name_ar: string
          tier?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          min_orders?: number
          min_spending?: number
          name?: string
          name_ar?: string
          tier?: number
        }
        Relationships: []
      }
      balance_logs: {
        Row: {
          action_type: string
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_withdrawal_requests: {
        Row: {
          account_holder_name: string
          admin_notes: string | null
          amount: number
          bank_name: string
          created_at: string
          iban: string
          id: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          admin_notes?: string | null
          amount: number
          bank_name: string
          created_at?: string
          iban: string
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          admin_notes?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cashback_settings: {
        Row: {
          cashback_percentage: number
          created_at: string
          id: string
          is_active: boolean
          max_cashback_amount: number | null
          min_deposit_amount: number
          updated_at: string
        }
        Insert: {
          cashback_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_cashback_amount?: number | null
          min_deposit_amount?: number
          updated_at?: string
        }
        Update: {
          cashback_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_cashback_amount?: number | null
          min_deposit_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      cashback_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          color: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean
          reward_points: number
          target_value: number
          title: string
          title_ar: string
          type: string
          updated_at: string
        }
        Insert: {
          challenge_type?: string
          color?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          reward_points?: number
          target_value?: number
          title: string
          title_ar: string
          type?: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          color?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean
          reward_points?: number
          target_value?: number
          title?: string
          title_ar?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          created_at: string
          discount_applied: number
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_applied: number
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_applied?: number
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          bonus_amount: number | null
          completed_at: string | null
          created_at: string
          fee_amount: number | null
          id: string
          notes: string | null
          payment_method_id: string | null
          status: string
          total_credited: number
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bonus_amount?: number | null
          completed_at?: string | null
          created_at?: string
          fee_amount?: number | null
          id?: string
          notes?: string | null
          payment_method_id?: string | null
          status?: string
          total_credited: number
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bonus_amount?: number | null
          completed_at?: string | null
          created_at?: string
          fee_amount?: number | null
          id?: string
          notes?: string | null
          payment_method_id?: string | null
          status?: string
          total_credited?: number
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_order_events: {
        Row: {
          actor_id: string | null
          actor_role: string
          created_at: string
          event_type: string
          id: string
          message_text: string | null
          order_id: string
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          event_type: string
          id?: string
          message_text?: string | null
          order_id: string
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          event_type?: string
          id?: string
          message_text?: string | null
          order_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "dev_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_order_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "dev_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_order_invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          invoice_number: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_number: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          invoice_number?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_order_invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "dev_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_orders: {
        Row: {
          admin_notes: string | null
          budget_range: string | null
          client_type: string
          contact_email: string | null
          created_at: string
          id: string
          order_no: string
          project_goal: string | null
          project_summary: string | null
          project_title: string | null
          rejection_reason: string | null
          requirements_json: Json | null
          service_id: string | null
          status: string
          timeline_expectation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          budget_range?: string | null
          client_type?: string
          contact_email?: string | null
          created_at?: string
          id?: string
          order_no: string
          project_goal?: string | null
          project_summary?: string | null
          project_title?: string | null
          rejection_reason?: string | null
          requirements_json?: Json | null
          service_id?: string | null
          status?: string
          timeline_expectation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          budget_range?: string | null
          client_type?: string
          contact_email?: string | null
          created_at?: string
          id?: string
          order_no?: string
          project_goal?: string | null
          project_summary?: string | null
          project_title?: string | null
          rejection_reason?: string | null
          requirements_json?: Json | null
          service_id?: string | null
          status?: string
          timeline_expectation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "dev_services"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_services: {
        Row: {
          base_price: number
          category: string
          created_at: string
          deliverables: Json | null
          desc_ar: string | null
          display_order: number | null
          eta_days_max: number
          eta_days_min: number
          faqs: Json | null
          features: Json | null
          has_guarantee: boolean
          icon: string | null
          id: string
          is_active: boolean
          is_fast: boolean
          is_featured: boolean
          requirements: Json | null
          slug: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string
          created_at?: string
          deliverables?: Json | null
          desc_ar?: string | null
          display_order?: number | null
          eta_days_max?: number
          eta_days_min?: number
          faqs?: Json | null
          features?: Json | null
          has_guarantee?: boolean
          icon?: string | null
          id?: string
          is_active?: boolean
          is_fast?: boolean
          is_featured?: boolean
          requirements?: Json | null
          slug: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          deliverables?: Json | null
          desc_ar?: string | null
          display_order?: number | null
          eta_days_max?: number
          eta_days_min?: number
          faqs?: Json | null
          features?: Json | null
          has_guarantee?: boolean
          icon?: string | null
          id?: string
          is_active?: boolean
          is_fast?: boolean
          is_featured?: boolean
          requirements?: Json | null
          slug?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          completed_at: string | null
          content: string
          created_at: string
          created_by: string | null
          delivered_count: number
          failed_count: number
          id: string
          name: string
          scheduled_at: string | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          target_audience: string
          template_id: string | null
          total_recipients: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          id?: string
          name: string
          scheduled_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject: string
          target_audience?: string
          template_id?: string | null
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          failed_count?: number
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          target_audience?: string
          template_id?: string | null
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string
          subject: string
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string
          subject: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      emails: {
        Row: {
          content: string
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_import_categories: {
        Row: {
          apply_profit_margin: boolean | null
          auto_translate: boolean | null
          category_name: string
          created_at: string
          id: string
          provider_id: string
          target_category_id: string | null
          user_id: string
        }
        Insert: {
          apply_profit_margin?: boolean | null
          auto_translate?: boolean | null
          category_name: string
          created_at?: string
          id?: string
          provider_id: string
          target_category_id?: string | null
          user_id: string
        }
        Update: {
          apply_profit_margin?: boolean | null
          auto_translate?: boolean | null
          category_name?: string
          created_at?: string
          id?: string
          provider_id?: string
          target_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_import_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_import_categories_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_offers: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          badge_text_ar: string | null
          category: string
          created_at: string
          description: string | null
          description_ar: string | null
          discount_percentage: number | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          offer_price: number | null
          original_price: number | null
          service_id: string | null
          start_date: string | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          badge_text_ar?: string | null
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          offer_price?: number | null
          original_price?: number | null
          service_id?: string | null
          start_date?: string | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          badge_text_ar?: string | null
          category?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          discount_percentage?: number | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          offer_price?: number | null
          original_price?: number | null
          service_id?: string | null
          start_date?: string | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_offers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_applications: {
        Row: {
          address: string | null
          admin_notes: string | null
          application_number: string
          approved_amount: number | null
          approved_at: string | null
          commercial_register: string | null
          company_name: string | null
          contract_document_url: string | null
          contract_number: string | null
          contract_signed_at: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          national_id: string
          phone: string
          plan_id: string | null
          promissory_note_url: string | null
          rejection_reason: string | null
          requested_amount: number
          reviewed_at: string | null
          reviewed_by: string | null
          service_description: string | null
          service_id: string | null
          status: string
          submitted_at: string
          tax_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          application_number: string
          approved_amount?: number | null
          approved_at?: string | null
          commercial_register?: string | null
          company_name?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          contract_signed_at?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          national_id: string
          phone: string
          plan_id?: string | null
          promissory_note_url?: string | null
          rejection_reason?: string | null
          requested_amount: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_description?: string | null
          service_id?: string | null
          status?: string
          submitted_at?: string
          tax_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          application_number?: string
          approved_amount?: number | null
          approved_at?: string | null
          commercial_register?: string | null
          company_name?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          contract_signed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          national_id?: string
          phone?: string
          plan_id?: string | null
          promissory_note_url?: string | null
          rejection_reason?: string | null
          requested_amount?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_description?: string | null
          service_id?: string | null
          status?: string
          submitted_at?: string
          tax_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_applications_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_applications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_installments: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          due_date: string
          id: string
          installment_number: number
          late_fee: number | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_installments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "financing_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_payment_receipts: {
        Row: {
          admin_notes: string | null
          amount: number
          application_id: string
          bank_name: string
          created_at: string
          id: string
          installment_id: string | null
          payment_date: string
          receipt_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          application_id: string
          bank_name?: string
          created_at?: string
          id?: string
          installment_id?: string | null
          payment_date?: string
          receipt_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          application_id?: string
          bank_name?: string
          created_at?: string
          id?: string
          installment_id?: string | null
          payment_date?: string
          receipt_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_payment_receipts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "financing_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_payment_receipts_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "financing_installments"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_plans: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number | null
          duration_months: number
          id: string
          installments_count: number
          is_active: boolean
          max_amount: number | null
          min_amount: number
          name: string
          name_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          duration_months?: number
          id?: string
          installments_count?: number
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          name: string
          name_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          duration_months?: number
          id?: string
          installments_count?: number
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          name?: string
          name_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      financing_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      hosting_operations_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          operation_type: string
          order_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation_type: string
          order_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation_type?: string
          order_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_operations_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "hosting_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_orders: {
        Row: {
          admin_notes: string | null
          configuration: Json | null
          created_at: string
          do_image: string | null
          do_price: number
          do_region: string | null
          do_resource_id: string | null
          do_resource_name: string | null
          do_size: string | null
          expires_at: string | null
          id: string
          order_number: string
          our_price: number
          product_id: string | null
          product_type: string
          provisioned_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          configuration?: Json | null
          created_at?: string
          do_image?: string | null
          do_price?: number
          do_region?: string | null
          do_resource_id?: string | null
          do_resource_name?: string | null
          do_size?: string | null
          expires_at?: string | null
          id?: string
          order_number: string
          our_price?: number
          product_id?: string | null
          product_type: string
          provisioned_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          configuration?: Json | null
          created_at?: string
          do_image?: string | null
          do_price?: number
          do_region?: string | null
          do_resource_id?: string | null
          do_resource_name?: string | null
          do_size?: string | null
          expires_at?: string | null
          id?: string
          order_number?: string
          our_price?: number
          product_id?: string | null
          product_type?: string
          provisioned_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosting_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "hosting_products"
            referencedColumns: ["id"]
          },
        ]
      }
      hosting_products: {
        Row: {
          billing_period: string
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number | null
          do_price: number
          id: string
          is_active: boolean
          name: string
          name_ar: string
          our_price: number
          product_type: string
          specs: Json | null
          updated_at: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          do_price?: number
          id?: string
          is_active?: boolean
          name: string
          name_ar: string
          our_price?: number
          product_type: string
          specs?: Json | null
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          do_price?: number
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string
          our_price?: number
          product_type?: string
          specs?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          available_start_date: string | null
          cover_letter: string | null
          created_at: string
          current_company: string | null
          email: string
          expected_salary: string | null
          full_name: string
          id: string
          job_id: string | null
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          years_of_experience: number | null
        }
        Insert: {
          admin_notes?: string | null
          available_start_date?: string | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          email: string
          expected_salary?: string | null
          full_name: string
          id?: string
          job_id?: string | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Update: {
          admin_notes?: string | null
          available_start_date?: string | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          email?: string
          expected_salary?: string | null
          full_name?: string
          id?: string
          job_id?: string | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          years_of_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          benefits: Json | null
          benefits_ar: Json | null
          created_at: string
          department: string
          department_ar: string
          description: string | null
          description_ar: string | null
          display_order: number | null
          employment_type: string
          id: string
          is_active: boolean
          is_featured: boolean
          location: string
          location_ar: string
          requirements: Json | null
          requirements_ar: Json | null
          salary_range: string | null
          salary_range_ar: string | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          benefits_ar?: Json | null
          created_at?: string
          department: string
          department_ar: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          employment_type?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          location?: string
          location_ar?: string
          requirements?: Json | null
          requirements_ar?: Json | null
          salary_range?: string | null
          salary_range_ar?: string | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          benefits_ar?: Json | null
          created_at?: string
          department?: string
          department_ar?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          employment_type?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          location?: string
          location_ar?: string
          requirements?: Json | null
          requirements_ar?: Json | null
          salary_range?: string | null
          salary_range_ar?: string | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_achievements: {
        Row: {
          achieved_at: string | null
          bonus_points_awarded: number | null
          completed_orders: number
          created_at: string
          exceeded_by: number | null
          goal_achieved: boolean
          id: string
          month: string
          monthly_goal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          bonus_points_awarded?: number | null
          completed_orders?: number
          created_at?: string
          exceeded_by?: number | null
          goal_achieved?: boolean
          id?: string
          month: string
          monthly_goal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          bonus_points_awarded?: number | null
          completed_orders?: number
          created_at?: string
          exceeded_by?: number | null
          goal_achieved?: boolean
          id?: string
          month?: string
          monthly_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_order_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          coupon_id: string | null
          created_at: string
          discount_amount: number | null
          external_order_id: string | null
          external_status: string | null
          id: string
          link: string | null
          notes: string | null
          order_number: string
          quantity: number | null
          remains: number | null
          service_id: string
          start_count: number | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number | null
          external_order_id?: string | null
          external_status?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_number: string
          quantity?: number | null
          remains?: number | null
          service_id: string
          start_count?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          coupon_id?: string | null
          created_at?: string
          discount_amount?: number | null
          external_order_id?: string | null
          external_status?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_number?: string
          quantity?: number | null
          remains?: number | null
          service_id?: string
          start_count?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_bonuses: {
        Row: {
          bonus_type: string
          bonus_value: number
          created_at: string
          id: string
          is_active: boolean
          max_amount: number | null
          min_amount: number
          payment_method_id: string | null
        }
        Insert: {
          bonus_type?: string
          bonus_value: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount: number
          payment_method_id?: string | null
        }
        Update: {
          bonus_type?: string
          bonus_value?: number
          created_at?: string
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          payment_method_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_bonuses_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          display_order: number | null
          extra_fee_type: string | null
          extra_fee_value: number | null
          id: string
          instructions: string | null
          instructions_ar: string | null
          is_active: boolean
          max_amount: number | null
          min_amount: number | null
          name: string
          name_ar: string
          provider: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          extra_fee_type?: string | null
          extra_fee_value?: number | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number | null
          name: string
          name_ar: string
          provider?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          extra_fee_type?: string | null
          extra_fee_value?: number | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number | null
          name?: string
          name_ar?: string
          provider?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          order_id: string | null
          points: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          order_id?: string | null
          points: number
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          order_id?: string | null
          points?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          phone_verified: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_balance_logs: {
        Row: {
          action_type: string
          balance: number
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          order_cost: number | null
          order_id: string | null
          provider_id: string
        }
        Insert: {
          action_type?: string
          balance: number
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          order_cost?: number | null
          order_id?: string | null
          provider_id: string
        }
        Update: {
          action_type?: string
          balance?: number
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          order_cost?: number | null
          order_id?: string | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_balance_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_balance_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          custom_commission_rate: number | null
          id: string
          is_active: boolean
          total_earnings: number
          total_referrals: number
          user_id: string
          vip_level_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          custom_commission_rate?: number | null
          id?: string
          is_active?: boolean
          total_earnings?: number
          total_referrals?: number
          user_id: string
          vip_level_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          custom_commission_rate?: number | null
          id?: string
          is_active?: boolean
          total_earnings?: number
          total_referrals?: number
          user_id?: string
          vip_level_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_vip_level_id_fkey"
            columns: ["vip_level_id"]
            isOneToOne: false
            referencedRelation: "vip_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_amount: number
          order_id: string
          paid_at: string | null
          referral_id: string
          status: string
        }
        Insert: {
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          order_amount: number
          order_id: string
          paid_at?: string | null
          referral_id: string
          status?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string
          paid_at?: string | null
          referral_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_rate: number
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
          total_commission: number
        }
        Insert: {
          commission_rate?: number
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
          total_commission?: number
        }
        Update: {
          commission_rate?: number
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          total_commission?: number
        }
        Relationships: []
      }
      refill_requests: {
        Row: {
          auto_created: boolean | null
          created_at: string
          current_quantity: number | null
          external_refill_id: string | null
          id: string
          notes: string | null
          order_id: string
          original_quantity: number
          processed_at: string | null
          refill_quantity: number | null
          status: string
          user_id: string
        }
        Insert: {
          auto_created?: boolean | null
          created_at?: string
          current_quantity?: number | null
          external_refill_id?: string | null
          id?: string
          notes?: string | null
          order_id: string
          original_quantity: number
          processed_at?: string | null
          refill_quantity?: number | null
          status?: string
          user_id: string
        }
        Update: {
          auto_created?: boolean | null
          created_at?: string
          current_quantity?: number | null
          external_refill_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          original_quantity?: number
          processed_at?: string | null
          refill_quantity?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refill_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_tiers: {
        Row: {
          benefits: Json | null
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          min_points: number
          name: string
          name_ar: string
          points_multiplier: number
        }
        Insert: {
          benefits?: Json | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          min_points?: number
          name: string
          name_ar: string
          points_multiplier?: number
        }
        Update: {
          benefits?: Json | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          min_points?: number
          name?: string
          name_ar?: string
          points_multiplier?: number
        }
        Relationships: []
      }
      services: {
        Row: {
          auto_refill_enabled: boolean | null
          category: string
          category_id: string | null
          created_at: string
          description: string | null
          external_service_id: string | null
          features: Json | null
          id: string
          image_url: string | null
          name: string
          price: number
          provider_id: string | null
          refill_days: number | null
          refill_enabled: boolean | null
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
        }
        Insert: {
          auto_refill_enabled?: boolean | null
          category: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          external_service_id?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          provider_id?: string | null
          refill_days?: number | null
          refill_enabled?: boolean | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
        }
        Update: {
          auto_refill_enabled?: boolean | null
          category?: string
          category_id?: string | null
          created_at?: string
          description?: string | null
          external_service_id?: string | null
          features?: Json | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          provider_id?: string | null
          refill_days?: number | null
          refill_enabled?: boolean | null
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "api_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message: string
          phone: string
          reference_id: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          phone: string
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          phone?: string
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          related_order_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          related_order_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_admin: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_balances: {
        Row: {
          balance: number
          id: string
          total_deposited: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_cashback: {
        Row: {
          cashback_balance: number
          created_at: string
          id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cashback_balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cashback_balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          is_completed: boolean
          period_end: string
          period_start: string
          points_awarded: number | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          is_completed?: boolean
          period_end: string
          period_start: string
          points_awarded?: number | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          is_completed?: boolean
          period_end?: string
          period_start?: string
          points_awarded?: number | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_reads: {
        Row: {
          app_notification_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          app_notification_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          app_notification_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_app_notification_id_fkey"
            columns: ["app_notification_id"]
            isOneToOne: false
            referencedRelation: "app_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          available_points: number
          id: string
          redeemed_points: number
          tier_id: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          id?: string
          redeemed_points?: number
          tier_id?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          id?: string
          redeemed_points?: number
          tier_id?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "reward_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recent_links: {
        Row: {
          created_at: string
          id: string
          label: string | null
          last_used_at: string
          link: string
          service_category: string | null
          use_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          last_used_at?: string
          link: string
          service_category?: string | null
          use_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          last_used_at?: string
          link?: string
          service_category?: string | null
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          language: string
          notification_email: boolean
          notification_orders: boolean
          notification_promotions: boolean
          notification_push: boolean
          theme: string
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          notification_email?: boolean
          notification_orders?: boolean
          notification_promotions?: boolean
          notification_push?: boolean
          theme?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          notification_email?: boolean
          notification_orders?: boolean
          notification_promotions?: boolean
          notification_push?: boolean
          theme?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_levels: {
        Row: {
          benefits: Json | null
          color: string
          commission_rate: number
          created_at: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean
          min_earnings: number
          min_referrals: number
          name: string
          name_ar: string
        }
        Insert: {
          benefits?: Json | null
          color?: string
          commission_rate?: number
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean
          min_earnings?: number
          min_referrals?: number
          name: string
          name_ar: string
        }
        Update: {
          benefits?: Json | null
          color?: string
          commission_rate?: number
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean
          min_earnings?: number
          min_referrals?: number
          name?: string
          name_ar?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_overdue_installments: { Args: never; Returns: undefined }
      withdraw_cashback: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "refunded"
        | "partial"
        | "processing"
      service_status: "active" | "inactive" | "archived"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      order_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "refunded",
        "partial",
        "processing",
      ],
      service_status: ["active", "inactive", "archived"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
