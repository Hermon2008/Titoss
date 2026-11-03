export type Theme = 'light' | 'dark';

export function getPreferredTheme(): Theme {
  try {
    const saved = localStorage.getItem('titoss-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* stockage indisponible */ }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try { localStorage.setItem('titoss-theme', theme); } catch { /* stockage indisponible */ }
  }
}
