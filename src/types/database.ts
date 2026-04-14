export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          logo_url: string | null
          plan: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          logo_url?: string | null
          plan?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          logo_url?: string | null
          plan?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: string
          name?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          organization_id: string
          name: string
          phone: string
          instance_name: string
          status: 'connected' | 'disconnected' | 'connecting'
          api_provider: 'evolution' | 'whatsmeow'
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          phone: string
          instance_name: string
          status?: 'connected' | 'disconnected' | 'connecting'
          api_provider?: 'evolution' | 'whatsmeow'
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          phone?: string
          instance_name?: string
          status?: 'connected' | 'disconnected' | 'connecting'
          api_provider?: 'evolution' | 'whatsmeow'
          created_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          organization_id: string
          stage: string
          company: string
          value: number
          consultant_id: string
          consultant_name: string
          consultant_initials: string
          days_in_stage: number
          followup_status: string
          checklist: Json | null
          color: string
          info: string | null
          info_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          stage: string
          company: string
          value: number
          consultant_id: string
          consultant_name: string
          consultant_initials: string
          days_in_stage?: number
          followup_status: string
          checklist?: Json | null
          color: string
          info?: string | null
          info_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stage?: string
          company?: string
          value?: number
          consultant_id?: string
          consultant_name?: string
          consultant_initials?: string
          days_in_stage?: number
          followup_status?: string
          checklist?: Json | null
          color?: string
          info?: string | null
          info_type?: string | null
          created_at?: string
        }
      }
      // Add other tables as needed for types
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org: {
        Args: Record<PropertyKey, never>
        Returns: string
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
