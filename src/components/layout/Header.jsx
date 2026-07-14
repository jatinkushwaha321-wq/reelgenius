'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  
  const getTitle = () => {
    const segment = pathname.split('/').pop();
    if (segment === 'dashboard') return 'Overview';
    if (segment === 'ideas') return 'Ideas';
    if (segment === 'profile') return 'Profile';
    return 'NIVO';
  };

  return (
    <header className="h-14 border-b border-white/[0.04] flex items-center px-5 sticky top-0 bg-[#070712]/90 backdrop-blur-md z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 rounded-md text-white/30 hover:text-white/60 cursor-pointer transition-colors duration-200"
        >
          <Menu className="h-4.5 w-4.5" strokeWidth={1.5} />
        </button>
        <span className="text-[13px] font-medium tracking-wide text-white/50 uppercase">
          {getTitle()}
        </span>
      </div>
    </header>
  );
}
