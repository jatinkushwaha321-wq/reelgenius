'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Palette } from 'lucide-react';

export default function CoversPlaceholder() {
  return (
    <div>
      <PageHeader title="Cover Designer" description="Create visual thumbnail directions and layout blueprints." />
      <EmptyState 
        icon={Palette}
        title="No covers designed yet"
        description="Design cover blueprints for your scripts, complete with headline positions, color pallette guides, and prompt models."
        actionText="Design Cover"
        onAction={() => alert('Feature coming in M9')}
      />
    </div>
  );
}
