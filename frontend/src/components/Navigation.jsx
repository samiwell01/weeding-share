import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';

function NavAvatar({ firstName, lastName, avatarUrl }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt="avatar" className="nav-avatar-img" />;
  return <div className="nav-avatar-initials">{initials}</div>;
}

export default function Navigation() {
  const { authUser, userProfile, signOut } = useApp();

  if (!authUser) {
    return (
      <nav className="main-nav header-nav">
        <Link to="/login">Connexion</Link>
      </nav>
    );
  }

  return (
    <>
      <nav className="main-nav header-nav">
        <Link to="/events">🏠 Événements</Link>
        <Link to="/events/create">➕ Créer</Link>
        <Link to="/events/join">🔗 Rejoindre</Link>
        <div className="nav-right-group">
          <Link to="/profile" className="nav-profile-link">
            <NavAvatar
              firstName={userProfile?.firstName}
              lastName={userProfile?.lastName}
              avatarUrl={userProfile?.avatarUrl}
            />
          </Link>
          <button className="nav-signout" onClick={signOut}>Déconnexion</button>
        </div>
      </nav>
      <nav className="main-nav bottom-nav">
        <Link to="/events">🏠</Link>
        <Link to="/events/create">➕</Link>
        <Link to="/events/join">🔗</Link>
        <Link to="/profile">👤</Link>
      </nav>
    </>
  );
}
