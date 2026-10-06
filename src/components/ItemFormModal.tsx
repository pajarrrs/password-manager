import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { VaultItem, ItemType } from '../types/vault';
import {
  X,
  Key,
  FileText,
  CreditCard,
  User,
  Sparkles,
  Eye,
  EyeOff,
  Star,
  Plus,
  Trash2,
} from 'lucide-react';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: VaultItem | null;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  initialItem,
}) => {
  const { addItem, updateItem, folders } = useVault();

  const [type, setType] = useState<ItemType>('login');
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Login specific
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [urls, setUrls] = useState<string[]>(['']);
  const [totpSecret, setTotpSecret] = useState('');

  // Note specific
  const [content, setContent] = useState('');

  // Card specific
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [brand, setBrand] = useState('Visa');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [pin, setPin] = useState('');

  // Identity specific
  const [fullName, setFullName] = useState('');
  const [idType, setIdType] = useState('KTP');
  const [idNumber, setIdNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [showGeneratorModal, setShowGeneratorModal] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setType(initialItem.type);
      setTitle(initialItem.title || '');
      setFolderId(initialItem.folderId || '');
      setIsFavorite(!!initialItem.isFavorite);
      setTagsInput(initialItem.tags ? initialItem.tags.join(', ') : '');
      setNotes(initialItem.notes || '');

      if (initialItem.type === 'login') {
        setUsername(initialItem.username || '');
        setEmail(initialItem.email || '');
        setPassword(initialItem.password || '');
        setUrls(initialItem.urls?.length ? initialItem.urls : ['']);
        setTotpSecret(initialItem.totpSecret || '');
      } else if (initialItem.type === 'note') {
        setContent(initialItem.content || '');
      } else if (initialItem.type === 'card') {
        setCardholderName(initialItem.cardholderName || '');
        setCardNumber(initialItem.cardNumber || '');
        setBrand(initialItem.brand || 'Visa');
        setExpMonth(initialItem.expMonth || '');
        setExpYear(initialItem.expYear || '');
        setCvv(initialItem.cvv || '');
        setPin(initialItem.pin || '');
      } else if (initialItem.type === 'identity') {
        setFullName(initialItem.fullName || '');
        setIdType(initialItem.idType || 'KTP');
        setIdNumber(initialItem.idNumber || '');
        setBirthDate(initialItem.birthDate || '');
        setAddress(initialItem.address || '');
        setPhoneNumber(initialItem.phoneNumber || '');
      }
    } else {
      setType('login');
      setTitle('');
      setFolderId('');
      setIsFavorite(false);
      setTagsInput('');
      setNotes('');
      setUsername('');
      setEmail('');
      setPassword('');
      setUrls(['']);
      setTotpSecret('');
      setContent('');
      setCardholderName('');
      setCardNumber('');
      setBrand('Visa');
      setExpMonth('');
      setExpYear('');
      setCvv('');
      setPin('');
      setFullName('');
      setIdType('KTP');
      setIdNumber('');
      setBirthDate('');
      setAddress('');
      setPhoneNumber('');
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const baseData = {
      title: title.trim(),
      folderId: folderId || undefined,
      isFavorite,
      tags,
      notes: notes.trim() || undefined,
    };

    let itemPayload: any;

    if (type === 'login') {
      itemPayload = {
        ...baseData,
        type: 'login',
        username: username.trim() || undefined,
        email: email.trim() || undefined,
        password: password || undefined,
        urls: urls.map((u) => u.trim()).filter((u) => u.length > 0),
        totpSecret: totpSecret.trim().replace(/\s/g, '') || undefined,
      };
    } else if (type === 'note') {
      itemPayload = {
        ...baseData,
        type: 'note',
        content,
      };
    } else if (type === 'card') {
      itemPayload = {
        ...baseData,
        type: 'card',
        cardholderName: cardholderName.trim() || undefined,
        cardNumber: cardNumber.replace(/\s/g, '') || undefined,
        brand,
        expMonth,
        expYear,
        cvv: cvv.trim() || undefined,
        pin: pin.trim() || undefined,
      };
    } else if (type === 'identity') {
      itemPayload = {
        ...baseData,
        type: 'identity',
        fullName: fullName.trim() || undefined,
        idType,
        idNumber: idNumber.trim() || undefined,
        birthDate: birthDate || undefined,
        address: address.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      };
    }

    if (initialItem) {
      await updateItem({ ...itemPayload, id: initialItem.id, createdAt: initialItem.createdAt });
    } else {
      await addItem(itemPayload);
    }

    onClose();
  };

  const handleUrlChange = (index: number, val: string) => {
    const updated = [...urls];
    updated[index] = val;
    setUrls(updated);
  };

  const addUrlField = () => setUrls([...urls, '']);
  const removeUrlField = (idx: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== idx));
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-obsidian-900 border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-medium text-white">
              {initialItem ? 'Edit item' : 'New item'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Category Selector */}
            {!initialItem && (
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                {[
                  { id: 'login', label: 'Login', icon: Key },
                  { id: 'note', label: 'Note', icon: FileText },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'identity', label: 'Identity', icon: User },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const active = type === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id as ItemType)}
                      className={`flex flex-col items-center py-2 rounded-lg text-xs font-medium transition ${
                        active
                          ? 'bg-white/[0.1] text-white'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1 stroke-[1.75]" />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* General Fields */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. GitHub, Google, Wi-Fi"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-500 glass-input"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-2 rounded-xl border transition ${
                      isFavorite
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-amber-400'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Folder
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs text-zinc-300 glass-input"
                  >
                    <option value="" className="bg-obsidian-900">(No Folder)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id} className="bg-obsidian-900">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="dev, personal, finance"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-500 glass-input"
                  />
                </div>
              </div>
            </div>

            {/* Type Specific Fields */}
            {type === 'login' && (
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-500 glass-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@mail.com"
                      className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-500 glass-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGeneratorModal(true)}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-sage-400" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3 py-2 rounded-xl text-xs text-white glass-input font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* URLs */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                      Websites
                    </label>
                    <button
                      type="button"
                      onClick={addUrlField}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {urls.map((u, i) => (
                      <div key={i} className="flex gap-1.5">
                        <input
                          type="url"
                          value={u}
                          onChange={(e) => handleUrlChange(i, e.target.value)}
                          placeholder="https://example.com"
                          className="flex-1 px-3 py-1.5 rounded-xl text-xs text-white placeholder-zinc-500 glass-input font-mono"
                        />
                        {urls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrlField(i)}
                            className="p-1.5 text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOTP */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    2FA / TOTP Secret Key
                  </label>
                  <input
                    type="text"
                    value={totpSecret}
                    onChange={(e) => setTotpSecret(e.target.value)}
                    placeholder="Base32 Key (e.g. JBSWY3DPEHPK3PXP)"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white font-mono glass-input uppercase placeholder-zinc-500"
                  />
                </div>
              </div>
            )}

            {/* Note Specific */}
            {type === 'note' && (
              <div className="pt-3 border-t border-white/[0.06]">
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Secret Note Content
                </label>
                <textarea
                  rows={7}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste private keys, seed phrases, configs..."
                  className="w-full px-3 py-2 rounded-xl text-xs text-white font-mono glass-input"
                />
              </div>
            )}

            {/* Card Specific */}
            {type === 'card' && (
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Brand
                    </label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs text-zinc-300 glass-input"
                    >
                      <option value="Visa" className="bg-obsidian-900">Visa</option>
                      <option value="Mastercard" className="bg-obsidian-900">Mastercard</option>
                      <option value="BCA" className="bg-obsidian-900">BCA / GPN</option>
                      <option value="JCB" className="bg-obsidian-900">JCB</option>
                      <option value="Amex" className="bg-obsidian-900">Amex</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Cardholder
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="NAME"
                      className="w-full px-3 py-2 rounded-xl text-xs text-white uppercase glass-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white font-mono glass-input"
                  />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">MM</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                      placeholder="12"
                      className="w-full px-2 py-1.5 rounded-xl text-xs text-white text-center font-mono glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">YYYY</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      placeholder="2028"
                      className="w-full px-2 py-1.5 rounded-xl text-xs text-white text-center font-mono glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full px-2 py-1.5 rounded-xl text-xs text-white text-center font-mono glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">PIN</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-2 py-1.5 rounded-xl text-xs text-white text-center font-mono glass-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Identity Specific */}
            {type === 'identity' && (
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      ID Type
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs text-zinc-300 glass-input"
                    >
                      <option value="KTP" className="bg-obsidian-900">KTP</option>
                      <option value="SIM" className="bg-obsidian-900">SIM</option>
                      <option value="Passport" className="bg-obsidian-900">Passport</option>
                      <option value="NPWP" className="bg-obsidian-900">NPWP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      ID Number
                    </label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="3171xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl text-xs text-white font-mono glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Legal Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 rounded-xl text-xs text-white glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs text-zinc-300 glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+62 8..."
                      className="w-full px-3 py-2 rounded-xl text-xs text-white font-mono glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address..."
                    className="w-full px-3 py-2 rounded-xl text-xs text-white glass-input"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="pt-3 border-t border-white/[0.06]">
              <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 rounded-xl text-xs text-white glass-input"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 font-medium rounded-xl text-xs transition shadow-sm"
              >
                {initialItem ? 'Save Changes' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PasswordGeneratorModal
        isOpen={showGeneratorModal}
        onClose={() => setShowGeneratorModal(false)}
        onSelectPassword={(pwd) => setPassword(pwd)}
      />
    </>
  );
};
