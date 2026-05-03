import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import HomePage from './pages/HomePage';
import ModulesPage from './pages/ModulesPage';
import PatternsPage from './pages/PatternsPage';
import ProgressPage from './pages/ProgressPage';
import InterviewPrepPage from './pages/InterviewPrepPage';

// Heavy detail pages — code-split per route. Their bundles only load
// when the user actually visits the page, keeping the initial JS small.
const ModuleDetailPage  = lazy(() => import('./pages/ModuleDetailPage'));
const PatternDetailPage = lazy(() => import('./pages/PatternDetailPage'));
const KafkaPage         = lazy(() => import('./pages/KafkaPage'));
const UberKafkaPage     = lazy(() => import('./pages/UberKafkaPage'));
const BankingCaseStudyPage = lazy(() => import('./pages/BankingCaseStudyPage'));
const LoadBalancingCaseStudyPage = lazy(() => import('./pages/LoadBalancingCaseStudyPage'));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-3 text-gray-500">
        <span className="w-4 h-4 rounded-full border-2 border-gray-700 border-t-brand-400 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"                      element={<HomePage />} />
          <Route path="/modules"               element={<ModulesPage />} />
          <Route path="/interview-prep"        element={<InterviewPrepPage />} />
          {/* Legacy URL — the planner used to live as a "module" */}
          <Route path="/module/top-30-system-design-concepts" element={<Navigate to="/interview-prep" replace />} />
          <Route path="/module/:moduleId"      element={<Suspense fallback={<PageSpinner />}><ModuleDetailPage /></Suspense>} />
          <Route path="/patterns"              element={<PatternsPage />} />
          <Route path="/patterns/:patternId"   element={<Suspense fallback={<PageSpinner />}><PatternDetailPage /></Suspense>} />
          <Route path="/kafka"                 element={<Suspense fallback={<PageSpinner />}><KafkaPage /></Suspense>} />
          <Route path="/case-study/uber-kafka" element={<Suspense fallback={<PageSpinner />}><UberKafkaPage /></Suspense>} />
          <Route path="/case-study/paybank"    element={<Suspense fallback={<PageSpinner />}><BankingCaseStudyPage /></Suspense>} />
          <Route path="/case-study/quickeats"  element={<Suspense fallback={<PageSpinner />}><LoadBalancingCaseStudyPage /></Suspense>} />
          <Route path="/progress"              element={<ProgressPage />} />
          <Route path="*"                      element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
