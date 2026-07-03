import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from '../components/Icon';

export default function AdminSetupPage() {
  const { authUser, loadEventById, createWedding, updateWedding, setEvent } = useApp();
  const { id: eventId } = useParams();
  const editing = Boolean(eventId);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Mariage',
    date: '',
    time: '',
    venueName: '',
    venueAddress: '',
    coverUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    if (!editing) return;
    loadEventById(eventId).then((existing) => {
      if (!existing) {
        navigate('/events');
        return;
      }
      setForm({
        name: existing.name || '',
        description: existing.description || '',
        category: existing.category || 'Mariage',
        date: existing.date || '',
        time: existing.time || '',
        venueName: existing.venueName || '',
        venueAddress: existing.venueAddress || '',
        coverUrl: existing.coverUrl || '',
      });
    });
  }, [authUser, editing, eventId]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError("Le nom de l'événement est requis."); return; }
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

  if (!authUser) return null;

  const defaultCover = 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=900&q=70';

  return (
    <div className="page-main-narrow">
      <div style={{ textAlign: 'center', marginBottom: 'var(--stack-lg)' }}>
        <h2 className="welcome-title" style={{ color: 'var(--primary)' }}>
          {editing ? "Modifier l'événement" : 'Créer un événement'}
        </h2>
        <p className="welcome-subtitle">Commencez à capturer vos moments précieux ensemble.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="coverUrl">Photo de couverture</label>
          <div className="memory-frame cover-uploader">
            <div className="cover-uploader-inner">
              <img src={form.coverUrl || defaultCover} alt="" />
              <div className="cover-uploader-content">
                <Icon name="add_a_photo" size={36} />
                <span>Ajouter une photo</span>
              </div>
            </div>
          </div>
          <input
            id="coverUrl"
            className="form-input"
            style={{ marginTop: 8 }}
            value={form.coverUrl}
            onChange={set('coverUrl')}
            placeholder="URL de la photo de couverture"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="event_name">Nom de l'événement *</label>
          <input
            id="event_name"
            className="form-input"
            value={form.name}
            onChange={set('name')}
            placeholder="ex: Sophie & Marc"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            value={form.description}
            onChange={set('description')}
            placeholder="Décrivez votre événement..."
            rows={4}
          />
        </div>

        <div className="form-row-2 form-group">
          <div>
            <label className="form-label" htmlFor="event_date">Date</label>
            <input id="event_date" type="date" className="form-input" value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label className="form-label" htmlFor="event_category">Catégorie</label>
            <div className="form-select-wrap">
              <select id="event_category" className="form-input" value={form.category} onChange={set('category')}>
                <option value="Mariage">Mariage</option>
                <option value="Anniversaire">Anniversaire</option>
                <option value="Baby Shower">Baby Shower</option>
                <option value="Réunion">Réunion</option>
                <option value="Autre">Autre</option>
              </select>
              <Icon name="expand_more" />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="event_location">Lieu</label>
          <div className="form-input-with-icon">
            <Icon name="location_on" />
            <input
              id="event_location"
              className="form-input"
              value={form.venueName}
              onChange={set('venueName')}
              placeholder="Nom du lieu ou ville"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="venueAddress">Adresse</label>
          <input
            id="venueAddress"
            className="form-input"
            value={form.venueAddress}
            onChange={set('venueAddress')}
            placeholder="Adresse complète"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="time">Heure</label>
          <input id="time" type="time" className="form-input" value={form.time} onChange={set('time')} />
        </div>

        {error && <p className="message error">{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, paddingBottom: 48 }}>
          <button type="submit" className="btn-primary btn-primary-full" disabled={loading}>
            {loading ? '...' : editing ? 'Enregistrer' : "Créer l'événement"}
          </button>
          <button type="button" className="btn-outline btn-primary-full" onClick={() => navigate('/events')}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
