---
title: MyNavicat
description: A mini Navicat written in native Swift — connect, browse schemas, query, export, and drag-to-migrate across databases. Five things, done properly.
repo: https://github.com/RokiRan/MyNavicatPremium
demo: null
tags:
  - engineering
year: 2026
status: shipped
---

Navicat is powerful, but I use maybe ten percent of it. The other ninety percent is startup bloat and menus I never open. So I wrote myself a mini version: SwiftUI + mysql-nio, pure Swift, native macOS, MySQL only — because MySQL is what I use.

The feature set is deliberately narrow: connection management, table structure, data browsing, SQL queries, export (CSV/JSON/SQL), plus the one feature I wanted most — **drag-to-migrate**: drag tables from the object view onto any database in the sidebar (across connections too), and it creates the target database, moves structure and data, logs per table, and rolls back entirely on failure.

What you lose in feature count you gain in edge-case discipline: BLOBs round-trip losslessly as `X'hex'` literals, each table migrates in its own transaction with foreign-key checks disabled, and migrating onto the source itself is refused outright. The core library has zero UI dependencies and is covered by 16 integration tests running against a real MySQL. It is under active maintenance — PostgreSQL support, cell editing, and SSH tunneling are on the roadmap.
