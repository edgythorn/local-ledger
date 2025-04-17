import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Home, List, BarChart2 } from "lucide-react";
import { JSX } from "react";

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-800">
        {/* Sidebar */}
        <aside className="w-64 bg-white p-6 border-r shadow-sm">
          <div className="text-2xl font-bold text-blue-600 mb-6">LocalLedger</div>
          <nav className="space-y-2">
            <NavItem to="/" icon={<Home className="w-5 h-5" />} label="Главная" />
            <NavItem to="/operations" icon={<List className="w-5 h-5" />} label="Операции" />
            <NavItem to="/reports" icon={<BarChart2 className="w-5 h-5" />} label="Отчеты" />
          </nav>
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

// Выделяем компонент для ссылок
function NavItem({ to, icon, label }: { to: string; icon: JSX.Element; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 p-2 rounded-lg font-medium transition-colors duration-200 ${
          isActive ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

// Страницы
function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Главная</h1>
      <Card>Сводка по счетам</Card>
      <Card>Последние операции</Card>
      <Card>Графики</Card>
    </div>
  );
}

function Operations() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Операции</h1>
      <div className="text-gray-600">Фильтры</div>
      <Card>Операция 1</Card>
      <Card>Операция 2</Card>
    </div>
  );
}

function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Отчеты</h1>
      <Card>Список отчетов / поиск</Card>
    </div>
  );
}

// Компонент-карточка
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      {children}
    </div>
  );
}

export default App;
