export function LanguageSwitcher({ changeLang }: { changeLang: (lng: 'ru' | 'en') => void; }) {
  return (
    <div className="flex space-x-2">
      <button onClick={() => changeLang('ru')} className="flex items-center gap-1">
        <span role="img" aria-label="Russian flag">🇷🇺</span>
        <span className="text-sm">RU</span>
      </button>
      <button onClick={() => changeLang('en')} className="flex items-center gap-1">
        <span role="img" aria-label="UK flag">🇬🇧</span>
        <span className="text-sm">EN</span>
      </button>
    </div>
  );
}
