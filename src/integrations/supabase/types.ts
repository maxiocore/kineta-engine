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
    PostgrestVersion: "14.5"
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
          device_fingerprint: string | null
          geo_city: string | null
          geo_country: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          processing_time_ms: number | null
          record_id: string | null
          risk_level: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          verification_step: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_fingerprint?: string | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          processing_time_ms?: number | null
          record_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          verification_step?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_fingerprint?: string | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          processing_time_ms?: number | null
          record_id?: string | null
          risk_level?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          verification_step?: string | null
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
      cloud_activity_logs: {
        Row: {
          created_at: string
          details: Json
          event: string
          id: string
          server_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event: string
          id?: string
          server_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          event?: string
          id?: string
          server_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_activity_logs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_backups: {
        Row: {
          created_at: string
          id: string
          server_id: string
          size_gb: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          server_id: string
          size_gb?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          server_id?: string
          size_gb?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_backups_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_billing_settings: {
        Row: {
          backups_surcharge: number
          currency: string
          id: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          backups_surcharge?: number
          currency?: string
          id?: number
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          backups_surcharge?: number
          currency?: string
          id?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      cloud_images: {
        Row: {
          architecture: string | null
          cloud_supported: boolean
          code: string
          created_at: string
          dedicated_supported: boolean
          description: string | null
          family: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          provider_image_id: string | null
          provider_status: string | null
          sort_order: number
          updated_at: string
          version: string | null
        }
        Insert: {
          architecture?: string | null
          cloud_supported?: boolean
          code: string
          created_at?: string
          dedicated_supported?: boolean
          description?: string | null
          family: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          provider_image_id?: string | null
          provider_status?: string | null
          sort_order?: number
          updated_at?: string
          version?: string | null
        }
        Update: {
          architecture?: string | null
          cloud_supported?: boolean
          code?: string
          created_at?: string
          dedicated_supported?: boolean
          description?: string | null
          family?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          provider_image_id?: string | null
          provider_status?: string | null
          sort_order?: number
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      cloud_locations: {
        Row: {
          city: string | null
          cloud_available: boolean
          code: string
          country: string | null
          created_at: string
          customer_visible: boolean
          dedicated_available: boolean
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          provider_available: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          city?: string | null
          cloud_available?: boolean
          code: string
          country?: string | null
          created_at?: string
          customer_visible?: boolean
          dedicated_available?: boolean
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          provider_available?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          city?: string | null
          cloud_available?: boolean
          code?: string
          country?: string | null
          created_at?: string
          customer_visible?: boolean
          dedicated_available?: boolean
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          provider_available?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cloud_orders: {
        Row: {
          adjusted_cost_sar: number | null
          backups_selected: boolean | null
          cost_buffer_pct: number | null
          created_at: string
          exchange_rate_used: number | null
          gross_margin_pct: number | null
          gross_profit: number | null
          id: string
          idempotency_key: string
          included_traffic_tb: number | null
          ipv4_selected: boolean | null
          location_code: string | null
          overage_cost_sar: number | null
          payment_method: string
          plan_id: string | null
          provider_addons_cost: number | null
          provider_backup_cost: number | null
          provider_cost_original: number | null
          provider_cost_sar: number | null
          provider_currency: string | null
          provider_ipv4_cost: number | null
          provider_server_cost: number | null
          raw_provider_cost: number | null
          retail_addons_price: number | null
          retail_backup_price: number | null
          retail_ipv4_price: number | null
          retail_price_before_vat: number | null
          retail_server_price: number | null
          server_id: string | null
          status: string
          subtotal: number
          total: number
          traffic_overage_currency: string | null
          traffic_overage_price: number | null
          transaction_reference: string
          updated_at: string
          user_id: string
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          adjusted_cost_sar?: number | null
          backups_selected?: boolean | null
          cost_buffer_pct?: number | null
          created_at?: string
          exchange_rate_used?: number | null
          gross_margin_pct?: number | null
          gross_profit?: number | null
          id?: string
          idempotency_key: string
          included_traffic_tb?: number | null
          ipv4_selected?: boolean | null
          location_code?: string | null
          overage_cost_sar?: number | null
          payment_method?: string
          plan_id?: string | null
          provider_addons_cost?: number | null
          provider_backup_cost?: number | null
          provider_cost_original?: number | null
          provider_cost_sar?: number | null
          provider_currency?: string | null
          provider_ipv4_cost?: number | null
          provider_server_cost?: number | null
          raw_provider_cost?: number | null
          retail_addons_price?: number | null
          retail_backup_price?: number | null
          retail_ipv4_price?: number | null
          retail_price_before_vat?: number | null
          retail_server_price?: number | null
          server_id?: string | null
          status?: string
          subtotal: number
          total: number
          traffic_overage_currency?: string | null
          traffic_overage_price?: number | null
          transaction_reference: string
          updated_at?: string
          user_id: string
          vat_amount: number
          vat_rate: number
        }
        Update: {
          adjusted_cost_sar?: number | null
          backups_selected?: boolean | null
          cost_buffer_pct?: number | null
          created_at?: string
          exchange_rate_used?: number | null
          gross_margin_pct?: number | null
          gross_profit?: number | null
          id?: string
          idempotency_key?: string
          included_traffic_tb?: number | null
          ipv4_selected?: boolean | null
          location_code?: string | null
          overage_cost_sar?: number | null
          payment_method?: string
          plan_id?: string | null
          provider_addons_cost?: number | null
          provider_backup_cost?: number | null
          provider_cost_original?: number | null
          provider_cost_sar?: number | null
          provider_currency?: string | null
          provider_ipv4_cost?: number | null
          provider_server_cost?: number | null
          raw_provider_cost?: number | null
          retail_addons_price?: number | null
          retail_backup_price?: number | null
          retail_ipv4_price?: number | null
          retail_price_before_vat?: number | null
          retail_server_price?: number | null
          server_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          traffic_overage_currency?: string | null
          traffic_overage_price?: number | null
          transaction_reference?: string
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "cloud_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cloud_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_orders_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_plan_costs: {
        Row: {
          infra_cost: number
          plan_id: string
          pricing_mode: string
          provider_id: string | null
          provider_ref: string | null
          provider_setup_cost: number
          updated_at: string
        }
        Insert: {
          infra_cost?: number
          plan_id: string
          pricing_mode?: string
          provider_id?: string | null
          provider_ref?: string | null
          provider_setup_cost?: number
          updated_at?: string
        }
        Update: {
          infra_cost?: number
          plan_id?: string
          pricing_mode?: string
          provider_id?: string | null
          provider_ref?: string | null
          provider_setup_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_plan_costs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "cloud_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_plan_costs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_plan_location_prices: {
        Row: {
          id: string
          location_code: string
          monthly_price: number
          plan_id: string
        }
        Insert: {
          id?: string
          location_code: string
          monthly_price: number
          plan_id: string
        }
        Update: {
          id?: string
          location_code?: string
          monthly_price?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_plan_location_prices_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cloud_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_plans: {
        Row: {
          architecture: string | null
          billing_cycles: string[]
          category: string
          code: string
          cores: number | null
          cpu_model: string | null
          cpu_type: string | null
          created_at: string
          disk_count: number | null
          disk_type: string | null
          featured: boolean
          id: string
          ipv4_included: boolean
          ipv4_mode: string
          ipv4_retail_price: number | null
          ipv6_included: boolean
          is_active: boolean
          location_codes: string[]
          monthly_price: number
          name_ar: string
          name_en: string
          network: string | null
          pricing_mode: string
          ram_gb: number
          retail_backup_price: number | null
          retail_overage_price_sar: number | null
          server_type: string
          setup_fee: number
          sort_order: number
          status: string
          storage_gb: number
          threads: number | null
          traffic_tb: number | null
          updated_at: string
          vcpu: number | null
        }
        Insert: {
          architecture?: string | null
          billing_cycles?: string[]
          category?: string
          code: string
          cores?: number | null
          cpu_model?: string | null
          cpu_type?: string | null
          created_at?: string
          disk_count?: number | null
          disk_type?: string | null
          featured?: boolean
          id?: string
          ipv4_included?: boolean
          ipv4_mode?: string
          ipv4_retail_price?: number | null
          ipv6_included?: boolean
          is_active?: boolean
          location_codes?: string[]
          monthly_price?: number
          name_ar: string
          name_en: string
          network?: string | null
          pricing_mode?: string
          ram_gb?: number
          retail_backup_price?: number | null
          retail_overage_price_sar?: number | null
          server_type: string
          setup_fee?: number
          sort_order?: number
          status?: string
          storage_gb?: number
          threads?: number | null
          traffic_tb?: number | null
          updated_at?: string
          vcpu?: number | null
        }
        Update: {
          architecture?: string | null
          billing_cycles?: string[]
          category?: string
          code?: string
          cores?: number | null
          cpu_model?: string | null
          cpu_type?: string | null
          created_at?: string
          disk_count?: number | null
          disk_type?: string | null
          featured?: boolean
          id?: string
          ipv4_included?: boolean
          ipv4_mode?: string
          ipv4_retail_price?: number | null
          ipv6_included?: boolean
          is_active?: boolean
          location_codes?: string[]
          monthly_price?: number
          name_ar?: string
          name_en?: string
          network?: string | null
          pricing_mode?: string
          ram_gb?: number
          retail_backup_price?: number | null
          retail_overage_price_sar?: number | null
          server_type?: string
          setup_fee?: number
          sort_order?: number
          status?: string
          storage_gb?: number
          threads?: number | null
          traffic_tb?: number | null
          updated_at?: string
          vcpu?: number | null
        }
        Relationships: []
      }
      cloud_price_alerts: {
        Row: {
          created_at: string
          id: string
          location: string | null
          message: string | null
          new_value: number | null
          old_value: number | null
          plan_id: string | null
          resolved: boolean
          server_type: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          message?: string | null
          new_value?: number | null
          old_value?: number | null
          plan_id?: string | null
          resolved?: boolean
          server_type?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          message?: string | null
          new_value?: number | null
          old_value?: number | null
          plan_id?: string | null
          resolved?: boolean
          server_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_price_alerts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cloud_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_pricing_settings: {
        Row: {
          auto_rate: number | null
          auto_rate_source: string | null
          auto_rate_updated_at: string | null
          cost_buffer_pct: number
          id: number
          manual_rate: number
          min_margin_pct: number
          provider_currency: string
          provisioning_mode: string
          rate_mode: string
          rate_stale_hours: number
          selling_currency: string
          updated_at: string
        }
        Insert: {
          auto_rate?: number | null
          auto_rate_source?: string | null
          auto_rate_updated_at?: string | null
          cost_buffer_pct?: number
          id?: number
          manual_rate?: number
          min_margin_pct?: number
          provider_currency?: string
          provisioning_mode?: string
          rate_mode?: string
          rate_stale_hours?: number
          selling_currency?: string
          updated_at?: string
        }
        Update: {
          auto_rate?: number | null
          auto_rate_source?: string | null
          auto_rate_updated_at?: string | null
          cost_buffer_pct?: number
          id?: number
          manual_rate?: number
          min_margin_pct?: number
          provider_currency?: string
          provisioning_mode?: string
          rate_mode?: string
          rate_stale_hours?: number
          selling_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      cloud_provider_addon_prices: {
        Row: {
          currency: string
          id: string
          location: string
          note: string | null
          percentage: number | null
          price_gross: number | null
          price_net: number | null
          pricing_available: boolean
          provider_id: string
          resource: string
          source: string
          synced_at: string
          unit: string | null
          variant: string
        }
        Insert: {
          currency?: string
          id?: string
          location?: string
          note?: string | null
          percentage?: number | null
          price_gross?: number | null
          price_net?: number | null
          pricing_available?: boolean
          provider_id: string
          resource: string
          source?: string
          synced_at?: string
          unit?: string | null
          variant?: string
        }
        Update: {
          currency?: string
          id?: string
          location?: string
          note?: string | null
          percentage?: number | null
          price_gross?: number | null
          price_net?: number | null
          pricing_available?: boolean
          provider_id?: string
          resource?: string
          source?: string
          synced_at?: string
          unit?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_provider_addon_prices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_provider_catalog: {
        Row: {
          data: Json
          id: string
          kind: string
          name: string
          provider_id: string
          provider_ref: string
          synced_at: string
        }
        Insert: {
          data?: Json
          id?: string
          kind: string
          name: string
          provider_id: string
          provider_ref: string
          synced_at?: string
        }
        Update: {
          data?: Json
          id?: string
          kind?: string
          name?: string
          provider_id?: string
          provider_ref?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_provider_catalog_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_provider_prices: {
        Row: {
          changed_at: string | null
          currency: string
          hourly_net: number | null
          id: string
          included_traffic_tb: number | null
          location: string
          monthly_gross: number | null
          monthly_net: number
          overage_price_per_tb: number | null
          overage_source: string | null
          previous_monthly_net: number | null
          provider_id: string
          server_type: string
          synced_at: string
        }
        Insert: {
          changed_at?: string | null
          currency?: string
          hourly_net?: number | null
          id?: string
          included_traffic_tb?: number | null
          location: string
          monthly_gross?: number | null
          monthly_net: number
          overage_price_per_tb?: number | null
          overage_source?: string | null
          previous_monthly_net?: number | null
          provider_id: string
          server_type: string
          synced_at?: string
        }
        Update: {
          changed_at?: string | null
          currency?: string
          hourly_net?: number | null
          id?: string
          included_traffic_tb?: number | null
          location?: string
          monthly_gross?: number | null
          monthly_net?: number
          overage_price_per_tb?: number | null
          overage_source?: string | null
          previous_monthly_net?: number | null
          provider_id?: string
          server_type?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_provider_prices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_providers: {
        Row: {
          code: string
          created_at: string
          id: string
          last_error: string | null
          last_health_check: string | null
          last_success_at: string | null
          name: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          last_error?: string | null
          last_health_check?: string | null
          last_success_at?: string | null
          name: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          last_error?: string | null
          last_health_check?: string | null
          last_success_at?: string | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      cloud_provisioning_jobs: {
        Row: {
          attempt_count: number
          created_at: string
          error_code: string | null
          id: string
          last_attempt_at: string | null
          order_id: string
          provider_request_id: string | null
          provider_resource_id: string | null
          safe_error: string | null
          server_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          error_code?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id: string
          provider_request_id?: string | null
          provider_resource_id?: string | null
          safe_error?: string | null
          server_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          error_code?: string | null
          id?: string
          last_attempt_at?: string | null
          order_id?: string
          provider_request_id?: string | null
          provider_resource_id?: string | null
          safe_error?: string | null
          server_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_provisioning_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "cloud_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cloud_provisioning_jobs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_resource_mappings: {
        Row: {
          code: string
          id: string
          kind: string
          provider_id: string
          provider_ref: string
        }
        Insert: {
          code: string
          id?: string
          kind: string
          provider_id: string
          provider_ref: string
        }
        Update: {
          code?: string
          id?: string
          kind?: string
          provider_id?: string
          provider_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_resource_mappings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "cloud_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_server_actions: {
        Row: {
          action: string
          created_at: string
          error: string | null
          id: string
          payload: Json
          server_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          server_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          server_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_server_actions_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_server_ips: {
        Row: {
          created_at: string
          id: string
          ip: string
          is_primary: boolean
          reverse_dns: string | null
          server_id: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          is_primary?: boolean
          reverse_dns?: string | null
          server_id: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          is_primary?: boolean
          reverse_dns?: string | null
          server_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cloud_server_ips_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_servers: {
        Row: {
          backups_enabled: boolean
          cancelled_at: string | null
          created_at: string
          hostname: string | null
          id: string
          image_code: string | null
          location_code: string | null
          monthly_price: number
          name: string
          plan_id: string | null
          primary_ipv4: string | null
          primary_ipv6: string | null
          provider: string
          provider_server_id: string | null
          renewal_date: string | null
          server_type: string
          specs: Json
          ssh_key_id: string | null
          status: string
          suspend_reason: string | null
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backups_enabled?: boolean
          cancelled_at?: string | null
          created_at?: string
          hostname?: string | null
          id?: string
          image_code?: string | null
          location_code?: string | null
          monthly_price?: number
          name: string
          plan_id?: string | null
          primary_ipv4?: string | null
          primary_ipv6?: string | null
          provider?: string
          provider_server_id?: string | null
          renewal_date?: string | null
          server_type: string
          specs?: Json
          ssh_key_id?: string | null
          status?: string
          suspend_reason?: string | null
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backups_enabled?: boolean
          cancelled_at?: string | null
          created_at?: string
          hostname?: string | null
          id?: string
          image_code?: string | null
          location_code?: string | null
          monthly_price?: number
          name?: string
          plan_id?: string | null
          primary_ipv4?: string | null
          primary_ipv6?: string | null
          provider?: string
          provider_server_id?: string | null
          renewal_date?: string | null
          server_type?: string
          specs?: Json
          ssh_key_id?: string | null
          status?: string
          suspend_reason?: string | null
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_servers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "cloud_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_snapshots: {
        Row: {
          created_at: string
          id: string
          name: string
          server_id: string
          size_gb: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          server_id: string
          size_gb?: number | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          server_id?: string
          size_gb?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_snapshots_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "cloud_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_ssh_keys: {
        Row: {
          created_at: string
          fingerprint: string | null
          id: string
          name: string
          public_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fingerprint?: string | null
          id?: string
          name: string
          public_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: string | null
          id?: string
          name?: string
          public_key?: string
          user_id?: string
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
      device_fingerprints: {
        Row: {
          applications_count: number | null
          blocked_reason: string | null
          created_at: string
          device_info: Json
          fingerprint_hash: string
          first_seen_at: string
          geo_city: string | null
          geo_country: string | null
          id: string
          ip_address: string | null
          is_blocked: boolean | null
          is_proxy: boolean | null
          is_tor: boolean | null
          is_vpn: boolean | null
          last_seen_at: string
          risk_score: number | null
          user_id: string | null
        }
        Insert: {
          applications_count?: number | null
          blocked_reason?: string | null
          created_at?: string
          device_info?: Json
          fingerprint_hash: string
          first_seen_at?: string
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          is_proxy?: boolean | null
          is_tor?: boolean | null
          is_vpn?: boolean | null
          last_seen_at?: string
          risk_score?: number | null
          user_id?: string | null
        }
        Update: {
          applications_count?: number | null
          blocked_reason?: string | null
          created_at?: string
          device_info?: Json
          fingerprint_hash?: string
          first_seen_at?: string
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          is_proxy?: boolean | null
          is_tor?: boolean | null
          is_vpn?: boolean | null
          last_seen_at?: string
          risk_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      disposable_email_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
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
      email_login_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      email_rate_limits: {
        Row: {
          email_address: string
          email_count: number
          id: string
          last_email_at: string
          window_start: string
        }
        Insert: {
          email_address: string
          email_count?: number
          id?: string
          last_email_at?: string
          window_start?: string
        }
        Update: {
          email_address?: string
          email_count?: number
          id?: string
          last_email_at?: string
          window_start?: string
        }
        Relationships: []
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
      email_verification_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          failure_reason: string | null
          id: string
          input_otp_hash: string
          ip_address: string | null
          is_success: boolean
          user_agent: string | null
          verification_id: string
        }
        Insert: {
          attempt_number: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          input_otp_hash: string
          ip_address?: string | null
          is_success?: boolean
          user_agent?: string | null
          verification_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          input_otp_hash?: string
          ip_address?: string | null
          is_success?: boolean
          user_agent?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_attempts_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "email_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          attempts_count: number
          created_at: string
          email: string
          expires_at: string
          id: string
          ip_address: string | null
          locked_until: string | null
          max_attempts: number
          otp_hash: string
          purpose: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          email: string
          expires_at: string
          id?: string
          ip_address?: string | null
          locked_until?: string | null
          max_attempts?: number
          otp_hash: string
          purpose?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          locked_until?: string | null
          max_attempts?: number
          otp_hash?: string
          purpose?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verified_at?: string | null
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
      external_deposits: {
        Row: {
          amount: number
          created_at: string
          external_transaction_id: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          source: string
          status: string
          user_id: string
          wallet_account_number: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          source?: string
          status?: string
          user_id: string
          wallet_account_number: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          source?: string
          status?: string
          user_id?: string
          wallet_account_number?: string
        }
        Relationships: []
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
      financing_contract_documents: {
        Row: {
          acceptance_checkbox: boolean | null
          application_id: string
          contract_number: string
          created_at: string | null
          expired_at: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          pdf_hash: string | null
          pdf_url: string | null
          reading_time_seconds: number | null
          rejected_at: string | null
          rejection_reason: string | null
          scroll_percentage: number | null
          sent_at: string | null
          sent_by: string | null
          signature_device_info: Json | null
          signature_ip: unknown
          signature_user_agent: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_document_status"] | null
          updated_at: string | null
          viewed_at: string | null
          viewed_count: number | null
        }
        Insert: {
          acceptance_checkbox?: boolean | null
          application_id: string
          contract_number: string
          created_at?: string | null
          expired_at?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          pdf_hash?: string | null
          pdf_url?: string | null
          reading_time_seconds?: number | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scroll_percentage?: number | null
          sent_at?: string | null
          sent_by?: string | null
          signature_device_info?: Json | null
          signature_ip?: unknown
          signature_user_agent?: string | null
          signed_at?: string | null
          status?:
            | Database["public"]["Enums"]["contract_document_status"]
            | null
          updated_at?: string | null
          viewed_at?: string | null
          viewed_count?: number | null
        }
        Update: {
          acceptance_checkbox?: boolean | null
          application_id?: string
          contract_number?: string
          created_at?: string | null
          expired_at?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          pdf_hash?: string | null
          pdf_url?: string | null
          reading_time_seconds?: number | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scroll_percentage?: number | null
          sent_at?: string | null
          sent_by?: string | null
          signature_device_info?: Json | null
          signature_ip?: unknown
          signature_user_agent?: string | null
          signed_at?: string | null
          status?:
            | Database["public"]["Enums"]["contract_document_status"]
            | null
          updated_at?: string | null
          viewed_at?: string | null
          viewed_count?: number | null
        }
        Relationships: []
      }
      financing_contract_events: {
        Row: {
          contract_id: string
          created_at: string
          device_info: Json | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_status: Database["public"]["Enums"]["contract_status"] | null
          old_status: Database["public"]["Enums"]["contract_status"] | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          device_info?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["contract_status"] | null
          old_status?: Database["public"]["Enums"]["contract_status"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          device_info?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["contract_status"] | null
          old_status?: Database["public"]["Enums"]["contract_status"] | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "financing_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_contracts: {
        Row: {
          acceptance_button_clicked: boolean
          acceptance_checkbox: boolean
          acceptance_device_info: Json | null
          acceptance_ip_address: unknown
          acceptance_user_agent: string | null
          accepted_at: string | null
          application_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          contract_data: Json
          contract_number: string
          created_at: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          parent_contract_id: string | null
          pdf_generated_at: string | null
          pdf_hash: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          user_id: string
          version: number
          viewed_at: string | null
          viewed_count: number
        }
        Insert: {
          acceptance_button_clicked?: boolean
          acceptance_checkbox?: boolean
          acceptance_device_info?: Json | null
          acceptance_ip_address?: unknown
          acceptance_user_agent?: string | null
          accepted_at?: string | null
          application_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          contract_data?: Json
          contract_number: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          parent_contract_id?: string | null
          pdf_generated_at?: string | null
          pdf_hash?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          user_id: string
          version?: number
          viewed_at?: string | null
          viewed_count?: number
        }
        Update: {
          acceptance_button_clicked?: boolean
          acceptance_checkbox?: boolean
          acceptance_device_info?: Json | null
          acceptance_ip_address?: unknown
          acceptance_user_agent?: string | null
          accepted_at?: string | null
          application_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          contract_data?: Json
          contract_number?: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          parent_contract_id?: string | null
          pdf_generated_at?: string | null
          pdf_hash?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          user_id?: string
          version?: number
          viewed_at?: string | null
          viewed_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "financing_contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "financing_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_deposit_ledger: {
        Row: {
          amount: number
          application_id: string
          balance_after: number | null
          balance_before: number | null
          contract_id: string | null
          contract_version: number
          created_at: string
          credit_id: string | null
          deposit_key: string
          failure_code: string | null
          failure_reason: string | null
          id: string
          initiated_by: string | null
          initiated_by_role: string | null
          ledger_checksum: string | null
          ledger_entry_id: string | null
          max_retries: number | null
          next_retry_at: string | null
          processing_completed_at: string | null
          processing_duration_ms: number | null
          processing_started_at: string | null
          retry_count: number | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          application_id: string
          balance_after?: number | null
          balance_before?: number | null
          contract_id?: string | null
          contract_version?: number
          created_at?: string
          credit_id?: string | null
          deposit_key: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          initiated_by?: string | null
          initiated_by_role?: string | null
          ledger_checksum?: string | null
          ledger_entry_id?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string | null
          retry_count?: number | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string
          balance_after?: number | null
          balance_before?: number | null
          contract_id?: string | null
          contract_version?: number
          created_at?: string
          credit_id?: string | null
          deposit_key?: string
          failure_code?: string | null
          failure_reason?: string | null
          id?: string
          initiated_by?: string | null
          initiated_by_role?: string | null
          ledger_checksum?: string | null
          ledger_entry_id?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          processing_started_at?: string | null
          retry_count?: number | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_deposit_ledger_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "financing_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_email_logs: {
        Row: {
          application_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          queue_id: string | null
          recipient_email: string
          resend_id: string | null
          response_time_ms: number | null
          result: string
          status: string
          subject: string
        }
        Insert: {
          application_id: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          queue_id?: string | null
          recipient_email: string
          resend_id?: string | null
          response_time_ms?: number | null
          result: string
          status: string
          subject: string
        }
        Update: {
          application_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          queue_id?: string | null
          recipient_email?: string
          resend_id?: string | null
          response_time_ms?: number | null
          result?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_email_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "financing_email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_email_queue: {
        Row: {
          application_id: string
          application_number: string
          approved_amount: number | null
          attempts: number
          created_at: string
          email_template_id: string | null
          event_id: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          max_attempts: number
          next_retry_at: string | null
          priority: number
          processed_at: string | null
          queue_status: string
          recipient_email: string
          recipient_name: string
          resend_id: string | null
          response_data: Json | null
          sent_at: string | null
          status: string
        }
        Insert: {
          application_id: string
          application_number: string
          approved_amount?: number | null
          attempts?: number
          created_at?: string
          email_template_id?: string | null
          event_id?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          priority?: number
          processed_at?: string | null
          queue_status?: string
          recipient_email: string
          recipient_name: string
          resend_id?: string | null
          response_data?: Json | null
          sent_at?: string | null
          status: string
        }
        Update: {
          application_id?: string
          application_number?: string
          approved_amount?: number | null
          attempts?: number
          created_at?: string
          email_template_id?: string | null
          event_id?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string | null
          priority?: number
          processed_at?: string | null
          queue_status?: string
          recipient_email?: string
          recipient_name?: string
          resend_id?: string | null
          response_data?: Json | null
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      financing_offer_setup: {
        Row: {
          admin_notes: string | null
          application_id: string
          approved_amount: number
          first_installment_date: string | null
          full_name_from_id: string
          id: string
          installment_amount: number | null
          installments_count: number
          national_id_verified: boolean | null
          setup_at: string | null
          setup_by: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          application_id: string
          approved_amount: number
          first_installment_date?: string | null
          full_name_from_id: string
          id?: string
          installment_amount?: number | null
          installments_count?: number
          national_id_verified?: boolean | null
          setup_at?: string | null
          setup_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          application_id?: string
          approved_amount?: number
          first_installment_date?: string | null
          full_name_from_id?: string
          id?: string
          installment_amount?: number | null
          installments_count?: number
          national_id_verified?: boolean | null
          setup_at?: string | null
          setup_by?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
      financing_workflow_audit: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          actor_role: string
          application_id: string
          created_at: string | null
          device_info: Json | null
          entity_id: string | null
          entity_type: string
          event_type: string
          from_status: string | null
          id: string
          ip_address: unknown
          is_customer_visible: boolean | null
          new_data: Json | null
          old_data: Json | null
          reason: string | null
          to_status: string | null
          user_agent: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          actor_role: string
          application_id: string
          created_at?: string | null
          device_info?: Json | null
          entity_id?: string | null
          entity_type: string
          event_type: string
          from_status?: string | null
          id?: string
          ip_address?: unknown
          is_customer_visible?: boolean | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          to_status?: string | null
          user_agent?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string
          application_id?: string
          created_at?: string | null
          device_info?: Json | null
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          from_status?: string | null
          id?: string
          ip_address?: unknown
          is_customer_visible?: boolean | null
          new_data?: Json | null
          old_data?: Json | null
          reason?: string | null
          to_status?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      fraud_blacklists: {
        Row: {
          added_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          list_type: string
          reason: string | null
          reason_ar: string | null
          value_hash: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          list_type: string
          reason?: string | null
          reason_ar?: string | null
          value_hash: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          list_type?: string
          reason?: string | null
          reason_ar?: string | null
          value_hash?: string
        }
        Relationships: []
      }
      fraud_signals: {
        Row: {
          action_taken: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_confirmed: boolean | null
          metadata: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string | null
          severity: string
          signal_category: string
          signal_type: string
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_confirmed?: boolean | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          severity?: string
          signal_category: string
          signal_type: string
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_confirmed?: boolean | null
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string | null
          severity?: string
          signal_category?: string
          signal_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      identity_verification_records: {
        Row: {
          created_at: string
          device_fingerprint_id: string | null
          face_embedding_hash: string | null
          id: string
          id_document_hash: string | null
          match_results: Json | null
          national_id_hash: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          device_fingerprint_id?: string | null
          face_embedding_hash?: string | null
          id?: string
          id_document_hash?: string | null
          match_results?: Json | null
          national_id_hash: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          device_fingerprint_id?: string | null
          face_embedding_hash?: string | null
          id?: string
          id_document_hash?: string | null
          match_results?: Json | null
          national_id_hash?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verification_records_device_fingerprint_id_fkey"
            columns: ["device_fingerprint_id"]
            isOneToOne: false
            referencedRelation: "device_fingerprints"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_transfers: {
        Row: {
          amount: number
          application_id: string | null
          created_at: string
          destination_balance_after: number | null
          destination_balance_before: number | null
          destination_type: string
          device_info: Json | null
          error_message: string | null
          id: string
          idempotency_key: string
          ip_address: unknown
          processing_completed_at: string | null
          processing_started_at: string | null
          source_balance_after: number | null
          source_balance_before: number | null
          source_type: string
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          created_at?: string
          destination_balance_after?: number | null
          destination_balance_before?: number | null
          destination_type: string
          device_info?: Json | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          ip_address?: unknown
          processing_completed_at?: string | null
          processing_started_at?: string | null
          source_balance_after?: number | null
          source_balance_before?: number | null
          source_type: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          created_at?: string
          destination_balance_after?: number | null
          destination_balance_before?: number | null
          destination_type?: string
          device_info?: Json | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          ip_address?: unknown
          processing_completed_at?: string | null
          processing_started_at?: string | null
          source_balance_after?: number | null
          source_balance_before?: number | null
          source_type?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ios_device_tokens: {
        Row: {
          app_version: string | null
          created_at: string
          device_name: string | null
          device_token: string
          id: string
          is_active: boolean
          last_used_at: string | null
          os_version: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          device_token: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          os_version?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          device_token?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          os_version?: string | null
          updated_at?: string
          user_id?: string
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
          interview_date: string | null
          interview_location: string | null
          interview_type: string | null
          job_id: string | null
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          rating: number | null
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
          interview_date?: string | null
          interview_location?: string | null
          interview_type?: string | null
          job_id?: string | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
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
          interview_date?: string | null
          interview_location?: string | null
          interview_type?: string | null
          job_id?: string | null
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          rating?: number | null
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
      kyc_access_logs: {
        Row: {
          access_type: string
          accessed_by: string
          created_at: string
          document_path: string | null
          id: string
          ip_address: string | null
          kyc_verification_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by: string
          created_at?: string
          document_path?: string | null
          id?: string
          ip_address?: string | null
          kyc_verification_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          created_at?: string
          document_path?: string | null
          id?: string
          ip_address?: string | null
          kyc_verification_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      kyc_verifications: {
        Row: {
          admin_notes: string | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          ai_analysis: Json | null
          created_at: string
          document_back_url: string | null
          document_front_url: string | null
          document_type: string | null
          extracted_data: Json | null
          face_match_score: number | null
          failure_reasons: string[] | null
          id: string
          liveness_score: number | null
          national_id: string
          ocr_confidence: number | null
          rejection_reason: string | null
          selfie_url: string | null
          session_id: string
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_data: Json | null
        }
        Insert: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          ai_analysis?: Json | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          face_match_score?: number | null
          failure_reasons?: string[] | null
          id?: string
          liveness_score?: number | null
          national_id: string
          ocr_confidence?: number | null
          rejection_reason?: string | null
          selfie_url?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_data?: Json | null
        }
        Update: {
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          ai_analysis?: Json | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          face_match_score?: number | null
          failure_reasons?: string[] | null
          id?: string
          liveness_score?: number | null
          national_id?: string
          ocr_confidence?: number | null
          rejection_reason?: string | null
          selfie_url?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_data?: Json | null
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
          payment_method: string | null
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
          payment_method?: string | null
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
          payment_method?: string | null
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
          email_bounce_reason: string | null
          email_bounced: boolean | null
          email_bounced_at: string | null
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
          email_bounce_reason?: string | null
          email_bounced?: boolean | null
          email_bounced_at?: string | null
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
          email_bounce_reason?: string | null
          email_bounced?: boolean | null
          email_bounced_at?: string | null
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
      rate_limit_records: {
        Row: {
          action_type: string
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          identifier_type: string
          is_blocked: boolean | null
          request_count: number | null
          updated_at: string
          window_start: string
        }
        Insert: {
          action_type: string
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          identifier_type: string
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string
          window_start?: string
        }
        Update: {
          action_type?: string
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          identifier_type?: string
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      ready_websites: {
        Row: {
          category: string
          created_at: string
          delivery_days: number | null
          demo_url: string | null
          description: string | null
          description_ar: string | null
          display_order: number | null
          features: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          original_price: number | null
          preview_url: string | null
          price: number
          rating: number | null
          sales_count: number | null
          technologies: Json | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          delivery_days?: number | null
          demo_url?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          original_price?: number | null
          preview_url?: string | null
          price?: number
          rating?: number | null
          sales_count?: number | null
          technologies?: Json | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          delivery_days?: number | null
          demo_url?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          original_price?: number | null
          preview_url?: string | null
          price?: number
          rating?: number | null
          sales_count?: number | null
          technologies?: Json | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
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
      service_credit_reviews: {
        Row: {
          admin_notes: string | null
          attempted_action: string | null
          attempted_amount: number | null
          created_at: string
          credit_id: string
          description: string
          id: string
          metadata: Json | null
          resolution: string | null
          review_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          attempted_action?: string | null
          attempted_amount?: number | null
          created_at?: string
          credit_id: string
          description: string
          id?: string
          metadata?: Json | null
          resolution?: string | null
          review_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          attempted_action?: string | null
          attempted_amount?: number | null
          created_at?: string
          credit_id?: string
          description?: string
          id?: string
          metadata?: Json | null
          resolution?: string | null
          review_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_credit_reviews_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "service_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      service_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          created_by: string | null
          credit_id: string
          description: string | null
          description_ar: string | null
          device_info: Json | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          order_id: string | null
          reference_id: string | null
          reference_type: string | null
          service_id: string | null
          service_name: string | null
          status: string
          transaction_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          created_by?: string | null
          credit_id: string
          description?: string | null
          description_ar?: string | null
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          order_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          service_id?: string | null
          service_name?: string | null
          status?: string
          transaction_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          created_by?: string | null
          credit_id?: string
          description?: string | null
          description_ar?: string | null
          device_info?: Json | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          order_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          service_id?: string | null
          service_name?: string | null
          status?: string
          transaction_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_credit_transactions_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "service_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_credit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_credit_transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_credits: {
        Row: {
          application_id: string | null
          available_balance: number | null
          contract_id: string | null
          created_at: string
          expires_at: string | null
          freeze_reason: string | null
          id: string
          is_active: boolean
          is_frozen: boolean
          source_reference_id: string | null
          source_type: string
          total_credited: number
          total_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          available_balance?: number | null
          contract_id?: string | null
          created_at?: string
          expires_at?: string | null
          freeze_reason?: string | null
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          source_reference_id?: string | null
          source_type?: string
          total_credited?: number
          total_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          available_balance?: number | null
          contract_id?: string | null
          created_at?: string
          expires_at?: string | null
          freeze_reason?: string | null
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          source_reference_id?: string | null
          source_type?: string
          total_credited?: number
          total_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_credits_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "financing_contracts"
            referencedColumns: ["id"]
          },
        ]
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
          external_id: string | null
          id: string
          idempotency_key: string | null
          message: string
          phone: string
          provider: string | null
          reference_id: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          idempotency_key?: string | null
          message: string
          phone: string
          provider?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          idempotency_key?: string | null
          message?: string
          phone?: string
          provider?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          message_template: string
          name_ar: string
          template_key: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          message_template: string
          name_ar: string
          template_key: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          message_template?: string
          name_ar?: string
          template_key?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      sms_verifications: {
        Row: {
          attempts_count: number
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          status: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
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
          created_at: string | null
          id: string
          total_deposited: number
          total_spent: number
          updated_at: string
          user_id: string
          wallet_account_number: string | null
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id: string
          wallet_account_number?: string | null
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
          wallet_account_number?: string | null
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
      verification_audit_logs: {
        Row: {
          attempt_number: number
          completed_at: string | null
          created_at: string
          device_fingerprint: string | null
          duration_ms: number | null
          fraud_signals: Json | null
          geo_city: string | null
          geo_country: string | null
          id: string
          input_hash: string | null
          ip_address: string | null
          is_suspicious: boolean | null
          metadata: Json | null
          result_code: string | null
          result_message: string | null
          session_id: string
          started_at: string
          status: string
          user_agent: string | null
          user_id: string | null
          verification_target: string | null
          verification_type: string
        }
        Insert: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          device_fingerprint?: string | null
          duration_ms?: number | null
          fraud_signals?: Json | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          input_hash?: string | null
          ip_address?: string | null
          is_suspicious?: boolean | null
          metadata?: Json | null
          result_code?: string | null
          result_message?: string | null
          session_id: string
          started_at?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
          verification_target?: string | null
          verification_type: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          created_at?: string
          device_fingerprint?: string | null
          duration_ms?: number | null
          fraud_signals?: Json | null
          geo_city?: string | null
          geo_country?: string | null
          id?: string
          input_hash?: string | null
          ip_address?: string | null
          is_suspicious?: boolean | null
          metadata?: Json | null
          result_code?: string | null
          result_message?: string | null
          session_id?: string
          started_at?: string
          status?: string
          user_agent?: string | null
          user_id?: string | null
          verification_target?: string | null
          verification_type?: string
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
      whatsapp_verifications: {
        Row: {
          attempts_count: number
          created_at: string
          expires_at: string
          id: string
          otp_hash: string
          phone: string
          status: string
          updated_at: string
          user_id: string | null
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_hash: string
          phone: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_refund_cloud_order: { Args: { p_order_id: string }; Returns: Json }
      atomic_credit_deposit: {
        Args: {
          p_actor_id?: string
          p_actor_role?: string
          p_application_id: string
        }
        Returns: Json
      }
      calculate_service_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      can_admin_action: {
        Args: { _action: string; _user_id: string }
        Returns: boolean
      }
      can_execute_internal_transfer: {
        Args: { p_application_id?: string; p_user_id: string }
        Returns: Json
      }
      check_email_rate_limit: {
        Args: {
          p_email: string
          p_max_per_day?: number
          p_max_per_hour?: number
        }
        Returns: boolean
      }
      check_transfer_rate_limit: {
        Args: {
          p_max_transfers?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: Json
      }
      cleanup_email_rate_limits: { Args: never; Returns: undefined }
      cloud_effective_rate: { Args: never; Returns: number }
      create_contract_new_version: {
        Args: {
          p_new_contract_data?: Json
          p_original_contract_id: string
          p_reason?: string
        }
        Returns: string
      }
      deduct_service_credit: {
        Args: {
          p_amount: number
          p_ip_address?: unknown
          p_order_id: string
          p_service_id: string
          p_service_name: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      execute_internal_transfer: {
        Args: {
          p_amount: number
          p_application_id: string
          p_device_info?: Json
          p_idempotency_key: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      freeze_service_credit: {
        Args: { p_admin_id: string; p_credit_id: string; p_reason: string }
        Returns: boolean
      }
      get_cloud_plan_traffic: {
        Args: never
        Returns: {
          extra_traffic_sar_per_tb: number
          included_traffic_tb: number
          location_code: string
          plan_id: string
        }[]
      }
      get_public_stats: { Args: never; Returns: Json }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_email_rate_limit: {
        Args: { p_email: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      order_cloud_server: {
        Args: {
          p_backups: boolean
          p_hostname: string
          p_idempotency_key: string
          p_image: string
          p_ipv4?: boolean
          p_location: string
          p_name: string
          p_plan_id: string
          p_ssh_key_id: string
        }
        Returns: Json
      }
      reconcile_credit_deposits: {
        Args: never
        Returns: {
          application_id: string
          application_number: string
          deposit_status: string
          discrepancy_type: string
          expected_amount: number
          ledger_balance: number
          recommended_action: string
        }[]
      }
      retry_failed_deposits: {
        Args: never
        Returns: {
          application_id: string
          result: Json
        }[]
      }
      update_overdue_installments: { Args: never; Returns: undefined }
      withdraw_cashback:
        | { Args: { p_amount: number }; Returns: Json }
        | { Args: { p_amount: number; p_user_id: string }; Returns: Json }
    }
    Enums: {
      acknowledgment_status: "NOT_SENT" | "SENT" | "VIEWED" | "SIGNED"
      app_role: "admin" | "user" | "client"
      contract_document_status:
        | "NOT_SENT"
        | "SENT"
        | "VIEWED"
        | "SIGNING_OTP_SENT"
        | "SIGNED"
        | "FINALIZED"
        | "EXPIRED"
        | "REJECTED"
      contract_status: "draft" | "presented" | "accepted" | "finalized"
      executive_bond_status:
        | "NOT_ISSUED"
        | "ISSUING"
        | "ISSUED"
        | "SENT_TO_CLIENT"
        | "SIGNED_BY_CLIENT"
        | "VERIFIED_BY_ADMIN"
        | "SENT"
        | "SIGNED"
      financing_application_status:
        | "DRAFT"
        | "REQUEST_SUBMITTED"
        | "UNDER_REVIEW"
        | "INFO_REQUIRED"
        | "ADMIN_SETUP"
        | "OFFER_READY"
        | "CONTRACT_PHASE"
        | "ACK_PHASE"
        | "BOND_PHASE"
        | "CREDIT_PENDING"
        | "CREDIT_ACTIVE"
        | "IN_USE"
        | "COMPLETED"
        | "DECLINED"
        | "CANCELLED"
        | "EXPIRED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      acknowledgment_status: ["NOT_SENT", "SENT", "VIEWED", "SIGNED"],
      app_role: ["admin", "user", "client"],
      contract_document_status: [
        "NOT_SENT",
        "SENT",
        "VIEWED",
        "SIGNING_OTP_SENT",
        "SIGNED",
        "FINALIZED",
        "EXPIRED",
        "REJECTED",
      ],
      contract_status: ["draft", "presented", "accepted", "finalized"],
      executive_bond_status: [
        "NOT_ISSUED",
        "ISSUING",
        "ISSUED",
        "SENT_TO_CLIENT",
        "SIGNED_BY_CLIENT",
        "VERIFIED_BY_ADMIN",
        "SENT",
        "SIGNED",
      ],
      financing_application_status: [
        "DRAFT",
        "REQUEST_SUBMITTED",
        "UNDER_REVIEW",
        "INFO_REQUIRED",
        "ADMIN_SETUP",
        "OFFER_READY",
        "CONTRACT_PHASE",
        "ACK_PHASE",
        "BOND_PHASE",
        "CREDIT_PENDING",
        "CREDIT_ACTIVE",
        "IN_USE",
        "COMPLETED",
        "DECLINED",
        "CANCELLED",
        "EXPIRED",
      ],
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
