import { Button } from './ui/button';
import { useTheme } from '../hooks/useTheme';

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();

  const themeClasses = theme === 'light'
    ? 'bg-gray-600 text-white hover:bg-gray-400'
    : 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <Button
      onClick={toggleTheme}
      aria-pressed={theme === 'dark'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className={classNames(
        'w-8 h-8 rounded-md transition-colors cursor-pointer',
        themeClasses
      )}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
