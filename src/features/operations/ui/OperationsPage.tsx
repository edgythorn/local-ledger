import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { buildTimeline } from '../../../entities/operation/model/timeline';
import { localDateString } from '../../../entities/operation/model/dates';
import {
  createId,
  getOperations,
  getLedgerSettings,
  getPeriodicOperations,
  saveLedgerSettings,
  saveOperations,
} from '../../../entities/operation/model/storage';
import type { LedgerSettings, Operation, OperationType, TimelineOperation } from '../../../entities/operation/model/types';

interface OperationFormState {
  date: string;
  amount: string;
  description: string;
  type: OperationType;
  category: string;
}

type VirtualRow = { key: string; kind: 'month' | 'today' | 'operation' | 'summary' | 'empty'; height: number; operation?: TimelineOperation; month?: string; income?: number; expenses?: number; net?: number; monthEndBalance?: number; };

const emptyForm = (): OperationFormState => ({
  date: localDateString(new Date()),
  amount: '',
  description: '',
  type: 'actual',
  category: '',
});

export function OperationsPage() {
  const { t, i18n } = useTranslation();
  const [operations, setOperations] = useState<Operation[]>(() => getOperations());
  const [ledgerSettings, setLedgerSettings] = useState<LedgerSettings>(() => getLedgerSettings());
  const [periodicRules] = useState(() => getPeriodicOperations());
  const [form, setForm] = useState<OperationFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingOperationId, setEditingOperationId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [reconcileBalance, setReconcileBalance] = useState('');
  const [showReconcile, setShowReconcile] = useState(false);
  const [showOpeningBalance, setShowOpeningBalance] = useState(false);
  const [openingBalanceDraft, setOpeningBalanceDraft] = useState(String(ledgerSettings.openingBalance));
  const [openingDateDraft, setOpeningDateDraft] = useState(ledgerSettings.openingBalanceDate);
  const [confirmOverdueDuringReconciliation, setConfirmOverdueDuringReconciliation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [forecastMonths, setForecastMonths] = useState(12);

  const today = localDateString(new Date());
  const timeline = useMemo(() => buildTimeline(operations, periodicRules, ledgerSettings, new Date(), forecastMonths), [operations, periodicRules, ledgerSettings, forecastMonths]);
  const overdue = timeline.filter((operation) => operation.type === 'planned' && operation.date <= today);
  const projectedBalanceToday = timeline
    .filter((operation) => operation.date <= today)
    .at(-1)?.balance ?? ledgerSettings.openingBalance;

  const virtualRows = useMemo<VirtualRow[]>(() => {
    if (timeline.length === 0) return [{ key: 'empty', kind: 'empty', height: 64 }];
    const rows: VirtualRow[] = [];
    const totals = new Map<string, { income: number; expenses: number; net: number; monthEndBalance: number }>();
    for (const op of timeline) {
      const month = op.date.slice(0, 7);
      const total = totals.get(month) ?? { income: 0, expenses: 0, net: 0, monthEndBalance: ledgerSettings.openingBalance };
      total.income += Math.max(0, op.amount); total.expenses += Math.min(0, op.amount); total.net += op.amount; total.monthEndBalance = op.balance;
      totals.set(month, total);
    }
    let previousMonth: string | undefined;
    let markerAdded = false;
    timeline.forEach((operation, index) => {
      const month = operation.date.slice(0, 7);
      if (month !== previousMonth) {
        if (previousMonth) rows.push({ key: 'summary-' + previousMonth, kind: 'summary', month: previousMonth, height: 40, ...totals.get(previousMonth)! });
        rows.push({ key: 'month-' + month, kind: 'month', month, height: 36 });
        previousMonth = month;
      }
      const previous = timeline[index - 1];
      if (!markerAdded && operation.date >= today && (!previous || previous.date < today)) {
        rows.push({ key: 'today-marker', kind: 'today', height: 36 }); markerAdded = true;
      }
      rows.push({ key: operation.id, kind: 'operation', operation, height: 42 });
    });
    if (previousMonth) rows.push({ key: 'summary-' + previousMonth, kind: 'summary', month: previousMonth, height: 40, ...totals.get(previousMonth)! });
    if (!markerAdded) rows.push({ key: 'today-marker', kind: 'today', height: 36 });
    return rows;
  }, [timeline, today, ledgerSettings.openingBalance]);

  const rowOffsets = useMemo(() => {
    const offsets: number[] = []; let offset = 0;
    for (const row of virtualRows) { offsets.push(offset); offset += row.height; }
    return { offsets, totalHeight: offset };
  }, [virtualRows]);
  const firstVisible = rowOffsets.offsets.findIndex((offset, index) => offset + virtualRows[index].height >= scrollTop);
  const visibleStart = Math.max(0, (firstVisible < 0 ? 0 : firstVisible) - 6);
  const nextAfterViewport = rowOffsets.offsets.findIndex((offset) => offset > scrollTop + viewportHeight);
  const visibleEnd = Math.min(virtualRows.length, (nextAfterViewport < 0 ? virtualRows.length : nextAfterViewport) + 7);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const updateViewport = () => setViewportHeight(element.clientHeight);
    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const markerIndex = virtualRows.findIndex((row) => row.kind === 'today');
    if (markerIndex >= 0) element.scrollTop = Math.max(0, rowOffsets.offsets[markerIndex] - element.clientHeight / 2);
  }, []);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }),
    [i18n.language],
  );
  const operationDateFormatter = useMemo(
    () => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }),
    [],
  );
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }),
    [i18n.language],
  );

  function persist(next: Operation[]) {
    setOperations(next);
    saveOperations(next);
  }

  function confirmPlanned(items: TimelineOperation[]) {
    const confirmable = items.filter((item) => item.type === 'planned' && item.date <= today);
    const confirmableIds = new Set(confirmable.filter((item) => !item.virtual).map((item) => item.id));
    const next = operations.map((operation) => confirmableIds.has(operation.id) ? { ...operation, type: 'actual' as const } : operation);
    for (const item of confirmable) {
      if (item.virtual) {
        next.push({
          id: createId('operation'),
          date: item.date,
          amount: item.amount,
          description: item.description,
          category: item.category,
          type: 'actual',
          periodicRuleId: item.periodicRuleId,
          occurrenceDate: item.occurrenceDate,
        });
      }
    }
    persist(next);
    setSelected([]);
  }

  function startEditing(operation: TimelineOperation) {
    if (operation.virtual) return;
    setEditingOperationId(operation.id);
    setForm({ date: operation.date, amount: String(operation.amount), description: operation.description, type: operation.type, category: operation.category ?? '' });
    setShowForm(true);
    setError('');
  }

  function deleteOperation(operation: TimelineOperation) {
    if (operation.virtual || !window.confirm(t('operations.confirmDelete', { description: operation.description }))) return;
    persist(operations.filter((item) => item.id !== operation.id));
    if (editingOperationId === operation.id) {
      setEditingOperationId(null);
      setForm(emptyForm());
      setShowForm(false);
    }
    setSelected((current) => current.filter((id) => id !== operation.id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!form.description.trim() || form.amount.trim() === '' || !Number.isFinite(amount)) {
      setError(t('validation.required'));
      return;
    }

    if (form.date < ledgerSettings.openingBalanceDate) {
      setError(t('operations.beforeOpeningDate', { date: dateFormatter.format(new Date(ledgerSettings.openingBalanceDate + 'T12:00:00')) }));
      return;
    }
    if (form.type === 'planned' && form.date < today) {
      setError(t('operations.plannedMustBeFuture'));
      return;
    }

    if (form.type === 'actual') {
      const blocking = overdue.filter((operation) => operation.id !== editingOperationId && operation.date <= form.date);
      if (blocking.length) {
        setError(t('operations.blocked', { count: blocking.length, date: dateFormatter.format(new Date(`${blocking[0].date}T12:00:00`)) }));
        return;
      }
    }

    const values = {
      date: form.date,
      amount,
      description: form.description.trim(),
      type: form.type,
      category: form.type === 'adjustment' ? undefined : form.category.trim() || undefined,
    };
    if (editingOperationId) {
      persist(operations.map((operation) => operation.id === editingOperationId ? { ...operation, ...values } : operation));
      setEditingOperationId(null);
    } else {
      persist([...operations, { id: createId('operation'), ...values }]);
    }
    setForm(emptyForm());
    setShowForm(false);
  }

  function saveOpeningBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const openingBalance = Number(openingBalanceDraft);
    if (openingBalanceDraft.trim() === '' || !Number.isFinite(openingBalance) || !openingDateDraft) { setError(t('validation.required')); return; }
    const earliestOperation = operations.reduce<string | undefined>((earliest, operation) => !earliest || operation.date < earliest ? operation.date : earliest, undefined);
    if (earliestOperation && openingDateDraft > earliestOperation) {
      setError(t('operations.openingDateAfterOperation', { date: dateFormatter.format(new Date(earliestOperation + 'T12:00:00')) }));
      return;
    }
    const nextSettings = { ...ledgerSettings, openingBalance, openingBalanceDate: openingDateDraft };
    setLedgerSettings(nextSettings); saveLedgerSettings(nextSettings); setShowOpeningBalance(false); setError('');
  }

  function saveReconciliation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const actualBalance = Number(reconcileBalance);
    if (reconcileBalance.trim() === '' || !Number.isFinite(actualBalance)) {
      setError(t('validation.required'));
      return;
    }
    const delta = actualBalance - projectedBalanceToday;
    let next = [...operations];
    if (confirmOverdueDuringReconciliation) {
      const confirmableIds = new Set(overdue.filter((item) => !item.virtual).map((item) => item.id));
      const virtualOverdue = overdue.filter((item) => item.virtual);
      next = next.map((operation) => confirmableIds.has(operation.id) ? { ...operation, type: 'actual' as const } : operation);
      for (const item of virtualOverdue) {
        next.push({
          id: createId('operation'),
          date: item.date,
          amount: item.amount,
          description: item.description,
          category: item.category,
          type: 'actual',
          periodicRuleId: item.periodicRuleId,
          occurrenceDate: item.occurrenceDate,
        });
      }
    }
    next.push({
      id: createId('adjustment'),
      date: today,
      amount: delta,
      description: t('operations.balanceAdjustment'),
      type: 'adjustment',
    });
    persist(next);
    const checkpoint = { id: createId('checkpoint'), date: today, actualBalance, calculatedBalance: projectedBalanceToday, difference: delta };
    const nextSettings = { ...ledgerSettings, checkpoints: [...ledgerSettings.checkpoints, checkpoint] };
    setLedgerSettings(nextSettings);
    saveLedgerSettings(nextSettings);
    setShowReconcile(false);
    setReconcileBalance('');
    setConfirmOverdueDuringReconciliation(false);
    setError('');
  }

  const selectedItems = timeline.filter((operation) => selected.includes(operation.id));

  return (
    <section className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('operations.currentBalance')}</p>
          <p className="text-2xl font-semibold tabular-nums">{numberFormatter.format(projectedBalanceToday)}</p>
          {ledgerSettings.checkpoints.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{t('operations.lastConfirmed', { date: dateFormatter.format(new Date(ledgerSettings.checkpoints[ledgerSettings.checkpoints.length - 1].date + 'T12:00:00')), balance: numberFormatter.format(ledgerSettings.checkpoints[ledgerSettings.checkpoints.length - 1].actualBalance) })}</p>}
          {ledgerSettings.checkpoints.length === 0 && <p className="mt-1 text-xs text-muted-foreground">{t('operations.openingBalanceLabel', { date: dateFormatter.format(new Date(ledgerSettings.openingBalanceDate + 'T12:00:00')) })}</p>}
          <Button className="mt-2 h-auto cursor-pointer px-0 py-1 text-xs" variant="link" onClick={() => { setOpeningBalanceDraft(String(ledgerSettings.openingBalance)); setOpeningDateDraft(ledgerSettings.openingBalanceDate); setShowReconcile(false); setShowOpeningBalance((value) => !value); setError(''); }}>{t('operations.editOpeningBalance')}</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setReconcileBalance(String(projectedBalanceToday)); setConfirmOverdueDuringReconciliation(false); setShowOpeningBalance(false); setShowReconcile((value) => !value); setError(''); }} aria-label={t('operations.confirmBalance')} title={t('operations.confirmBalance')}>✓</Button>
          <Button variant="outline" onClick={() => { setReconcileBalance(''); setShowOpeningBalance(false); setShowReconcile((value) => !value); setError(''); }} aria-label={t('operations.adjustBalance')} title={t('operations.adjustBalance')}>✎</Button>
        </div>
        {showOpeningBalance && (
          <form onSubmit={saveOpeningBalance} className="mt-3 grid w-full gap-3 border-t pt-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-sm">{t('operations.openingBalanceAmount')}<Input type="number" step="any" required value={openingBalanceDraft} onChange={(event) => setOpeningBalanceDraft(event.target.value)} /></label>
            <label className="grid gap-1 text-sm">{t('operations.openingBalanceDate')}<Input type="date" required value={openingDateDraft} onChange={(event) => setOpeningDateDraft(event.target.value)} /></label>
            <div className="flex gap-2"><Button type="submit">{t('save')}</Button><Button type="button" variant="outline" onClick={() => { setShowOpeningBalance(false); setError(''); }}>{t('cancel')}</Button></div>
            {error && <p role="alert" className="text-sm text-destructive md:col-span-3">{error}</p>}
          </form>
        )}
        {showReconcile && (
          <form onSubmit={saveReconciliation} className="mt-3 grid w-full gap-3 border-t pt-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div><p className="text-sm text-muted-foreground">{t('operations.projectedBalance')}</p><p className="text-xl font-semibold tabular-nums">{numberFormatter.format(projectedBalanceToday)}</p></div>
            <label className="grid gap-1 text-sm">{t('operations.actualBalance')}<Input type="number" step="any" required value={reconcileBalance} onChange={(event) => setReconcileBalance(event.target.value)} /></label>
            <Button type="submit">{t('operations.createAdjustment')}</Button>
            {overdue.length > 0 && <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" checked={confirmOverdueDuringReconciliation} onChange={(event) => setConfirmOverdueDuringReconciliation(event.target.checked)} />{t('operations.confirmOverdueDuringReconciliation', { count: overdue.length })}</label>}
            <p className="text-sm text-muted-foreground md:col-span-3">{t('operations.reconcileHint')}</p>
            {error && <p role="alert" className="text-sm text-destructive md:col-span-3">{error}</p>}
          </form>
        )}
      </div>
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('operations')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('operations.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { if (showForm) { setShowForm(false); setEditingOperationId(null); setForm(emptyForm()); } else { setShowForm(true); setEditingOperationId(null); setForm(emptyForm()); } setError(''); }}>{t('operations.add')}</Button>
        </div>
      </header>

      {overdue.length > 0 && (
        <div className="shrink-0 rounded-md border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="font-medium">{t('operations.overdue', { count: overdue.length })}</div>
          <div className="mt-1">{t('operations.overdueHint')}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => confirmPlanned(overdue)}>{t('operations.confirmAllPast')}</Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(overdue.map((operation) => operation.id))}>{t('operations.selectPast')}</Button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
          <span>{t('operations.selected', { count: selectedItems.length })}</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => confirmPlanned(selectedItems)}>{t('operations.confirmSelected')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>{t('operations.clearSelection')}</Button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="shrink-0 grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-5">
          <p className="text-sm font-medium md:col-span-2 xl:col-span-5">{t(editingOperationId ? 'operations.editOperation' : 'operations.add')}</p>
          <label className="grid gap-1 text-sm">{t('date')}<Input type="date" min={form.type === 'planned' ? (today > ledgerSettings.openingBalanceDate ? today : ledgerSettings.openingBalanceDate) : ledgerSettings.openingBalanceDate} required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label className="grid gap-1 text-sm">{t('amount')}<Input type="number" step="any" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
          <label className="grid gap-1 text-sm">{t('description')}<Input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} onBlur={() => setForm((current) => current.category.trim() ? current : { ...current, category: current.description.trim() })} /></label>
          <label className="grid gap-1 text-sm">{t('operations.type')}<select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as OperationType })}><option value="actual">{t('operations.actual')}</option><option value="planned">{t('operations.planned')}</option><option value="adjustment">{t('operations.adjustment')}</option></select></label>
          <label className="grid gap-1 text-sm">{t('operations.category')}<Input disabled={form.type === 'adjustment'} value={form.type === 'adjustment' ? '' : form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          {form.type === 'adjustment' && <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-5">{t('operations.adjustmentHint')}</p>}
          {error && <p role="alert" className="text-sm text-destructive md:col-span-2 xl:col-span-5">{error}</p>}
          <div className="flex gap-2 md:col-span-2 xl:col-span-5"><Button type="submit">{t('save')}</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingOperationId(null); setForm(emptyForm()); setError(''); }}>{t('cancel')}</Button></div>
        </form>
      )}

      <div ref={scrollRef} onScroll={(event) => { const element = event.currentTarget; setScrollTop(element.scrollTop); if (element.scrollTop + element.clientHeight >= element.scrollHeight - 600) setForecastMonths((months) => months + 12); }} className="min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border">
        <div className="min-w-[640px] text-sm">
          <div className="sticky top-0 z-10 grid bg-muted font-semibold" style={{ gridTemplateColumns: '52px 64px minmax(100px, 1fr) 88px 96px 80px' }}>
            <div className="px-3 py-2">{t('status')}</div><div className="px-3 py-2">{t('date')}</div><div className="px-3 py-2">{t('description')}</div><div className="px-3 py-2 text-right">{t('amount')}</div><div className="px-3 py-2 text-right">{t('balance')}</div><div className="px-2 py-2">{t('actions')}</div>
          </div>
          <div style={{ height: rowOffsets.totalHeight, position: 'relative' }}>
            {virtualRows.slice(visibleStart, visibleEnd).map((row, visibleIndex) => {
              const index = visibleStart + visibleIndex;
              const rowStyle = { position: 'absolute' as const, top: rowOffsets.offsets[index], left: 0, right: 0, height: row.height };
              if (row.kind === 'month') return <div key={row.key} style={rowStyle} className="flex items-center border-b bg-muted/60 px-3 font-semibold capitalize">{new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(`${row.month}-15T12:00:00`))}</div>;
              if (row.kind === 'today') return <div key={row.key} style={rowStyle} className="flex items-center border-y-2 border-primary bg-primary/10 px-3 font-semibold">{t('operations.today')}</div>;
              if (row.kind === 'summary') return <div key={row.key} style={{ ...rowStyle, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} className="gap-x-5 border-b bg-muted/30 px-3 text-right font-medium">
                <span className="text-green-600">{t('operations.monthIncome')}: <span className="tabular-nums">+{numberFormatter.format(row.income ?? 0)}</span></span><span className="text-red-600">{t('operations.monthExpenses')}: <span className="tabular-nums">{numberFormatter.format(row.expenses ?? 0)}</span></span><span>{t('operations.monthNet')}: <span className={(row.net ?? 0) < 0 ? 'text-red-600 tabular-nums' : (row.net ?? 0) > 0 ? 'text-green-600 tabular-nums' : 'tabular-nums'}>{numberFormatter.format(row.net ?? 0)}</span></span><span>{t('operations.monthEndBalance')}: <span className={(row.monthEndBalance ?? 0) < 0 ? 'text-red-600 tabular-nums' : 'text-green-600 tabular-nums'}>{numberFormatter.format(row.monthEndBalance ?? 0)}</span></span>
              </div>;
              if (row.kind === 'empty') return <div key={row.key} style={rowStyle} className="flex items-center justify-center text-muted-foreground">{t('operations.empty')}</div>;
              const operation = row.operation!;
              return <div key={row.key} style={{ ...rowStyle, display: 'grid', gridTemplateColumns: '52px 104px minmax(100px, 1fr) 88px 96px 80px', alignItems: 'center' }} className={`border-b transition-colors hover:bg-accent/70 ${operation.type === 'planned' ? 'bg-blue-50/50 dark:bg-blue-950/20' : operation.type === 'adjustment' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                <div className="flex items-center gap-1.5 px-3">{operation.type === 'actual' ? '✅' : operation.type === 'planned' ? '🕐' : '✏️'}<span className="sr-only">{t(`operations.${operation.type}`)}</span>{operation.type === 'planned' && operation.date <= today && <input className="m-0 h-3.5 w-3.5 shrink-0" aria-label={t('operations.select')} title={t('operations.select')} type="checkbox" checked={selected.includes(operation.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, operation.id] : current.filter((id) => id !== operation.id))} />}</div>
                <div className="whitespace-nowrap px-3">{operationDateFormatter.format(new Date(`${operation.date}T12:00:00`))}</div>
                <div className="min-w-0 overflow-hidden px-2"><div className="truncate" title={operation.description}>{operation.description}</div>{operation.category && <div className="truncate text-xs text-muted-foreground" title={operation.category}>{operation.category}</div>}</div>
                <div className={`px-2 text-right tabular-nums ${operation.amount < 0 ? 'text-red-600' : operation.amount > 0 ? 'text-green-600' : ''}`}>{numberFormatter.format(operation.amount)}</div><div className={`px-2 text-right tabular-nums ${operation.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>{numberFormatter.format(operation.balance)}</div><div className="flex items-center gap-1 px-1">{!operation.virtual && <><Button size="sm" variant="ghost" className="h-7 px-2" aria-label={t('edit')} title={t('edit')} onClick={() => startEditing(operation)}>✎</Button><Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" aria-label={t('delete')} title={t('delete')} onClick={() => deleteOperation(operation)}>×</Button></>}</div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
