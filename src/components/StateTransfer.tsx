import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { getOperations, getPeriodicOperations, saveOperations, savePeriodicOperations } from '../entities/operation/model/storage';
import type { Operation, PeriodicOperation } from '../entities/operation/model/types';

type StateFile = { format: 'local-ledger-state'; version: 1; operations?: Operation[]; periodicOperations?: PeriodicOperation[] };
type Dataset = 'operations' | 'periodicOperations';

function chooseDatasets(t: (key: string) => string): Dataset[] {
  const choice = window.prompt(t('stateTransfer.chooseDatasets'));
  if (choice === null) return [];
  const normalized = choice.trim().toLowerCase();
  if (['1', 'operations', 'операции'].includes(normalized)) return ['operations'];
  if (['2', 'periodic', 'periodicoperations', 'периодические', 'периодические операции'].includes(normalized)) return ['periodicOperations'];
  if (['3', 'both', 'оба', 'все'].includes(normalized)) return ['operations', 'periodicOperations'];
  window.alert(t('stateTransfer.invalidChoice'));
  return [];
}

export function StateTransfer() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  function exportState() {
    const datasets = chooseDatasets(t);
    if (!datasets.length) return;
    const payload: StateFile = { format: 'local-ledger-state', version: 1 };
    if (datasets.includes('operations')) payload.operations = getOperations();
    if (datasets.includes('periodicOperations')) payload.periodicOperations = getPeriodicOperations();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `local-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importState(file: File) {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== 'object' || (parsed as StateFile).format !== 'local-ledger-state' || (parsed as StateFile).version !== 1) {
        throw new Error(t('stateTransfer.invalidFile'));
      }
      const data = parsed as StateFile;
      const datasets = chooseDatasets(t);
      if (!datasets.length) return;
      if (datasets.includes('operations')) {
        if (!Array.isArray(data.operations) || !data.operations.every((item) => item && typeof item.id === 'string' && typeof item.date === 'string' && typeof item.description === 'string' && typeof item.amount === 'number' && ['actual', 'planned', 'adjustment'].includes(item.type))) {
          throw new Error(t('stateTransfer.invalidOperations'));
        }
      }
      if (datasets.includes('periodicOperations')) {
        if (!Array.isArray(data.periodicOperations) || !data.periodicOperations.every((item) => item && typeof item.id === 'string' && Number.isInteger(item.day) && item.day >= 1 && item.day <= 31 && typeof item.description === 'string' && typeof item.amount === 'number')) {
          throw new Error(t('stateTransfer.invalidPeriodic'));
        }
      }
      if (datasets.includes('operations')) saveOperations(data.operations!);
      if (datasets.includes('periodicOperations')) savePeriodicOperations(data.periodicOperations!);
      window.dispatchEvent(new CustomEvent('local-ledger:state-imported', { detail: { datasets } }));
      window.alert(t('stateTransfer.importSuccess'));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t('stateTransfer.invalidFile'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return <div className="flex flex-wrap gap-2">
    <Button type="button" variant="outline" onClick={exportState}>{t('stateTransfer.export')}</Button>
    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>{t('stateTransfer.import')}</Button>
    <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importState(file); }} />
  </div>;
}
