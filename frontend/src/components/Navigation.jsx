import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Navigation() {
  const { authUser, guest, event, signOut } = useApp();

  return (
    <nav className="main-nav">
      {guest ? (
        <>
          <Link to="/guest/home">🏠 Accueil</Link>
          <Link to="/guest/upload">📤 Upload</Link>
          <Link to="/guest/media">🖼 Mes souvenirs</Link>
          <button className="nav-signout" onClick={signOut}>Déconnexion</button>
        </>
      ) : authUser ? (
        <>
          <Link to="/admin/wedding">💍 Mon mariage</Link>
          <Link to="/admin/dashboard">📊 Dashboard</Link>
          <Link to="/admin/guests">👥 Invités</Link>
          <button className="nav-signout" onClick={signOut}>Déconnexion</button>
        </>
      ) : (
        <>
          <Link to="/">Invité</Link>
          <Link to="/admin">Mariés</Link>
        </>
      )}
    </nav>
  );
}
