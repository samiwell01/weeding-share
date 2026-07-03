import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function AdminSetupPage() {
  const { authUser, createWedding, setEvent } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', date: '', time: '', venueName: '', venueAddress: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError('Le nom du mariage est requis.'); return; }
    setLoading(true);
    const result = await createWedding(form);
    setLoading(false);
    if (!result.success) {
      if (result.event) { setEvent(result.event); navigate('/admin/dashboard'); return; }
      setError(result.error);
      return;
    }
    navigate('/admin/dashboard');
  };

  if (!authUser) { navigate('/admin'); return null; }

  return (
    <div className="auth-page">
      <div className="setup-card">
        <h2>💍 Créer votre mariage</h2>
        <p className="auth-subtitle">Renseignez les informations de votre événement</p>
        <form onSubmit={handleSubmit}>
          <label>Nom du mariage *
            <input value={form.name} onChange={set('name')} placeholder="ex: Nathan & Brennley" required />
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
          <button type="submit" disabled={loading}>{loading ? 'Création...' : 'Créer le mariage'}</button>
        </form>
      </div>
    </div>
  );
}
