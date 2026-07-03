import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import Lightbox from '../components/Lightbox';
import LoadingOverlay from '../components/LoadingOverlay';

export default function MyMediaPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const {
    authUser,
    guest,
    setGuest,
    guestEvents,
    guests,
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
    <div className="card">
      <h2>Mes médias</h2>
      {message && <p className="message">{message}</p>}
      {media.length === 0 ? (
        <p className="auth-subtitle">Aucun média pour le moment.</p>
      ) : (
        <div className="media-grid">
          {media.map((item) => {
            const viewIndex = viewable.findIndex((v) => v.id === item.id);
            return (
              <div key={item.id} className="media-card">
                {item.type === 'photo' && (
                  <img src={item.fileUrl} alt={item.fileName} className="media-preview-img clickable" onClick={() => setLightboxIndex(viewIndex)} />
                )}
                {item.type === 'video' && (
                  <div className="media-video-thumb clickable" onClick={() => setLightboxIndex(viewIndex)}>
                    <video src={item.fileUrl} className="media-preview-img" />
                    <span className="play-icon">▶</span>
                  </div>
                )}
                {item.type === 'audio' && <audio src={item.fileUrl} controls className="media-preview-audio" />}
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
        <Link to={eventId ? `/events/${eventId}` : '/events'} className="button button-secondary">Retour</Link>
        <Link to={eventId ? `/events/${eventId}/upload` : '/events'} className="button">📤 Ajouter</Link>
      </div>
      {lightboxIndex !== null && (
        <Lightbox items={viewable} index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(viewable.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
