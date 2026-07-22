# 0xran.com

冉再兴（Roki Ran）的个人站点：博客 + 项目展示。Astro 5 全静态输出，中英双语，无数据库、无后端、无客户端框架。

**线上**：https://0xran.com

## 技术栈

- [Astro 5](https://astro.build/) — 静态站点生成 + Content Collections
- [Tailwind CSS 4](https://tailwindcss.com/)（`@tailwindcss/vite`）+ 少量手写 CSS（`src/styles/global.css`）
- Shiki 代码高亮（Astro 内置，默认主题）
- `@astrojs/rss` — 双语 RSS
- 包管理：pnpm

## 常用命令

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发服务器（默认 :4321）
pnpm build        # 产出到 dist/
pnpm preview      # 本地预览构建产物
```

## 目录结构

```
src/
├── content.config.ts      # blog / projects 两个 collection 的 schema
├── content/
│   ├── blog/{zh,en}/      # 博客文章，双语同名文件
│   └── projects/{zh,en}/  # 项目条目，双语同名文件
├── pages/[lang]/          # 所有页面按语言参数化（zh / en）
│   ├── index.astro        # 首页（含"正在做的东西"项目卡片）
│   ├── blog/              # 博客列表 + 详情
│   ├── projects/          # 项目列表 + 详情
│   ├── now.astro          # "此刻"页
│   └── rss.xml.ts         # 双语 RSS
├── i18n/                  # ui.ts 文案（zh/en）+ utils.ts 路由工具
├── layouts/ components/   # BaseLayout、PostCard、ProjectCard 等
└── styles/global.css      # 设计令牌 + 排版样式
```

## 写一篇文章

在 `src/content/blog/zh/` 和 `src/content/blog/en/` 各放一个**同名** `.md`：

```markdown
---
title: 标题
description: 一句话摘要（用于列表和 meta）
date: 2026-07-22
tags:
  - engineering
kind: 随笔        # zh 用中文分类名，en 用 Essay / Notes 等
---

正文……
```

构建时按 `date` 排序、自动进入列表 / 首页"最近的文字" / RSS，无需改代码。

## 加一个项目

1. 在 `src/content/projects/{zh,en}/` 各放一个同名 `.md`：

```markdown
---
title: OneShell
description: 一句话描述
repo: https://github.com/RokiRan/OneShell   # 没有就写 null
demo: null
tags:
  - engineering
year: 2026
status: shipped        # wip（进行中）/ shipped（已发布）/ archived（已归档）
---
```

2. **必须**把 slug 加进白名单才会出现在首页和 `/projects` 列表——两处都要改：
   - `src/pages/[lang]/index.astro` 的 `projectOrder`
   - `src/pages/[lang]/projects/index.astro` 的 `projectOrder`

   数组顺序即展示顺序。漏掉这一步项目详情页仍会生成，但列表页会静默不显示。
3. 同步更新 `src/i18n/ui.ts` 里写死的 `home.featured.meta` 计数（`2 of 2` / `2 / 2`）。

## 约定与坑

- **双语同名**：`zh/foo.md` 与 `en/foo.md` 配对存在，`[slug].astro` 按 `id` 的语言段路由。
- **代码块样式**：正文容器是 `.article-body`（博客）与 `.prose`（项目），两套都有 `pre` 样式；新增正文容器时记得补 `pre`，否则 Shiki 代码块会全宽裸奔。
- **域名**：`astro.config.mjs` 的 `site` 是 RSS / sitemap 绝对链接的唯一来源。
- **主题**：暗色由 `<html data-theme>` 驱动（`global.css` 顶部），不跟随 `prefers-color-scheme`。

## License

代码 MIT；`src/content/` 下的文字内容版权归作者所有。
