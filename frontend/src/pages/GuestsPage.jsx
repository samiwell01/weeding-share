import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Icon from '../components/Icon';

function GuestAvatar({ firstName, lastName, avatarUrl }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt="avatar" />;
  return <span className="guest-avatar-initials">{initials}</span>;
}

const RELATION_COLORS = { famille: '#e1e6c2', ami: '#d4e8c2', 'collègue': '#f2dfd0', autre: '#eeeee9', Organisateur: '#d4a373' };

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
    <div className="page-main">
      <div style={{ marginBottom: 'var(--stack-lg)' }}>
        <h2 className="welcome-title">Participants</h2>
        <p className="welcome-subtitle">{event ? event.name : ''} — {guests.length} personne{guests.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="search-bar">
        <Icon name="search" />
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un participant…"
          type="text"
        />
      </div>

      <div className="filter-row">
        <select value={relationFilter} onChange={(e) => setRelationFilter(e.target.value)}>
          <option value="all">Toutes les relations</option>
          {relations.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Nom</option>
          <option value="relation">Relation</option>
          <option value="recent">Récent</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Icon name="group" size={48} />
          </div>
          <h3 className="section-title">Aucun participant</h3>
          <p className="welcome-subtitle">Invitez vos proches pour qu'ils rejoignent l'événement.</p>
        </div>
      ) : (
        <div className="guests-list">
          {filtered.map((g) => (
            <Link key={g.id} to={`/events/${eventId}/participant/${g.id}`} className="guest-list-item">
              <div className="guest-avatar">
                <GuestAvatar firstName={g.firstName} lastName={g.lastName} avatarUrl={g.avatarUrl} />
              </div>
              <div className="guest-info">
                <strong>{g.firstName} {g.lastName}</strong>
                {g.email && <span>{g.email}</span>}
                {g.phone && <span>{g.phone}</span>}
              </div>
              {g.relation && (
                <span className="guest-relation-badge" style={{ background: RELATION_COLORS[g.relation] || '#eeeee9' }}>
                  {g.relation}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <Link to={`/events/${eventId}`} className="btn-outline btn-primary-full" style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        Retour à l'événement
      </Link>
    </div>
  );
}
