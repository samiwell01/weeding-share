import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function GuestHomePage() {
  const navigate = useNavigate();
  const { authUser, guest, setGuest, setEvent, guestEvents, loadGuestEvents, joinEvent } = useApp();
  const [showJoin, setShowJoin] = useState(false);
  const [joinStep, setJoinStep] = useState('code'); // code | form
  const [code, setCode] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', relation: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { navigate('/'); return; }
    loadGuestEvents(authUser.id);
  }, [authUser]);

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
    setForm({ firstName: '', lastName: '', phone: '', relation: '' });
    setJoinStep('code');
  };

  const openEvent = (entry) => {
    setGuest(entry.guest);
    setEvent(entry.event);
    navigate('/guest/media');
  };

  if (!authUser) return null;

  return (
    <div className="card">
      <h2>Mes mariages 💍</h2>

      {guestEvents.length === 0 ? (
        <p className="auth-subtitle">Vous n'avez rejoint aucun mariage pour le moment.</p>
      ) : (
        <div className="event-list">
          {guestEvents.map((entry) => (
            <div key={entry.guest.id} className="event-card" onClick={() => openEvent(entry)}>
              <div className="event-card-info">
                <strong>{entry.event?.name || 'Mariage'}</strong>
                {entry.event?.date && <span>{new Date(entry.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                {entry.event?.venueName && <span>{entry.event.venueName}</span>}
              </div>
              <div className="event-card-actions">
                <button onClick={(e) => { e.stopPropagation(); setGuest(entry.guest); setEvent(entry.event); navigate('/guest/upload'); }} className="btn-small">
                  📤 Ajouter
                </button>
                <button onClick={(e) => { e.stopPropagation(); openEvent(entry); }} className="btn-small btn-secondary">
                  🖼 Voir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="button" style={{ marginTop: 16 }} onClick={() => { setShowJoin(true); setJoinStep('code'); setError(''); }}>
        + Rejoindre un autre mariage
      </button>

      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>

            {joinStep === 'code' && (
              <>
                <h3>Rejoindre un mariage</h3>
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
                <p className="auth-subtitle" style={{ marginTop: 8 }}>
                  Ou scannez le QR code avec l'appareil photo de votre téléphone pour ouvrir le lien directement.
                </p>
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
