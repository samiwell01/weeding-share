const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./supabase');

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

// ─── MAPPERS ─────────────────────────────────────────────────────────────────

function mapEvent(e) {
  if (!e) return null;
  return {
    id: e.id,
    adminId: e.admin_id,
    name: e.name,
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

function mapMedia(item) {
  if (!item) return null;
  return {
    id: item.id,
    guestId: item.guest_id,
    eventId: item.event_id,
    type: item.type,
    fileName: item.file_name,
    fileUrl: item.file_url,
    createdAt: item.created_at,
  };
}

function generateAccessCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ─── DB HELPERS ──────────────────────────────────────────────────────────────

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

async function getGuestMedia(guestId) {
  const { data, error } = await supabase.from('media').select('*').eq('guest_id', guestId).order('created_at', { ascending: false });
  if (error) return [];
  const items = data.map(mapMedia);
  return Promise.all(items.map(async (item) => {
    if (!item.fileUrl || item.fileUrl.startsWith('http')) return item;
    const signed = await getSignedFileUrl(item.fileUrl);
    return { ...item, fileUrl: signed || item.fileUrl };
  }));
}

async function getAllGuests(eventId) {
  const query = supabase.from('guests').select('*').order('created_at', { ascending: true });
  if (eventId) query.eq('event_id', eventId);
  const { data, error } = await query;
  if (error) return [];
  return data.map(mapGuest);
}

async function deleteMediaRecord(mediaId, guestId) {
  const { data: existing, error: fetchError } = await supabase
    .from('media').select('*').eq('id', mediaId).eq('guest_id', guestId).limit(1).single();
  if (fetchError || !existing) return null;
  const { error } = await supabase.from('media').delete().eq('id', mediaId).eq('guest_id', guestId);
  if (error) return null;
  return mapMedia(existing);
}

async function guestHasCorrectEvent(guestId, eventId) {
  const { data, error } = await supabase.from('guests').select('id').eq('id', guestId).eq('event_id', eventId).limit(1).single();
  if (error) return false;
  return Boolean(data);
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.get('/health', async (req, res) => {
  if (!useDb) return res.status(500).json({ status: 'error', message: 'Supabase not configured' });
  const { data, error } = await supabase.from('events').select('id').limit(1);
  if (error) return res.status(500).json({ status: 'error', error: error.message });
  return res.json({ status: 'ok', service: 'wedding-share-backend' });
});

// Admin: get or create wedding
app.get('/admin/wedding', async (req, res) => {
  const { adminId } = req.query;
  if (!adminId) return res.status(400).json({ error: 'adminId requis.' });
  const event = await getEventByAdminId(adminId);
  return res.json({ event });
});

app.post('/admin/wedding', async (req, res) => {
  const { adminId, name, date, time, venueName, venueAddress, coverUrl, hostFirstName, hostLastName, hostEmail, hostPhone } = req.body;
  if (!adminId || !name) return res.status(400).json({ error: 'adminId et name sont requis.' });

  try {
    const event = await createEvent(adminId, { name, date, time, venueName, venueAddress, coverUrl });
    if (hostFirstName && hostLastName) {
      await createGuest(event.id, {
        authUserId: adminId,
        firstName: hostFirstName,
        lastName: hostLastName,
        email: hostEmail || null,
        phone: hostPhone || null,
        relation: 'hôte',
        role: 'admin',
        isAdmin: true,
      });
    }
    return res.status(201).json({ event });
  } catch (err) {
    console.error('create wedding error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/admin/wedding/:id', async (req, res) => {
  const { adminId, name, date, time, venueName, venueAddress, coverUrl } = req.body;
  if (!adminId) return res.status(400).json({ error: 'adminId requis.' });
  try {
    const event = await updateEvent(req.params.id, adminId, { name, date, time, venueName, venueAddress, coverUrl });
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

// Upload media
app.post('/upload', upload.single('file'), async (req, res) => {
  const { guestId, eventId, type } = req.body;
  if (!req.file || !guestId || !eventId || !type) {
    return res.status(400).json({ error: 'Fichier, guestId, eventId et type sont requis.' });
  }

  const valid = await guestHasCorrectEvent(guestId, eventId);
  if (!valid) return res.status(403).json({ error: 'Invité non autorisé.' });

  const storagePath = `${eventId}/${guestId}/${Date.now()}-${req.file.originalname}`;
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
      .insert([{ guest_id: guestId, event_id: eventId, type, file_name: req.file.originalname, file_url: signedURL }])
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

app.delete('/media/:id', async (req, res) => {
  const { guestId } = req.body;
  if (!guestId) return res.status(400).json({ error: 'guestId requis.' });
  const deleted = await deleteMediaRecord(req.params.id, guestId);
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

// Admin stats
app.get('/admin/stats/:eventId', async (req, res) => {
  const { data, error } = await supabase
    .from('media')
    .select('type')
    .eq('event_id', req.params.eventId);
  if (error) return res.status(500).json({ error: error.message });
  const photos = data.filter((m) => m.type === 'photo').length;
  const videos = data.filter((m) => m.type === 'video').length;
  const audios = data.filter((m) => m.type === 'audio').length;
  return res.json({ photos, videos, audios, total: data.length });
});

// Guest: list all events joined by authUserId and hosted by authUserId
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

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
