'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutDashboard, Search, Calendar, Film, Palette, Kanban, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
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
  const { sidebarOpen, closeSidebar } = useUIStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor resize to apply scroll locks and trigger layout changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Control body scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen, isMobile]);

  // Accessibility: Close mobile sidebar drawer on Escape key presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen, closeSidebar]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout operation failed:', error);
      setIsLoggingOut(false);
    }
  };

  // Close the sidebar if clicking a link while on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Dark backdrop overlay for mobile screen drawer */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={isMobile ? { 
          x: sidebarOpen ? 0 : '-100%',
          width: '80vw'
        } : {
          x: 0,
          width: 280
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          maxWidth: isMobile ? 300 : 'none'
        }}
        className={cn(
          "flex flex-col h-screen fixed left-0 top-0 border-r border-white/5 bg-[#0a0a1a] z-40",
          isMobile && "shadow-2xl shadow-black/80"
        )}
      >
        {/* Logo / Header Segment - Simplified static layout without toggle triggers */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">ReelGenius</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer",
                  isActive
                    ? "gradient-primary text-white shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5",
                  isLoggingOut && "pointer-events-none opacity-50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Footer */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            aria-label="Sign out"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 shrink-0" />
            )}
            <span className="whitespace-nowrap">
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
