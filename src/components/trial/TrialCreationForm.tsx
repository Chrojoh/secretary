'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertCircle, Save, Eye } from 'lucide-react';
import { saveTrial as saveTrialToDb, testSupabaseConnection } from '@/lib/trial-operations';

// C-WAGS standard class names with subclasses
const CWAGS_CLASSES = [
  // Scent Work Classes
  'Patrol 1', 'Detective 2', 'Investigator 3', 'Super Sleuth 4',
  'Private Investigator', 'Detective Diversions',
  // Rally Classes (including Zoom which comes after ARF)
  'Rally Starter', 'Rally Advanced', 'Rally Pro', 'Rally ARF',
  'Zoom 1', 'Zoom 1.5', 'Zoom 2',
  // Games Classes (base classes - subclasses selected separately)
  'Games 1', 'Games 2', 'Games 3', 'Games 4',
  // Obedience Classes
  'Obedience 1', 'Obedience 2', 'Obedience 3', 'Obedience 4', 'Obedience 5'
];

// Games subclasses
const GAMES_SUBCLASSES = [
  { value: 'GB', label: 'Grab Bag (GB)' },
  { value: 'C', label: 'Colors (C)' },
  { value: 'BJ', label: 'Black Jack (BJ)' },
  { value: 'P', label: 'Pairs (P)' },
  { value: 'T', label: 'Teams (T)' }
];

// Sample judges for autocomplete
const SAMPLE_JUDGES = [
  'Cheree Richmond', 'Heather Schneider', 'Aaryn Secker', 'Julie Williams',
  'Patty Brown', 'Sandy Martinez', 'William Thompson', 'Burt Smith'
];

interface Round {
  id: string;
  judgeName: string;
  feoAvailable: boolean;
}

interface TrialClass {
  id: string;
  className: string;
  subclass?: string; // For Games classes
  rounds: Round[];
}

interface TrialDay {
  id: string;
  dayNumber: number;
  date: string;
  classes: TrialClass[];
}

interface FeeConfiguration {
  regular: number;
  feo: number;
  juniorHandler: number;
  juniorHandlerFeo: number;
}

interface TrialData {
  clubName: string;
  secretary: string;
  days: TrialDay[];
  feeConfiguration: FeeConfiguration;
  status: 'draft' | 'published';
}

