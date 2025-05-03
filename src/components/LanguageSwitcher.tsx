import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => i18n.changeLanguage(lang === 'ru' ? 'en' : 'ru')}
      aria-label="Switch language"
    >
      {lang === 'ru' ? '🇬🇧' : '🇷🇺'}
    </Button>
  );
}
