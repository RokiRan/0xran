---
title: 0xAgent
description: A production-grade AI agent framework — plugin kernel, SQLite persistence, MCP-compatible, with hard gates and state machines designed for cross-network multi-agent collaboration.
repo: https://github.com/RokiRan/0xAgent
demo: null
tags:
  - AI
  - agent
year: 2026
status: shipped
---

0xAgent starts from one judgment: the bottleneck of multi-agent systems is coordination hardness, not model smarts. Infinite loops, parroting, dirty reads, interruption storms — classic distributed-systems failures that prompt conventions cannot cure.

So its collaboration layer builds concurrency and consistency into hard gates in code: a lapping loop criterion, verbatim-duplicate rejection, seen-cursor freshness checks, hold-token override credentials, and a two-tier floor that relaxes when a human is present. Beyond chat, tasks, decisions, and commitments all live in state machines — approver separated from owner, scored reassignment on lease expiry, promises entering the dependency graph only after confirmation. Agents in deep work are protected by a focus window: small talk goes to a digest queue, and only direct @mentions and critical-path nudges can interrupt.

Technically it is strict-mode TypeScript on a plugin kernel, with OpenAI-compatible and MiniMax model providers, process and Docker sandboxes, SQLite persistence, and lightweight RAG memory. The registry relay is a single zero-dependency file — my instance runs on a Raspberry Pi, and bus agents on any machine join by polling, no inbound ports required.
