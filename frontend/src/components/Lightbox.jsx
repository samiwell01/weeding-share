import { useEffect, useCallback } from 'react';
import Icon from './Icon';

function guestName(guest) {
  if (!guest) return null;
  const name = `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
  return name || null;
}

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

export default function Lightbox({ items, index, onClose, onPrev, onNext }) {
  const item = items[index];

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!item) return null;

  const uploader = guestName(item.guest);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Fermer">
        <Icon name="close" />
      </button>

      <button
        type="button"
        className="lightbox-nav lightbox-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={index === 0}
        aria-label="Précédent"
      >
        <Icon name="chevron_left" size={32} />
      </button>

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {item.type === 'photo' && <img src={item.fileUrl} alt={item.fileName} className="lightbox-img" />}
        {item.type === 'video' && <video src={item.fileUrl} controls autoPlay className="lightbox-video" />}
        {item.type === 'audio' && (
          <div className="lightbox-audio">
            <p>{item.fileName}</p>
            <audio src={item.fileUrl} controls autoPlay />
          </div>
        )}
        <div className="lightbox-meta">
          <p className="lightbox-caption">{index + 1} / {items.length}</p>
          {uploader && (
            <p className="lightbox-uploader">
              <Icon name="person" size={16} /> {uploader}
            </p>
          )}
          {item.createdAt && (
            <p className="lightbox-date">
              <Icon name="schedule" size={16} /> {formatDateTime(item.createdAt)}
            </p>
          )}
          {item.description && (
            <p className="lightbox-description">{item.description}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="lightbox-nav lightbox-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={index === items.length - 1}
        aria-label="Suivant"
      >
        <Icon name="chevron_right" size={32} />
      </button>
    </div>
  );
}