const TrialCreationForm: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [trialData, setTrialData] = useState<TrialData>({
    clubName: '',
    secretary: '',
    days: [],
    feeConfiguration: {
      regular: 25.00,
      feo: 15.00,
      juniorHandler: 20.00,
      juniorHandlerFeo: 12.00
    },
    status: 'draft'
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'trial_secretary') {
      router.push('/dashboard/secretary');
      return;
    }

    // Pre-fill secretary name from session
    if (session.user.firstName && session.user.lastName) {
      setTrialData(prev => ({
        ...prev,
        secretary: `${session.user.firstName} ${session.user.lastName}`
      }));
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session || session.user.role !== 'trial_secretary') {
    return null;
  }

  // Generate unique IDs
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a new trial day
  const addTrialDay = () => {
    const newDay: TrialDay = {
      id: generateId(),
      dayNumber: trialData.days.length + 1,
      date: '',
      classes: []
    };
    setTrialData(prev => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
  };

  // Remove a trial day
  const removeTrialDay = (dayId: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.filter(day => day.id !== dayId).map((day, index) => ({
        ...day,
        dayNumber: index + 1
      }))
    }));
  };

  // Update trial day date
  const updateDayDate = (dayId: string, date: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId ? { ...day, date } : day
      )
    }));
  };

  // Add class to a day
  const addClass = (dayId: string) => {
    const newClass: TrialClass = {
      id: generateId(),
      className: '',
      subclass: undefined,
      rounds: []
    };
    
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, classes: [...day.classes, newClass] }
          : day
      )
    }));
  };

  // Remove class from a day
  const removeClass = (dayId: string, classId: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? { ...day, classes: day.classes.filter(cls => cls.id !== classId) }
          : day
      )
    }));
  };

  // Update class name
  const updateClassName = (dayId: string, classId: string, className: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              classes: day.classes.map(cls =>
                cls.id === classId ? { 
                  ...cls, 
                  className,
                  // Reset subclass if changing from Games to non-Games class
                  subclass: className.startsWith('Games') ? cls.subclass : undefined
                } : cls
              )
            }
          : day
      )
    }));
  };

  // Update class subclass (for Games classes)
  const updateClassSubclass = (dayId: string, classId: string, subclass: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              classes: day.classes.map(cls =>
                cls.id === classId ? { ...cls, subclass } : cls
              )
            }
          : day
      )
    }));
  };

  // Add round to a class
  const addRound = (dayId: string, classId: string) => {
    const newRound: Round = {
      id: generateId(),
      judgeName: '',
      feoAvailable: false
    };

    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              classes: day.classes.map(cls =>
                cls.id === classId
                  ? { ...cls, rounds: [...cls.rounds, newRound] }
                  : cls
              )
            }
          : day
      )
    }));
  };

  // Remove round from a class
  const removeRound = (dayId: string, classId: string, roundId: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              classes: day.classes.map(cls =>
                cls.id === classId
                  ? { ...cls, rounds: cls.rounds.filter(round => round.id !== roundId) }
                  : cls
              )
            }
          : day
      )
    }));
  };

  // Update round judge
  const updateRoundJudge = (dayId: string, classId: string, roundId: string, judgeName: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              classes: day.classes.map(cls =>
                cls.id === classId
                  ? {
                      ...cls,
                      rounds: cls.rounds.map(round =>
                        round.id === roundId ? { ...round, judgeName } : round
                      )
                    }
                  : cls
              )
            }
          : day
      )
    }));
  };

  // Toggle FEO availability for round
  const toggleFEO = (dayId: string, classId: string, roundId: string) => {
    setTrialData(prev => ({
      ...prev,
      days: prev.days.map(day =>
        day.id === dayId
          ? {
              ...day,
              classes: day.classes.map(cls =>
                cls.id === classId
                  ? {
                      ...cls,
                      rounds: cls.rounds.map(round =>
                        round.id === roundId
                          ? { ...round, feoAvailable: !round.feoAvailable }
                          : round
                      )
                    }
                  : cls
              )
            }
          : day
      )
    }));
  };

  // Update fee configuration
  const updateFee = (feeType: keyof FeeConfiguration, value: number) => {
    setTrialData(prev => ({
      ...prev,
      feeConfiguration: {
        ...prev.feeConfiguration,
        [feeType]: value
      }
    }));
  };

  // Validation
  const validateTrial = (): string[] => {
    const errors: string[] = [];

    if (!trialData.clubName.trim()) {
      errors.push('Club name is required');
    }

    if (!trialData.secretary.trim()) {
      errors.push('Trial secretary name is required');
    }

    if (trialData.days.length === 0) {
      errors.push('At least one trial day is required');
    }

    trialData.days.forEach((day, dayIndex) => {
      if (!day.date) {
        errors.push(`Date is required for Day ${day.dayNumber}`);
      }

      if (day.classes.length === 0) {
        errors.push(`At least one class is required for Day ${day.dayNumber}`);
      }

      day.classes.forEach((cls, classIndex) => {
        if (!cls.className) {
          errors.push(`Class name is required for Day ${day.dayNumber}, Class ${classIndex + 1}`);
        }

        // Validate Games subclass requirement
        if (cls.className && cls.className.startsWith('Games') && !cls.subclass) {
          errors.push(`Games subclass is required for ${cls.className} on Day ${day.dayNumber}`);
        }

        if (cls.rounds.length === 0) {
          errors.push(`At least one round is required for ${cls.className || `Class ${classIndex + 1}`} on Day ${day.dayNumber}`);
        }

        cls.rounds.forEach((round, roundIndex) => {
          if (!round.judgeName.trim()) {
            errors.push(`Judge name is required for ${cls.className || `Class ${classIndex + 1}`}, Round ${roundIndex + 1} on Day ${day.dayNumber}`);
          }
        });
      });
    });

    return errors;
  };

  // Test Supabase connection
  const testConnection = async () => {
    setIsLoading(true);
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        alert('✓ Supabase connection test passed!');
      } else {
        alert(`✗ Supabase connection test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      alert(`✗ Connection test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save trial (draft or publish)
  const saveTrial = async (publish: boolean = false) => {
    setIsLoading(true);
    const errors = validateTrial();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      if (!session?.user?.id) {
        throw new Error('You must be logged in to save a trial.');
      }

      console.log('Current session user:', session.user);
      console.log('User ID type:', typeof session.user.id);
      console.log('User ID value:', session.user.id);
      console.log('User ID length:', session.user.id.length);

      const trialToSave = {
        clubName: trialData.clubName,
        secretary: trialData.secretary,
        days: trialData.days,
        feeConfiguration: trialData.feeConfiguration,
        status: publish ? ('published' as const) : ('draft' as const)
      };

      console.log('Saving trial to database...', trialToSave);
      console.log('User ID being passed:', session.user.id);
      
      const result = await saveTrialToDb(trialToSave, session.user.id);
      
      if (result.success) {
        alert(`Trial ${publish ? 'published' : 'saved as draft'} successfully!`);
        setValidationErrors([]);
        
        // Redirect to trial dashboard or management page
        router.push('/dashboard/secretary');
      } else {
        throw new Error(result.error || 'Failed to save trial');
      }
      
    } catch (error) {
      console.error('Error saving trial:', error);
      alert(`Error saving trial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total classes and rounds
  const totalClasses = trialData.days.reduce((sum, day) => sum + day.classes.length, 0);
  const totalRounds = trialData.days.reduce((sum, day) => 
    sum + day.classes.reduce((classSum, cls) => classSum + cls.rounds.length, 0), 0
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Trial</h1>
          <p className="text-gray-600 mt-2">
            Set up your C-WAGS trial structure with days, classes, and rounds
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Please fix the following errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Trial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clubName">Club Name *</Label>
                  <Input
                    id="clubName"
                    placeholder="Enter club name"
                    value={trialData.clubName}
                    onChange={(e) => setTrialData(prev => ({ ...prev, clubName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretary">Trial Secretary *</Label>
                  <Input
                    id="secretary"
                    placeholder="Enter secretary name"
                    value={trialData.secretary}
                    onChange={(e) => setTrialData(prev => ({ ...prev, secretary: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Fee Configuration</CardTitle>
              <p className="text-sm text-gray-600">
                Set the entry fees for this trial. These will be used in the entry form.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regularFee">Regular Entry ($)</Label>
                  <Input
                    id="regularFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={trialData.feeConfiguration.regular}
                    onChange={(e) => updateFee('regular', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feoFee">FEO Entry ($)</Label>
                  <Input
                    id="feoFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={trialData.feeConfiguration.feo}
                    onChange={(e) => updateFee('feo', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="juniorFee">Junior Handler ($)</Label>
                  <Input
                    id="juniorFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={trialData.feeConfiguration.juniorHandler}
                    onChange={(e) => updateFee('juniorHandler', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="juniorFeoFee">Junior FEO ($)</Label>
                  <Input
                    id="juniorFeoFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={trialData.feeConfiguration.juniorHandlerFeo}
                    onChange={(e) => updateFee('juniorHandlerFeo', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Junior handlers will pay the Junior Handler Fee regardless of Regular/FEO selection. 
                  Set any fee to $0.00 to hide that option in the entry form.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trial Days */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Trial Days</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Add days to your trial and configure classes for each day
                </p>
              </div>
              <Button onClick={addTrialDay} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Day
              </Button>
            </CardHeader>
            <CardContent>
              {trialData.days.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No trial days added yet.</p>
                  <p className="text-sm">Click "Add Day" to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {trialData.days.map((day) => (
                    <Card key={day.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Day {day.dayNumber}</Badge>
                          <Input
                            type="date"
                            value={day.date}
                            onChange={(e) => updateDayDate(day.id, e.target.value)}
                            className="w-auto"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addClass(day.id)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Class
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrialDay(day.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {day.classes.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="text-sm">No classes added for this day.</p>
                            <p className="text-xs">Click "Add Class" to add your first class.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {day.classes.map((cls, classIndex) => (
                              <Card key={cls.id} className="bg-gray-50">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <Badge variant="secondary">Class {classIndex + 1}</Badge>
                                      <Select
                                        value={cls.className}
                                        onValueChange={(value) => updateClassName(day.id, cls.id, value)}
                                      >
                                        <SelectTrigger className="w-48">
                                          <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {CWAGS_CLASSES.map((className) => (
                                            <SelectItem key={className} value={className}>
                                              {className}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addRound(day.id, cls.id)}
                                        className="flex items-center gap-1"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Add Round
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeClass(day.id, cls.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {cls.rounds.length === 0 ? (
                                    <div className="text-center py-3 text-gray-500 border border-dashed border-gray-300 rounded">
                                      <p className="text-xs">No rounds added. Click "Add Round" to add the first round.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {cls.rounds.map((round, roundIndex) => (
                                        <div key={round.id} className="flex items-center gap-3 p-3 bg-white rounded border">
                                          <Badge variant="outline" className="text-xs">
                                            Round {roundIndex + 1}
                                          </Badge>
                                          <Select
                                            value={round.judgeName}
                                            onValueChange={(value) => updateRoundJudge(day.id, cls.id, round.id, value)}
                                          >
                                            <SelectTrigger className="flex-1">
                                              <SelectValue placeholder="Select judge" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {SAMPLE_JUDGES.map((judge) => (
                                                <SelectItem key={judge} value={judge}>
                                                  {judge}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`feo-${round.id}`}
                                              checked={round.feoAvailable}
                                              onCheckedChange={() => toggleFEO(day.id, cls.id, round.id)}
                                            />
                                            <Label htmlFor={`feo-${round.id}`} className="text-xs">
                                              FEO Available
                                            </Label>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeRound(day.id, cls.id, round.id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Games Subclass Selection */}
                                  {cls.className && cls.className.startsWith('Games') && (
                                    <div className="mt-4 p-3 bg-orange-50 rounded border border-orange-200">
                                      <Label className="text-sm font-medium text-orange-800 mb-2 block">
                                        Games Subclass *
                                      </Label>
                                      <Select
                                        value={cls.subclass || ''}
                                        onValueChange={(value) => updateClassSubclass(day.id, cls.id, value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select Games subclass" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {GAMES_SUBCLASSES.map((subclass) => (
                                            <SelectItem key={subclass.value} value={subclass.value}>
                                              {subclass.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <p className="text-xs text-orange-600 mt-1">
                                        Games classes require a specific subclass (Grab Bag, Colors, etc.)
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={testConnection}
              disabled={isLoading}
              variant="secondary"
              className="flex items-center gap-2"
            >
              🔧 Test Database
            </Button>
            <Button
              onClick={() => saveTrial(false)}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              onClick={() => saveTrial(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Publishing...' : 'Publish Trial'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Days:</span>
                <Badge variant="secondary">{trialData.days.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Classes:</span>
                <Badge variant="secondary">{totalClasses}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Rounds:</span>
                <Badge variant="secondary">{totalRounds}</Badge>
              </div>
              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Entry Fees:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Regular:</span>
                    <span>${trialData.feeConfiguration.regular.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FEO:</span>
                    <span>${trialData.feeConfiguration.feo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Junior:</span>
                    <span>${trialData.feeConfiguration.juniorHandler.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Junior FEO:</span>
                    <span>${trialData.feeConfiguration.juniorHandlerFeo.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trial Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-medium">{trialData.clubName || 'Club Name'}</div>
                    <div className="text-gray-600">Secretary: {trialData.secretary || 'TBD'}</div>
                  </div>
                  {trialData.days.map((day) => (
                    <div key={day.id} className="border-l-2 border-blue-200 pl-3">
                      <div className="font-medium">
                        Day {day.dayNumber} - {day.date || 'Date TBD'}
                      </div>
                      {day.classes.map((cls) => (
                        <div key={cls.id} className="ml-2 text-xs text-gray-600">
                          • {cls.className || 'Class TBD'}{cls.subclass ? ` (${cls.subclass})` : ''} ({cls.rounds.length} round{cls.rounds.length !== 1 ? 's' : ''})
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Each trial must have at least one day</div>
              <div>• Each day must have at least one class</div>
              <div>• Each class must have at least one round</div>
              <div>• Each round must have an assigned judge</div>
              <div>• FEO (For Exhibition Only) entries don't count toward C-WAGS submissions</div>
              <div>• Junior handler fees override regular/FEO selection</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrialCreationForm;