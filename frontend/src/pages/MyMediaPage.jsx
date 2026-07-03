import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function MyMediaPage() {
  const navigate = useNavigate();
  const { guest, media, loadMyMedia, deleteMedia, message } = useApp();

  useEffect(() => {
    if (guest) {
      loadMyMedia(guest.id);
    } else {
      navigate('/');
    }
  }, [guest]);

  if (!guest) {
    return null;
  }

  return (
    <div className="card">
      <h2>Mes souvenirs</h2>
      {message && <p className="message">{message}</p>}
      {media.length === 0 ? (
        <p>Aucun média pour le moment.</p>
      ) : (
        <div className="media-list">
          {media.map((item) => (
            <div key={item.id} className="media-item">
              <span>{item.type} • {item.fileName}</span>
              <button onClick={() => deleteMedia(item.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
      <div className="navigation-buttons">
        <Link to="/guest/home" className="button">Retour à l'accueil</Link>
      </div>
    </div>
  );
}
