import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function GuestDetailPage() {
  const { id } = useParams();
  const { guests, selectedGuestMedia, loadGuestMedia } = useApp();
  const guest = guests.find((item) => item.id === id);

  useEffect(() => {
    if (id) {
      loadGuestMedia(id);
    }
  }, [id]);

  if (!guest) {
    return (
      <div className="card">
        <h2>Invité introuvable</h2>
        <Link to="/admin/guests" className="button">Retour à la liste</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>{guest.firstName} {guest.lastName}</h2>
      {selectedGuestMedia.length === 0 ? (
        <p>Aucun média envoyé par cet invité.</p>
      ) : (
        <div className="media-list">
          {selectedGuestMedia.map((item) => (
            <div key={item.id} className="media-item">
              <span>{item.type} • {item.fileName}</span>
            </div>
          ))}
        </div>
      )}
      <Link to="/admin/guests" className="button">Retour à la liste</Link>
    </div>
  );
}
