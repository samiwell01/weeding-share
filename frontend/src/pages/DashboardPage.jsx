import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function DashboardPage() {
  const { authUser, event, guests, eventStats, loadAdminWedding, loadEventStats, loadGuests } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) { navigate('/admin'); return; }
    loadAdminWedding(authUser.id).then((e) => {
      if (e) {
        loadEventStats(e.id);
        loadGuests(e.id);
      }
    });
  }, [authUser]);

  return (
    <div className="card">
      <h2>Dashboard mariés</h2>
      {event && <p className="auth-subtitle">{event.name}</p>}
      <div className="stats-grid">
        <div className="stat-card">
          <strong>{guests.length}</strong>
          <span>Invités</span>
        </div>
        <div className="stat-card">
          <strong>{eventStats.photos}</strong>
          <span>Photos</span>
        </div>
        <div className="stat-card">
          <strong>{eventStats.videos}</strong>
          <span>Vidéos</span>
        </div>
        <div className="stat-card">
          <strong>{eventStats.audios}</strong>
          <span>Messages audio</span>
        </div>
      </div>
      <div className="navigation-buttons">
        <Link to="/admin/wedding" className="button">Mon mariage</Link>
        <Link to="/admin/guests" className="button button-secondary">Voir les invités</Link>
      </div>
    </div>
  );
}
