---
title: OneShell
description: An all-in-one desktop terminal and server management studio — SSH, SFTP, port forwarding, monitoring, and an AI assistant in a single Tauri app.
repo: https://github.com/RokiRan/OneShell
demo: null
tags:
  - engineering
year: 2026
status: shipped
---

OneShell started from a mundane annoyance: whenever I managed servers, my screen was a patchwork of a terminal, FileZilla, htop, and a sticky note full of tunneling commands. Every tool lived in its own silo, and my brain was the integration layer.

So it puts all of that in one window: a multi-tab SSH terminal (xterm.js over russh), a native SFTP file panel, per-host local/remote/dynamic port forwarding, and live CPU/memory/disk/network metrics. Most recently, an AI assistant on top of the terminal context — it can see your current session output, so you can just ask "what does that error mean."

Under the hood it's Tauri 2 with a Rust backend and a Vue 3 frontend, in a ~10 MB binary. It is my most complete full-stack work to date: from the async SSH session pool in Rust to the panel layout on the frontend, written end to end by one person — and still actively maintained today.
