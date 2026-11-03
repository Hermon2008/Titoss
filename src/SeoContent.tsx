type SeoContentProps = { page: 'gen' | 'lib' | 'mine' | 'fb' };

const methods = [
  ['Analogue', 'Une palette analogue associe des couleurs voisines sur le cercle chromatique pour créer un ensemble harmonieux.'],
  ['Complémentaire', 'Les couleurs complémentaires se trouvent en face l’une de l’autre sur le cercle chromatique et créent un contraste marqué.'],
  ['Triadique', 'Une harmonie triadique répartit trois couleurs à intervalles réguliers sur le cercle chromatique.'],
  ['Monochromatique', 'Une palette monochromatique décline une même teinte en plusieurs niveaux de clarté et de saturation.'],
  ['Aléatoire', 'La méthode aléatoire propose des couleurs variées pour explorer de nouvelles associations.'],
];

export default function SeoContent({ page }: SeoContentProps) {
  if (page === 'mine' || page === 'fb') return null;

  return (
    <section className="seo-content" aria-labelledby="seo-title">
      <h1 id="seo-title">{page === 'lib' ? 'Bibliothèque de palettes de couleurs' : 'Générateur de palettes de couleurs'}</h1>
      <p>{page === 'lib'
        ? 'Explore 100 palettes de couleurs prêtes à l’emploi, enregistre tes préférées et ouvre-les dans le générateur pour les adapter à ton projet.'
        : 'Crée gratuitement une palette de couleurs pour ton site web ou ton projet graphique. Choisis une harmonie, copie les codes HEX, RGB ou HSL et vérifie le contraste WCAG.'}</p>
      <details>
        <summary>Comprendre les harmonies de couleurs</summary>
        <ul className="method-list">
          {methods.map(([name, description]) => <li key={name}><strong>{name} :</strong> {description}</li>)}
        </ul>
      </details>
      <details>
        <summary>Questions fréquentes</summary>
        <h2>Comment créer une palette de couleurs pour un site web ?</h2>
        <p>Choisis une couleur de départ, sélectionne une méthode d’harmonie et ajuste les couleurs jusqu’à obtenir une palette lisible et adaptée à ton interface.</p>
        <h2>Quels formats de couleur peut-on copier ?</h2>
        <p>Chaque couleur est disponible en HEX, RGB et HSL. Tu peux aussi copier la palette complète sous forme de variables CSS.</p>
        <h2>Mes palettes sont-elles enregistrées en ligne ?</h2>
        <p>Non. Les palettes enregistrées et les favoris restent dans le stockage local de ton navigateur, sans compte utilisateur.</p>
      </details>
    </section>
  );
}
