import { useTranslation } from 'react-i18next';
import { Card } from './Card';

export function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t('dashboard')}</h1>
      <Card>{t('accountSummary')}</Card>
      <Card>{t('recentTransactions')}</Card>
      <Card>{t('charts')}</Card>
    </div>
  );
}
