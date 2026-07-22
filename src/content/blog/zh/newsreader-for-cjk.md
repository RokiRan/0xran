---
title: 中英双语字体的搭配心得
description: 用 Newsreader 配 Noto Serif SC 测试一个月，关于双语站点字体的笔记。
date: 2026-05-19
tags:
  - design
kind: 设计
---

双语站点翻车翻在两种方式上：要么拉丁显示字体像嫁接在中文文字上，要么中文文字像嫁接在拉丁显示字体上。修复办法很少是再加一款字体——而是先选一款拉丁字体，它的纵向指标要和你被迫用的中文回退字体对得上。

## 关键指标是 x-height

多数"和谐搭配"文章都讲风格：衬线对不对、字碗颜色协不协调。在正文字号下这些都不重要。重要的是拉丁字体的 `x` 视觉上的高度，是否和平均汉字的高度大致一致。

Newsreader 和 Noto Serif SC 恰好接近。这是这个站用它们的原因。两者都不是为彼此设计的——它们只是刚好住在指标空间的同一个街区。

> 先选你的拉丁显示字体，再去找 x-height 对得上的中文字体。别反过来。

## 我试过但没成的

- 把 Source Serif Pro 配 Source Han Serif——单独看很漂亮，到正文字号下拉丁 x-height 显得太矮。
- 把 `system-ui` 当中文回退——Mac 上是 PingFang SC，Windows 上是 Microsoft YaHei，看起来像两个站。
- 在中文 run 上加 `font-feature-settings: "palt"`——标点会偏离基线 2-3 像素。跳过。

## 我留下来的

每个角色只用一条字栈。显示 = 衬线（Newsreader + Noto Serif SC）。正文 = 无衬线（Inter + PingFang SC）。等宽 = JetBrains Mono。一个角色内不混搭。纪律比选择更重要。
