'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUIStore } from '@/lib/store';

export default function DashboardLayout({ children }) {
  const { closeSidebar } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-x-hidden relative flex">
      {/* Permanent Desktop / Slide-out Mobile Sidebar */}
      <Sidebar />
      
      {/* Static padding-left offset of 280px on desktop screens (md:pl-[280px]) */}
      <div className="flex flex-col min-h-screen w-full min-w-0 pl-0 md:pl-[280px]">
        <Header />
        
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
