import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import Navigation from './components/Navigation';
import JoinPage from './pages/JoinPage';
import GuestHomePage from './pages/GuestHomePage';
import UploadPage from './pages/UploadPage';
import MyMediaPage from './pages/MyMediaPage';
import DashboardPage from './pages/DashboardPage';
import GuestsPage from './pages/GuestsPage';
import GuestDetailPage from './pages/GuestDetailPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-shell">
          <header>
            <h1>Wedding Share</h1>
            <p>Prototype MVP en plusieurs pages pour inviter, uploader et gérer les souvenirs.</p>
          </header>
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<JoinPage />} />
              <Route path="/guest/home" element={<GuestHomePage />} />
              <Route path="/guest/upload" element={<UploadPage />} />
              <Route path="/guest/media" element={<MyMediaPage />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/guests" element={<GuestsPage />} />
              <Route path="/admin/guest/:id" element={<GuestDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
