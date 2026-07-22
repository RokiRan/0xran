---
title: Quill
description: A reading-mode CSS layer that turns any blog into something you actually want to read. Drop one stylesheet, get a typographic overhaul.
repo: https://github.com/RokiRan/quill
demo: https://quill.roki.run
tags:
  - design
  - engineering
year: 2026
status: shipped
---

Most personal blogs have the words right and the reading wrong: line lengths too wide, leading too tight, links invisible against a wall of paragraph text. Quill is a single stylesheet you drop in that resets all of that — gently — without touching your markup.

The CSS uses container queries, so it adapts whether it is rendering on a 320-pixel phone or a 1440-pixel monitor. It honors `prefers-color-scheme` out of the box, and has a built-in dark variant with the same palette as this site.

Drop it on any HTML page; no class hooks required. The whole thing is under 4 KB gzipped. Demo above points at a few sample blogs running the layer; the source is permissively licensed.