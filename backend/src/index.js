const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./supabase');
const { generateDeviceId, createDeviceFingerprint } = require('./deviceStorage');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 4000;
const frontendPath = path.join(__dirname, '../../frontend/dist');
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'wedding-media';
const useDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

// ─── MAPPERS ──────────────────────────────────────────────────────────

function mapEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    adminId: e.admin_id,
    name: e.name,
    description: e.description,
    category: e.category,
    accessCode: e.access_code,
    date: e.date,
    time: e.time,
    venueName: e.venue_name,
    venueAddress: e.venue_address,
    coverUrl: e.cover_url,
    createdAt: e.created_at,
  };
}

function mapGuest(g) {
  if (!g) return null;
  return {
    id: g.id,
    eventId: g.event_id,
    authUserId: g.auth_user_id,
    firstName: g.first_name,
    lastName: g.last_name,
    email: g.email,
    phone: g.phone,
    relation: g.relation,
    avatarUrl: g.avatar_url || null,
    role: g.role,
    isAdmin: g.is_admin,
    createdAt: g.created_at,
  };
}

function mapVisitor(v) {
  if (!v) return null;
  return {
    id: v.id,
    eventId: v.event_id,
    deviceId: v.device_id,
    firstName: v.first_name,
    lastName: v.last_name,
    createdAt: v.created_at,
  };
}

function mapMedia(item, guest) {
  if (!item) return null;
  const mapped = {
    id: item.id,
    guestId: item.guest_id,
    visitorId: item.visitor_id,
    eventId: item.event_id,
    type: item.type,
    fileName: item.file_name,
    fileUrl: item.file_url,
    description: item.description || null,
    createdAt: item.created_at,
  };
  if (guest) {
    mapped.guest = {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      avatarUrl: guest.avatar_url || null,
    };
  } else if (item.guests) {
    mapped.guest = {
      id: item.guests.id,
      firstName: item.guests.first_name,
      lastName: item.guests.last_name,
      avatarUrl: item.guests.avatar_url || null,
    };
  } else if (item.visitors) {
    mapped.visitor = {
      id: item.visitors.id,
      firstName: item.visitors.first_name,
      lastName: item.visitors.last_name,
    };
  }
  return mapped;
}

function generateAccessCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ─── DB HELPERS ─────────────────────────────────────────────────────────

async function getEventByCode(code) {
  const { data, error } = await supabase.from('events').select('*').eq('access_code', code).limit(1).single();
  if (error) return null;
  return mapEvent(data);
}

async function getEventByAdminId(adminId) {
  const { data, error } = await supabase.from('events').select('*').eq('admin_id', adminId).limit(1).single();
  if (error) return null;
  return mapEvent(data);
}

async function getEventById(id) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).limit(1).single();
  if (error) return null;
  return mapEvent(data);
}

async function createEvent(adminId, fields) {
  const accessCode = generateAccessCode();
  const { data, error } = await supabase
    .from('events')
    .insert([{
      admin_id: adminId,
      name: fields.name,
      description: fields.description || null,
      category: fields.category || null,
      access_code: accessCode,
      date: fields.date || null,
      time: fields.time || null,
      venue_name: fields.venueName || null,
      venue_address: fields.venueAddress || null,
      cover_url: fields.coverUrl || null,
    }])
    .select()
    .single();
  if (error) throw error;
  return mapEvent(data);
}

async function updateEvent(id, adminId, fields) {
  const { data, error } = await supabase
    .from('events')
    .update({
      name: fields.name,
      description: fields.description || null,
      category: fields.category || null,
      date: fields.date || null,
      time: fields.time || null,
      venue_name: fields.venueName || null,
      venue_address: fields.venueAddress || null,
      cover_url: fields.coverUrl || null,
    })
    .eq('id', id)
    .eq('admin_id', adminId)
    .select()
    .single();
  if (error) throw error;
  return mapEvent(data);
}

