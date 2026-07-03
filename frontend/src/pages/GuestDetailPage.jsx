import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import Lightbox from '../components/Lightbox';
import Icon from '../components/Icon';

export default function GuestDetailPage() {
  const { id, eventId } = useParams();
  const { guests, selectedGuestMedia, loadGuestMedia } = useApp();
  const guest = guests.find((item) => item.id === id);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const viewable = selectedGuestMedia.filter((m) => m.type === 'photo' || m.type === 'video');

  useEffect(() => { if (id) loadGuestMedia(id); }, [id]);

  if (!guest) {
    return (
      <div className="page-main">
        <div className="empty-state">
          <h3 className="section-title">Invité introuvable</h3>
          <Link to="/events" className="btn-primary btn-pill">Retour</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-main">
      <div style={{ marginBottom: 'var(--stack-lg)' }}>
        <h2 className="welcome-title">{guest.firstName} {guest.lastName}</h2>
        {guest.relation && <p className="welcome-subtitle">{guest.relation}</p>}
      </div>

      {selectedGuestMedia.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Icon name="photo_library" size={48} />
          </div>
          <p className="welcome-subtitle">Aucun média envoyé par cet invité.</p>
        </div>
      ) : (
        <div className="media-bento-grid">
          {selectedGuestMedia.map((item) => {
            const viewIndex = viewable.findIndex((v) => v.id === item.id);

            if (item.type === 'audio') {
              return (
                <div key={item.id} className="memory-frame media-audio-card">
                  <div className="media-audio-icon"><Icon name="mic" /></div>
                  <p className="font-label-sm">{item.fileName}</p>
                  <audio controls src={item.fileUrl} style={{ width: '100%' }} />
                </div>
              );
            }

            return (
              <div key={item.id} className="memory-frame media-bento-item">
                {item.type === 'photo' && (
                  <img src={item.fileUrl} alt={item.fileName} className="clickable" onClick={() => setLightboxIndex(viewIndex)} />
                )}
                {item.type === 'video' && (
                  <>
                    <video src={item.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="media-video-play clickable" onClick={() => setLightboxIndex(viewIndex)}>
                      <div className="media-video-play-btn"><Icon name="play_arrow" size={28} fill /></div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link to={`/events/${eventId}/participants`} className="btn-outline btn-primary-full" style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        Retour aux participants
      </Link>

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
