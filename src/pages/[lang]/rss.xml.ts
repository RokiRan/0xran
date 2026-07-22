import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { useTranslations } from '../../i18n/utils';
import { languages, type Lang } from '../../i18n/ui';

export function getStaticPaths() {
  return languages.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Lang;
  const t = useTranslations(lang);
  const posts = (await getCollection('blog', ({ id }) => id.startsWith(`${lang}/`))).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: t('rss.title'),
    description: t('rss.description'),
    site: site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${lang}/blog/${post.id.split('/').pop()}/`,
    })),
    customData: `<language>${lang === 'zh' ? 'zh-CN' : 'en-US'}</language>`,
  });
};
