import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';

export function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('dashboard')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>{t('accountSummary')}</Card>
        <Card>{t('recentTransactions')}</Card>
        <Card>{t('charts')}</Card>
      </div>
    </div>
  );
}
