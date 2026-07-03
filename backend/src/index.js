const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const supabase = require('./supabase');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 4000;
const frontendPath = path.join(__dirname, '../../frontend/dist');
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'wedding-media';
const useDb = !!supabase;

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

const fallbackEvents = [{ id: 'event-1', name: 'Wedding 2026', accessCode: 'MARIAGE2026' }];
const fallbackGuests = [
  { id: 'guest-1', eventId: 'event-1', firstName: 'Jean', lastName: 'Rakoto', role: 'guest', is_admin: false },
  { id: 'admin-1', eventId: 'event-1', firstName: 'Marie', lastName: 'Randria', role: 'admin', is_admin: true },
];
const fallbackMedia = [];

async function findEventByCode(code) {
  if (!useDb) {
    return fallbackEvents.find((event) => event.accessCode === code) || null;
  }

  const { data, error } = await supabase.from('events').select('*').eq('access_code', code).limit(1).single();
  if (error) {
    console.error('Supabase event lookup error', error);
    return null;
  }
  return data;
}

async function createGuest(eventId, firstName, lastName, isAdmin = false) {
  if (!useDb) {
    const guest = {
      id: `guest-${Date.now()}`,
      eventId,
      firstName,
      lastName,
      role: isAdmin ? 'admin' : 'guest',
      is_admin: Boolean(isAdmin),
    };
    fallbackGuests.push(guest);
    return guest;
  }

  const role = isAdmin ? 'admin' : 'guest';
  const { data, error } = await supabase.from('guests').insert([{ event_id: eventId, first_name: firstName, last_name: lastName, role, is_admin: isAdmin }]).single();
  if (error) {
    console.error('Supabase guest insert error', error);
    throw error;
  }
  return data;
}

async function createMediaRecord(guestId, eventId, type, fileName, fileUrl) {
  if (!useDb) {
    const entry = {
      id: `media-${Date.now()}`,
      guestId,
      eventId,
      type,
      file_name: fileName,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    };
    fallbackMedia.push(entry);
    return entry;
  }

  const { data, error } = await supabase.from('media').insert([{ guest_id: guestId, event_id: eventId, type, file_name: fileName, file_url: fileUrl }]).single();
  if (error) {
    console.error('Supabase media insert error', error);
    throw error;
  }
  return data;
}

async function getGuestMedia(guestId) {
  if (!useDb) {
    return fallbackMedia.filter((item) => item.guestId === guestId);
  }

  const { data, error } = await supabase.from('media').select('*').eq('guest_id', guestId).order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase media select error', error);
    return [];
  }
  return data;
}

async function getAllGuests() {
  if (!useDb) {
    return fallbackGuests;
  }

  const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase guests select error', error);
    return [];
  }
  return data;
}

async function getGuestById(guestId) {
  if (!useDb) {
    return fallbackGuests.find((item) => item.id === guestId) || null;
  }

  const { data, error } = await supabase.from('guests').select('*').eq('id', guestId).limit(1).single();
  if (error) {
    console.error('Supabase guest select error', error);
    return null;
  }
  return data;
}

async function deleteMediaRecord(mediaId, guestId) {
  if (!useDb) {
    const index = fallbackMedia.findIndex((item) => item.id === mediaId && item.guestId === guestId);
    if (index === -1) return null;
    return fallbackMedia.splice(index, 1)[0];
  }

  const { data, error } = await supabase.from('media').delete().eq('id', mediaId).eq('guest_id', guestId).single();
  if (error) {
    console.error('Supabase media delete error', error);
    return null;
  }
  return data;
}

async function guestHasCorrectEvent(guestId, eventId) {
  if (!useDb) {
    return fallbackGuests.some((guest) => guest.id === guestId && guest.eventId === eventId);
  }

  const { data, error } = await supabase.from('guests').select('id').eq('id', guestId).eq('event_id', eventId).limit(1).single();
  if (error) {
    console.error('Supabase guest event validation error', error);
    return false;
  }
  return Boolean(data);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wedding-share-backend', db: useDb ? 'supabase' : 'fallback' });
});

app.post('/join-event', async (req, res) => {
  const { code, firstName, lastName, isAdmin } = req.body;

  if (!code || !firstName || !lastName) {
    return res.status(400).json({ error: 'Code, prénom et nom sont requis.' });
  }

  const event = await findEventByCode(code);
  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable.' });
  }

  try {
    const guest = await createGuest(event.id, firstName, lastName, Boolean(isAdmin));
    return res.status(201).json({ guest, event });
  } catch (error) {
    return res.status(500).json({ error: 'Impossible de créer l’invité.' });
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  const { guestId, eventId, type } = req.body;

  if (!req.file || !guestId || !eventId || !type) {
    return res.status(400).json({ error: 'Fichier, guestId, eventId et type sont requis.' });
  }

  const validGuest = await guestHasCorrectEvent(guestId, eventId);
  if (!validGuest) {
    return res.status(403).json({ error: 'Invité non autorisé pour cet événement.' });
  }

  const fileName = `${Date.now()}-${req.file.originalname}`;
  const fileUrl = `https://example.com/${type}/${fileName}`;

  try {
    const entry = await createMediaRecord(guestId, eventId, type, req.file.originalname, fileUrl);
    return res.status(201).json({ media: entry });
  } catch (error) {
    return res.status(500).json({ error: 'Impossible d’enregistrer le média.' });
  }
});

app.get('/my-media/:guestId', async (req, res) => {
  const items = await getGuestMedia(req.params.guestId);
  return res.json({ media: items });
});

app.delete('/media/:id', async (req, res) => {
  const { guestId } = req.body;

  if (!guestId) {
    return res.status(400).json({ error: 'guestId est requis.' });
  }

  const deleted = await deleteMediaRecord(req.params.id, guestId);
  if (!deleted) {
    return res.status(404).json({ error: 'Média introuvable ou non autorisé à supprimer.' });
  }

  return res.json({ removed: deleted });
});

app.get('/guests', async (req, res) => {
  const allGuests = await getAllGuests();
  return res.json({ guests: allGuests });
});

app.get('/guest/:id/media', async (req, res) => {
  const items = await getGuestMedia(req.params.id);
  return res.json({ media: items });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
