import type { LedgerSettings, Operation, PeriodicOperation, TimelineOperation } from './types';
import { localDateString } from './dates';

function dateAtMonthDay(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return localDateString(new Date(year, month, Math.min(day, lastDay)));
}

function compareOperations(a: Operation, b: Operation): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const order: Record<Operation['type'], number> = { actual: 0, adjustment: 1, planned: 2 };
  return order[a.type] - order[b.type] || a.id.localeCompare(b.id);
}

export function buildTimeline(
  savedOperations: Operation[],
  periodicRules: PeriodicOperation[],
  settings: LedgerSettings,
  now = new Date(),
  forecastMonths = 12,
): TimelineOperation[] {
  const today = localDateString(now);
  const earliestSavedDate = savedOperations.reduce<string | undefined>(
    (earliest, operation) => !earliest || operation.date < earliest ? operation.date : earliest,
    undefined,
  );
  // New ledgers start today. A backdated operation extends the ledger into the past.
  const startDate = earliestSavedDate && earliestSavedDate < settings.openingBalanceDate
    ? earliestSavedDate
    : settings.openingBalanceDate;
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(now.getFullYear(), now.getMonth() + forecastMonths, 1);
  const confirmedOccurrences = new Set(
    savedOperations
      .filter((operation) => operation.periodicRuleId && operation.occurrenceDate)
      .map((operation) => `${operation.periodicRuleId}:${operation.occurrenceDate}`),
  );

  const all: Operation[] = [...savedOperations];
  for (let cursor = new Date(start.getFullYear(), start.getMonth(), 1); cursor <= end; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    for (const rule of periodicRules) {
      const occurrenceDate = dateAtMonthDay(cursor.getFullYear(), cursor.getMonth(), rule.day);
      if (occurrenceDate < startDate || confirmedOccurrences.has(`${rule.id}:${occurrenceDate}`)) continue;
      all.push({
        id: `virtual:${rule.id}:${occurrenceDate}`,
        date: occurrenceDate,
        amount: rule.amount,
        description: rule.description,
        category: rule.category,
        type: 'planned',
        periodicRuleId: rule.id,
        occurrenceDate,
      });
    }
  }

  all.sort(compareOperations);
  let balance = startDate < settings.openingBalanceDate ? 0 : settings.openingBalance;
  let appliedOpeningBalance = startDate >= settings.openingBalanceDate;
  return all.map((operation) => {
    if (!appliedOpeningBalance && operation.date >= settings.openingBalanceDate) {
      balance = settings.openingBalance;
      appliedOpeningBalance = true;
    }
    balance += operation.amount;
    return { ...operation, virtual: operation.id.startsWith('virtual:'), balance };
  });
}
