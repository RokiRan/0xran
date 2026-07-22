---
title: Camp
description: 一个为写作者设计的极简静态站点框架。Markdown 进，高性能 HTML 出。默认零客户端 JS。
repo: https://github.com/RokiRan/camp
demo: null
tags:
  - engineering
  - meta
year: 2025
status: shipped
---

Camp 就是驱动这个网站的静态站点生成器。它源于我个人的一个判断：大多数个人站点并不需要框架、不需要构建管线，也不需要运行时——它们只需要一文件夹的 Markdown，外加一张你亲手写的 CSS。

这个框架有意做得极小。没有插件系统、没有主题市场、也没有客户端水合。页面在构建时预渲染；唯一会发布的 JS 是你自己写的，而大多数页面根本不发布 JS。

你换掉的是灵活性，换回来的是心安：你站点里的任何东西都不会因为依赖升级、运行时变更或服务器宕机而坏掉。它在真正意义上的确是一座静态营地。