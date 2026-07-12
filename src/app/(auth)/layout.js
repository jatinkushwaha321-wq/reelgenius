import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 noise-bg">
      {/* Ambient backing glow orb */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-glow" />
      </div>

      {/* Brand logo link to landing page */}
      <Link href="/" className="flex items-center gap-2 mb-8 z-10 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">NIVO /</span>
      </Link>

      {/* Centered Auth Card */}
      <div className="w-full max-w-md glass rounded-2xl p-8 z-10 shadow-2xl relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
