import { Priority } from './issue';

export type Command =
  | { kind: 'move'; delta: 1 | -1 }
  | { kind: 'view'; delta: 1 | -1 }
  | { kind: 'priority'; priority: Priority }
  | { kind: 'sort'; slot: number }
  | { kind: 'return' }
  | { kind: 'status' }
  | { kind: 'close' }
  | { kind: 'undo' }
  | { kind: 'compose' }
  | { kind: 'search' }
  | { kind: 'help' }
  | { kind: 'refresh' }
  | { kind: 'open' };

export interface KeyLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
}

const PRIORITY_KEYS: Readonly<Record<string, Priority>> = { u: 'urgent', h: 'high', m: 'medium', l: 'low', '-': 'none' };

/** Pure mapping from a key press to a triage command, or null when the key means nothing here. */
export function commandForKey(event: KeyLike): Command | null {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') return { kind: 'undo' };
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key in PRIORITY_KEYS) return { kind: 'priority', priority: PRIORITY_KEYS[event.key] };
  if (/^[1-6]$/.test(event.key)) return { kind: 'sort', slot: Number(event.key) };
  switch (event.key) {
    case 'j': return { kind: 'move', delta: 1 };
    case 'k': return { kind: 'move', delta: -1 };
    case ']': return { kind: 'view', delta: 1 };
    case '[': return { kind: 'view', delta: -1 };
    case '0': return { kind: 'return' };
    case 's': return { kind: 'status' };
    case 'x': return { kind: 'close' };
    case 'z': return { kind: 'undo' };
    case 'c': return { kind: 'compose' };
    case '/': return { kind: 'search' };
    case '?': return { kind: 'help' };
    case 'r': return { kind: 'refresh' };
    case 'Enter': return { kind: 'open' };
    default: return null;
  }
}

export interface Shortcut {
  readonly keys: readonly string[];
  readonly does: string;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: ['j', 'k'], does: 'Next and previous letter' },
  { keys: ['u', 'h', 'm', 'l'], does: 'Stamp priority: urgent, high, medium, low' },
  { keys: ['-'], does: 'Wipe the priority stamp' },
  { keys: ['1', '…', '6'], does: 'Sort into that teammate’s pigeonhole' },
  { keys: ['0'], does: 'Put the letter back in intake' },
  { keys: ['s'], does: 'Step the status: open, in progress, closed' },
  { keys: ['x'], does: 'Close the issue' },
  { keys: ['z'], does: 'Undo the last change' },
  { keys: ['[', ']'], does: 'Previous and next tray: Intake, Mine, All' },
  { keys: ['c'], does: 'Compose a new issue' },
  { keys: ['/'], does: 'Search' },
  { keys: ['r'], does: 'Refresh from the server' },
  { keys: ['Enter'], does: 'Read the letter' },
  { keys: ['?'], does: 'This sheet' },
];
