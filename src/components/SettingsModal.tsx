import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import {
  X,
  HardDrive,
  Clock,
  KeyRound,
  Download,
  Upload,
  Check,
  AlertCircle,
  Fingerprint,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    storageInfo,
    autoLockMinutes,
    updateAutoLockMinutes,
    changeMasterPassword,
    exportVault,
    importVault,
    eraseVault,
    biometricAvailable,
    biometricEnabled,
    toggleBiometric,
  } = useVault();

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (newPass.length < 8) {
      setPassError('Password must be at least 8 characters long.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    const ok = await changeMasterPassword(currentPass, newPass);
    if (ok) {
      setPassSuccess(true);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassSuccess(false), 3000);
    } else {
      setPassError('Current master password was incorrect.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const envelope = JSON.parse(content);
        const promptPass = window.prompt('Enter Master Password for imported vault:');
        if (!promptPass) return;

        const ok = await importVault(envelope, promptPass);
        if (ok) {
          alert('Vault successfully restored!');
          onClose();
        } else {
          alert('Failed to import: Incorrect password or corrupt backup file.');
        }
      } catch (err: any) {
        alert('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleEraseAll = async () => {
    const confirmation = window.prompt(
      'Type "DELETE" to permanently erase your vault. This cannot be undone:'
    );
    if (confirmation === 'DELETE') {
      await eraseVault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Storage Information */}
          <div className="space-y-2">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
              <span>Storage Location</span>
            </div>
            <div className="bg-obsidian-950 p-3 rounded-xl border border-white/[0.06] text-xs font-mono space-y-1">
              <div className="text-zinc-300 font-medium">
                {storageInfo?.isNative ? 'Android App Sandbox' : 'Web Sandboxed Storage'}
              </div>
              <div className="text-zinc-500 break-all select-all text-[11px]">
                {storageInfo?.fullResolvedPath}
              </div>
            </div>
          </div>

          {/* Auto-Lock Settings */}
          <div className="space-y-2">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
              <span>Auto-Lock Timer</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '1m', val: 1 },
                { label: '5m', val: 5 },
                { label: '15m', val: 15 },
                { label: 'Never', val: 0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => updateAutoLockMinutes(opt.val)}
                  className={`py-1.5 text-xs rounded-lg font-medium transition border ${
                    autoLockMinutes === opt.val
                      ? 'bg-zinc-800 text-white border-white/20'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fingerprint / Biometric Settings */}
          {biometricAvailable && (
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-sage-400 stroke-[1.75]" />
                  <span>Fingerprint Unlock</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biometricEnabled}
                    onChange={async (e) => {
                      const ok = await toggleBiometric(e.target.checked);
                      if (!ok && e.target.checked) {
                        alert('Could not enable biometric unlock on this device.');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                Unlock vault using fingerprint sensor without typing your master password every time.
              </p>
            </div>
          )}

          {/* Change Master Password */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span>Master Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-zinc-400 hover:text-white transition"
              >
                {showPasswordChange ? 'Cancel' : 'Change'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="bg-obsidian-950 p-3.5 rounded-xl border border-white/[0.06] space-y-2.5">
                {passError && (
                  <div className="text-xs text-red-400 flex items-center gap-1.5 p-2 rounded-lg bg-red-500/[0.08]">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}
                {passSuccess && (
                  <div className="text-xs text-sage-400 flex items-center gap-1.5 p-2 rounded-lg bg-sage-500/[0.08]">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Password updated</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white glass-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white glass-input font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 font-medium rounded-lg text-xs transition shadow-sm"
                >
                  Save New Password
                </button>
              </form>
            )}
          </div>

          {/* Backup & Restore */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
              Backup & Recovery
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportVault}
                className="py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span>Export .vault</span>
              </button>

              <label className="py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span>Import .vault</span>
                <input
                  type="file"
                  accept=".vault,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="p-3 rounded-xl bg-red-500/[0.04] border border-red-500/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-red-300 font-medium">Erase Vault</div>
                <div className="text-[11px] text-zinc-500">Delete all local encrypted data.</div>
              </div>
              <button
                type="button"
                onClick={handleEraseAll}
                className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
              >
                Erase
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
