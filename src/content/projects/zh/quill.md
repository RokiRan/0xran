---
title: Quill
description: 一套阅读模式 CSS 层，让任何博客变成你真正想读的样子。引入一个样式表，完成整个排版升级。
repo: https://github.com/RokiRan/quill
demo: https://quill.roki.run
tags:
  - design
  - engineering
year: 2026
status: shipped
---

大多数个人博客文字内容没问题，但阅读体验有问题：行宽太宽、行距太紧、链接淹没在一墙段落里。Quill 是一张单样式表，你塞进去之后——轻柔地、不动你页面结构——把所有这些都重置一遍。

CSS 用的是 container query，所以无论是在 320px 的小屏还是 1440px 的显示器，它都会自适应。开箱就尊重 `prefers-color-scheme`，内置的暗色变体和本站用的是同一套调色板。

直接放到任何 HTML 页面上就行——不用打 class 钩子。整张表 gzip 之后不到 4 KB。上面那个演示是几家用了这层样式表的博客；源码许可证非常宽松。