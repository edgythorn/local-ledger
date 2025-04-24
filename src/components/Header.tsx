import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="header">
      <Link to="/" className="logo">
        {t('appName')}
      </Link>
    </header>
  );
}