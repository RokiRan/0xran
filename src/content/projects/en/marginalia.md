---
title: Marginalia
description: A reading tool that lives in the margin. Annotate anything on the web; keep your notes portable, searchable, and yours.
repo: https://github.com/RokiRan/marginalia
demo: https://marginalia.roki.run
tags:
  - engineering
  - design
year: 2026
status: wip
---

Marginalia started as a personal annoyance: I wanted to highlight a paragraph in a long essay and find it again six months later, but every tool I tried either locked my notes inside someone else's app or demanded a subscription before the highlight even landed.

The current build is a small browser extension plus a local-first notes store. Highlights live as plain Markdown in a folder you choose; sync is opt-in via the file system or any Git remote. There is no server I run, which means there is also no way for me to read your notes — and that is the point.

The next milestone is a reading-mode companion stylesheet so highlights stay legible on ugly blog themes, and a tiny CLI for grepping your library from the terminal. Rough timeline is end of summer.