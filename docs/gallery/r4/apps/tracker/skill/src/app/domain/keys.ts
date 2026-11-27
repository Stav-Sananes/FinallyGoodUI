import { PRIORITY_BY_KEY, Priority } from './issue';

export type Command =
  | { kind: 'move'; delta: 1 | -1 }
  | { kind: 'priority'; priority: Priority }
  | { kind: 'assign' }
  | { kind: 'status' }
  | { kind: 'close' }
  | { kind: 'undo' }
  | { kind: 'new' }
  | { kind: 'search' }
  | { kind: 'help' }
  | { kind: 'refresh' };

export interface KeyLike {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
}

/** Pure mapping from a key press to a triage command, or null when the key means nothing here. */
export function commandForKey(event: KeyLike): Command | null {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') return { kind: 'undo' };
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key in PRIORITY_BY_KEY) return { kind: 'priority', priority: PRIORITY_BY_KEY[event.key] };
  switch (event.key) {
    case 'j':
      return { kind: 'move', delta: 1 };
    case 'k':
      return { kind: 'move', delta: -1 };
    case 'a':
      return { kind: 'assign' };
    case 's':
      return { kind: 'status' };
    case 'x':
      return { kind: 'close' };
    case 'u':
      return { kind: 'undo' };
    case 'n':
      return { kind: 'new' };
    case '/':
      return { kind: 'search' };
    case '?':
      return { kind: 'help' };
    case 'r':
      return { kind: 'refresh' };
    default:
      return null;
  }
}

export interface Shortcut {
  readonly keys: readonly string[];
  readonly does: string;
}

export const SHORTCUTS: readonly Shortcut[] = [
  { keys: ['j', 'k'], does: 'Move the cursor down and up the rack' },
  { keys: ['1', '2', '3', '4'], does: 'Set priority: urgent, high, normal, low' },
  { keys: ['0'], does: 'Clear the priority' },
  { keys: ['a'], does: 'Hand the issue to someone (menu)' },
  { keys: ['s'], does: 'Step the status: open, in progress, closed' },
  { keys: ['x'], does: 'Close the issue' },
  { keys: ['u'], does: 'Undo the last change' },
  { keys: ['Enter'], does: 'Open the issue' },
  { keys: ['n'], does: 'New issue' },
  { keys: ['/'], does: 'Search the rack' },
  { keys: ['r'], does: 'Refresh from the server' },
  { keys: ['?'], does: 'This sheet' },
];
