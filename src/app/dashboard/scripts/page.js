'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Film } from 'lucide-react';

export default function ScriptsPlaceholder() {
  return (
    <div>
      <PageHeader title="Script Studio" description="Write production-grade video scripts." />
      <EmptyState 
        icon={Film}
        title="No scripts generated yet"
        description="Select an idea from your content calendar to generate hook hooks, dialogues, shot lists, and captions."
        actionText="Write Script"
        onAction={() => alert('Feature coming in M8')}
      />
    </div>
  );
}
