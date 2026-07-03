import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from '../components/Icon';

function Avatar({ firstName, lastName, avatarUrl, size = 128 }) {
  const initials = `${(firstName || '?')[0]}${(lastName || '')[0] || ''}`.toUpperCase();
  if (avatarUrl) {
    return <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
  }
  return <div className="profile-avatar-large-initials">{initials}</div>;
}

export default function UserProfilePage() {
  const { authUser, userProfile, updateUserProfile, updatePassword, signOut, loadUserProfile } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', avatarUrl: '' });
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
      return;
    }
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
  }, [authUser, userProfile, loadUserProfile, navigate]);

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

  const memberSince = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="page-main-narrow">
      <section className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-large">
            <Avatar
              firstName={form.firstName || userProfile?.firstName}
              lastName={form.lastName || userProfile?.lastName}
              avatarUrl={form.avatarUrl || userProfile?.avatarUrl}
            />
          </div>
        </div>
        <h2 className="profile-name">{form.firstName || 'Utilisateur'} {form.lastName}</h2>
        {memberSince && <p className="profile-since">Membre depuis {memberSince}</p>}
      </section>

      {message && <p className="message">{message}</p>}
      {error && <p className="message error">{error}</p>}

      <form onSubmit={handleSaveProfile}>
        <div className="form-card">
          <h3 className="form-card-title">Informations personnelles</h3>

          <div className="form-group">
            <label className="font-label-sm" htmlFor="firstName" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Prénom</label>
            <div className="form-input-group">
              <Icon name="person" />
              <input id="firstName" value={form.firstName} onChange={set('firstName')} placeholder="Votre prénom" />
            </div>
          </div>

          <div className="form-group">
            <label className="font-label-sm" htmlFor="lastName" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Nom</label>
            <div className="form-input-group">
              <Icon name="person" />
              <input id="lastName" value={form.lastName} onChange={set('lastName')} placeholder="Votre nom" />
            </div>
          </div>

          <div className="form-group">
            <label className="font-label-sm" htmlFor="email" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Email</label>
            <div className="form-input-group">
              <Icon name="mail" />
              <input id="email" value={authUser.email || ''} readOnly placeholder="Email" />
            </div>
          </div>

          <div className="form-group">
            <label className="font-label-sm" htmlFor="phone" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>Téléphone</label>
            <div className="form-input-group">
              <Icon name="call" />
              <input id="phone" value={form.phone} onChange={set('phone')} placeholder="+261 34 00 000 00" type="tel" />
            </div>
          </div>

          <div className="form-group">
            <label className="font-label-sm" htmlFor="avatarUrl" style={{ display: 'block', marginBottom: 4, color: 'var(--on-surface-variant)' }}>URL photo de profil</label>
            <div className="form-input-group">
              <Icon name="photo_camera" />
              <input id="avatarUrl" value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-card-title">Préférences</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon name="notifications" style={{ color: 'var(--on-surface-variant)' }} />
              <span>Notifications événement</span>
            </div>
            <label style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                width: 44, height: 24, borderRadius: 9999, background: notifications ? 'var(--primary-container)' : 'var(--surface-variant)',
                position: 'relative', transition: 'background 0.2s', display: 'block',
              }}>
                <span style={{
                  position: 'absolute', top: 2, left: notifications ? 22 : 2, width: 20, height: 20,
                  borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                }} />
              </span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8, paddingBottom: 48 }}>
          <button type="submit" className="btn-primary btn-primary-full btn-pill" disabled={saving}>
            {saving ? '...' : 'Enregistrer'}
          </button>
        </div>
      </form>

      <form onSubmit={handleChangePassword}>
        <div className="form-card">
          <h3 className="form-card-title">Mot de passe</h3>
          <input
            type="password"
            className="form-input"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
          />
          <button type="submit" className="btn-outline btn-primary-full" style={{ marginTop: 12 }} disabled={saving}>
            Changer le mot de passe
          </button>
        </div>
      </form>

      <button type="button" className="btn-danger btn-pill" onClick={signOut} style={{ marginBottom: 48 }}>
        <Icon name="logout" size={20} /> Déconnexion
      </button>
    </div>
  );
}
