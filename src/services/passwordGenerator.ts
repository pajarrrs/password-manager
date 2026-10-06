export interface GeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  avoidAmbiguous: boolean;
  mode: 'random' | 'passphrase';
  wordCount?: number;
  separator?: string;
  includeNumberInPassphrase?: boolean;
}

const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_CHARS = 'Il1O0';

const PASSPHRASE_WORDS = [
  'apple', 'beacon', 'breeze', 'bridge', 'castle', 'cloud', 'comet', 'crater', 'crystal', 'delta',
  'dragon', 'ember', 'falcon', 'forest', 'galaxy', 'glacier', 'harbor', 'horizon', 'island', 'jungle',
  'knight', 'lagoon', 'lantern', 'meteor', 'nebula', 'ocean', 'orbit', 'pebble', 'phoenix', 'planet',
  'pulse', 'quartz', 'radar', 'ripple', 'river', 'rocket', 'sailor', 'shadow', 'shield', 'siren',
  'spark', 'sphinx', 'spirit', 'storm', 'stride', 'sunset', 'timber', 'titan', 'valley', 'vortex',
  'willow', 'winter', 'zenith', 'amber', 'badger', 'canyon', 'cider', 'clover', 'drift', 'echo',
  'flint', 'frost', 'geyser', 'grove', 'haven', 'hawk', 'jasper', 'lotus', 'lynx', 'marble',
  'meadow', 'moss', 'nova', 'oasis', 'opal', 'otter', 'polar', 'raven', 'ridge', 'ruby',
  'sapphire', 'summit', 'thunder', 'tiger', 'topaz', 'trail', 'tulip', 'vessel', 'viper', 'walnut'
];

export function generatePassword(options: GeneratorOptions): string {
  if (options.mode === 'passphrase') {
    const count = options.wordCount || 4;
    const sep = options.separator || '-';
    const selected: string[] = [];
    const randomVals = new Uint32Array(count);
    window.crypto.getRandomValues(randomVals);

    for (let i = 0; i < count; i++) {
      const idx = randomVals[i] % PASSPHRASE_WORDS.length;
      selected.push(PASSPHRASE_WORDS[idx]);
    }

    let result = selected.join(sep);
    if (options.includeNumberInPassphrase) {
      const numVals = new Uint32Array(1);
      window.crypto.getRandomValues(numVals);
      result += `${sep}${numVals[0] % 100}`;
    }
    return result;
  }

  let charset = '';
  if (options.useUpper) charset += UPPER_CHARS;
  if (options.useLower) charset += LOWER_CHARS;
  if (options.useNumbers) charset += NUMBER_CHARS;
  if (options.useSymbols) charset += SYMBOL_CHARS;

  if (options.avoidAmbiguous) {
    for (const c of AMBIGUOUS_CHARS) {
      charset = charset.split(c).join('');
    }
  }

  if (!charset) charset = LOWER_CHARS + NUMBER_CHARS;

  const length = Math.max(6, Math.min(128, options.length));
  const randomBuffer = new Uint32Array(length);
  window.crypto.getRandomValues(randomBuffer);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBuffer[i] % charset.length];
  }

  return password;
}

export interface PasswordStrength {
  score: number; // 0 to 100
  label: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Very Weak', color: 'bg-red-500', feedback: ['Password is empty'] };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropy = password.length * Math.log2(Math.max(1, poolSize));
  const feedback: string[] = [];

  if (password.length < 8) feedback.push('Too short (min 8 characters)');
  if (password.length < 12) feedback.push('Consider using at least 12 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special symbols');

  // Simple common pattern penalty
  if (/password|12345|admin|qwerty/i.test(password)) {
    feedback.push('Contains common predictable patterns');
  }

  // Normalized score 0-100 based on entropy
  let score = Math.min(100, Math.round((entropy / 85) * 100));
  if (/password|12345|admin|qwerty/i.test(password)) score = Math.min(score, 30);

  let label: PasswordStrength['label'] = 'Very Weak';
  let color = 'bg-red-500';

  if (score >= 80) {
    label = 'Very Strong';
    color = 'bg-emerald-500';
  } else if (score >= 60) {
    label = 'Strong';
    color = 'bg-teal-500';
  } else if (score >= 40) {
    label = 'Moderate';
    color = 'bg-amber-500';
  } else if (score >= 20) {
    label = 'Weak';
    color = 'bg-orange-500';
  }

  return { score, label, color, feedback };
}
