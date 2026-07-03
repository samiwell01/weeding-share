import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from './Icon';

function NavAvatar({ firstName, lastName, avatarUrl }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt="avatar" />;
  return <span className="header-avatar-initials">{initials}</span>;
}

export default function Navigation() {
  const { authUser, userProfile } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  if (!authUser) {
    return (
      <header className="top-header">
        <div className="top-header-inner">
          <Link to="/login" className="top-header-brand">Tsiarhoom</Link>
          <Link to="/login" className="btn-outline btn-pill" style={{ padding: '8px 20px', fontSize: 14 }}>
            Connexion
          </Link>
        </div>
      </header>
    );
  }

  const isEvents = location.pathname.startsWith('/events') || location.pathname === '/';
  const isProfile = location.pathname === '/profile';
  const canGoBack = location.pathname !== '/events' && !location.pathname.startsWith('/login');

  return (
    <>
      <header className="top-header">
        <div className="top-header-inner">
          <div className="top-header-back">
            {canGoBack && (
              <button type="button" className="btn-icon" onClick={() => navigate(-1)} aria-label="Retour">
                <Icon name="arrow_back" />
              </button>
            )}
            <Link to="/events" className="top-header-brand">Tsiarhoom</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <nav className="header-nav-links">
              <Link to="/events">Événements</Link>
              <Link to="/events/create">Créer</Link>
            </nav>
            <Link to="/profile" className="header-avatar">
              <NavAvatar
                firstName={userProfile?.firstName}
                lastName={userProfile?.lastName}
                avatarUrl={userProfile?.avatarUrl}
              />
            </Link>
          </div>
        </div>
      </header>

      <nav className="bottom-nav-bar">
        <Link to="/events" className={`bottom-nav-item${isEvents ? ' active' : ''}`}>
          <Icon name="event" fill={isEvents} />
          <span>Events</span>
        </Link>
        <Link to="/profile" className={`bottom-nav-item${isProfile ? ' active' : ''}`}>
          <Icon name="person" fill={isProfile} />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}
