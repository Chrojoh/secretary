'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Edit, 
  Share,
  Download,
  ArrowLeft,
  MapPin,
  User,
  Trophy,
  AlertCircle
} from 'lucide-react';
import { getTrialByIdDirect, type TrialWithRelations } from '@/lib/trial-operations';

interface TrialDetailProps {
  trialId: string;
}

const TrialDetailView: React.FC<TrialDetailProps> = ({ trialId }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [trial, setTrial] = useState<TrialWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load trial details
  useEffect(() => {
    if (session?.user?.id && trialId) {
      loadTrialDetails();
    }
  }, [session, trialId]);

  const loadTrialDetails = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const trialData = await getTrialByIdDirect(trialId, session.user.id);
      
      if (trialData) {
        setTrial(trialData);
      } else {
        setError('Trial not found or you do not have permission to view it');
      }
    } catch (error) {
      console.error('Error loading trial:', error);
      setError('Failed to load trial details');
    } finally {
      setIsLoading(false);
    }
  };

  const copyEntryLink = () => {
    const link = `${window.location.origin}/trials/enter?trial=${trialId}`;
    navigator.clipboard.writeText(link);
    alert('Entry link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getClassTypeIcon = (className: string) => {
    const lower = className.toLowerCase();
    if (lower.includes('patrol') || lower.includes('detective') || lower.includes('investigator') || lower.includes('sleuth')) {
      return '👃';
    } else if (lower.includes('rally') || lower.includes('zoom')) {
      return '🏃';
    } else if (lower.includes('games')) {
      return '🎯';
    } else if (lower.includes('obedience')) {
      return '🎖️';
    }
    return '📝';
  };

  const getTrialStats = () => {
    if (!trial) return { totalDays: 0, totalClasses: 0, totalRounds: 0, totalJudges: 0 };

    const totalDays = trial.trial_days?.length || 0;
    const totalClasses = trial.trial_days?.reduce((sum, day) => sum + (day.trial_classes?.length || 0), 0) || 0;
    const totalRounds = trial.trial_days?.reduce((sum, day) => 
      sum + (day.trial_classes?.reduce((classSum, cls) => classSum + (cls.trial_rounds?.length || 0), 0) || 0), 0) || 0;
    
    const judges = new Set();
    trial.trial_days?.forEach(day => {
      day.trial_classes?.forEach(cls => {
        cls.trial_rounds?.forEach(round => {
          judges.add(round.judge_name);
        });
      });
    });
    
    return { totalDays, totalClasses, totalRounds, totalJudges: judges.size };
  };

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trial details...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session || session.user.role !== 'trial_secretary') {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <div className="font-medium">Error Loading Trial</div>
              <div className="mt-1">{error}</div>
              <div className="mt-4">
                <Link href="/trials">
                  <Button variant="outline" size="sm">
                    ← Back to Trials
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!trial) {
    return null;
  }

  const stats = getTrialStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/trials">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Trials
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {trial.club_name}
                </h1>
                <p className="text-gray-600">
                  Trial Details • Secretary: {trial.secretary_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={trial.status === 'published' ? 'default' : 'secondary'}
                className={trial.status === 'published' ? 'bg-green-100 text-green-800' : ''}
              >
                {trial.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
              <Button variant="outline" onClick={copyEntryLink}>
                <Share className="h-4 w-4 mr-2" />
                Copy Entry Link
              </Button>
              <Link href={`/trials/${trial.id}/edit`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold">{stats.totalDays}</div>
                  <div className="text-sm text-gray-600">Trial Days</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Trophy className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                  <div className="text-sm text-gray-600">Classes</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold">{stats.totalRounds}</div>
                  <div className="text-sm text-gray-600">Rounds</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <User className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <div className="text-2xl font-bold">{stats.totalJudges}</div>
                  <div className="text-sm text-gray-600">Judges</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Trial Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Trial Days */}
              <Card>
                <CardHeader>
                  <CardTitle>Trial Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {trial.trial_days && trial.trial_days.length > 0 ? (
                    <div className="space-y-6">
                      {trial.trial_days
                        .sort((a, b) => a.day_number - b.day_number)
                        .map((day) => (
                        <div key={day.id} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">
                              Day {day.day_number}
                            </h3>
                            <Badge variant="outline">
                              {formatDate(day.trial_date)}
                            </Badge>
                          </div>
                          
                          {day.trial_classes && day.trial_classes.length > 0 ? (
                            <div className="space-y-3">
                              {day.trial_classes
                                .sort((a, b) => a.class_order - b.class_order)
                                .map((cls) => (
                                <Card key={cls.id} className="bg-gray-50">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-lg">
                                          {getClassTypeIcon(cls.class_name)}
                                        </span>
                                        <h4 className="font-medium">{cls.class_name}</h4>
                                      </div>
                                    </div>
                                    
                                    {cls.trial_rounds && cls.trial_rounds.length > 0 && (
                                      <div className="space-y-2">
                                        {cls.trial_rounds
                                          .sort((a, b) => a.round_number - b.round_number)
                                          .map((round) => (
                                          <div key={round.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                                            <div className="flex items-center space-x-2">
                                              <Badge variant="outline" className="text-xs">
                                                Round {round.round_number}
                                              </Badge>
                                              <span>Judge: {round.judge_name}</span>
                                            </div>
                                            {round.feo_available && (
                                              <Badge variant="secondary" className="text-xs">
                                                FEO Available
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No classes scheduled for this day</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No trial days configured</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Fee Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Entry Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Regular Entry:</span>
                      <span className="text-sm">${trial.fee_configuration?.regular || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">FEO Entry:</span>
                      <span className="text-sm">${trial.fee_configuration?.feo || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Junior Handler:</span>
                      <span className="text-sm">${trial.fee_configuration?.juniorHandler || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Junior FEO:</span>
                      <span className="text-sm">${trial.fee_configuration?.juniorHandlerFeo || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trial Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Trial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Created</div>
                    <div className="text-sm">{formatDate(trial.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Last Updated</div>
                    <div className="text-sm">{formatDate(trial.updated_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Status</div>
                    <Badge 
                      variant={trial.status === 'published' ? 'default' : 'secondary'}
                      className={trial.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {trial.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    View Entries (0)
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Trial Data
                  </Button>
                  <Button className="w-full" variant="outline" onClick={copyEntryLink}>
                    <Share className="h-4 w-4 mr-2" />
                    Share Entry Link
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrialDetailView;