import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import LoadingOverlay from '../components/LoadingOverlay';

export default function UploadPage() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const {
    authUser,
    guest,
    setGuest,
    guestEvents,
    guests,
    loadGuests,
    uploadMedia,
    message,
    setMessage,
  } = useApp();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [type, setType] = useState('photo');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState('');

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }

    const entry = guestEvents.find((e) => e.event?.id === eventId);
    const initialize = async () => {
      if (entry?.guest) {
        setGuest(entry.guest);
        setPageLoading(false);
        return;
      }

      if (guest?.eventId === eventId) {
        setPageLoading(false);
        return;
      }

      const list = await loadGuests(eventId);
      const hostGuest = list.find((g) => g.authUserId === authUser.id);
      if (hostGuest) setGuest(hostGuest);
      setPageLoading(false);
    };

    initialize();
  }, [authUser, eventId, guest, guestEvents, loadGuests, navigate, setGuest]);

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
      const result = await uploadMedia({ file: item.file, type });
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

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(file);
        setSelectedFiles((cur) => [
          ...cur,
          { id: `${file.name}-${file.size}-${file.lastModified}`, file, preview: previewUrl },
        ]);
        setRecordedAudioUrl(previewUrl);
        setRecording(false);
      };

      recorder.start();
      setAudioStream(stream);
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
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

  const previews = useMemo(() => selectedFiles.map((item) => (
    <div key={item.id} className="upload-preview-card">
      <div className="upload-preview-preview">
        {item.file.type.startsWith('image/') ? (
          <img src={item.preview} alt={item.file.name} className="upload-preview-image" />
        ) : item.file.type.startsWith('video/') ? (
          <video src={item.preview} controls className="upload-preview-video" />
        ) : (
          <div className="upload-preview-file">
            <strong>{item.file.name}</strong>
            <span>{item.file.type}</span>
          </div>
        )}
      </div>
      <div className="upload-preview-info">
        <strong>{item.file.name}</strong>
        <span>{Math.round(item.file.size / 1024)} KB</span>
      </div>
      <button type="button" className="button button-secondary" onClick={() => removeFile(item.id)}>Retirer</button>
    </div>
  )), [selectedFiles]);

  if (pageLoading) return <LoadingOverlay message="Chargement…" />;

  return (
    <div className="card">
      <h2>Ajouter des médias</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Type de média
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="photo">📷 Photo</option>
            <option value="video">🎥 Vidéo</option>
            <option value="audio">🎵 Audio</option>
          </select>
        </label>

        {type === 'audio' && (
          <div className="audio-recorder">
            <button
              type="button"
              className="button"
              onClick={recording ? stopRecording : startRecording}
            >
              {recording ? 'Arrêter l\'enregistrement' : 'Enregistrer un message vocal'}
            </button>
            {recordedAudioUrl && (
              <div className="audio-preview">
                <audio controls src={recordedAudioUrl} />
              </div>
            )}
          </div>
        )}

        <label>
          Sélectionner des fichiers
          <input
            type="file"
            accept={type === 'audio' ? 'audio/*' : type === 'video' ? 'video/*' : 'image/*'}
            multiple
            onChange={handleFilesChange}
          />
        </label>

        {selectedFiles.length > 0 && <div className="upload-preview-grid">{previews}</div>}

        {!guest && !pageLoading && (
          <p className="message">Vous devez rejoindre cet événement ou être l'organisateur pour uploader des médias.</p>
        )}

        <div className="form-actions">
          <button type="submit" disabled={isUploading || !selectedFiles.length}>
            {isUploading ? 'Envoi…' : `Uploader ${selectedFiles.length} fichier(s)`}
          </button>
          <button type="button" className="button button-secondary" onClick={clearSelection} disabled={!selectedFiles.length && !recordedAudioUrl}>Effacer</button>
        </div>
      </form>

      {(uploadError || message) && (
        <div className="message-box">
          {uploadError ? <p className="message error">{uploadError}</p> : <p className="message">{message}</p>}
        </div>
      )}

      <div className="navigation-buttons">
        <Link to={eventId ? `/events/${eventId}` : '/events'} className="button button-secondary">Retour</Link>
      </div>
    </div>
  );
}
