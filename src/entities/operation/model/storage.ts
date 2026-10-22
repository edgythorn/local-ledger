import periodicOpsSeed from '../../../shared/data/periodicOps.json';
import type { LedgerSettings, Operation, PeriodicOperation } from './types';

const OPERATIONS_KEY = 'local-ledger:operations:v1';
const PERIODIC_KEY = 'local-ledger:periodic-operations:v1';
const LEDGER_SETTINGS_KEY = 'local-ledger:settings:v1';

type PeriodicSeed = { day: number; amount: number; description: string; category?: string };

function makeId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
}

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function createId(prefix: string): string {
  return makeId(prefix);
}

export function getOperations(): Operation[] {
  return readJson<Operation[]>(OPERATIONS_KEY, []);
}

export function saveOperations(operations: Operation[]): void {
  localStorage.setItem(OPERATIONS_KEY, JSON.stringify(operations));
}

export function getLedgerSettings(): LedgerSettings {
  const raw = localStorage.getItem(LEDGER_SETTINGS_KEY);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as Partial<LedgerSettings>;
      return {
        openingBalance: Number.isFinite(parsed.openingBalance) ? parsed.openingBalance as number : 0,
        openingBalanceDate: typeof parsed.openingBalanceDate === 'string' ? parsed.openingBalanceDate : todayString(),
        checkpoints: Array.isArray(parsed.checkpoints) ? parsed.checkpoints : [],
      };
    } catch {
      // Recover with safe defaults without discarding the operation history.
    }
  }

  const existingOperations = getOperations();
  const earliestDate = existingOperations.reduce<string | undefined>(
    (earliest, operation) => !earliest || operation.date < earliest ? operation.date : earliest,
    undefined,
  );
  const settings: LedgerSettings = {
    openingBalance: 0,
    openingBalanceDate: earliestDate ?? todayString(),
    checkpoints: [],
  };
  saveLedgerSettings(settings);
  return settings;
}

export function saveLedgerSettings(settings: LedgerSettings): void {
  localStorage.setItem(LEDGER_SETTINGS_KEY, JSON.stringify(settings));
}

export function getPeriodicOperations(): PeriodicOperation[] {
  const raw = localStorage.getItem(PERIODIC_KEY);
  if (raw !== null) return readJson<PeriodicOperation[]>(PERIODIC_KEY, []);

  const seeded = (periodicOpsSeed as PeriodicSeed[]).map((item) => ({
    ...item,
    id: makeId('periodic'),
  }));
  localStorage.setItem(PERIODIC_KEY, JSON.stringify(seeded));
  return seeded;
}

export function savePeriodicOperations(operations: PeriodicOperation[]): void {
  // An explicitly saved empty array stays empty; defaults are seeded only once.
  localStorage.setItem(PERIODIC_KEY, JSON.stringify(operations));
}
