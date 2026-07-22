---
title: Trace
description: 一个用于记录纯文本工作日志的命令行工具，可以 grep、diff、画图。替代了我反复弃用的五六个追踪器。
repo: https://github.com/RokiRan/trace
demo: null
tags:
  - engineering
year: 2025
status: shipped
---

这十年我几乎把每个新出的效率追踪器都试了一遍。它们都掉进同一个坑：一旦数据库成为唯一的真相来源，记录就变成"只写"了。你记一个月，再记得少些，然后停下来；之后这个 app 被废弃，你的数据躺在一个你也无法 grep 的废弃 .sqlite 文件里。

Trace 是反过来的。每一行记录就是 Markdown 文件里的一行。没有 schema，格式够人类用 `cat` 读、也够结构化用 `grep` 查。一行一条记录：时间戳、项目标签、一句话。

比较有意思的两个命令是 `trace graph`（把最近 30 天画成一张 SVG 柱状图）和 `trace diff`（周与周之间的日志对比）。都是纯 shell——不联网、不上报。