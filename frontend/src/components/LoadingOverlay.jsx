export default function LoadingOverlay({ message = 'Chargement…' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" />
        <p>{message}</p>
      </div>
    </div>
  );
}
