import { defaultLang, ui, type Lang, type UIKey } from './ui';

export function useTranslations(lang: Lang) {
  return function t(key: UIKey, vars?: Record<string, string | number>): string {
    let str: string = ui[lang][key] ?? ui[defaultLang][key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  };
}

/** `/projects/quill` → `/zh/projects/quill/` */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const base = clean === '/' ? `/${lang}/` : `/${lang}${clean}`;
  return base.endsWith('/') ? base : `${base}/`;
}

/** Swap the locale segment of the current path, preserving the sub-path. */
export function langSwitchHref(currentPath: string, toLang: Lang): string {
  const segs = currentPath.split('/').filter(Boolean);
  if (segs.length > 0 && (segs[0] === 'en' || segs[0] === 'zh')) {
    segs[0] = toLang;
    return `/${segs.join('/')}/`.replace(/\/+$/, '/');
  }
  return `/${toLang}/`;
}

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
