---
title: 用 ego lite 评测 ego lite：一款"人和 Agent 共用"的浏览器深度实测
description: 不看宣传片，直接上手——Snapshot token 实测、登录态继承、iframe 穿透、并行 Space，以及官方文档没告诉你的几个坑。
date: 2026-07-23
tags:
  - AI
  - tools
  - review
kind: 随笔
---

AI 浏览器这个赛道今年很挤：ChatGPT Atlas、Perplexity Comet、各种 agent-browser 框架，都在抢"让 AI 帮你上网"这件事。ego lite 的切入点不太一样——它不内置 Agent，而是把浏览器本身做成 Agent 的工作场所，你自己带 Claude Code、Codex 或任何 Agent CLI 进来。

评测方法也有点意思：**这篇评测的全部实测环节，都是用 ego lite 自己跑的**。相当于让它自己当自己的小白鼠。

![ego lite 官网首页](/images/blog/ego-lite-review/04-ego-lite-homepage.webp)

## 它是什么

ego lite 是 Citro Labs 出品的 Chromium 浏览器（内核版本 150，相当新），目前只有 macOS 版，免费。核心卖点一句话：你和你的 AI Agent 共用同一个浏览器，但各干各的。

- Agent 在独立的 **Space**（任务空间）里工作，不抢你的标签页和鼠标焦点
- 它继承你 Chrome 迁移过来的登录态，Agent 直接以"你"的身份操作网站
- Agent 通过 `ego-browser` 这个 skill 接入，用一段 Node.js heredoc 脚本一次性驱动浏览器，而不是"一条命令看一次结果"地反复横跳

官方对标数据是"比 Vercel 的 agent-browser 快 2.5~3.45 倍"——注意，README 写 2.5 倍，中文文档写 3.45 倍，官方自己的口径都没统一。这种数字我一般打个折听，直接上手测。

## 实测一：Snapshot 到底有多省 token

文本模型"看"网页靠的不是截图，是结构化的页面快照。ego lite 宣称对 Chromium 内核做了定制，典型页面快照只要 200~400 token。实测两个极端：

**简单页（saucedemo 登录页）**：snapshot 只有 700 字符，约 200 token，完全坐实官方说法。长这样：

```
root
  text "Swag Labs"
  container
    form
      textbox [ref=2, loc=css:input[name="user-name"]]
      textbox [ref=3, loc=css:input[name="password"]]
      button [ref=4, loc=css:input[name="login-button"]]
```

**复杂页（GitHub 仓库页）**：snapshot 膨胀到 49,392 字符（约 1.4 万 token）。看起来吓人，但同页原始 HTML 是 413KB——压缩比 8.4 倍，且生成只花了 18ms。作为对照，Playwright 类工具 Dump 完整 a11y tree 或 HTML 给模型，token 消耗是这个的几倍到几十倍。

结论：200~400 token 是登录页级别的宣传话术，复杂页面该大还是大；但压缩效率和生成速度是真实的，内核级定制不是空话。

![GitHub 仓库页——复杂页面的 snapshot 实测对象](/images/blog/ego-lite-review/01-github-repo-page.webp)

## 实测二：登录态继承，Agent 就是"你"

这是和传统自动化框架体验差距最大的一点。我在 ego lite 里登录过 GitHub（Chrome 数据迁移而来），然后让 Agent 打开 GitHub 检查登录状态：

```js
{ hasAvatar: true, avatarAlt: "Roki Ran", hasLoginLink: false }
```

Agent 看到的就是登录后的页面，不用处理任何 cookie、token、二次验证。做需要身份的任务（发推、查邮件、操作内部系统）时，这一步省掉的是整个认证流程，也是 browser-use 类框架最疼的地方。

## 实测三：表单交互，一次脚本跑完整流程

用 saucedemo 做端到端登录测试：填用户名、填密码、点登录、验证跳转到商品页。整个 heredoc 一次执行：

```js
await fillInput('@2', 'standard_user')
await fillInput('@3', 'secret_sauce')
await click('@4')
// → after login: /inventory.html
// → {"title":"Products","itemCount":6}
```

填表 + 点击 + 验证共 1.16 秒。`@2` 这种 ref 引用来自 snapshot，不依赖 CSS class，前端改样式不会失效——比手写选择器抗造。

![Agent 自动登录后的商品页](/images/blog/ego-lite-review/03-saucedemo-logged-in.webp)

## 实测四：iframe 穿透

官方宣称内核级 Snapshot 能处理"深度嵌套 iframe"这类 JS shim 方案会悄悄漏掉的场景。用 W3Schools 的在线编辑器测（页面 6 个 iframe，表单渲染在结果 iframe 里）：

```
iframe [ref=9, loc=unstable]
  text "First name:"
  textbox [ref=2, loc=css:input[name="fname"]]
  text "Last name:"
  textbox [ref=3, loc=css:input[name="lname"]]
```

iframe 内部的表单字段完整出现在语义树里，可以直接 ref 操作。做支付（Stripe checkout 就是 iframe）或嵌第三方组件的自动化时，这是硬性能力。

## 实测五：并行 Space

开两个 Space，各跑一个独立 CLI 进程：一个抓 Hacker News 首页（1.5 秒返回 top5），另一个抓 ego 官网更新日志（9.3KB snapshot）。两个并发完成，互不干扰。

对"让 Claude Code 在 10 个 Space 里并行 enrich 10 条线索"这种场景，架构上是成立的。瓶颈会在你的机器算力和 Agent 的 token 账单，而不是浏览器。

## 踩到的坑（官方文档没写的）

1. **`captureScreenshot()` 返回的是临时文件路径，不是 base64**。文档完全没提返回值格式，我按惯例当 base64 解码，写出三个 57 字节的乱码文件才发现。正确姿势是拿到路径后自己拷贝。
2. **heredoc 是 ESM 环境**：`require()` 和顶层 `await` 不能混用，文件操作得 `await import('fs')`。报错信息倒是清楚，但第一次必踩。
3. **snapshot 的 ref 有时效**：每次 `snapshotText()` 重建 refMap，滚动出视口或 DOM 重渲染后旧 ref 会失效。文档里写了，但字很小，实际用一定要养成"操作前重新 snapshot"的习惯。

## 不适合谁

- **Windows/Linux 用户**：现在只有 macOS，官网说在路线图上
- **想要"浏览器内置 AI"的人**：ego lite 没有内置 Agent，你得自己有 Agent CLI 和模型 API key。这不是缺点，是定位差异——但也意味着普通用户开箱得不到任何 AI 能力
- **数据敏感但对 Agent 放权有顾虑的人**：Agent 继承的是你全部登录态，它能做的和你能做的一样多。方便和风险是同一枚硬币

## 结论

ego lite 的差异化不在"AI 浏览器"的噱头，在一个务实的判断：Agent 需要的不是一个新浏览器，而是一个能共享你登录态、又不打扰你的工作环境。Snapshot 的压缩效率（8.4x vs 原始 HTML、18ms 生成）、iframe 穿透、并行 Space 这些核心能力，实测都站得住；宣传倍数看看就好，官方自己都没对齐口径。

对我这种日常用 Agent CLI 干活的人，它解决的是真痛点：以前 Agent 操作浏览器要么用我的 Chrome 抢我焦点，要么开 headless 实例没有登录态。现在是"它干它的，我干我的"，这就值回票价了（虽然免费）。
