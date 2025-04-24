import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { Home, List, BarChart2 } from 'lucide-react';
import './i18n';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Reports } from './components/Reports';
import { Operations } from './components/Operations';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { NavItem } from './components/NavItem';


function App() {
  const { t, i18n } = useTranslation();

  const changeLang = (lng: 'ru' | 'en') => {
    i18n.changeLanguage(lng);
  };

  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <Header />

          <nav className="nav-list">
            <NavItem to="/" icon={<Home className="w-5 h-5" />} label={t('home')} />
            <NavItem to="/operations" icon={<List className="w-5 h-5" />} label={t('operations')} />
            <NavItem to="/reports" icon={<BarChart2 className="w-5 h-5" />} label={t('reports')} />
          </nav>

          <div className="language-switcher">
            <LanguageSwitcher changeLang={changeLang} />
          </div>
        </aside>

        <main className="main-content">
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

export default App;
