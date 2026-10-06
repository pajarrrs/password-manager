import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { generatePassword, evaluatePasswordStrength, GeneratorOptions } from '../services/passwordGenerator';
import { Clipboard } from '@capacitor/clipboard';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassword?: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectPassword,
}) => {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    useUpper: true,
    useLower: true,
    useNumbers: true,
    useSymbols: true,
    avoidAmbiguous: true,
    mode: 'random',
    wordCount: 4,
    separator: '-',
    includeNumberInPassphrase: true,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = () => {
    const pwd = generatePassword(options);
    setGeneratedPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      regenerate();
    }
  }, [isOpen, options]);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(generatedPassword);

  const handleCopy = async () => {
    try {
      await Clipboard.write({ string: generatedPassword });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUse = () => {
    if (onSelectPassword) {
      onSelectPassword(generatedPassword);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-obsidian-900 border border-white/[0.08] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-300 stroke-[1.75]" />
            <h2 className="text-sm font-medium text-white">Password Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Output Display */}
          <div className="bg-obsidian-950 border border-white/[0.07] rounded-xl p-3.5 relative">
            <div className="text-sm font-mono text-zinc-100 break-all select-all pr-14 leading-relaxed min-h-[1.5rem]">
              {generatedPassword}
            </div>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={regenerate}
                className="p-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-white/[0.04]"
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 text-zinc-400 hover:text-white transition rounded-lg hover:bg-white/[0.04]"
                title="Copy"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-sage-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Minimal Strength Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-500">Security rating</span>
              <span className="text-zinc-300 font-mono">{strength.label} ({strength.score}%)</span>
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

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setOptions({ ...options, mode: 'random' })}
              className={`py-1.5 text-xs font-medium rounded-lg transition ${
                options.mode === 'random'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Characters
            </button>
            <button
              onClick={() => setOptions({ ...options, mode: 'passphrase' })}
              className={`py-1.5 text-xs font-medium rounded-lg transition ${
                options.mode === 'passphrase'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Passphrase
            </button>
          </div>

          {/* Mode Controls */}
          {options.mode === 'random' ? (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Length</span>
                  <span className="font-mono text-zinc-100 font-medium">{options.length}</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                  className="w-full accent-white cursor-pointer h-1 bg-white/[0.08] rounded-lg appearance-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition">
                  <input
                    type="checkbox"
                    checked={options.useUpper}
                    onChange={(e) => setOptions({ ...options, useUpper: e.target.checked })}
                    className="accent-white rounded"
                  />
                  <span>A-Z</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition">
                  <input
                    type="checkbox"
                    checked={options.useLower}
                    onChange={(e) => setOptions({ ...options, useLower: e.target.checked })}
                    className="accent-white rounded"
                  />
                  <span>a-z</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition">
                  <input
                    type="checkbox"
                    checked={options.useNumbers}
                    onChange={(e) => setOptions({ ...options, useNumbers: e.target.checked })}
                    className="accent-white rounded"
                  />
                  <span>0-9</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition">
                  <input
                    type="checkbox"
                    checked={options.useSymbols}
                    onChange={(e) => setOptions({ ...options, useSymbols: e.target.checked })}
                    className="accent-white rounded"
                  />
                  <span>!@#$</span>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-500 pt-0.5">
                <input
                  type="checkbox"
                  checked={options.avoidAmbiguous}
                  onChange={(e) => setOptions({ ...options, avoidAmbiguous: e.target.checked })}
                  className="accent-white rounded"
                />
                <span>Avoid ambiguous (1, l, I, 0, O)</span>
              </label>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Words</span>
                  <span className="font-mono text-zinc-100 font-medium">{options.wordCount}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={options.wordCount}
                  onChange={(e) => setOptions({ ...options, wordCount: parseInt(e.target.value) })}
                  className="w-full accent-white cursor-pointer h-1 bg-white/[0.08] rounded-lg appearance-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-zinc-500 text-[10px] uppercase mb-1">Separator</label>
                  <select
                    value={options.separator}
                    onChange={(e) => setOptions({ ...options, separator: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-obsidian-950 border border-white/[0.08] rounded-lg text-zinc-300 text-xs"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=".">Period (.)</option>
                    <option value=" ">Space ( )</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2 text-zinc-400 text-xs">
                    <input
                      type="checkbox"
                      checked={options.includeNumberInPassphrase}
                      onChange={(e) =>
                        setOptions({ ...options, includeNumberInPassphrase: e.target.checked })
                      }
                      className="accent-white rounded"
                    />
                    <span>Add digits</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
            {onSelectPassword ? (
              <button
                type="button"
                onClick={handleUse}
                className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 font-medium rounded-xl text-xs transition shadow-sm"
              >
                Use password
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-white transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sage-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
