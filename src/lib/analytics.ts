// Événements Google Analytics 4 (navigateur). Ne fait rien tant que le visiteur n'a pas accepté
// la mesure d'audience : tarteaucitron ne définit window.gtag qu'après consentement.
// Aucune donnée personnelle (nom, e-mail…) n'est envoyée.
type Params = Record<string, string | number | boolean>;

export function track(event: string, params: Params = {}) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', event, params);
}
