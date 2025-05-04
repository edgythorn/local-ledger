// src/services/operationsService.ts
import periodicSpecs from '../data/periodicOps.json';

export interface Operation {
  id: string;
  date: string;
  amount: number;
  description: string;
  note?: string;
  category?: string;
}

export interface OperationsPage {
  items: Operation[];
  hasPrev: boolean;
  hasNext: boolean;
}

async function fetchFixedOpsBefore(date: Date, limit: number): Promise<Operation[]> {
  // …
  console.log( `${date}, ${limit}`);
  return [];
}

async function generateForecastOps(cursor: Date, limit: number): Promise<Operation[]> {
  // …
  const ops: Operation[] = [];
  let year = cursor.getFullYear(), month = cursor.getMonth(), counter = 0;
  while (ops.length < limit) {
    month = month + 1 > 11 ? (year++, 0) : month + 1;
    for (const spec of periodicSpecs) {
      const opDate = new Date(year, month, spec.day);
      if (opDate <= cursor) continue;
      ops.push({
        id: `forecast-${counter++}`,
        date: opDate.toISOString(),
        amount: spec.amount,
        description: spec.description,
        note: '',
        category: undefined,
      });
      if (ops.length >= limit) break;
    }
  }
  return ops;
}

export class OperationsService {
  private cursorDate: Date;
  constructor(startDate: Date = new Date()) {
    this.cursorDate = startDate;
  }
  async prev(limit = 50): Promise<OperationsPage> {
    const fixed = await fetchFixedOpsBefore(this.cursorDate, limit);
    if (fixed.length) {
      this.cursorDate = new Date(fixed[fixed.length - 1].date);
      return { items: fixed, hasPrev: fixed.length === limit, hasNext: true };
    }
    return { items: [], hasPrev: false, hasNext: true };
  }
  async next(limit = 50): Promise<OperationsPage> {
    const forecast = await generateForecastOps(this.cursorDate, limit);
    if (forecast.length) {
      this.cursorDate = new Date(forecast[forecast.length - 1].date);
      return { items: forecast, hasPrev: true, hasNext: forecast.length === limit };
    }
    return { items: [], hasPrev: true, hasNext: false };
  }
}
