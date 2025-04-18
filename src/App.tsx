import React, { JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { Home, List, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';


function App() {
  const { t, i18n } = useTranslation();

  const changeLang = (lng: 'ru' | 'en') => {
    i18n.changeLanguage(lng);
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-800">
        {/* Sidebar */}
        <aside className="w-64 bg-white p-6 border-r shadow-sm flex flex-col">
          <Header />

          <nav className="flex-1 space-y-2 mt-4">
            <NavItem to="/" icon={<Home className="w-5 h-5" />} label={t('home')} />
            <NavItem to="/operations" icon={<List className="w-5 h-5" />} label={t('operations')} />
            <NavItem to="/reports" icon={<BarChart2 className="w-5 h-5" />} label={t('reports')} />
          </nav>

          <div className="mt-auto">
            <LanguageSwitcher changeLang={changeLang} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Header() {
  const { t } = useTranslation();
  return (
    <header className="p-4 shadow bg-white">
      <Link
        to="/"
        className="text-3xl font-black tracking-tight text-indigo-600 hover:opacity-80 transition-opacity"
      >
        {t('appName')}
      </Link>
    </header>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 p-2 rounded-lg text-base font-medium transition-colors duration-200 ${
          isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function Dashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t('dashboard')}</h1>
      <Card>{t('accountSummary')}</Card>
      <Card>{t('recentTransactions')}</Card>
      <Card>{t('charts')}</Card>
    </div>
  );
}

function Operations() {
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

function Reports() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t('reports')}</h1>
      <Card>{t('reportsList')}</Card>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {children}
    </div>
  );
}

function LanguageSwitcher({ changeLang }: { changeLang: (lng: 'ru' | 'en') => void }) {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => changeLang('ru')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200"
      >
        <span role="img" aria-label="Russian flag">
          🇷🇺
        </span>
        <span className="text-sm">RU</span>
      </button>
      <button
        onClick={() => changeLang('en')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200"
      >
        <span role="img" aria-label="UK flag">
          🇺🇸
        </span>
        <span className="text-sm">EN</span>
      </button>
    </div>
  );
}

export default App;