async function createGuest(eventId, fields) {
  const { data, error } = await supabase
    .from('guests')
    .insert([{
      event_id: eventId,
      auth_user_id: fields.authUserId || null,
      first_name: fields.firstName,
      last_name: fields.lastName,
      email: fields.email || null,
      phone: fields.phone || null,
      relation: fields.relation || null,
      avatar_url: fields.avatarUrl || null,
      role: fields.role || 'guest',
      is_admin: Boolean(fields.isAdmin),
    }])
    .select()
    .single();
  if (error) throw error;
  return mapGuest(data);
}

async function createOrGetVisitor(eventId, deviceId, firstName, lastName) {
  // Check if visitor already exists with this device ID on this event
  const { data: existing } = await supabase
    .from('visitors')
    .select('*')
    .eq('event_id', eventId)
    .eq('device_id', deviceId)
    .limit(1)
    .single();
  
  if (existing) {
    return { visitor: mapVisitor(existing), isNew: false };
  }

  // Create new visitor
  const { data, error } = await supabase
    .from('visitors')
    .insert([{
      event_id: eventId,
      device_id: deviceId,
      first_name: firstName,
      last_name: lastName,
    }])
    .select()
    .single();
  
  if (error) throw error;
  return { visitor: mapVisitor(data), isNew: true };
}

async function getOrCreateGuestByAuth(eventId, authUserId, fields) {
  // Check if guest already joined this event with this Google account
  const { data: existing } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .eq('auth_user_id', authUserId)
    .limit(1)
    .single();
  if (existing) return { guest: mapGuest(existing), isNew: false };

  const guest = await createGuest(eventId, { ...fields, authUserId });
  return { guest, isNew: true };
}

async function getSignedFileUrl(storagePath) {
  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(storagePath, TEN_YEARS);
  if (error || !data?.signedURL) {
    console.error('signed url helper error', error, data);
    return null;
  }
  return data.signedURL;
}

async function resolveMediaUrls(items) {
  return Promise.all(items.map(async (item) => {
    if (!item.fileUrl || item.fileUrl.startsWith('http')) return item;
    const signed = await getSignedFileUrl(item.fileUrl);
    return { ...item, fileUrl: signed || item.fileUrl };
  }));
}

async function getGuestMedia(guestId) {
  const { data, error } = await supabase.from('media').select('*').eq('guest_id', guestId).order('created_at', { ascending: false });
  if (error) return [];
  const items = data.map((m) => mapMedia(m));
  return resolveMediaUrls(items);
}

async function getVisitorMedia(visitorId) {
  const { data, error } = await supabase.from('media').select('*').eq('visitor_id', visitorId).order('created_at', { ascending: false });
  if (error) return [];
  const items = data.map((m) => mapMedia(m));
  return resolveMediaUrls(items);
}

async function getEventMedia(eventId, type) {
  let query = supabase
    .from('media')
    .select('*, guests(*), visitors(*)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (type && ['photo', 'video', 'audio'].includes(type)) {
    query = query.eq('type', type);
  }
  const { data, error } = await query;
  if (error) throw error;
  const items = (data || []).map((m) => mapMedia(m));
  return resolveMediaUrls(items);
}

async function getAllGuests(eventId) {
  const query = supabase.from('guests').select('*').order('created_at', { ascending: true });
  if (eventId) query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) return [];
  return data.map(mapGuest);
}

async function deleteMediaRecord(mediaId, guestId, visitorId) {
  let query = supabase.from('media').select('*').eq('id', mediaId);
  
  if (guestId) {
    query = query.eq('guest_id', guestId);
  } else if (visitorId) {
    query = query.eq('visitor_id', visitorId);
  } else {
    return null;
  }

  const { data: existing, error: fetchError } = await query.limit(1).single();
  if (fetchError || !existing) return null;
  
  let deleteQuery = supabase.from('media').delete().eq('id', mediaId);
  if (guestId) {
    deleteQuery = deleteQuery.eq('guest_id', guestId);
  } else if (visitorId) {
    deleteQuery = deleteQuery.eq('visitor_id', visitorId);
  }

  const { error } = await deleteQuery;
  if (error) return null;
  return mapMedia(existing);
}

async function guestHasCorrectEvent(guestId, eventId) {
  const { data, error } = await supabase.from('guests').select('id').eq('id', guestId).eq('event_id', eventId).limit(1).single();
  if (error) return false;
  return Boolean(data);
}

