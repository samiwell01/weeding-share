import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../AppContext';

export default function WeddingInfoPage() {
  const { authUser, event, loadAdminWedding, guests, loadGuests } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    if (!event) loadAdminWedding(authUser.id).then((e) => { if (!e) navigate('/events/create'); });
    if (event) loadGuests(event.id);
  }, [authUser, event]);

  if (!event) return <div className="auth-page"><p>Chargement...</p></div>;

  const inviteUrl = `${window.location.origin}/join/${event.accessCode}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const formatTime = (t) => t ? t.slice(0, 5) : '—';

  return (
    <div className="event-page">
      {event.coverUrl && <img src={event.coverUrl} alt="cover" className="event-cover" />}
      <div className="event-body">
        <div className="event-tabs">
          <button className={tab === 'info' ? 'tab active' : 'tab'} onClick={() => setTab('info')}>Infos</button>
          <button className={tab === 'invite' ? 'tab active' : 'tab'} onClick={() => setTab('invite')}>Inviter</button>
        </div>

        {tab === 'info' && (
          <>
            <div className="event-title-row">
              <h1 className="event-title">{event.name}</h1>
              <Link to={`/events/${event.id}/edit`} className="invite-link">modifier</Link>
            </div>

            <div className="event-info-grid">
              {event.category && (
                <div className="info-block">
                  <span className="info-label">Catégorie</span>
                  <span className="info-value">{event.category}</span>
                </div>
              )}
              {event.venueName && (
                <div className="info-block">
                  <span className="info-label">Lieu</span>
                  <span className="info-value">{event.venueName}</span>
                </div>
              )}
              {event.date && (
                <div className="info-block">
                  <span className="info-icon">📅</span>
                  <span className="info-label">Date</span>
                  <span className="info-value">{formatDate(event.date)}</span>
                </div>
              )}
              {event.time && (
                <div className="info-block">
                  <span className="info-icon">🕐</span>
                  <span className="info-label">Heure</span>
                  <span className="info-value">{formatTime(event.time)}</span>
                </div>
              )}
              {event.venueAddress && (
                <div className="info-block full">
                  <span className="info-icon">📍</span>
                  <span className="info-label">Adresse</span>
                  <span className="info-value">{event.venueAddress}</span>
                </div>
              )}
              {event.description && (
                <div className="info-block full">
                  <span className="info-label">Description</span>
                  <span className="info-value">{event.description}</span>
                </div>
              )}
            </div>

            <div className="event-stats">
              <div className="stat-card"><strong>{guests.length}</strong><span>invités</span></div>
            </div>

            <div className="navigation-buttons">
              <Link to={`/events/${event.id}/participants`} className="button">Voir les invités</Link>
              <Link to={`/events/${event.id}/summary`} className="button button-secondary">Résumé</Link>
            </div>
          </>
        )}

        {tab === 'invite' && (
          <div className="invite-section">
            <h2>Inviter vos invités</h2>
            <p className="auth-subtitle">Partagez ce lien ou ce QR code avec vos invités</p>

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

            <p className="auth-subtitle">Les invités scannent le QR code ou cliquent sur le lien, se connectent avec Google et renseignent leurs informations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
