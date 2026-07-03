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
      <nav className="main-nav">
        <Link to="/admin">Connexion</Link>
      </nav>
    );
  }

  return (
    <nav className="main-nav">
      <Link to="/guest/home">🏠 Accueil</Link>
      <Link to="/admin/wedding">💍 Mon mariage</Link>
      <Link to="/admin/dashboard">📊 Dashboard</Link>
      <Link to="/admin/guests">👥 Invités</Link>
      <Link to="/profile" className="nav-profile-link">
        <NavAvatar
          firstName={userProfile?.firstName}
          lastName={userProfile?.lastName}
          avatarUrl={userProfile?.avatarUrl}
        />
      </Link>
    </nav>
  );
}
