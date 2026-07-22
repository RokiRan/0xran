/* =========================================================================
   app.ts · Client behaviors — ClientRouter-aware (astro:page-load)
   - theme toggle with circular view-transition reveal
   - sticky header border on scroll
   - mobile menu
   - IntersectionObserver fade-up / fade-in
   - blog tag filter
   ========================================================================= */

const THEME_KEY = 'camp-theme';

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
  syncToggleLabels(theme);
}

function syncToggleLabels(theme: 'light' | 'dark') {
  // Icons are pure CSS via :root[data-theme]; only aria-labels need syncing
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    const label = theme === 'dark' ? btn.dataset.labelLight : btn.dataset.labelDark;
    if (label) btn.setAttribute('aria-label', label);
  });
}

function toggleTheme(btn: HTMLElement) {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  const rect = btn.getBoundingClientRect();
  document.documentElement.style.setProperty('--toggle-x', `${rect.left + rect.width / 2}px`);
  document.documentElement.style.setProperty('--toggle-y', `${rect.top + rect.height / 2}px`);

  if (typeof document.startViewTransition === 'function') {
    document.documentElement.classList.add('theme-reveal');
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.finished.finally(() => document.documentElement.classList.remove('theme-reveal'));
  } else {
    applyTheme(next);
  }
}

/* ----- One-time global listeners (survive ClientRouter swaps via delegation) ----- */
let globalsWired = false;
function wireGlobals() {
  if (globalsWired) return;
  globalsWired = true;

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const themeBtn = target.closest<HTMLElement>('[data-theme-toggle]');
    if (themeBtn) {
      toggleTheme(themeBtn);
      return;
    }

    const menuBtn = target.closest<HTMLElement>('[data-menu-toggle]');
    if (menuBtn) {
      const nav = menuBtn.closest('header')?.querySelector('.nav');
      const open = nav?.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

    // Close mobile menu after navigating
    const navLink = target.closest('.nav a');
    if (navLink) {
      navLink.closest('.nav')?.classList.remove('is-open');
      return;
    }

    // Blog tag filter
    const tagBtn = target.closest<HTMLButtonElement>('[data-tag-filter] button[data-tag]');
    if (tagBtn) {
      const filterRoot = tagBtn.closest('[data-tag-filter]')!;
      filterRoot.querySelectorAll('button[data-tag]').forEach((b) => {
        b.removeAttribute('data-active');
      });
      tagBtn.setAttribute('data-active', 'true');
      const tag = tagBtn.getAttribute('data-tag');
      document.querySelectorAll<HTMLElement>('.post-card').forEach((card) => {
        const tags = (card.getAttribute('data-tags') || '').split(',');
        card.style.display = tag === 'all' || tags.includes(tag!) ? '' : 'none';
      });
    }
  });

  // Follow system theme only while the user hasn't chosen manually
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', (e) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch {}
    if (!stored) applyTheme(e.matches ? 'dark' : 'light');
  });

  window.addEventListener(
    'scroll',
    () => {
      const header = document.querySelector('[data-header]');
      if (header) (header as HTMLElement).dataset.scrolled = window.scrollY > 4 ? 'true' : 'false';
    },
    { passive: true },
  );
}

/* ----- Per-page setup (runs after every ClientRouter navigation) ----- */
let observer: IntersectionObserver | null = null;

function initPage() {
  // Sync toggle labels with the theme the inline head script already applied
  syncToggleLabels(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  const header = document.querySelector('[data-header]');
  if (header) (header as HTMLElement).dataset.scrolled = window.scrollY > 4 ? 'true' : 'false';

  // Fade-up / fade-in on scroll into view
  observer?.disconnect();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = document.querySelectorAll('.fade-up, .fade-in');
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
  } else {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    els.forEach((el) => observer!.observe(el));
  }
}

wireGlobals();
document.addEventListener('astro:page-load', initPage);

// ClientRouter swaps the whole document; the incoming static HTML always
// carries data-theme="light". Copy the live theme onto the new document
// before the swap so the theme survives navigation.
document.addEventListener('astro:before-swap', (e) => {
  observer?.disconnect();
  const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  e.newDocument.documentElement.dataset.theme = theme;
  e.newDocument.documentElement.style.colorScheme = theme;
});
