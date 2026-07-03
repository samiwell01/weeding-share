import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import Lightbox from '../components/Lightbox';

export default function MyMediaPage() {
  const navigate = useNavigate();
  const { guest, media, loadMyMedia, deleteMedia, message } = useApp();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const viewable = media.filter((m) => m.type === 'photo' || m.type === 'video');

  useEffect(() => {
    if (guest) loadMyMedia(guest.id);
    else navigate('/');
  }, [guest]);

  if (!guest) return null;

  return (
    <div className="card">
      <h2>Mes souvenirs</h2>
      {message && <p className="message">{message}</p>}
      {media.length === 0 ? (
        <p>Aucun média pour le moment.</p>
      ) : (
        <div className="media-grid">
          {media.map((item) => {
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
                  <button onClick={() => deleteMedia(item.id)}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="navigation-buttons">
        <Link to="/guest/home" className="button">Retour</Link>
      </div>

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
