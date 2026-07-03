import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function GuestsPage() {
  const { guests, loadGuests } = useApp();

  return (
    <div className="card">
      <h2>Liste des invités</h2>
      <button className="button" onClick={loadGuests}>Actualiser</button>
      <div className="guest-list">
        {guests.length === 0 ? (
          <p>Aucun invité trouvé.</p>
        ) : (
          guests.map((invite) => (
            <Link key={invite.id} to={`/admin/guest/${invite.id}`} className="guest-button">
              {invite.firstName} {invite.lastName}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
