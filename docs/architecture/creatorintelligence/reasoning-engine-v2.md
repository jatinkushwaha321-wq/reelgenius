# Reasoning Engine V2

> Status: Draft v0.1  
> Owner: NIVO Creator Intelligence  
> Depends On: Signal Engine, Creator Identity, Memory, Evaluator

---

# Purpose

The Reasoning Engine is the cognitive layer responsible for converting creator intelligence into high-quality content opportunities.

It does **not** generate ideas directly.

Instead, it interprets creator understanding, audience psychology, historical observations, and strategic constraints to construct a reasoning state from which ideas can be generated and evaluated.

Its objective is not simply to produce relevant ideas.

Its objective is to produce ideas that strengthen the creator's long-term identity.

---

# Why V2 Exists

Reasoning Engine V1 successfully introduced an intermediate reasoning stage between creator observations and idea generation.

The pipeline currently performs:

Observed Content
↓
Reasoning
↓
Idea Generation

While this produces coherent ideas, research conducted through the Creator Intelligence Corpus (CIC) exposed several architectural limitations.

The current engine understands observed patterns.

It does not sufficiently understand:

- Creator identity
- Core beliefs
- Audience psychology
- Decision filters
- Generation constraints
- Long-term positioning

As a result, the generator can produce ideas that are contextually related but strategically weak.

Example:

Observed signals may indicate:

- AI
- Students
- Education

Without identity-aware reasoning the generator may produce:

"Top 5 AI Tools Every Student Should Use"

Although relevant, this weakens creator positioning because it reinforces topics rather than beliefs.

Reasoning Engine V2 exists to solve this problem.

---

# Design Philosophy

The engine is built on one fundamental assumption:

Ideas are consequences of reasoning.

Reasoning is a consequence of identity.

Therefore:

Identity

↓

Reasoning

↓

Ideas

Rather than:

Topics

↓

Ideas

---

# Design Principles

## 1. Identity Before Ideas

Ideas should emerge naturally from creator identity.

Identity is never inferred from generated ideas.

---

## 2. Beliefs Drive Opportunity

Topics are temporary.

Beliefs are durable.

The engine prioritizes beliefs over keywords.

---

## 3. Audience Psychology Before Audience Demographics

The engine reasons about:

- fears
- aspirations
- tensions
- motivations
- transformations

It does not reason primarily about:

- age
- gender
- location

---

## 4. Opportunities Over Topics

The engine searches for opportunities where:

Creator Identity

intersects with

Audience Tension

supported by

Observed Evidence

---

## 5. Positioning Is Sacred

Every generated idea should strengthen creator positioning.

Relevance alone is insufficient.

---

## 6. Reasoning Is Ephemeral

Reasoning exists only during one execution cycle.

No reasoning output is permanently stored.

Persistent intelligence belongs to other subsystems.

---

## 7. Evaluation Is Independent

Generation and evaluation are separate stages.

The generator proposes.

The evaluator judges.

---

# Cognitive Pipeline

Observed Content

↓

Signal Engine

↓

Creator Identity

↓

Audience Model

↓

Belief Engine

↓

Decision Filters

↓

Opportunity Planning

↓

Candidate Generation

↓

Evaluation

↓

Accepted Ideas

---

# Responsibilities

The Reasoning Engine is responsible for:

✓ interpreting creator intelligence

✓ understanding audience needs

✓ identifying strategic opportunities

✓ avoiding identity drift

✓ preparing structured context for generation

The Reasoning Engine is NOT responsible for:

✗ storing memory

✗ generating embeddings

✗ ranking historical signals

✗ persisting creator intelligence

✗ evaluating final quality

---

# Inputs

The engine receives structured information from upstream systems.

Current expected inputs include:

## Signal Engine

- Active signals
- Signal strengths
- Longitudinal trends
- Supporting observations

---

## Creator Identity

- Identity summary
- Core beliefs
- Identity invariants
- Audience model
- Decision filters
- Generation constraints

---

## Memory

- Previously generated ideas
- Accepted ideas
- Rejected ideas
- Long-term creator history
- Historical opportunity coverage

---

## Creator Profile

- Strategic direction
- Brand vocabulary
- Content goals
- Platform preferences

---

# Internal Cognitive Stages

## Stage 1 — Situation Assessment

Understand:

What is happening?

What patterns exist?

What changed?

---

## Stage 2 — Identity Alignment

Interpret observations through creator identity.

Question:

"What would this creator naturally care about?"

---

## Stage 3 — Audience Interpretation

Identify:

Current audience tension

Desired transformation

Relevant emotional state

---

## Stage 4 — Opportunity Discovery

Search for intersections between:

Creator Beliefs

Audience Needs

Observed Evidence

Novelty

---

## Stage 5 — Strategic Planning

Construct multiple opportunity directions.

Each direction should include:

- reasoning
- supporting evidence
- expected transformation

No ideas are generated yet.

---

## Stage 6 — Generation Context

Produce a structured reasoning context for the Generator.

This becomes the only information consumed by the generation model.

---

# Outputs

The engine produces:

- reasoning summary
- opportunity candidates
- supporting evidence
- belief alignment
- audience alignment
- generation constraints
- confidence

It does not produce finished content.

---

# Non-Goals

Reasoning Engine V2 intentionally does NOT:

- optimise titles
- optimise hooks
- generate scripts
- evaluate quality
- rank final ideas
- modify creator memory

Those responsibilities belong elsewhere.

---

# Success Criteria

Reasoning Engine V2 is successful when:

- generated ideas consistently reinforce creator identity

- generic educational ideas become significantly less frequent

- reasoning can be explained using supporting evidence

- identity drift decreases over time

- accepted ideas remain consistent with creator positioning

The objective is not maximum creativity.

The objective is strategic consistency.

---

# Future Extensions

Potential future capabilities include:

- multi-step reasoning

- confidence calibration

- competing opportunity planning

- self-critique before generation

- dynamic identity evolution

- cross-platform reasoning

These are intentionally excluded from the initial V2 implementation.
