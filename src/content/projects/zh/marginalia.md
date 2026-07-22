---
title: Marginalia · 边注
description: 一种住在页边距里的阅读工具。在网上任何地方做标注，让你的笔记可携带、可检索、属于你自己。
repo: https://github.com/RokiRan/marginalia
demo: https://marginalia.roki.run
tags:
  - engineering
  - design
year: 2026
status: wip
---

Marginalia 起自我个人的一个小烦恼：我想给一篇长文里的某段话划线，半年后再翻出来找到它。我试过的每个工具，要么把你的笔记锁在别人的 app 里，要么在划线这一步之前就先要订阅。

现在的版本是一个轻量的浏览器扩展，加上一个本地优先的笔记存储。高亮只是你自己选定文件夹里的 Markdown 文件；同步可以选择性打开，走文件系统或任何 Git 远程。我自己并没有跑后端服务，意思是——我也不可能读到你的笔记。这正是关键。

下个里程碑是一个阅读模式的伴生样式表，让高亮在排版糟糕的博客主题下依然清晰可见；再加一个极小的命令行工具，方便从终端直接 grep 你的笔记库。大致时间表是这个夏末。