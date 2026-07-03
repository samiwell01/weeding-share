import { useEffect, useCallback } from 'react';

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

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>✕</button>

      <button
        className="lightbox-nav lightbox-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={index === 0}
      >‹</button>

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {item.type === 'photo' && <img src={item.fileUrl} alt={item.fileName} className="lightbox-img" />}
        {item.type === 'video' && <video src={item.fileUrl} controls autoPlay className="lightbox-video" />}
        {item.type === 'audio' && (
          <div className="lightbox-audio">
            <p>{item.fileName}</p>
            <audio src={item.fileUrl} controls autoPlay />
          </div>
        )}
        <p className="lightbox-caption">{index + 1} / {items.length} — {item.fileName}</p>
      </div>

      <button
        className="lightbox-nav lightbox-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={index === items.length - 1}
      >›</button>
    </div>
  );
}
