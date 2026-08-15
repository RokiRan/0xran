---
title: 作坊与空间站：DeepSeek Harness 叫板 Pi，一人公司的 Agent 团队该抄谁的作业
description: 聊聊"一切皆插件"的空间站哲学，以及一人公司搭 Agent 团队到底该学谁。
date: 2026-08-15
tags:
  - AI
  - agent
  - architecture
kind: 随笔
---

8 月 13 日，DeepSeek 干了两件事：发 V4-Pro，顺手开源了一个叫 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（CLI 名 `dsh`）的 Agent 框架。两天，96.8k star。什么概念？Pi，Mario Zechner 的极简编码 Agent，我日常用的 Oh My Pi 就是它的 hard fork，折腾了一年也才 90k 上下。两天超过一年，GitHub 的星星通胀比津巴布韦币还快。

Composio 今年的 harness 横评里，Oh My Pi 以 88% 通过率拿了第一，Claude Code 76%，Pi 原生 72%。我自己就是 Oh My Pi 的日常用户，所以后面夸它的部分，各位自行打折。

![作坊与空间站](/images/blog/dsh-vs-pi/01-cover.webp)

## DSH 到底是个啥：我 clone 下来看了

官方口号是 "Everything is a Plugin"，公式是 Agent = Model + Harness。意思是：模型是发动机，harness 是整车，DeepSeek 认为整车也该能拆。模型、工具、技能、会话、沙箱、存储、循环、调度、UI，官方清单里每一个词都是可替换插件，连 Agent loop 自己都在插件图上。

第一，它把框架层整个吞了。`vendor/` 目录里躺着 9 个 Cordis 生态的包（cordis、loader、include、group、timer、hmr、schemastery、cosmokit、logger-console），全部改姓 `@deepseek-ai`，源码直接 vendor 进仓库、不走 npm 依赖（它们自己的第三方依赖仍留在 npm，README 有专门一节交代）。vendor README 开头写得很直白：

> They are copied into this monorepo instead of being depended on via npm, so that the harness fully owns its framework layer (auditable, patchable, pinned).

可审计、可打补丁、可锁定，这是把"命根子捏在自己手里"写进了工程规范。配套的还有一份本地修改清单，每条与上游的分歧都必须登记。我数了一下 `vendor/README.md`，当前快照 18 条，从 fiber 生命周期加固到 loader 事务化调和，条条见血。这文档的纪律性比很多团队的 changelog 强。

清单第 6 条最有嚼头：`cordis/src/fiber.ts` 生命周期加固，堵住三个"重入卸载"的洞。插件在 setup 跑到一半时被卸载、异步清理函数失联、UNLOADING 状态还在注册新副作用，全是热插拔真正会咬人的边角。这就是 DSH 和一般插件系统的区别：别人管装，它管拆。

第二，组装方式是一份 YAML。一个 Agent 应用不是代码捏出来的，是 `cordis.yml` 声明出来的。我从 `examples/headless-agent/cordis.yml` 里薅一段原文：

```yaml
# The DeepSeek adapter. Swap to '@deepseek-ai/dsh-llm-pi-ai' for the pi-ai-backed twin
- id: llm-deepseek
  name: '@deepseek-ai/dsh-llm-deepseek'
  config:
    thinking: enabled
    reasoningEffort: max
    models:
      - id: deepseek-v4-pro
        contextWindow: 128000
```

每行配置是一个带 `id` 的插件挂载点，用户层的 `cordis.patch.yml` 可以按 id 精准替换任何一行，改模型不换文件，打补丁不动源码。另外那行注释亮了：官方 LLM 适配器的平替是 **pi-ai**，Pi 的多 Provider 层被 DeepSeek 收编成一等公民。叫板归叫板，好用的零件照拆不误。

第三，四种模式是 per-session 的预设。我在 `apps/cli/config/agent-presets/` 翻到四份 `preset.yml`，每份只有 `name` / `description` / `order` 三行。比如极简模式，整份文件就长这样，一个字不多：

```yaml
name: 极简模式
description: 仅提供持久 bash 与 str_replace_editor 的双工具编码 Agent。
order: 3
```

