import { useEffect, useState, type ReactNode } from 'react';
import { SITE_URL } from './site';
import ThemeToggle from './ThemeToggle';
import { applyTheme, getPreferredTheme, type Theme } from './theme';

export type LegalPageName = 'mentions-legales' | 'confidentialite';

function LegalLayout({ theme, onToggle, children }: { theme: Theme; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="app-shell">
      <header>
        <a className="legal-home" href="/" aria-label="Retour au générateur Titoss">
          <img src={`/titoss-horizontal-fond-${theme === 'dark' ? 'sombre' : 'clair'}.svg`} alt="Titoss" width={154} height={48} />
        </a>
        <ThemeToggle theme={theme} onToggle={onToggle} />
      </header>
      {children}
      <footer>
        <span>Titoss · Générateur de palettes</span>
        <nav aria-label="Liens de pied de page">
          <a href="/mentions-legales">Mentions légales</a>
          <a href="/confidentialite">Confidentialité</a>
          <a href="/">Générateur</a>
        </nav>
      </footer>
    </div>
  );
}

export default function LegalPage({ page }: { page: LegalPageName }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next, true);
  };

  if (page === 'mentions-legales') {
    return (
      <LegalLayout theme={theme} onToggle={toggleTheme}>
      <main className="legal-page">
        <h1>Mentions légales</h1>
        <section>
          <h2>Éditeur du site</h2>
          <p>Le site Titoss (<span>{SITE_URL}</span>) est édité à titre personnel et non professionnel par une personne physique qui a choisi de rester anonyme. Conformément à l'article 6, III, 2° de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, son identité a été communiquée à l'hébergeur du site.</p>
        </section>
        <section>
          <h2>Directeur de la publication</h2>
          <p>Le directeur de la publication est l'éditeur du site.</p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>Pour toute question sur le site ou sur ses données : HMDev08@outlook.fr</p>
        </section>
        <section>
          <h2>Hébergeur</h2>
          <p>Le site est hébergé par Vercel Inc., société de droit américain, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Site web : https://vercel.com.</p>
        </section>
        <section>
          <h2>Crédits</h2>
          <p>Les icônes du site proviennent de la bibliothèque Lucide (https://lucide.dev), distribuée sous licence ISC.</p>
        </section>
        <section>
          <h2>Données personnelles</h2>
          <p><a href="/confidentialite">Le traitement des données est décrit dans la politique de confidentialité</a>.</p>
        </section>
        <p className="legal-updated"><em>Dernière mise à jour : 3 novembre 2026.</em></p>
      </main>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout theme={theme} onToggle={toggleTheme}>
    <main className="legal-page">
      <h1>Politique de confidentialité</h1>
      <section>
        <h2>En bref</h2>
        <p>Titoss n'a pas de compte utilisateur, n'affiche aucune publicité et ne vend aucune donnée. Les seules données que le site peut recevoir sont celles que tu envoies toi-même via le formulaire d'avis. Tes palettes et tes favoris restent dans ton navigateur.</p>
      </section>
      <section>
        <h2>Responsable du traitement</h2>
        <p>L'éditeur du site, joignable à HMDev08@outlook.fr.</p>
      </section>
      <section>
        <h2>Les données et leur usage</h2>
        <h3>1. Le formulaire d'avis</h3>
        <ul>
          <li>Données : la note de 1 à 5, ton commentaire et, si tu veux une réponse, ton adresse e-mail (facultative). Le prestataire d'envoi peut aussi enregistrer des informations techniques sur la soumission, comme le pays d'origine.</li>
          <li>Pourquoi : lire les avis pour améliorer Titoss et, si tu laisses ton e-mail, te répondre.</li>
          <li>Base légale : ton consentement, puisque tu envoies le formulaire volontairement.</li>
          <li>Qui les reçoit : l'éditeur, par l'intermédiaire de Formspree, Inc., prestataire de gestion de formulaires situé aux États-Unis. Durée de conservation : les avis sont conservés 30 jours, puis supprimés. Formspree conserve les soumissions 30 jours.</li>
        </ul>
        <h3>2. Les données techniques de l'hébergement</h3>
        <p>Comme pour tout site web, l'hébergeur Vercel peut enregistrer temporairement des informations techniques (adresse IP, navigateur, date et heure de la visite) pour assurer la sécurité et le bon fonctionnement du site. Voir la politique de Vercel : <a href="https://vercel.com/legal/privacy-policy">https://vercel.com/legal/privacy-policy</a></p>
        <h3>3. Le stockage dans ton navigateur</h3>
        <p>Titoss enregistre dans ton navigateur (stockage local) tes palettes, tes favoris, ton historique et ton choix de thème clair ou sombre. Ces informations ne sont envoyées à aucun serveur et ne servent qu'à faire fonctionner l'application à ta demande. Tu peux les supprimer depuis « Mes palettes » ou en effaçant les données du site dans ton navigateur. Elles ne sont pas disponibles sur un autre appareil.</p>
        <h3>4. Mesure d'audience</h3>
        <p>Titoss utilise Umami pour compter les visites, sans cookie et sans profil individuel. Ces statistiques servent uniquement à savoir si l'application est utilisée et à l'améliorer.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>Titoss ne dépose pas de cookie publicitaire ni de cookie de suivi.</p>
      </section>
      <section>
        <h2>Tes droits</h2>
        <p>Tu peux demander l'accès à tes données, leur rectification, leur effacement, la limitation ou l'opposition au traitement, ainsi que leur portabilité, en écrivant à HMDev08@outlook.fr. Pour un avis envoyé sans e-mail, indique la date approximative et le contenu pour que je puisse le retrouver. Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL (<a href="https://www.cnil.fr">https://www.cnil.fr</a>).</p>
      </section>
      <section>
        <h2>Évolutions</h2>
        <p>Cette politique peut évoluer, notamment si Titoss ajoute de nouvelles fonctions. La date de mise à jour figure ci-dessous.</p>
      </section>
      <p className="legal-updated"><em>Dernière mise à jour : 3 novembre 2026.</em></p>
    </main>
    </LegalLayout>
  );
}
