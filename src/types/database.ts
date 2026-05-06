/**
 * Database types.
 * Auto-generate this file with: `pnpm db:types`
 * (Requires Supabase CLI and SUPABASE_PROJECT_ID env var)
 *
 * Until generated, this file holds hand-written types matching the migration.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          credits_available: number;
          credits_reserved: number;
          total_credits_purchased: number;
          total_credits_used: number;
          plan_type: "free" | "light" | "pro" | "business";
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      packages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          kind: "one_time" | "subscription";
          credits: number;
          price_brl: number;
          is_featured: boolean;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["packages"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["packages"]["Row"]>;
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: "purchase" | "consumption" | "reservation" | "release" | "refund" | "bonus" | "manual_adjust";
          amount: number;
          balance_after: number;
          description: string | null;
          reference_id: string | null;
          reference_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["credit_transactions"]["Row"]>;
      };
      image_jobs: {
        Row: {
          id: string;
          user_id: string;
          original_filename: string | null;
          original_url: string;
          original_size_bytes: number | null;
          original_width: number | null;
          original_height: number | null;
          target_resolution_tier: string;
          credits_planned: number;
          credits_consumed: number | null;
          result_url: string | null;
          result_width: number | null;
          result_height: number | null;
          processing_time_ms: number | null;
          status: "pending" | "processing" | "completed" | "failed" | "canceled";
          external_job_id: string | null;
          error_message: string | null;
          error_code: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["image_jobs"]["Row"],
          "id" | "created_at" | "updated_at" | "expires_at"
        > & { expires_at?: string };
        Update: Partial<Database["public"]["Tables"]["image_jobs"]["Row"]>;
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          mp_status: string | null;
          package_id: string;
          package_name: string;
          credits_purchased: number;
          amount_brl: number;
          payment_method: string | null;
          status: "pending" | "approved" | "rejected" | "refunded" | "canceled";
          credited_at: string | null;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Row"]>;
      };
    };
    Functions: {
      reserve_credits: { Args: { p_user_id: string; p_amount: number; p_job_id: string }; Returns: boolean };
      commit_credits:  { Args: { p_user_id: string; p_amount: number; p_job_id: string }; Returns: void };
      release_credits: { Args: { p_user_id: string; p_amount: number; p_job_id: string; p_reason?: string }; Returns: void };
      add_credits_from_payment: { Args: { p_user_id: string; p_amount: number; p_payment_id: string; p_description: string }; Returns: void };
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ImageJob = Database["public"]["Tables"]["image_jobs"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type CreditTransaction = Database["public"]["Tables"]["credit_transactions"]["Row"];
