import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from '../components/Icon';

const DEFAULT_COVERS = {
  Mariage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=70',
  Anniversaire: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'Baby Shower': 'https://images.unsplash.com/photo-1505043203398-7e4c111acbfa?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Réunion: 'https://plus.unsplash.com/premium_photo-1661503228332-03778ab6d6a1?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  Autre: 'https://plus.unsplash.com/premium_photo-1698530721600-2570525ac6f5?q=80&w=1483&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

export default function AdminSetupPage() {
  const { authUser, loadEventById, createWedding, updateWedding, setEvent } = useApp();
  const { id: eventId } = useParams();
  const editing = Boolean(eventId);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    if (!editing) return;
    loadEventById(eventId).then((existing) => {
      if (!existing) { navigate('/events'); return; }
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
      if (existing.coverUrl) setCoverPreview(existing.coverUrl);
    });
  }, [authUser, editing, eventId]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === 'category' && !coverFile && !form.coverUrl) {
      setCoverPreview('');
    }
  };

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, coverUrl: '' }));
  };

  const removeCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setForm((f) => ({ ...f, coverUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError("Le nom de l'événement est requis."); return; }
    setLoading(true);

    let finalCoverUrl = form.coverUrl;

    if (coverFile) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const fd = new FormData();
      fd.append('file', coverFile);
      fd.append('authUserId', authUser.id);
      try {
        const res = await fetch(`${apiUrl}/upload-cover`, { method: 'POST', body: fd });
        const json = await res.json();
        if (json.url) finalCoverUrl = json.url;
      } catch {
        // fallback: use default
      }
    }

    if (!finalCoverUrl) {
      finalCoverUrl = DEFAULT_COVERS[form.category] || DEFAULT_COVERS.Autre;
    }

    const payload = { ...form, coverUrl: finalCoverUrl };
    const result = editing
      ? await updateWedding(eventId, payload)
      : await createWedding(payload);

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

  const displayCover = coverPreview || form.coverUrl || DEFAULT_COVERS[form.category] || DEFAULT_COVERS.Autre;

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
          <label className="form-label">Photo de couverture</label>
          <div className="cover-uploader-wrap">
            <div className="cover-uploader-preview" style={{ backgroundImage: `url(${displayCover})` }}>
              <div className="cover-uploader-actions">
                <button type="button" className="cover-action-btn" onClick={() => fileInputRef.current?.click()}>
                  <Icon name="add_a_photo" size={20} />
                  <span>{coverFile || form.coverUrl ? 'Changer' : 'Ajouter une photo'}</span>
                </button>
                {(coverFile || form.coverUrl) && (
                  <button type="button" className="cover-action-btn danger" onClick={removeCover}>
                    <Icon name="delete" size={18} />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
              {!coverFile && !form.coverUrl && (
                <div className="cover-default-badge">
                  <Icon name="auto_awesome" size={14} />
                  Image par défaut
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverFile}
            />
          </div>
          <p className="form-hint">Ou collez une URL :</p>
          <input
            className="form-input"
            style={{ marginTop: 4 }}
            value={form.coverUrl}
            onChange={(e) => {
              setForm((f) => ({ ...f, coverUrl: e.target.value }));
              if (e.target.value) { setCoverPreview(e.target.value); setCoverFile(null); }
              else setCoverPreview('');
            }}
            placeholder="https://..."
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
