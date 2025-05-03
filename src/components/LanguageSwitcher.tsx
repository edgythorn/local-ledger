import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <Button
      variant="outline"
      onClick={() => i18n.changeLanguage(lang === 'ru' ? 'en' : 'ru')}
      aria-label="Switch language"
      className="w-8 h-8 
      rounded-md 
      cursor-pointer 
      hover:bg-muted"
    >
      {lang === 'ru' ? '🇬🇧' : '🇷🇺'}
    </Button>
  );
}