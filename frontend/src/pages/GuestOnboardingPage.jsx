import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function GuestOnboardingPage() {
  const { code } = useParams();
  const { authUser, signInWithGoogle, joinEvent, guest } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState('login'); // login | form | loading
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', relation: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (guest) { navigate('/guest/home'); return; }
    if (authUser && step === 'login') {
      // Pre-fill name from Google
      const name = authUser.user_metadata?.full_name || '';
      const parts = name.split(' ');
      setForm((f) => ({
        ...f,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
      }));
      setStep('form');
    }
  }, [authUser, guest]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { setError('Prénom et nom sont requis.'); return; }
    setStep('loading');
    const result = await joinEvent({ code, ...form });
    if (!result.success) { setError(result.error); setStep('form'); return; }
    navigate('/guest/home');
  };

  if (step === 'login') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">💍</div>
          <h2>Vous êtes invité !</h2>
          <p className="auth-subtitle">Connectez-vous avec Google pour rejoindre le mariage et partager vos souvenirs</p>
          <button className="btn-google" onClick={() => signInWithGoogle(`/join/${code}`)}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} />
            Continuer avec Google
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return <div className="auth-page"><p>Connexion en cours...</p></div>;
  }

  return (
    <div className="auth-page">
      <div className="setup-card">
        <div className="auth-logo">👋</div>
        <h2>Quelques infos avant de commencer</h2>
        <p className="auth-subtitle">Ces informations aideront les mariés à vous identifier</p>
        <form onSubmit={handleJoin}>
          <label>Prénom *
            <input value={form.firstName} onChange={set('firstName')} placeholder="Prénom" required />
          </label>
          <label>Nom *
            <input value={form.lastName} onChange={set('lastName')} placeholder="Nom" required />
          </label>
          <label>Téléphone
            <input value={form.phone} onChange={set('phone')} placeholder="+261 34 00 000 00" type="tel" />
          </label>
          <label>Vous êtes...
            <select value={form.relation} onChange={set('relation')}>
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
