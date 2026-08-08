export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          intent: string | null;
          metadata: Json;
          role: string;
          session_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          intent?: string | null;
          metadata?: Json;
          role: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          intent?: string | null;
          metadata?: Json;
          role?: string;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_user_fkey";
            columns: ["session_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dose_events: {
        Row: {
          created_at: string;
          id: string;
          medication_id: string;
          notes: string | null;
          scheduled_for: string;
          snoozed_until: string | null;
          source: string;
          status: string;
          taken_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          medication_id: string;
          notes?: string | null;
          scheduled_for: string;
          snoozed_until?: string | null;
          source?: string;
          status: string;
          taken_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          medication_id?: string;
          notes?: string | null;
          scheduled_for?: string;
          snoozed_until?: string | null;
          source?: string;
          status?: string;
          taken_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dose_events_medication_user_fkey";
            columns: ["medication_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "medications";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      medication_schedules: {
        Row: {
          created_at: string;
          dose_time: string;
          id: string;
          medication_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dose_time: string;
          id?: string;
          medication_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dose_time?: string;
          id?: string;
          medication_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medication_schedules_medication_user_fkey";
            columns: ["medication_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "medications";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      medications: {
        Row: {
          color_token: string;
          created_at: string;
          dosage: string;
          end_date: string | null;
          first_dose_time: string;
          id: string;
          instructions: string | null;
          interval_hours: number;
          is_active: boolean;
          name: string;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color_token?: string;
          created_at?: string;
          dosage: string;
          end_date?: string | null;
          first_dose_time: string;
          id?: string;
          instructions?: string | null;
          interval_hours: number;
          is_active?: boolean;
          name: string;
          start_date?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color_token?: string;
          created_at?: string;
          dosage?: string;
          end_date?: string | null;
          first_dose_time?: string;
          id?: string;
          instructions?: string | null;
          interval_hours?: number;
          is_active?: boolean;
          name?: string;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "medications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          onboarding_completed: boolean;
          preferred_name: string | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          onboarding_completed?: boolean;
          preferred_name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          onboarding_completed?: boolean;
          preferred_name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_medication_with_schedules: {
        Args: {
          p_color_token: string;
          p_dosage: string;
          p_dose_times: string[];
          p_end_date: string;
          p_first_dose_time: string;
          p_instructions: string;
          p_interval_hours: number;
          p_name: string;
          p_start_date: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];
type PublicTableName = keyof PublicSchema["Tables"];

export type Tables<Name extends PublicTableName> =
  PublicSchema["Tables"][Name]["Row"];

export type TablesInsert<Name extends PublicTableName> =
  PublicSchema["Tables"][Name]["Insert"];

export type TablesUpdate<Name extends PublicTableName> =
  PublicSchema["Tables"][Name]["Update"];
