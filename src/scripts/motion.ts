import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

declare global {
  interface Window {
    moyoLenis?: Lenis;
  }
}

// Le décalage du header sticky vient du scroll-margin-top des sections (global.css), que Lenis respecte.

// --- Smooth scroll (Lenis). Respecte prefers-reduced-motion nativement. ---
const lenis = new Lenis({
  autoRaf: true,
  anchors: true,
  // Le panneau tarteaucitron garde son défilement natif.
  prevent: (node) => node.id === 'tarteaucitronRoot' || node.id === 'tarteaucitron',
});
window.moyoLenis = lenis;

// Liens « /#ancre » (header, footer) quand on est déjà sur l'accueil.
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/#"]');
  if (!a || location.pathname !== '/') return;
  const target = document.querySelector(a.hash);
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target as HTMLElement);
  history.pushState(null, '', a.hash);
});

// --- Effets d'apparition au défilement ---
// [data-reveal] : l'élément apparaît ; [data-reveal-stagger] : ses enfants apparaissent en cascade.
document.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((group) => {
  const variant = group.dataset.revealStagger || '';
  Array.from(group.children).forEach((child, i) => {
    const el = child as HTMLElement;
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', variant);
    el.style.setProperty('--reveal-i', String(i));
  });
});

const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (!('IntersectionObserver' in window)) {
  items.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}
