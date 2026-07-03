import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function UploadPage() {
  const navigate = useNavigate();
  const { guest, uploadMedia, message, setMessage } = useApp();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [type, setType] = useState('photo');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!guest) {
      navigate('/');
    }
  }, [guest]);

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setSelectedFiles((current) => [...current, ...newFiles]);
    setUploadError('');
  };

  const removeFile = (fileId) => {
    setSelectedFiles((current) => {
      const removed = current.find((item) => item.id === fileId);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((item) => item.id !== fileId);
    });
  };

  const clearSelection = () => {
    selectedFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    setSelectedFiles([]);
    setUploadError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      setUploadError('Veuillez sélectionner au moins une image avant d’uploader.');
      return;
    }
    setIsUploading(true);
    setUploadError('');
    setMessage(`Upload de ${selectedFiles.length} fichier(s) en cours...`);

    for (const item of selectedFiles) {
      const result = await uploadMedia({ file: item.file, type });
      if (!result.success) {
        setUploadError(result.error || 'Échec de l’upload.');
        setIsUploading(false);
        return;
      }
    }

    clearSelection();
    setMessage('Tous les fichiers ont été uploadés avec succès.');
    setIsUploading(false);
    navigate('/guest/media');
  };

  const previewItems = useMemo(
    () => selectedFiles.map((item) => (
      <div key={item.id} className="upload-preview-card">
        <img src={item.preview} alt={item.file.name} className="upload-preview-image" />
        <div className="upload-preview-info">
          <strong>{item.file.name}</strong>
          <span>{Math.round(item.file.size / 1024)} KB</span>
        </div>
        <button type="button" className="button button-small" onClick={() => removeFile(item.id)}>
          Supprimer
        </button>
      </div>
    )),
    [selectedFiles]
  );

  if (!guest) {
    return null;
  }

  return (
    <div className="card">
      <h2>Uploader des photos</h2>
      <form onSubmit={handleSubmit}>
        <label className="form-label">
          Sélectionnez une ou plusieurs images
          <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
        </label>

        <label className="form-label">
          Type de média
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="photo">Photo</option>
            <option value="video">Vidéo</option>
            <option value="audio">Audio</option>
          </select>
        </label>

        {selectedFiles.length > 0 && (
          <div className="upload-preview-grid">
            {previewItems}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={isUploading || selectedFiles.length === 0}>
            {isUploading ? 'Envoi en cours...' : `Uploader ${selectedFiles.length} fichier(s)`}
          </button>
          <button type="button" className="button button-secondary" onClick={clearSelection} disabled={isUploading || selectedFiles.length === 0}>
            Effacer la sélection
          </button>
        </div>
      </form>

      {(uploadError || message) && (
        <div className="message-box">
          {uploadError ? <p className="message error">{uploadError}</p> : <p className="message">{message}</p>}
        </div>
      )}

      <div className="navigation-buttons">
        <Link to="/guest/home" className="button">Retour à l'accueil</Link>
      </div>
    </div>
  );
}
