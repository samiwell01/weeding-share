import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function GuestOnboardingPage() {
  const { code } = useParams();
  const { authUser, signIn, signUp, joinEvent, guestEvents, setGuest, setEvent, userProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState('loading'); // loading | login | form
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', relation: '' });
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { setStep('login'); return; }

    // Already joined this event → go directly to home
    const existing = guestEvents.find((e) => e.event?.accessCode === code?.toUpperCase());
    if (existing) {
      setGuest(existing.guest);
      setEvent(existing.event);
      navigate('/guest/home');
      return;
    }

    // Pre-fill from existing profile
    setForm({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      phone: userProfile?.phone || '',
      relation: '',
    });
    setStep('form');
  }, [authUser, guestEvents]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);
    const result = authMode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);
    setAuthLoading(false);
    if (!result.success) { setError(result.error); return; }
    if (authMode === 'register') {
      setAuthMode('login');
      setPassword('');
      setError('Compte créé ! Connectez-vous maintenant.');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { setError('Prénom et nom sont requis.'); return; }
    setStep('loading');
    const result = await joinEvent({ code: code.toUpperCase(), ...form });
    if (!result.success) { setError(result.error); setStep('form'); return; }
    navigate('/guest/home');
  };

  if (step === 'loading') return <div className="auth-page"><p>Chargement...</p></div>;

  if (step === 'login') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">💍</div>
          <h2>Vous êtes invité !</h2>
          <p className="auth-subtitle">
            {authMode === 'login' ? 'Connectez-vous pour rejoindre le mariage' : 'Créez un compte pour rejoindre le mariage'}
          </p>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="message error">{error}</p>}
            <button type="submit" disabled={authLoading}>
              {authLoading ? '...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
          <button className="btn-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>
            {authMode === 'login' ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="setup-card">
        <div className="auth-logo">👋</div>
        <h2>Quelques infos avant de commencer</h2>
        <p className="auth-subtitle">Ces informations aideront les mariés à vous identifier</p>
        <form onSubmit={handleJoin}>
          <label>Prénom *<input value={form.firstName} onChange={setField('firstName')} placeholder="Prénom" required /></label>
          <label>Nom *<input value={form.lastName} onChange={setField('lastName')} placeholder="Nom" required /></label>
          <label>Téléphone<input value={form.phone} onChange={setField('phone')} placeholder="+261 34 00 000 00" type="tel" /></label>
          <label>Vous êtes...
            <select value={form.relation} onChange={setField('relation')}>
              <option value="">Sélectionner</option>
              <option value="famille">Famille</option>
              <option value="ami">Ami(e)</option>
              <option value="collègue">Collègue</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          {error && <p className="message error">{error}</p>}
          <button type="submit">Rejoindre le mariage 🎉</button>
        </form>
      </div>
    </div>
  );
}
