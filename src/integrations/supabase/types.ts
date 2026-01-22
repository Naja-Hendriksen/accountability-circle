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
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      application_notes: {
        Row: {
          admin_user_id: string
          application_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          admin_user_id: string
          application_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_user_id?: string
          application_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          agreed_to_guidelines: boolean
          availability: string
          commitment_explanation: string
          commitment_level: number
          created_at: string
          digital_product: string
          email: string
          excitement: string
          first_name: string
          gdpr_consent: boolean
          growth_goal: string
          id: string
          last_name: string
          location: string
          status: string
          updated_at: string
        }
        Insert: {
          agreed_to_guidelines?: boolean
          availability: string
          commitment_explanation: string
          commitment_level: number
          created_at?: string
          digital_product: string
          email: string
          excitement: string
          first_name?: string
          gdpr_consent?: boolean
          growth_goal: string
          id?: string
          last_name?: string
          location: string
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_to_guidelines?: boolean
          availability?: string
          commitment_explanation?: string
          commitment_level?: number
          created_at?: string
          digital_product?: string
          email?: string
          excitement?: string
          first_name?: string
          gdpr_consent?: boolean
          growth_goal?: string
          id?: string
          last_name?: string
          location?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          target_id: string
          target_table: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id: string
          target_table: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string
          target_table?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      digest_queue: {
        Row: {
          author_name: string
          created_at: string
          group_id: string
          id: string
          question_content: string
          question_id: string
        }
        Insert: {
          author_name: string
          created_at?: string
          group_id: string
          id?: string
          question_content: string
          question_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          group_id?: string
          id?: string
          question_content?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digest_queue_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digest_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "group_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_clicks: {
        Row: {
          clicked_at: string
          email_history_id: string
          id: string
          url: string
        }
        Insert: {
          clicked_at?: string
          email_history_id: string
          id?: string
          url: string
        }
        Update: {
          clicked_at?: string
          email_history_id?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_clicks_email_history_id_fkey"
            columns: ["email_history_id"]
            isOneToOne: false
            referencedRelation: "email_history"
            referencedColumns: ["id"]
          },
        ]
      }
      email_history: {
        Row: {
          application_id: string | null
          click_count: number
          error_message: string | null
          id: string
          open_count: number
          opened_at: string | null
          recipient_email: string
          recipient_name: string
          sent_at: string
          sent_by: string | null
          status: string
          subject: string
          template_key: string
        }
        Insert: {
          application_id?: string | null
          click_count?: number
          error_message?: string | null
          id?: string
          open_count?: number
          opened_at?: string | null
          recipient_email: string
          recipient_name: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject: string
          template_key: string
        }
        Update: {
          application_id?: string | null
          click_count?: number
          error_message?: string | null
          id?: string
          open_count?: number
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string
          sent_at?: string
          sent_by?: string | null
          status?: string
          subject?: string
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_content: string
          id: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_content: string
          id?: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          html_content?: string
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_answers: {
        Row: {
          content: string
          created_at: string
          id: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "group_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_questions: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_questions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_reactions: {
        Row: {
          answer_id: string | null
          created_at: string
          id: string
          question_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          answer_id?: string | null
          created_at?: string
          id?: string
          question_id?: string | null
          reaction_type?: string
          user_id: string
        }
        Update: {
          answer_id?: string | null
          created_at?: string
          id?: string
          question_id?: string | null
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_reactions_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "group_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_reactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "group_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      mini_moves: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
          weekly_entry_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
          weekly_entry_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          weekly_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mini_moves_weekly_entry_id_fkey"
            columns: ["weekly_entry_id"]
            isOneToOne: false
            referencedRelation: "weekly_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          growth_goal: string | null
          id: string
          monthly_milestones: string | null
          name: string
          notification_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          growth_goal?: string | null
          id?: string
          monthly_milestones?: string | null
          name?: string
          notification_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          growth_goal?: string | null
          id?: string
          monthly_milestones?: string | null
          name?: string
          notification_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      weekly_entries: {
        Row: {
          created_at: string
          id: string
          obstacles: string | null
          self_care: string | null
          updated_at: string
          user_id: string
          week_start: string
          wins: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          obstacles?: string | null
          self_care?: string | null
          updated_at?: string
          user_id: string
          week_start: string
          wins?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          obstacles?: string | null
          self_care?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
          wins?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_application_approval: {
        Args: { check_email: string }
        Returns: {
          applicant_first_name: string
          applicant_last_name: string
          is_approved: boolean
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_in_same_group: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
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
