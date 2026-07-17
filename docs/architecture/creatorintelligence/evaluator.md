# Evaluator

> Status: Draft v1.1
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

✓ validating reasoning alignment

✓ validating opportunity fidelity

✓ validating generation contract compliance

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

Reasoning Contract Validation

↓

Identity Alignment

↓

Opportunity Fidelity

↓

Generation Contract Compliance

↓

Audience Alignment

↓

Novelty Evaluation

↓

Strategic Value Assessment

↓

Evaluation Report

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

## Reasoning Alignment

Question

Does this idea reinforce the Positioning Thesis and Strategic Direction established by the Reasoning Engine?

The Evaluator should reject ideas that drift away from the approved strategic direction, even if they are individually strong.

---

## Opportunity Fidelity

Question

Does the generated idea remain faithful to the selected strategic opportunity?

The Generator should elaborate on the chosen opportunity rather than invent new strategic directions.

Ideas that drift beyond the selected opportunity should be rejected.

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

## 4. Generation Contract Compliance

Question

Does the generated idea violate any constraints defined by the Reasoning Engine Generation Contract?

This includes:

- identity constraints
- memory constraints
- reasoning constraints

Violation of any mandatory constraint should result in rejection.

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

Evaluation Report

Identity Alignment

Reasoning Alignment

Opportunity Fidelity

Generation Contract Compliance

Audience Alignment

Novelty

Strategic Value

Overall Verdict

Supporting Evidence

Rejection Reasons

Validated Learnings

---

# Relationship With Other Systems

## Creator Identity

Provides evaluation criteria.

---

## Signal Engine

Provides supporting evidence.

---

## Memory

Consumes validated learnings produced by the Evaluator.

Rather than storing every generated idea, Memory stores durable knowledge such as:

- validated strategies
- successful positioning patterns
- repeated failure modes
- recurring rejection reasons

This allows future reasoning cycles to build upon verified intelligence rather than raw generation history.

---

## Reasoning Engine

Produces the strategic contract consumed by both the Idea Generator and the Evaluator.

The Evaluator verifies that generated ideas faithfully execute the approved reasoning contract.

Future reasoning cycles consume validated learnings indirectly through Memory.

Generation never bypasses evaluation.

---

# Success Criteria

The Evaluator is successful when:

- generic ideas become increasingly rare

- creator positioning strengthens over time

- repeated low-quality generations disappear

- rejected ideas are consistently explainable

- accepted ideas feel uniquely authentic to the creator

- generated ideas consistently respect the approved reasoning contract

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