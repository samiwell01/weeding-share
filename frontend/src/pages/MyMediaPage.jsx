import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import Lightbox from '../components/Lightbox';
import LoadingOverlay from '../components/LoadingOverlay';
import Icon from '../components/Icon';

export default function MyMediaPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const {
    authUser,
    guest,
    setGuest,
    guestEvents,
    loadGuests,
    media,
    loadMyMedia,
    deleteMedia,
    message,
  } = useApp();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const viewable = media.filter((m) => m.type === 'photo' || m.type === 'video');

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    const initialize = async () => {
      const entry = guestEvents.find((e) => e.event?.id === eventId);
      if (entry?.guest) {
        setGuest(entry.guest);
        await loadMyMedia(entry.guest.id);
        setPageLoading(false);
        return;
      }

      if (guest?.eventId === eventId) {
        await loadMyMedia(guest.id);
        setPageLoading(false);
        return;
      }

      const list = await loadGuests(eventId);
      const hostGuest = list.find((g) => g.authUserId === authUser.id);
      if (hostGuest) {
        setGuest(hostGuest);
        await loadMyMedia(hostGuest.id);
      }
      setPageLoading(false);
    };

    initialize();
  }, [authUser, eventId, guest, guestEvents, loadGuests, loadMyMedia, navigate, setGuest]);

  if (pageLoading) return <LoadingOverlay message="Chargement des médias…" />;

  return (
    <div className="page-main">
      <div style={{ marginBottom: 'var(--stack-lg)' }}>
        <h2 className="welcome-title">Mes Médias</h2>
        <p className="welcome-subtitle">Retrouvez tous les souvenirs que vous avez partagés.</p>
      </div>

      {message && <p className="message">{message}</p>}

      {media.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Icon name="cloud_upload" size={48} />
          </div>
          <div>
            <h3 className="section-title">Aucun média pour le moment</h3>
            <p className="welcome-subtitle">Partagez votre premier souvenir de cette journée inoubliable !</p>
          </div>
          <Link to={`/events/${eventId}/upload`} className="btn-primary btn-pill">
            <Icon name="add" size={20} /> Ajouter
          </Link>
        </div>
      ) : (
        <div className="media-bento-grid">
          {media.map((item) => {
            const viewIndex = viewable.findIndex((v) => v.id === item.id);

            if (item.type === 'audio') {
              return (
                <div key={item.id} className="memory-frame media-audio-card">
                  <div className="media-audio-card-header">
                    <div className="media-audio-icon">
                      <Icon name="mic" />
                    </div>
                    <button type="button" className="btn-icon" onClick={() => deleteMedia(item.id)} aria-label="Supprimer">
                      <Icon name="delete" style={{ color: 'var(--on-surface-variant)' }} />
                    </button>
                  </div>
                  <div>
                    <p className="font-label" style={{ color: 'var(--primary)', marginBottom: 4 }}>Message vocal</p>
                    <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>{item.fileName}</p>
                  </div>
                  <audio controls src={item.fileUrl} style={{ width: '100%', marginTop: 8 }} />
                </div>
              );
            }

            return (
              <div key={item.id} className="memory-frame media-bento-item">
                {item.type === 'photo' && (
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="clickable"
                    onClick={() => setLightboxIndex(viewIndex)}
                  />
                )}
                {item.type === 'video' && (
                  <>
                    <video src={item.fileUrl} className="media-preview-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="media-video-play clickable" onClick={() => setLightboxIndex(viewIndex)}>
                      <div className="media-video-play-btn">
                        <Icon name="play_arrow" size={28} fill />
                      </div>
                    </div>
                  </>
                )}
                <span className="media-type-icon">
                  <Icon name={item.type === 'video' ? 'videocam' : 'image'} size={18} />
                </span>
                <div className="media-hover-overlay">
                  <button type="button" className="media-delete-btn" onClick={() => deleteMedia(item.id)}>
                    <Icon name="delete" size={16} /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {media.length > 0 && (
        <Link to={`/events/${eventId}/upload`} className="btn-fab" aria-label="Ajouter">
          <Icon name="add" size={28} />
        </Link>
      )}

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
