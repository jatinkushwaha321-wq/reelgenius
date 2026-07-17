'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUIStore } from '@/lib/store';

export default function DashboardLayout({ children }) {
  const { closeSidebar } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);

  // Monitor screen width resize actions
  useEffect(() => {
    const handleResize = () => {
      const mobileState = window.innerWidth < 768;
      setIsMobile(mobileState);
      
      // Auto-collapse sidebar if viewport is resized to mobile
      if (mobileState) {
        closeSidebar();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [closeSidebar]);

  // Centralized Onboarding / Navigation Guard
  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          setIsOnboardingChecked(true);
          return;
        }
        const json = await res.json();
        const profile = json.data?.profile;
        
        // Onboarding authority: CreatorProfile exists AND completed observation AND completed intelligence
        const isOnboarded = !!(
          profile &&
          (profile.displayName || profile.bio || profile.followerCount > 0) &&
          profile.aiSummary &&
          profile.analyzedAt
        );

        if (!isOnboarded && pathname !== '/dashboard/profile') {
          router.replace('/dashboard/profile');
        } else {
          setIsOnboardingChecked(true);
        }
      } catch (err) {
        setIsOnboardingChecked(true);
      }
    }

    checkOnboarding();
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-[#070712] text-white/90 overflow-x-hidden relative flex noise-bg">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Content territory */}
      <div className="flex flex-col min-h-screen w-full min-w-0 pl-0 md:pl-[260px]">
        <Header />
        
        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8 max-w-5xl w-full mx-auto min-w-0">
          {!isOnboardingChecked ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
