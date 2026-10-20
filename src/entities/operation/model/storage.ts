import periodicOpsSeed from '../../../data/periodicOps.json';
import type { Operation, PeriodicOperation } from './types';

const OPERATIONS_KEY = 'local-ledger:operations:v1';
const PERIODIC_KEY = 'local-ledger:periodic-operations:v1';

type PeriodicSeed = { day: number; amount: number; description: string; category?: string };

function makeId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
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
