export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://titoss.vercel.app').replace(/\/+$/, '');

export const TAB_PATHS = {
  gen: '/',
  lib: '/bibliotheque',
  mine: '/mes-palettes',
  fb: '/avis',
} as const;

export function tabFromPath(pathname: string): keyof typeof TAB_PATHS {
  if (pathname === TAB_PATHS.lib) return 'lib';
  if (pathname === TAB_PATHS.mine) return 'mine';
  if (pathname === TAB_PATHS.fb) return 'fb';
  return 'gen';
}
