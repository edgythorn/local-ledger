import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Logo() {
  const { t } = useTranslation();

  return (
    <Link
      to="/"
      className="
        mb-6 flex items-center justify-center lg:justify-start
        p-2 rounded-lg transition-colors
        hover:bg-gray-100 dark:hover:bg-gray-800
      "
    >
      <span className="hidden lg:inline text-2xl font-bold text-indigo-600">
        {t('appName')}
      </span>
      <span className="inline lg:hidden text-2xl font-bold text-indigo-600">
        LL
      </span>
    </Link>
  );
}
