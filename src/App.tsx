import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { COUNTS, METHODS, contrast, generate, hexToHsl, hslToRgb, toHex, type Method } from './color';
import Feedback from './Feedback';
import SeoContent from './SeoContent';
import { SITE_URL, TAB_PATHS, tabFromPath } from './site';
import { applyTheme, getPreferredTheme } from './theme';
import ThemeToggle from './ThemeToggle';
import { Check, Copy, Heart, Lock, LockOpen, Redo2, Save, Share2, Shuffle, Undo2, X } from 'lucide-react';
const Library = lazy(() => import('./Library'));

const DEFAULT_BASE = '#288CBD';
const INITIAL_PALETTE = ['#E7F5FC', '#8BC9E8', '#288CBD', '#194967', '#0B2639'];
type Saved = { id: number; name: string; colors: string[]; date: string };
type Tab = 'gen' | 'lib' | 'mine' | 'fb';

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(init);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) setV(JSON.parse(saved) as T);
    } catch { /* stockage indisponible */ }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) {
      try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* stockage indisponible */ }
    }
  }, [key, ready, v]);
  return [v, setV] as const;
}
const fromHash = (): string[] | null => {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(location.hash.slice(1)).get('p')?.split('-');
  return p && p.length >= 2 && p.length <= 8 && p.every((c) => /^[0-9a-f]{6}$/i.test(c)) ? p.map((c) => '#' + c.toUpperCase()) : null;
};
const textOn = (hex: string) => {
  return contrast(hex, '#000000') >= contrast(hex, '#FFFFFF') ? '#000000' : '#FFFFFF';
};
const rgbStr = (hex: string) => `rgb(${hslToRgb(hexToHsl(hex)!).join(', ')})`;
const hslStr = (hex: string) => {
  const c = hexToHsl(hex)!;
  return `hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`;
};
function Strip({ colors }: { colors: string[] }) {
  return <div className="strip" aria-hidden="true">{colors.map((color, index) => <span key={index} style={{ background: color }} />)}</div>;
}
const pageMeta: Record<Tab, { title: string; description: string; robots: string }> = {
  gen: {
    title: 'Titoss : générateur de palettes de couleurs',
    description: 'Crée gratuitement des palettes de couleurs harmonieuses avec Titoss : 5 méthodes, codes HEX, RGB et HSL, aperçu et vérification du contraste.',
    robots: 'index, follow',
  },
  lib: {
    title: 'Bibliothèque de palettes de couleurs | Titoss',
    description: 'Explore 100 palettes de couleurs prêtes à l’emploi, enregistre tes préférées et ouvre-les dans le générateur Titoss.',
    robots: 'index, follow',
  },
  mine: {
    title: 'Mes palettes | Titoss',
    description: 'Retrouve tes palettes enregistrées et tes favoris sur cet appareil.',
    robots: 'noindex, follow',
  },
  fb: {
    title: 'Avis sur Titoss',
    description: 'Partage ton avis sur le générateur de palettes de couleurs Titoss.',
    robots: 'noindex, follow',
  },
};

function Wheel({ colors }: { colors: string[] }) {
  return (
    <div className="wheel" role="img" aria-label="Position des couleurs sur le cercle chromatique">
      {colors.map((c, i) => {
        const { h, l } = hexToHsl(c)!;
        const a = ((h - 90) * Math.PI) / 180, r = 62 - (l / 100) * 22;
        return <b key={i} style={{ background: c, color: textOn(c), left: 80 + r * Math.cos(a) - 9, top: 80 + r * Math.sin(a) - 9 }}>{i + 1}</b>;
      })}
    </div>
  );
}

