---
title: Trace
description: A CLI for keeping plain-text work logs you can grep, diff, and graph. Replaces the half-dozen trackers I kept abandoning.
repo: https://github.com/RokiRan/trace
demo: null
tags:
  - engineering
year: 2025
status: shipped
---

I have tried every productivity tracker released in the last ten years. They all share a single failure mode: as soon as the database becomes the source of truth, the entries become write-only. You log for a month, then you log less, then you stop, then the app gets abandoned, and your data lives inside a defunct .sqlite you cannot grep.

Trace is the opposite. Every entry is a line in a Markdown file you own. There is no schema; the format is human enough to read with `cat` and structured enough to query with `grep`. One line per entry: timestamp, project tag, sentence.

The interesting commands are `trace graph` (renders last 30 days as an SVG bar chart) and `trace diff` (compares two log files week over week). Both are pure shell — no telemetry, no API calls.