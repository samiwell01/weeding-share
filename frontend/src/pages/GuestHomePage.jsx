import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from '../components/Icon';

const sortOptions = [
  { value: 'recent', label: 'Récent' },
  { value: 'name', label: 'Nom' },
  { value: 'date', label: 'Date' },
  { value: 'type', label: 'Rôle' },
];

export default function GuestHomePage() {
  const navigate = useNavigate();
  const { authUser, setGuest, setEvent, guestEvents, loadGuestEvents, joinEvent, userProfile } = useApp();
  const [showJoin, setShowJoin] = useState(false);
  const [joinStep, setJoinStep] = useState('code');
  const [code, setCode] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', relation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    loadGuestEvents(authUser.id);
  }, [authUser]);

  useEffect(() => {
    if (!userProfile) return;
    setForm((f) => ({
      ...f,
      firstName: userProfile.firstName || f.firstName,
      lastName: userProfile.lastName || f.lastName,
      phone: userProfile.phone || f.phone,
    }));
  }, [userProfile]);

  const categories = useMemo(() => {
    return [...new Set(guestEvents.map((entry) => entry.event?.category).filter(Boolean))];
  }, [guestEvents]);

  const filteredEvents = useMemo(() => {
    return [...guestEvents]
      .filter((entry) => {
        if (categoryFilter !== 'all' && entry.event?.category !== categoryFilter) return false;
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return [entry.event?.name, entry.event?.description, entry.event?.venueName, entry.event?.category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.event?.name || '').localeCompare(b.event?.name || '');
        if (sortBy === 'date') return new Date(a.event?.date || 0) - new Date(b.event?.date || 0);
        if (sortBy === 'type') return (b.isHost || a.guest?.isAdmin ? 0 : 1) - (a.isHost || b.guest?.isAdmin ? 0 : 1);
        return new Date(b.event?.createdAt || 0) - new Date(a.event?.createdAt || 0);
      });
  }, [guestEvents, search, sortBy, categoryFilter]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Entrez un code.'); return; }
    setError('');
    setJoinStep('form');
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { setError('Prénom et nom requis.'); return; }
    setLoading(true);
    const result = await joinEvent({ code: code.trim().toUpperCase(), ...form });
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    setShowJoin(false);
    setCode('');
    setForm({ firstName: userProfile?.firstName || '', lastName: userProfile?.lastName || '', phone: userProfile?.phone || '', relation: '' });
    setJoinStep('code');
  };

  const openEvent = (entry) => {
    if (entry.guest) setGuest(entry.guest);
    setEvent(entry.event);
    navigate(`/events/${entry.event.id}`);
  };

  const firstName = userProfile?.firstName || 'vous';

  if (!authUser) return null;

  return (
    <div className="page-main">
      <section className="welcome-section">
        <h2 className="welcome-title">Bienvenue, {firstName}</h2>
        <p className="welcome-subtitle">Prête à capturer de nouveaux souvenirs ?</p>
      </section>

      <section className="search-bar">
        <Icon name="search" />
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un événement..."
          type="text"
        />
        <button type="button" className="search-filter-btn" onClick={() => setShowFilters((v) => !v)} aria-label="Filtres">
          <Icon name="tune" />
        </button>
      </section>

      {showFilters && (
        <div className="filter-row">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}

      <section className="quick-actions-grid">
        <button type="button" className="quick-action-btn primary" onClick={() => { setShowJoin(true); setJoinStep('code'); setError(''); }}>
          <Icon name="qr_code_scanner" size={32} />
          Rejoindre par code
        </button>
        <button type="button" className="quick-action-btn secondary" onClick={() => navigate('/events/create')}>
          <Icon name="add_circle" size={32} />
          Créer un événement
        </button>
      </section>

      <section>
        <div className="section-header-row">
          <h3 className="section-title">Mes Événements</h3>
          <span className="font-label" style={{ color: 'var(--primary)' }}>{filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icon name="event" size={48} />
            </div>
            <div>
              <h3 className="section-title">Aucun événement</h3>
              <p className="welcome-subtitle">Créez ou rejoignez un événement pour commencer.</p>
            </div>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((entry) => (
              <div key={entry.event.id} className="memory-frame event-memory-card" onClick={() => openEvent(entry)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openEvent(entry)}>
                <div className="event-card-cover-wrap">
                  <img
                    src={entry.event.coverUrl || 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=900&q=70'}
                    alt={entry.event.name}
                  />
                  {entry.event?.category && (
                    <span className="category-chip">{entry.event.category}</span>
                  )}
                </div>
                <div>
                  <h4 className="event-card-title">
                    {entry.event?.name || 'Événement'}
                    <span className={`role-badge ${entry.isHost || entry.guest?.isAdmin ? 'host' : 'guest'}`}>
                      {entry.isHost || entry.guest?.isAdmin ? 'Organisateur' : 'Invité'}
                    </span>
                  </h4>
                  {entry.event?.date && (
                    <div className="event-card-date">
                      <Icon name="calendar_today" size={18} />
                      {new Date(entry.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  {entry.event?.venueName && (
                    <p className="welcome-subtitle" style={{ fontSize: 13 }}>{entry.event.venueName}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setShowJoin(false)}>✕</button>

            {joinStep === 'code' && (
              <>
                <h3>Rejoindre un événement</h3>
                <form onSubmit={handleCodeSubmit}>
                  <input
                    className="form-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Code d'invitation (ex: A1B2C3)"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  {error && <p className="message error">{error}</p>}
                  <button type="submit" className="btn-primary btn-primary-full">Continuer</button>
                </form>
              </>
            )}

            {joinStep === 'form' && (
              <>
                <h3>Vos informations</h3>
                <p className="auth-subtitle">Code : <strong>{code}</strong></p>
                <form onSubmit={handleJoin}>
                  <label>Prénom *
                    <input className="form-input" value={form.firstName} onChange={setField('firstName')} placeholder="Prénom" required />
                  </label>
                  <label>Nom *
                    <input className="form-input" value={form.lastName} onChange={setField('lastName')} placeholder="Nom" required />
                  </label>
                  <label>Téléphone
                    <input className="form-input" value={form.phone} onChange={setField('phone')} placeholder="+261 34 00 000 00" type="tel" />
                  </label>
                  <label>Vous êtes...
                    <select className="form-input" value={form.relation} onChange={setField('relation')}>
                      <option value="">Sélectionner</option>
                      <option value="famille">Famille</option>
                      <option value="ami">Ami(e)</option>
                      <option value="collègue">Collègue</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                  {error && <p className="message error">{error}</p>}
                  <button type="submit" className="btn-primary btn-primary-full" disabled={loading}>
                    {loading ? '...' : 'Rejoindre'}
                  </button>
                  <button type="button" className="btn-switch" onClick={() => setJoinStep('code')}>← Changer le code</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
