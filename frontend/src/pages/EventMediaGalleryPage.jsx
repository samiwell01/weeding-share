import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Lightbox from '../components/Lightbox';
import Icon from '../components/Icon';

const TYPE_CONFIG = {
  photo: { label: 'photo', labelPlural: 'photos', icon: 'image' },
  video: { label: 'vidéo', labelPlural: 'vidéos', icon: 'movie' },
  audio: { label: 'audio', labelPlural: 'audios', icon: 'mic' },
};

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'guest', label: 'Par invité' },
  { value: 'name', label: 'Par nom de fichier' },
];

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function guestName(guest) {
  if (!guest) return 'Invité inconnu';
  return `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || 'Invité';
}

export default function EventMediaGalleryPage() {
  const { id: eventId, type } = useParams();
  const navigate = useNavigate();
  const { authUser, event, loadEventById, loadEventMedia } = useApp();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const config = TYPE_CONFIG[type];

  useEffect(() => {
    if (!authUser) { navigate('/login'); return; }
    if (!config) { navigate(`/events/${eventId}`); return; }

    const load = async () => {
      let e = event;
      if (!e || e.id !== eventId) {
        e = await loadEventById(eventId);
        if (!e) { navigate('/events'); return; }
      }
      const media = await loadEventMedia(eventId, type);
      setItems(media);
      setPageLoading(false);
    };
    load();
  }, [authUser, eventId, type]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        if (!term) return true;
        const name = guestName(item.guest).toLowerCase();
        const file = (item.fileName || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        return name.includes(term) || file.includes(term) || desc.includes(term);
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'guest') return guestName(a.guest).localeCompare(guestName(b.guest));
        if (sortBy === 'name') return (a.fileName || '').localeCompare(b.fileName || '');
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [items, search, sortBy]);

  const viewable = filtered.filter((m) => m.type === 'photo' || m.type === 'video');

  if (pageLoading) return <LoadingOverlay message="Chargement des médias…" />;
  if (!config || !event) return null;

  const countLabel = `${filtered.length} ${filtered.length === 1 ? config.label : config.labelPlural}`;

  return (
    <div className="page-main">
      <div className="gallery-header">
        <Link to={`/events/${eventId}`} className="gallery-back-link">
          <Icon name="arrow_back" size={20} />
          Retour à l'événement
        </Link>
        <h2 className="gallery-title">
          <Icon name={config.icon} size={28} style={{ color: 'var(--primary)' }} />
          {countLabel}
        </h2>
        <p className="gallery-subtitle">dans <strong>{event.name}</strong></p>
      </div>

      <div className="search-bar">
        <Icon name="search" />
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom d'invité..."
          type="text"
        />
      </div>

      <div className="filter-row">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Icon name={config.icon} size={48} />
          </div>
          <h3 className="section-title">Aucun {config.label}</h3>
          <p className="welcome-subtitle">
            {search ? 'Aucun résultat pour cette recherche.' : `Personne n'a encore partagé de ${config.labelPlural}.`}
          </p>
          <Link to={`/events/${eventId}/upload`} className="btn-primary btn-pill">
            <Icon name="add" size={20} /> Ajouter
          </Link>
        </div>
      ) : type === 'audio' ? (
        <div className="gallery-audio-list">
          {filtered.map((item) => (
            <div key={item.id} className="gallery-audio-item">
              <div className="gallery-audio-item-header">
                <div className="media-audio-icon"><Icon name="mic" /></div>
                <div className="gallery-item-meta">
                  <strong>{guestName(item.guest)}</strong>
                  <span>{formatDateTime(item.createdAt)}</span>
                  {item.description && <p className="gallery-item-desc">{item.description}</p>}
                </div>
              </div>
              <audio controls src={item.fileUrl} className="gallery-audio-player" />
            </div>
          ))}
        </div>
      ) : (
        <div className="gallery-grid">
          {filtered.map((item) => {
            const viewIndex = viewable.findIndex((v) => v.id === item.id);
            return (
              <div key={item.id} className="gallery-card memory-frame">
                <div
                  className="gallery-card-media clickable"
                  onClick={() => setLightboxIndex(viewIndex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setLightboxIndex(viewIndex)}
                >
                  {item.type === 'photo' ? (
                    <img src={item.fileUrl} alt={item.fileName} />
                  ) : (
                    <>
                      <video src={item.fileUrl} />
                      <div className="media-video-play">
                        <div className="media-video-play-btn">
                          <Icon name="play_arrow" size={28} fill />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="gallery-card-info">
                  <div className="gallery-card-guest">
                    <Icon name="person" size={16} />
                    <strong>{guestName(item.guest)}</strong>
                  </div>
                  <span className="gallery-card-date">
                    <Icon name="schedule" size={14} />
                    {formatDateTime(item.createdAt)}
                  </span>
                  {item.description && (
                    <p className="gallery-item-desc">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={viewable}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(viewable.length - 1, i + 1))}
        />
      )}
    </div>
  );
}
