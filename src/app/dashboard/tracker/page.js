'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Kanban } from 'lucide-react';

export default function TrackerPlaceholder() {
  return (
    <div>
      <PageHeader title="Content Pipeline" description="Manage stages from ideas to publishing." />
      <EmptyState 
        icon={Kanban}
        title="Your pipeline is empty"
        description="Generate a weekly or monthly content calendar from the planner module to automatically fill your Kanban columns."
        actionText="Plan Content Strategy"
        onAction={() => alert('Feature coming in M7')}
      />
    </div>
  );
}
