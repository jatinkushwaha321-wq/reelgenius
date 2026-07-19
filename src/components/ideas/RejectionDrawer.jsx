import React, { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * RejectionDrawer - Core UI Component
 * Slide-down micro-feedback panel to capture creator rejection rationale and update memory constraints.
 * 
 * @param {Object} props
 * @param {string} props.ideaId - The ID of the dismissed candidate
 * @param {Function} props.onConfirm - Callback when a reason is selected
 * @param {Function} props.onClose - Callback to close/skip the drawer
 */
export default function RejectionDrawer({ ideaId, onConfirm, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackLogged, setFeedbackLogged] = useState(false);

  const reasons = [
    { key: 'voice', label: 'Not my voice/tone' },
    { key: 'audience', label: "Audience wouldn't care" },
    { key: 'generic', label: 'Too broad/generic' },
    { key: 'duplicate', label: 'Already covered this' },
  ];

  const handleSelect = async (reasonKey) => {
    setSelectedReason(reasonKey);
    setIsSubmitting(true);
    
    try {
      // Execute the dismissal API call via parent handler
      await onConfirm(ideaId, reasonKey);
      setFeedbackLogged(true);
      
      // Auto-close after learning confirmation is read
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Failed to submit dismissal feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-4 rounded-xl border border-white/[0.04] bg-white/[0.015] flex flex-col gap-3.5 transition-all">
      {!feedbackLogged ? (
        <>
          <div className="flex items-center justify-between border-b border-white/[0.02] pb-2">
            <span className="text-[10px] font-medium tracking-nivo-wide uppercase text-white/40">
              Refine NIVO Direction
            </span>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="text-[10px] uppercase text-white/30 hover:text-white/60 select-none cursor-pointer"
            >
              Skip
            </button>
          </div>
          
          <div className="flex flex-col gap-1">
            <h4 className="text-[13px] font-medium text-white/80">To help NIVO learn, what missed the mark?</h4>
            <p className="text-[11px] text-white/30">Select a mismatch category to adjust future synthesis constraints.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            {reasons.map((r) => (
              <button
                key={r.key}
                disabled={isSubmitting}
                onClick={() => handleSelect(r.key)}
                className="flex items-center justify-between px-3.5 py-2.5 text-[12px] text-white/70 bg-white/[0.01] border border-white/[0.04] rounded-lg text-left hover:text-white/90 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{r.label}</span>
                {selectedReason === r.key && <Check className="h-3.5 w-3.5 text-violet-400" />}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="py-4 flex flex-col items-center justify-center text-center gap-2 animate-fade-in">
          <Check className="h-5 w-5 text-nivo-success" />
          <span className="text-[12px] font-medium text-nivo-success tracking-wide uppercase">
            Contradiction Logged
          </span>
          <p className="text-[11px] text-white/30 max-w-xs leading-relaxed mt-0.5">
            NIVO has registered this learning trace and will adjust candidate synthesis accordingly.
          </p>
        </div>
      )}
    </div>
  );
}
