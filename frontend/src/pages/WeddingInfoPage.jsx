import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../AppContext';

export default function WeddingInfoPage() {
  const { authUser, event, loadAdminWedding, guests, loadGuests } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (!authUser) { navigate('/admin'); return; }
    if (!event) loadAdminWedding(authUser.id).then((e) => { if (!e) navigate('/admin/setup'); });
    if (event) loadGuests(event.id);
  }, [authUser, event]);

  if (!event) return <div className="auth-page"><p>Chargement...</p></div>;

  const inviteUrl = `${window.location.origin}/join/${event.accessCode}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const formatTime = (t) => t ? t.slice(0, 5) : '—';

  return (
    <div className="wedding-page">
      {event.coverUrl && <img src={event.coverUrl} alt="cover" className="wedding-cover" />}
      <div className="wedding-body">
        <div className="wedding-tabs">
          <button className={tab === 'info' ? 'tab active' : 'tab'} onClick={() => setTab('info')}>wedding info</button>
          <button className={tab === 'invite' ? 'tab active' : 'tab'} onClick={() => setTab('invite')}>inviter</button>
        </div>

        {tab === 'info' && (
          <>
            <div className="wedding-title-row">
              <h1 className="wedding-title">{event.name}</h1>
              <Link to="/admin/setup/edit" className="invite-link">modifier</Link>
            </div>

            <div className="wedding-info-grid">
              {event.venueName && (
                <div className="info-block">
                  <span className="info-label">venue</span>
                  <span className="info-value">{event.venueName}</span>
                </div>
              )}
              {event.date && (
                <div className="info-block">
                  <span className="info-icon">📅</span>
                  <span className="info-label">save the date</span>
                  <span className="info-value">{formatDate(event.date)}</span>
                </div>
              )}
              {event.time && (
                <div className="info-block">
                  <span className="info-icon">🕐</span>
                  <span className="info-label">starting at</span>
                  <span className="info-value">{formatTime(event.time)}</span>
                </div>
              )}
              {event.venueAddress && (
                <div className="info-block full">
                  <span className="info-icon">📍</span>
                  <span className="info-label">where</span>
                  <span className="info-value">{event.venueAddress}</span>
                </div>
              )}
            </div>

            <div className="wedding-stats">
              <div className="stat-card"><strong>{guests.length}</strong><span>invités</span></div>
            </div>

            <div className="navigation-buttons">
              <Link to="/admin/guests" className="button">Voir les invités</Link>
              <Link to="/admin/dashboard" className="button button-secondary">Dashboard</Link>
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
