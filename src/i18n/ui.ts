export const languages = ['en', 'zh'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'meta.siteName': 'Roki Ran',
    'meta.tagline': 'A small camp for an obscure geek.',
    'meta.description':
      'Roki Ran · independent developer building tools, ideas, and small wonders on the web.',
    'meta.author': 'Roki Ran',

    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.blog': 'Writing',
    'nav.now': 'Now',

    'theme.toLight': 'Light theme',
    'theme.toDark': 'Dark theme',
    'lang.switch': 'Switch language',

    'hero.greeting': "Hi, I'm Roki.",
    'hero.role':
      'Independent developer. I build tools, write essays, and keep notes on what I learn along the way.',
    'hero.ctaPrimary': 'See what I’m building',
    'hero.ctaSecondary': 'Read the writing',
    'hero.status': 'Open to interesting work · 2026',

    'home.featured.title': 'Projects in motion',
    'home.featured.meta': '4 of 12',
    'home.featured.viewAll': 'See all projects',

    'home.intro.eyebrow': 'On this camp',
    'home.intro.title': 'A few words about what I do.',
    'home.intro.body':
      'I work mostly on the small, durable kind of software — the kind you keep open in a tab for years. Tools for reading, writing, and thinking. Most of it ships as open source, the rest lives in essays and notes you can read here.',
    'home.intro.sign': '— Roki',

    'home.recent.title': 'Recent writing',
    'home.recent.viewAll': 'All writing',

    'home.contact.eyebrow': 'Stay close',
    'home.contact.title': 'Get in touch',
    'home.contact.body':
      'I read every message. Email is best for serious things; the rest of the internet is fine for everything else.',
    'home.contact.cta': 'Send an email',

    'footer.note': 'Built quietly, in the open.',
    'footer.location': 'Somewhere with seasons.',
    'footer.copy': '© Roki Ran',

    'blog.eyebrow': 'Essays & notes',
    'blog.title': 'Writing',
    'blog.lede':
      "What I'm learning, building, and occasionally failing at — kept short so I actually publish them.",
    'blog.count': '{count} posts',
    'blog.sorted': 'Sorted by date, newest first',
    'blog.filter': 'Filter',
    'blog.filter.all': 'All',
    'blog.archive.note': 'Older posts are in the',
    'blog.archive.link': 'archive',
    'blog.archive.tail': '.',
    'blog.back': 'All writing',

    'projects.eyebrow': 'Open source',
    'projects.title': 'Projects',
    'projects.lede':
      'Small, durable tools. Most of them are open source; the rest live in essays and notes.',
    'projects.count': '{count} projects',
    'projects.updated': 'Last updated 2026',
    'projects.archive.note': 'Older work lives in',
    'projects.archive.tail':
      '. Some of it is archived and unmaintained — left up as archaeology.',

    'now.eyebrow': 'Updated 2026-07-21',
    'now.title': 'Now',
    'now.lede':
      "What I'm focused on, what I'm reading, what I'm avoiding. Short on purpose — refreshed every few weeks.",
    'now.updated': 'Last updated',
    'now.updated.value': '3 weeks ago',
    'now.watching': 'Focused on',
    'now.avoiding': 'Avoiding',
    'now.inspiration': 'Inspired by',
    'now.inspiration.tail':
      '. The list is honest, dated, and likely to be wrong in six months. That is the point.',

    'project.status.wip': 'In progress',
    'project.status.shipped': 'Shipped',
    'project.status.archived': 'Archived',
    'project.repo': 'Repo',
    'project.demo': 'Demo',

    'rss.title': 'Roki Ran',
    'rss.description': 'Essays and notes on building small, durable software.',
  },
  zh: {
    'meta.siteName': '冉再兴',
    'meta.tagline': '一位不知名极客的营地。',
    'meta.description': '冉再兴 · 独立开发者，在网上造工具、记想法、做点小事。',
    'meta.author': '冉再兴',

    'nav.home': '首页',
    'nav.projects': '项目',
    'nav.blog': '写作',
    'nav.now': '此刻',

    'theme.toLight': '浅色主题',
    'theme.toDark': '深色主题',
    'lang.switch': '切换语言',

    'hero.greeting': '你好，我是冉再兴。',
    'hero.role': '独立开发者。造工具，写文章，把沿途学到的记下来。',
    'hero.ctaPrimary': '看看我在做什么',
    'hero.ctaSecondary': '翻翻文章',
    'hero.status': '正在接有兴趣的事 · 2026',

    'home.featured.title': '正在做的东西',
    'home.featured.meta': '4 / 12',
    'home.featured.viewAll': '所有项目',

    'home.intro.eyebrow': '关于这个营地',
    'home.intro.title': '几句关于我在做什么。',
    'home.intro.body':
      '我做的多是那种小而耐用的软件——那种你在浏览器标签里一开就是好几年的东西。用来读、写、想。多数以开源形式发布，其余的写在这里的随笔和笔记里。',
    'home.intro.sign': '—— 冉再兴',

    'home.recent.title': '最近的文字',
    'home.recent.viewAll': '所有文章',

    'home.contact.eyebrow': '保持联络',
    'home.contact.title': '找我说话',
    'home.contact.body': '我每封邮件都会看。重要的事用邮件，其他的在社交网络上聊都行。',
    'home.contact.cta': '发封邮件',

    'footer.note': '安静地，公开地，做出来的。',
    'footer.location': '一个有四季的地方。',
    'footer.copy': '© 冉再兴',

    'blog.eyebrow': '随笔与笔记',
    'blog.title': '写作',
    'blog.lede':
      '我在学什么、在做什么、偶尔在哪里跌了跤——写得短一点，这样我才能真的把它们发出来。',
    'blog.count': '{count} 篇',
    'blog.sorted': '按日期排，最新在前',
    'blog.filter': '筛选',
    'blog.filter.all': '全部',
    'blog.archive.note': '更早期的文章都在',
    'blog.archive.link': '归档页',
    'blog.archive.tail': '。',
    'blog.back': '所有文章',

    'projects.eyebrow': '开源作品',
    'projects.title': '项目',
    'projects.lede': '小而耐用的工具。多数以开源形式发布，其余的写进文章和笔记里。',
    'projects.count': '{count} 个项目',
    'projects.updated': '最近更新 2026',
    'projects.archive.note': '早期作品都放在',
    'projects.archive.tail': '。其中一部分已经归档不再维护——留在那儿只是当作一份考古记录。',

    'now.eyebrow': '更新于 2026-07-21',
    'now.title': '此刻',
    'now.lede': '我最近在关注什么、在读什么、在躲什么。故意写得短，每隔几周刷新一次。',
    'now.updated': '上次更新',
    'now.updated.value': '3 周前',
    'now.watching': '在关注',
    'now.avoiding': '在躲',
    'now.inspiration': '灵感来自',
    'now.inspiration.tail': '。这份列表保持诚实、附带日期，而且大概率六个月后会被打脸。这就是目的。',

    'project.status.wip': '进行中',
    'project.status.shipped': '已发布',
    'project.status.archived': '已归档',
    'project.repo': '仓库',
    'project.demo': '演示',

    'rss.title': '冉再兴',
    'rss.description': '关于造小而耐用软件的随笔与笔记。',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
