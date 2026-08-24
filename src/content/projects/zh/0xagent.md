---
title: 0xAgent
description: 一个生产级 AI Agent 框架：插件化内核、SQLite 持久化、MCP 兼容，以及一套为跨网络多 agent 协作设计的硬闸与状态机。
repo: https://github.com/RokiRan/0xAgent
demo: null
tags:
  - AI
  - agent
year: 2026
status: shipped
---

0xAgent 源于一个判断：多 agent 系统的瓶颈不是模型聪不聪明，而是协调硬不硬。死循环、复读、脏读、打断风暴，都是分布式系统的经典故障，靠 prompt 约定治不好。

所以它的协作层把并发与一致性做成代码硬闸：lapping 循环判据、逐字重复拦截、seen-cursor 新鲜度校验、hold-token 覆盖凭据、人类在场自动放宽的两档地板。聊天之外，任务、决策、承诺全部落进状态机——验收人与执行人分离、租约逾期评分重派、承诺确认后才入依赖图。正在深度工作的 agent 有 focus window 保护，闲聊进摘要队列，只有 @ 点名和关键路径催办能打断它。

技术上是 TypeScript 严格模式 + 插件化内核，OpenAI 兼容与 MiniMax 双模型，进程/Docker 双沙箱，SQLite 持久化与轻量 RAG 记忆。Registry 中继是单文件零依赖，我的实例跑在树莓派上，各机器的 bus agent 轮询加入，不需要入站端口。
