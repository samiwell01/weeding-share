import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import Lightbox from '../components/Lightbox';

export default function GuestDetailPage() {
  const { id } = useParams();
  const { guests, selectedGuestMedia, loadGuestMedia } = useApp();
  const guest = guests.find((item) => item.id === id);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const viewable = selectedGuestMedia.filter((m) => m.type === 'photo' || m.type === 'video');

  useEffect(() => { if (id) loadGuestMedia(id); }, [id]);

  if (!guest) {
    return (
      <div className="card">
        <h2>Invité introuvable</h2>
        <Link to="/events" className="button">Retour</Link>
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
          {selectedGuestMedia.map((item) => {
            const viewIndex = viewable.findIndex((v) => v.id === item.id);
            return (
              <div key={item.id} className="media-card">
                {item.type === 'photo' && (
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="media-preview-img clickable"
                    onClick={() => setLightboxIndex(viewIndex)}
                  />
                )}
                {item.type === 'video' && (
                  <div className="media-video-thumb clickable" onClick={() => setLightboxIndex(viewIndex)}>
                    <video src={item.fileUrl} className="media-preview-img" />
                    <span className="play-icon">▶</span>
                  </div>
                )}
                {item.type === 'audio' && (
                  <audio src={item.fileUrl} controls className="media-preview-audio" />
                )}
                <div className="media-card-footer">
                  <span className="media-card-name">{item.fileName}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Link to="/events" className="button">Retour</Link>

      {lightboxIndex !== null && (
        <Lightbox
          items={viewable}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(viewable.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
