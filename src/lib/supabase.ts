// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Database {
  public: {
    Tables: {
      trials: {
        Row: {
          id: string
          club_name: string
          secretary_name: string
          created_by: string
          trial_dates: any // JSONB
          fee_configuration: any // JSONB
          status: 'draft' | 'published'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_name: string
          secretary_name: string
          created_by: string
          trial_dates: any
          fee_configuration: any
          status?: 'draft' | 'published'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_name?: string
          secretary_name?: string
          created_by?: string
          trial_dates?: any
          fee_configuration?: any
          status?: 'draft' | 'published'
          created_at?: string
          updated_at?: string
        }
      }
      trial_days: {
        Row: {
          id: string
          trial_id: string
          day_number: number
          trial_date: string
          created_at: string
        }
        Insert: {
          id?: string
          trial_id: string
          day_number: number
          trial_date: string
          created_at?: string
        }
        Update: {
          id?: string
          trial_id?: string
          day_number?: number
          trial_date?: string
          created_at?: string
        }
      }
      trial_classes: {
        Row: {
          id: string
          trial_day_id: string
          class_name: string
          class_type: 'scent' | 'rally' | 'games' | 'obedience'
          class_order: number
          created_at: string
        }
        Insert: {
          id?: string
          trial_day_id: string
          class_name: string
          class_type?: 'scent' | 'rally' | 'games' | 'obedience'
          class_order: number
          created_at?: string
        }
        Update: {
          id?: string
          trial_day_id?: string
          class_name?: string
          class_type?: 'scent' | 'rally' | 'games' | 'obedience'
          class_order?: number
          created_at?: string
        }
      }
      trial_rounds: {
        Row: {
          id: string
          trial_class_id: string
          round_number: number
          judge_name: string
          feo_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          trial_class_id: string
          round_number: number
          judge_name: string
          feo_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          trial_class_id?: string
          round_number?: number
          judge_name?: string
          feo_available?: boolean
          created_at?: string
        }
      }
    }
  }
}

export type TrialRow = Database['public']['Tables']['trials']['Row']
export type TrialInsert = Database['public']['Tables']['trials']['Insert']
export type TrialUpdate = Database['public']['Tables']['trials']['Update']