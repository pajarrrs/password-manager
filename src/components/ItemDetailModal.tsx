import React, { useState } from 'react';
import { VaultItem } from '../types/vault';
import { useVault } from '../context/VaultContext';
import {
  X,
  Key,
  FileText,
  CreditCard,
  User,
  Star,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import { TotpBadge } from './TotpBadge';
import { Clipboard } from '@capacitor/clipboard';

interface ItemDetailModalProps {
  item: VaultItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { deleteItem, toggleFavorite } = useVault();
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      await Clipboard.write({ string: text });
    } catch {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${item.title}"?`)) {
      await deleteItem(item.id);
      onClose();
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case 'login':
        return <Key className="w-4 h-4 text-zinc-300 stroke-[1.75]" />;
      case 'note':
        return <FileText className="w-4 h-4 text-zinc-300 stroke-[1.75]" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-zinc-300 stroke-[1.75]" />;
      case 'identity':
        return <User className="w-4 h-4 text-zinc-300 stroke-[1.75]" />;
    }
  };

  const renderField = (label: string, value: string | undefined, keyName: string, isSecret = false) => {
    if (!value) return null;
    const isCopied = copiedKey === keyName;

    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between group hover:border-white/[0.1] transition">
        <div className="min-w-0 pr-3">
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">
            {label}
          </div>
          <div className="text-xs font-mono text-zinc-200 break-all select-all">
            {isSecret && !showSensitive ? '••••••••••••' : value}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isSecret && (
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
            >
              {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={() => copyToClipboard(value, keyName)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition"
            title="Copy"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-sage-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-medium text-white truncate">{item.title}</h2>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                {item.type}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleFavorite(item.id)}
              className={`p-1.5 rounded-lg border transition ${
                item.isFavorite
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-amber-400'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-zinc-400 hover:text-white transition"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-zinc-400 hover:text-red-400 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {item.type === 'login' && (
            <>
              {renderField('Username', item.username, 'username')}
              {renderField('Email', item.email, 'email')}
              {renderField('Password', item.password, 'password', true)}

              {item.totpSecret && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                      Two-Factor Authentication
                    </div>
                    <TotpBadge secret={item.totpSecret} />
                  </div>
                </div>
              )}

              {item.urls && item.urls.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-1">
                    Websites
                  </div>
                  {item.urls.map((url, i) => (
                    <a
                      key={i}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 text-xs text-zinc-300 group transition"
                    >
                      <span className="truncate">{url}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              )}
            </>
          )}

          {item.type === 'note' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                  Secure Note
                </span>
                <button
                  onClick={() => copyToClipboard(item.content, 'note-content')}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  {copiedKey === 'note-content' ? <Check className="w-3 h-3 text-sage-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'note-content' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-obsidian-950 border border-white/[0.06] text-xs font-mono text-zinc-200 whitespace-pre-wrap select-all">
                {item.content}
              </div>
            </div>
          )}

          {item.type === 'card' && (
            <>
              {renderField('Card Brand', item.brand, 'brand')}
              {renderField('Cardholder', item.cardholderName, 'cardholderName')}
              {renderField('Card Number', item.cardNumber, 'cardNumber', true)}
              <div className="grid grid-cols-2 gap-2">
                {renderField(
                  'Expires',
                  item.expMonth && item.expYear ? `${item.expMonth}/${item.expYear}` : undefined,
                  'exp'
                )}
                {renderField('CVV', item.cvv, 'cvv', true)}
              </div>
              {renderField('Card PIN', item.pin, 'pin', true)}
            </>
          )}

          {item.type === 'identity' && (
            <>
              {renderField('Legal Name', item.fullName, 'fullName')}
              <div className="grid grid-cols-2 gap-2">
                {renderField('ID Type', item.idType, 'idType')}
                {renderField('Number', item.idNumber, 'idNumber')}
              </div>
              {renderField('Birth Date', item.birthDate, 'birthDate')}
              {renderField('Phone', item.phoneNumber, 'phoneNumber')}
              {renderField('Address', item.address, 'address')}
            </>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.notes && (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                Notes
              </div>
              <p className="text-xs text-zinc-300 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