四份的 description 连起来就是产品矩阵：标准模式是功能完整的编码 Agent，PTC 模式把工具经 Code Mode SDK 呈现、让模型写一个 TypeScript 程序组合多步操作，创造模式在标准模式全家桶上再加运行时检查、插件实验和 preset 创作指导。极简模式只给 bash 加文件编辑器两件工具，和 Pi 的"四件工具"哲学隔空击掌。仓库里的 BENCHMARK.md 写明基准任务跑的是 `jsonrpc-agent` 的 minimal variant，难怪分数好看，考试用的计算器本来就简单。而创造模式才是 DSH 的真心话：Agent 可以在运行时检查自己的插件树、写个新插件当场挂上、不满意再换掉。自己给自己动手术，还要求不能死在手术台上。

第四，这是概念车，油门能踩，别上高速：

> DeepSeek Harness is currently in _developer preview_ and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**


## 作坊 vs 空间站：分水岭在"拆"

总结出两组类比，越琢磨越觉得准。

Pi 是工匠的作坊。Agent 循环当工作台（如今 `agent-loop.ts` 已长到近 800 行，作坊也在扩建），read / write / edit / bash 四件工具挂墙上，系统提示词 200 token 上下。要书架？自己钉。公平地说，作坊也有卫生公约：官方 Extensions 文档专门有一章 "Long-lived resources and shutdown"，要求后台资源（进程、socket、文件监听、定时器）推迟到 `session_start` 再开，并注册幂等的 `session_shutdown` 清理。但公约靠自觉，拆不拆、拆得干不干净是各扩展自己的德行，框架不记账。没有全局的副作用台账可查"这个扩展到底攥着哪些句柄"，更没有"运行中换掉一个 Provider、依赖它的扩展自动重载"这种操作。大扫除的终极保证，仍然是重新装修。

DSH 是国际空间站。模块在轨对接，换舱段时生命维持系统不能停。每个副作用（effect）登记时强制附带逆函数（disposer），Fiber 卸载时逆序回收；依赖用 `inject` 声明，运行时维护一张持续刷新的活依赖图，供电系统换了，依赖它的模块自动停机再重启。

工程上的近类比更扎心：Pi 像手写启动脚本的时代，DSH 像 systemd 和 K8s。`cordis.yml` 声明期望拓扑、控制器持续 reconcile、`isolate` 是 namespace、disposer 按注册逆序执行、父子 Fiber 递归级联卸载。运维同学看了会流下亲切的泪水。

但真正的分水岭不在"装"，在"拆"。说得更狠一点：这不是功能差异，是赌局。

Pi 赌的是极简、强模型、重启便宜。Mario 的原话是前沿模型 "have been RL-trained up the wazoo"，自带编码 Agent 的肌肉记忆，用不着一万 token 的行为规范。Composio 横评里 Pi 中位耗时 156 秒全场最快、工具调用 223 次全场最少，这条路确实跑通了。重启丢了什么？丢点上下文而已，重来就是。

DSH 赌的是未来 Agent 会频繁地在运行时改装自己，而重启会越来越贵。等 Agent 开始跑几天几夜的长任务、挂着数据库连接、缓存着几十轮上下文、自己写的插件在生产环境里服役，"重启一下"就从挠痒痒变成拔呼吸机。到那天，"每个改动都有登记在案的逆操作"就不是洁癖，是救生索。

赌局成立的前提正在从"会不会"变成"多快"，两天 96.8k star 说明市场至少认为这个问题值得押注。

顺带辟个谣：坊间流传"Pi 在 Composio 盲测 66.7% 拿第一"，我的调研代理追了一圈，Composio 原文里根本没有这个数字，只有 72%（18/25）。未确认的数字别往文章里搬。这也是团队管理的一部分，后面细说。

## 一人公司抄作业：Agent 团队怎么管

我开的是一人公司（OPC），员工是一群 Agent。DSH 和 Pi 这场架对 OPC 的价值不在"选哪个框架"，在于把 Agent 团队当组织来设计，而不是当工具来使唤。

![一人公司的组织架构图](/images/blog/dsh-vs-pi/02-opc-org-chart.webp)

拿这篇文章的生产过程举例，我家团队是这么搭的。

岗位 SOP 就是 skills。我的 Agent 上岗前装着一百来个 skill：怎么部署 Vercel、怎么验小程序、怎么给博客配图。每个 skill 在活跃上下文里只占一行描述，用到才加载全文。Pi 系管这叫渐进披露，换成管理学术语就是培训手册按需发放，新员工不用第一天背完员工手册。OPC 第一课：把重复干第三遍的流程固化成 skill，那是公司真正的固定资产。

