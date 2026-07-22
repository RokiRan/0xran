---
title: Camp
description: A minimal static-site framework for writers. Markdown in, performant HTML out. No client JS by default.
repo: https://github.com/RokiRan/camp
demo: null
tags:
  - engineering
  - meta
year: 2025
status: shipped
---

Camp is the static-site generator behind this very site. It started as a personal opinion: most personal sites do not need a framework, a build pipeline, or a runtime — they need a folder of Markdown files and a CSS file you wrote by hand.

The framework is intentionally small. There is no plugin system, no theme marketplace, and no client-side hydration. Pages are pre-rendered at build time; the only JavaScript that ships is what you write yourself, and most pages ship none.

What you trade is flexibility for peace: nothing in your site can break because of a dependency update, a runtime change, or a server outage. It is, in the truest sense, a static camp.