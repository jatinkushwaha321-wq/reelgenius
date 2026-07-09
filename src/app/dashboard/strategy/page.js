'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Calendar } from 'lucide-react';

export default function StrategyPlaceholder() {
  return (
    <div>
      <PageHeader title="Strategy Planner" description="Plan weekly/monthly content pipelines." />
      <EmptyState 
        icon={Calendar}
        title="No strategies created yet"
        description="Create your first content strategy calendar based on your analyzed profile niches."
        actionText="Plan Content"
        onAction={() => alert('Feature coming in M7')}
      />
    </div>
  );
}
