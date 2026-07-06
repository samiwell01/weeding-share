import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const AppContext = createContext(null);

// ─── DEVICE STORAGE ─────────────────────────────────────────────────────

function getDeviceId() {
  let deviceId = localStorage.getItem('wedding_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('wedding_device_id', deviceId);
  }
  return deviceId;
}

function saveVisitorInfo(eventId, visitor) {
  const key = `visitor_${eventId}`;
  localStorage.setItem(key, JSON.stringify(visitor));
}

function getVisitorInfo(eventId) {
  const key = `visitor_${eventId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// ─── CONTEXT ────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [guest, setGuest] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [event, setEvent] = useState(null);
  const [guestEvents, setGuestEvents] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [media, setMedia] = useState([]);
  const [guests, setGuests] = useState([]);
  const [selectedGuestMedia, setSelectedGuestMedia] = useState([]);
  const [eventStats, setEventStats] = useState({ photos: 0, videos: 0, audios: 0, total: 0 });
  const [eventMedia, setEventMedia] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // ─── AUTH ──────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (authUser) {
      loadGuestEvents(authUser.id);
      loadUserProfile(authUser.id);
    }
  }, [authUser?.id]);

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
    setVisitor(null);
    setEvent(null);
    setMedia([]);
    setGuestEvents([]);
    setUserProfile(null);
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  // ─── PROFILE ─────────────────────────────────────────────────────────

  const loadUserProfile = async (authUserId) => {
    if (!authUserId) return null;
    try {
      const res = await fetch(`${API_URL}/user/profile/${authUserId}`);
      const data = await res.json();
      if (data.profile) { setUserProfile(data.profile); return data.profile; }
    } catch (_) {}
    return null;
  };

  const updateUserProfile = async (fields) => {
    if (!authUser) return { success: false };
    const res = await fetch(`${API_URL}/user/profile/${authUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    setUserProfile((p) => ({ ...p, ...fields }));
    return { success: true };
  };

  // ─── EVENTS ──────────────────────────────────────────────────────────

  const loadAdminWedding = async (adminId) => {
    const res = await fetch(`${API_URL}/event/host/${adminId}`);
    const data = await res.json();
    if (data.event) setEvent(data.event);
    return data.event || null;
  };

  const loadEventById = async (eventId) => {
    if (!eventId) return null;
    const res = await fetch(`${API_URL}/event/id/${eventId}`);
    const data = await res.json();
    if (data.event) setEvent(data.event);
    return data.event || null;
  };

  const loadEventByCode = async (code) => {
    try {
      const res = await fetch(`${API_URL}/event/${code}`);
      const data = await res.json();
      if (data.event) {
        setEvent(data.event);
        return data.event;
      }
    } catch (err) {
      console.error('load event by code error', err);
    }
    return null;
  };

  const loadEventStats = async (eventId) => {
    if (!eventId) return;
    const res = await fetch(`${API_URL}/event/${eventId}/stats`);
    const data = await res.json();
    setEventStats(data);
  };

  const createWedding = async (fields) => {
    const res = await fetch(`${API_URL}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: authUser.id, hostFirstName: userProfile?.firstName, hostLastName: userProfile?.lastName, hostEmail: authUser.email, hostPhone: userProfile?.phone, ...fields }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error, event: data.event };
    setEvent(data.event);
    await loadGuestEvents(authUser.id);
    return { success: true, event: data.event };
  };

  const updateWedding = async (id, fields) => {
    const res = await fetch(`${API_URL}/event/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: authUser.id, ...fields }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    setEvent(data.event);
    return { success: true, event: data.event };
  };

  // ─── GUEST EVENTS ───────────────────────────────────────────────────────

  const loadGuestEvents = async (authUserId) => {
    if (!authUserId) return [];
    try {
      const res = await fetch(`${API_URL}/events/user/${authUserId}`);
      const data = await res.json();
      setGuestEvents(data.entries || []);
      return data.entries || [];
    } catch (_) { return []; }
  };

  const joinEvent = async ({ code, firstName, lastName, phone, relation }) => {
    if (!authUser) return { success: false, error: 'Non connecté' };
    const res = await fetch(`${API_URL}/guest/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, authUserId: authUser.id, firstName, lastName, email: authUser.email, phone, relation }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false, error: data.error }; }
    setGuest(data.guest);
    setEvent(data.event);
    const mediaRes = await fetch(`${API_URL}/my-media/${data.guest.id}`);
    const mediaData = await mediaRes.json();
    setMedia(mediaData.media || []);
    await loadGuestEvents(authUser.id);
    return { success: true, guest: data.guest, event: data.event };
  };

  // ─── VISITOR (ANONYMOUS) ──────────────────────────────────────────────

  const joinEventAsVisitor = async ({ code, firstName, lastName }) => {
    const deviceId = getDeviceId();
    const res = await fetch(`${API_URL}/visitor/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId, firstName, lastName }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false, error: data.error }; }
    
    setVisitor(data.visitor);
    setEvent(data.event);
    saveVisitorInfo(data.event.id, data.visitor);
    
    const mediaRes = await fetch(`${API_URL}/visitor/${data.visitor.id}/media`);
    const mediaData = await mediaRes.json();
    setMedia(mediaData.media || []);
    
    return { success: true, visitor: data.visitor, event: data.event };
  };

  const getStoredVisitor = (eventId) => {
    return getVisitorInfo(eventId);
  };

  // ─── MEDIA ──────────────────────────────────────────────────────────

  const loadMyMedia = async (guestId) => {
    if (!guestId) return;
    const res = await fetch(`${API_URL}/my-media/${guestId}`);
    const data = await res.json();
    setMedia(data.media || []);
  };

  const loadVisitorMedia = async (visitorId) => {
    if (!visitorId) return;
    const res = await fetch(`${API_URL}/visitor/${visitorId}/media`);
    const data = await res.json();
    setMedia(data.media || []);
  };

  const uploadMedia = async ({ file, type: mediaType, description }) => {
    if (!guest && !visitor || !file) return { success: false, error: 'Missing guest/visitor or file' };
    const formData = new FormData();
    formData.append('file', file);
    
    if (guest) {
      formData.append('guestId', guest.id);
      formData.append('eventId', guest.eventId);
    } else if (visitor) {
      formData.append('visitorId', visitor.id);
      formData.append('eventId', visitor.eventId);
    }
    
    formData.append('type', mediaType);
    if (description) formData.append('description', description);
    
    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false, error: data.error }; }
    setMessage(`${mediaType} envoyé avec succès`);
    
    if (guest) {
      await loadMyMedia(guest.id);
    } else if (visitor) {
      await loadVisitorMedia(visitor.id);
    }
    
    return { success: true, media: data.media };
  };

  const deleteMedia = async (mediaId) => {
    if (!guest && !visitor) return { success: false };
    
    const body = {};
    if (guest) body.guestId = guest.id;
    if (visitor) body.visitorId = visitor.id;
    
    const res = await fetch(`${API_URL}/media/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); return { success: false }; }
    setMessage('Contenu supprimé');
    
    if (guest) {
      await loadMyMedia(guest.id);
    } else if (visitor) {
      await loadVisitorMedia(visitor.id);
    }
    
    return { success: true };
  };

  // ─── GUESTS ─────────────────────────────────────────────────────────

  const loadGuests = async (eventId) => {
    const url = eventId ? `${API_URL}/guests?eventId=${eventId}` : `${API_URL}/guests`;
    const res = await fetch(url);
    const data = await res.json();
    setGuests(data.guests || []);
    return data.guests || [];
  };

  const loadGuestMedia = async (guestId) => {
    if (!guestId) return;
    const res = await fetch(`${API_URL}/guest/${guestId}/media`);
    const data = await res.json();
    setSelectedGuestMedia(data.media || []);
  };

  const loadEventMedia = async (eventId, type) => {
    if (!eventId) return [];
    const params = type ? `?type=${type}` : '';
    const res = await fetch(`${API_URL}/event/${eventId}/media${params}`);
    const data = await res.json();
    const items = data.media || [];
    setEventMedia(items);
    return items;
  };

  return (
    <AppContext.Provider value={{
      authUser, guest, setGuest, visitor, setVisitor, event, setEvent,
      guestEvents, userProfile, media, guests, selectedGuestMedia,
      eventStats, eventMedia, message, setMessage, loading,
      signUp, signIn, signOut, updatePassword,
      loadUserProfile, updateUserProfile,
      loadAdminWedding, loadEventById, loadEventByCode, loadEventStats, createWedding, updateWedding,
      loadGuestEvents, joinEvent,
      joinEventAsVisitor, getStoredVisitor,
      loadMyMedia, loadVisitorMedia, uploadMedia, deleteMedia,
      loadGuests, loadGuestMedia, loadEventMedia,
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
