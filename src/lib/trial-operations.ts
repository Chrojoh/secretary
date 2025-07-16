// src/lib/trial-operations.ts
import { supabase, type Database } from './supabase'

export interface TrialFormData {
  clubName: string
  secretary: string
  days: Array<{
    id: string
    dayNumber: number
    date: string
    classes: Array<{
      id: string
      className: string
      subclass?: string // For Games classes
      rounds: Array<{
        id: string
        judgeName: string
        feoAvailable: boolean
      }>
    }>
  }>
  feeConfiguration: {
    regular: number
    feo: number
    juniorHandler: number
    juniorHandlerFeo: number
  }
  status: 'draft' | 'published'
}

export interface SaveTrialResult {
  success: boolean
  trialId?: string
  error?: string
}

// Type for the complete trial data as returned from database
export interface TrialWithRelations {
  id: string
  club_name: string
  secretary_name: string
  created_by: string
  trial_dates: Array<{ dayNumber: number; date: string }>
  fee_configuration: {
    regular: number
    feo: number
    juniorHandler: number
    juniorHandlerFeo: number
  }
  status: 'draft' | 'published' | 'closed' | 'completed'
  created_at: string
  updated_at: string
  trial_days?: Array<{
    id: string
    day_number: number
    trial_date: string
    trial_classes: Array<{
      id: string
      class_name: string
      class_order: number
      trial_rounds: Array<{
        id: string
        round_number: number
        judge_name: string
        feo_available: boolean
      }>
    }>
  }>
}

/**
 * Test Supabase connection and table access
 */
