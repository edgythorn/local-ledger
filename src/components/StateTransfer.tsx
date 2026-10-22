import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { getLedgerSettings, getOperations, getPeriodicOperations, saveLedgerSettings, saveOperations, savePeriodicOperations } from '../entities/operation/model/storage';
import type { LedgerSettings, Operation, PeriodicOperation } from '../entities/operation/model/types';

type StateFile = { format: 'local-ledger-state'; version: 1; operations?: Operation[]; periodicOperations?: PeriodicOperation[]; settings?: LedgerSettings };
type Dataset = 'operations' | 'periodicOperations' | 'settings';
type TransferMode = 'export' | 'import';

function isOperationList(value: unknown): value is Operation[] {
  return Array.isArray(value) && value.every((item) => item && typeof item.id === 'string' && typeof item.date === 'string' && typeof item.description === 'string' && typeof item.amount === 'number' && ['actual', 'planned', 'adjustment'].includes(item.type));
}
function isPeriodicList(value: unknown): value is PeriodicOperation[] {
  return Array.isArray(value) && value.every((item) => item && typeof item.id === 'string' && Number.isInteger(item.day) && item.day >= 1 && item.day <= 31 && typeof item.description === 'string' && typeof item.amount === 'number');
}
function isLedgerSettings(value: unknown): value is LedgerSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<LedgerSettings>;
  return typeof settings.openingBalance === 'number' && Number.isFinite(settings.openingBalance) && typeof settings.openingBalanceDate === 'string' && Array.isArray(settings.checkpoints) && settings.checkpoints.every((item) => item && typeof item.id === 'string' && typeof item.date === 'string' && typeof item.actualBalance === 'number' && typeof item.calculatedBalance === 'number' && typeof item.difference === 'number');
}

export function StateTransfer() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<TransferMode | null>(null);
  const [includeOperations, setIncludeOperations] = useState(true);
  const [includePeriodic, setIncludePeriodic] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function openTransfer(nextMode: TransferMode) {
    setIncludeOperations(true);
    setIncludePeriodic(true);
    setIncludeSettings(true);
    setPendingFile(null);
    setMode(nextMode);
    if (nextMode === 'import') fileRef.current?.click();
  }

  function exportState(datasets: Dataset[]) {
    const payload: StateFile = { format: 'local-ledger-state', version: 1 };
    if (datasets.includes('operations')) payload.operations = getOperations();
    if (datasets.includes('periodicOperations')) payload.periodicOperations = getPeriodicOperations();
    if (datasets.includes('settings')) payload.settings = getLedgerSettings();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `local-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function confirmTransfer() {
    const datasets: Dataset[] = [
      ...(includeOperations ? ['operations' as const] : []),
      ...(includePeriodic ? ['periodicOperations' as const] : []),
      ...(includeSettings ? ['settings' as const] : []),
    ];
    if (!datasets.length) {
      window.alert(t('stateTransfer.selectAtLeastOne'));
      return;
    }
    if (mode === 'export') {
      exportState(datasets);
      setMode(null);
      return;
    }
    if (!pendingFile) {
      window.alert(t('stateTransfer.selectFile'));
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await pendingFile.text());
      if (!parsed || typeof parsed !== 'object' || (parsed as StateFile).format !== 'local-ledger-state' || (parsed as StateFile).version !== 1) {
        throw new Error(t('stateTransfer.invalidFile'));
      }
      const data = parsed as StateFile;
      if (datasets.includes('operations') && !isOperationList(data.operations)) throw new Error(t('stateTransfer.invalidOperations'));
      if (datasets.includes('periodicOperations') && !isPeriodicList(data.periodicOperations)) throw new Error(t('stateTransfer.invalidPeriodic'));
      if (datasets.includes('settings') && !isLedgerSettings(data.settings)) throw new Error(t('stateTransfer.invalidSettings'));
      if (datasets.includes('operations')) saveOperations(data.operations!);
      if (datasets.includes('periodicOperations')) savePeriodicOperations(data.periodicOperations!);
      if (datasets.includes('settings')) saveLedgerSettings(data.settings!);
      window.dispatchEvent(new CustomEvent('local-ledger:state-imported', { detail: { datasets } }));
      window.alert(t('stateTransfer.importSuccess'));
      setMode(null);
      setPendingFile(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : t('stateTransfer.invalidFile'));
    }
  }

  return <div className="flex flex-wrap items-center gap-2">
    <Button type="button" variant="outline" onClick={() => openTransfer('export')}>{t('stateTransfer.export')}</Button>
    <Button type="button" variant="outline" onClick={() => openTransfer('import')}>{t('stateTransfer.import')}</Button>
    <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => {
      const file = event.target.files?.[0];
      if (file) { setPendingFile(file); setMode('import'); }
      else setMode(null);
    }} />
    {mode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMode(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="state-transfer-title" className="w-full max-w-md rounded-lg border bg-background p-5 shadow-lg">
        <h2 id="state-transfer-title" className="text-lg font-semibold">{t(mode === 'export' ? 'stateTransfer.exportTitle' : 'stateTransfer.importTitle')}</h2>
        {mode === 'import' && <p className="mt-2 text-sm text-muted-foreground">{pendingFile ? t('stateTransfer.selectedFile', { name: pendingFile.name }) : t('stateTransfer.selectFile')}</p>}
        <div className="mt-4 grid gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeOperations} onChange={(event) => setIncludeOperations(event.target.checked)} />{t('stateTransfer.operations')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includePeriodic} onChange={(event) => setIncludePeriodic(event.target.checked)} />{t('stateTransfer.periodicOperations')}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeSettings} onChange={(event) => setIncludeSettings(event.target.checked)} />{t('stateTransfer.balanceSettings')}</label>
        </div>
        {mode === 'import' && <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{t('stateTransfer.replaceWarning')}</p>}
        <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setMode(null); setPendingFile(null); if (fileRef.current) fileRef.current.value = ''; }}>{t('cancel')}</Button><Button type="button" onClick={() => void confirmTransfer()} disabled={mode === 'import' && !pendingFile}>{t(mode === 'export' ? 'stateTransfer.export' : 'stateTransfer.import')}</Button></div>
      </section>
    </div>}
  </div>;
}
