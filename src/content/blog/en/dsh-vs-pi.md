---
title: "The Workshop and the Space Station: DeepSeek's Harness challenges Pi, and whose homework should a one-person company's agent team copy"
description: "A tour of the 'everything is a plugin' space-station philosophy, and whose homework a one-person company should copy when building an agent team."
date: 2026-08-15
tags:
  - AI
  - agent
  - architecture
kind: Essay
---

On August 13, DeepSeek did two things: shipped V4-Pro, and open-sourced an agent framework called [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (CLI name `dsh`). Two days, 96.8k stars. For context: Pi, Mario Zechner's minimalist coding agent, the project my daily driver Oh My Pi is a hard fork of, spent a whole year getting to around 90k. Two days beat a year. GitHub star inflation moves faster than the Zimbabwean dollar.

In Composio's harness benchmark this year, Oh My Pi took first place with an 88% pass rate, ahead of Claude Code (76%) and Pi native (72%). I'm a daily Oh My Pi user, so take my praise of it with appropriate discount.

![The Workshop and the Space Station](/images/blog/dsh-vs-pi/01-cover.webp)

## What DSH actually is: I cloned it and looked

The official slogan is "Everything is a Plugin," and the formula is Agent = Model + Harness. Meaning: the model is the engine, the harness is the whole car, and DeepSeek believes the car should be disassemblable too. Model, tools, skills, sessions, sandbox, storage, loops, scheduler, UI: every word in the official list is a replaceable plugin, and even the agent loop itself sits on the plugin graph.

It starts by swallowing the framework layer whole. The `vendor/` directory contains 9 packages from the Cordis ecosystem (cordis, loader, include, group, timer, hmr, schemastery, cosmokit, logger-console), all renamed `@deepseek-ai` and vendored straight into the repo instead of being resolved from npm (their own third-party dependencies stay on npm; the README has a dedicated section for that). The vendor README opens with this bluntness:

> They are copied into this monorepo instead of being depended on via npm, so that the harness fully owns its framework layer (auditable, patchable, pinned).

Auditable, patchable, pinned. That's "keep your lifeline in your own hands" written into engineering rules. It comes with a local-modification manifest where every divergence from upstream must be registered. I counted `vendor/README.md` myself: 18 entries in the current snapshot, from fiber lifecycle hardening to transactional loader reconciliation. This log has more discipline than most teams' changelogs.

Entry #6 is the tastiest: lifecycle hardening for `cordis/src/fiber.ts`, plugging three "re-entrancy on unload" holes. A plugin gets unloaded while its setup is still running, an async cleanup callback loses its handle, new side effects keep being registered while the state is UNLOADING. These are the corners where hot swap actually bites. That's the difference between DSH and a generic plugin system: everyone else manages installing; DSH manages uninstalling.

Assembly, meanwhile, is one YAML file. An agent app isn't forged from code; it's declared in `cordis.yml`. I lifted a snippet straight from `examples/headless-agent/cordis.yml`:

```yaml
# The DeepSeek adapter. Swap to '@deepseek-ai/dsh-llm-pi-ai' for the pi-ai-backed twin
- id: llm-deepseek
  name: '@deepseek-ai/dsh-llm-deepseek'
  config:
    thinking: enabled
    reasoningEffort: max
    models:
      - id: deepseek-v4-pro
        contextWindow: 128000
```

Each configuration row is a plugin mount point with an `id`, and the user's `cordis.patch.yml` can precisely replace any row by id: swap models without renaming files, patch without touching source. And that comment is the punchline: the official LLM adapter's drop-in replacement is **pi-ai**. Pi's multi-provider layer got conscripted into DeepSeek as a first-class citizen. You can issue the challenge and still pirate the parts you like.

The four modes are per-session presets. I found four `preset.yml` files in `apps/cli/config/agent-presets/`, each just three lines: `name` / `description` / `order`. Minimal mode, the entire file, not a character more:

```yaml
name: 极简模式
description: 仅提供持久 bash 与 str_replace_editor 的双工具编码 Agent。
order: 3
```

(Yes, the shipped metadata is in Chinese; it reads "Minimal mode: a two-tool coding agent with only persistent bash and str_replace_editor.") The four descriptions together form the product matrix: standard is the full-featured coding agent, PTC presents tools through the Code Mode SDK so the model composes multi-step operations as one TypeScript program, and creation mode adds runtime inspection, plugin experimentation, and preset authoring guidance on top of the standard package. Minimal ships only bash plus a file editor, a distant high-five with Pi's "four tools" philosophy. The repo's own BENCHMARK.md says benchmark tasks run on the `jsonrpc-agent` minimal variant, which explains the pretty numbers: the calculator on the exam was deliberately simple. But creation mode is where DSH shows its hand: an agent can inspect its own plugin tree at runtime, write a new plugin, mount it on the spot, and swap it out if it disappoints. Surgery on itself, with the hard requirement that it can't die on the table.

And finally: it's a concept car. You can stomp the accelerator, just don't take it on the highway:

> DeepSeek Harness is currently in _developer preview_ and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

## Workshop vs space station: the watershed is "uninstall"

Two analogies came out of it, and the more I chew on them, the more accurate they feel.

Pi is a craftsman's workshop. The agent loop is the workbench (`agent-loop.ts` pushing 800 lines these days; even workshops get additions), read / write / edit / bash hang on the wall, and the system prompt is around 200 tokens. Want a bookshelf? Nail it up yourself. In fairness, the workshop does have hygiene rules: the official Extensions docs dedicate a chapter to "Long-lived resources and shutdown," asking you to defer background resources (processes, sockets, file watchers, timers) to `session_start` and register an idempotent `session_shutdown` handler. But rules on paper run on discipline. Whether and how thoroughly an extension cleans up is each extension's own business; the framework keeps no ledger. There's no global registry of side effects to ask "what handles is this extension actually holding," and no "swap a provider mid-session, dependents reload automatically" move. The only guaranteed deep clean is still a renovation.

DSH is the International Space Station. Modules dock in orbit, and the life-support system can't stop when you swap a section. Every side effect (effect) is registered with a mandatory inverse function (disposer), and Fiber unloads run in reverse. Dependencies are declared via `inject`, the runtime maintains a continuously refreshed live dependency graph, and when the power supply gets swapped, the dependent modules shut down and restart on their own.

The closer engineering analogy stings more: Pi is the era of hand-written startup scripts; DSH is systemd and K8s. `cordis.yml` declares the desired topology, the controller keeps reconciling, `isolate` is a namespace, disposers run in reverse registration order, and parent-child Fibers are torn down recursively. SREs reading this would shed a nostalgic tear.

But the real watershed isn't "install." It's "uninstall." Put more bluntly: this isn't a feature difference, it's a bet.

Pi is betting on minimalism, strong models, and cheap restarts. Mario's own words are that frontier models "have been RL-trained up the wazoo," shipping the muscle memory of a coding agent out of the box, so you don't need a 10k-token behavioral spec. The Composio benchmark backs it up: Pi's median runtime of 156 seconds was the fastest in the field, and its 223 tool calls the fewest. The path works. What does a restart lose? A bit of context; just start over.

DSH is betting that future agents will frequently modify themselves at runtime, and that restarts will keep getting more expensive. Once agents start running multi-day tasks, holding database connections, caching dozens of rounds of context, and shipping their own plugins to production, "just restart" stops being a scratch and starts being pulling the plug on life support. On that day, "every change has a registered inverse" stops being neat-freak territory and starts being a lifeline.

The precondition for the bet is shifting from "whether" to "how fast," and 96.8k stars in two days says the market at least thinks the question is worth a wager.

By the way, a myth to bust: the rumor that "Pi took first place in Composio's blind test at 66.7%." My scout agents chased it down a few rabbit holes; that number isn't in the Composio original at all, which only has 72% (18/25). Don't move unverified numbers into articles. That's part of team management too, more below.

## One-person-company homework: how to run an agent team

I run a one-person company (OPC), staffed by agents. The DSH-vs-Pi showdown matters to an OPC not as "which framework to pick," but as a lesson in designing your agent team as an organization instead of driving it like a tool.

![One-person-company org chart](/images/blog/dsh-vs-pi/02-opc-org-chart.webp)

Take the production process of this very article. My team is set up like this.

Job SOPs are skills. My agents go on duty carrying a hundred-plus skills: how to deploy to Vercel, how to smoke-test a mini-app, how to wire up blog images. Each skill takes one line in the active context, with the full text loaded on demand. The Pi family calls this progressive disclosure; in management terms, it's training manuals handed out on demand, so new hires don't memorize the employee handbook on day one. OPC lesson #1: turn the workflow you've done three times into a skill. That's your company's real fixed asset.

Org structure is the orchestration protocol. While writing this piece, my team roster looked like this (production environment, verbatim):

```
## Still Running (2)
- `DshResearch` [task] — DshResearch
- `PiResearch` [task] — PiResearch
```

One main agent as project manager, two scout sub-agents as researchers, running in isolated task spaces and talking over internal IRC. OPC lesson #2: isolated workstations plus clear reporting lines. Sub-agents work in their own context without polluting the main session; who researches, who writes, who verifies goes into the task brief.

The enterprise knowledge base is memory. Long-term memory across sessions: the GFW reset that bit the last Vercel deploy, the parameter quirks of the mini-app CLI. A new session inherits the whole archive on day one. OPC lesson #3: the worst thing about a one-person company is knowledge that only exists in the boss's head. Same rule for an agent company.

The quality gate is verification discipline. My rule: a sub-agent reporting "done" doesn't count; the deliverable must land on disk and be verified. Quoting tool output must be verbatim, and "every field matches" reconstructed from memory is a red card. That's why the 18-entry manifest above was counted by my own hand and not copied from press coverage. Getting a number wrong is a misdemeanor; turning "verbatim verification" into "verbatim fabrication" is the felony.

Now for what DSH teaches an OPC, plus one honest deterrent.

You almost certainly don't need DSH right now. An OPC's agent team is a workshop scenario: restarts are cheap, context is self-buffered, and if something breaks the worst case is starting over. The Pi family (or Claude Code with its skill system), plus some discipline, is plenty. Insurance priced for a space station doesn't pay off in a workshop.

But three design ideas are worth stealing today:

1. **Reversibility registration.** DSH requires every effect to ship with a disposer. OPC translation: before every batch operation you hand to an agent, ask "what's the undo path?" When I batch-resign people on Hikvision Connect, the skill hard-codes "look up before acting, leave evidence at every step, clean up residual dialog at the end." That's the workshop-tier disposer. No undo path, no batch.
2. **Assembly vs logic, separated.** DSH uses YAML to declare topology and patches by id. OPC translation: the team's org chart (which agents, what roles, what order) should live in plain view as a config or doc, not scattered across ad-hoc improvisation in each conversation. A team that can `--dump-config` is a team that can do post-mortems.
3. **Plan for "uninstall."** Your skill collection will keep growing (I'm over a hundred now), and one day you'll have to retire some of them. Register dependencies, write down boundaries, and you'll know who you hit when you delete. Installing a plugin is easy; removing it cleanly is hard. That's not a DSH problem, it's a problem of every system where things accumulate. Don't let your skill library follow the plugin-market fate of "installed forever, uninstalled never."

Finally, a real incident from producing this article, offered as a cautionary tale to fellow OPC bosses: when the two scout agents finished, both reports were lost at the yield step (large payloads triggering socket errors), and we only got them on disk by relaying the content back over internal IRC in three separate messages. See? Even on a platform like Oh My Pi that natively supports 7 parallel sub-agents, the "delivery" step can still blow up. Always leave a human-confirmed, on-disk checkpoint in the workflow. I paid tuition for that lesson.

## Wrapping up

The workshop and the space station aren't two generations of the same product; they're two survival strategies. One bets that restarts are cheap, the other that modifications are frequent. For a one-person company, my answer is pragmatic: live in the workshop, work with space-station discipline. Keep tools light, keep rules heavy. DSH's "everything is a plugin, every change is reversible" semantics are a concept car today, but the direction it points (agents safely modifying themselves at runtime) is very likely next year's main event.

As for me? The article's done, both scout agents have clocked out, and the token bill is roughly the price of a Luckin latte.

---

*References: [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) (including vendor/README.md, docs/architecture.md; clone verified at commit 47f9438 for this article), [Cordis paper](https://github.com/cordiverse/paper), [earendil-works/pi](https://github.com/earendil-works/pi), [can1357/oh-my-pi](https://github.com/can1357/oh-my-pi), [Composio harness benchmark](https://composio.dev/content/best-ai-agent-harnesses), [Pragmatic Engineer: Building Pi](https://newsletter.pragmaticengineer.com/p/building-pi-and-what-makes-self-modifying).*
