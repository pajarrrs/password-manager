import React, { useState, useEffect } from 'react';
import { generateTOTP } from '../services/crypto';
import { Copy, Check } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

interface TotpBadgeProps {
  secret: string;
}

export const TotpBadge: React.FC<TotpBadgeProps> = ({ secret }) => {
  const [code, setCode] = useState('------');
  const [remaining, setRemaining] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const update = async () => {
      const res = await generateTOTP(secret);
      if (isMounted) {
        setCode(res.code);
        setRemaining(res.remainingSeconds);
      }
    };

    update();
    const interval = setInterval(update, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [secret]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await Clipboard.write({ string: code });
    } catch {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!secret) return null;

  const formattedCode = code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;

  // Percentage for subtle circular or line timer
  const progressPercent = (remaining / 30) * 100;

  return (
    <div
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.07] text-zinc-300 cursor-pointer transition group"
      title="Click to copy 2FA OTP code"
    >
      {/* Micro progress indicator */}
      <div className="relative w-3.5 h-3.5 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/[0.1]"
            strokeWidth="4"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={`${remaining <= 5 ? 'text-red-400' : 'text-zinc-300'} transition-all duration-1000`}
            strokeDasharray={`${progressPercent}, 100`}
            strokeWidth="4"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      </div>

      <span className="font-mono text-xs tracking-wider text-zinc-100 font-medium">
        {formattedCode}
      </span>

      <span className="text-[10px] text-zinc-500 font-mono">
        {remaining}s
      </span>

      {copied ? (
        <Check className="w-3 h-3 text-sage-400" />
      ) : (
        <Copy className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
      )}
    </div>
  );
};
