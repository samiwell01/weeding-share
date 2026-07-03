import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

function Avatar({ firstName, lastName, avatarUrl, size = 80 }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt="avatar" className="profile-avatar-img" style={{ width: size, height: size }} />;
  }
  return (
    <div className="profile-avatar-initials" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function UserProfilePage() {
  const { authUser, userProfile, updateUserProfile, updatePassword, signOut, loadUserProfile } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', avatarUrl: '' });
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authUser) { navigate('/admin'); return; }
    if (!userProfile) {
      loadUserProfile(authUser.id);
      return;
    }
    setForm({
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      phone: userProfile.phone || '',
      avatarUrl: userProfile.avatarUrl || '',
    });
  }, [authUser, userProfile]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const result = await updateUserProfile(form);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    setMessage('Profil mis à jour !');
    await loadUserProfile(authUser.id);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setError('Mot de passe trop court (min 6 caractères).'); return; }
    setSaving(true);
    setError('');
    const result = await updatePassword(newPassword);
    setSaving(false);
    if (!result.success) { setError(result.error); return; }
    setNewPassword('');
    setMessage('Mot de passe mis à jour !');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!authUser) return null;

  return (
    <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="profile-header">
        <Avatar
          firstName={form.firstName || userProfile?.firstName}
          lastName={form.lastName || userProfile?.lastName}
          avatarUrl={form.avatarUrl || userProfile?.avatarUrl}
          size={80}
        />
        <div>
          <h2 style={{ margin: 0 }}>{form.firstName} {form.lastName}</h2>
          <p className="auth-subtitle" style={{ margin: 0 }}>{authUser.email}</p>
        </div>
      </div>

      {message && <p className="message">{message}</p>}
      {error && <p className="message error">{error}</p>}

      <form onSubmit={handleSaveProfile} style={{ marginTop: 20 }}>
        <h3>Informations personnelles</h3>
        <label>Prénom<input value={form.firstName} onChange={set('firstName')} placeholder="Prénom" /></label>
        <label>Nom<input value={form.lastName} onChange={set('lastName')} placeholder="Nom" /></label>
        <label>Téléphone<input value={form.phone} onChange={set('phone')} placeholder="+261 34 00 000 00" type="tel" /></label>
        <label>URL photo de profil<input value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://..." /></label>
        <button type="submit" disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
      </form>

      <form onSubmit={handleChangePassword} style={{ marginTop: 24 }}>
        <h3>Changer le mot de passe</h3>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
        />
        <button type="submit" disabled={saving}>Changer le mot de passe</button>
      </form>

      <div className="navigation-buttons" style={{ marginTop: 24 }}>
        <button onClick={() => navigate('/guest/home')} className="button button-secondary">Retour</button>
        <button onClick={signOut} className="button" style={{ background: '#fee2e2', color: '#b91c1c' }}>Déconnexion</button>
      </div>
    </div>
  );
}
