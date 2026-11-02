// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { COUNTS, METHODS, contrast, generate, hexToHsl } from './color';
import library from './library.json';

window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
beforeEach(() => { localStorage.clear(); location.hash = ''; });
afterEach(cleanup);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const locks = () => screen.queryAllByLabelText(/Verrouiller la couleur/);
const bgs = () => Array.from(document.querySelectorAll<HTMLElement>('.sw')).map((e) => e.style.background);

describe('moteur de couleurs', () => {
  it('donne le bon nombre de couleurs HEX valides, pour chaque méthode et chaque taille', () => {
    for (const m of METHODS) for (let n = COUNTS[m].min; n <= COUNTS[m].max; n++) for (let k = 0; k < 15; k++) {
      const p = generate(m, hexToHsl('#288CBD')!, n);
      expect(p).toHaveLength(n);
      p.forEach((c) => expect(c).toMatch(/^#[0-9A-F]{6}$/));
    }
  });
  it('fonctionne avec des couleurs extrêmes', () => {
    for (const hex of ['#000000', '#FFFFFF', '#FF0000', '#808080']) for (const m of METHODS)
      generate(m, hexToHsl(hex)!).forEach((c) => expect(c).toMatch(/^#[0-9A-F]{6}$/));
  });
  it('calcule le contraste et refuse un code invalide', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(hexToHsl('zzz')).toBeNull();
  });
  it('a une bibliothèque de 100 palettes de 5 couleurs valides', () => {
    expect(library).toHaveLength(100);
    library.forEach((p) => { expect(p.colors).toHaveLength(5); p.colors.forEach((c) => expect(c).toMatch(/^#[0-9A-F]{6}$/)); });
  });
});

describe('application', () => {
  it('affiche 5 couleurs, sans bouton « Passer » ni section « Bientôt »', () => {
    render(<App />);
    expect(locks()).toHaveLength(5);
    expect(screen.queryByText('Passer')).toBeNull();
    expect(screen.queryByText(/Bientôt/)).toBeNull();
    expect(document.querySelectorAll('.pill')).toHaveLength(3);
  });
  it('bascule le thème avec l’interrupteur', () => {
    render(<App />);
    const sw = screen.getByRole('switch');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
  it('adapte le nombre de couleurs à la méthode et au curseur', () => {
    render(<App />);
    click('Triadique'); expect(locks()).toHaveLength(3); expect(screen.queryByLabelText('Nombre de couleurs')).toBeNull();
    click('Complémentaire'); expect(locks()).toHaveLength(2);
    click('Aléatoire'); fireEvent.change(screen.getByLabelText('Nombre de couleurs'), { target: { value: '8' } });
    expect(locks()).toHaveLength(8);
    click('Analogue'); expect(locks()).toHaveLength(7);
  });
  it('relance en gardant la couleur verrouillée, et revient en arrière', () => {
    render(<App />);
    fireEvent.click(locks()[0]);
    expect(locks()[0].getAttribute('aria-pressed')).toBe('true');
    const before = bgs()[0];
    click(/Relancer/);
    expect(bgs()[0]).toBe(before);
    screen.getByText('2 / 2');
    click(/Précédent/);
    screen.getByText('1 / 2');
  });
  it('enregistre une palette et un favori sur l’appareil', () => {
    render(<App />);
    click(/Enregistrer/); click(/Favori/); click('Mes palettes');
    screen.getByText('Enregistrées (1)'); screen.getByText('Favoris (1)');
  });
  it('ouvre une palette de la bibliothèque sans clé en double', () => {
    const err = vi.spyOn(console, 'error');
    render(<App />);
    click('Bibliothèque');
    const open = screen.getAllByRole('button', { name: 'Ouvrir dans le générateur' });
    expect(open).toHaveLength(100);
    fireEvent.click(open[0]);
    expect(locks()).toHaveLength(5);
    expect(err.mock.calls.some((c) => String(c[0]).includes('same key'))).toBe(false);
  });
  it('relit une palette partagée dans le lien', () => {
    location.hash = '#p=FFFFFF-AAAAAA-555555';
    render(<App />);
    expect(locks()).toHaveLength(3);
  });
  it('envoie une note et un commentaire', async () => {
    vi.stubEnv('VITE_FEEDBACK_ENDPOINT', 'https://exemple.test/avis');
    const f = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal('fetch', f);
    render(<App />);
    click('Avis');
    fireEvent.click(screen.getByLabelText('Note 4 sur 5'));
    fireEvent.change(screen.getByLabelText(/Ton commentaire/), { target: { value: 'Très utile' } });
    click(/Envoyer mon avis/);
    await waitFor(() => screen.getByText('Merci pour ton avis !'));
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ rating: 4, message: 'Très utile' });
  });
  it('refuse un avis sans note', async () => {
    render(<App />); click('Avis'); click(/Envoyer mon avis/);
    await waitFor(() => screen.getByRole('alert'));
  });
});
