import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function UploadPage() {
  const navigate = useNavigate();
  const { guest, uploadMedia, message, setMessage } = useApp();
  const [file, setFile] = useState(null);
  const [type, setType] = useState('photo');

  useEffect(() => {
    if (!guest) {
      navigate('/');
    }
  }, [guest]);

  if (!guest) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await uploadMedia({ file, type });
    if (result.success) {
      setFile(null);
      navigate('/guest/media');
    }
  };

  return (
    <div className="card">
      <h2>Upload média</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="photo">Photo</option>
          <option value="video">Vidéo</option>
          <option value="audio">Audio</option>
        </select>
        <button type="submit">Uploader</button>
      </form>
      {message && <p className="message">{message}</p>}
      <div className="navigation-buttons">
        <Link to="/guest/home" className="button">Retour à l'accueil</Link>
      </div>
    </div>
  );
}
