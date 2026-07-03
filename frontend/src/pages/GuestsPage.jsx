import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';

function GuestAvatar({ firstName, lastName, avatarUrl }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt="avatar" className="guest-avatar-img" />;
  return <div className="guest-avatar-initials">{initials}</div>;
}

const RELATION_COLORS = { famille: '#fde68a', ami: '#bbf7d0', 'collègue': '#bfdbfe', autre: '#e5e7eb' };

export default function GuestsPage() {
  const { id: eventId } = useParams();
  const { authUser, event, setEvent, guests, loadEventById, loadGuests } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [relationFilter, setRelationFilter] = useState('all');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    const load = async () => {
      let e = event;
      if (eventId && (!e || e.id !== eventId)) e = await loadEventById(eventId);
      if (e) { setEvent(e); await loadGuests(e.id); }
      setPageLoading(false);
    };
    load();
  }, [authUser, eventId]);

  const relations = useMemo(() => [...new Set(guests.map((g) => g.relation).filter(Boolean))], [guests]);

  const filtered = useMemo(() => [...guests]
    .filter((g) => {
      if (relationFilter !== 'all' && g.relation !== relationFilter) return false;
      const t = search.trim().toLowerCase();
      if (!t) return true;
      return [g.firstName, g.lastName, g.email, g.phone, g.relation].filter(Boolean).some((v) => v.toLowerCase().includes(t));
    })
    .sort((a, b) => {
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'relation') return (a.relation || '').localeCompare(b.relation || '');
      return new Date(b.createdAt) - new Date(a.createdAt);
    }), [guests, search, sortBy, relationFilter]);

  if (pageLoading) return <LoadingOverlay message="Chargement des participants…" />;

  return (
    <div className="card">
      <div className="section-header">
        <h2>Participants {event ? `— ${event.name}` : ''}</h2>
        <button className="btn-small" onClick={() => loadGuests(event?.id)}>↻</button>
      </div>

      <div className="list-controls">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un participant…" />
        <select value={relationFilter} onChange={(e) => setRelationFilter(e.target.value)}>
          <option value="all">Tous</option>
          {relations.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Nom</option>
          <option value="relation">Relation</option>
          <option value="recent">Récent</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="auth-subtitle">Aucun participant trouvé.</p>
      ) : (
        <div className="guests-grid">
          {filtered.map((g) => (
            <Link key={g.id} to={`/events/${eventId}/participant/${g.id}`} className="guest-card">
              <GuestAvatar firstName={g.firstName} lastName={g.lastName} avatarUrl={g.avatarUrl} />
              <div className="guest-card-info">
                <strong>{g.firstName} {g.lastName}</strong>
                {g.email && <span>{g.email}</span>}
                {g.phone && <span>{g.phone}</span>}
              </div>
              {g.relation && (
                <span className="guest-relation-badge" style={{ background: RELATION_COLORS[g.relation] || '#e5e7eb' }}>
                  {g.relation}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="navigation-buttons">
        <Link to={`/events/${eventId}`} className="button button-secondary">Retour</Link>
      </div>
    </div>
  );
}
