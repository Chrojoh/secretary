// src/lib/types.ts

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'trial_secretary' | 'administrator' | 'handler';
  clubName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeConfiguration {
  regular: number;
  feo: number;
  juniorHandler: number;
  juniorHandlerFeo: number;
}

export interface TrialRound {
  id: string;
  trial_class_id: string;
  round_number: number;
  judge_name: string;
  feo_available: boolean;
}

export interface TrialClass {
  id: string;
  trial_day_id: string;
  class_name: string;
  class_order: number;
  trial_rounds: TrialRound[];
}

export interface TrialDay {
  id: string;
  trial_id: string;
  day_number: number;
  trial_date: string;
  trial_classes: TrialClass[];
}

// This matches your database structure exactly
export interface TrialWithRelations {
  id: string;
  club_name: string;
  secretary_name: string;
  created_by: string;
  trial_dates: any;
  fee_configuration: FeeConfiguration;
  status: 'draft' | 'published' | 'closed' | 'completed';
  created_at: string;
  updated_at: string;
  trial_days: TrialDay[];
}

// For API responses that include success/error wrapper
export interface TrialApiResponse {
  success: boolean;
  data?: TrialWithRelations;
  error?: string;
}

export interface Entry {
  id: string;
  trialId: string;
  handlerName: string;
  dogCallName: string;
  cwagsNumber?: string;
  email: string;
  phone?: string;
  isJuniorHandler: boolean;
  waiverAccepted: boolean;
  totalFee: number;
  submittedAt: string;
  status: 'confirmed' | 'cancelled' | 'pending';
}

export interface EntrySelection {
  id: string;
  entryId: string;
  trialRoundId: string;
  entryType: 'regular' | 'feo';
  fee: number;
  runningOrder?: number;
  createdAt: string;
}

export interface Score {
  id: string;
  entrySelectionId: string;
  trialRoundId: string;
  
  // Scent work fields
  scent1?: string;
  scent2?: string;
  scent3?: string;
  scent4?: string;
  fault1?: string;
  fault2?: string;
  timeSeconds?: number;
  passFail?: string;
  
  // Numerical scoring fields
  numericalScore?: number;
  passIndicator?: string;
  
  // Unified fields
  finalResult: string;
  scoredAt: string;
  scoredBy: string;
}