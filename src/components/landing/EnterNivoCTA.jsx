'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

/**
 * EnterNivoCTA — Session-aware product-entry CTA
 *
 * Routing contract:
 *   Authenticated   → /dashboard
 *   Unauthenticated → /register
 *
 * Uses the built-in Auth.js /api/auth/session endpoint
 * to determine auth state on click. This avoids requiring
 * a SessionProvider wrapper or useSession hook.
 */
export default function EnterNivoCTA() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  const handleClick = useCallback(async () => {
    if (navigating) return;
    setNavigating(true);

    try {
      const res = await fetch('/api/auth/session');
      const session = await res.json();

      if (session?.user) {
        router.push('/dashboard');
      } else {
        router.push('/register');
      }
    } catch {
      // Network error — fall back to register
      router.push('/register');
    }
  }, [navigating, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={navigating}
      className="
        nivo-glass-strong nivo-glass-no-top-edge
        inline-flex items-center gap-2.5
        rounded-full
        px-7 py-3
        text-[13px] font-semibold tracking-[0.15em] text-white/90 uppercase
        transition-all duration-200
        hover:scale-[1.03] hover:text-white
        active:scale-[0.98]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
        disabled:opacity-60 disabled:pointer-events-none
        cursor-pointer
      "
      aria-label="Enter NIVO"
    >
      <span>Enter NIVO</span>
      <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
