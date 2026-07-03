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
const useDb = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

function mapEvent(event) {
  if (!event) return null;
  return {
    id: event.id,
    name: event.name,
    accessCode: event.access_code,
    createdAt: event.created_at,
  };
}

function mapGuest(guest) {
  if (!guest) return null;
  return {
    id: guest.id,
    eventId: guest.event_id,
    firstName: guest.first_name,
    lastName: guest.last_name,
    role: guest.role,
    isAdmin: guest.is_admin,
    createdAt: guest.created_at,
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

function isInvalidSupabaseKeyError(error) {
  return error && error.code === '42501';
}

async function ensureInitialData() {
  if (!useDb) {
    console.log('Supabase not configured, skipping initial data setup.');
    return;
  }

  const { data: existingEvent, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('access_code', 'MARIAGE2026')
    .limit(1)
    .single();

  if (eventError) {
    if (isRowLevelSecurityError(eventError)) {
      console.error('Supabase row-level security error during event lookup. Ensure SUPABASE_SERVICE_ROLE_KEY is a service role key, not anon.');
      process.exit(1);
    }
    console.error('Supabase initial event lookup error', eventError);
    return;
  }

  if (!existingEvent) {
    const { data: createdEvent, error: createError } = await supabase
      .from('events')
      .insert([{ name: 'Wedding 2026', access_code: 'MARIAGE2026' }])
      .single();

    if (createError) {
      if (isRowLevelSecurityError(createError)) {
        console.error('Supabase row-level security error during event insert. Ensure SUPABASE_SERVICE_ROLE_KEY is a service role key, not anon.');
        process.exit(1);
      }
      console.error('Supabase event seed error', createError);
      return;
    }

    console.log('Supabase seeded initial event:', createdEvent.id);
  }
}

async function findEventByCode(code) {
  if (!useDb) {
    return null;
  }

  const { data, error } = await supabase.from('events').select('*').eq('access_code', code).limit(1).single();
  if (error) {
    console.error('Supabase event lookup error', error);
    if (isInvalidSupabaseKeyError(error)) {
      const invalidKeyError = new Error('INVALID_SUPABASE_KEY');
      invalidKeyError.supabaseError = error;
      throw invalidKeyError;
    }
    throw error;
  }
  return mapEvent(data);
}

async function createGuest(eventId, firstName, lastName) {
  if (!useDb) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('guests')
    .insert([{ event_id: eventId, first_name: firstName, last_name: lastName, role: 'guest', is_admin: false }])
    .single();

  if (error) {
    console.error('Supabase guest insert error', error);
    if (isInvalidSupabaseKeyError(error)) {
      const invalidKeyError = new Error('INVALID_SUPABASE_KEY');
      invalidKeyError.supabaseError = error;
      throw invalidKeyError;
    }
    throw error;
  }
  return mapGuest(data);
}

async function createMediaRecord(guestId, eventId, type, fileName, fileUrl) {
  if (!useDb) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('media')
    .insert([{ guest_id: guestId, event_id: eventId, type, file_name: fileName, file_url: fileUrl }])
    .single();

  if (error) {
    console.error('Supabase media insert error', error);
    throw error;
  }
  return mapMedia(data);
}

async function getGuestMedia(guestId) {
  if (!useDb) {
    return [];
  }

  const { data, error } = await supabase.from('media').select('*').eq('guest_id', guestId).order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase media select error', error);
    return [];
  }
  return data.map(mapMedia);
}

async function getAllGuests() {
  if (!useDb) {
    return [];
  }

  const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase guests select error', error);
    return [];
  }
  return data.map(mapGuest);
}

async function getGuestById(guestId) {
  if (!useDb) {
    return null;
  }

  const { data, error } = await supabase.from('guests').select('*').eq('id', guestId).limit(1).single();
  if (error) {
    console.error('Supabase guest select error', error);
    return null;
  }
  return mapGuest(data);
}

async function deleteMediaRecord(mediaId, guestId) {
  if (!useDb) {
    return null;
  }

  const { data, error } = await supabase.from('media').delete().eq('id', mediaId).eq('guest_id', guestId).single();
  if (error) {
    console.error('Supabase media delete error', error);
    return null;
  }
  return mapMedia(data);
}

async function guestHasCorrectEvent(guestId, eventId) {
  if (!useDb) {
    return false;
  }

  const { data, error } = await supabase.from('guests').select('id').eq('id', guestId).eq('event_id', eventId).limit(1).single();
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Supabase guest event validation error', error);
    }
    return false;
  }
  return Boolean(data);
}

app.get('/health', async (req, res) => {
  if (!useDb) {
    return res.status(500).json({ status: 'error', service: 'wedding-share-backend', db: 'none', message: 'Supabase environment variables are missing' });
  }

  const { data, error } = await supabase.from('events').select('id').limit(1);
  if (error) {
    return res.status(500).json({ status: 'error', db: 'supabase', error: error.message });
  }

  return res.json({ status: 'ok', service: 'wedding-share-backend', db: 'supabase', eventCount: data.length });
});


app.post('/join-event', async (req, res) => {
  const { code, firstName, lastName } = req.body;

  if (!code || !firstName || !lastName) {
    return res.status(400).json({ error: 'Code, prénom et nom sont requis.' });
  }

  try {
    const event = await findEventByCode(code);
    if (!event) {
      return res.status(404).json({ error: 'Événement introuvable.' });
    }

    const guest = await createGuest(event.id, firstName, lastName);
    return res.status(201).json({ guest, event });
  } catch (error) {
    console.error('join-event error', error);
    if (error.message === 'INVALID_SUPABASE_KEY') {
      return res.status(500).json({
        error: 'Supabase invalide : vérifiez que SUPABASE_SERVICE_ROLE_KEY est une service role key et non la clé publique anon.',
      });
    }
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

  const storagePath = `${eventId}/${guestId}/${Date.now()}-${req.file.originalname}`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

  if (storageError) {
    console.error('Supabase storage upload error', storageError);
    return res.status(500).json({ error: 'Impossible de téléverser le fichier.' });
  }

  const publicUrlResponse = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  const publicUrl = publicUrlResponse?.publicURL || publicUrlResponse?.data?.publicUrl || publicUrlResponse?.data?.publicURL;

  if (!publicUrl) {
    console.error('Supabase public URL error', publicUrlResponse);
    return res.status(500).json({ error: 'Impossible de récupérer l’URL publique du fichier.' });
  }

  try {
    const entry = await createMediaRecord(guestId, eventId, type, req.file.originalname, publicUrl);
    return res.status(201).json({ media: entry });
  } catch (error) {
    console.error('createMediaRecord error', error);
    if (error.message === 'INVALID_SUPABASE_KEY') {
      return res.status(500).json({
        error: 'Supabase invalide : vérifiez que SUPABASE_SERVICE_ROLE_KEY est une service role key et non la clé publique anon.',
      });
    }
    return res.status(500).json({ error: error.message || 'Impossible d’enregistrer le média.' });
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

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

ensureInitialData()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize backend:', error);
    process.exit(1);
  });
