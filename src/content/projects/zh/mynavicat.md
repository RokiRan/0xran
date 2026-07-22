---
title: MyNavicat
description: 用 Swift 原生写的迷你版 Navicat：连接、看结构、查数据、导出、拖拽跨库迁移，只做这五件事，但做扎实。
repo: https://github.com/RokiRan/MyNavicatPremium
demo: null
tags:
  - engineering
year: 2026
status: shipped
---

Navicat 很强，但强到我日常用到的功能可能不到百分之十。剩下的百分之九十，是启动时加载的臃肿和我永远用不上的菜单。于是我给自己写了一个迷你版：SwiftUI + mysql-nio，纯 Swift，macOS 原生，只支持 MySQL——因为我只用 MySQL。

功能刻意收敛：连接管理、表结构、数据浏览、SQL 查询、导出（CSV/JSON/SQL），外加一个我自己最想要的功能——**拖拽即迁移**：把表从对象视图直接拖到侧栏的另一个数据库（可以跨连接），自动建库、搬结构、搬数据、逐表日志，失败整体回滚。

省掉的是功能列表，换来的是对边界的较真：BLOB 用 `X'hex'` 字面量保证二进制往返不丢数据，迁移每表一个事务、复制期间关外键检查、同库同源直接拒绝执行。核心库无 UI 依赖，配了 16 个连真实 MySQL 跑的集成测试。目前在持续维护中，路线图上有 PostgreSQL 支持、单元格编辑和 SSH 隧道。
