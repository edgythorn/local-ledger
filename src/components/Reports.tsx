import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';

export function Reports() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t('reports')}</h1>
      <Card>{t('reportsList')}</Card>
    </div>
  );
}
