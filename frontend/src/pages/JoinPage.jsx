import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

export default function JoinPage() {
  const navigate = useNavigate();
  const { code, setCode, firstName, setFirstName, lastName, setLastName, joinEvent, message, setMessage } = useApp();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await joinEvent({ code, firstName, lastName });
    if (result.success) {
      setMessage('Bienvenue ' + result.guest.firstName + ' 👋');
      navigate('/guest/home');
    }
  };

  return (
    <div className="card">
      <h2>Rejoindre un événement</h2>
      <form onSubmit={handleSubmit}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code du mariage" />
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" />
        <button type="submit">Entrer</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}
