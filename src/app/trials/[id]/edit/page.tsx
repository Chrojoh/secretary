// src/app/trials/[id]/edit/page.tsx
// MINIMAL FIX - only changes what's needed to remove errors

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Calendar, Users, DollarSign, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import { getTrialById, updateTrial, type TrialFormData } from '@/lib/trial-operations';

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

// Helper function to check if a class is a Games class
const isGamesClass = (className: string): boolean => {
  return className.startsWith('Games ');
};

export default function TrialEditPage() {
  const router = useRouter();
  const params = useParams();
  const trialId = params.id as string;
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [trial, setTrial] = useState<any>(null); // Use any to avoid type errors
  const [formData, setFormData] = useState<TrialFormData>({
    clubName: '',
    secretary: '',
    status: 'draft',
    feeConfiguration: {
      regular: 25.00,
      feo: 15.00,
      juniorHandler: 20.00,
      juniorHandlerFeo: 12.00
    },
    days: []
  });

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (session.user.role !== 'trial_secretary') {
      router.push('/dashboard/secretary');
      return;
    }
  }, [session, status, router]);

  // Load trial data
  useEffect(() => {
    if (trialId && session?.user?.id) {
      loadTrial();
    }
  }, [trialId, session]);

  const loadTrial = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError('');
      
      // Your getTrialById returns { success, data, error } format
      const result = await getTrialById(trialId, session.user.id);
      
      // Check if the result has the expected structure
      if ('success' in result && result.success && result.data) {
        // API response format
        const trialData = result.data;
        setTrial(trialData);
        
        // Convert database format to form format
        const convertedFormData: TrialFormData = {
          clubName: trialData.club_name,
          secretary: trialData.secretary_name,
          status: trialData.status,
          feeConfiguration: trialData.fee_configuration,
          days: (trialData.trial_days || []).map((day: any) => ({
            id: day.id,
            dayNumber: day.day_number,
            date: day.trial_date,
            classes: (day.trial_classes || []).map((cls: any) => {
              // Extract subclass from class name if it exists
              const classNameMatch = cls.class_name.match(/^(.+?)\s*\(([^)]+)\)$/);
              const className = classNameMatch ? classNameMatch[1] : cls.class_name;
              const subclass = classNameMatch ? classNameMatch[2] : undefined;
              
              return {
                id: cls.id,
                className: className,
                subclass: subclass,
                rounds: (cls.trial_rounds || []).map((round: any) => ({
                  id: round.id,
                  judgeName: round.judge_name,
                  feoAvailable: round.feo_available
                }))
              };
            })
          }))
        };
        
        setFormData(convertedFormData);
      } else if ('success' in result && !result.success) {
        // API error response
        setError(result.error || 'Trial not found or you do not have permission to edit it');
      } else if (result && typeof result === 'object' && 'id' in result) {
        // Direct data format (if your function returns data directly)
        const trialData = result as any;
        setTrial(trialData);
        
        // Convert database format to form format
        const convertedFormData: TrialFormData = {
          clubName: trialData.club_name,
          secretary: trialData.secretary_name,
          status: trialData.status,
          feeConfiguration: trialData.fee_configuration,
          days: (trialData.trial_days || []).map((day: any) => ({
            id: day.id,
            dayNumber: day.day_number,
            date: day.trial_date,
            classes: (day.trial_classes || []).map((cls: any) => {
              // Extract subclass from class name if it exists
              const classNameMatch = cls.class_name.match(/^(.+?)\s*\(([^)]+)\)$/);
              const className = classNameMatch ? classNameMatch[1] : cls.class_name;
              const subclass = classNameMatch ? classNameMatch[2] : undefined;
              
              return {
                id: cls.id,
                className: className,
                subclass: subclass,
                rounds: (cls.trial_rounds || []).map((round: any) => ({
                  id: round.id,
                  judgeName: round.judge_name,
                  feoAvailable: round.feo_available
                }))
              };
            })
          }))
        };
        
        setFormData(convertedFormData);
      } else {
        setError('Trial not found or you do not have permission to edit it');
      }
    } catch (err) {
      setError('Failed to load trial data');
      console.error('Error loading trial:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) {
      setError('You must be logged in to edit trials');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      // Validate required fields
      if (!formData.clubName.trim()) {
        setError('Club name is required');
        return;
      }
      if (!formData.secretary.trim()) {
        setError('Trial secretary is required');
        return;
      }
      if (formData.days.length === 0) {
        setError('At least one trial day is required');
        return;
      }

      // Validate each day has at least one class
      for (let i = 0; i < formData.days.length; i++) {
        if (!formData.days[i].classes || formData.days[i].classes.length === 0) {
          setError(`Day ${i + 1} must have at least one class`);
          return;
        }
        
        // Validate date
        if (!formData.days[i].date) {
          setError(`Day ${i + 1} must have a date`);
          return;
        }

        // Validate each class has a name and at least one round
        for (let j = 0; j < formData.days[i].classes.length; j++) {
          const cls = formData.days[i].classes[j];
          if (!cls.className) {
            setError(`Day ${i + 1}, Class ${j + 1} must have a name`);
            return;
          }
          
          // Validate Games classes have subclass selected
          if (isGamesClass(cls.className) && !cls.subclass) {
            setError(`Day ${i + 1}, Class ${j + 1} (${cls.className}) must have a subclass selected`);
            return;
          }
          
          if (!cls.rounds || cls.rounds.length === 0) {
            setError(`Day ${i + 1}, Class ${j + 1} must have at least one round`);
            return;
          }
          
          // Validate each round has a judge
          for (let k = 0; k < cls.rounds.length; k++) {
            if (!cls.rounds[k].judgeName) {
              setError(`Day ${i + 1}, Class ${j + 1}, Round ${k + 1} must have a judge assigned`);
              return;
            }
          }
        }
      }

      const result = await updateTrial(trialId, formData, session.user.id);
      
      if (!result.success) {
        setError(result.error || 'Failed to update trial');
        return;
      }

      setSuccessMessage('Trial updated successfully!');
      
      // Redirect back to trial detail page after short delay
      setTimeout(() => {
        router.push(`/trials/${trialId}`);
      }, 2000);

    } catch (err) {
      setError('Failed to update trial. Please try again.');
      console.error('Error updating trial:', err);
    } finally {
      setSaving(false);
    }
  };

  const addDay = () => {
    const newDay = {
      id: `day-${Date.now()}`,
      dayNumber: formData.days.length + 1,
      date: '',
      classes: []
    };
    setFormData(prev => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
  };

  const removeDay = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.filter((_, index) => index !== dayIndex)
        .map((day, index) => ({ ...day, dayNumber: index + 1 }))
    }));
  };

  const updateDay = (dayIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const addClass = (dayIndex: number) => {
    const newClass = {
      id: `class-${Date.now()}`,
      className: '',
      rounds: []
    };
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, index) => 
        index === dayIndex 
          ? { ...day, classes: [...(day.classes || []), newClass] }
          : day
      )
    }));
  };

  const removeClass = (dayIndex: number, classIndex: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, index) => 
        index === dayIndex 
          ? { ...day, classes: (day.classes || []).filter((_, cIndex) => cIndex !== classIndex) }
          : day
      )
    }));
  };

  const updateClass = (dayIndex: number, classIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, dIndex) => 
        dIndex === dayIndex 
          ? {
              ...day,
              classes: (day.classes || []).map((cls, cIndex) => 
                cIndex === classIndex ? { ...cls, [field]: value } : cls
              )
            }
          : day
      )
    }));
  };

  const addRound = (dayIndex: number, classIndex: number) => {
    const newRound = {
      id: `round-${Date.now()}`,
      judgeName: '',
      feoAvailable: false
    };
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, dIndex) => 
        dIndex === dayIndex 
          ? {
              ...day,
              classes: (day.classes || []).map((cls, cIndex) => 
                cIndex === classIndex 
                  ? { ...cls, rounds: [...(cls.rounds || []), newRound] }
                  : cls
              )
            }
          : day
      )
    }));
  };

  const removeRound = (dayIndex: number, classIndex: number, roundIndex: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, dIndex) => 
        dIndex === dayIndex 
          ? {
              ...day,
              classes: (day.classes || []).map((cls, cIndex) => 
                cIndex === classIndex 
                  ? { ...cls, rounds: (cls.rounds || []).filter((_, rIndex) => rIndex !== roundIndex) }
                  : cls
              )
            }
          : day
      )
    }));
  };

  const updateRound = (dayIndex: number, classIndex: number, roundIndex: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, dIndex) => 
        dIndex === dayIndex 
          ? {
              ...day,
              classes: (day.classes || []).map((cls, cIndex) => 
                cIndex === classIndex 
                  ? {
                      ...cls,
                      rounds: (cls.rounds || []).map((round, rIndex) => 
                        rIndex === roundIndex ? { ...round, [field]: value } : round
                      )
                    }
                  : cls
              )
            }
          : day
      )
    }));
  };

  const updateFeeConfiguration = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      feeConfiguration: {
        ...prev.feeConfiguration,
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // Show loading while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trial data...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session || session.user.role !== 'trial_secretary') {
    return null;
  }

  if (error && !trial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/secretary')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => router.push(`/trials/${trialId}`)} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trial
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Trial</h1>
              <p className="text-gray-600">Make changes to trial structure and settings</p>
            </div>
          </div>
          <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
            {formData.status}
          </Badge>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clubName">Club Name *</Label>
                <Input
                  id="clubName"
                  value={formData.clubName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clubName: e.target.value }))}
                  placeholder="Enter club name"
                />
              </div>
              <div>
                <Label htmlFor="secretary">Trial Secretary *</Label>
                <Input
                  id="secretary"
                  value={formData.secretary}
                  onChange={(e) => setFormData(prev => ({ ...prev, secretary: e.target.value }))}
                  placeholder="Enter secretary name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Trial Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fee Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Entry Fee Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="regularFee">Regular Entry ($)</Label>
                <Input
                  id="regularFee"
                  type="number"
                  step="0.01"
                  value={formData.feeConfiguration.regular}
                  onChange={(e) => updateFeeConfiguration('regular', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="feoFee">FEO Entry ($)</Label>
                <Input
                  id="feoFee"
                  type="number"
                  step="0.01"
                  value={formData.feeConfiguration.feo}
                  onChange={(e) => updateFeeConfiguration('feo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="juniorFee">Junior Handler ($)</Label>
                <Input
                  id="juniorFee"
                  type="number"
                  step="0.01"
                  value={formData.feeConfiguration.juniorHandler}
                  onChange={(e) => updateFeeConfiguration('juniorHandler', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="juniorFeoFee">Junior FEO ($)</Label>
                <Input
                  id="juniorFeoFee"
                  type="number"
                  step="0.01"
                  value={formData.feeConfiguration.juniorHandlerFeo}
                  onChange={(e) => updateFeeConfiguration('juniorHandlerFeo', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial Days */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Trial Days & Classes
              </div>
              <Button onClick={addDay} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Day
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.days.map((day, dayIndex) => (
              <div key={dayIndex} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Day {day.dayNumber}</h3>
                  <Button
                    onClick={() => removeDay(dayIndex)}
                    variant="destructive"
                    size="sm"
                    disabled={formData.days.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-4">
                  <Label htmlFor={`date-${dayIndex}`}>Date *</Label>
                  <Input
                    id={`date-${dayIndex}`}
                    type="date"
                    value={day.date}
                    onChange={(e) => updateDay(dayIndex, 'date', e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Classes</h4>
                    <Button
                      onClick={() => addClass(dayIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Class
                    </Button>
                  </div>

                  {(day.classes || []).map((cls, classIndex) => (
                    <div key={classIndex} className="border rounded p-3 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">
                          Class {classIndex + 1}
                          {cls.className && cls.subclass && ` - ${cls.className} ${cls.subclass}`}
                          {cls.className && !cls.subclass && !isGamesClass(cls.className) && ` - ${cls.className}`}
                        </h5>
                        <Button
                          onClick={() => removeClass(dayIndex, classIndex)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mb-3">
                        <Label htmlFor={`class-${dayIndex}-${classIndex}`}>Class Name *</Label>
                        <Select
                          value={cls.className}
                          onValueChange={(value) => updateClass(dayIndex, classIndex, 'className', value)}
                        >
                          <SelectTrigger>
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

                      {/* Games Subclass Selection */}
                      {isGamesClass(cls.className) && (
                        <div className="mb-3">
                          <Label htmlFor={`subclass-${dayIndex}-${classIndex}`}>Games Subclass *</Label>
                          <Select
                            value={cls.subclass || ''}
                            onValueChange={(value) => updateClass(dayIndex, classIndex, 'subclass', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select games subclass" />
                            </SelectTrigger>
                            <SelectContent>
                              {GAMES_SUBCLASSES.map((subclass) => (
                                <SelectItem key={subclass.value} value={subclass.value}>
                                  {subclass.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-medium">Rounds</h6>
                          <Button
                            onClick={() => addRound(dayIndex, classIndex)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Round
                          </Button>
                        </div>

                        {(cls.rounds || []).map((round, roundIndex) => (
                          <div key={roundIndex} className="flex items-center space-x-2">
                            <div className="flex-1">
                              <Label className="text-xs">Judge Name</Label>
                              <Select
                                value={round.judgeName}
                                onValueChange={(value) => updateRound(dayIndex, classIndex, roundIndex, 'judgeName', value)}
                              >
                                <SelectTrigger className="h-8">
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
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`feo-${dayIndex}-${classIndex}-${roundIndex}`}
                                checked={round.feoAvailable}
                                onChange={(e) => updateRound(dayIndex, classIndex, roundIndex, 'feoAvailable', e.target.checked)}
                                className="w-4 h-4"
                              />
                              <Label htmlFor={`feo-${dayIndex}-${classIndex}-${roundIndex}`} className="text-xs">
                                FEO
                              </Label>
                            </div>
                            <Button
                              onClick={() => removeRound(dayIndex, classIndex, roundIndex)}
                              variant="destructive"
                              size="sm"
                              disabled={(cls.rounds || []).length === 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Button
            onClick={() => router.push(`/trials/${trialId}`)}
            variant="outline"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}