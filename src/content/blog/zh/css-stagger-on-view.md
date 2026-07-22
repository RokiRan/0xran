---
title: 不用库，实现滚动入场动画
description: 一个迷你的 IntersectionObserver 加一个 CSS 自定义属性。技巧就这么多。
date: 2026-06-28
tags:
  - engineering
  - design
kind: 工程
---

每个静态站点最后都会想要同一种装饰：元素在滚动到视口时淡入上来，错开一点点节奏，整页看起来有活力。最偷懒的答案是引入一个 40 KB 的动画库。更优雅的答案是 12 行 JavaScript。

## CSS 部分

每个要动的元素挂一个 `.fade-up` 类。这个类把元素先藏起来，再定义一条 transition 让它回到位置上。错开动画靠一个内联在每个子元素上的自定义属性 `--i`：`--i: 0`、`--i: 1`、`--i: 2`，依次类推。

> 自定义属性是关键。你把动画逻辑只写一次，错开就变成一个你可以在任何地方传入的数字。

## JavaScript 部分

一个 IntersectionObserver，元素第一次进入视口就给它加上 `is-in` 类。就这些。CSS 处理剩下的事；observer 对每个元素只触发一次，所以没有抖动。

## 三个值得注意的细节

- 把延迟封顶。12 个元素时，`--i: 11` × 70ms 等 770ms——太长了。
- 在 `prefers-reduced-motion` 下禁用动画。直接设 `opacity: 1; transform: none`。
- 用 transition，不要用 keyframe 动画。transition 是可打断的，keyframe 不是。

这就是完整的模式。框架版本干同样的活要 14 KB；原生版本不到 200 字节。
