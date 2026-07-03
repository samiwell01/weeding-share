import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Icon from '../components/Icon';

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  if (index == null) return null;
  const item = items[index];
  if (!item) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>
        <div className="lightbox-media">
          {item.type === 'photo' && <img src={item.fileUrl} alt={item.fileName} />}
          {item.type === 'video' && (
            <video src={item.fileUrl} controls style={{ maxWidth: '100%' }} />
          )}
          {item.type === 'audio' && (
            <audio src={item.fileUrl} controls />
          )}
        </div>
        <div className="lightbox-meta">
          <div className="meta-left">
            <strong>{item.fileName}</strong>
            <div className="meta-small">Par {item.uploaderName || 'Invité'} • {new Date(item.createdAt).toLocaleString()}</div>
            {item.description && <p className="meta-desc">{item.description}</p>}
          </div>
          <div className="lightbox-controls">
            <button onClick={onPrev} aria-label="Précédent">←</button>
            <button onClick={onNext} aria-label="Suivant">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventGalleryPage() {
  const { id: eventId } = useParams();
  const { loading, loadEventById } = useApp();
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') || 'all';

  const [pageLoading, setPageLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        const res = await fetch(`${window.location.origin}/event/${eventId}/media`);
        const data = await res.json();
        const mapped = (data.media || []).map((m) => ({
          id: m.id,
          fileName: m.file_name || m.fileName,
          fileUrl: m.file_url || m.fileUrl,
          type: m.type,
          createdAt: m.created_at || m.createdAt,
          uploaderName: m.guest ? `${m.guest.first_name} ${m.guest.last_name}` : m.uploaderName,
          uploaderAvatar: m.guest?.avatar_url || m.uploaderAvatar,
          description: m.description || null,
        }));
        setItems(mapped);
      } catch (err) {
        console.error(err);
      }
      setPageLoading(false);
    };
    load();
  }, [eventId]);

  const filtered = useMemo(() => {
    let list = items.slice();
    if (typeFilter && typeFilter !== 'all') list = list.filter((i) => i.type === typeFilter);
    if (query) list = list.filter((i) => (i.uploaderName || '').toLowerCase().includes(query.toLowerCase()) || (i.fileName || '').toLowerCase().includes(query.toLowerCase()));
    if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return list;
  }, [items, typeFilter, query, sort]);

  if (loading || pageLoading) return <LoadingOverlay message="Chargement des médias…" />;

  const openAt = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i == null ? null : (i - 1 + filtered.length) % filtered.length));
  const next = () => setLightboxIndex((i) => (i == null ? null : (i + 1) % filtered.length));

  return (
    <div className="page-main">
      <header className="gallery-header">
        <h2>Galerie de l'événement</h2>
        <div className="gallery-controls">
          <input placeholder="Rechercher par nom d'invité ou fichier" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
          </select>
        </div>
      </header>

      <div className="gallery-filters">
        <a className={`filter ${typeFilter === 'all' ? 'active' : ''}`} href={`?type=all`}>Tous ({items.length})</a>
        <a className={`filter ${typeFilter === 'photo' ? 'active' : ''}`} href={`?type=photo`}>Photos ({items.filter(i=>i.type==='photo').length})</a>
        <a className={`filter ${typeFilter === 'video' ? 'active' : ''}`} href={`?type=video`}>Vidéos ({items.filter(i=>i.type==='video').length})</a>
        <a className={`filter ${typeFilter === 'audio' ? 'active' : ''}`} href={`?type=audio`}>Audios ({items.filter(i=>i.type==='audio').length})</a>
      </div>

      <div className="media-grid">
        {filtered.map((m, idx) => (
          <div key={m.id} className="media-card" onClick={() => openAt(idx)}>
            {m.type === 'photo' && <img src={m.fileUrl} alt={m.fileName} className="media-thumb" />}
            {m.type === 'video' && (
              <div className="media-thumb media-video">🎬</div>
            )}
            {m.type === 'audio' && (
              <div className="media-thumb media-audio">🔊</div>
            )}
            <div className="media-info">
              <div className="media-title">{m.fileName}</div>
              <div className="media-sub">{m.uploaderName} • {new Date(m.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <Lightbox items={filtered} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} />
    </div>
  );
}