export default function App({ initialTab = 'gen' }: { initialTab?: Tab }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [tab, setTab] = useState<Tab>(initialTab);
  const [shared, setShared] = useState<string[] | null>(null);
  const methodFor = (n: number): Method => (n === 2 ? 'Complémentaire' : n === 3 ? 'Triadique' : 'Analogue');
  const [method, setMethod] = useState<Method>('Analogue');
  const [count, setCount] = useState(5);
  const [base, setBase] = useState(DEFAULT_BASE);
  const [history, setHistory] = useLocal<string[][]>('titoss-history', []);
  const [idx, setIdx] = useState(-1);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [favs, setFavs] = useLocal<string[]>('titoss-favs', []);
  const [saved, setSaved] = useLocal<Saved[]>('titoss-saved', []);
  const [toast, setToast] = useState('');
  const [intro, setIntro] = useState(false);
  const hashSynced = useRef(false);
  const hist = history.length && idx >= 0 && idx < history.length ? history : [shared ?? INITIAL_PALETTE];
  const cur = idx >= 0 && idx < hist.length ? idx : hist.length - 1;
  const palette = hist[cur];
  const key = palette.join('-');

  const navigate = (next: Tab) => {
    setTab(next);
    const path = TAB_PATHS[next];
    if (location.pathname !== path) window.history.pushState(null, '', path + location.hash);
  };
  useEffect(() => {
    const colors = fromHash();
    if (colors) {
      setShared(colors);
      setMethod(methodFor(colors.length));
      setCount(colors.length);
      setBase(colors[Math.floor((colors.length - 1) / 2)]);
    } else {
      setShared(generate('Analogue', hexToHsl(DEFAULT_BASE)!));
    }
    setIntro(!matchMedia('(prefers-reduced-motion: reduce)').matches);
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);
  useEffect(() => {
    const meta = pageMeta[tab];
    document.title = meta.title;
    const setMeta = (selector: string, value: string) => {
      const element = document.head.querySelector<HTMLMetaElement>(selector);
      if (element) element.content = value;
    };
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const pageUrl = SITE_URL + TAB_PATHS[tab];
    if (canonical) canonical.href = pageUrl;
    setMeta('meta[name="description"]', meta.description);
    setMeta('meta[name="robots"]', meta.robots);
    setMeta('meta[property="og:title"]', meta.title);
    setMeta('meta[property="og:description"]', meta.description);
    setMeta('meta[property="og:url"]', pageUrl);
    setMeta('meta[name="twitter:title"]', meta.title);
    setMeta('meta[name="twitter:description"]', meta.description);
    const structuredData = document.head.querySelector('script[type="application/ld+json"]');
    if (structuredData) {
      structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Titoss',
        url: pageUrl,
        description: meta.description,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Tout système disposant d’un navigateur web',
        inLanguage: 'fr',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      });
    }
  }, [tab, theme]);
  useEffect(() => {
    const syncTab = () => setTab(tabFromPath(location.pathname));
    window.addEventListener('popstate', syncTab);
    return () => window.removeEventListener('popstate', syncTab);
  }, []);
  useEffect(() => {
    if (!hashSynced.current) {
      hashSynced.current = true;
      return;
    }
    window.history.replaceState(null, '', '#p=' + palette.map((c) => c.slice(1)).join('-'));
  }, [key]);
  useEffect(() => { if (!intro) return; const t = setTimeout(() => setIntro(false), 2400); return () => clearTimeout(t); }, [intro]);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1600); };
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next, true);
  };
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); say('Copié : ' + t.split('\n')[0]); } catch { say('Copie impossible'); } };
  const show = (colors: string[]) => { setHistory([...hist.slice(0, cur + 1), colors].slice(-50)); setIdx(Math.min(cur + 1, 49)); };
  const push = (m: Method, b: string, n = count) => {
    const hsl = hexToHsl(b);
    if (hsl) show(generate(m, hsl, n).map((c, i) => (locked[i] && palette.length === n ? palette[i] : c)));
  };
  const reroll = () => {
    const hsl = hexToHsl(base);
    if (!hsl) return;
    const nb = toHex({ ...hsl, h: Math.random() * 360 });
    setBase(nb); push(method, nb);
  };
  const open = (colors: string[]) => { show(colors); setBase(colors[Math.floor((colors.length - 1) / 2)]); setCount(colors.length); setMethod(methodFor(colors.length)); setLocked([]); navigate('gen'); };
  const toggleLock = (i: number) => setLocked(palette.map((_, j) => (j === i ? !locked[j] : !!locked[j])));
  const undo = () => cur > 0 && setIdx(cur - 1);
  const redo = () => cur < hist.length - 1 && setIdx(cur + 1);
  const isFav = favs.includes(key);
  const toggleFav = (k: string) => setFavs(favs.includes(k) ? favs.filter((f) => f !== k) : [...favs, k]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || tab !== 'gen') return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.code === 'Space') { e.preventDefault(); reroll(); }
      else if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (!mod && /^[1-8]$/.test(e.key) && Number(e.key) <= palette.length) toggleLock(Number(e.key) - 1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  const cssVars = ':root {\n' + palette.map((c, i) => `  --couleur-${i + 1}: ${c};`).join('\n') + '\n}';
  const n = palette.length, last = palette[n - 1];
  const P = n <= 3
    ? { bg: palette[0], card: palette[0], acc: palette[1], txt: last, ttl: last }
    : { bg: palette[0], card: palette[1], acc: palette[Math.min(n - 2, Math.floor(n / 2))], txt: palette[n - 2], ttl: last };
  const pill = (label: string, fg: string, min: number) => {
    const ok = contrast(fg, P.bg) >= min;
    return <span className={'pill ' + (ok ? 'ok' : 'ko')} title={`Contraste ${contrast(fg, P.bg).toFixed(1)} sur 1 (minimum conseillé : ${min})`}><span style={{ color: fg, background: P.bg }}>Aa</span> {label} : {ok ? <><Check size={14} aria-hidden="true" /> facile à lire</> : <><X size={14} aria-hidden="true" /> difficile à lire</>}</span>;
  };
  const save = () => {
    setSaved([{ id: Date.now(), name: `Palette ${method.toLowerCase()}`, colors: palette, date: new Date().toLocaleDateString('fr-FR') }, ...saved]);
    say('Palette enregistrée sur cet appareil');
  };
  const rename = (s: Saved) => {
    const n = prompt('Nom de la palette', s.name);
    if (n) setSaved(saved.map((x) => (x.id === s.id ? { ...x, name: n } : x)));
  };
  const favPalettes = favs.map((k) => k.split('-')).filter((c) => c.length >= 2);

  return (
    <>
      {intro && (
        <div className="intro" role="dialog" aria-label="Animation d’entrée">
          <img src="/titoss-icone-application.svg" alt="" width={160} height={160} />

        </div>
      )}
      <div className="app-shell">
        <header>
          <img src={`/titoss-horizontal-fond-${theme === 'dark' ? 'sombre' : 'clair'}.svg`} alt="Titoss" width={154} height={48} />
          <nav aria-label="Navigation principale">
            {([['gen', 'Générateur'], ['lib', 'Bibliothèque'], ['mine', 'Mes palettes'], ['fb', 'Avis']] as const).map(([t, l]) => (
              <button key={t} className={tab === t ? 'on' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => navigate(t)}>{l}</button>
            ))}
          </nav>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>
        <SeoContent page={tab} />
        <div className={`page-content page-${tab}`}>
          {tab === 'gen' && (
        <main>
          <aside>
            <h3>Méthode d’harmonie</h3>
            {METHODS.map((m) => (
              <button key={m} className={m === method ? 'on' : ''} aria-pressed={m === method} onClick={() => {
                const { min, max, def } = COUNTS[m], n = min === max ? def : Math.min(max, Math.max(min, count));
                if (n !== palette.length) setLocked([]);
                setMethod(m); setCount(n); push(m, base, n);
              }}>{m}</button>
            ))}
            {COUNTS[method].min < COUNTS[method].max ? (
              <>
                <h3>Nombre de couleurs</h3>
                <div className="row">
                  <input type="range" aria-label="Nombre de couleurs" min={COUNTS[method].min} max={COUNTS[method].max} value={count}
                    onChange={(e) => { const v = Number(e.target.value); setCount(v); setLocked([]); push(method, base, v); }} />
                  <strong>{count}</strong>
                </div>
              </>
            ) : <p className="muted">Cette méthode utilise {COUNTS[method].def} couleurs.</p>}
            <h3>Couleur de départ</h3>
            <div className="row">
              <input type="color" aria-label="Sélecteur de couleur" value={base.toLowerCase()} onChange={(e) => { setBase(e.target.value.toUpperCase()); push(method, e.target.value); }} />
              <input aria-label="Code HEX de départ" value={base} onChange={(e) => { setBase(e.target.value); if (hexToHsl(e.target.value)) push(method, e.target.value); }} />
            </div>
            <p className="muted">Saisis n’importe quelle teinte : les harmonies se calculent à partir d’elle.</p>
            <h3>Cercle chromatique</h3>
            <Wheel colors={palette} />
          </aside>
          <section>
            <h2>Palette {method.toLowerCase()}</h2>
            <p className="muted">Verrouille les couleurs à garder (touches 1 à 8), puis relance.</p>
            <div className="bar">
              <button disabled={cur === 0} onClick={undo}><Undo2 size={16} aria-hidden="true" /> Précédent</button>
              <span className="muted">{cur + 1} / {hist.length}</span>
              <button disabled={cur >= hist.length - 1} onClick={redo}>Suivant <Redo2 size={16} aria-hidden="true" /></button>
              <button className="primary" onClick={reroll}><Shuffle size={16} aria-hidden="true" /> Relancer · Espace</button>
              <button onClick={save}><Save size={16} aria-hidden="true" /> Enregistrer</button>
              <button aria-pressed={isFav} onClick={() => toggleFav(key)}><Heart size={16} fill={isFav ? 'currentColor' : 'none'} aria-hidden="true" /> Favori</button>
              <button onClick={() => copy(location.href)}><Share2 size={16} aria-hidden="true" /> Partager le lien</button>
              <button onClick={() => copy(cssVars)}><Copy size={16} aria-hidden="true" /> Copier en variables CSS</button>
            </div>
            <div className="swatches">
              {palette.map((c, i) => (
                <div key={i} className="sw" style={{ background: c, color: textOn(c) }}>
                  <button className="code" aria-pressed={locked[i]} aria-label={locked[i] ? `Déverrouiller la couleur ${i + 1}` : `Verrouiller la couleur ${i + 1}`} onClick={() => toggleLock(i)}>
                    {i + 1} · {locked[i] ? <Lock size={14} aria-hidden="true" /> : <LockOpen size={14} aria-hidden="true" />} {locked[i] ? 'Verrouillée' : 'Verrouiller'}
                  </button>
                  <div>
                    {[c, rgbStr(c), hslStr(c)].map((t) => (
                      <button key={t} className="code" onClick={() => copy(t)} aria-label={`Copier ${t}`}>{t}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <h3>Aperçu en situation</h3>
            <div className="preview" style={{ background: P.bg, color: P.txt }}>
              <h4 style={{ color: P.ttl }}>Un titre pour votre page</h4>
              <p>Un court paragraphe de texte pour vérifier que les couleurs restent lisibles ensemble.</p>
              <button style={{ background: P.acc, color: textOn(P.acc), borderColor: P.acc }}>Bouton principal</button>
              <div className="card" style={{ background: P.card, color: textOn(P.card) }}>
                <strong>Titre de la carte</strong><br />Texte pour juger le contraste entre les couleurs.
              </div>
            </div>
            <h3>Lisibilité du texte</h3>
            <p className="muted">Pour chaque élément, on vérifie si sa couleur reste facile à lire sur le fond (couleur 1). Vert : c’est bon. Rouge : le contraste est trop faible, éclaircis ou assombris la couleur.</p>
            <div className="bar">{pill('Titre', P.ttl, 4.5)}{pill('Texte', P.txt, 4.5)}{pill('Bouton', P.acc, 3)}</div>
          </section>
        </main>
          )}

          {tab === 'lib' && (
            <Suspense fallback={<main className="wide"><p className="muted" role="status">Chargement de la bibliothèque…</p></main>}>
              <Library favs={favs} toggleFav={toggleFav} open={open} />
            </Suspense>
          )}

          {tab === 'mine' && (
        <main className="wide">
          <section>
            <h1>Mes palettes</h1>
            <p className="notice" role="note"><strong>Sauvegarde sur cet appareil.</strong> Tes palettes et tes favoris restent dans ce navigateur : vider ses données les efface, et tu ne les retrouveras pas sur un autre appareil. Pour garder une palette, partage son lien.</p>
            <h3>Enregistrées ({saved.length})</h3>
            <div className="grid">
              {saved.map((s) => (
                <article key={s.id} className="tile">
                  <Strip colors={s.colors} /><strong>{s.name}</strong><span className="muted">Enregistrée le {s.date}</span>
                  <div className="row saved-actions"><button onClick={() => open(s.colors)}>Ouvrir</button><button onClick={() => rename(s)}>Renommer</button>
                    <button onClick={() => setSaved(saved.filter((x) => x.id !== s.id))}>Supprimer</button></div>
                </article>
              ))}
              {!saved.length && <p className="muted">Aucune palette enregistrée pour l’instant.</p>}
            </div>
            <h3>Favoris ({favPalettes.length})</h3>
            <div className="grid">
              {favPalettes.map((c) => {
                const colors = c.map((x) => '#' + x);
                return <article key={c.join('')} className="tile"><Strip colors={colors} /><button onClick={() => open(colors)}>Ouvrir dans le générateur</button></article>;
              })}
            </div>
          </section>
        </main>
          )}

          {tab === 'fb' && <Feedback />}
        </div>
        <footer>
          <span>Titoss · Générateur de palettes</span>
          <nav aria-label="Liens de pied de page">
            <a href="/mentions-legales">Mentions légales</a>
            <a href="/confidentialite">Confidentialité</a>
            <button className="link" onClick={() => navigate('fb')}>Donner mon avis</button>
          </nav>
        </footer>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
