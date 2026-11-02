import { useEffect, useState } from 'react';
import { COUNTS, METHODS, contrast, generate, hexToHsl, hslToRgb, toHex, type Method } from './color';
import library from './library.json';
import Feedback from './Feedback';
import { Check, Copy, Heart, Lock, LockOpen, Moon, Redo2, Save, Share2, Shuffle, Sun, Undo2, X } from 'lucide-react';

const DEFAULT_BASE = '#288CBD';
type Saved = { id: number; name: string; colors: string[]; date: string };
type Tab = 'gen' | 'lib' | 'mine' | 'fb';

function useLocal<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* stockage indisponible */ } }, [key, v]);
  return [v, setV] as const;
}
const fromHash = (): string[] | null => {
  const p = new URLSearchParams(location.hash.slice(1)).get('p')?.split('-');
  return p && p.length >= 2 && p.length <= 8 && p.every((c) => /^[0-9a-f]{6}$/i.test(c)) ? p.map((c) => '#' + c.toUpperCase()) : null;
};
const textOn = (hex: string) => {
  const [r, g, b] = hslToRgb(hexToHsl(hex)!);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111' : '#fff';
};
const rgbStr = (hex: string) => `rgb(${hslToRgb(hexToHsl(hex)!).join(', ')})`;
const hslStr = (hex: string) => {
  const c = hexToHsl(hex)!;
  return `hsl(${Math.round(c.h)}, ${Math.round(c.s)}%, ${Math.round(c.l)}%)`;
};
const track = (name: string) => (window as unknown as { plausible?: (n: string) => void }).plausible?.(name);

function Strip({ colors }: { colors: string[] }) {
  return <div className="strip" aria-hidden="true">{colors.map((c, i) => <span key={i} style={{ background: c }} />)}</div>;
}

function Wheel({ colors }: { colors: string[] }) {
  return (
    <div className="wheel" role="img" aria-label="Position des couleurs sur le cercle chromatique">
      {colors.map((c, i) => {
        const { h, l } = hexToHsl(c)!;
        const a = ((h - 90) * Math.PI) / 180, r = 62 - (l / 100) * 22;
        return <b key={i} style={{ background: c, left: 80 + r * Math.cos(a) - 9, top: 80 + r * Math.sin(a) - 9 }}>{i + 1}</b>;
      })}
    </div>
  );
}

export default function App() {
  const shared = fromHash();
  const [theme, setTheme] = useState<'light' | 'dark'>(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const [tab, setTab] = useState<Tab>('gen');
  const methodFor = (n: number): Method => (n === 2 ? 'Complémentaire' : n === 3 ? 'Triadique' : 'Analogue');
  const [method, setMethod] = useState<Method>(shared ? methodFor(shared.length) : 'Analogue');
  const [count, setCount] = useState(shared ? shared.length : 5);
  const [base, setBase] = useState(shared ? shared[Math.floor((shared.length - 1) / 2)] : DEFAULT_BASE);
  const [history, setHistory] = useLocal<string[][]>('titoss-history', []);
  const [idx, setIdx] = useState(-1);
  const [locked, setLocked] = useState<boolean[]>([]);
  const [favs, setFavs] = useLocal<string[]>('titoss-favs', []);
  const [saved, setSaved] = useLocal<Saved[]>('titoss-saved', []);
  const [toast, setToast] = useState('');
  const [intro, setIntro] = useState(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hist = history.length && idx >= 0 && idx < history.length ? history : [shared ?? generate('Analogue', hexToHsl(DEFAULT_BASE)!)];
  const cur = idx >= 0 && idx < hist.length ? idx : hist.length - 1;
  const palette = hist[cur];
  const key = palette.join('-');

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { window.history.replaceState(null, '', '#p=' + palette.map((c) => c.slice(1)).join('-')); }, [key]);
  useEffect(() => { if (!intro) return; const t = setTimeout(() => setIntro(false), 2400); return () => clearTimeout(t); }, [intro]);

  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1600); };
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
  const open = (colors: string[]) => { show(colors); setBase(colors[Math.floor((colors.length - 1) / 2)]); setCount(colors.length); setMethod(methodFor(colors.length)); setLocked([]); setTab('gen'); };
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
          <img src={`/titoss-horizontal-fond-${theme === 'dark' ? 'sombre' : 'clair'}.svg`} alt="Titoss" height={48} />
          <nav aria-label="Navigation principale">
            {([['gen', 'Générateur'], ['lib', 'Bibliothèque'], ['mine', 'Mes palettes'], ['fb', 'Avis']] as const).map(([t, l]) => (
              <button key={t} className={tab === t ? 'on' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{l}</button>
            ))}
          </nav>
          <button role="switch" aria-checked={theme === 'dark'} aria-label="Mode sombre" className="switch" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun size={14} aria-hidden="true" /><span className="knob" /><Moon size={14} aria-hidden="true" />
          </button>
        </header>

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
                  <button className="code" aria-pressed={locked[i]} aria-label={`Verrouiller la couleur ${i + 1}`} onClick={() => toggleLock(i)}>
                    {i + 1} · {locked[i] ? <Lock size={14} aria-hidden="true" /> : <LockOpen size={14} aria-hidden="true" />} {locked[i] ? 'Verrouiller' : 'Déverrouiller'}
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
        <main className="wide">
          <section>
            <h2>Bibliothèque</h2>
            <p className="muted">100 palettes prêtes à l’emploi : ouvre-les dans le générateur pour les modifier, ou garde-les en favoris sur cet appareil.</p>
            <div className="grid">
              {library.map((p, i) => (
                <article key={`${i}-${p.name}`} className="tile">
                  <Strip colors={p.colors} />
                  <div className="row between"><strong>{p.name}</strong>
                    <button aria-label={`Favori : ${p.name}`} aria-pressed={favs.includes(p.colors.join('-').replace(/#/g, ''))} onClick={() => toggleFav(p.colors.join('-').replace(/#/g, ''))}>
                      <Heart size={16} fill={favs.includes(p.colors.join('-').replace(/#/g, '')) ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button></div>
                  <button onClick={() => open(p.colors)}>Ouvrir dans le générateur</button>
                </article>
              ))}
            </div>
          </section>
        </main>
          )}

          {tab === 'mine' && (
        <main className="wide">
          <section>
            <h2>Mes palettes</h2>
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
        <footer><span>Titoss · Générateur de palettes</span><button className="link" onClick={() => setTab('fb')}>Donner mon avis</button></footer>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
