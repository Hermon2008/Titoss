import { useState, type FormEvent } from 'react';
import { Send, Star } from 'lucide-react';

// VITE_FEEDBACK_ENDPOINT peut remplacer l’endpoint Formspree configuré par défaut.
export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const endpoint = (import.meta.env.VITE_FEEDBACK_ENDPOINT as string | undefined) ?? 'https://formspree.io/f/mqppgwba';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return setState('error');
    (window as unknown as { plausible?: (n: string) => void }).plausible?.('Note ' + rating);
    if (!endpoint) {
      const to = (import.meta.env.VITE_FEEDBACK_EMAIL as string | undefined) ?? '';
      window.location.href = `mailto:${to}?subject=${encodeURIComponent('Avis sur Titoss')}&body=${encodeURIComponent(`Note : ${rating}/5\n\n${text}`)}`;
      return setState('done');
    }
    setState('sending');
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rating, message: text, email }),
      });
      setState(r.ok ? 'done' : 'error');
    } catch { setState('error'); }
  };

  if (state === 'done') return <main className="wide"><section><h2>Merci pour ton avis !</h2><p className="muted">Il m’aide à améliorer Titoss.</p></section></main>;
  return (
    <main className="wide">
      <section className="fb">
        <h2>Ton avis sur Titoss</h2>
        <p className="muted">Note l’application et dis-nous ce qui te plaît ou ce qui manque.</p>
        <form onSubmit={submit}>
          <div className="stars" role="radiogroup" aria-label="Note de l’application">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`Note ${n} sur 5`}
                style={{ color: n <= rating ? '#f5b301' : undefined }} onClick={() => setRating(n)}>
                <Star size={28} fill={n <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            ))}
          </div>
          <label>Ton commentaire<textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ce que j’aime, ce que je changerais…" /></label>
          <label>E-mail (facultatif, pour te répondre)<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {state === 'error' && <p role="alert" className="ko-msg">Choisis une note de 1 à 5, puis réessaie (vérifie aussi ta connexion).</p>}
          <button className="primary" type="submit" disabled={state === 'sending'}><Send size={16} aria-hidden="true" /> Envoyer mon avis</button>
        </form>
      </section>
    </main>
  );
}
