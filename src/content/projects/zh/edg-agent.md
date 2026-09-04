---
title: Edg Agent
description: Chrome 侧边栏里的 LLM Agent 扩展：自然语言派活，它自己读页面快照、输出单个 JSON 动作、点按钮填表单，高危操作先问过你。
repo: https://github.com/RokiRan/edg-agent
demo: null
tags:
  - AI
  - Chrome
  - agent
year: 2026
status: wip
---

不造新浏览器，也不远程遥控，直接在 Chrome 侧边栏里放一个能干活的员工。基于 WXT + React 19 + TypeScript 的 MV3 扩展，接 OpenAI / DeepSeek 或任意兼容接口，Key 只存本机。

Agent 循环走「页面快照 → 单个 JSON 动作 → CDP 执行」：文本快照只列可交互元素，模型每轮回一个动作，慢但每一步可审计。输入优先 CDP 真事件，DOM 兜底会在回执里标注。组件库下拉（antd / element-plus）内置两步法教案，`ask_user` 选项渲染成按钮，思考时有 64px 悬浮动画球。

高危动作（支付、删除、提交、下单）被关键词正则拦下，弹确认卡给三个选择：拒绝、允许、本次会话始终允许（内存态，不落盘）。E2E 用一只零依赖的确定性 mock LLM 状态机跑，覆盖搜索、确认、canvas 视觉兜底、格式容错等场景，便宜且永不闹情绪。
