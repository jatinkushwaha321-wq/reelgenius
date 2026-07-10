'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Creator Hub" 
        description="Welcome to your creator console. Plan, script, and manage your Instagram presence."
      />

      {/* Responsive Stat Cards with increased padding (p-8) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass p-8 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Ideas</span>
          <span className="text-3xl font-bold text-white">0</span>
        </div>
        <div className="glass p-8 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Scripts Written</span>
          <span className="text-3xl font-bold text-white">0</span>
        </div>
        <div className="glass p-8 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">In Pipeline</span>
          <span className="text-3xl font-bold text-white">0</span>
        </div>
        <div className="glass p-8 rounded-xl flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Published</span>
          <span className="text-3xl font-bold text-white">0</span>
        </div>
      </div>

      {/* Activity / Setup Placeholder Card */}
      <div className="glass p-8 rounded-xl border border-white/5 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <PlusCircle className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-white">Get Started</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Before you can generate content strategies or write scripts, you need to analyze your Instagram profile to help ReelGenius understand your niche, style, and target audience.
        </p>
        <Link href="/dashboard/analyzer">
          <Button className="gradient-primary text-white">
            Analyze Instagram Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
