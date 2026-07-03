import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from '../components/Icon';

export default function DashboardPage() {
  const { id: eventId } = useParams();
  const { authUser, event, guests, eventStats, loadEventById, loadEventStats, loadGuests } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    const load = async () => {
      const e = eventId ? await loadEventById(eventId) : event;
      if (e) {
        loadEventStats(e.id);
        loadGuests(e.id);
      }
    };
    load();
  }, [authUser, eventId]);

  return (
    <div className="page-main">
      <div style={{ marginBottom: 'var(--stack-lg)' }}>
        <h2 className="welcome-title">Tableau de bord</h2>
        {event && <p className="welcome-subtitle">{event.name}</p>}
      </div>

      <section className="stats-summary">
        <div className="stat-item">
          <span className="stat-number">{guests.length}</span>
          <span className="stat-label">Participants</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{eventStats.photos}</span>
          <span className="stat-label">Photos</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{eventStats.videos}</span>
          <span className="stat-label">Vidéos</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">{eventStats.audios}</span>
          <span className="stat-label">Audios</span>
        </div>
      </section>

      <section className="action-grid" style={{ marginTop: 'var(--stack-md)' }}>
        <Link to={`/events/${event?.id}`} className="action-grid-btn primary">
          <Icon name="event" size={32} />
          Événement
        </Link>
        <Link to={`/events/${event?.id}/participants`} className="action-grid-btn secondary">
          <Icon name="group" size={32} style={{ color: 'var(--primary)' }} />
          Participants
        </Link>
      </section>
    </div>
  );
}
