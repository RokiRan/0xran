---
title: Edg Agent：我在 Chrome 侧边栏雇了个只会说 JSON 的员工
description: 不写新浏览器，写一个扩展。侧边栏里的 LLM Agent 怎么读页面、怎么点按钮、想替你下单时谁拦着它，以及怎么用一只确定性鹦鹉给它做 E2E 测试。全部截图来自真实运行。
date: 2026-09-04
tags:
  - AI
  - Chrome
  - agent
kind: 随笔
---

今年「AI 帮你上网」的路线分两派：一派造新浏览器，把 Agent 焊进壳里；另一派让 Agent 远程遥控浏览器。我走了第三条路：不造浏览器，也不遥控，直接在 Chrome 侧边栏里塞一个员工。

成果叫 Edg Agent，一个 MV3 扩展（WXT + React 19 + TypeScript）。你在侧边栏用自然语言派活，「去 Antd 文档搜 cascader 的用法」「把这个表单填了」，它自己看页面、点按钮、输文字、滚动，干完交付结果。你的标签页、登录态、鼠标焦点都还是你的，它在旁边打工。

![Edg Agent 的空状态：$ edg --ready](/images/blog/edg-agent/01-welcome.webp)

这篇文章的所有截图都不是摆拍：它们来自扩展真实运行，只是对面接的 LLM 是一只我自己写的假鸟，原因后面讲。

## 上岗前先签合同

第一次打开要填 LLM 配置：OpenAI、DeepSeek，或者任何 OpenAI 兼容接口，Key 只存在 `chrome.storage.local`，不出本机。

![设置页：provider、API Key、baseUrl、model、最大步骤数](/images/blog/edg-agent/08-settings.webp)

注意最大步骤数下面那行小字：「任务复杂时调大，失控时调小」。这是我写过的最诚实的设置说明，翻译过来就是：预算给够，但绳子要留。

## 它怎么看页面：快照，不是截图

文本模型看不懂像素，所以每一步先给页面拍一份文字快照，只列可交互元素：

```
页面: 测试搜索站 (http://127.0.0.1:8932/search.html)
可交互元素:
[0] select options=[全部, 文章, 商品]
[1] input type=text placeholder="输入关键词"
[3] button "搜索"
```

模型每轮只允许回一个 JSON 动作，比如 `{"tool":"type","id":1,"text":"hello"}`，然后循环执行。工具箱不大：`click` / `type` / `select` / `scroll` / `navigate` / `new_tab` / `ask_user` / `read_page` / `done`，外加两个兜底：`click_at`（截图配归一化坐标，专治 canvas 这种没有 DOM 的硬骨头）和 `type_focused`。

一轮一个动作，等执行结果回来再出下一招。慢是慢了点，但每一步都可审计，出问题能指着某一步说「就是这步蠢的」。

## system prompt 是一本员工手册

给 LLM 的 system prompt 写着写着，语气就变成了带实习生多年的老油条。几句原文：

```
4. 除 JSON 动作外，不要输出任何解释、问候、前后缀文字。
5. JSON 之后的任何文字都会被系统丢弃，用户永远看不到——包括你以为可以"接着写"的正文。
```

第五条是被真实行为逼出来的。模型特别喜欢在 JSON 后面跟一段「以上操作已完成，请问还有什么可以帮您？」，热情周到，但那段文字的去向是 /dev/null。手册里只能把丑话写死。

还有一条关于交付物：

```
done 的 summary 是用户唯一能看到的最终交付内容。如果任务要求产出具体内容
（试卷、总结、列表、答案等），必须把完整成果全文写进 summary，
不能只写"已制作如下"之类的引言。
```

不写这句，它真的会交付一句「已为您整理好如下」然后下班。

调用参数上，`temperature=0` 把动作漂移摁死，`max_tokens=4096` 给推理模型留足 think + JSON 的预算。如果返回的格式烂了，重试时预算升到 8192、温度放到 0.2，相当于让它喝杯咖啡冷静一下再交卷。

## 一次真实执行长什么样

派活「在搜索框输入 hello 然后点击搜索」，三步干完：

![任务卡片：type → click → done，绿色完成徽章](/images/blog/edg-agent/02-search-done.webp)

卡片里每一步都有工具名、参数和执行回执，右下角是累积 token 账单 `↑1.9k ↓29`。被操作的页面那边：

![搜索页显示 3 条结果](/images/blog/edg-agent/03-search-page.webp)

任务结束时还有个细节：CDP 连接必须 `cdpDetach` 收干净，否则页面顶部会常驻一条「正在调试」的信息条，像员工下班没摘工牌。

## 它想替你花钱的时候

总不能它看到「提交订单」就真点。高危动作用关键词正则拦：

```js
const DANGEROUS_RE = /(submit|pay|purchase|buy|delete|remove|send|post|publish|order|支付|付款|购买|删除|移除|发送|发布|提交|下单)/i;
const DANGEROUS_URL_RE = /(checkout|payment|cart|pay)/i;
```

命中就暂停任务，弹确认卡，把动作原文摆出来：

![高危确认卡：拒绝 / 允许 / 本次会话始终允许](/images/blog/edg-agent/04-confirm.webp)

