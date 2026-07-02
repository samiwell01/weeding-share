import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [code, setCode] = useState('MARIAGE2026');
  const [firstName, setFirstName] = useState('Jean');
  const [lastName, setLastName] = useState('Rakoto');
  const [guest, setGuest] = useState(null);
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedGuestMedia, setSelectedGuestMedia] = useState([]);
  const [file, setFile] = useState(null);
  const [type, setType] = useState('photo');

  const joinEvent = async (event) => {
    event.preventDefault();
    setMessage('Connexion en cours...');

    const response = await fetch(`${API_URL}/join-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, firstName, lastName }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Erreur de connexion');
      return;
    }

    setGuest(data.guest);
    setMessage(`Bienvenue ${data.guest.firstName} 👋`);
    loadMyMedia(data.guest.id);
  };

  const loadMyMedia = async (guestId) => {
    const response = await fetch(`${API_URL}/my-media/${guestId}`);
    const data = await response.json();
    setMedia(data.media || []);
  };

  const loadGuests = async () => {
    const response = await fetch(`${API_URL}/guests`);
    const data = await response.json();
    setGuests(data.guests || []);
  };

  const loadGuestMedia = async (guestId) => {
    const response = await fetch(`${API_URL}/guest/${guestId}/media`);
    const data = await response.json();
    setSelectedGuestMedia(data.media || []);
    setSelectedGuest(guestId);
  };

  const uploadMedia = async (event) => {
    event.preventDefault();
    if (!guest || !file) {
      setMessage('Veuillez d’abord rejoindre l’événement et choisir un fichier.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('guestId', guest.id);
    formData.append('eventId', guest.eventId);
    formData.append('type', type);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Erreur d’upload');
      return;
    }

    setMessage(`${type} envoyé avec succès`);
    setFile(null);
    loadMyMedia(guest.id);
  };

  const deleteMedia = async (mediaId) => {
    if (!guest) return;

    const response = await fetch(`${API_URL}/media/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: guest.id }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Suppression impossible');
      return;
    }

    setMessage('Contenu supprimé');
    loadMyMedia(guest.id);
  };

  useEffect(() => {
    loadGuests();
  }, []);

  return (
    <div className="app-shell">
      <header>
        <h1>Wedding Share</h1>
        <p>Prototype MVP pour partager des souvenirs de mariage.</p>
      </header>

      <section className="card">
        <h2>1. Rejoindre un événement</h2>
        <form onSubmit={joinEvent}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code du mariage" />
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" />
          <button type="submit">Entrer</button>
        </form>
        {message && <p className="message">{message}</p>}
      </section>

      <section className="card">
        <h2>2. Ajouter un média</h2>
        <form onSubmit={uploadMedia}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="photo">Photo</option>
            <option value="video">Vidéo</option>
            <option value="audio">Audio</option>
          </select>
          <button type="submit">Uploader</button>
        </form>
      </section>

      <section className="card">
        <h2>3. Mes souvenirs</h2>
        {guest ? (
          <>
            <p>Invité connecté : {guest.firstName} {guest.lastName}</p>
            <div className="media-list">
              {media.length === 0 ? (
                <p>Aucun média pour le moment.</p>
              ) : (
                media.map((item) => (
                  <div key={item.id} className="media-item">
                    <span>{item.type} • {item.fileName}</span>
                    <button onClick={() => deleteMedia(item.id)}>Supprimer</button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <p>Connectez-vous pour voir vos médias.</p>
        )}
      </section>

      <section className="card">
        <h2>4. Espace mariés</h2>
        <button onClick={loadGuests}>Actualiser la liste</button>
        <div className="guest-list">
          {guests.map((item) => (
            <button key={item.id} className="guest-button" onClick={() => loadGuestMedia(item.id)}>
              {item.firstName} {item.lastName}
            </button>
          ))}
        </div>
        {selectedGuest && (
          <div className="media-list">
            <h3>Médias de l’invité</h3>
            {selectedGuestMedia.length === 0 ? (
              <p>Aucun média.</p>
            ) : (
              selectedGuestMedia.map((item) => (
                <div key={item.id} className="media-item">
                  <span>{item.type} • {item.fileName}</span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
