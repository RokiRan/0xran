---
title: A plain-text work log that actually stuck
description: Three years of trying. What finally worked was a file format I could grep.
date: 2026-04-02
tags:
  - notes
  - engineering
kind: Notes
---

I have started a work log every January for the past four years. Each time I picked a different tool: Notion, Obsidian, a custom CLI, an Apple Note. Each time the log died around March. Not because I lost the habit, but because the tool died — the app wanted an update, the schema felt stale, the entries became write-only.

## What was different this time

The format. One line per entry. ISO date, a project tag in brackets, then a sentence. No nested sections, no markdown headings, no tags inside tags.

That is the whole format. It looks like:

`2026-04-02 [marginalia] figured out why the extension would not load on Firefox.`

> When the entry fits on one line, you will write it. When it requires choosing a section, you will not.

## Three months in, what I have learned

- `grep '\[marginalia\]' log.txt` is faster than any project dashboard.
- I never look at the log I wrote last January. I only look at the log I wrote yesterday.
- The discipline of one sentence per entry is the entire feature. Everything else is decoration.

The tool I built around this is called [Trace](../projects/trace.html). It does four things — append, grep, diff, graph — and nothing else. That is enough. The log itself is a plain text file I can read with `cat`, edit with `nano`, and back up with `git`. It will outlive the tool.
