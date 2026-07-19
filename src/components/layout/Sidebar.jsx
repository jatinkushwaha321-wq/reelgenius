'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Lightbulb, User, LogOut, Loader2, FileText, Compass } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Activity, label: 'Overview', href: '/dashboard' },
  { icon: Compass, label: 'Strategy', href: '/dashboard/strategy' },
  { icon: Lightbulb, label: 'Ideas', href: '/dashboard/ideas' },
  { icon: FileText, label: 'Scripts', href: '/dashboard/scripts' },
];

const systemItems = [
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
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

  const renderNavLink = (item) => {
    // Exact match for most, prefix match for scripts
    const isActive = item.href === '/dashboard/scripts' 
      ? pathname.startsWith('/dashboard/scripts')
      : pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleLinkClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative cursor-pointer select-none",
          isActive
            ? "text-white/90 bg-white/[0.06]"
            : "text-white/40 hover:text-white/65 hover:bg-white/[0.03]",
          isLoggingOut && "pointer-events-none opacity-50"
        )}
      >
        {/* Active indicator — restrained violet dot */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-violet-400/60"
            aria-hidden="true"
          />
        )}
        <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    );
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
          width: 260
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          maxWidth: isMobile ? 300 : 'none'
        }}
        className={cn(
          "flex flex-col h-screen fixed left-0 top-0 z-40",
          "bg-[#070712] border-r border-white/[0.04]",
          isMobile && "shadow-2xl shadow-black/80"
        )}
      >
        {/* ---- NIVO Wordmark ---- */}
        <div className="flex items-center h-16 px-5 shrink-0">
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className="flex items-center gap-0 select-none"
          >
            <span className="text-[15px] font-semibold tracking-tight text-white/90">
              NIVO
            </span>
            <span className="text-white/20 mx-1.5">/</span>
          </Link>
        </div>

        {/* ---- Primary Navigation ---- */}
        <nav className="flex-1 pt-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {systemItems.map(renderNavLink)}

          {/* Subtle rule separating workspace from system */}
          <div className="my-3 mx-2 h-px bg-white/[0.04]" aria-hidden="true" />

          {navItems.map(renderNavLink)}
        </nav>

        {/* ---- Sign Out ---- */}
        <div className="p-3 border-t border-white/[0.04]">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            aria-label="Sign out"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium",
              "text-white/30 hover:text-white/50 hover:bg-white/[0.03]",
              "w-full transition-all duration-200 cursor-pointer",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
            ) : (
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            )}
            <span className="whitespace-nowrap">
              {isLoggingOut ? 'Signing out…' : 'Sign Out'}
            </span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
