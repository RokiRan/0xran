---
title: OneShell
description: 一个 all-in-one 的桌面终端与服务器管理工作台：SSH、SFTP、端口转发、监控、AI 助手，装进一个 Tauri 应用里。
repo: https://github.com/RokiRan/OneShell
demo: null
tags:
  - engineering
year: 2026
status: shipped
---

OneShell 源于一个朴素的烦恼：管服务器的时候，我的屏幕上永远同时开着终端、FileZilla、htop 和一个写着转发命令的便签。每个工具都各自为政，上下文全靠我的脑子串联。

所以它把这些东西塞进了一个窗口：多标签 SSH 终端（xterm.js + russh）、原生 SFTP 文件面板、按主机配置的本地/远程/动态端口转发，外加实时 CPU/内存/磁盘/网络监控。最近在终端上下文之上又加了一个 AI 助手——它看得到你当前会话的输出，你可以直接问"刚才这个报错是什么意思"。

技术上是 Tauri 2 + Rust 后端 + Vue 3 前端，整个二进制约 10 MB。这是我"全栈"意义上最完整的一个作品：从 Rust 的异步 SSH 会话池，到前端的面板布局，一个人从头写到尾——并且至今仍在持续维护。
