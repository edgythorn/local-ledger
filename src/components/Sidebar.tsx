import { NavLink } from 'react-router-dom';
import { Home, List, CalendarClock, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const { t } = useTranslation();
  const links = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/operations', icon: List, label: t('operations') },
    { to: '/periodic-operations', icon: CalendarClock, label: t('periodic.title') },
    { to: '/reports', icon: BarChart2, label: t('reports') },
  ];

  return (
    <aside className="flex h-screen w-16 flex-col border-r border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 lg:w-64">
      <Logo />
      <nav className="flex flex-1 flex-col space-y-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `flex items-center justify-center rounded-lg p-2 transition-colors lg:justify-start ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'}`
            }
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span className="ml-3 hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto flex items-center justify-start space-x-2">
        <LanguageSwitcher />
        <div className="hidden lg:block"><ThemeToggle /></div>
      </div>
      <div className="block py-2 lg:hidden"><ThemeToggle /></div>
    </aside>
  );
}
