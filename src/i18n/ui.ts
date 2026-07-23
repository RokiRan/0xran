export const languages = ['en', 'zh'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'meta.siteName': 'Roki Ran',
    'meta.tagline': 'A small camp for an obscure geek.',
    'meta.description': 'Roki Ran · independent developer building small, durable software.',
    'meta.author': 'Roki Ran',

    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.blog': 'Writing',
    'nav.now': 'Now',
    'nav.friends': 'Neighbors',

    'theme.toLight': 'Light theme',
    'theme.toDark': 'Dark theme',
    'lang.switch': 'Switch language',

    'hero.title': 'A small camp for an<br/><em>obscure</em> geek.',
    'hero.role': 'Independent developer. I build tools and write about what I learn along the way.',
    'hero.ctaPrimary': 'See what I’m building',
    'hero.ctaSecondary': 'Read the writing',
    'hero.status': 'Factory floor by day, code by night',

    'home.featured.title': 'Projects in motion',
    'home.featured.meta': '{featured} of {total}',
    'home.featured.viewAll': 'See all projects',

    'home.intro.eyebrow': 'On this camp',
    'home.intro.title': 'What I do.',
    'home.intro.body':
      'I build small, durable software — the kind you keep open in a tab for years. Most of it ships as open source; the rest becomes the essays and notes on this site.',
    'home.intro.sign': '— Roki',

    'home.recent.title': 'Recent writing',
    'home.recent.viewAll': 'All writing',

    'home.contact.eyebrow': 'Contact',
    'home.contact.title': 'Get in touch',
    'home.contact.body':
      'I read every message. Email is best for serious things; the rest of the internet is fine for everything else.',
    'home.contact.cta': 'Send an email',

    'footer.note': 'Hand-built with Astro.',
    'footer.copy': '© Roki Ran',

    'blog.eyebrow': 'Essays & notes',
    'blog.title': 'Writing',
    'blog.lede':
      "What I'm learning, building, and occasionally failing at — kept short so I actually publish them.",
    'blog.count': '{count} posts',
    'blog.sorted': 'Sorted by date, newest first',
    'blog.filter': 'Filter',
    'blog.filter.all': 'All',
    'blog.back': 'All writing',

    'projects.eyebrow': 'Open source',
    'projects.title': 'Projects',
    'projects.lede': 'Small, durable tools, mostly open source.',
    'projects.count': '{count} projects',
    'projects.updated': 'Last updated {year}',
    'projects.archive.note': 'Older work lives in',
    'projects.archive.tail': '. Some of it is archived and unmaintained.',

    'now.eyebrow': 'Updated {date}',
    'now.title': 'Now',
    'now.lede': "What I'm working on, and what I'm putting off. Refreshed every few weeks.",
    'now.watching': 'Focused on',
    'now.avoiding': 'Avoiding',
    'now.inspiration': 'Inspired by',
    'now.inspiration.tail': '. It is dated, and when it goes stale I will rewrite it.',

    'project.status.wip': 'In progress',
    'project.status.shipped': 'Shipped',
    'project.status.archived': 'Archived',
    'project.repo': 'Repo',
    'project.demo': 'Demo',

    'friends.eyebrow': 'Friend links',
    'friends.title': 'Neighboring camps',
    'friends.lede':
      'The internet is a big wilderness. These tents are within shouting distance — everyone keeps their own fire, but we share the marshmallows.',
    'friends.since': 'Camped since {date}',
    'friends.hops': '{n} hops away',
    'friends.shuffle.note': 'Neighbors reshuffle for the creek-side spot on every rebuild.',
    'friends.apply.title': 'Pitch your tent',
    'friends.apply.rule1': 'Your site shows signs of life within the last six months (weeds under a meter).',
    'friends.apply.rule2': 'You hand-make weird things too.',
    'friends.apply.rule3':
      'Email me with the subject “Pitching my tent”, your URL, and one line about yourself.',
    'friends.patrol':
      'I patrol regularly and bury dead tents (404s). Report illegal construction by email.',

    'rss.title': 'Roki Ran',
    'rss.description': 'Essays and notes on building small, durable software.',
  },
  zh: {
    'meta.siteName': '冉再兴',
    'meta.tagline': '一位不知名极客的营地。',
    'meta.description': '冉再兴 · 独立开发者，做小而耐用的软件，写随笔和笔记。',
    'meta.author': '冉再兴',

    'nav.home': '首页',
    'nav.projects': '项目',
    'nav.blog': '写作',
    'nav.now': '此刻',
    'nav.friends': '友邻',

    'theme.toLight': '浅色主题',
    'theme.toDark': '深色主题',
    'lang.switch': '切换语言',

    'hero.title': '一位不知名极客的<br/><em>营地</em>。',
    'hero.role': '独立开发者。造工具，写文章，把沿途学到的记下来。',
    'hero.ctaPrimary': '看看我在做什么',
    'hero.ctaSecondary': '翻翻文章',
    'hero.status': '白天在车间，晚上写代码',

    'home.featured.title': '正在做的东西',
    'home.featured.meta': '{featured} / {total}',
    'home.featured.viewAll': '所有项目',

    'home.intro.eyebrow': '关于这个营地',
    'home.intro.title': '我在做什么。',
    'home.intro.body':
      '我做的是小而耐用的软件——那种能在浏览器标签里一开好几年的东西。多数以开源发布，其余的写成这里的随笔和笔记。',
    'home.intro.sign': '—— 冉再兴',

    'home.recent.title': '最近的文字',
    'home.recent.viewAll': '所有文章',

    'home.contact.eyebrow': '联系方式',
    'home.contact.title': '找我说话',
    'home.contact.body': '我每封邮件都会看。重要的事用邮件，其他的在社交网络上聊都行。',
    'home.contact.cta': '发封邮件',

    'footer.note': '用 Astro 手搓的。',
    'footer.copy': '© 冉再兴',

    'blog.eyebrow': '随笔与笔记',
    'blog.title': '写作',
    'blog.lede':
      '我在学什么、在做什么、偶尔在哪里跌了跤——写得短一点，这样我才能真的把它们发出来。',
    'blog.count': '{count} 篇',
    'blog.sorted': '按日期排，最新在前',
    'blog.filter': '筛选',
    'blog.filter.all': '全部',
    'blog.back': '所有文章',

    'projects.eyebrow': '开源作品',
    'projects.title': '项目',
    'projects.lede': '小而耐用的工具，多数开源。',
    'projects.count': '{count} 个项目',
    'projects.updated': '最近更新 {year}',
    'projects.archive.note': '早期作品都放在',
    'projects.archive.tail': '。有些已经归档，不再维护。',

    'now.eyebrow': '更新于 {date}',
    'now.title': '此刻',
    'now.lede': '最近在做什么，在躲什么。每隔几周更新一次。',
    'now.watching': '在关注',
    'now.avoiding': '在躲',
    'now.inspiration': '灵感来自',
    'now.inspiration.tail': '。这份列表附带日期，过期了就回来改。',

    'project.status.wip': '进行中',
    'project.status.shipped': '已发布',
    'project.status.archived': '已归档',
    'project.repo': '仓库',
    'project.demo': '演示',

    'friends.eyebrow': '友情链接',
    'friends.title': '友邻营地',
    'friends.lede': '互联网是一片荒原，这几顶帐篷离我不远。篝火各生各的，但烤棉花糖可以一起。',
    'friends.since': '扎营于 {date}',
    'friends.hops': '相距 {n} 个超链接',
    'friends.shuffle.note': '每次重建，邻居们都要重新抢溪边的位置。',
    'friends.apply.title': '想在这扎营？',
    'friends.apply.rule1': '你的站还活着：半年内有动静，坟头草不超过一米。',
    'friends.apply.rule2': '你也是个手搓东西的怪人。',
    'friends.apply.rule3': '邮件我，主题写「扎营申请」，附上帐篷地址和一句自我介绍。',
    'friends.patrol': '我会定期巡山，给塌掉的帐篷（404）收尸。发现邻里违建，欢迎邮件举报。',

    'rss.title': '冉再兴',
    'rss.description': '关于造小而耐用软件的随笔与笔记。',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
