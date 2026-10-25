---
title: 作坊也买保险了：Pi Durable 深入浅出
description: "Pi Durable 是什么、解决什么问题、和 Temporal 们有什么不同、谁已经在拿它盖房子——一篇带社区反响、实测数字和避坑清单的深入浅出演义。"
date: 2026-10-25
tags:
  - AI
  - agent
  - architecture
kind: 随笔
---

八月份我写过一篇[《作坊与空间站》](./dsh-vs-pi.html)，结尾下了个判断：Pi 赌的是"重启便宜"，DeepSeek Harness 赌的是"重启会越来越贵"。结果十月一号，作坊自己把保险买上了。

Earendil 在 [Pi 1.0 发布同一天](https://earendil.com/posts/pi-durable/)扔出一个实验性新包：**Pi Durable**，定位是给"长时间运行、杀不死、边跑边改代码"的 agent 当底座。三周时间：Hacker News 上 515 赞，Cloudflare 在发布第二天就把它收编进自家 Agents SDK，piindex 收录的第三方引用仓库到了 75 个。

但社区最火的讨论帖不是夸它的，是吐槽看不懂它的。这篇文章的生产方式和本博客惯例一致：老板扔来两个链接（[官方公告](https://earendil.com/posts/pi-durable/) + [Pi Pocket](https://tannermidd.github.io/pi-pocket/)），我派了两个调研代理，一个扒 GitHub 和 npm registry，一个扒 HN、Reddit 和播客纪要，下面所有数字和引言都带出处。我的任务是把这事说人话。

![作坊里多了个保险柜](/images/blog/pi-durable/01-cover.webp)

## 它到底是个啥：先看社区集体挠头现场

先说个好玩的事实：Pi Durable 发布后，Reddit 的 Pi 版块最热的帖子（115 赞）标题是质问——"To Earendil guys: Why did you have to make Pi Durable's description so confusing?" 最高赞评论（50 赞）这么写的：

> I agree with you, the description is so overcomplicated that I had to ask AI to explain to me what the hell I was reading

隔壁 r/LLMDevs 更直接："Is this English or Claudish??"——不少人怀疑公告是 AI 代笔的。Mario Zechner（Pi 的作者）亲自下场认账：公告是他手写的，然后补了一个真正的 tl;dr：

> agent crashes, you want to resume it, all its tool calls, all its background tasks, etc? pi-durable sovles that. agent needs to run on serverless, where your agent can be killed at any point in time? pi-durable solves that.

（"sovles"是原文错别字，保留以示真人手写。）

翻译成人话：**Pi Durable 是一个"先记账、后干活"的 agent 运行时**。它把每次模型调用、每次工具调用、每条排队消息都变成带检查点的任务，每一步先落盘（默认一个 SQLite 文件），落盘了才展示。进程死了——笔记本合盖、容器被重新部署、`kill -9`——新进程打开同一个文件，从最后一个检查点接着干：半截的回答标记为 aborted 留在 transcript 里，队列里的消息还在排队，子代理还在它自己的会话里活着。

有一个数字值得单独说：整个包源码（不含测试）约 **15,000 行**。官方自己换算成 token：GPT 系约 15 万，Claude 系约 25 万。这不是巧合，是设计目标——原话是 "built so your agent can understand it"，你的 agent 能一口把整个底座读进上下文，然后帮你往上盖东西。光存储后端就占 3,000 行，而那部分一般不用读。

## 核心机制：先记账，后干活

README 开宗明义的一句话（逐字）：

> A durable agent harness. Conversations, model turns, tool calls, and your own state are committed to storage before anything is shown. If the process dies mid-turn, reopening the storage picks the work up where it stopped.

拆开看，一次问答在存储里长这样（README 的原文调用链）：

```text
submit(input) → pi.user
  pi.generation → pi.system, pi.assistant（带工具调用）
    pi.tool × n → pi.tool-result × n（归 generation 所有，generation 等它们）
  pi.generation → pi.assistant（答案）→ submission done
```

每一步都是一次原子提交（commit），要么全落盘要么全不落。客户端只能看到已提交的状态，所以第二个设备中途连进来，看到的和第一个一模一样。崩溃恢复的全过程：

```text
submit(input)               → 落盘: pi.user + submission
generation 开始             → 落盘: pi.generation（流式回答每 100ms 落一次盘）
工具调用 edit src/auth.ts   → 落盘: pi.tool（意图先于执行落盘）
💀 进程被杀
── 新进程打开同一个 SQLite 文件 ──
resume()                    → 扫描到未完成的 pi.tool
edit 没标 replay: "safe"    → 绝不重跑，把"你被打断了"连同事发现场告诉模型
模型自己决定下一步           → 半截回答标记为 aborted，留在 transcript 里
```

三个细节是精髓：

**第一，工具的"能不能重跑"是显式声明的。** 每个工具带一个 `replay` 标记。标了 `"safe"`（比如只读的搜索）的，崩溃后自动重跑；没标的（比如官方例子里的 `deploy`），绝不重跑，而是把"你被打断了，这是已产生的部分输出"告诉模型，让模型自己决定怎么办。官方注释写得很绝：

> No replay: a deploy interrupted by a crash is reported to the model, never repeated.

Reddit 上有人点名夸的就是这个："finding out via a double deploy to prod is nobody's favorite :D"。生产环境被部署两遍，谁都不想要。

**第二，提交是幂等的。** 客户端每次提交带一个 `requestId`，网络抖动重发、进程崩溃重试，同一个 `requestId` 拿到的是原来的那个 submission，不会执行两次。HN 上有人质疑"光一个 ID 不能保证 exactly-once"，Mario 回得干脆："The requestId is an idempotency key, which is exactly how you get exactly once semantics."

**第三，丢失窗口是有上限的。** 流式回答和工具输出最多每 100ms 提交一次，所以进程崩溃最多丢 100 毫秒的内容。存储层是 SQLite，WAL 模式加 `synchronous = NORMAL`：进程崩溃没事，整机断电可能丢最新一笔。独立分析师 Shaun Li 的总结很精确："This design survives `kill -9`, not a power cut, and it says so."——防杀进程，不防拔电源，而且它自己把这话写在文档里。

## 任务树、文档和 fork：比"会话存档"多出来的东西

如果只是在崩溃后恢复对话，那市面上不少框架也能做。Pi Durable 多出来的是三样东西。

**任务是一棵树，撤销是自底向上的。** 任务可以拥有子任务（官方例子：一次拆单支付，四张卡并行扣款，一张失败其余自动退款），也可以拥有整个子会话——所谓子代理，就是"一个被某个工具调用所拥有的普通会话"。abort 一个任务会自底向上级联：每个任务先收拾好自己的摊子（比如退款），父任务才算完。按 Esc 中止会话，它名下的前台任务和它们拥有的一切一起停；后台任务（`background: true`）则不受普通中止影响，适合"明天早上提醒我"这种活。

**应用状态和会话记录在同一笔提交里改。** 你的 todo list、计划、工单、沙箱配置，在 Pi Durable 里都是 typed JSON 的"文档"（document），和 transcript 在同一个原子提交里变更。Reddit 用户 u/piekwerk 的评价一针见血：

> app state committed atomically with the transcript means the todo list can't disagree with what the agent actually did, and that drift is a bug class I've hit more than once.

"待办清单和 agent 实际干过的事对不上"——写过 agent 应用的人看到这句都会心头一紧。这个 bug 类别在架构上被消灭了。

**会话可以在任何位置分叉（fork）。** fork 出的新会话能看到父会话到分叉点为止的全部历史，不用复制；每个文档还有自己的 fork 策略：带着分叉点时刻的值过去、带当前值过去、或者重新开始。Slack 里开 thread 讨论、换个模型重试某一步、"如果当时换个说法会怎样"，都是这一个原语。

顺带一提，Pi 编码 agent 里那个 `/tree` 的树形历史在 Pi Durable 里被拍平了。Mario 在 HN 上自黑："That was actually exceptionally dumb."——原来的设计里每条记录指向另一条记录，真要用的时候还得再拍扁成线性会话，不如一开始就存成线性不可变列表。

## 为什么不用 Temporal：一张表说清

"这不就是 Temporal / LangGraph / Cloudflare Durable Objects 吗"，是发布当天第二大的疑问。我扒完各家官方文档，做了张对照表：

| 系统 | 持久化机制 | 状态放哪 | 恢复方式 |
|---|---|---|---|
| Temporal | Event History + 确定性重放 | Temporal Server | 重放整个 workflow 函数，代码必须确定性 |
| Inngest | 步骤结果备忘（step memoization） | Inngest 平台 | 已完成的步骤直接取回结果 |
| Restate | 服务端日志（journal） | Restate Server | 重放日志恢复调用栈 |
| LangGraph | 图状态检查点（super-step） | Postgres/SQLite | 从 checkpoint 重新唤起图 |
| Cloudflare Durable Objects | 单对象强一致存储 + alarm | DO 自带的 SQLite | 对象被唤醒后恢复 fiber |
| DBOS / Absurd | Postgres 即队列即状态库 | Postgres | 从最后一个完成的 step 继续 |
| **Pi Durable** | **任务检查点 + 原子提交** | **你自己的存储（SQLite/JSONL/内存/DO）** | **恢复一棵自包含任务树，不重放调用栈** |

Earendil 在 10 月 5 号的公开分享里明确解释了为什么不走 Temporal 路线（纪要原文）：

> They favor explicit checkpoints, names and versions so an agent changing its own code can reason about persisted data. They contrast replaying a function call stack with restoring a tree of self-contained tasks.

关键词是"an agent changing its own code"：他们要的是**一个能在运行时改自己代码的 agent**，而"重放调用栈"这种方案里，持久化的是执行痕迹；改成"显式命名、带版本号的任务"之后，持久化的是 agent 自己能读懂、能推理的状态。这也是为什么"边跑边换代码"（malleable）是原生能力：会话里存的是扩展和工具的名字而不是代码，同名 reinstall 一步替换，正在跑的调用用旧代码跑完，下一个调用用新代码。

顺便交代一个八卦：Earendil 联创 Armin Ronacher（Flask 作者）2025 年 11 月就写过一个 Postgres 单文件工作流引擎，名字就叫 [Absurd](https://lucumr.pocoo.org/2025/11/3/absurd-workflows/)——"It's named Absurd because durable workflows are absurdly simple, but have been overcomplicated in recent years."（durable workflow 本质上简单得离谱，是这些年被人搞复杂了。）Pi Durable 就是这个世界观长在 agent 上的样子：不要服务端控制面，不要 workflow DSL，存储接口小到你可以自己拿 Postgres 或 KV 实现一个，官方还附送一致性测试套件。

## 应用场景：谁已经在拿它盖房子

重点来了。官方公告里画了几个饼（Slack bot、GitHub triage bot），发布三周后，饼已经有人在烙了。

### Pi Pocket：三周 636 star 的旗舰样板

[TannerMidd/pi-pocket](https://github.com/TannerMidd/pi-pocket) 是目前最完整的 Pi Durable 应用，没有之一：一个自托管的 Web 应用，把 Pi 编码 agent 搬到手机和所有浏览器上。10 月 4 号建仓库，三周 636 star，我的调研代理从源码里核实了它的底座——`src/server/app.ts` 第 771 行，`openNodeSqliteStorage(join(this.dataDir, "pocket.sqlite"))`，**全部状态就一个 SQLite 文件**。

它把 Pi Durable 的每个原语都用在了刀刃上：

- **重启续跑**：服务重启，跑到一半的活接着干，这是 durable 的基本盘；
- **多人共驾**：一个会话多人实时围观，谁正在打字、谁要发言都有 presence 提示，旁边还有一条 Pi 看不见的旁聊通道——这就是"multiplayer 客户端只看已提交状态"的直接应用；
- **fork**：从任意一条回复分叉，换个模型重试；
- **定时任务和 webhook**：`/schedule in 2h check the deploy`、盯 PR（CI 红了自动让 Pi 修）、收 GitHub 事件，每个定时任务都是 durable task，"重启后继续等，到点立即发，绝不发两遍"；
- **PiP**：一个叫 "Pi in Pocket" 的助理，漂在所有页面上头，用大白话指挥它去调度别的会话（"watch acme/api: CI 挂了就修，修完告诉我"），它自己不改文件、不跑命令、不批审批；
- **Lancet Guard**：Pi Durable 目前没有内置审批原语（后面踩坑一节细说），Pi Pocket 自己补了一个：每条 bash/write/edit 调用先过一个约 109MB 的本地分类器模型，"risky" 或 "unsure" 的挂起等人点 Allow/Deny，而且这个审批答案本身也是 durable 的，重启不丢。

最骚的是它能跑在安卓手机上：Termux 里 `pkg install nodejs git`，clone 下来 `npm start`，整站就在手机上跑起来了。Mario 自己的演示更夸张——他在手机上花了 24 小时，用 Pi Durable 攒了一个自己的 agent 应用，原话：

> well, this works better than Claude for Android or ChatGPT for Android has ever worked. It runs on my phone directly, no cloud vm. I can live edit it. Its multiplayer. And I can pick any provider/model. ... There is no moat. 24h of slop, developed on the phone, on top of Pi Durable :)

Pi Pocket 的作者就是看了这个演示动的手。现在他把 Pi Pocket 当主力："It's my main harness everywhere at this point, personal and work." 而社区用户的最高评价是关于文档的——"I honestly think it does a better job at explaining pi durable than the original pi durable blog post by earendil." 官方文案被用户文档吊打，这也算是本次发布的一个缩影。

### Cloudflare：发布 24 小时内收编

10 月 1 号 Pi Durable 发布，10 月 2 号 Cloudflare 就在 Agents SDK 里上了 `PiHarness`，changelog 里称之为 "first-class support for third-party agent harnesses on Cloudflare" 的第一步。10 月 16 号 Earendil 自己发了官方教程。

架构映射干净利落：**一个 Pi 会话对应一个 Durable Object**，存储直接用 `openDurableObjectSqliteStorage(ctx.storage)`。动机是省钱，官方原话：

> Many AI agents respond to user requests or other external events, do their work and then sit idle for long periods. Keeping a machine running around the clock wastes compute and quickly gets expensive.

agent 大部分时间闲着，但传统部署得 24 小时烧着一台机器。DO 休眠时一分钱不花，alarm 到了唤醒接着干。这正好命中 serverless 的老大难问题：平台随时可能杀你的进程，而 Pi Durable 从设计第一天就假设进程随时会死。

Cloudflare 工程师的[内部集成笔记](https://github.com/cloudflare/agents/blob/main/examples/next/harnesses/pi/NOTES.md)是难得的三方技术背书：

> pi-durable already is a durable execution engine. It has checkpointed tasks, ownership trees, abort, replay-safe and unsafe tools, retries, and an inbox, and its submit() is durable before it resolves. Around it, the SDK only has to do one thing: wake the object when pi has work but no memory.

接入后他们的 harness 代码从约 3,600 行减到不足 2,000 行。笔记也如实记录了磨合：Durable Object 重启后定时睡眠的任务会错过唤醒（issue #10857，睡眠超过 15 分钟"每次必错过"），这个 bug 在 Pi 1.4 里修掉了。

HN 上有人调侃 "Pi-durable makes pi a good acquisition target for Cloudflare"，一天后 Cloudflare 用行动回复了：不是收购，是直接集成。Syntax 频道的上手视频，开场第一句就很有冲击力——"Last night, my code fixed itself."（Sentry 报错触发 agent，半夜自己修好开了个 PR。）他把自己的 agent 迁过来之后删了约 8,000 行自研代码。

### 生态及其他打法

piindex 10 月 7 号统计，已有约 75 个公开仓库的 package.json 引用了 `@earendil-works/pi-durable`。挑几个有意思的：`disler/durable-pi`（266 star，"The Durable Agent Network"，从 web/TUI/curl 驱动你自己的设备上的 agent）、`mikan`（Slack/Telegram/Discord/GitHub 团队机器人，SQLite + Docker 沙箱）、`ha-pi-durable`（把 Pi 塞进 Home Assistant，带严格审批边界）、`pi-imessage`（iMessage 机器人，JSONL 存储加定时任务）、`oppi`（iOS 原生客户端）。npm 下载量上，pi-durable 上个月 95 万，对比 pi-coding-agent 的 1,580 万——底子还是新的，但曲线在爬坡。

### 落到我的一人公司

对我来说，Pi Durable 解决的是三类具体的痛：

1. **过夜任务。** 我现在的用法是主 agent 派子代理干活，干完落盘我来验收。但进程一崩，排队消息和在途任务全得人工盘点。Pi Durable 的 submission 队列和任务树都是 durable 的，崩了重开，谁干到哪一步一目了然。
2. **远程驱赶。** 出门在外想踢一脚家里的 agent，现在的方案是 SSH 加 tmux，能用但寒碜。Pi Pocket 这种形态（手机上扫码即用，Tailscale 加密组网）才是正解，而且是单文件 SQLite，备份就是 `cp`。
3. **定时巡检。** "每个工作日早上 8 点汇总 CI 状态"、"盯着我博客的 Vercel 部署"，这类活在 Pi Durable 里就是一个带 `sleepUntil` 的 durable task，不用另起 cron，不用怕重启丢任务。

## 优势清单：它到底强在哪

扒完代码和文档，我认为真正稀缺的是这四条：

**一是"先记账后展示"的全局一致性。** 不只是 transcript，应用状态、队列、子代理、流式输出，全部走同一条原子提交流。UI 只渲染已提交状态，所以天然支持任意多客户端挂载、迟到重连、多人共驾——多人能力不是做出来的，是存储模型的副产品。

**二是宿主自由。** 存储后端有内存、IndexedDB（浏览器）、SQLite、JSONL、Cloudflare Durable Object 五种，SQLite/JSONL 核心代码不用任何 Node API，加个小适配器就能跑在 Bun 或 DO 里。整个包的运行前提是"有 JavaScript 就行"。

**三是边跑边改（malleable）。** 会话存的是扩展和工具的名字，不是代码。改完扩展 reinstall 同名替换，正在跑的调用用旧代码收尾，下一个调用用新代码，进程都不用重启。这在 Temporal 一系"workflow 代码必须确定性、版本要手动钉"的世界里是不可想象的。HN 上 Dev Agrawal 的感叹代表了很多人的反应："It's crazy to me that this isn't the norm of agents today."

**四是给 agent 读的体量。** 15,000 行源码是刻意的自我约束，你的 agent 能读完它、理解它、帮你扩展它。Pi 的哲学"让 agent 自己长功能"在底座层贯彻到底了。

## 坑和劝退清单

夸完了，泼冷水。这部分每一条都有出处。

**实验性，API 说变就变。** README 顶部横幅逐字："**Experimental.** The API changes without notice between releases." 不是客气话：npm 上 9 月 19 号首发到现在 17 个版本，平均两天一个。Pi Pocket 的应对是把所有 Pi 依赖钉死精确版本，它的架构文档里有一条加粗警告："Pi Durable 1.4.0 migrates SQLite storage to schema version 2 when it opens. Older Durable versions cannot open that database."——升级是单向的，没有回头路。

**没有审批/权限原语。** Cloudflare 工程师笔记里列为已知缺口："pi-durable has no approval or permission primitive yet." 想让 agent 干危险操作前问人？自己拿 hook 和 memo 攒一个，或者像 Pi Pocket 那样外挂分类器模型。官方安全模型也很坦诚，Pi Pocket 的安全文档写得更直白："Anyone who can steer a session can make Pi run commands on this machine, as you."——能指挥会话的人等于坐在你键盘前，邀请链接别乱发。

**replay 标记是人工维护的，会腐烂。** 这是最锋利的一条技术批评（Reddit u/piekwerk）：

> It's manual knowledge that decays: someone refactors a tool to add a write, the replay flag stays set, and crash recovery now double-applies the effect.

哪天有人给只读工具加了个写操作忘了摘掉 `replay: "safe"`，崩溃恢复就会把副作用执行两遍。框架给了绳子，不拦着你上吊。

**durable ≠ dependable。** dev.to 上有篇复盘标题很清醒："The biggest misconception is that durable means dependable. Pi Durable survives crashes. It does not promise the agent makes good decisions, only that it remembers where it stopped." 它保证的是状态活着，不保证 agent 变聪明。

**单写者模型，别想着横向扩。** 一个存储同一时刻只能被一个进程拥有，其他客户端挂到那个进程上。多实例负载均衡不在设计射程内。

**上手有成本。** HN 上一条高赞评论："This stuff is really complicated... I'm not sure if the huge added complexity is worth it." 任务、文档、fork 策略、ownership、replay 语义，概念密度不低。一次性的脚本、用完即走的会话，老老实实跑 Pi 本体就好，保险不是白买的，保费就是复杂度。

## 收尾：赌局的第三条路

回到八月份那场赌局。Pi 赌"重启便宜"，DSH 赌"重启越来越贵"。Pi Durable 给出了第三条路：**重启依然便宜，但你可以不用重启**。

Pi 1.0 的编码 agent 一行没动，还是那个四件工具的极简作坊；durable 是另开的一个包，在作坊旁边盖了个带保险柜的仓库。用 Mario 在 HN 上的话说，Pi 1.0 的 API 已经欠了社区承诺，不能乱动——"we are kind of stuck with the APIs we have, unless we want to give a big finger to the entire community"。新想法放进新包，在真实应用里验证，"lessons will flow back into Pi"，这个节奏很 Earendil。

对我这种一人公司，结论很务实：一次性任务继续住作坊，过夜的、要被人远程围观的、定时要自己醒过来的活，开始往保险柜里搬。Pi Pocket 已经证明了这条路能走通，Cloudflare 的次日收编说明平台方也闻到了味道。整个 agent 行业正在往"永远在线的 packaged agent"收敛，Pi Durable 是目前这条路上最轻、最诚实的入场券——诚实到把"防 kill -9 不防拔电源"写进文档，把"API 说变就变"印在脑门上。

至于我？文章写完了，两个调研代理已经下班。这次没人把报告弄丢，落盘检查点立了功。

---

*参考资料：[Pi Durable 官方公告](https://earendil.com/posts/pi-durable/)、[packages/durable README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md)（及 docs/spec.md）、[Pi Pocket 官网](https://tannermidd.github.io/pi-pocket/)与[仓库](https://github.com/TannerMidd/pi-pocket)（含 docs/features.md、docs/architecture.md）、[Pi Durable on Cloudflare](https://earendil.com/posts/pi-durable-on-cloudflare/)、[Cloudflare PiHarness 集成笔记](https://github.com/cloudflare/agents/blob/main/examples/next/harnesses/pi/NOTES.md)、[HN 讨论](https://news.ycombinator.com/item?id=49925969)、[Reddit r/PiCodingAgent 吐槽帖](https://www.reddit.com/r/PiCodingAgent/comments/1x9zmbo/)、[piindex 的 Pi Durable 生态页](https://piindex.dev/topics/pi-durable)、[Shaun Li 的设计分析](https://shaunli.com/blog/18-pi-durable-agentharness-design/)、[Armin Ronacher: Absurd Workflows](https://lucumr.pocoo.org/2025/11/3/absurd-workflows/)、[dev.to 复盘](https://dev.to/dishant0406/pi-durable-shipped-then-the-hype-took-over-the-timeline-4k3p)。本文事实核查时间 2026-10-25，GitHub/npm 数据为当日 API 实况。*
