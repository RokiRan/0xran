import type { Lang } from '../i18n/ui';

export interface Profile {
  name: string;
  handle: string;
  bio: string;
  location: string;
  social: {
    github: string;
    x: string;
    email: string;
  };
}

export const profile: Record<Lang, Profile> = {
  en: {
    name: 'Roki Ran',
    handle: '@RokiRan',
    bio: 'Independent developer. Builds small, durable software; writes about what I learn along the way.',
    location: 'Somewhere with seasons',
    social: {
      github: 'https://github.com/RokiRan',
      x: 'https://x.com/ranxiaojing7096',
      email: 'mailto:ranxiaojing7096@gmail.com',
    },
  },
  zh: {
    name: '冉再兴',
    handle: '@RokiRan',
    bio: '独立开发者。造小而耐用的软件，记下沿途学到的东西。',
    location: '一个有四季的地方',
    social: {
      github: 'https://github.com/RokiRan',
      x: 'https://x.com/ranxiaojing7096',
      email: 'mailto:ranxiaojing7096@gmail.com',
    },
  },
};
