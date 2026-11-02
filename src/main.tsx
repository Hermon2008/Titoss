import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
const d = import.meta.env.VITE_PLAUSIBLE_DOMAIN; // mesure sans cookie (Plausible), activée si défini
if (d) {
  const s = document.createElement('script');
  s.defer = true; s.dataset.domain = d; s.src = 'https://plausible.io/js/script.js';
  document.head.append(s);
}
createRoot(document.getElementById('root')!).render(<App />);
