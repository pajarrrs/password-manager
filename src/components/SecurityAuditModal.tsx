import React from 'react';
import { useVault } from '../context/VaultContext';
import { LoginItem, VaultItem } from '../types/vault';
import { evaluatePasswordStrength } from '../services/passwordGenerator';
import {
  X,
  ShieldCheck,
  Copy,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFixItem: (item: VaultItem) => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  onSelectFixItem,
}) => {
  const { items } = useVault();

  if (!isOpen) return null;

  const logins = items.filter((i): i is LoginItem => i.type === 'login');

  const weakLogins: { item: LoginItem; score: number; label: string }[] = [];
  const passwordMap = new Map<string, LoginItem[]>();
  const missing2FA: LoginItem[] = [];

  logins.forEach((l) => {
    if (l.password) {
      const strength = evaluatePasswordStrength(l.password);
      if (strength.score < 50) {
        weakLogins.push({ item: l, score: strength.score, label: strength.label });
      }

      const existing = passwordMap.get(l.password) || [];
      existing.push(l);
      passwordMap.set(l.password, existing);
    }

    if (!l.totpSecret) {
      missing2FA.push(l);
    }
  });

  const reusedGroups: { passwordSnippet: string; items: LoginItem[] }[] = [];
  passwordMap.forEach((group, pwd) => {
    if (group.length > 1) {
      reusedGroups.push({
        passwordSnippet: pwd.slice(0, 2) + '••••' + pwd.slice(-2),
        items: group,
      });
    }
  });

  let healthScore = 100;
  if (logins.length > 0) {
    const weakPenalty = (weakLogins.length / logins.length) * 45;
    const reusedCount = reusedGroups.reduce((acc, g) => acc + g.items.length, 0);
    const reusedPenalty = (reusedCount / logins.length) * 40;
    const missing2FAPenalty = (missing2FA.length / logins.length) * 15;
    healthScore = Math.max(0, Math.round(100 - (weakPenalty + reusedPenalty + missing2FAPenalty)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-white">Vault Security Audit</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Health Score Overview */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">
                Vault Health Rating
              </div>
              <div className="text-xs text-zinc-300">
                {healthScore >= 80
                  ? 'Excellent security posture'
                  : healthScore >= 50
                  ? 'Some accounts require stronger passwords'
                  : 'Critical attention required on vulnerable items'}
              </div>
            </div>
            <div className="text-2xl font-mono font-medium text-white pl-4">
              {healthScore}%
            </div>
          </div>

          {/* Weak Passwords */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-400">
                Weak Passwords ({weakLogins.length})
              </span>
              <span className="text-[10px] text-zinc-500">Below threshold</span>
            </div>

            {weakLogins.length === 0 ? (
              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] text-xs text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sage-400 stroke-[1.75]" />
                <span>All passwords meet strength criteria.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {weakLogins.map(({ item, score, label }) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 flex items-center justify-between transition"
                  >
                    <div>
                      <div className="text-xs font-medium text-zinc-100">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {item.username || item.email || 'No username'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.04]">
                        {label} ({score}%)
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onSelectFixItem(item);
                        }}
                        className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium"
                      >
                        <span>Fix</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reused Passwords */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-400">
                Reused Passwords ({reusedGroups.length} groups)
              </span>
              <span className="text-[10px] text-zinc-500">Cross-account risk</span>
            </div>

            {reusedGroups.length === 0 ? (
              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/[0.05] text-xs text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sage-400 stroke-[1.75]" />
                <span>No password reuse detected.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {reusedGroups.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2"
                  >
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <Copy className="w-3 h-3 text-zinc-500" />
                      <span>Shared: {group.passwordSnippet}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            onClose();
                            onSelectFixItem(item);
                          }}
                          className="p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer text-xs text-zinc-200 flex justify-between items-center transition"
                        >
                          <span className="truncate">{item.title}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing 2FA */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <span className="text-xs text-zinc-300">
                {missing2FA.length} accounts missing 2FA keys
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">Optional</span>
          </div>
        </div>
      </div>
    </div>
  );
};
