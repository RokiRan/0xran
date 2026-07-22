---
title: Pairing a serif with CJK — what I learned
description: Notes on font stacks for bilingual sites after a month of testing Newsreader and Noto Serif SC.
date: 2026-05-19
tags:
  - design
kind: Design
---

Bilingual sites fail in one of two ways: either the Latin display face looks grafted onto the Chinese text, or the Chinese text looks grafted onto the Latin display face. The fix is rarely a third font — it is choosing one Latin face whose vertical metrics match the CJK fallback you are stuck with.

## The metric that matters is x-height

Most "harmonious pairs" articles focus on style: do the serifs match, do the colors of the bowls agree. None of that matters at body size. What matters is whether the lowercase `x` in the Latin face is visually the same height as the average ideograph.

Newsreader and Noto Serif SC happen to align closely. That is why this site uses them. Neither was designed with the other in mind; they just live in the same neighborhood of the metric space.

> Choose your Latin display face first, then find the CJK face whose x-height matches it. Not the other way around.

## What I tried that did not work

- Pairing Source Serif Pro with Source Han Serif — looks great in isolation, falls apart at body sizes where the Latin x-height reads too small.
- Treating `system-ui` as a Chinese fallback — works on Mac (PingFang SC), fails on Windows (Microsoft YaHei), looks like two different sites.
- Setting `font-feature-settings: "palt"` on Chinese runs — causes the punctuation to drift off the baseline by 2-3 pixels. Skip it.

## What I kept

One font stack per role. Display = serif (Newsreader + Noto Serif SC). Body = sans (Inter + PingFang SC). Mono = JetBrains Mono. No mixing inside a single role. The discipline matters more than the choice.
