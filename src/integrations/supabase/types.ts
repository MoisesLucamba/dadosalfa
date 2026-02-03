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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      country_risk: {
        Row: {
          country: string
          created_at: string
          data_date: string
          id: string
          score: number
          trend: string | null
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          data_date?: string
          id?: string
          score: number
          trend?: string | null
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          data_date?: string
          id?: string
          score?: number
          trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      data_updates: {
        Row: {
          created_at: string
          data_type: string
          id: string
          notes: string | null
          records_updated: number | null
          source: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data_type: string
          id?: string
          notes?: string | null
          records_updated?: number | null
          source: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data_type?: string
          id?: string
          notes?: string | null
          records_updated?: number | null
          source?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          notification_type: string
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      export_data: {
        Row: {
          arrival_date: string | null
          created_at: string
          data_date: string
          departure_date: string | null
          destination: string
          id: string
          status: string | null
          tanker_name: string | null
          updated_at: string
          value_usd: number | null
          volume: number
        }
        Insert: {
          arrival_date?: string | null
          created_at?: string
          data_date?: string
          departure_date?: string | null
          destination: string
          id?: string
          status?: string | null
          tanker_name?: string | null
          updated_at?: string
          value_usd?: number | null
          volume: number
        }
        Update: {
          arrival_date?: string | null
          created_at?: string
          data_date?: string
          departure_date?: string | null
          destination?: string
          id?: string
          status?: string | null
          tanker_name?: string | null
          updated_at?: string
          value_usd?: number | null
          volume?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_global: boolean | null
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean | null
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          contact_email: string
          contact_phone: string | null
          country: string
          created_at: string
          email_domain: string
          id: string
          is_approved: boolean
          name: string
          nif: string
          sector: string
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          country?: string
          created_at?: string
          email_domain: string
          id?: string
          is_approved?: boolean
          name: string
          nif: string
          sector: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          country?: string
          created_at?: string
          email_domain?: string
          id?: string
          is_approved?: boolean
          name?: string
          nif?: string
          sector?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      predefined_companies: {
        Row: {
          contact_email: string | null
          contact_info: string | null
          country: string
          created_at: string
          email_domain: string
          id: string
          name: string
          sector: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_info?: string | null
          country?: string
          created_at?: string
          email_domain: string
          id?: string
          name: string
          sector: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_info?: string | null
          country?: string
          created_at?: string
          email_domain?: string
          id?: string
          name?: string
          sector?: string
          website?: string | null
        }
        Relationships: []
      }
      price_data: {
        Row: {
          change_percent: number | null
          created_at: string
          crude_type: string
          data_date: string
          id: string
          price: number
          updated_at: string
          volume: number | null
        }
        Insert: {
          change_percent?: number | null
          created_at?: string
          crude_type: string
          data_date?: string
          id?: string
          price: number
          updated_at?: string
          volume?: number | null
        }
        Update: {
          change_percent?: number | null
          created_at?: string
          crude_type?: string
          data_date?: string
          id?: string
          price?: number
          updated_at?: string
          volume?: number | null
        }
        Relationships: []
      }
      production_data: {
        Row: {
          block: string
          created_at: string
          daily_production: number
          data_date: string
          decline_rate: number | null
          field: string | null
          id: string
          monthly_production: number
          operator: string
          status: string | null
          updated_at: string
        }
        Insert: {
          block: string
          created_at?: string
          daily_production?: number
          data_date?: string
          decline_rate?: number | null
          field?: string | null
          id?: string
          monthly_production?: number
          operator: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          block?: string
          created_at?: string
          daily_production?: number
          data_date?: string
          decline_rate?: number | null
          field?: string | null
          id?: string
          monthly_production?: number
          operator?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_nda: boolean
          accepted_terms: boolean
          account_type: string
          company_name: string
          company_type: Database["public"]["Enums"]["company_type"]
          contact_name: string
          contact_phone: string | null
          contact_role: string
          country: string
          created_at: string
          id: string
          is_approved: boolean
          job_title: string | null
          nif: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_nda?: boolean
          accepted_terms?: boolean
          account_type?: string
          company_name: string
          company_type: Database["public"]["Enums"]["company_type"]
          contact_name: string
          contact_phone?: string | null
          contact_role: string
          country?: string
          created_at?: string
          id: string
          is_approved?: boolean
          job_title?: string | null
          nif: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_nda?: boolean
          accepted_terms?: boolean
          account_type?: string
          company_name?: string
          company_type?: Database["public"]["Enums"]["company_type"]
          contact_name?: string
          contact_phone?: string | null
          contact_role?: string
          country?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          job_title?: string | null
          nif?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          impact_level: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          impact_level?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          impact_level?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_downloads: {
        Row: {
          downloaded_at: string
          id: string
          report_id: string | null
          user_id: string | null
        }
        Insert: {
          downloaded_at?: string
          id?: string
          report_id?: string | null
          user_id?: string | null
        }
        Update: {
          downloaded_at?: string
          id?: string
          report_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_downloads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_generated: boolean | null
          content: Json | null
          created_at: string
          download_count: number | null
          file_url: string | null
          id: string
          pages: number | null
          period: string | null
          status: string
          summary: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          content?: Json | null
          created_at?: string
          download_count?: number | null
          file_url?: string | null
          id?: string
          pages?: number | null
          period?: string | null
          status?: string
          summary?: string | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          content?: Json | null
          created_at?: string
          download_count?: number | null
          file_url?: string | null
          id?: string
          pages?: number | null
          period?: string | null
          status?: string
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      risk_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          impact: string | null
          is_active: boolean | null
          region: string | null
          title: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          impact?: string | null
          is_active?: boolean | null
          region?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          impact?: string | null
          is_active?: boolean | null
          region?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      risk_data: {
        Row: {
          category: string
          created_at: string
          data_date: string
          description: string | null
          id: string
          score: number
          source: string | null
          trend: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          data_date?: string
          description?: string | null
          id?: string
          score: number
          source?: string | null
          trend?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          data_date?: string
          description?: string | null
          id?: string
          score?: number
          source?: string | null
          trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          next_run: string | null
          recipients: number | null
          report_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          name: string
          next_run?: string | null
          recipients?: number | null
          report_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          next_run?: string | null
          recipients?: number | null
          report_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_activity_metrics: {
        Row: {
          action_count: number | null
          action_type: string
          created_at: string | null
          date: string | null
          id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          action_count?: number | null
          action_type: string
          created_at?: string | null
          date?: string | null
          id?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          action_count?: number | null
          action_type?: string
          created_at?: string | null
          date?: string | null
          id?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_enabled: boolean | null
          notify_app: boolean | null
          notify_email: boolean | null
          threshold_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          notify_app?: boolean | null
          notify_email?: boolean | null
          threshold_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          notify_app?: boolean | null
          notify_email?: boolean | null
          threshold_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string | null
          id: string
          last_seen_at: string | null
          session_count: number | null
          status: string | null
          total_session_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          session_count?: number | null
          status?: string | null
          total_session_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          session_count?: number | null
          status?: string | null
          total_session_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_requests: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          responded_by: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          responded_by?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          responded_by?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          is_super_admin: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          is_super_admin?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          is_super_admin?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_activity: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_reports: {
        Row: {
          id: string
          report_id: string
          shared_at: string
          shared_by: string
          workspace_id: string
        }
        Insert: {
          id?: string
          report_id: string
          shared_at?: string
          shared_by: string
          workspace_id: string
        }
        Update: {
          id?: string
          report_id?: string
          shared_at?: string
          shared_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      demote_from_admin: { Args: { _target_user_id: string }; Returns: boolean }
      demote_from_super_admin: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      promote_to_admin: { Args: { _target_user_id: string }; Returns: boolean }
      promote_to_super_admin: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analista" | "viewer"
      company_type:
        | "operadora"
        | "banco"
        | "trader"
        | "consultora"
        | "governo"
        | "prestadora_servicos"
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
      app_role: ["admin", "analista", "viewer"],
      company_type: [
        "operadora",
        "banco",
        "trader",
        "consultora",
        "governo",
        "prestadora_servicos",
      ],
    },
  },
} as const
