import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import PatternsPage from './pages/PatternsPage';
import PatternDetailPage from './pages/PatternDetailPage';
import KafkaPage from './pages/KafkaPage';
import UberKafkaPage from './pages/UberKafkaPage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"                  element={<HomePage />} />
          <Route path="/modules"               element={<ModulesPage />} />
          <Route path="/module/:moduleId"      element={<ModuleDetailPage />} />
          <Route path="/patterns"              element={<PatternsPage />} />
          <Route path="/patterns/:patternId"   element={<PatternDetailPage />} />
          <Route path="/kafka"                 element={<KafkaPage />} />
          <Route path="/case-study/uber-kafka" element={<UberKafkaPage />} />
          <Route path="/progress"              element={<ProgressPage />} />
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
