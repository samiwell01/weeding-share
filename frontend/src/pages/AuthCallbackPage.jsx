import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/';
      navigate(session ? next : '/', { replace: true });
    });
  }, []);

  return <div className="auth-page"><p>Connexion en cours...</p></div>;
}
