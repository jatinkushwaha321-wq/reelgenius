'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Search } from 'lucide-react';

export default function AnalyzerPlaceholder() {
  return (
    <div>
      <PageHeader title="Profile Analyzer" description="Analyze your Instagram niche, style, and audience." />
      <EmptyState 
        icon={Search}
        title="No profiles analyzed yet"
        description="Analyze your first Instagram profile to extract niche data, content pillars, and edit your brand identity."
        actionText="Start Analysis"
        onAction={() => alert('Feature coming in M6')}
      />
    </div>
  );
}
