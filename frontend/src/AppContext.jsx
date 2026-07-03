import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [guest, setGuest] = useState(null);
  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedGuestMedia, setSelectedGuestMedia] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // ─── AUTH ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    setAuthUser(data.user);
    return { success: true, user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setGuest(null);
    setEvent(null);
    setMedia([]);
  };

  // ─── ADMIN WEDDING ─────────────────────────────────────────────────────────

  const loadAdminWedding = async (adminId) => {
    const res = await fetch(`${API_URL}/admin/wedding?adminId=${adminId}`);
    const data = await res.json();
    if (data.event) setEvent(data.event);
    return data.event || null;
  };

  const createWedding = async (fields) => {
    const res = await fetch(`${API_URL}/admin/wedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: authUser.id, ...fields }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error, event: data.event };
    setEvent(data.event);
    return { success: true, event: data.event };
  };

  const updateWedding = async (id, fields) => {
    const res = await fetch(`${API_URL}/admin/wedding/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: authUser.id, ...fields }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    setEvent(data.event);
    return { success: true, event: data.event };
  };

  // ─── GUEST JOIN ────────────────────────────────────────────────────────────

  const joinEvent = async ({ code, firstName, lastName, phone, relation }) => {
    if (!authUser) return { success: false, error: 'Non connecté' };
    const res = await fetch(`${API_URL}/guest/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        authUserId: authUser.id,
        firstName,
        lastName,
        email: authUser.email,
        phone,
        relation,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false, error: data.error }; }
    setGuest(data.guest);
    setEvent(data.event);
    await loadMyMedia(data.guest.id);
    return { success: true, guest: data.guest, event: data.event };
  };

  // ─── MEDIA ─────────────────────────────────────────────────────────────────

  const loadMyMedia = async (guestId) => {
    if (!guestId) return;
    const res = await fetch(`${API_URL}/my-media/${guestId}`);
    const data = await res.json();
    setMedia(data.media || []);
  };

  const uploadMedia = async ({ file, type: mediaType }) => {
    if (!guest || !file) return { success: false, error: 'Missing guest or file' };
    const formData = new FormData();
    formData.append('file', file);
    formData.append('guestId', guest.id);
    formData.append('eventId', guest.eventId);
    formData.append('type', mediaType);
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false, error: data.error }; }
    setMessage(`${mediaType} envoyé avec succès`);
    await loadMyMedia(guest.id);
    return { success: true, media: data.media };
  };

  const deleteMedia = async (mediaId) => {
    if (!guest) return { success: false };
    const res = await fetch(`${API_URL}/media/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: guest.id }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false }; }
    setMessage('Contenu supprimé');
    await loadMyMedia(guest.id);
    return { success: true };
  };

  // ─── GUESTS LIST ───────────────────────────────────────────────────────────

  const loadGuests = async (eventId) => {
    const url = eventId ? `${API_URL}/guests?eventId=${eventId}` : `${API_URL}/guests`;
    const res = await fetch(url);
    const data = await res.json();
    setGuests(data.guests || []);
  };

  const loadGuestMedia = async (guestId) => {
    if (!guestId) return;
    const res = await fetch(`${API_URL}/guest/${guestId}/media`);
    const data = await res.json();
    setSelectedGuestMedia(data.media || []);
  };

  useEffect(() => { loadGuests(); }, []);

  return (
    <AppContext.Provider value={{
      authUser, guest, setGuest, event, setEvent,
      media, guests, selectedGuestMedia,
      message, setMessage, loading,
      signUp, signIn, signOut,
      loadAdminWedding, createWedding, updateWedding,
      joinEvent, loadMyMedia, uploadMedia, deleteMedia,
      loadGuests, loadGuestMedia,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
