const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

const events = [{ id: 'event-1', name: 'Wedding 2026', accessCode: 'MARIAGE2026' }];
const guests = [{ id: 'guest-1', eventId: 'event-1', firstName: 'Jean', lastName: 'Rakoto' }];
const media = [];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wedding-share-backend' });
});

app.post('/join-event', (req, res) => {
  const { code, firstName, lastName } = req.body;

  if (!code || !firstName || !lastName) {
    return res.status(400).json({ error: 'Code, prénom et nom sont requis.' });
  }

  const event = events.find((item) => item.accessCode === code);
  if (!event) {
    return res.status(404).json({ error: 'Événement introuvable.' });
  }

  const guest = {
    id: `guest-${Date.now()}`,
    eventId: event.id,
    firstName,
    lastName,
  };

  guests.push(guest);
  return res.status(201).json({ guest, event });
});

app.post('/upload', upload.single('file'), (req, res) => {
  const { guestId, eventId, type } = req.body;

  if (!req.file || !guestId || !eventId || !type) {
    return res.status(400).json({ error: 'Fichier, guestId, eventId et type sont requis.' });
  }

  const entry = {
    id: `media-${Date.now()}`,
    guestId,
    eventId,
    type,
    fileName: req.file.originalname,
    fileUrl: `https://example.com/${type}/${req.file.originalname}`,
    createdAt: new Date().toISOString(),
  };

  media.push(entry);
  return res.status(201).json({ media: entry });
});

app.get('/my-media/:guestId', (req, res) => {
  const items = media.filter((item) => item.guestId === req.params.guestId);
  return res.json({ media: items });
});

app.delete('/media/:id', (req, res) => {
  const { guestId } = req.body;
  const index = media.findIndex((item) => item.id === req.params.id && item.guestId === guestId);

  if (index === -1) {
    return res.status(404).json({ error: 'Média introuvable ou non autorisé à supprimer.' });
  }

  const [removed] = media.splice(index, 1);
  return res.json({ removed });
});

app.get('/guests', (req, res) => {
  return res.json({ guests });
});

app.get('/guest/:id/media', (req, res) => {
  const items = media.filter((item) => item.guestId === req.params.id);
  return res.json({ media: items });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

// Fallback pour le routing frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
