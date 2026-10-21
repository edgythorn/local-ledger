import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { createId, getPeriodicOperations, savePeriodicOperations } from '../../../entities/operation/model/storage';
import type { PeriodicOperation } from '../../../entities/operation/model/types';

interface RuleForm {
  day: string;
  amount: string;
  description: string;
  category: string;
}

const emptyForm = (): RuleForm => ({ day: '1', amount: '', description: '', category: '' });

export function PeriodicOperationsPage() {
  const { t, i18n } = useTranslation();
  const [rules, setRules] = useState<PeriodicOperation[]>(() => getPeriodicOperations());
  const [form, setForm] = useState<RuleForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function persist(next: PeriodicOperation[]) {
    setRules(next);
    savePeriodicOperations(next);
  }

  function edit(rule: PeriodicOperation) {
    setEditingId(rule.id);
    setForm({ day: String(rule.day), amount: String(rule.amount), description: rule.description, category: rule.category ?? '' });
    setError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const day = Number(form.day);
    const amount = Number(form.amount);
    if (!Number.isInteger(day) || day < 1 || day > 31 || form.amount.trim() === '' || !Number.isFinite(amount) || !form.description.trim()) {
      setError(t('validation.required'));
      return;
    }
    const rule: PeriodicOperation = {
      id: editingId ?? createId('periodic'),
      day,
      amount,
      description: form.description.trim(),
      category: form.category.trim() || undefined,
    };
    persist(editingId ? rules.map((item) => item.id === editingId ? rule : item) : [...rules, rule]);
    setForm(emptyForm());
    setEditingId(null);
    setError('');
  }

  const numberFormatter = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 });
  const sortedRules = [...rules].sort((a, b) => a.day - b.day || a.description.localeCompare(b.description, i18n.language));

  return (
    <section className="flex flex-col gap-4">
      <header><h1 className="text-2xl font-semibold">{t('periodic.title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('periodic.subtitle')}</p></header>
      <form onSubmit={submit} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1 text-sm">{t('periodic.day')}<Input type="number" min={1} max={31} step={1} required value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value })} /></label>
        <label className="grid gap-1 text-sm">{t('amount')}<Input type="number" step="any" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
        <label className="grid gap-1 text-sm">{t('description')}<Input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="grid gap-1 text-sm">{t('operations.category')}<Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
        <div className="flex items-end gap-2"><Button type="submit">{editingId ? t('save') : t('periodic.add')}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm()); setError(''); }}>{t('cancel')}</Button>}</div>
        {error && <p role="alert" className="text-sm text-destructive md:col-span-2 xl:col-span-5">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[650px] table-fixed text-sm">
          <colgroup><col className="w-24" /><col className="w-36" /><col /><col className="w-40" /><col className="w-40" /></colgroup>
          <thead className="bg-muted"><tr><th className="px-3 py-2 text-left">{t('periodic.day')}</th><th className="px-3 py-2 text-right">{t('amount')}</th><th className="px-3 py-2 text-left">{t('description')}</th><th className="px-3 py-2 text-left">{t('operations.category')}</th><th className="px-3 py-2 text-left">{t('actions')}</th></tr></thead>
          <tbody>
            {sortedRules.map((rule) => <tr key={rule.id} className="border-t"><td className="px-3 py-2">{rule.day}</td><td className={`px-3 py-2 text-right tabular-nums ${rule.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{numberFormatter.format(rule.amount)}</td><td className="px-3 py-2 break-words">{rule.description}</td><td className="px-3 py-2 break-words">{rule.category || '—'}</td><td className="px-3 py-2"><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => edit(rule)}>{t('edit')}</Button><Button size="sm" variant="destructive" onClick={() => { persist(rules.filter((item) => item.id !== rule.id)); if (editingId === rule.id) { setEditingId(null); setForm(emptyForm()); } }}>{t('delete')}</Button></div></td></tr>)}
            {rules.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t('periodic.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">{t('periodic.footer')}</p>
    </section>
  );
}
