import { Heart } from 'lucide-react';
import library from './library.json';

type Props = {
  favs: string[];
  toggleFav: (key: string) => void;
  open: (colors: string[]) => void;
};

function Strip({ colors }: { colors: string[] }) {
  return <div className="strip" aria-hidden="true">{colors.map((color, index) => <span key={index} style={{ background: color }} />)}</div>;
}

export default function Library({ favs, toggleFav, open }: Props) {
  return (
    <main className="wide">
      <section>
        <h2>Bibliothèque</h2>
        <p className="muted">100 palettes prêtes à l’emploi : ouvre-les dans le générateur pour les modifier, ou garde-les en favoris sur cet appareil.</p>
        <div className="grid">
          {library.map((palette, index) => {
            const key = palette.colors.join('-').replace(/#/g, '');
            const isFavorite = favs.includes(key);
            return (
              <article key={`${index}-${palette.name}`} className="tile">
                <Strip colors={palette.colors} />
                <div className="row between"><strong>{palette.name}</strong>
                  <button aria-label={`Favori : ${palette.name}`} aria-pressed={isFavorite} onClick={() => toggleFav(key)}>
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                </div>
                <button onClick={() => open(palette.colors)}>Ouvrir dans le générateur</button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
