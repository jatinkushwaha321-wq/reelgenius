'use client';

import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, Search, Calendar, Film, Palette, Kanban, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Search, label: 'Profile Analyzer', href: '/dashboard/analyzer' },
  { icon: Calendar, label: 'Strategy Planner', href: '/dashboard/strategy' },
  { icon: Film, label: 'Script Studio', href: '/dashboard/scripts' },
  { icon: Palette, label: 'Cover Designer', href: '/dashboard/covers' },
  { icon: Kanban, label: 'Content Pipeline', href: '/dashboard/tracker' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 70 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-white/5 bg-[#0a0a1a] z-30"
    >
      {/* Logo / Header Segment */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">ReelGenius</span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md border border-white/5 hover:bg-white/5 text-muted-foreground hover:text-white cursor-pointer"
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer",
                isActive
                  ? "gradient-primary text-white shadow-lg shadow-primary/10"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Footer */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => window.location.href = '/'}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all cursor-pointer"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span className="whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
