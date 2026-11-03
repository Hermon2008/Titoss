import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import LegalPage from './LegalPages';
import { tabFromPath } from './site';
import './style.css';
const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
if (websiteId) {
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://cloud.umami.is/script.js';
  s.dataset.websiteId = websiteId;
  document.head.append(s);
}
const path = window.location.pathname;
const page = path === '/mentions-legales'
  ? <LegalPage page="mentions-legales" />
  : path === '/confidentialite'
    ? <LegalPage page="confidentialite" />
    : <App initialTab={tabFromPath(path)} />;
const root = document.getElementById('root')!;
if (root.hasChildNodes()) hydrateRoot(root, page);
else createRoot(root).render(page);
