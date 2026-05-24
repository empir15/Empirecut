/**
 * EmpireCut — Supabase Database Types
 * Reflète exactement le schéma PostgreSQL.
 *
 * NOTE: Ces types sont utilisés par createClient<Database>() pour typer
 * les requêtes Supabase. La structure doit suivre exactement le format
 * attendu par @supabase/supabase-js v2.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          thumbnail_url: string | null;
          duration: number | null;
          status: string;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          status?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          status?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clips: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          duration: number | null;
          start_trim: number;
          end_trim: number | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          duration?: number | null;
          start_trim?: number;
          end_trim?: number | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          storage_path?: string;
          duration?: number | null;
          start_trim?: number;
          end_trim?: number | null;
          position?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Helpers de types raccourcis
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type ClipRow = Database['public']['Tables']['clips']['Row'];
