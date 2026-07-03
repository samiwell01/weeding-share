import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';
import Icon from '../components/Icon';

const TABS = [
  { key: 'photo', label: 'Photo', icon: 'image' },
  { key: 'video', label: 'Vidéo', icon: 'movie' },
  { key: 'audio', label: 'Audio', icon: 'mic' },
];

export default function UploadPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const {
    authUser,
    guest,
    setGuest,
    event,
    loadEventById,
    guestEvents,
    loadGuests,
    joinEvent,
    uploadMedia,
    message,
    setMessage,
    userProfile,
  } = useApp();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [type, setType] = useState('photo');
  const [tabIndex, setTabIndex] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [description, setDescription] = useState('');
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    const initialize = async () => {
      let currentEvent = event;
      if (!currentEvent || currentEvent.id !== eventId) {
        currentEvent = await loadEventById(eventId);
        if (!currentEvent) {
          navigate('/events');
          return;
        }
      }

      const entry = guestEvents.find((e) => e.event?.id === eventId);
      if (entry?.guest) {
        setGuest(entry.guest);
        setPageLoading(false);
        return;
      }

      if (guest?.eventId === eventId) {
        setPageLoading(false);
        return;
      }

      const isHost = currentEvent.adminId === authUser.id;
      if (isHost) {
        const firstName = userProfile?.firstName || authUser.user_metadata?.firstName || 'Organisateur';
        const lastName = userProfile?.lastName || authUser.user_metadata?.lastName || 'Hôte';
        await joinEvent({
          code: currentEvent.accessCode,
          firstName,
          lastName,
          phone: userProfile?.phone || authUser.user_metadata?.phone || '',
          relation: 'Organisateur',
        });
        setPageLoading(false);
        return;
      }

      const list = await loadGuests(eventId);
      const hostGuest = list.find((g) => g.authUserId === authUser.id);
      if (hostGuest) setGuest(hostGuest);
      setPageLoading(false);
    };

    initialize();
  }, [authUser, event, eventId, guest, guestEvents, loadEventById, loadGuests, joinEvent, navigate, setGuest, userProfile]);

  const switchTab = (newType, index) => {
    setType(newType);
    setTabIndex(index);
    clearSelection();
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((cur) => [
      ...cur,
      ...files.map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}`,
        file: f,
        preview: URL.createObjectURL(f),
      })),
    ]);
    setUploadError('');
  };

  const removeFile = (id) => setSelectedFiles((cur) => {
    const removed = cur.find((i) => i.id === id);
    if (removed) URL.revokeObjectURL(removed.preview);
    return cur.filter((i) => i.id !== id);
  });

  const clearSelection = () => {
    selectedFiles.forEach((i) => URL.revokeObjectURL(i.preview));
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setSelectedFiles([]);
    setRecordedAudioUrl('');
    setUploadError('');
    setSeconds(0);
    setDescription('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) {
      setUploadError('Sélectionnez au moins un fichier.');
      return;
    }
    if (!guest) {
      setUploadError('Vous devez rejoindre cet événement d\'abord.');
      return;
    }
    setIsUploading(true);
    setUploadError('');
    setMessage(`Upload de ${selectedFiles.length} fichier(s)…`);
    for (const item of selectedFiles) {
      const result = await uploadMedia({ file: item.file, type, description: description.trim() || undefined });
      if (!result.success) {
        setUploadError(result.error || 'Échec upload.');
        setIsUploading(false);
        return;
      }
    }
    clearSelection();
    setMessage('Tous les fichiers ont été uploadés !');
    setIsUploading(false);
    navigate(eventId ? `/events/${eventId}/media` : '/events');
  };

  const startRecording = async () => {
    setUploadError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(file);
        setSelectedFiles([{ id: `${file.name}-${file.size}`, file, preview: previewUrl }]);
        setRecordedAudioUrl(previewUrl);
        setRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start();
      setAudioStream(stream);
      setMediaRecorder(recorder);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setUploadError('Impossible d\'accéder au microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) mediaRecorder.stop();
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
    setMediaRecorder(null);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const canUpload = selectedFiles.length > 0 && guest;

  if (pageLoading) return <LoadingOverlay message="Chargement…" />;

  const acceptMap = { photo: 'image/*', video: 'video/*', audio: 'audio/*' };
  const dropTitle = type === 'video' ? 'Sélectionner Vidéo' : type === 'photo' ? 'Sélectionner Photo' : 'Message Vocal';
  const dropIcon = type === 'video' ? 'video_library' : 'add_photo_alternate';

  return (
    <div className="page-main-narrow">
      <section className="upload-header">
        <span className="upload-context-label">Partager un souvenir</span>
        <h2 className="upload-event-title">{event?.name || 'Événement'}</h2>
        <p className="welcome-subtitle">Aidez-les à revivre cette journée magique.</p>
      </section>

      <div className="upload-tabs">
        <div
          className="upload-tab-highlight"
          style={{ width: 'calc(33.33% - 8px)', left: `calc(${tabIndex * 33.33}% + ${tabIndex === 0 ? 6 : tabIndex === 1 ? 4 : 2}px)` }}
        />
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            type="button"
            className={`upload-tab-btn${tabIndex === i ? ' active' : ''}`}
            onClick={() => switchTab(tab.key, i)}
          >
            <Icon name={tab.icon} size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {type !== 'audio' ? (
          <div>
            <div className="drop-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptMap[type]}
                multiple
                onChange={handleFilesChange}
              />
              <div className="drop-zone-icon">
                <Icon name={dropIcon} size={36} />
              </div>
              <h3 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>{dropTitle}</h3>
              <p className="welcome-subtitle">Glissez-déposez vos fichiers ici ou touchez pour parcourir.</p>
              <button
                type="button"
                className="btn-primary btn-pill"
                style={{ marginTop: 32 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Parcourir
              </button>
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="section-header-row">
                  <span className="font-label">Fichiers ({selectedFiles.length})</span>
                  <button type="button" className="btn-switch" style={{ color: 'var(--error)' }} onClick={clearSelection}>
                    Tout effacer
                  </button>
                </div>
                <div className="preview-grid">
                  {selectedFiles.slice(0, 6).map((item) => (
                    <div key={item.id} className="preview-thumb">
                      {item.file.type.startsWith('image/') ? (
                        <img src={item.preview} alt={item.file.name} />
                      ) : (
                        <video src={item.preview} />
                      )}
                    </div>
                  ))}
                  {selectedFiles.length > 6 && (
                    <div className="preview-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)', fontWeight: 600 }}>
                      +{selectedFiles.length - 6}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="audio-recorder-card">
            <h3 className="section-title" style={{ fontSize: 24, marginBottom: 8 }}>Message Vocal</h3>
            <p className="welcome-subtitle" style={{ marginBottom: 32 }}>Laissez un message chaleureux aux jeunes mariés.</p>

            <div className="audio-recorder-ring">
              <div className="waveform-bars">
                {[4, 8, 12, 6, 10].map((h, i) => (
                  <div key={i} className="waveform-bar" style={{ height: recording ? `${Math.random() * 40 + 10}px` : `${h * 4}px` }} />
                ))}
              </div>
              {recording && <div className="audio-record-pulse" />}
              <button
                type="button"
                className={`audio-record-btn${recording ? ' recording' : ''}`}
                onClick={recording ? stopRecording : startRecording}
              >
                <Icon name={recording ? 'stop' : 'mic'} size={48} fill />
              </button>
            </div>

            <div className="audio-timer">{formatTime(seconds)}</div>

            {recordedAudioUrl && (
              <div className="audio-preview-bar">
                <audio controls src={recordedAudioUrl} style={{ flex: 1 }} />
                <button type="button" className="btn-icon" onClick={clearSelection}>
                  <Icon name="close" />
                </button>
              </div>
            )}

            <p className="welcome-subtitle" style={{ fontSize: 12, fontStyle: 'italic', marginTop: 16, opacity: 0.6 }}>
              Enregistrez jusqu'à 3 minutes de souvenirs.
            </p>
          </div>
        )}

        {!guest && (
          <p className="message error" style={{ marginTop: 16 }}>Vous devez rejoindre cet événement pour uploader.</p>
        )}

        {canUpload && (
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label" htmlFor="media-description">Description (optionnel)</label>
            <textarea
              id="media-description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ajoutez un mot sur ce souvenir..."
              rows={2}
            />
          </div>
        )}

        <div style={{ marginTop: 'var(--stack-lg)' }}>
          <button
            type="submit"
            className="btn-primary btn-primary-full"
            disabled={isUploading || !canUpload}
            style={{ opacity: canUpload ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, padding: '16px' }}
          >
            <Icon name="cloud_upload" />
            {isUploading ? 'Envoi…' : 'Uploader'}
          </button>
          <p className="welcome-subtitle" style={{ textAlign: 'center', marginTop: 16, fontSize: 12, opacity: 0.5 }}>
            En uploadant, vous acceptez les conditions de partage de l'événement.
          </p>
        </div>

        {(uploadError || message) && (
          <div className="message-box">
            {uploadError ? <p className="message error">{uploadError}</p> : <p className="message">{message}</p>}
          </div>
        )}
      </form>
    </div>
  );
}
