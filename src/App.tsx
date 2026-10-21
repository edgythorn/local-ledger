import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import './i18n';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Reports } from './components/Reports';
import { OperationsPage } from './pages/operations/ui/OperationsPage';
import { PeriodicOperationsPage } from './pages/periodic-operations/ui/PeriodicOperationsPage';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/periodic-operations" element={<PeriodicOperationsPage />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
