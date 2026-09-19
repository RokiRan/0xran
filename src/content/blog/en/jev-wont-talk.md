---
title: "Jev: The AI Model That Refuses to Say a Word"
description: "Last week a new model hit the top of Hacker News with a pitch that sounds like a scam: it can't write a single word. It only answers multiple-choice questions. Here's what this judgment-only weirdo actually is, and why it matters even if you never touch an API."
date: 2026-09-19
tags:
  - AI
  - essay
kind: Essay
---

The AI world produced a weirdo last week. On September 15, a company called TypeSafe AI released a model named Jev, and within three days it hit the top of Hacker News (1,863 points, 491 comments) on a pitch so absurd my first reaction was "scam":

**This model cannot write a single word.**

Not "writes badly." There is no "writing" feature. It only answers three kinds of questions: yes or no, pick one of these, or give it a score. Ask it for a poem and it will politely return a type error.

![A robot referee that only pushes buttons](/images/blog/jev-wont-talk/01-cover.webp)

Sounds like a defective product, but the community's three-day reaction suggests otherwise. I went through the official docs, the HN thread, and a few third-party tests. This is the plain-language field report for people who don't want to read source code.

## It's an interviewer that only does multiple choice

Today's models (GPT, Claude and friends) are essentially super-autocomplete: they emit text one token at a time, like chatterboxes, whether or not you asked for text. You want a "yes," and you get "After careful consideration of this very nuanced question, on balance, yes." Thanks. Great word count.

Jev goes the opposite way: you hand it some material (say, a customer complaint) and you're only allowed to ask multiple-choice questions:

- Which department should handle this ticket? (billing / technical / sales)
- How angry is the customer? (calm / annoyed / furious)
- Is this urgent? (yes / no)

All three questions go in one request, answered together, each with a confidence score. Total response time: 70 to 500 milliseconds, faster than a blink.

TypeSafe calls this a "System One model," after *Thinking, Fast and Slow*: regular LLMs are the slow, deliberate System 2, and Jev wants to be the snap-judgment System 1. The name "Jev" comes from William Stanley Jevons, the economist behind the paradox that efficiency gains increase consumption. Whoever names things over there has taste.

## How fast, how cheap, and how much of it is marketing

Numbers first, skepticism second.

Officially: 70–500ms latency, up to 193.6x faster and 444.6x cheaper than frontier LLMs. Input tokens cost $0.042 per million; output tokens are free, because it doesn't generate text and the output is "too cheap to meter" (their actual phrase).

The speed reason is mundane: an LLM runs the computation 100 times to write 100 tokens; Jev runs it once and answers all questions in parallel. It's not "an LLM with output restrictions," it's a different architecture trained with something called RLCD (Reinforcement Learning for Calibrated Decisions). The founder, Diogo Almeida, is a former OpenAI researcher and one of the inventors of RLHF, meaning one of the people who taught ChatGPT to talk is now telling us that talking models are the wrong shape for automation. He spent launch day in the HN comments answering skeptics one by one, under the username CompleteSkeptic. Points for self-awareness.

Where's the water: the 193.6x / 444.6x numbers are self-reported, benchmarked against the average of GPT-6 Astra and Claude Fable 5.1 at high reasoning, on workflows hand-built by their own team. The company itself admits these sit "on the higher end of real-world gains." Honest posture, but as of this writing there's no independent reproduction.

## What the internet did with it in three days

Three days after launch, the community's tinkering speed beat the model's latency:

- **Playing Doom**: the official demo feeds game state to Jev as text and asks "where to move, should I shoot" 10 times a second, for about $7 an hour. Half the comments say "game QA is doomed," the other half say "you've reinvented the aimbot."
- **Beating Opus 5 at Pokémon**: someone on X tested Jev in Pokémon battles against Claude Opus 5. Jev won, at roughly 1/820th the cost and about 10x the speed. Its second and third choices were reportedly reasonable tactics too.
- **Speeding up browser agents**: the Browser Use team shipped an official integration in two days. Every agent step ("click what, click where") becomes two Jev questions answered in one network round trip. Searching Zurich-to-London flights on Google Flights end to end: 7.1 seconds.
- **Playing scissors for Claude Code**: a plugin called fast-jev-compaction collected 1,500+ stars in a day. Instead of asking an LLM to write a lossy summary when the conversation gets too long, it asks Jev about each tool call, "is this still needed?", and keeps the survivors verbatim. Nothing gets paraphrased, nothing gets lost.

## Cold water: it's a fish at the poker table

Demos are intoxicating. Here's a well-executed reality check.

Someone benchmarked Jev on 150 poker decision points against a solver as ground truth. Agreement with optimal play: 63%. The highlight: holding the nuts (a hand that literally cannot lose), it went all-in 16 times out of 16. The correct move was to check. A one-line rule of "check when you can" would beat it.

Worse is the confidence inversion: it assigned its highest confidence (0.86) to its most catastrophically wrong answers, and only 0.09 where it was closest to correct. And to judge whether it's winning, you have to pre-chew the conclusion into the input ("you have the ace-high flush, opponent has no outs"). It can't derive that from the raw cards.

![A robot confidently pushing all its chips in](/images/blog/jev-wont-talk/02-poker.webp)

TypeSafe, to its credit, published its own failure list: it can't count, can't compare dates reliably, degrades on long noisy input, and can be nudged by adversarial content in the material. Also, it was trained primarily on English; Chinese, Japanese and Korean are "supported but less accurate." How much less, they don't say.

## "Zero hallucination" is a word game, but not pure hype

The "zero hallucination" claim is mathematically real: its output is welded to the option set you provide. It cannot invent an option, a field, or a chunk of JSON. The classic LLM failure mode of confidently fabricating things is physically impossible here.

But it can pick the wrong option with high confidence. The failure mode shifts from "making things up" to "making wrong decisions confidently," which is arguably sneakier, because the output format is always valid, your code never throws, and it's wrong silently. That 0.86-confidence all-in is the evidence.

## Why should you care

If you're not a developer, this thing won't show up in your chat box anytime soon, but it will show up inside the apps you use. Its best job is being a doorman for bigger models: intent classification, content moderation, routing easy requests to cheap models and hard ones to expensive ones. The HN consensus is that this kind of "judgment question" can replace 40 to 70 percent of LLM calls in a typical pipeline. In human terms: "AI auto-sort" and "AI smart filter" features are about to get faster and cheaper, cheap enough that features nobody could justify before now make sense.

If you are a developer, the community's onboarding rule is one line: test it on a few dozen labeled samples from your own business first, tune the confidence threshold on your own data, and route low-confidence cases to a human. The Jev in the demo and the Jev in your workload may not be the same Jev.

## Last word

What interests me about Jev isn't that it's smart. It clearly isn't; it can't even play poker. It's that "inject one 100-millisecond, fraction-of-a-penny judgment into your program" just became an API call. Plenty of features were never built not because they were impossible, but because "calling a big model for this tiny thing" was economically absurd. It isn't anymore.

It's still a v1, though: closed-source, text-only, weaker on Chinese, self-reported benchmarks, and a questionable moat (someone already got a 2–3x speedup out of a 1.5B open model). The right move now is to test it on edge cases, not to bet your core pipeline on it.

After all, an interviewer who only does multiple choice is great for screening resumes. Whether to hire the candidate, you should still decide yourself.