三个按钮：拒绝、允许、本次会话始终允许（内存态，侧栏一关就忘，不信任任何持久化的「我同意」）。我点拒绝之后：

![任务失败：用户拒绝了高危操作](/images/blog/edg-agent/05-denied.webp)

注意它已经填好的「张三 / 123456」。动作被拦在提交那一步，表单是填好的，钱没出去。这个状态刚刚好：活干了一半，决定权在你。

## 它会反问，也会发呆

信息不够时它有 `ask_user`，可以附 2 到 6 个选项，UI 渲染成按钮，不用打字：

![ask_user 的选项按钮：选项甲 / 选项乙 / 选项丙](/images/blog/edg-agent/06-ask-options.webp)

等 LLM 回复的时候，底部浮一个 64px 的思考球，canvas 加 rAF 画的点阵动画，风格参考的是输入法「正在组织语言」的那种点带。系统开了「减少动态效果」就只画一帧静态的，不强迫任何人看加载动画。

![思考球：任务运行中的悬浮动画](/images/blog/edg-agent/07-orb.webp)

任务跑着的时候还可以插话：底部输入框变成「输入补充指令」，新指令作为 user 消息插进对话，不打断当前步骤。老板中途改需求，员工当场接着干。

## 现代前端给它的第一课

antd、element-plus 这类组件库的「下拉框」不是 `<select>`，是一个输入框加一层浮窗加一堆 `div[role=option]`。`select` 工具怼上去只会收到一句 `not a select element`。

手册里为此专门写了教案：先 `click` 触发器把浮层点开，下一轮快照里会出现 `role=option` 的元素，再 `click` 目标选项。`select` 失败时错误消息也会把它往这条路上引。这是每个做浏览器自动化的人都会踩的坑，区别在于人踩一次长记性，它把手册带在身上。

## 用一只鹦鹉考一个 Agent

E2E 测试的真 LLM 方案有三个毛病：贵、慢、不稳定，今天能过的用例明天模型心情不好就挂。所以我写了 `e2e/mock-llm.mjs`：一只零依赖的确定性假 LLM，`node:http` 起在 127.0.0.1:4399，本质上是个状态机，收到快照文本就按剧本回 JSON 动作。

它不认识字，但鹦鹉会学舌就够了。快照消息的格式因此在代码里逐字冻结，注释写明「mock LLM 依赖它解析」，谁改格式谁去改鹦鹉。剧本覆盖了搜索、高危确认、canvas 视觉兜底、组件库下拉、长表单、滚动这些形态，还有两个专门使坏的场景：一个返回没闭合的 `<think>` 垃圾测格式容错，一个在 done JSON 后面粘一段含 `}` 的正文测截尾。它还自带一个体检接口，跑完本文的截图流程后我拉了一次，逐字输出：

```json
{"reqCount":27,"sawImage":false,"sawSteer":false,"sawHistory":false}
```

上岗至今接了 27 次活，分文未取。

跑 e2e 还有个浏览器门槛：Chrome 137 移除了 `--load-extension`，正式版 Chrome 在自动化里根本加载不了未打包扩展。只能用 Chrome for Testing，一个专门用来被撞的测试假人浏览器。另外有个诚实的缺口：`e2e/prepare-ext.mjs` 会给 manifest 预注入 `host_permissions: ["<all_urls>"]`，所以运行时弹原生权限框那条路 e2e 覆盖不到，只能人肉验。测试替身替你挡了枪，你就要承认哪一枪没测到。

## 三个值得抄的工程细节

历史剪枝：每轮快照都回灌对话，prompt 体积会变成 O(n²)。现在的做法是只保留最近 2 份完整快照，更早的改写成占位符，体积降回 O(n)。模型反正也被要求「永远基于最新快照操作，不许凭记忆用旧 id」，旧快照留着本来就是祸害。

截断抢救：模型在 `done.summary` 里写长交付时可能被 `max_tokens` 腰斩，JSON 永远不闭合。`salvageDoneSummary` 会把已写出的 summary 内容尽力反转义救回来。交付写到一半断气了，稿子还是你的。

输入通道：操作优先走 CDP（`Input.dispatchMouseEvent` / `insertText` / `mouseWheel`），真事件，能过大部分前端的真实用户检测；CDP 不可用时降级 DOM 操作，执行回执尾部会标一个 ` (dom)`，日志里一眼能认出哪步是退而求其次。

## 边界

它继承你浏览器里的全部登录态，能做的事和你一样多，这是方便也是风险，所以高危确认和会话级「始终允许」才设计成现在这个样子。目前只支持 Chrome 系，Firefox MV2 在路线图上躺着。假鸟测不了真模型的发挥水平，接真 LLM 的效果取决于你选的那只真鸟，M3 级别的推理模型单步延迟峰值能到 53 秒，泡杯茶再看。

源码在 [github.com/RokiRan/edg-agent](https://github.com/RokiRan/edg-agent)，MIT 之前先当内部玩具用着。如果你也想在浏览器里雇个员工，建议先想清楚哪几个按钮不许它碰，再签合同。
