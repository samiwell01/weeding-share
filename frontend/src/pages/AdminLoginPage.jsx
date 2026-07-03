import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function AdminLoginPage() {
  const { authUser, signIn, signUp } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) navigate('/events');
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    if (mode === 'register') {
      setMode('login');
      setPassword('');
      setError('Compte créé ! Connectez-vous maintenant.');
      return;
    }
    navigate('/events');
  };

  return (
    <div className="page-main-auth">
      <div className="auth-card">
        <div className="auth-logo">T</div>
        <h1>Tsiarhoom</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Connectez-vous à votre espace' : 'Créer un nouveau compte'}
        </p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="message error">{error}</p>}
          <button type="submit" className="btn-primary btn-primary-full" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </button>
        </form>
        <button type="button" className="btn-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  );
}
