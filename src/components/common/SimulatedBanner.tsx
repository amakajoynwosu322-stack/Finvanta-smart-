import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, X } from 'lucide-react';

export const SimulatedBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-[#171225] via-[#211638] to-[#171225] border-b border-[#8B5CF6]/30 px-4 py-2.5 text-xs text-[#C4B5FD] flex items-center justify-between z-30">
      <div className="flex items-center gap-2.5 mx-auto">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#B66DFF] font-semibold tracking-wide uppercase text-[10px]">
          <Shield className="w-3 h-3 text-[#B66DFF]" />
          Sandbox Protocol
        </span>
        <span className="text-slate-300 font-medium">
          Simulated Yield Protocol: All transactions, deposits, and balances operate in a live demonstration sandbox.
        </span>
        <span className="hidden md:inline-flex items-center gap-1 text-[#B66DFF]/90">
          <CheckCircle className="w-3 h-3 text-[#B66DFF]" />
          No real funds required.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
