import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import Navigation from './components/Navigation';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSetupPage from './pages/AdminSetupPage';
import WeddingInfoPage from './pages/WeddingInfoPage';
import DashboardPage from './pages/DashboardPage';
import GuestsPage from './pages/GuestsPage';
import GuestDetailPage from './pages/GuestDetailPage';
import GuestOnboardingPage from './pages/GuestOnboardingPage';
import GuestHomePage from './pages/GuestHomePage';
import UploadPage from './pages/UploadPage';
import MyMediaPage from './pages/MyMediaPage';
import UserProfilePage from './pages/UserProfilePage';
import LoadingOverlay from './components/LoadingOverlay';

function HomeRedirect() {
  const { authUser, loading } = useApp();
  if (loading) return <LoadingOverlay message="Connexion en cours…" />;
  return authUser ? <Navigate to="/guest/home" replace /> : <Navigate to="/admin" replace />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navigation />
          <main>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Single login for everyone */}
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/setup" element={<AdminSetupPage />} />
              <Route path="/admin/wedding" element={<WeddingInfoPage />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/guests" element={<GuestsPage />} />
              <Route path="/admin/guest/:id" element={<GuestDetailPage />} />

              {/* Guest invite flow via QR/link */}
              <Route path="/join/:code" element={<GuestOnboardingPage />} />

              {/* Main app (default after login) */}
              <Route path="/guest/home" element={<GuestHomePage />} />
              <Route path="/guest/upload" element={<UploadPage />} />
              <Route path="/guest/media" element={<MyMediaPage />} />

              {/* Profile */}
              <Route path="/profile" element={<UserProfilePage />} />

              {/* Default redirect */}
              <Route path="/" element={<HomeRedirect />} />
              <Route path="*" element={<HomeRedirect />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
