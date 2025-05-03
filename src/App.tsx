import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import './i18n';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Operations } from './components/Operations';
import { Reports } from './components/Reports';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
        <Sidebar />

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
