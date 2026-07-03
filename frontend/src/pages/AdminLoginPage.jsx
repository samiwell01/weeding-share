import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function AdminLoginPage() {
  const { authUser, signInWithGoogle, loadAdminWedding } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) return;
    loadAdminWedding(authUser.id).then((event) => {
      navigate(event ? '/admin/dashboard' : '/admin/setup');
    });
  }, [authUser]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💍</div>
        <h1>Wedding Share</h1>
        <p className="auth-subtitle">Espace mariés — connectez-vous pour gérer votre mariage</p>
        <button className="btn-google" onClick={() => signInWithGoogle('/admin')}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} />
          Continuer avec Google
        </button>
      </div>
    </div>
  );
}
