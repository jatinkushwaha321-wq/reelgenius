'use client';

import { Menu, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  
  const getTitle = () => {
    const segment = pathname.split('/').pop();
    if (segment === 'dashboard') return 'Dashboard';
    if (segment === 'analyzer') return 'Profile Analyzer';
    if (segment === 'strategy') return 'Strategy Planner';
    if (segment === 'scripts') return 'Script Studio';
    if (segment === 'covers') return 'Cover Designer';
    if (segment === 'tracker') return 'Content Pipeline';
    return 'NIVO';
  };

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 bg-[#0a0a1a]/85 backdrop-blur-md z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 rounded-md border border-white/5 text-muted-foreground hover:text-white cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-white tracking-tight">{getTitle()}</h2>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-secondary border border-white/5 flex items-center justify-center text-muted-foreground hover:text-white cursor-pointer">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
