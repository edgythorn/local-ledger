import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
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
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [reconcileBalance, setReconcileBalance] = useState('');
  const [showReconcile, setShowReconcile] = useState(false);
  const [confirmOverdueDuringReconciliation, setConfirmOverdueDuringReconciliation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = localDateString(new Date());
  const timeline = useMemo(() => buildTimeline(operations, periodicRules, ledgerSettings), [operations, periodicRules, ledgerSettings]);
  const overdue = timeline.filter((operation) => operation.type === 'planned' && operation.date <= today);
  const projectedBalanceToday = timeline
    .filter((operation) => operation.date <= today)
    .reduce((latest, operation) => operation.balance, ledgerSettings.openingBalance);

  useEffect(() => {
    document.getElementById('today-marker')?.scrollIntoView({ block: 'center' });
  }, []);

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }),
    [i18n.language],
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const amount = Number(form.amount);
    if (!form.description.trim() || form.amount.trim() === '' || !Number.isFinite(amount)) {
      setError(t('validation.required'));
      return;
    }

    if (form.type === 'actual') {
      const blocking = overdue.filter((operation) => operation.date <= form.date);
      if (blocking.length) {
        setError(t('operations.blocked', { count: blocking.length, date: dateFormatter.format(new Date(`${blocking[0].date}T12:00:00`)) }));
        return;
      }
    }

    persist([...operations, {
      id: createId('operation'),
      date: form.date,
      amount,
      description: form.description.trim(),
      type: form.type,
      category: form.type === 'adjustment' ? undefined : form.category.trim() || undefined,
    }]);
    setForm(emptyForm());
    setShowForm(false);
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
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">{t('operations.currentBalance')}</p>
          <p className="text-2xl font-semibold tabular-nums">{numberFormatter.format(projectedBalanceToday)}</p>
          {ledgerSettings.checkpoints.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{t('operations.lastConfirmed', { date: dateFormatter.format(new Date(ledgerSettings.checkpoints[ledgerSettings.checkpoints.length - 1].date + 'T12:00:00')), balance: numberFormatter.format(ledgerSettings.checkpoints[ledgerSettings.checkpoints.length - 1].actualBalance) })}</p>}
          {ledgerSettings.checkpoints.length === 0 && <p className="mt-1 text-xs text-muted-foreground">{t('operations.openingBalanceLabel', { date: dateFormatter.format(new Date(ledgerSettings.openingBalanceDate + 'T12:00:00')) })}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setReconcileBalance(String(projectedBalanceToday)); setConfirmOverdueDuringReconciliation(false); setShowReconcile(true); setError(''); }} aria-label={t('operations.confirmBalance')} title={t('operations.confirmBalance')}>✓</Button>
          <Button variant="outline" onClick={() => { setReconcileBalance(''); setShowReconcile(true); setError(''); }} aria-label={t('operations.adjustBalance')} title={t('operations.adjustBalance')}>✎</Button>
        </div>
      </div>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('operations')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('operations.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setShowForm((value) => !value); setError(''); }}>{t('operations.add')}</Button>
        </div>
      </header>

      {overdue.length > 0 && (
        <div className="rounded-md border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="font-medium">{t('operations.overdue', { count: overdue.length })}</div>
          <div className="mt-1">{t('operations.overdueHint')}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => confirmPlanned(overdue)}>{t('operations.confirmAllPast')}</Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(overdue.map((operation) => operation.id))}>{t('operations.selectPast')}</Button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
          <span>{t('operations.selected', { count: selectedItems.length })}</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => confirmPlanned(selectedItems)}>{t('operations.confirmSelected')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>{t('operations.clearSelection')}</Button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-sm">{t('date')}<Input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label className="grid gap-1 text-sm">{t('amount')}<Input type="number" step="any" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
          <label className="grid gap-1 text-sm">{t('description')}<Input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="grid gap-1 text-sm">{t('operations.type')}<select className="h-9 rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as OperationType })}><option value="actual">{t('operations.actual')}</option><option value="planned">{t('operations.planned')}</option><option value="adjustment">{t('operations.adjustment')}</option></select></label>
          <label className="grid gap-1 text-sm">{t('operations.category')}<Input disabled={form.type === 'adjustment'} value={form.type === 'adjustment' ? '' : form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          {form.type === 'adjustment' && <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-5">{t('operations.adjustmentHint')}</p>}
          {error && <p role="alert" className="text-sm text-destructive md:col-span-2 xl:col-span-5">{error}</p>}
          <div className="flex gap-2 md:col-span-2 xl:col-span-5"><Button type="submit">{t('save')}</Button><Button type="button" variant="outline" onClick={() => { setShowForm(false); setError(''); }}>{t('cancel')}</Button></div>
        </form>
      )}

      {showReconcile && (
        <form onSubmit={saveReconciliation} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div><p className="text-sm text-muted-foreground">{t('operations.projectedBalance')}</p><p className="text-xl font-semibold tabular-nums">{numberFormatter.format(projectedBalanceToday)}</p></div>
          <label className="grid gap-1 text-sm">{t('operations.actualBalance')}<Input type="number" step="any" required value={reconcileBalance} onChange={(event) => setReconcileBalance(event.target.value)} /></label>
          <Button type="submit">{t('operations.createAdjustment')}</Button>
          {overdue.length > 0 && <label className="flex items-center gap-2 text-sm md:col-span-3"><input type="checkbox" checked={confirmOverdueDuringReconciliation} onChange={(event) => setConfirmOverdueDuringReconciliation(event.target.checked)} />{t('operations.confirmOverdueDuringReconciliation', { count: overdue.length })}</label>}
          <p className="text-sm text-muted-foreground md:col-span-3">{t('operations.reconcileHint')}</p>
          {error && <p role="alert" className="text-sm text-destructive md:col-span-3">{error}</p>}
        </form>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto rounded-lg border">
        <table className="w-full min-w-[900px] table-auto text-sm">
          <colgroup><col className="min-w-[56px] w-[64px]" /><col className="min-w-[124px]" /><col className="min-w-[220px] w-full" /><col className="min-w-[120px]" /><col className="min-w-[140px]" /></colgroup>
          <thead className="sticky top-0 z-10 bg-muted">
            <tr><th className="px-3 py-2 text-left">{t('status')}</th><th className="px-3 py-2 text-left">{t('date')}</th><th className="px-3 py-2 text-left">{t('description')}</th><th className="px-3 py-2 text-right">{t('amount')}</th><th className="px-3 py-2 text-right">{t('balance')}</th></tr>
          </thead>
          <tbody>
            {timeline.map((operation, index) => {
              const previous = timeline[index - 1];
              const isTodayMarker = operation.date >= today && (!previous || previous.date < today);
              const month = operation.date.slice(0, 7);
              const previousMonth = previous?.date.slice(0, 7);
              return (
                <Fragment key={operation.id}>
                  {(!previous || previousMonth !== month) && (() => {
                    const monthOperations = timeline.filter((item) => item.date.slice(0, 7) === month);
                    const income = monthOperations.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
                    const expenses = monthOperations.reduce((sum, item) => sum + Math.min(0, item.amount), 0);
                    const monthEndBalance = monthOperations[monthOperations.length - 1]?.balance ?? ledgerSettings.openingBalance;
                    return <tr><td colSpan={5} className="bg-muted/60 px-3 py-2"><div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-medium"><span>{new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(new Date(`${month}-15T12:00:00`))}</span><span className="text-green-600">+{numberFormatter.format(income)}</span><span className="text-red-600">{numberFormatter.format(expenses)}</span><span>{t('operations.monthNet')}: {numberFormatter.format(income + expenses)}</span><span className="ml-auto">{t('operations.monthEndBalance')}: {numberFormatter.format(monthEndBalance)}</span></div></td></tr>;
                  })()}
                  {isTodayMarker && <tr id="today-marker"><td colSpan={5} className="border-y-2 border-primary bg-primary/10 px-3 py-2 font-semibold">{t('operations.today')}</td></tr>}
                  <tr className={operation.type === 'planned' ? 'bg-blue-50/50 dark:bg-blue-950/20' : operation.type === 'adjustment' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {operation.type === 'actual' ? '✅' : operation.type === 'planned' ? '🕐' : '✏️'}
                        <span className="sr-only">{t(`operations.${operation.type}`)}</span>
                      </div>
                      {operation.type === 'planned' && operation.date <= today && <label className="mt-1 flex items-center gap-1 text-xs" title={t('operations.select')}><input aria-label={t('operations.select')} type="checkbox" checked={selected.includes(operation.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, operation.id] : current.filter((id) => id !== operation.id))} /></label>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{dateFormatter.format(new Date(`${operation.date}T12:00:00`))}</td>
                    <td className="px-3 py-2"><div>{operation.description}</div>{operation.category && <div className="text-xs text-muted-foreground">{operation.category}</div>}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${operation.amount < 0 ? 'text-red-600' : operation.amount > 0 ? 'text-green-600' : ''}`}>{numberFormatter.format(operation.amount)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${operation.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>{numberFormatter.format(operation.balance)}</td>
                  </tr>
                </Fragment>
              );
            })}
            {timeline.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('operations.empty')}</td></tr>}
            {!timeline.some((operation) => operation.date >= today) && <tr id="today-marker"><td colSpan={5} className="border-y-2 border-primary bg-primary/10 px-3 py-2 font-semibold">{t('operations.today')}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
