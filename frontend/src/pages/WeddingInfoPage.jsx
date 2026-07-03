import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Icon from '../components/Icon';

export default function WeddingInfoPage() {
  const { id: eventId } = useParams();
  const { authUser, event, loadEventById, loadEventStats, eventStats, guests, loadGuests } = useApp();
  const navigate = useNavigate();
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState('');
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

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/events/join/${event.accessCode}`);
    setToast('Lien copié !');
    setTimeout(() => setToast(''), 3000);
  };

  if (pageLoading) return <LoadingOverlay message="Chargement de l'événement…" />;
  if (!event) return null;

  const isHost = event.adminId === authUser?.id;
  const inviteUrl = `${window.location.origin}/events/join/${event.accessCode}`;
  const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const coverUrl = event.coverUrl || 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=1200&q=70';

  if (showInvite && isHost) {
    return (
      <div className="page-main-narrow">
        <div className="invite-page-header">
          <h2 className="welcome-title" style={{ color: 'var(--primary)' }}>Inviter des proches</h2>
          <p className="welcome-subtitle">Partagez cet espace pour collecter chaque moment précieux.</p>
        </div>

        <div className="invite-memory-frame">
          <div className="invite-qr-box">
            <QRCodeSVG value={inviteUrl} size={192} />
          </div>
          <p className="font-label-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--on-surface-variant)', marginBottom: 4 }}>
            Votre code d'accès
          </p>
          <p className="invite-code-display">{event.accessCode}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          <button type="button" className="btn-primary btn-primary-full btn-pill" onClick={copyLink}>
            <Icon name="link" size={20} /> Copier le lien d'invitation
          </button>
          <button type="button" className="btn-outline btn-primary-full btn-pill" onClick={() => {
            if (navigator.share) navigator.share({ title: event.name, url: inviteUrl });
          }}>
            <Icon name="share" size={20} /> Partager par message
          </button>
        </div>

        <div className="invite-hint-card sage">
          <div className="invite-hint-icon" style={{ background: 'var(--secondary-container)' }}>
            <Icon name="qr_code_scanner" />
          </div>
          <div>
            <p className="font-label" style={{ color: 'var(--on-secondary-container)', marginBottom: 4 }}>Scanner pour rejoindre</p>
            <p className="welcome-subtitle" style={{ fontSize: 14 }}>Les invités peuvent pointer leur appareil photo vers le QR code.</p>
          </div>
        </div>

        <div className="invite-hint-card cream">
          <div className="invite-hint-icon" style={{ background: 'rgba(186,169,155,0.4)' }}>
            <Icon name="key" />
          </div>
          <div>
            <p className="font-label" style={{ color: 'var(--on-tertiary-container)', marginBottom: 4 }}>Saisie manuelle</p>
            <p className="welcome-subtitle" style={{ fontSize: 14 }}>
              Entrez le code <strong>{event.accessCode}</strong> sur l'écran d'accueil.
            </p>
          </div>
        </div>

        <button type="button" className="btn-outline btn-primary-full" style={{ marginTop: 24 }} onClick={() => setShowInvite(false)}>
          Retour à l'événement
        </button>

        {toast && <div className="toast" style={{ opacity: 1 }}>{toast}</div>}
      </div>
    );
  }

  return (
    <div className="page-main">
      <section className="event-hero">
        <div className="event-hero-image" style={{ backgroundImage: `url(${coverUrl})` }} />
        <div className="event-hero-overlay">
          {event.category && <span className="event-hero-pill">{event.category}</span>}
          <h1 className="event-hero-title">{event.name}</h1>
          <div className="event-hero-meta">
            {fmt(event.date) && (
              <span><Icon name="calendar_month" size={18} /> {fmt(event.date)}</span>
            )}
            {event.venueName && (
              <span><Icon name="location_on" size={18} /> {event.venueName}</span>
            )}
          </div>
        </div>
      </section>

      <section className="stats-summary">
        <div className="stat-item">
          <span className="stat-number">{eventStats.photos}</span>
          <span className="stat-label">Photos</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{eventStats.videos}</span>
          <span className="stat-label">Vidéos</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{eventStats.audios}</span>
          <span className="stat-label">Audios</span>
        </div>
      </section>

      <section style={{ marginBottom: 'var(--stack-md)' }}>
        <h3 className="section-title" style={{ color: 'var(--primary)', marginBottom: 12 }}>À propos de l'événement</h3>
        <p className="welcome-subtitle" style={{ lineHeight: 1.7 }}>
          {event.description || 'Rejoignez-nous pour célébrer ce moment inoubliable. Partagez vos plus beaux souvenirs sur cet espace dédié.'}
        </p>
        {event.category && (
          <div className="tag-chips">
            <span className="tag-chip">#{event.category}</span>
            {event.venueName && <span className="tag-chip">#{event.venueName.replace(/\s+/g, '')}</span>}
          </div>
        )}
      </section>

      <section className="action-grid">
        <Link to={`/events/${event.id}/media`} className="action-grid-btn secondary">
          <Icon name="photo_library" size={32} style={{ color: 'var(--primary)' }} />
          Mes Médias
        </Link>
        <Link to={`/events/${event.id}/participants`} className="action-grid-btn secondary">
          <Icon name="group" size={32} style={{ color: 'var(--primary)' }} />
          Participants
        </Link>
        {isHost ? (
          <>
            <Link to={`/events/${event.id}/edit`} className="action-grid-btn secondary">
              <Icon name="settings" size={32} style={{ color: 'var(--primary)' }} />
              Modifier
            </Link>
            <button type="button" className="action-grid-btn secondary" onClick={() => setShowInvite(true)}>
              <Icon name="link" size={32} style={{ color: 'var(--primary)' }} />
              Inviter
            </button>
          </>
        ) : (
          <button type="button" className="action-grid-btn secondary" onClick={() => navigate('/events')}>
            <Icon name="arrow_back" size={32} style={{ color: 'var(--primary)' }} />
            Retour
          </button>
        )}
      </section>

      {guests.length > 0 && (
        <section style={{ marginTop: 'var(--stack-lg)' }}>
          <div className="section-header-row">
            <h3 className="section-title" style={{ color: 'var(--primary)' }}>Participants</h3>
            <Link to={`/events/${event.id}/participants`} className="font-label" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              Voir tout ({guests.length})
            </Link>
          </div>
        </section>
      )}

      {/* FAB Upload — bouton rond + en bas à droite */}
      <Link to={`/events/${event.id}/upload`} className="btn-fab-upload" aria-label="Ajouter un média">
        <Icon name="add" size={32} />
      </Link>

      {toast && <div className="toast" style={{ opacity: 1 }}>{toast}</div>}
    </div>
  );
}
