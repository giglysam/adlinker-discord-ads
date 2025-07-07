export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_clicks: {
        Row: {
          ad_id: string
          clicked_at: string
          created_at: string
          earning_amount: number | null
          id: string
          user_ip: unknown
          webhook_id: string
        }
        Insert: {
          ad_id: string
          clicked_at?: string
          created_at?: string
          earning_amount?: number | null
          id?: string
          user_ip: unknown
          webhook_id: string
        }
        Update: {
          ad_id?: string
          clicked_at?: string
          created_at?: string
          earning_amount?: number | null
          id?: string
          user_ip?: unknown
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_deliveries: {
        Row: {
          ad_id: string | null
          created_at: string | null
          earning_amount: number | null
          error_message: string | null
          id: string
          status: string
          webhook_id: string | null
        }
        Insert: {
          ad_id?: string | null
          created_at?: string | null
          earning_amount?: number | null
          error_message?: string | null
          id?: string
          status: string
          webhook_id?: string | null
        }
        Update: {
          ad_id?: string | null
          created_at?: string | null
          earning_amount?: number | null
          error_message?: string | null
          id?: string
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_deliveries_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          created_at: string
          duration_hours: number | null
          expires_at: string | null
          id: string
          image_url: string | null
          impressions: number | null
          status: string
          text: string
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          status?: string
          text: string
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          status?: string
          text?: string
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cashout_requests: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          balance: number | null
          created_at: string
          email: string
          id: string
          password_hash: string
          role: string
          updated_at: string
          username: string
          webhook_notice: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string
          email: string
          id?: string
          password_hash: string
          role: string
          updated_at?: string
          username: string
          webhook_notice?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
          webhook_notice?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          ad_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          response_status: number | null
          status: string
          webhook_id: string | null
        }
        Insert: {
          ad_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          response_status?: number | null
          status: string
          webhook_id?: string | null
        }
        Update: {
          ad_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          response_status?: number | null
          status?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_error: string | null
          last_sent_at: string | null
          last_success_at: string | null
          server_name: string
          total_errors: number | null
          total_sent: number | null
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_sent_at?: string | null
          last_success_at?: string | null
          server_name: string
          total_errors?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_sent_at?: string | null
          last_success_at?: string | null
          server_name?: string
          total_errors?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_ad_click: {
        Args: { p_ad_id: string; p_webhook_id: string; p_user_ip: unknown }
        Returns: Json
      }
      increment_user_balance: {
        Args: { user_id: string; amount: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
