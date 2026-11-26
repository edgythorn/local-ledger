import type { BalanceCheckpoint, LedgerSettings, Operation } from './types';

function compareOperations(a: Operation, b: Operation): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const order: Record<Operation['type'], number> = { actual: 0, adjustment: 1, planned: 2 };
  return order[a.type] - order[b.type] || a.id.localeCompare(b.id);
}

/**
 * Recalculates only checkpoints explicitly linked to an adjustment.
 * The checkpoint's actual balance is the invariant; its adjustment amount
 * absorbs changes in the operation history preceding that checkpoint.
 */
export function recalculateCheckpointAdjustments(
  operations: Operation[],
  settings: LedgerSettings,
): { operations: Operation[]; settings: LedgerSettings } {
  const checkpointsByOperationId = new Map(
    settings.checkpoints
      .filter((checkpoint): checkpoint is BalanceCheckpoint & { operationId: string } => Boolean(checkpoint.operationId))
      .map((checkpoint) => [checkpoint.operationId, checkpoint]),
  );
  if (checkpointsByOperationId.size === 0) return { operations, settings };

  const earliestDate = operations.reduce<string | undefined>(
    (earliest, operation) => !earliest || operation.date < earliest ? operation.date : earliest,
    undefined,
  );
  const startDate = earliestDate && earliestDate < settings.openingBalanceDate
    ? earliestDate
    : settings.openingBalanceDate;
  let balance = startDate < settings.openingBalanceDate ? 0 : settings.openingBalance;
  let appliedOpeningBalance = startDate >= settings.openingBalanceDate;

  const nextOperations = [...operations].sort(compareOperations).map((operation) => {
    if (!appliedOpeningBalance && operation.date >= settings.openingBalanceDate) {
      balance = settings.openingBalance;
      appliedOpeningBalance = true;
    }

    const checkpoint = checkpointsByOperationId.get(operation.id);
    if (operation.type !== 'adjustment' || !checkpoint) {
      balance += operation.amount;
      return operation;
    }

    const difference = checkpoint.actualBalance - balance;
    const nextOperation = { ...operation, amount: difference };
    checkpoint.calculatedBalance = balance;
    checkpoint.difference = difference;
    balance += difference;
    return nextOperation;
  });

  const nextById = new Map(nextOperations.map((operation) => [operation.id, operation]));
  return {
    operations: operations.map((operation) => nextById.get(operation.id) ?? operation),
    settings: { ...settings, checkpoints: settings.checkpoints.map((checkpoint) => ({ ...checkpoint })) },
  };
}
