/**
 * Tipos de la base de datos, escritos a mano para reflejar
 * supabase/migrations/0001_init.sql.
 *
 * Cuando el proyecto esté conectado a un Supabase real, estos tipos pueden
 * regenerarse automáticamente con:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 */

export type ProjectStatus = "preparation" | "active" | "closed";
export type ParticipationStatus =
  | "undefined"
  | "purchased"
  | "not_participating"
  | "scholarship";
export type PhotoStatus =
  | "pending"
  | "photographed"
  | "absent"
  | "replacement_pending"
  | "replacement_completed";
export type GownSize = "S" | "M" | "L" | "XL" | "XXL";
export type PaymentMethod = "cash" | "yappy";
export type PaymentStatus = "pending_reconciliation" | "confirmed" | "rejected";
export type ReplacementStatus = "pending" | "completed";
export type ContributionConcept = "club_padres" | "ninth_grade_fund";
export type DisbursementMethod = "cash" | "transfer" | "yappy" | "other";
export type WhatsappTemplateKey =
  | "balance_due"
  | "payment_confirmation"
  | "session_info"
  | "replacement"
  | "custom";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; role: string; created_at: string };
        Insert: { id: string; full_name?: string | null; role?: string };
        Update: { full_name?: string | null; role?: string };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          school_name: string;
          year: number;
          status: ProjectStatus;
          start_date: string;
          end_date: string | null;
          yappy_number: string | null;
          club_padres_rate: number;
          ninth_grade_contribution: number;
          installment_2_date: string | null;
          installment_3_date: string | null;
          final_due_date: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          name: string;
          school_name: string;
          year: number;
          start_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          is_ninth_grade: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["grades"]["Row"]> & {
          project_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["grades"]["Row"]>;
        Relationships: [];
      };
      classrooms: {
        Row: {
          id: string;
          project_id: string;
          grade_id: string;
          name: string;
          photo_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["classrooms"]["Row"]> & {
          project_id: string;
          grade_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["classrooms"]["Row"]>;
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          price: number;
          description: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["packages"]["Row"]> & {
          project_id: string;
          name: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["packages"]["Row"]>;
        Relationships: [];
      };
      package_grades: {
        Row: { package_id: string; grade_id: string };
        Insert: { package_id: string; grade_id: string };
        Update: { package_id?: string; grade_id?: string };
        Relationships: [];
      };
      extras: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          price: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["extras"]["Row"]> & {
          project_id: string;
          name: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["extras"]["Row"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          project_id: string;
          grade_id: string;
          classroom_id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          track: string | null;
          gown_size: GownSize | null;
          package_id: string | null;
          participation_status: ParticipationStatus;
          photo_status: PhotoStatus;
          photo_date: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          project_id: string;
          grade_id: string;
          classroom_id: string;
          first_name: string;
          last_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Relationships: [];
      };
      student_extras: {
        Row: {
          id: string;
          student_id: string;
          extra_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["student_extras"]["Row"]> & {
          student_id: string;
          extra_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["student_extras"]["Row"]>;
        Relationships: [];
      };
      payment_movements: {
        Row: {
          id: string;
          project_id: string;
          student_id: string;
          amount: number;
          payment_date: string;
          method: PaymentMethod;
          reference: string | null;
          status: PaymentStatus;
          rejection_reason: string | null;
          observation: string | null;
          reversal_of_id: string | null;
          reconciled_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_movements"]["Row"]> & {
          project_id: string;
          student_id: string;
          amount: number;
          method: PaymentMethod;
          status: PaymentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["payment_movements"]["Row"]>;
        Relationships: [];
      };
      replacements: {
        Row: {
          id: string;
          project_id: string;
          student_id: string;
          original_date: string;
          new_date: string | null;
          status: ReplacementStatus;
          observation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["replacements"]["Row"]> & {
          project_id: string;
          student_id: string;
          original_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["replacements"]["Row"]>;
        Relationships: [];
      };
      school_disbursements: {
        Row: {
          id: string;
          project_id: string;
          concept: ContributionConcept;
          amount: number;
          disbursement_date: string;
          method: DisbursementMethod;
          reference: string | null;
          observation: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["school_disbursements"]["Row"]> & {
          project_id: string;
          concept: ContributionConcept;
          amount: number;
          method: DisbursementMethod;
        };
        Update: Partial<Database["public"]["Tables"]["school_disbursements"]["Row"]>;
        Relationships: [];
      };
      whatsapp_templates: {
        Row: {
          id: string;
          project_id: string | null;
          key: WhatsappTemplateKey;
          name: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["whatsapp_templates"]["Row"]> & {
          key: WhatsappTemplateKey;
          name: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_templates"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
