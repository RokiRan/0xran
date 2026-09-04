---
title: Edg Agent
description: An LLM agent living in the Chrome sidebar — give it tasks in plain language and it reads page snapshots, emits one JSON action per turn, and clicks and types for you, asking first before anything risky.
repo: https://github.com/RokiRan/edg-agent
demo: null
tags:
  - AI
  - Chrome
  - agent
year: 2026
status: wip
---

No new browser, no remote control — just an employee working in the Chrome sidebar. An MV3 extension built with WXT + React 19 + TypeScript, talking to OpenAI, DeepSeek, or any compatible endpoint, with keys stored locally only.

The agent loop runs "page snapshot → one JSON action → CDP execution": text snapshots list only interactive elements, the model returns a single action per turn — slower, but every step is auditable. Input goes through real CDP events first, with DOM fallback marked in receipts. Component-library dropdowns (antd / element-plus) get a built-in two-step recipe, `ask_user` options render as buttons, and a 64px floating orb shows while it thinks.

High-risk actions (pay, delete, submit, order) are intercepted by a keyword regex and paused behind a confirmation card with three choices: deny, allow, or always allow for this session (in-memory, never persisted). E2E runs against a zero-dependency deterministic mock LLM state machine covering search, confirmation, canvas visual fallback, and format-tolerance scenarios — cheap and never moody.
