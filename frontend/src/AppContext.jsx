import { createContext, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [code, setCode] = useState('MARIAGE2026');
  const [firstName, setFirstName] = useState('Jean');
  const [lastName, setLastName] = useState('Rakoto');
  const [guest, setGuest] = useState(null);
  const [message, setMessage] = useState('');
  const [media, setMedia] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedGuestMedia, setSelectedGuestMedia] = useState([]);

  const loadMyMedia = async (guestId) => {
    if (!guestId) return;
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
    if (!guestId) return;
    const response = await fetch(`${API_URL}/guest/${guestId}/media`);
    const data = await response.json();
    setSelectedGuestMedia(data.media || []);
  };

  const joinEvent = async ({ code: eventCode, firstName: fn, lastName: ln }) => {
    setMessage('Connexion en cours...');

    const response = await fetch(`${API_URL}/join-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: eventCode, firstName: fn, lastName: ln }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Erreur de connexion');
      return { success: false, error: data.error };
    }

    setGuest(data.guest);
    setMessage(`Bienvenue ${data.guest.firstName} 👋`);
    await loadMyMedia(data.guest.id);
    return { success: true, guest: data.guest };
  };

  const uploadMedia = async ({ file, type: mediaType }) => {
    if (!guest || !file) {
      setMessage('Veuillez d’abord rejoindre l’événement et choisir un fichier.');
      return { success: false, error: 'Missing guest or file' };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('guestId', guest.id);
    formData.append('eventId', guest.eventId);
    formData.append('type', mediaType);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Erreur d’upload');
      return { success: false, error: data.error };
    }

    setMessage(`${mediaType} envoyé avec succès`);
    await loadMyMedia(guest.id);
    return { success: true, media: data.media };
  };

  const deleteMedia = async (mediaId) => {
    if (!guest) return { success: false };
    const response = await fetch(`${API_URL}/media/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: guest.id }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Suppression impossible');
      return { success: false, error: data.error };
    }

    setMessage('Contenu supprimé');
    await loadMyMedia(guest.id);
    return { success: true };
  };

  useEffect(() => {
    loadGuests();
  }, []);

  return (
    <AppContext.Provider
      value={{
        code,
        setCode,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        guest,
        setGuest,
        message,
        setMessage,
        media,
        setMedia,
        guests,
        selectedGuestMedia,
        setSelectedGuestMedia,
        joinEvent,
        loadMyMedia,
        loadGuests,
        loadGuestMedia,
        uploadMedia,
        deleteMedia,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
