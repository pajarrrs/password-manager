import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem, ItemType } from '../types/vault';
import {
  Key,
  FileText,
  CreditCard,
  User,
  Star,
  Copy,
  Check,
  Plus,
  Shield,
  Layers,
} from 'lucide-react';
import { TotpBadge } from './TotpBadge';
import { Clipboard } from '@capacitor/clipboard';

interface VaultListProps {
  onSelectItem: (item: VaultItem) => void;
  onOpenNewItem: () => void;
}

export const VaultList: React.FC<VaultListProps> = ({ onSelectItem, onOpenNewItem }) => {
  const {
    items,
    activeCategory,
    setActiveCategory,
    searchQuery,
    toggleFavorite,
  } = useVault();

  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const handleCopyPassword = async (e: React.MouseEvent, item: VaultItem) => {
    e.stopPropagation();
    let textToCopy = '';
    if (item.type === 'login' && item.password) {
      textToCopy = item.password;
    } else if (item.type === 'card' && item.cardNumber) {
      textToCopy = item.cardNumber;
    } else if (item.type === 'note') {
      textToCopy = item.content;
    }

    if (!textToCopy) return;

    try {
      await Clipboard.write({ string: textToCopy });
    } catch {
      navigator.clipboard.writeText(textToCopy);
    }

    setCopiedItemId(item.id);
    setTimeout(() => setCopiedItemId(null), 2000);
  };

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
  };

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'favorites' && !item.isFavorite) return false;
    if (activeCategory !== 'all' && activeCategory !== 'favorites' && item.type !== activeCategory) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();

    if (item.title.toLowerCase().includes(q)) return true;
    if (item.tags?.some((t) => t.toLowerCase().includes(q))) return true;
    if (item.notes?.toLowerCase().includes(q)) return true;

    if (item.type === 'login') {
      if (item.username?.toLowerCase().includes(q)) return true;
      if (item.email?.toLowerCase().includes(q)) return true;
      if (item.urls?.some((u) => u.toLowerCase().includes(q))) return true;
    } else if (item.type === 'card') {
      if (item.cardholderName?.toLowerCase().includes(q)) return true;
      if (item.brand?.toLowerCase().includes(q)) return true;
    } else if (item.type === 'identity') {
      if (item.fullName?.toLowerCase().includes(q)) return true;
      if (item.idNumber?.toLowerCase().includes(q)) return true;
    }

    return false;
  });

  const counts = {
    all: items.length,
    login: items.filter((i) => i.type === 'login').length,
    note: items.filter((i) => i.type === 'note').length,
    card: items.filter((i) => i.type === 'card').length,
    identity: items.filter((i) => i.type === 'identity').length,
    favorites: items.filter((i) => i.isFavorite).length,
  };

  const getItemIcon = (type: ItemType) => {
    switch (type) {
      case 'login':
        return <Key className="w-3.5 h-3.5 text-zinc-300 stroke-[1.75]" />;
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-zinc-300 stroke-[1.75]" />;
      case 'card':
        return <CreditCard className="w-3.5 h-3.5 text-zinc-300 stroke-[1.75]" />;
      case 'identity':
        return <User className="w-3.5 h-3.5 text-zinc-300 stroke-[1.75]" />;
    }
  };

  const getSubtitle = (item: VaultItem) => {
    switch (item.type) {
      case 'login':
        return item.username || item.email || (item.urls?.[0] ? item.urls[0].replace(/^https?:\/\//, '') : 'No username');
      case 'note':
        return item.content.slice(0, 40).replace(/\n/g, ' ') || 'Empty note';
      case 'card':
        return `${item.brand || 'Card'} •••• ${item.cardNumber ? item.cardNumber.slice(-4) : '••••'}`;
      case 'identity':
        return `${item.idType || 'ID'}: ${item.idNumber || item.fullName || 'No ID'}`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Sleek Segmented Category Control */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-white/[0.06] -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All', count: counts.all, icon: Layers },
          { id: 'login', label: 'Logins', count: counts.login, icon: Key },
          { id: 'note', label: 'Notes', count: counts.note, icon: FileText },
          { id: 'card', label: 'Cards', count: counts.card, icon: CreditCard },
          { id: 'identity', label: 'Identities', count: counts.identity, icon: User },
          { id: 'favorites', label: 'Favorites', count: counts.favorites, icon: Star },
        ].map((tab) => {
          const active = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-3 text-xs font-medium border-b-2 transition relative whitespace-nowrap ${
                active
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  active ? 'bg-white/[0.1] text-zinc-200' : 'bg-transparent text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item List / Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Shield className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200">
            {searchQuery ? 'No matching items' : 'Vault is empty'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? 'Try adjusting your search criteria.'
              : 'Add your first password, secret note, payment card, or ID.'}
          </p>
          {!searchQuery && (
            <button
              onClick={onOpenNewItem}
              className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 font-medium rounded-lg text-xs transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2]" /> Add first item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredItems.map((item) => {
            const hasQuickCopy =
              (item.type === 'login' && item.password) ||
              (item.type === 'card' && item.cardNumber) ||
              item.type === 'note';

            const isCopied = copiedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="p-3.5 rounded-xl bg-obsidian-900/60 border border-white/[0.06] hover:border-white/[0.14] hover:bg-obsidian-850/80 transition-all duration-200 cursor-pointer flex items-center justify-between group shadow-sm"
              >
                {/* Left: Icon & Title */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.07] transition">
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-100 truncate flex items-center gap-1.5">
                      <span className="truncate">{item.title}</span>
                      {item.isFavorite && (
                        <Star className="w-3 h-3 text-amber-400 fill-current flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate font-mono mt-0.5">
                      {getSubtitle(item)}
                    </div>
                    {/* Live TOTP Badge */}
                    {item.type === 'login' && item.totpSecret && (
                      <div className="mt-1.5">
                        <TotpBadge secret={item.totpSecret} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasQuickCopy && (
                    <button
                      onClick={(e) => handleCopyPassword(e, item)}
                      className={`p-1.5 rounded-lg transition border text-xs ${
                        isCopied
                          ? 'bg-sage-500/[0.15] border-sage-500/30 text-sage-400'
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                      title="Copy Secret"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <button
                    onClick={(e) => handleToggleFav(e, item.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        item.isFavorite ? 'text-amber-400 fill-current' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
