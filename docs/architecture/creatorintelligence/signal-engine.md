# Signal Engine

> Status: Draft v1.0
> Owner: NIVO Creator Intelligence
> Used By: Creator Identity, Memory, Reasoning Engine, Evaluator

---

# Purpose

The Signal Engine transforms raw creator observations into structured, evidence-backed intelligence.

It is responsible for discovering repeated patterns across content rather than interpreting those patterns strategically.

The Signal Engine answers:

"What consistently happens?"

It does **not** answer:

"Why does it happen?"

Strategic interpretation belongs to downstream systems.

---

# Why the Signal Engine Exists

Raw content is noisy.

Individual posts are unreliable indicators of creator behaviour.

A single viral video should not redefine creator understanding.

Instead, NIVO requires a layer that identifies recurring evidence across many observations.

The Signal Engine exists to convert noisy observations into stable signals that can be trusted by the rest of the intelligence pipeline.

---

# Design Philosophy

Evidence before interpretation.

Observation before conclusion.

Frequency before importance.

Consistency before novelty.

The engine should describe reality rather than explain it.

---

# Core Responsibilities

The Signal Engine is responsible for:

✓ analysing observed content

✓ identifying repeated patterns

✓ measuring signal strength

✓ tracking longitudinal behaviour

✓ updating signal confidence

✓ detecting signal emergence

✓ detecting signal decay

It is NOT responsible for:

✗ reasoning

✗ creator identity

✗ audience psychology

✗ idea generation

✗ evaluation

---

# Input Sources

The engine receives structured observations including:

## Content

- captions
- transcripts
- titles
- hooks
- descriptions

---

## Metadata

- publishing date
- platform
- format
- duration

---

## Engagement

- likes
- comments
- saves
- shares
- views

---

## Historical Context

- previous observations
- previous signals
- observation history

---

# Signal Lifecycle

Raw Observation

↓

Observation Extraction

↓

Pattern Detection

↓

Candidate Signal

↓

Signal Validation

↓

Signal Strength Calculation

↓

Trend Analysis

↓

Persistent Signal

Signals continue evolving as additional observations arrive.

---

# Signal Components

Every signal should contain:

## Key

Stable internal identifier.

Example:

high-comment-cta

---

## Display Name

Human-readable description.

Example:

High Comment Activity on CTA-Driven Resource Posts

---

## Category

Examples:

- audience
- format
- topic
- behaviour
- engagement
- messaging

---

## Supporting Evidence

References to observations that justify the signal.

Signals should always be explainable.

---

## Strength

Represents how strongly the pattern appears.

Strength increases with repeated evidence.

---

## Confidence

Represents certainty that the signal reflects genuine creator behaviour.

Confidence increases with observation quality and repetition.

---

## Trend

Possible values:

- Rising
- Stable
- Falling
- Unknown

Trend reflects longitudinal movement rather than popularity.

---

## Observation Count

Number of observations supporting the signal.

---

## Last Updated

Timestamp of latest evidence.

---

# Signal Principles

## Signals Describe

Signals should remain descriptive.

Example:

High Comment Activity on CTA Posts

NOT

The creator should use more CTAs.

---

## Signals Require Evidence

Every signal must be supported by observable evidence.

Signals without evidence should never exist.

---

## Signals Change Slowly

Signals should not fluctuate because of one successful or unsuccessful post.

Sustained evidence is required before updating trends.

---

## Signals Can Expire

If supporting evidence disappears over long periods, signals should weaken and eventually become inactive.

Inactive signals remain part of historical memory.

---

# Relationship With Other Systems

## Creator Identity

Consumes multiple signals to understand stable creator characteristics.

Signals do not define identity directly.

They provide evidence for identity.

---

## Memory

Stores historical signal evolution.

Allows long-term trend analysis.

---

## Reasoning Engine

Consumes active signals as evidence.

Signals influence reasoning but do not determine conclusions.

---

## Evaluator

Uses signals as supporting evidence when assessing generated ideas.

Signals never act as evaluation rules.

---

# Persistence Model

Signals are persistent.

They evolve over time as new observations arrive.

Signals should be versioned through observation history rather than overwritten without trace.

---

# Success Criteria

The Signal Engine is successful when:

- recurring creator behaviour is consistently detected

- important patterns emerge naturally

- temporary trends do not dominate long-term understanding

- every signal can be explained with evidence

- downstream systems trust signals as reliable observations

The objective is not prediction.

The objective is accurate representation of recurring creator behaviour.

---

# Future Extensions

Potential future capabilities include:

- cross-platform signal fusion

- seasonal signal detection

- anomaly detection

- creator evolution tracking

- confidence decay modelling

- multimodal observation analysis

These capabilities are intentionally outside the scope of the initial architecture.