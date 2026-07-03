export default function LoadingOverlay({ message = 'Chargement...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" />
        <span style={{ fontWeight: 600, color: '#1f2937' }}>{message}</span>
      </div>
    </div>
  );
}
