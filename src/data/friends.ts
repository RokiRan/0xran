import type { Lang } from '../i18n/ui';

export interface Friend {
  name: string;
  url: string;
  /** Local path under public/, keeps cards alive even if the tent moves CDNs. */
  avatar?: string;
  tagline: Record<Lang, string>;
  /** YYYY-MM — when they pitched their tent here. */
  since: string;
  /** Decorative. Nobody knows what the unit is. */
  hops: number;
}

/**
 * Neighboring camps. Order here is irrelevant —
 * the page shuffles at build time because neighbors
 * fight over the creek-side spot on every rebuild.
 */
export const friends: Friend[] = [
  {
    name: '胖张Dev',
    url: 'https://pzdev.me/',
    avatar: '/images/friends/pzdev.png',
    tagline: {
      zh: '独立开发实战派。40 块/月的服务器，跑日均一万的 PV。',
      en: 'Indie hacking from the trenches: production on a $6 server, 10k PVs a day.',
    },
    since: '2026-07',
    hops: 3,
  },
  {
    name: '爱瞎搞的技术宅',
    url: 'https://w2freed.com/',
    avatar: '/images/friends/w2freed.jpg',
    tagline: {
      zh: '十年码龄，管理出身，技能树点亮一大片、没一个满级。嫌手动改 JSON 烦，顺手就撸个桌面工具。同样的坑踩两遍，他管那叫复盘。',
      en: 'Ten years of code, a manager by day, a skill tree lit up everywhere with nothing maxed. Annoyed by editing JSON, so he built a desktop tool for it. Stepping into the same pit twice? He calls that a retrospective.',
    },
    since: '2026-08',
    hops: 2,
  },
];