async function visitorHasCorrectEvent(visitorId, eventId) {
  const { data, error } = await supabase.from('visitors').select('id').eq('id', visitorId).eq('event_id', eventId).limit(1).single();
  if (error) return false;
  return Boolean(data);
}

// ─── ROUTES ──────────────────────────────────────────────────────────

// Upload cover image for event
app.post('/upload-cover', upload.single('file'), async (req, res) => {
  const { authUserId } = req.body;
  if (!req.file || !authUserId) return res.status(400).json({ error: 'file et authUserId requis.' });
  const storagePath = `covers/${authUserId}/${Date.now()}-${req.file.originalname}`;
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (storageError) return res.status(500).json({ error: storageError.message });
  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { signedURL, error: signedError } = await supabase.storage.from(bucketName).createSignedUrl(storagePath, TEN_YEARS);
  if (signedError || !signedURL) return res.status(500).json({ error: "Impossible de récupérer l'URL." });
  return res.json({ url: signedURL });
});

app.get('/health', async (req, res) => {
  if (!useDb) return res.status(500).json({ status: 'error', message: 'Supabase not configured' });
  const { data, error } = await supabase.from('events').select('id').limit(1);
  if (error) return res.status(500).json({ status: 'error', error: error.message });
  return res.json({ status: 'ok', service: 'wedding-share-backend' });
});

// Admin: get or create event
app.get('/event/host/:adminId', async (req, res) => {
  const { adminId } = req.params;
  if (!adminId) return res.status(400).json({ error: 'adminId requis.' });
  const event = await getEventByAdminId(adminId);
  return res.json({ event });
});

app.get('/event/id/:id', async (req, res) => {
  const event = await getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
  return res.json({ event });
});

