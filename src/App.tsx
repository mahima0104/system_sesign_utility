import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"                  element={<HomePage />} />
          <Route path="/modules"           element={<ModulesPage />} />
          <Route path="/module/:moduleId"  element={<ModuleDetailPage />} />
          <Route path="/progress"          element={<ProgressPage />} />
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
