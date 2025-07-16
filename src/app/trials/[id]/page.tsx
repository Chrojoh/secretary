// src/app/trials/[id]/page.tsx
import TrialDetailView from '@/components/trial/TrialDetailView';

interface TrialDetailPageProps {
  params: {
    id: string;
  };
}

export default function TrialDetailPage({ params }: TrialDetailPageProps) {
  return <TrialDetailView trialId={params.id} />;
}