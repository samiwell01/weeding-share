import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function AdminSetupPage() {
  const { authUser, event, loadEventById, createWedding, updateWedding, setEvent } = useApp();
  const { id: eventId } = useParams();
  const editing = Boolean(eventId);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', category: '', date: '', time: '', venueName: '', venueAddress: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser || !editing) return;
    loadEventById(eventId).then((existing) => {
      if (!existing) {
        navigate('/events');
        return;
      }
      setForm({
        name: existing.name || '',
        description: existing.description || '',
        category: existing.category || '',
        date: existing.date || '',
        time: existing.time || '',
        venueName: existing.venueName || '',
        venueAddress: existing.venueAddress || '',
      });
    });
  }, [authUser, editing, eventId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError('Le nom de l’événement est requis.'); return; }
    setLoading(true);
    const result = editing
      ? await updateWedding(eventId, form)
      : await createWedding(form);
    setLoading(false);
    if (!result.success) {
      if (result.event) { setEvent(result.event); navigate(`/events/${result.event.id}`); return; }
      setError(result.error);
      return;
    }
    setEvent(result.event);
    navigate(`/events/${result.event.id}`);
  };

  if (!authUser) { navigate('/login'); return null; }

  return (
    <div className="auth-page">
      <div className="setup-card">
        <h2>{editing ? 'Modifier l’événement' : 'Créer un événement'}</h2>
        <p className="auth-subtitle">Renseignez les informations de votre événement</p>
        <form onSubmit={handleSubmit}>
          <label>Nom de l'événement *
            <input value={form.name} onChange={set('name')} placeholder="ex: Soirée Anniversaire" required />
          </label>
          <label>Description
            <textarea value={form.description} onChange={set('description')} placeholder="Décrivez l'événement" rows={4} />
          </label>
          <label>Catégorie
            <input value={form.category} onChange={set('category')} placeholder="ex: Mariage, Anniversaire, Réunion" />
          </label>
          <label>Date
            <input type="date" value={form.date} onChange={set('date')} />
          </label>
          <label>Heure
            <input type="time" value={form.time} onChange={set('time')} />
          </label>
          <label>Lieu (nom)
            <input value={form.venueName} onChange={set('venueName')} placeholder="ex: Southern Grace" />
          </label>
          <label>Adresse
            <input value={form.venueAddress} onChange={set('venueAddress')} placeholder="ex: 8545 Collienville Arlington Rd" />
          </label>
          {error && <p className="message error">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? (editing ? 'Mise à jour...' : 'Création...') : (editing ? 'Enregistrer' : 'Créer l'événement')}</button>
        </form>
      </div>
    </div>
  );
}
