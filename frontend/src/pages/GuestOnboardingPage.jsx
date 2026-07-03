import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';
import Icon from '../components/Icon';

export default function GuestOnboardingPage() {
  const { code } = useParams();
  const { authUser, signIn, signUp, joinEvent, guestEvents, setGuest, setEvent, userProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState('loading');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', relation: '' });
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!authUser) { setStep('login'); return; }

    const existing = guestEvents.find((e) => e.event?.accessCode === code?.toUpperCase());
    if (existing) {
      setGuest(existing.guest);
      setEvent(existing.event);
      navigate(`/events/${existing.event.id}`);
      return;
    }

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
    navigate('/events');
  };

  if (step === 'loading') {
    return (
      <div className="page-main-auth">
        <p className="welcome-subtitle">Chargement...</p>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="page-main-auth">
        <div className="auth-card">
          <div className="auth-logo"><Icon name="favorite" size={28} fill /></div>
          <h1 style={{ fontSize: 24 }}>Vous êtes invité !</h1>
          <p className="auth-subtitle">
            Code : <strong>{code?.toUpperCase()}</strong>
          </p>
          <p className="auth-subtitle">
            {authMode === 'login' ? 'Connectez-vous pour rejoindre l\'événement' : 'Créez un compte pour rejoindre l\'événement'}
          </p>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="message error">{error}</p>}
            <button type="submit" className="btn-primary btn-primary-full" disabled={authLoading}>
              {authLoading ? '...' : authMode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>
          <button type="button" className="btn-switch" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}>
            {authMode === 'login' ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-main-auth">
      <div className="auth-card" style={{ textAlign: 'left', maxWidth: 440 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="auth-logo"><Icon name="waving_hand" size={28} /></div>
          <h1 style={{ fontSize: 24, textAlign: 'center' }}>Quelques infos</h1>
          <p className="auth-subtitle" style={{ textAlign: 'center' }}>Ces informations aideront les organisateurs à vous identifier</p>
        </div>
        <form onSubmit={handleJoin}>
          <label className="form-label">Prénom *
            <input className="form-input" value={form.firstName} onChange={setField('firstName')} placeholder="Prénom" required />
          </label>
          <label className="form-label">Nom *
            <input className="form-input" value={form.lastName} onChange={setField('lastName')} placeholder="Nom" required />
          </label>
          <label className="form-label">Téléphone
            <input className="form-input" value={form.phone} onChange={setField('phone')} placeholder="+261 34 00 000 00" type="tel" />
          </label>
          <label className="form-label">Vous êtes...
            <select className="form-input" value={form.relation} onChange={setField('relation')}>
              <option value="">Sélectionner</option>
              <option value="famille">Famille</option>
              <option value="ami">Ami(e)</option>
              <option value="collègue">Collègue</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          {error && <p className="message error">{error}</p>}
          <button type="submit" className="btn-primary btn-primary-full">Rejoindre l'événement</button>
        </form>
      </div>
    </div>
  );
}