组织架构就是编排协议。写这篇时我的团队编制长这样（生产环境实况，逐字）：

```
## Still Running (2)
- `DshResearch` [task] — DshResearch
- `PiResearch` [task] — PiResearch
```

一个主 Agent 当项目经理，两个调研子代理当研究员，跑在隔离的 task space 里，用内部 IRC 通信。OPC 第二课：隔离工位加明确汇报线。子代理在独立上下文里干活，不污染主会话；谁调研、谁动笔、谁验证，写进任务书。

企业知识库就是 memory。跨会话的长期记忆：上次 Vercel 部署被 GFW 重置的坑、小程序 CLI 的参数怪癖，都存在那儿，新会话入职即继承。OPC 第三课：一人公司最怕知识只存在老板脑子里，Agent 公司同理。

质量门禁就是验证纪律。我的规矩是子代理汇报"完成"不算数，交付物必须落盘验证；引用工具输出必须逐字，凭记忆重构的"逐字段落"是红牌。上面那份 18 条修改清单就是我亲手数过的，不是抄媒体报道。数错事小，把"逐字取证"写成"逐字编故事"事大。

再说 DSH 给 OPC 的启示，以及一个诚实的劝退。

你现在大概率不需要 DSH。一人公司的 Agent 团队是作坊场景：重启便宜、上下文自己兜着、改坏了大不了重来。Pi 系或者 Claude Code 这种带 skill 体系的，加一套纪律，完全够用。给空间站买的保险，作坊用不上。

但有三条设计思想今天就该偷过来：

1. **可逆性登记。** DSH 要求每个 effect 附带 disposer。OPC 版翻译：每次让 Agent 做批量操作，先问"撤销路径是什么"。我给海康互联批量操作离职，skill 里写死了"先查后动、每步留证、最后清理残留 dialog"，这就是作坊版的 disposer。没有撤销路径的操作，不配批量。
2. **装配与逻辑分离。** DSH 用 YAML 声明拓扑、按 id 打补丁。OPC 版翻译：团队的编制（哪些 agent、什么职责、什么顺序）应该写在明处的配置或文档里，而不是散落在各次对话的临场发挥里。能 `--dump-config` 的团队，才能复盘。
3. **为"拆"做准备。** 你今天的 skill 会越攒越多（我一百多个了），迟早要淘汰一批。登记依赖、写清边界，删的时候才知道会砸到谁。插件装上容易拔出来难，这不是 DSH 的问题，是所有攒东西的系统的问题。你的 skill 库，别步那些"装上就卸不掉"的插件市场的后尘。

最后送各位 OPC 老板一个真实事故当反面教材：两个调研代理干完活，报告都在 yield 环节丢了（大 payload 触发 socket 错误），最后靠内部 IRC 分三条消息接力传回来才落的盘。看见没，就算是 Oh My Pi 这种原生支持 7 路并行子代理的平台，"交付"这一步照样会翻。流程里永远留一个人工确认的落盘检查点，这是我交了学费换来的。

## 收尾

作坊和空间站不是新旧两代产品，是两种生存策略：一个赌重启便宜，一个赌改装频繁。对一人公司，我的答案很务实：住在作坊里，按空间站的纪律干活。工具选轻的，规矩立重的。DSH 那套"一切皆插件、每次改动可逆"的语义，今天是概念车，但它指的方向（Agent 在运行时安全地改装自己）大概率是下一年的主赛道。

至于我？文章写完了，两个调研代理已经下班，Token费用约等于一杯瑞幸。

---

*参考资料：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)（含 vendor/README.md、docs/architecture.md，本文 clone 取证版本 47f9438）、[Cordis 论文](https://github.com/cordiverse/paper)、[earendil-works/pi](https://github.com/earendil-works/pi)、[can1357/oh-my-pi](https://github.com/can1357/oh-my-pi)、[Composio harness 横评](https://composio.dev/content/best-ai-agent-harnesses)、[Pragmatic Engineer: Building Pi](https://newsletter.pragmaticengineer.com/p/building-pi-and-what-makes-self-modifying)。*
