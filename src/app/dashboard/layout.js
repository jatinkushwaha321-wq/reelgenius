'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUIStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      <Sidebar />
      
      <motion.div
        animate={{ paddingLeft: sidebarOpen ? 260 : 70 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <Header />
        
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
