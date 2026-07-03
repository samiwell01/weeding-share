import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

function GuestAvatar({ firstName, lastName, avatarUrl }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt="avatar" className="guest-avatar-img" />;
  return <div className="guest-avatar-initials">{initials}</div>;
}

const RELATION_COLORS = {
  famille: '#fde68a',
  ami: '#bbf7d0',
  'collègue': '#bfdbfe',
  autre: '#e5e7eb',
};

export default function GuestsPage() {
  const { authUser, event, guests, loadAdminWedding, loadGuests } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    loadAdminWedding(authUser.id).then((e) => {
      if (e) loadGuests(e.id);
    });
  }, [authUser]);

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Invités {event ? `— ${event.name}` : ''}</h2>
        <button className="btn-small" onClick={() => loadGuests(event?.id)}>↻ Actualiser</button>
      </div>

      {guests.length === 0 ? (
        <p className="auth-subtitle">Aucun invité pour le moment.</p>
      ) : (
        <div className="guests-grid">
          {guests.map((g) => (
            <Link key={g.id} to={`/events/${event?.id}/participant/${g.id}`} className="guest-card">
              <GuestAvatar firstName={g.firstName} lastName={g.lastName} avatarUrl={g.avatarUrl} />
              <div className="guest-card-info">
                <strong>{g.firstName} {g.lastName}</strong>
                {g.email && <span>{g.email}</span>}
                {g.phone && <span>{g.phone}</span>}
              </div>
              {g.relation && (
                <span
                  className="guest-relation-badge"
                  style={{ background: RELATION_COLORS[g.relation] || '#e5e7eb' }}
                >
                  {g.relation}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="navigation-buttons">
        <Link to={`/events/${event?.id}`} className="button button-secondary">Retour</Link>
      </div>
    </div>
  );
}
