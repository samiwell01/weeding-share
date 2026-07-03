import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
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
import JoinPage from './pages/JoinPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navigation />
          <main>
            <Routes>
              {/* Auth */}
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/setup" element={<AdminSetupPage />} />
              <Route path="/admin/wedding" element={<WeddingInfoPage />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/guests" element={<GuestsPage />} />
              <Route path="/admin/guest/:id" element={<GuestDetailPage />} />

              {/* Guest invite flow */}
              <Route path="/join/:code" element={<GuestOnboardingPage />} />

              {/* Guest app */}
              <Route path="/guest/home" element={<GuestHomePage />} />
              <Route path="/guest/upload" element={<UploadPage />} />
              <Route path="/guest/media" element={<MyMediaPage />} />

              {/* Legacy */}
              <Route path="/" element={<JoinPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
