import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';

export default function WeddingInfoPage() {
  const { id: eventId } = useParams();
  const { authUser, event, loadEventById, loadEventStats, eventStats, guests, loadGuests } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    const load = async () => {
      let e = event;
      if (eventId && (!e || e.id !== eventId)) {
        e = await loadEventById(eventId);
        if (!e) { navigate('/events'); return; }
      }
      if (e) {
        await Promise.all([loadEventStats(e.id), loadGuests(e.id)]);
      }
      setPageLoading(false);
    };
    load();
  }, [authUser, eventId]);

  if (pageLoading) return <LoadingOverlay message="Chargement de l'événement…" />;
  if (!event) return null;

  const isHost = event.adminId === authUser?.id;
  const inviteUrl = `${window.location.origin}/events/join/${event.accessCode}`;
  const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const fmtTime = (t) => t ? t.slice(0, 5) : null;

  return (
    <div className="event-detail-page">
      <div className="event-detail-cover" style={{ backgroundImage: `url(${event.coverUrl || 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=1200&q=70'})` }}>
        <div className="event-detail-cover-overlay">
          <button className="event-back-btn" onClick={() => navigate('/events')}>← Retour</button>
          <div className="event-detail-cover-content">
            {event.category && <span className="event-category-pill">{event.category}</span>}
            <h1 className="event-detail-title">{event.name}</h1>
            {fmt(event.date) && <p className="event-detail-date">{fmt(event.date)}{fmtTime(event.time) ? ` · ${fmtTime(event.time)}` : ''}</p>}
          </div>
        </div>
      </div>

      <div className="event-summary-block">
        {event.description ? <p className="event-summary-text">{event.description}</p> : <p className="event-summary-text">Aucune description pour le moment. Ajoutez-en une pour mieux présenter l'événement.</p>}
        <div className="event-summary-details">
          {event.venueName && <span>📍 {event.venueName}</span>}
          {event.venueAddress && <span>📌 {event.venueAddress}</span>}
          {fmt(event.date) && <span>📅 {fmt(event.date)}{fmtTime(event.time) ? ` • ${fmtTime(event.time)}` : ''}</span>}
        </div>
      </div>

      <div className="event-detail-body">
        <div className="event-tabs">
          <button className={tab === 'info' ? 'tab active' : 'tab'} onClick={() => setTab('info')}>Infos</button>
          <button className={tab === 'photo' ? 'tab active' : 'tab'} onClick={() => setTab('photo')}>Photos{eventStats.photos > 0 ? ' • ' + eventStats.photos : ''}</button>
          <button className={tab === 'video' ? 'tab active' : 'tab'} onClick={() => setTab('video')}>Vidéos{eventStats.videos > 0 ? ' • ' + eventStats.videos : ''}</button>
          <button className={tab === 'stats' ? 'tab active' : 'tab'} onClick={() => setTab('stats')}>Statistiques</button>
          <button className={tab === 'invite' ? 'tab active' : 'tab'} onClick={() => setTab('invite')}>Invités</button>
          {isHost && <button className={tab === 'audio' ? 'tab active' : 'tab'} onClick={() => setTab('audio')}>Audio{eventStats.audios > 0 ? ' • ' + eventStats.audios : ''}</button>}
        </div>

        {tab === 'info' && (
          <>
            <div className="event-detail-desc-block">
              <h3>À propos de l'événement</h3>
              {event.description ? <p>{event.description}</p> : <p>Aucune description pour le moment.</p>}
            </div>
            <div className="event-info-grid">
              {event.venueName && (
                <div className="info-block">
                  <span className="info-icon">📍</span>
                  <span className="info-label">Lieu</span>
                  <span className="info-value">{event.venueName}</span>
                </div>
              )}
              {event.venueAddress && (
                <div className="info-block full">
                  <span className="info-icon">🗺</span>
                  <span className="info-label">Adresse</span>
                  <span className="info-value">{event.venueAddress}</span>
                </div>
              )}
              {fmt(event.date) && (
                <div className="info-block">
                  <span className="info-icon">📅</span>
                  <span className="info-label">Date</span>
                  <span className="info-value">{fmt(event.date)}</span>
                </div>
              )}
              {fmtTime(event.time) && (
                <div className="info-block">
                  <span className="info-icon">🕐</span>
                  <span className="info-label">Heure</span>
                  <span className="info-value">{fmtTime(event.time)}</span>
                </div>
              )}
            </div>
            <div className="navigation-buttons">
              <Link to={`/events/${event.id}/media`} className="button">📸 Mes médias</Link>
              <Link to={`/events/${event.id}/upload`} className="button">📤 Ajouter</Link>
              <Link to={`/events/${event.id}/participants`} className="button button-secondary">👥 Participants ({guests.length})</Link>
              {isHost && <Link to={`/events/${event.id}/edit`} className="button button-secondary">✏️ Modifier</Link>}
            </div>
          </>
        )}

        {tab === 'photo' && (
          <div className="media-tab-section">
            {eventStats.photos === 0 ? (
              <p className="no-media-message">Aucune photo pour le moment.</p>
            ) : (
              <>
                <p className="tab-summary">{eventStats.photos} photo(s) disponibles pour cet événement.</p>
                <Link to={`/events/${event.id}/media`} className="button">Voir tous les médias</Link>
              </>
            )}
          </div>
        )}

        {tab === 'video' && (
          <div className="media-tab-section">
            {eventStats.videos === 0 ? (
              <p className="no-media-message">Aucune vidéo pour le moment.</p>
            ) : (
              <>
                <p className="tab-summary">{eventStats.videos} vidéo(s) disponibles pour cet événement.</p>
                <Link to={`/events/${event.id}/media`} className="button">Voir tous les médias</Link>
              </>
            )}
          </div>
        )}

        {tab === 'stats' && (
          <div className="stats-section">
            <div className="stats-hero-grid">
              <div className="stat-hero-card pink">
                <span className="stat-hero-number">{guests.length}</span>
                <span className="stat-hero-label">Participants</span>
              </div>
              <div className="stat-hero-card blue">
                <span className="stat-hero-number">{eventStats.total}</span>
                <span className="stat-hero-label">Médias total</span>
              </div>
            </div>
            <div className="stats-grid" style={{ marginTop: 16 }}>
              <div className="stat-card">
                <span style={{ fontSize: '1.5rem' }}>📷</span>
                <strong>{eventStats.photos}</strong>
                <span>Photos</span>
              </div>
              <div className="stat-card">
                <span style={{ fontSize: '1.5rem' }}>🎥</span>
                <strong>{eventStats.videos}</strong>
                <span>Vidéos</span>
              </div>
              <div className="stat-card">
                <span style={{ fontSize: '1.5rem' }}>🎵</span>
                <strong>{eventStats.audios}</strong>
                <span>Audios</span>
              </div>
            </div>
            <div className="navigation-buttons">
              <Link to={`/events/${event.id}/participants`} className="button button-secondary">Voir les participants</Link>
            </div>
          </div>
        )}

        {tab === 'invite' && (
          <div className="invite-section">
            <h3>Inviter des participants</h3>
            <p className="auth-subtitle">Partagez ce lien ou ce QR code</p>
            <div className="invite-code-box">
              <span className="invite-label">Code d'accès</span>
              <strong className="invite-code">{event.accessCode}</strong>
            </div>
            <div className="invite-url-box">
              <span className="invite-url">{inviteUrl}</span>
              <button onClick={() => navigator.clipboard.writeText(inviteUrl)}>Copier</button>
            </div>
            <div className="qr-wrapper">
              <QRCodeSVG value={inviteUrl} size={200} />
            </div>
          </div>
        )}

        {tab === 'audio' && isHost && (
          <div className="media-tab-section">
            {eventStats.audios === 0 ? (
              <p className="no-media-message">Aucun message audio pour le moment.</p>
            ) : (
              <>
                <p className="tab-summary">{eventStats.audios} message(s) audio disponibles.</p>
                <Link to={`/events/${event.id}/media`} className="button">Voir tous les médias</Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
