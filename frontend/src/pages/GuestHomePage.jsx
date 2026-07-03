import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from '../AppContext';

export default function GuestHomePage() {
  const navigate = useNavigate();
  const { guest } = useApp();

  useEffect(() => {
    if (!guest) {
      navigate('/');
    }
  }, [guest]);

  if (!guest) {
    return null;
  }

  return (
    <div className="card">
      <h2>Bienvenue {guest.firstName}</h2>
      <p>Choisis une action pour partager tes souvenirs.</p>
      <div className="navigation-buttons">
        <Link to="/guest/upload" className="button">Ajouter un média</Link>
        <Link to="/guest/media" className="button">Mes souvenirs</Link>
      </div>
    </div>
  );
}
