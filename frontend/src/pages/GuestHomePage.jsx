import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

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

  if (!authUser) return null;

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <h2>Mes événements</h2>
          <p className="auth-subtitle">Créez, rejoignez et suivez tous vos événements ici.</p>
        </div>
        <div className="action-buttons">
          <button className="button" onClick={() => navigate('/events/create')}>Créer un événement</button>
          <button className="button button-secondary" onClick={() => { setShowJoin(true); setJoinStep('code'); setError(''); }}>Rejoindre un événement</button>
        </div>
      </div>

      <div className="list-controls">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un événement, lieu ou catégorie"
        />
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

      {filteredEvents.length === 0 ? (
        <p className="auth-subtitle">Aucun événement trouvé. Créez ou rejoignez-en un pour commencer.</p>
      ) : (
        <div className="event-list">
          {filteredEvents.map((entry) => (
            <div key={entry.event.id} className="event-card" onClick={() => openEvent(entry)}>
              <div className="event-card-cover" style={{ backgroundImage: `url(${entry.event.coverUrl || 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=900&q=70'})` }} />
              <div className="event-card-info">
                <div className="event-card-top">
                  <strong>{entry.event?.name || 'Événement'}</strong>
                  <span className={`event-badge ${entry.isHost || entry.guest?.isAdmin ? 'host' : 'guest'}`}>
                    {entry.isHost || entry.guest?.isAdmin ? 'Organisateur' : 'Invité'}
                  </span>
                </div>
                {entry.event?.category && <span className="event-meta">{entry.event.category}</span>}
                {entry.event?.description && <p className="event-description">{entry.event.description}</p>}
                <div className="event-meta-row">
                  {entry.event?.date && <span>{new Date(entry.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  {entry.event?.venueName && <span>{entry.event.venueName}</span>}
                </div>
              </div>
              <div className="event-card-actions">
                <button onClick={(e) => { e.stopPropagation(); openEvent(entry); }} className="btn-small">Voir</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>

            {joinStep === 'code' && (
              <>
                <h3>Rejoindre un événement</h3>
                <form onSubmit={handleCodeSubmit}>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Code d'invitation (ex: A1B2C3)"
                    style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  {error && <p className="message error">{error}</p>}
                  <button type="submit">Continuer</button>
                </form>
              </>
            )}

            {joinStep === 'form' && (
              <>
                <h3>Vos informations</h3>
                <p className="auth-subtitle">Code : <strong>{code}</strong></p>
                <form onSubmit={handleJoin}>
                  <label>Prénom *<input value={form.firstName} onChange={setField('firstName')} placeholder="Prénom" required /></label>
                  <label>Nom *<input value={form.lastName} onChange={setField('lastName')} placeholder="Nom" required /></label>
                  <label>Téléphone<input value={form.phone} onChange={setField('phone')} placeholder="+261 34 00 000 00" type="tel" /></label>
                  <label>Vous êtes...
                    <select value={form.relation} onChange={setField('relation')}>
                      <option value="">Sélectionner</option>
                      <option value="famille">Famille</option>
                      <option value="ami">Ami(e)</option>
                      <option value="collègue">Collègue</option>
                      <option value="autre">Autre</option>
                    </select>
                  </label>
                  {error && <p className="message error">{error}</p>}
                  <button type="submit" disabled={loading}>{loading ? '...' : 'Rejoindre 🎉'}</button>
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
