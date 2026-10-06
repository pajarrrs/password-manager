import React, { useState, useEffect } from 'react';
import { useVault } from '../context/VaultContext';
import { Shield, Lock, Eye, EyeOff, AlertCircle, FileUp, Database, ArrowRight, Fingerprint } from 'lucide-react';
import { evaluatePasswordStrength } from '../services/passwordGenerator';

export const LockScreen: React.FC = () => {
  const {
    isInitialized,
    initializeVault,
    unlockVault,
    unlockWithBiometrics,
    biometricAvailable,
    biometricEnabled,
    toggleBiometric,
    storageInfo,
    error,
    clearError,
    importVault,
  } = useVault();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enableBioOnSetup, setEnableBioOnSetup] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBioScanning, setIsBioScanning] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const hasPromptedBioRef = React.useRef(false);
  const isPromptingBioRef = React.useRef(false);

  const strength = !isInitialized && password ? evaluatePasswordStrength(password) : null;

  const handleBiometricAuth = async (isManual = true) => {
    if (isPromptingBioRef.current) return;
    isPromptingBioRef.current = true;
    setIsBioScanning(true);
    setLocalError(null);

    try {
      const ok = await unlockWithBiometrics();
      if (!ok && isManual) {
        setLocalError('Biometric verification cancelled or failed.');
      }
    } catch {
      if (isManual) {
        setLocalError('Biometric verification failed.');
      }
    } finally {
      isPromptingBioRef.current = false;
      setIsBioScanning(false);
    }
  };

  // Auto-prompt fingerprint scanner ONLY ONCE on mount if biometric unlock is enabled
  useEffect(() => {
    if (isInitialized && biometricAvailable && biometricEnabled && !hasPromptedBioRef.current) {
      hasPromptedBioRef.current = true;
      const timer = setTimeout(() => {
        handleBiometricAuth(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, biometricAvailable, biometricEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!password) {
      setLocalError('Enter your master password.');
      return;
    }

    if (!isInitialized) {
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (!isInitialized) {
        const ok = await initializeVault(password);
        if (ok && enableBioOnSetup && biometricAvailable) {
          await toggleBiometric(true);
        }
      } else {
        const success = await unlockVault(password);
        if (!success) {
          setLocalError('Incorrect master password.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const envelope = JSON.parse(content);
        const promptPass = window.prompt('Enter Master Password for this backup:');
        if (!promptPass) return;

        setIsSubmitting(true);
        const ok = await importVault(envelope, promptPass);
        if (!ok) {
          alert('Failed to import: Invalid password or corrupted backup file.');
        }
      } catch (err: any) {
        alert('Invalid backup file: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-obsidian-950 relative overflow-hidden font-sans">
      {/* Subtle organic ambient glow in background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[360px] bg-sage-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-fadeIn">
        {/* Emblem & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.1] shadow-soft flex items-center justify-center mb-4 transition-transform duration-300 hover:scale-105">
            {isInitialized ? (
              biometricAvailable && biometricEnabled ? (
                <Fingerprint className="w-6 h-6 text-sage-400 stroke-[1.75]" />
              ) : (
                <Lock className="w-6 h-6 text-zinc-300 stroke-[1.75]" />
              )
            ) : (
              <Shield className="w-6 h-6 text-sage-400 stroke-[1.75]" />
            )}
          </div>
          <h1 className="text-xl font-medium tracking-tight text-white mb-1">
            {isInitialized ? 'KeyVault Locked' : 'Set Up Master Key'}
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[280px]">
            {isInitialized
              ? biometricAvailable && biometricEnabled
                ? 'Touch fingerprint sensor or enter password'
                : 'Your data is encrypted end-to-end with AES-256'
              : 'Create a single strong password to secure your local vault'}
          </p>
        </div>

        {/* Card Container */}
        <div className="glass-panel rounded-2xl p-6 shadow-soft space-y-4">
          {/* Quick Biometric Fingerprint Button (if enabled) */}
          {isInitialized && biometricAvailable && biometricEnabled && (
            <button
              type="button"
              disabled={isBioScanning || isSubmitting}
              onClick={() => handleBiometricAuth(true)}
              className="w-full py-3 px-4 rounded-xl font-medium text-xs text-zinc-200 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] hover:border-white/20 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4 text-sage-400 stroke-[2]" />
              <span>{isBioScanning ? 'Scanning Fingerprint...' : 'Unlock with Fingerprint'}</span>
            </button>
          )}

          {isInitialized && biometricAvailable && biometricEnabled && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[10px] uppercase font-mono text-zinc-500">or password</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="font-medium">{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                  Master Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passphrase"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-500 glass-input font-mono pr-10"
                  autoFocus={!biometricEnabled}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Strength meter for new setup */}
            {!isInitialized && strength && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Security strength</span>
                  <span className="font-medium text-sage-400">{strength.label}</span>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full ${
                      strength.score >= 80 ? 'bg-sage-400' : strength.score >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    } transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}

            {/* Confirm input for new setup */}
            {!isInitialized && (
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat passphrase"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-zinc-500 glass-input font-mono"
                />
              </div>
            )}

            {/* Setup: Biometric opt-in checkbox */}
            {!isInitialized && biometricAvailable && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 pt-1">
                <input
                  type="checkbox"
                  checked={enableBioOnSetup}
                  onChange={(e) => setEnableBioOnSetup(e.target.checked)}
                  className="accent-white rounded"
                />
                <Fingerprint className="w-3.5 h-3.5 text-sage-400 flex-shrink-0" />
                <span>Enable Fingerprint Unlock (Hardware Keystore)</span>
              </label>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-white/20 active:scale-[0.99] transition duration-200 shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-zinc-400 border-t-white" />
              ) : isInitialized ? (
                <>
                  <span className="text-zinc-100 font-medium">Unlock with Password</span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 stroke-[2]" />
                </>
              ) : (
                <>
                  <span className="text-zinc-100 font-medium">Create Vault</span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 stroke-[2]" />
                </>
              )}
            </button>
          </form>

          {/* Backup link */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] flex justify-center">
            <label className="text-[11px] text-zinc-400 hover:text-zinc-200 transition cursor-pointer flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-zinc-400" />
              <span>Import encrypted .vault file</span>
              <input
                type="file"
                accept=".vault,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Minimal Storage Location Pill */}
        {storageInfo && (
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <Database className="w-3 h-3 text-zinc-500" />
            <span className="truncate max-w-[260px] font-mono">
              {storageInfo.isNative ? 'com.password.manager' : 'Local Sandbox'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
