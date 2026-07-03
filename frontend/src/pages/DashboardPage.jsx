import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function DashboardPage() {
  const { guests, media } = useApp();
  const photoCount = media.filter((item) => item.type === 'photo').length;
  const videoCount = media.filter((item) => item.type === 'video').length;
  const audioCount = media.filter((item) => item.type === 'audio').length;

  return (
    <div className="card">
      <h2>Dashboard mariés</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <strong>{guests.length}</strong>
          <span>Invités</span>
        </div>
        <div className="stat-card">
          <strong>{photoCount}</strong>
          <span>Photos</span>
        </div>
        <div className="stat-card">
          <strong>{videoCount}</strong>
          <span>Vidéos</span>
        </div>
        <div className="stat-card">
          <strong>{audioCount}</strong>
          <span>Messages audio</span>
        </div>
      </div>
      <Link to="/admin/guests" className="button">Voir la liste des invités</Link>
    </div>
  );
}