export async function testSupabaseConnection() {
  try {
    console.log('=== TESTING SUPABASE CONNECTION ===');
    
    // Test 1: Basic connection
    console.log('Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('trials')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('Connection test failed:', connectionError);
      return { success: false, error: connectionError.message };
    }

    console.log('✓ Basic connection successful');

    // Test 2: Try to read from trials table
    console.log('Testing read access...');
    const { data: readTest, error: readError } = await supabase
      .from('trials')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('Read test failed:', readError);
      return { success: false, error: readError.message };
    }

    console.log('✓ Read access successful, found', readTest?.length || 0, 'trials');

    return { success: true, message: 'All tests passed!' };

  } catch (error) {
    console.error('=== SUPABASE TEST ERROR ===');
    console.error('Error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Save a complete trial with all its days, classes, and rounds
 */
export async function saveTrial(
  trialData: TrialFormData,
  userId: string
): Promise<SaveTrialResult> {
  try {
    console.log('=== STARTING TRIAL SAVE ===');
    console.log('User ID:', userId);
    console.log('Trial Data:', JSON.stringify(trialData, null, 2));

    // Validate input data
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (!trialData.clubName || !trialData.secretary) {
      return { success: false, error: 'Club name and secretary are required' };
    }

    if (trialData.days.length === 0) {
      return { success: false, error: 'At least one trial day is required' };
    }

    // Prepare trial insert data
    const trialInsert = {
      club_name: trialData.clubName,
      secretary_name: trialData.secretary,
      created_by: userId,
      trial_dates: trialData.days.map(day => ({
        dayNumber: day.dayNumber,
        date: day.date
      })),
      fee_configuration: trialData.feeConfiguration,
      status: trialData.status
    };

    console.log('=== INSERTING TRIAL ===');
    console.log('Trial insert data:', JSON.stringify(trialInsert, null, 2));

    // Insert the trial
    const { data: trial, error: trialError } = await supabase
      .from('trials')
      .insert(trialInsert)
      .select('id')
      .single();

    if (trialError) {
      console.error('=== TRIAL INSERT ERROR ===');
      console.error('Error details:', trialError);
      return { success: false, error: `Trial creation failed: ${trialError.message}` };
    }

    if (!trial || !trial.id) {
      console.error('No trial data returned after insert');
      return { success: false, error: 'No trial data returned after creation' };
    }

    const trialId = trial.id;
    console.log('=== TRIAL CREATED SUCCESSFULLY ===');
    console.log('Trial ID:', trialId);

    // Insert trial days
    console.log('=== INSERTING TRIAL DAYS ===');
    for (let dayIndex = 0; dayIndex < trialData.days.length; dayIndex++) {
      const day = trialData.days[dayIndex];
      console.log(`Processing day ${dayIndex + 1}:`, day);

      const dayInsert = {
        trial_id: trialId,
        day_number: day.dayNumber,
        trial_date: day.date
      };

      console.log('Day insert data:', dayInsert);

      const { data: savedDay, error: dayError } = await supabase
        .from('trial_days')
        .insert(dayInsert)
        .select('id')
        .single();

      if (dayError) {
        console.error('=== DAY INSERT ERROR ===');
        console.error('Day error:', dayError);
        // Clean up trial if day creation fails
        await supabase.from('trials').delete().eq('id', trialId);
        return { success: false, error: `Day creation failed: ${dayError.message}` };
      }

      if (!savedDay || !savedDay.id) {
        console.error('No day data returned after insert');
        await supabase.from('trials').delete().eq('id', trialId);
        return { success: false, error: 'No day data returned after creation' };
      }

      const dayId = savedDay.id;
      console.log('Day created successfully with ID:', dayId);

      // Insert classes for this day
      console.log(`=== INSERTING CLASSES FOR DAY ${day.dayNumber} ===`);
      for (let classIndex = 0; classIndex < day.classes.length; classIndex++) {
        const trialClass = day.classes[classIndex];
        console.log(`Processing class ${classIndex + 1}:`, trialClass);

        const classInsert = {
          trial_day_id: dayId,
          class_name: trialClass.className + (trialClass.subclass ? ` (${trialClass.subclass})` : ''),
          class_order: classIndex + 1
        };

        console.log('Class insert data:', classInsert);
        
        const { data: savedClass, error: classError } = await supabase
          .from('trial_classes')
          .insert(classInsert)
          .select('id')
          .single();

        if (classError) {
          console.error('=== CLASS INSERT ERROR ===');
          console.error('Class error:', classError);
          // Clean up trial if class creation fails
          await supabase.from('trials').delete().eq('id', trialId);
          return { success: false, error: `Class creation failed: ${classError.message}` };
        }

        if (!savedClass || !savedClass.id) {
          console.error('No class data returned after insert');
          await supabase.from('trials').delete().eq('id', trialId);
          return { success: false, error: 'No class data returned after creation' };
        }

        const classId = savedClass.id;
        console.log('Class created successfully with ID:', classId);

        // Insert rounds for this class
        console.log(`=== INSERTING ROUNDS FOR CLASS ${trialClass.className} ===`);
        for (let roundIndex = 0; roundIndex < trialClass.rounds.length; roundIndex++) {
          const round = trialClass.rounds[roundIndex];
          console.log(`Processing round ${roundIndex + 1}:`, round);

          const roundInsert = {
            trial_class_id: classId,
            round_number: roundIndex + 1,
            judge_name: round.judgeName,
            feo_available: round.feoAvailable
          };

          console.log('Round insert data:', roundInsert);
          
          const { error: roundError } = await supabase
            .from('trial_rounds')
            .insert(roundInsert);

          if (roundError) {
            console.error('=== ROUND INSERT ERROR ===');
            console.error('Round error:', roundError);
            // Clean up trial if round creation fails
            await supabase.from('trials').delete().eq('id', trialId);
            return { success: false, error: `Round creation failed: ${roundError.message}` };
          }

          console.log('Round created successfully');
        }
      }
    }

    console.log('=== TRIAL SAVE COMPLETED SUCCESSFULLY ===');
    return { success: true, trialId };

  } catch (error) {
    console.error('=== UNEXPECTED ERROR IN SAVE TRIAL ===');
    console.error('Error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get all trials for a user
 */
export async function getUserTrials(userId: string) {
  const { data, error } = await supabase
    .from('trials')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user trials:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data, error: null };
}

/**
 * Get a single trial with all its related data (for viewing)
 */
export async function getTrialById(trialId: string, userId?: string): Promise<TrialWithRelations | null> {
  try {
    let query = supabase
      .from('trials')
      .select(`
        *,
        trial_days (
          *,
          trial_classes (
            *,
            trial_rounds (*)
          )
        )
      `)
      .eq('id', trialId);

    // Only filter by user if userId is provided (for ownership check)
    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching trial:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getTrialById:', error);
    return null;
  }
}

/**
 * Update an existing trial (for edit functionality)
 */
export async function updateTrial(
  trialId: string,
  trialData: TrialFormData,
  userId: string
): Promise<SaveTrialResult> {
  try {
    // Update the main trial record
    const { error: trialError } = await supabase
      .from('trials')
      .update({
        club_name: trialData.clubName,
        secretary_name: trialData.secretary,
        trial_dates: trialData.days.map(day => ({
          dayNumber: day.dayNumber,
          date: day.date
        })),
        fee_configuration: trialData.feeConfiguration,
        status: trialData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', trialId)
      .eq('created_by', userId); // Ensure user owns this trial

    if (trialError) {
      console.error('Error updating trial:', trialError);
      return { success: false, error: trialError.message };
    }

    // Delete existing days (cascades to classes and rounds)
    const { error: deleteError } = await supabase
      .from('trial_days')
      .delete()
      .eq('trial_id', trialId);

    if (deleteError) {
      console.error('Error deleting existing trial days:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Re-create all days, classes, and rounds with new data
    for (const day of trialData.days) {
      const { data: savedDay, error: dayError } = await supabase
        .from('trial_days')
        .insert({
          trial_id: trialId,
          day_number: day.dayNumber,
          trial_date: day.date
        })
        .select('id')
        .single();

      if (dayError) {
        console.error('Error creating trial day:', dayError);
        return { success: false, error: dayError.message };
      }

      const dayId = savedDay.id;

      for (let classIndex = 0; classIndex < day.classes.length; classIndex++) {
        const trialClass = day.classes[classIndex];
        
        const { data: savedClass, error: classError } = await supabase
          .from('trial_classes')
          .insert({
            trial_day_id: dayId,
            class_name: trialClass.className + (trialClass.subclass ? ` (${trialClass.subclass})` : ''),
            class_order: classIndex + 1
          })
          .select('id')
          .single();

        if (classError) {
          console.error('Error creating trial class:', classError);
          return { success: false, error: classError.message };
        }

        const classId = savedClass.id;

        for (let roundIndex = 0; roundIndex < trialClass.rounds.length; roundIndex++) {
          const round = trialClass.rounds[roundIndex];
          
          const { error: roundError } = await supabase
            .from('trial_rounds')
            .insert({
              trial_class_id: classId,
              round_number: roundIndex + 1,
              judge_name: round.judgeName,
              feo_available: round.feoAvailable
            });

          if (roundError) {
            console.error('Error creating trial round:', roundError);
            return { success: false, error: roundError.message };
          }
        }
      }
    }

    return { success: true, trialId };

  } catch (error) {
    console.error('Unexpected error updating trial:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Delete a trial
 */
export async function deleteTrial(trialId: string, userId: string) {
  const { error } = await supabase
    .from('trials')
    .delete()
    .eq('id', trialId)
    .eq('created_by', userId);

  if (error) {
    console.error('Error deleting trial:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}