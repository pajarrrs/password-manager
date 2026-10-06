import React from 'react';
import { useVault } from '../context/VaultContext';
import {
  Shield,
  Search,
  Lock,
  Sparkles,
  ShieldAlert,
  Settings,
  Plus,
} from 'lucide-react';
import { LoginItem } from '../types/vault';
import { evaluatePasswordStrength } from '../services/passwordGenerator';

interface NavbarProps {
  onOpenNewItem: () => void;
  onOpenGenerator: () => void;
  onOpenAudit: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewItem,
  onOpenGenerator,
  onOpenAudit,
  onOpenSettings,
}) => {
  const { lockVault, searchQuery, setSearchQuery, items } = useVault();

  // Audit status
  const logins = items.filter((i): i is LoginItem => i.type === 'login');
  let hasWeak = false;
  for (const l of logins) {
    if (l.password && evaluatePasswordStrength(l.password).score < 50) {
      hasWeak = true;
      break;
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-obsidian-950/80 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-zinc-300 stroke-[1.75]" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white hidden sm:inline">
            KeyVault
          </span>
        </div>

        {/* Minimal Search Bar */}
        <div className="flex-1 max-w-sm relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, tags..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-zinc-500 bg-white/[0.03] border border-white/[0.07] focus:border-white/20 focus:bg-white/[0.05] transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewItem}
            className="h-8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span className="hidden sm:inline">New</span>
          </button>

          <div className="h-4 w-px bg-white/[0.08] mx-1 hidden sm:block" />

          <button
            onClick={onOpenGenerator}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            title="Password Generator"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>

          <button
            onClick={onOpenAudit}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition relative"
            title="Security Audit"
          >
            <ShieldAlert className="w-3.5 h-3.5 stroke-[1.75]" />
            {hasWeak && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>

          <button
            onClick={lockVault}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-white/[0.06] transition"
            title="Lock Vault"
          >
            <Lock className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </header>
  );
};
