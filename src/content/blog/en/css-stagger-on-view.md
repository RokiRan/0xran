---
title: Stagger animations on view, without a library
description: A tiny IntersectionObserver setup and a CSS custom property. That is the whole trick.
date: 2026-06-28
tags:
  - engineering
  - design
kind: Engineering
---

Every static site eventually wants the same flourish: elements that fade up into place as you scroll, slightly staggered so the page feels alive. The naïve answer is to drop in a 40 KB animation library. The better answer is 12 lines of JavaScript.

## The CSS

Each animatable element gets a `.fade-up` class. The class hides the element and applies a transition that lifts it back into place. The stagger comes from a custom property `--i` set inline on each child: `--i: 0`, `--i: 1`, `--i: 2`, and so on.

> The custom property is the trick. You write the animation logic once, and the stagger becomes a number you can pass anywhere.

## The JavaScript

An IntersectionObserver that adds an `is-in` class when the element first crosses into view. That is it. The CSS handles everything else; the observer only fires once per element so there is no thrash.

## Three details that matter

- Cap the delay. With twelve items, `--i: 11` × 70ms is 770ms of waiting — too long.
- Disable the animation under `prefers-reduced-motion`. Set `opacity: 1; transform: none`.
- Use a transition, not a keyframe animation. Transitions are interruptible; keyframes are not.

That is the whole pattern. The framework version of this runs to 14 KB. The native version runs to under 200 bytes.
