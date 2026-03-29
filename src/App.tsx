import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Navigation } from './components/layout/Navigation';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Auth } from './pages/Auth';
import { Home } from './pages/Home';
import { Connections } from './pages/Connections';
import { Settings } from './pages/Settings';
import { useAuthStore } from './stores/authStore';

function AppContent() {
  const { user } = useAuthStore();
  return (
    <>
      {user && <Navigation />}
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  useAuth();
  const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppContent />
    </Router>
  );
}
