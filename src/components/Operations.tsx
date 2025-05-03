import { useTranslation } from "react-i18next";
import { Card } from "./ui/card";

export function Operations() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('operations')}</h1>
      <Card>{t('filters')}</Card>
    </div>
  );
}
