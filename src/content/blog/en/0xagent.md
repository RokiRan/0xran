---
title: "0xAgent: The Principles of Multi-Agent Collaboration, and the Five Gates I Built"
description: The multi-agent collaboration design behind my open-source framework 0xAgent — why collaboration failure is a concurrency and consistency problem, and the gates, state machines, and interruption pricing that answer it.
date: 2026-08-24
tags:
  - AI
  - agent
  - opensource
kind: Essay
---

Last week I took apart [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) and wrote up [the teardown](/en/blog/dsh-vs-pi/). It left my hands itchy, so I cleaned up the agent framework I'd been writing for myself and open-sourced it: [0xAgent](https://github.com/RokiRan/0xAgent) (package name `agent-harness`), MIT, strict-mode TypeScript, a little over 6,000 lines of source. The first commit went up yesterday.

This post skips the feature list — the README has that. It covers the one thing that took real thought: what multiple agents actually rely on when they work together.

## First, the causes of death

Put a few agents in a chatroom, let them talk freely, and you get a lively scene with useless results. The causes of death I kept seeing:

- two agents being polite to each other, back and forth, forever;
- one agent repeating the same sentence three times;
- statements built on half-hour-old context, long after everyone else changed their minds;
- one agent trying to work while the rest queue up to chat with it, burning its context window and tool budget.

Stare at this list long enough and an uncomfortable conclusion falls out: no smarter model cures any of these. Infinite loops, parroting, dirty reads, interruption storms — these are classic distributed-systems failures; the participants just happen to be LLMs now. Multi-agent collaboration is a concurrency and consistency problem, not an intelligence problem. Every design decision in 0xAgent's collaboration layer follows from that sentence. The mechanisms are transplanted from cumora's engineering practice, and the governing principle sits in the README:

> Concurrency and consistency get hard gates in code. Judgment and expression go to the model.

Here is how that one principle unfolds into five concrete ones.

## Principle 1: rules live in the protocol layer, not in prompts

Telling agents "don't spam, don't repeat yourself" in a system prompt is advice, and models ignore advice when the mood takes them. Advice is weaker than physics: 0xAgent's registry (the relay) rejects messages at the protocol layer with a 409 or 429. The message never goes out.

All five gates on the registry follow this idea:

- **The lapping criterion**: with no human present, once agent message count exceeds distinct speaker count, the message is rejected. If you're out-talking everyone in the room combined, something is wrong. The criterion needs no tuning — the more speakers, the looser it gets on its own;
- **Verbatim duplicate rejection**: same sender, same channel, byte-identical message, rejected — and overrides can't bypass it;
- **The rate floor**: 30 messages per minute per agent, content-blind, a pure cost backstop;
- **The freshness gate**: broadcasting with unread messages pending gets rejected; see principle 2;
- **The two-tier floor**: if a human spoke within the last 10 minutes, lapping relaxes to a bounded cap (adaptive `max(6, μ+2σ)`); the moment the human leaves, strict mode returns. Human traffic is never throttled, and one human message resets every loop counter.

That last one encodes the system's posture: the chatroom exists for humans; agents work here. If a human is present, the discussion is probably worth something, so loosen up. If no human is around, agents talking among themselves is probably a spinning wheel, so clamp it hard.

## Principle 2: the right to speak is based on the latest state

An agent declaiming from half-hour-old context is the most common form of useless output in a multi-agent system. The fix is the same idea as optimistic concurrency control in databases: before you speak, verify that the version you saw is still current.

The registry maintains a seen-cursor per agent, deliberately separate from any read path. If your cursor is behind when you broadcast, you get a 409 with the unread messages inlined in the rejection; read, recompute, retry. If you insist on speaking, the system issues a hold-token: bound to the seq you were shown, valid for 120 seconds, consumed on first use. A token carrying a stale seq is refused.

This turns "I know what's going on" from a verbal claim into a verifiable credential. Overriding the gate is a signature: I saw this version, and I answer for what I say about it.

## Principle 3: collaboration lands in state machines, not in conversation

"Who took that task again?" "Did we settle on plan A or B?" Promises made in conversation are deniable and volatile. 0xAgent's answer is three state-machine boards where every step of collaboration leaves an undeniable record:

The task board: `ready → in_progress → review → done`. Work can't start without acceptance criteria; the approver can't be the owner; the lease is 30 minutes, and expiry triggers scored reassignment using a formula with no subjective input, only database facts: presence − load×10 + historical success rate×10; reworking a done task requires a diff of new evidence; cancelling a task forces an ADR — no quiet burials.

The decision board: open a vote, every present agent ballots with an option plus reasoning, quorum closes it. If the timebox expires undecided, it escalates to a human in a fixed four-line envelope: what to decide, the tally, the default option, the consequence of missing the deadline. If the human also times out, the default is adopted. Nothing gets to sit in "let's wait and see."

The commitment ledger: an agent saying "I'll take it" only produces a promise candidate; it enters the dependency graph after the agent confirms. Dependency edges are cycle-checked on insertion. Reminders name only overdue blockers on the critical path, with a 45-minute cooldown per edge.

The shared idea across all three: turn collaboration from "digging through chat history to settle accounts" into "reading current state from a database." Conversation produces intent; state machines fix facts.

## Principle 4: interruption has a price

While an agent holds an in_progress lease, it is doing deep work. If every room message were delivered straight to it, its context window and tool budget would be ground away by small talk.

0xAgent installs a focus window for this case: while the lease is held, room messages aren't delivered directly; they land in a personal digest queue (capped at 50) and flush as one batch when the task transitions or a 30-second sweep notices the window ended. Only two message types always get through: a direct @mention and a critical-path nudge.

The essence is pricing interruption. Interrupting a working agent spends its scarcest resources, so only messages that can pay that price pass: someone calling it by name, or it blocking someone else.

## Principle 5: experience passes a gate before it becomes principle

A collaboration system accumulates experience over time, but letting an agent's "I feel like" become next run's rule of conduct amounts to giving monologue legislative power. 0xAgent splits memory into two layers: finished work registers episode-level lessons; a candidate principle needs two or more independent sources, or a human pin, to promote into the semantic layer. Promoted principles are injected at the head of agent context and count against the token budget.

Learning is deliberately slowed down, in exchange for a clean principle base.

## The foundation: messages outlive processes

Every mechanism above rests on one premise: messages must not be lost. The registry uses a mailbox model — state persists with a 1-second debounce and atomic replacement, in-flight messages survive restarts, and the snapshot on disk is the only source of truth. Bus agents poll every two seconds in a store-and-forward topology, so any machine can join without opening an inbound port. My registry runs on a Raspberry Pi; the Mac agents and the web chatroom all hang off it.

Closing with the line I left in the README:

> I'm not here to make the scene lively. I'm here to make things clear.
