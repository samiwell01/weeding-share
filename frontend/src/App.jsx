import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { useApp } from './AppContext';
import Navigation from './components/Navigation';
import LoadingOverlay from './components/LoadingOverlay';
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

function HomeRedirect() {
  const { authUser, loading } = useApp();
  if (loading) return <LoadingOverlay message="Chargement…" />;
  return <Navigate to={authUser ? '/events' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <>
      <Navigation />
      <main>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/events" element={<GuestHomePage />} />
          <Route path="/events/create" element={<AdminSetupPage />} />
          <Route path="/events/join/:code" element={<GuestOnboardingPage />} />
          <Route path="/events/:id/edit" element={<AdminSetupPage />} />
          <Route path="/events/:id/upload" element={<UploadPage />} />
          <Route path="/events/:id/media" element={<MyMediaPage />} />
          <Route path="/events/:id/participants" element={<GuestsPage />} />
          <Route path="/events/:eventId/participant/:id" element={<GuestDetailPage />} />
          <Route path="/events/:id/summary" element={<DashboardPage />} />
          <Route path="/events/:id" element={<WeddingInfoPage />} />
          <Route path="/join/:code" element={<GuestOnboardingPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
