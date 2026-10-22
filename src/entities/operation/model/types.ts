export type OperationType = 'actual' | 'planned' | 'adjustment';

export interface Operation {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: OperationType;
  category?: string;
  periodicRuleId?: string;
  occurrenceDate?: string;
}

export interface PeriodicOperation {
  id: string;
  day: number;
  amount: number;
  description: string;
  category?: string;
}

export interface TimelineOperation extends Operation {
  virtual?: boolean;
  balance: number;
}

export interface BalanceCheckpoint {
  id: string;
  date: string;
  actualBalance: number;
  calculatedBalance: number;
  difference: number;
}

export interface LedgerSettings {
  openingBalance: number;
  openingBalanceDate: string;
  checkpoints: BalanceCheckpoint[];
}
