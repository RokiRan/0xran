---
title: "Even the Workshop Bought Insurance: Pi Durable, Explained"
description: "What Pi Durable is, what problem it solves, how it differs from Temporal and friends, and who is already building on it — a plain-language deep dive with community reactions, measured numbers, and a list of the pitfalls to avoid."
date: 2026-10-25
tags:
  - AI
  - agent
  - architecture
kind: Essay
---

Last August I wrote [The Workshop and the Space Station](./dsh-vs-pi.html) and ended on a bet: Pi was betting that "restarts are cheap", DeepSeek Harness was betting that "restarts keep getting more expensive". On October 1, the workshop bought itself insurance.

Earendil dropped an experimental new package [on the same day Pi 1.0 shipped](https://earendil.com/posts/pi-durable/): **Pi Durable**, billed as the foundation for agents that "run for a long time, can't be killed, and change their own code while running". Three weeks later: 515 points on Hacker News, Cloudflare folding it into its own Agents SDK the day after release, and 75 third-party repos referencing it according to piindex.

But the hottest community thread wasn't praise, it was collective bewilderment. The production method here matches the house rules: the boss threw two links over the wall ([the official announcement](https://earendil.com/posts/pi-durable/) + [Pi Pocket](https://tannermidd.github.io/pi-pocket/)), I sent out two research agents — one digging through GitHub and the npm registry, one through HN, Reddit and podcast transcripts — and every number and quote below comes with a source. My job is to say it in plain English.

![A safe in the workshop](/images/blog/pi-durable/01-cover.webp)

## What it actually is: first, the community scratching its head

Here's the fun part. After Pi Durable shipped, the top post in Reddit's Pi subreddit (115 upvotes) had a title that was a straight accusation: "To Earendil guys: Why did you have to make Pi Durable's description so confusing?" The top comment (50 upvotes) read:

> I agree with you, the description is so overcomplicated that I had to ask AI to explain to me what the hell I was reading

Neighbouring r/LLMDevs was blunter: "Is this English or Claudish??" — plenty of people suspected the announcement was AI ghostwritten. Mario Zechner (Pi's author) came out and owned it: the announcement was hand-written by him, and then he added an actual tl;dr:

> agent crashes, you want to resume it, all its tool calls, all its background tasks, etc? pi-durable sovles that. agent needs to run on serverless, where your agent can be killed at any point in time? pi-durable solves that.

("sovles" is the original typo — kept verbatim, because it proves a human typed it.)

Plain English: **Pi Durable is an agent runtime that does the bookkeeping first and the work second.** Every model call, every tool call, every queued message becomes a checkpointed task; each step is written to disk first (a SQLite file by default), and only shown after it's on disk. The process dies — laptop lid closed, container redeployed, `kill -9` — a new process opens the same file and picks up at the last checkpoint: half-finished answers stay in the transcript marked aborted, queued messages stay queued, subagents stay alive inside their own sessions.

One number deserves its own paragraph: the whole package's source, excluding tests, is about **15,000 lines**. The official conversion to tokens: roughly 150k for the GPT family, 250k for the Claude family. That's not a coincidence, it's the design goal — the original wording is "built so your agent can understand it". Your agent can swallow the whole foundation in one gulp and then build on top of it. The storage backend alone is 3,000 lines, and that part usually doesn't need reading.

## The core mechanism: bookkeeping first, work second

The README opens with one sentence, verbatim:

> A durable agent harness. Conversations, model turns, tool calls, and your own state are committed to storage before anything is shown. If the process dies mid-turn, reopening the storage picks the work up where it stopped.

Take it apart and a single exchange looks like this in storage (the README's own call chain):

```text
submit(input) → pi.user
  pi.generation → pi.system, pi.assistant (with tool calls)
    pi.tool × n → pi.tool-result × n (owned by generation; generation waits for them)
  pi.generation → pi.assistant (the answer) → submission done
```

Every step is one atomic commit: all of it lands or none of it lands. Clients only ever see committed state, so a second device joining mid-flight sees exactly what the first device sees. And here's the whole crash-recovery dance:

```text
submit(input)               → committed: pi.user + submission
generation starts           → committed: pi.generation (streaming answer persisted every 100ms)
tool call edit src/auth.ts  → committed: pi.tool (intent lands before execution)
💀 process killed
── a new process opens the same SQLite file ──
resume()                    → finds the unfinished pi.tool
edit has no replay: "safe"  → never re-run; the model is told "you were interrupted"
                              along with the state of play, and decides its own next step
                              (the partial answer stays in the transcript, marked aborted)
```

Three details carry the entire thing.

**First, whether a tool can be re-run is explicitly declared.** Every tool carries a `replay` flag. Tools marked `"safe"` (a read-only search, say) re-run automatically after a crash; tools without the flag (the official example's `deploy`) never re-run — instead the model gets told "you were interrupted, here is the partial output so far" and decides for itself what to do next. The official comment is wonderfully blunt:

> No replay: a deploy interrupted by a crash is reported to the model, never repeated.

What people on Reddit singled out for praise was exactly this: "finding out via a double deploy to prod is nobody's favorite :D". Nobody wants to learn about the double deploy the hard way.

**Second, submissions are idempotent.** Every client submission carries a `requestId`; a network-hiccup resend or a crash retry with the same `requestId` gets the original submission back and never executes twice. On HN someone objected that "just an ID can't guarantee exactly-once", and Mario's reply was short: "The requestId is an idempotency key, which is exactly how you get exactly once semantics."

**Third, the loss window is bounded.** Streaming answers and tool output commit at most every 100ms, so a process crash loses at most 100 milliseconds of content. The storage layer is SQLite in WAL mode with `synchronous = NORMAL`: a process crash is fine, a full power cut may lose the most recent write. Independent analyst Shaun Li's summary is precise: "This design survives `kill -9`, not a power cut, and it says so." — it survives the process kill, not the yanked power plug, and it says so in its own docs.

## Task trees, documents and forks: what it adds beyond session archiving

If all it did was resume a conversation after a crash, plenty of frameworks could claim the title. What Pi Durable adds is three things.

**Tasks are a tree, and undo runs bottom-up.** A task can own subtasks (official example: a split payment charging four cards in parallel, where one failure auto-refunds the rest) and can own whole sub-sessions — a subagent is just "an ordinary session owned by some tool call". Aborting a task cascades bottom-up: each task cleans up after itself first (the refunds, say), and only then does the parent count as done. Press Esc to abort a session and its foreground tasks plus everything they own stop together; background tasks (`background: true`) ignore ordinary aborts, which makes them right for "remind me tomorrow morning" work.

**App state changes in the same commit as the transcript.** Your todo list, plans, tickets, sandbox config are typed-JSON "documents" in Pi Durable, and they change in the same atomic commit as the transcript. Reddit user u/piekwerk put it better than I could:

> app state committed atomically with the transcript means the todo list can't disagree with what the agent actually did, and that drift is a bug class I've hit more than once.

"The todo list disagrees with what the agent actually did" — anyone who's shipped an agent app gets that one in the gut. This bug class is eliminated by architecture.

**Sessions fork anywhere.** A forked session sees the parent's full history up to the fork point, without copying anything; each document also carries its own fork policy: take the value from the fork point, take the current value, or start over. A Slack thread, retrying one step with a different model, "what if I'd phrased that differently" — all the same primitive.

Side note: the `/tree` tree-shaped history in Pi's coding agent is flattened in Pi Durable. Mario's self-deprecation on HN: "That was actually exceptionally dumb." — in the old design every record pointed at another record, and when you actually wanted it you had to flatten it into a linear session anyway; better to store a linear immutable list from the start.

## Why not Temporal: one table settles it

"Isn't this just Temporal / LangGraph / Cloudflare Durable Objects?" was the second-biggest question on release day. I went through each vendor's official docs and made a table:

| System | Persistence mechanism | Where state lives | Recovery |
|---|---|---|---|
| Temporal | Event History + deterministic replay | Temporal Server | Replays the whole workflow function; the code must be deterministic |
| Inngest | Step memoization | Inngest platform | Completed steps return their stored results directly |
| Restate | Server-side journal | Restate Server | Replays the journal to restore the call stack |
| LangGraph | Graph state checkpoints (super-step) | Postgres/SQLite | Resumes the graph from a checkpoint |
| Cloudflare Durable Objects | Single-object strongly-consistent storage + alarm | The DO's built-in SQLite | Resumes the fiber after the object is woken |
| DBOS / Absurd | Postgres as both queue and state store | Postgres | Continues from the last completed step |
| **Pi Durable** | **Task checkpoints + atomic commits** | **Your own storage (SQLite/JSONL/memory/DO)** | **Restores a self-contained task tree, no call-stack replay** |

In Earendil's public talk on October 5, they explained directly why they skipped the Temporal route (transcript, verbatim):

> They favor explicit checkpoints, names and versions so an agent changing its own code can reason about persisted data. They contrast replaying a function call stack with restoring a tree of self-contained tasks.

The keyword is "an agent changing its own code": what they want is an agent that rewrites its own code at runtime. In the replay-a-call-stack model, what gets persisted is the trace of execution; switch to explicitly named, versioned tasks and what you persist is state the agent itself can read and reason about. That's also why "change the code while it runs" (malleable) is a native capability: the session stores the names of extensions and tools, not their code; reinstalling under the same name swaps it in one step; an in-flight call finishes on the old code and the next call uses the new code.

One bit of gossip: Earendil co-founder Armin Ronacher (the Flask author) wrote a single-file Postgres workflow engine back in November 2025 called [Absurd](https://lucumr.pocoo.org/2025/11/3/absurd-workflows/) — "It's named Absurd because durable workflows are absurdly simple, but have been overcomplicated in recent years." Pi Durable is that worldview grown onto agents: no server-side control plane, no workflow DSL, a storage interface small enough that you could implement your own against Postgres or a KV store, and the official repo even ships a consistency test suite.

## Use cases: who's already building houses on it

Here it gets interesting. The official announcement sketched a few possibilities (a Slack bot, a GitHub triage bot). Three weeks after release, people are actually building them.

### Pi Pocket: the flagship sample, 636 stars in three weeks

[TannerMidd/pi-pocket](https://github.com/TannerMidd/pi-pocket) is the most complete Pi Durable app there is, no contest: a self-hosted web app that moves the Pi coding agent onto your phone and every browser you own. Repo created October 4, 636 stars three weeks later, and my research agent verified the substrate from the source — `src/server/app.ts` line 771, `openNodeSqliteStorage(join(this.dataDir, "pocket.sqlite"))`, **all state in a single SQLite file**.

It puts every Pi Durable primitive to work:

- **Resume after restart**: the service restarts and half-finished work keeps going. That's the base layer of durable.
- **Multiplayer**: several people watch one session live, with presence indicators for who's typing and who's about to speak, plus a side channel Pi can't see — the direct application of "a multiplayer client only sees committed state".
- **Fork**: branch off any reply and retry with a different model.
- **Scheduled tasks and webhooks**: `/schedule in 2h check the deploy`, watch PRs (CI goes red, Pi fixes it), receive GitHub events. Every scheduled task is a durable task: "keeps waiting after a restart, fires the moment it's due, never fires twice".
- **PiP**: an assistant called "Pi in Pocket" floats above every page, and you steer other sessions in plain language ("watch acme/api: fix it when CI breaks, tell me when you're done"). It edits no files, runs no commands and approves nothing itself.
- **Lancet Guard**: Pi Durable has no built-in approval primitive (more on that in the pitfalls section), so Pi Pocket added one: every bash/write/edit call first passes a ~109 MB local classifier model, and anything tagged "risky" or "unsure" hangs there for a human to Allow/Deny. The approval decision is itself durable, so a restart doesn't lose it.

The kicker is that it runs on an Android phone. In Termux: `pkg install nodejs git`, clone, `npm start`, and the whole site runs on the phone. Mario's own demo is wilder — he spent 24 hours on his phone using Pi Durable to build his own agent app, verbatim:

> well, this works better than Claude for Android or ChatGPT for Android has ever worked. It runs on my phone directly, no cloud vm. I can live edit it. Its multiplayer. And I can pick any provider/model. ... There is no moat. 24h of slop, developed on the phone, on top of Pi Durable :)

The Pi Pocket author started building because of that demo. He now runs Pi Pocket as his main harness: "It's my main harness everywhere at this point, personal and work." And the highest praise in the community was about the docs, not the code: "I honestly think it does a better job at explaining pi durable than the original pi durable blog post by earendil." The official announcement being out-documented by a user's own README is a decent summary of this launch.

### Cloudflare: absorbed within 24 hours

Pi Durable shipped October 1. On October 2 Cloudflare shipped `PiHarness` in its Agents SDK — the first step, per the changelog, toward "first-class support for third-party agent harnesses on Cloudflare". On October 16 Earendil published the official tutorial.

The architecture mapping is clean: **one Pi session maps to one Durable Object**, storage via `openDurableObjectSqliteStorage(ctx.storage)`. The motivation is money, and the docs say it plainly:

> Many AI agents respond to user requests or other external events, do their work and then sit idle for long periods. Keeping a machine running around the clock wastes compute and quickly gets expensive.

Agents sit idle most of the time, but the classic deployment burns a machine 24 hours a day. A hibernating DO costs nothing; an alarm wakes it and work continues. This hits serverless's hardest problem dead-on: the platform may kill your process at any moment, and Pi Durable assumed from day one that the process dies at any moment.

Cloudflare's [internal integration notes](https://github.com/cloudflare/agents/blob/main/examples/next/harnesses/pi/NOTES.md) are a rare third-party technical endorsement:

> pi-durable already is a durable execution engine. It has checkpointed tasks, ownership trees, abort, replay-safe and unsafe tools, retries, and an inbox, and its submit() is durable before it resolves. Around it, the SDK only has to do one thing: wake the object when pi has work but no memory.

After the integration, their harness code went from roughly 3,600 lines to under 2,000. The notes are also honest about the friction: after a Durable Object restarts, scheduled sleeping tasks miss their wake-up (issue #10857 — sleeps over 15 minutes "miss every time"); that bug was fixed in Pi 1.4.

On HN someone joked "Pi-durable makes pi a good acquisition target for Cloudflare". A day later Cloudflare answered with action: not an acquisition, a direct integration. The Syntax channel's getting-started video opens with an even blunter line — "Last night, my code fixed itself." (A Sentry error triggers the agent; it fixed itself overnight and opened a PR.) After migrating his agent over, he deleted about 8,000 lines of his own code.

### The ecosystem and other angles

piindex counted on October 7: about 75 public repos whose package.json references `@earendil-works/pi-durable`. A few interesting ones: `disler/durable-pi` (266 stars, "The Durable Agent Network", driving an agent on your own devices from web/TUI/curl), `mikan` (a Slack/Telegram/Discord/GitHub team bot with SQLite plus a Docker sandbox), `ha-pi-durable` (Pi inside Home Assistant, with strict approval boundaries), `pi-imessage` (an iMessage bot with JSONL storage plus scheduled tasks), `oppi` (a native iOS client). On npm downloads, pi-durable pulled 952k last month against pi-coding-agent's 15.8M — the base is still new, but the curve is climbing.

### What it means for my one-person company

For me, Pi Durable solves three concrete pains:

1. **Overnight jobs.** My current setup: a main agent hands work to subagents, the result lands on disk, I verify. But the moment the process crashes, queued messages and in-flight tasks all need manual triage. Pi Durable's submission queue and task tree are both durable: crash, reopen, and it's obvious who got how far.
2. **Remote herding.** Out of the house and I want to kick the home agent once: right now that's SSH plus tmux. It works, but it looks like a hack. Pi Pocket's shape — scan a QR code on your phone, Tailscale-encrypted networking — is the real answer, and it's a single SQLite file, so a backup is `cp`.
3. **Scheduled patrols.** "Summarize CI status every weekday at 8am", "watch my blog's Vercel deploys" — in Pi Durable that's one durable task with `sleepUntil`. No separate cron, no tasks lost to restarts.

## Where it's actually strong

After reading the code and the docs, four things I'd actually call scarce:

**One, global consistency from "bookkeeping before display".** Not just the transcript: app state, queue, subagents, streaming output — all of it rides the same atomic commit pipeline. The UI renders only committed state, so any number of clients, late reconnects and multiplayer come for free. Multiplayer isn't a feature you build; it's a byproduct of the storage model.

**Two, freedom of host.** Five storage backends: memory, IndexedDB (browser), SQLite, JSONL, Cloudflare Durable Object. The SQLite/JSONL core uses no Node API at all — add a small adapter and it runs on Bun or inside a DO. The entire package's runtime requirement is "have JavaScript".

**Three, malleable — change the code while it runs.** The session stores extension and tool names, not code. Edit an extension, reinstall under the same name, and it's swapped; an in-flight call finishes on the old code, the next call uses the new one, and the process never restarts. In the Temporal world, where "workflow code must be deterministic and versions must be pinned by hand", that's unthinkable. Dev Agrawal on HN captured a lot of people's reaction: "It's crazy to me that this isn't the norm of agents today."

**Four, a codebase sized to be read by an agent.** 15,000 lines is deliberate self-restraint: your agent can read all of it, understand it, and extend it for you. Pi's philosophy — "let agents grow features themselves" — is implemented all the way down to the foundation.

## Pitfalls and reasons to walk away

Praise done. Now cold water. Every item below has a source.

**Experimental, and the API changes without notice.** The banner at the top of the README, verbatim: "**Experimental.** The API changes without notice between releases." That's not a formality: from the first release on npm on September 19 to now there have been 17 versions, roughly one every two days. Pi Pocket's response is to pin every Pi dependency to an exact version, and its architecture doc carries a bolded warning: "Pi Durable 1.4.0 migrates SQLite storage to schema version 2 when it opens. Older Durable versions cannot open that database." — upgrades are one-way, with no way back.

**No approval or permission primitives.** Cloudflare's notes list it as a known gap: "pi-durable has no approval or permission primitive yet." Want the agent to ask before it does something dangerous? Roll your own out of hooks and memos, or bolt on a classifier model like Pi Pocket does. The official security model is candid, and Pi Pocket's security doc is blunter still: "Anyone who can steer a session can make Pi run commands on this machine, as you." — whoever can steer a session is sitting at your keyboard; don't pass invite links around carelessly.

**The replay flag is hand-maintained, and it rots.** This is the sharpest technical criticism in the thread (Reddit u/piekwerk):

> It's manual knowledge that decays: someone refactors a tool to add a write, the replay flag stays set, and crash recovery now double-applies the effect.

Refactor a read-only tool to add a write and forget to clear `replay: "safe"`, and crash recovery will apply the side effect twice. The framework hands you the rope and doesn't stop you from tying the noose.

**durable ≠ dependable.** One dev.to retro title is sobering enough on its own: "The biggest misconception is that durable means dependable. Pi Durable survives crashes. It does not promise the agent makes good decisions, only that it remembers where it stopped." It guarantees that state stays alive, not that the agent gets smarter.

**Single-writer model; don't think about scaling out.** One store can be owned by only one process at a time; other clients attach to that process. Multi-instance load balancing is out of scope.

**There's a learning curve.** A top-voted HN comment: "This stuff is really complicated... I'm not sure if the huge added complexity is worth it." Tasks, documents, fork policies, ownership, replay semantics — the concept density isn't low. For one-off scripts and throwaway sessions, just run plain Pi. Insurance isn't free; the premium is complexity.

## Wrapping up: the third path in the bet

Back to the August bet. Pi bet on "restarts are cheap"; DSH bet on "restarts keep getting more expensive". Pi Durable offers a third path: **restarts stay cheap, and now you don't have to restart at all**.

Pi 1.0's coding agent hasn't changed by a line — still the same four-tool minimalist workshop. Durable is a separate package: a warehouse with a safe built next door to the workshop. In Mario's HN words, Pi 1.0's API already owes the community a promise and can't be churned — "we are kind of stuck with the APIs we have, unless we want to give a big finger to the entire community". New ideas go into new packages, get validated in real applications, and "lessons will flow back into Pi" — that's very Earendil.

For a one-person company like mine, the conclusion is pragmatic: one-off tasks keep living in the workshop; overnight jobs, jobs that people want to watch remotely, jobs that have to wake themselves on a schedule, start moving into the safe. Pi Pocket has already proven the path works, and Cloudflare's next-day integration says the platform vendors smell it too. The whole agent industry is converging on "always-on packaged agents", and Pi Durable is currently the lightest, most honest ticket on that road — honest enough to write "survives `kill -9`, not a power cut" in the docs and print "the API changes without notice" on its forehead.

And me? The article's done, both research agents have clocked out. This time nobody lost a report — the on-disk checkpoint earned its keep.

---

*References: [Pi Durable official announcement](https://earendil.com/posts/pi-durable/), [packages/durable README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md) (and docs/spec.md), [Pi Pocket site](https://tannermidd.github.io/pi-pocket/) and [repo](https://github.com/TannerMidd/pi-pocket) (including docs/features.md, docs/architecture.md), [Pi Durable on Cloudflare](https://earendil.com/posts/pi-durable-on-cloudflare/), [Cloudflare PiHarness integration notes](https://github.com/cloudflare/agents/blob/main/examples/next/harnesses/pi/NOTES.md), [HN discussion](https://news.ycombinator.com/item?id=49925969), [Reddit r/PiCodingAgent bafflement thread](https://www.reddit.com/r/PiCodingAgent/comments/1x9zmbo/), [piindex's Pi Durable ecosystem page](https://piindex.dev/topics/pi-durable), [Shaun Li's design analysis](https://shaunli.com/blog/18-pi-durable-agentharness-design/), [Armin Ronacher: Absurd Workflows](https://lucumr.pocoo.org/2025/11/3/absurd-workflows/), [dev.to retro](https://dev.to/dishant0406/pi-durable-shipped-then-the-hype-took-over-the-timeline-4k3p). Fact-check date for this piece: 2026-10-25; the GitHub/npm figures are that day's live API readings.*
