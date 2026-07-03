import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function Navigation() {
  const { guest } = useApp();

  return (
    <nav className="main-nav">
      <Link to="/">Accueil</Link>
      {guest ? (
        <>
          <Link to="/guest/home">Invité</Link>
          <Link to="/guest/upload">Upload</Link>
          <Link to="/guest/media">Mes souvenirs</Link>
        </>
      ) : null}
      <Link to="/admin/dashboard">Mariés</Link>
      <Link to="/admin/guests">Invités</Link>
    </nav>
  );
}
