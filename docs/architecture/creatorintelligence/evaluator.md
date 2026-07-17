# Evaluator

> Status: Draft v1.0
> Owner: NIVO Creator Intelligence
> Used By: Reasoning Engine V2, Memory

---

# Purpose

The Evaluator is the final cognitive layer responsible for determining whether a generated idea deserves to become part of the creator's strategy.

Generation is optimistic.

Evaluation is critical.

The Evaluator exists to ensure that every accepted idea strengthens creator identity rather than simply matching observed topics.

---

# Why the Evaluator Exists

Large Language Models are excellent generators.

They are poor judges.

Without an evaluation layer, generators frequently produce ideas that are:

- generic
- repetitive
- strategically weak
- identity inconsistent
- topic driven

These ideas are often reasonable in isolation but harmful over time.

The Evaluator prevents identity drift.

---

# Design Philosophy

Generation proposes.

Evaluation decides.

Ideas are never accepted because they sound good.

Ideas are accepted because they are strategically aligned.

---

# Core Responsibilities

The Evaluator is responsible for:

✓ validating creator alignment

✓ rejecting identity drift

✓ detecting generic ideas

✓ identifying repetition

✓ verifying audience alignment

✓ preserving positioning

✓ scoring overall strategic quality

The Evaluator is NOT responsible for:

✗ generating ideas

✗ rewriting ideas

✗ extracting signals

✗ updating identity

✗ reasoning

---

# Evaluation Pipeline

Candidate Idea

↓

Identity Check

↓

Belief Check

↓

Audience Check

↓

Constraint Check

↓

Novelty Check

↓

Strategic Value Check

↓

Overall Score

↓

Accept / Reject

---

# Evaluation Dimensions

## 1. Identity Alignment

Question

Does this idea naturally belong to this creator?

Examples

PASS

"Why students learn AI in the wrong order."

FAIL

"Top 5 AI Tools Every Student Should Use"

---

## 2. Belief Alignment

Question

Does the idea reinforce the creator's core beliefs?

Ideas that contradict beliefs should fail regardless of quality.

---

## 3. Audience Alignment

Question

Does this solve a genuine audience tension?

Not

Does the audience search for this?

Instead

Does this move the audience toward transformation?

---

## 4. Generation Constraints

Question

Does the idea violate any strategic boundaries?

Examples

Generic tool lists

Resume advice

Random productivity

Programming tutorials

should fail if defined by the Creator Identity.

---

## 5. Novelty

Question

Has this opportunity already been explored?

The Evaluator discourages repetition while allowing healthy thematic consistency.

---

## 6. Strategic Value

Question

Will repeatedly publishing ideas like this strengthen creator positioning over time?

This is the most important evaluation dimension.

---

# Evaluation Principles

## Identity Before Engagement

An idea that strengthens identity should outrank an idea with higher predicted engagement.

---

## Long-Term Positioning Before Short-Term Performance

The Evaluator protects the creator's long-term brand.

It does not chase temporary trends.

---

## Explainable Decisions

Every rejection should include evidence.

The system should always answer:

Why was this rejected?

---

## Conservative Acceptance

Acceptance should require confidence.

Rejection should be easy.

Publishing weak ideas damages trust.

---

# Output

Every evaluation produces:

Overall Score

Decision

Accept / Reject

Supporting Evidence

Failed Dimensions

Strengths

Weaknesses

Confidence

Suggested Memory Updates

---

# Relationship With Other Systems

## Creator Identity

Provides evaluation criteria.

---

## Signal Engine

Provides supporting evidence.

---

## Memory

Stores evaluation history and recurring failures.

---

## Reasoning Engine

Receives evaluator feedback indirectly through Memory.

Generation never bypasses evaluation.

---

# Success Criteria

The Evaluator is successful when:

- generic ideas become increasingly rare

- creator positioning strengthens over time

- repeated low-quality generations disappear

- rejected ideas are consistently explainable

- accepted ideas feel uniquely authentic to the creator

The objective is not to maximise idea quantity.

The objective is to maximise strategic quality.

---

# Future Extensions

Potential future capabilities include:

- weighted evaluation dimensions

- creator-specific rubrics

- self-critique loops

- multi-pass evaluation

- A/B strategic scoring

- publishing outcome feedback

These are intentionally excluded from the initial architecture.