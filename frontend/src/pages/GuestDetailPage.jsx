import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';

function MediaPreview({ item }) {
  if (item.type === 'photo') {
    return <img src={item.fileUrl} alt={item.fileName} className="media-preview-img" />;
  }
  if (item.type === 'video') {
    return <video src={item.fileUrl} controls className="media-preview-img" />;
  }
  if (item.type === 'audio') {
    return <audio src={item.fileUrl} controls className="media-preview-audio" />;
  }
  return <span>{item.fileName}</span>;
}

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
        <div className="media-grid">
          {selectedGuestMedia.map((item) => (
            <div key={item.id} className="media-card">
              <MediaPreview item={item} />
              <div className="media-card-footer">
                <span className="media-card-name">{item.fileName}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/admin/guests" className="button">Retour à la liste</Link>
    </div>
  );
}
