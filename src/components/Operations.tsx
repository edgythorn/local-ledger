import { useTranslation } from 'react-i18next';
import { Card } from './Card';

export function Operations() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t('transactions')}</h1>
      <div className="text-gray-600">{t('filters')}</div>
      <Card>{t('operationExample1')}</Card>
      <Card>{t('operationExample2')}</Card>
    </div>
  );
}
