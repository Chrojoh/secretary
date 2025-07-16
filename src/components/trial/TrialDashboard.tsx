'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Share
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { getUserTrials, deleteTrial } from '@/lib/trial-operations';

interface Trial {
  id: string;
  club_name: string;
  secretary_name: string;
  created_by: string;
  trial_dates: any;
  fee_configuration: any;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

const TrialDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [trials, setTrials] = useState<Trial[]>([]);
  const [filteredTrials, setFilteredTrials] = useState<Trial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
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

  // Load trials
  useEffect(() => {
    if (session?.user?.id) {
      loadTrials();
    }
  }, [session]);

  // Filter trials based on search and status
  useEffect(() => {
    let filtered = trials;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trial =>
        trial.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trial.secretary_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trial => trial.status === statusFilter);
    }

    setFilteredTrials(filtered);
  }, [trials, searchTerm, statusFilter]);

  const loadTrials = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserTrials(session.user.id);
      
      if (result.success && result.data) {
        setTrials(result.data);
      } else {
        setError(result.error || 'Failed to load trials');
      }
    } catch (error) {
      console.error('Error loading trials:', error);
      setError('Failed to load trials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrial = async (trialId: string, trialName: string) => {
    if (!session?.user?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${trialName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const result = await deleteTrial(trialId, session.user.id);
      
      if (result.success) {
        // Remove from local state
        setTrials(prev => prev.filter(trial => trial.id !== trialId));
        alert('Trial deleted successfully');
      } else {
        alert(`Failed to delete trial: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting trial:', error);
      alert('Failed to delete trial');
    }
  };

  const handleDuplicateTrial = (trial: Trial) => {
    // TODO: Implement trial duplication
    alert('Trial duplication feature coming soon!');
  };

  const copyTrialLink = (trialId: string) => {
    const link = `${window.location.origin}/trials/enter?trial=${trialId}`;
    navigator.clipboard.writeText(link);
    alert('Entry link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTrialDates = (trialDates: any) => {
    if (!trialDates || !Array.isArray(trialDates)) return 'No dates';
    
    const dates = trialDates.map(d => new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }));
    
    if (dates.length === 1) {
      return dates[0];
    } else if (dates.length <= 3) {
      return dates.join(', ');
    } else {
      return `${dates[0]} - ${dates[dates.length - 1]}`;
    }
  };

  const getTrialStats = (trial: Trial) => {
    const days = trial.trial_dates?.length || 0;
    // TODO: Get actual entry counts from database
    const entries = 0; // Placeholder
    
    return { days, entries };
  };

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trials...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session || session.user.role !== 'trial_secretary') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trials</h1>
              <p className="text-gray-600">
                Manage your C-WAGS trials and track entries
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/trials/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Trial
                </Button>
              </Link>
              <Link href="/dashboard/secretary">
                <Button variant="outline">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search trials by club name or secretary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({trials.length})
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Drafts ({trials.filter(t => t.status === 'draft').length})
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('published')}
              >
                Published ({trials.filter(t => t.status === 'published').length})
              </Button>
            </div>
          </div>

          {/* Trials Grid */}
          {filteredTrials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {trials.length === 0 ? 'No trials created yet' : 'No trials match your filters'}
                </h3>
                <p className="text-gray-500 text-center max-w-sm">
                  {trials.length === 0 
                    ? 'Get started by creating your first trial. You can set up days, classes, and rounds all in one place.'
                    : 'Try adjusting your search terms or filters to find the trials you\'re looking for.'
                  }
                </p>
                {trials.length === 0 && (
                  <Link href="/trials/create" className="mt-4">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Trial
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrials.map((trial) => {
                const stats = getTrialStats(trial);
                return (
                  <Card key={trial.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {trial.club_name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Secretary: {trial.secretary_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge 
                            variant={trial.status === 'published' ? 'default' : 'secondary'}
                            className={trial.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {trial.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/trials/${trial.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/trials/${trial.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Trial
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => copyTrialLink(trial.id)}
                              >
                                <Share className="h-4 w-4 mr-2" />
                                Copy Entry Link
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDuplicateTrial(trial)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Trial
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteTrial(trial.id, trial.club_name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Trial
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Trial Dates */}
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatTrialDates(trial.trial_dates)}
                        </div>

                        {/* Trial Stats */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            {stats.days} day{stats.days !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            {stats.entries} entries
                          </div>
                        </div>

                        {/* Fee Info */}
                        <div className="text-xs text-gray-500">
                          Regular: ${trial.fee_configuration?.regular || 0} • 
                          FEO: ${trial.fee_configuration?.feo || 0}
                        </div>

                        {/* Creation Date */}
                        <div className="text-xs text-gray-400 pt-2 border-t">
                          Created {formatDate(trial.created_at)}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3">
                          <Link href={`/trials/${trial.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/trials/${trial.id}/edit`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          {trial.status === 'published' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => copyTrialLink(trial.id)}
                              className="flex-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrialDashboard;