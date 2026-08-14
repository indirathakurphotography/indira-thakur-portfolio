export const PROHIBITED_LANGUAGE_MESSAGE = 'Failed to save: prohibited language detected.';

export class ProhibitedLanguageError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'ProhibitedLanguageError';
    this.status = 400;
  }
}

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

const BLOCKED_WORDS = [
  'fuck', 'fucker', 'fuckers', 'fucking', 'fucked', 'fuckup', 'fuckedup',
  'fuker', 'fukin', 'fuk', 'fck', 'fuq', 'motherfucker',
  'shit', 'shite', 'shitty', 'shitting', 'bullshit', 'dipshit',
  'asshole', 'asshat', 'dumbass', 'jackass', 'arsehole', 'douche', 'dickhead',
  'bitch', 'bitchy', 'bitching', 'bitches', 'sonofabitch', 'bastard',
  'cunt', 'cunting', 'twat', 'pussy', 'whore', 'slut', 'bollocks',
  'prick', 'cock', 'wanker', 'fag', 'faggot', 'homo',
  'nigger', 'nigga', 'niggas', 'kike', 'spic', 'chink', 'coon', 'wetback',
  'retard', 'mong', 'midget',
  'rape', 'rapist',
];

const BLOCKED_PHRASES = ['declare war', 'war on u', 'kill all', 'bomb the', 'shoot up'];

export function normalizeForPolicy(text: string): string {
  let out = text.toLowerCase();
  out = out.replace(/[0-9@$!]/g, (ch) => LEET_MAP[ch] || ch);
  out = out.replace(/[^a-z]+/g, ' ');
  out = out.replace(/([a-z])\1{2,}/g, '$1');
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

export function wordPattern(word: string): RegExp {
  const letters = word.split('');
  const middle = letters.map((ch) => `${ch}{1,3}`).join('[^a-z]*');
  return new RegExp(`(?:^|[^a-z])${middle}(?:$|[^a-z])`);
}

const cachedPatterns = new Map<string, RegExp>();

export function getProhibitedPatterns(): { type: 'word' | 'phrase'; pattern: RegExp; term: string }[] {
  const result: { type: 'word' | 'phrase'; pattern: RegExp; term: string }[] = [];
  for (const word of BLOCKED_WORDS) {
    let pattern = cachedPatterns.get(word);
    if (!pattern) {
      pattern = wordPattern(word);
      cachedPatterns.set(word, pattern);
    }
    result.push({ type: 'word', pattern, term: word });
  }
  for (const phrase of BLOCKED_PHRASES) {
    const normalized = normalizeForPolicy(phrase);
    const pattern = new RegExp(`(?:^|[^a-z])${normalized.replace(/[^a-z]/g, '[^a-z]*')}(?:$|[^a-z])`);
    result.push({ type: 'phrase', pattern, term: phrase });
  }
  return result;
}

export function findProhibitedContent(value: unknown, path = ''): { path: string; term: string } | null {
  if (typeof value === 'string') {
    const normalized = normalizeForPolicy(value);
    if (!normalized) return null;
    for (const { pattern, term } of getProhibitedPatterns()) {
      if (pattern.test(normalized)) {
        return { path: path || '(value)', term };
      }
    }
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findProhibitedContent(value[i], path ? `${path}[${i}]` : `[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const hit = findProhibitedContent((value as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
      if (hit) return hit;
    }
    return null;
  }
  return null;
}

export function hasProhibitedLanguage(payload: unknown): { hit: boolean; path?: string; term?: string } {
  const found = findProhibitedContent(payload);
  return found ? { hit: true, path: found.path, term: found.term } : { hit: false };
}

export function assertNoProhibitedLanguage(payload: unknown): void {
  const { hit, path, term } = hasProhibitedLanguage(payload);
  if (hit) {
    console.warn(`[contentPolicy] Rejected prohibited content at field "${path}": term "${term}"`);
    // Exact user-facing message; details are logged server-side only.
    throw new ProhibitedLanguageError(PROHIBITED_LANGUAGE_MESSAGE);
  }
}
