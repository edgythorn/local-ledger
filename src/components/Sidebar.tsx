import { NavLink } from 'react-router-dom';
import { Home, List, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Sidebar() {
    const { t } = useTranslation();

    return (
        <aside
            className="
        flex flex-col
        bg-white dark:bg-gray-900
        border-r border-gray-200 dark:border-gray-700
        w-16 lg:w-64
        h-screen p-4
      "
        >
            <Logo />

            <nav className="flex flex-col space-y-3 flex-1">
                {[
                    { to: '/', icon: Home, label: t('home') },
                    { to: '/operations', icon: List, label: t('operations') },
                    { to: '/reports', icon: BarChart2, label: t('reports') },
                ].map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={label}
                        className={({ isActive }) =>
                            `flex items-center justify-center lg:justify-start
               p-2 rounded-lg transition-colors
               ${isActive
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`
                        }
                    >
                        <Icon className="w-6 h-6" />
                        <span className="hidden lg:inline ml-3">{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto flex items-center justify-start space-x-2">
                <LanguageSwitcher />
            </div>
        </aside>
    );
}