app.post('/event', async (req, res) => {
  const { adminId, name, date, time, venueName, venueAddress, coverUrl, description, category, hostFirstName, hostLastName, hostEmail, hostPhone } = req.body;
  if (!adminId || !name) return res.status(400).json({ error: 'adminId et name sont requis.' });

  try {
    const event = await createEvent(adminId, { name, date, time, venueName, venueAddress, coverUrl, description, category });
    if (hostFirstName && hostLastName) {
      await createGuest(event.id, {
        authUserId: adminId,
        firstName: hostFirstName,
        lastName: hostLastName,
        email: hostEmail || null,
        phone: hostPhone || null,
        relation: 'organisateur',
        role: 'admin',
        isAdmin: true,
      });
    }
    return res.status(201).json({ event });
  } catch (err) {
    console.error('create event error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/event/:id', async (req, res) => {
  const { adminId, name, date, time, venueName, venueAddress, coverUrl, description, category } = req.body;
  if (!adminId) return res.status(400).json({ error: 'adminId requis.' });
  try {
    const event = await updateEvent(req.params.id, adminId, { name, date, time, venueName, venueAddress, coverUrl, description, category });
    return res.json({ event });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Public: get wedding info by access code (for invite page)
app.get('/event/:code', async (req, res) => {
  const event = await getEventByCode(req.params.code);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
  return res.json({ event });
});

// Guest: join via Google auth + onboarding info
app.post('/guest/join', async (req, res) => {
  const { code, authUserId, firstName, lastName, email, phone, relation } = req.body;
  if (!code || !authUserId || !firstName || !lastName) {
    return res.status(400).json({ error: 'code, authUserId, firstName et lastName sont requis.' });
  }
  const event = await getEventByCode(code);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

  try {
    const { guest, isNew } = await getOrCreateGuestByAuth(event.id, authUserId, { firstName, lastName, email, phone, relation });
    return res.status(isNew ? 201 : 200).json({ guest, event });
  } catch (err) {
    console.error('guest join error', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── VISITOR ENDPOINTS (Anonymous/Device-based) ─────────────────────────────

// Visitor: Join event as anonymous visitor with device tracking
app.post('/visitor/join', async (req, res) => {
  const { code, deviceId, firstName, lastName } = req.body;
  if (!code || !firstName || !lastName) {
    return res.status(400).json({ error: 'code, firstName et lastName sont requis.' });
  }

  const event = await getEventByCode(code);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

  try {
    // Generate device ID if not provided
    const finalDeviceId = deviceId || generateDeviceId();
    const { visitor, isNew } = await createOrGetVisitor(event.id, finalDeviceId, firstName, lastName);
    
    return res.status(isNew ? 201 : 200).json({ 
      visitor, 
      event,
      deviceId: finalDeviceId,
    });
  } catch (err) {
    console.error('visitor join error', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get visitor by ID
app.get('/visitor/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('id', req.params.id)
    .limit(1)
    .single();
  
  if (error || !data) return res.status(404).json({ error: 'Visiteur introuvable.' });
  return res.json({ visitor: mapVisitor(data) });
});

// Legacy join (kept for compatibility)
app.post('/join-event', async (req, res) => {
  const { code, firstName, lastName } = req.body;
  if (!code || !firstName || !lastName) return res.status(400).json({ error: 'Code, prénom et nom sont requis.' });
  const event = await getEventByCode(code);
  if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
  try {
    const guest = await createGuest(event.id, { firstName, lastName });
    return res.status(201).json({ guest, event });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload media (supports both guest and visitor)
app.post('/upload', upload.single('file'), async (req, res) => {
  const { guestId, visitorId, eventId, type, description, authUserId, firstName, lastName, email, phone } = req.body;
  if (!req.file || !eventId || !type) {
    return res.status(400).json({ error: 'Fichier, eventId et type sont requis.' });
  }

  let finalGuestId = guestId;
  let finalVisitorId = visitorId;
  let valid = false;

  // Check if guest ID is valid
  if (guestId) {
    valid = await guestHasCorrectEvent(guestId, eventId);
    if (valid) finalGuestId = guestId;
  }

  // Check if visitor ID is valid
  if (!valid && visitorId) {
    valid = await visitorHasCorrectEvent(visitorId, eventId);
    if (valid) finalVisitorId = visitorId;
  }

  // Admin upload
  if (!valid && authUserId) {
    const event = await getEventById(eventId);
    if (event && event.adminId === authUserId) {
      const nameFirst = firstName || 'Organisateur';
      const nameLast = lastName || 'Hôte';
      const { guest } = await getOrCreateGuestByAuth(eventId, authUserId, {
        firstName: nameFirst,
        lastName: nameLast,
        email: email || null,
        phone: phone || null,
        relation: 'Organisateur',
        role: 'admin',
        isAdmin: true,
      });
      finalGuestId = guest.id;
      valid = true;
    }
  }

  if (!valid || (!finalGuestId && !finalVisitorId)) {
    return res.status(403).json({ error: 'Invité non autorisé.' });
  }

  const storagePath = `${eventId}/${finalGuestId || finalVisitorId}/${Date.now()}-${req.file.originalname}`;
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (storageError) {
    console.error('storage upload error', storageError);
    return res.status(500).json({ error: 'Impossible de téléverser le fichier.' });
  }

  const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
  const { signedURL, error: signedError } = await supabase.storage.from(bucketName).createSignedUrl(storagePath, TEN_YEARS);

  if (signedError || !signedURL) {
    console.error('signed URL error', signedError || 'signedURL is null');
    return res.status(500).json({ error: 'Impossible de récupérer l\'URL du fichier.' });
  }

  try {
    const { data, error } = await supabase
      .from('media')
      .insert([{
        guest_id: finalGuestId || null,
        visitor_id: finalVisitorId || null,
        event_id: eventId,
        type,
        file_name: req.file.originalname,
        file_url: signedURL,
        description: description?.trim() || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ media: mapMedia(data) });
  } catch (err) {
    console.error('media insert error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/my-media/:guestId', async (req, res) => {
  const items = await getGuestMedia(req.params.guestId);
  return res.json({ media: items });
});

app.get('/visitor/:visitorId/media', async (req, res) => {
  const items = await getVisitorMedia(req.params.visitorId);
  return res.json({ media: items });
});

app.delete('/media/:id', async (req, res) => {
  const { guestId, visitorId } = req.body;
  if (!guestId && !visitorId) return res.status(400).json({ error: 'guestId ou visitorId requis.' });
  const deleted = await deleteMediaRecord(req.params.id, guestId, visitorId);
  if (!deleted) return res.status(404).json({ error: 'Média introuvable.' });
  return res.json({ removed: deleted });
});

// User profile (stored in guests table aggregated or a profiles table)
// We use a simple profiles approach via supabase auth metadata
app.get('/user/profile/:authUserId', async (req, res) => {
  const { data, error } = await supabase
    .from('guests')
    .select('first_name, last_name, email, phone, avatar_url')
    .eq('auth_user_id', req.params.authUserId)
    .limit(1)
    .single();
  if (error || !data) return res.json({ profile: null });
  return res.json({
    profile: {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      avatarUrl: data.avatar_url,
    },
  });
});

app.put('/user/profile/:authUserId', async (req, res) => {
  const { firstName, lastName, phone, avatarUrl } = req.body;
  const { error } = await supabase
    .from('guests')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      avatar_url: avatarUrl || null,
    })
    .eq('auth_user_id', req.params.authUserId);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// Event stats
app.get('/event/:id/stats', async (req, res) => {
  const { data, error } = await supabase
    .from('media')
    .select('type')
    .eq('event_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  const photos = data.filter((m) => m.type === 'photo').length;
  const videos = data.filter((m) => m.type === 'video').length;
  const audios = data.filter((m) => m.type === 'audio').length;
  return res.json({ photos, videos, audios, total: data.length });
});

// Guest: list all events joined by authUserId and hosted by authUserId
app.get('/events/user/:authUserId', async (req, res) => {
  const authUserId = req.params.authUserId;
  const { data: guestData, error: guestError } = await supabase
    .from('guests')
    .select('*, events(*)')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false });
  if (guestError) return res.status(500).json({ error: guestError.message });

  const guestEntries = (guestData || []).map((g) => ({
    guest: mapGuest(g),
    event: mapEvent(g.events),
    isHost: false,
  }));

  const { data: hostData, error: hostError } = await supabase
    .from('events')
    .select('*')
    .eq('admin_id', authUserId)
    .order('created_at', { ascending: false });
  if (hostError) return res.status(500).json({ error: hostError.message });

  const joinedIds = new Set(guestEntries.map((entry) => entry.event?.id));
  const hostEntries = (hostData || [])
    .filter((e) => !joinedIds.has(e.id))
    .map((e) => ({ guest: null, event: mapEvent(e), isHost: true }));

  return res.json({ entries: [...hostEntries, ...guestEntries] });
});

// Legacy guest event endpoint compatibility
app.get('/guest/events/:authUserId', async (req, res) => {
  const authUserId = req.params.authUserId;
  const { data: guestData, error: guestError } = await supabase
    .from('guests')
    .select('*, events(*)')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: false });
  if (guestError) return res.status(500).json({ error: guestError.message });

  const guestEntries = (guestData || []).map((g) => ({
    guest: mapGuest(g),
    event: mapEvent(g.events),
    isHost: false,
  }));

  const { data: hostData, error: hostError } = await supabase
    .from('events')
    .select('*')
    .eq('admin_id', authUserId)
    .order('created_at', { ascending: false });
  if (hostError) return res.status(500).json({ error: hostError.message });

  const joinedIds = new Set(guestEntries.map((entry) => entry.event?.id));
  const hostEntries = (hostData || [])
    .filter((e) => !joinedIds.has(e.id))
    .map((e) => ({ guest: null, event: mapEvent(e), isHost: true }));

  return res.json({ entries: [...hostEntries, ...guestEntries] });
});

app.get('/guests', async (req, res) => {
  const { eventId } = req.query;
  const list = await getAllGuests(eventId);
  return res.json({ guests: list });
});

app.get('/guest/:id/media', async (req, res) => {
  const items = await getGuestMedia(req.params.id);
  return res.json({ media: items });
});

app.get('/event/:id/media', async (req, res) => {
  try {
    const { type } = req.query;
    const items = await getEventMedia(req.params.id, type);
    return res.json({ media: items });
  } catch (err) {
    console.error('event media error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
