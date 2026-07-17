# Milestone 3 — Evaluator

> Status: Planned
>
> Owner: NIVO Engineering
>
> Prerequisite: Milestone 2 — Reasoning Engine V2 ✅

---

# Objective

Implement the Evaluator as the judgment layer of NIVO.

The Evaluator is responsible for transforming generated ideas into validated knowledge.

It determines whether a generated idea faithfully executes the approved strategic reasoning and deserves to become part of the creator's long-term intelligence.

The Evaluator does **not** generate ideas.

It does **not** perform reasoning.

It critically examines generated ideas against the creator's identity, the approved reasoning contract, and the strategic objectives established by the Reasoning Engine.

Its output becomes the foundation for future learning and Memory.

---

# Vision

NIVO should not assume that every generated idea is worth keeping.

Generation is optimistic.

Evaluation is critical.

The Evaluator ensures that only strategically aligned, identity-consistent, and high-quality ideas become validated knowledge.

Rather than asking:

"Can this idea be generated?"

The Evaluator asks:

"Should this idea exist?"

---

# Architectural Invariants

These rules are mandatory.

Implementation must never violate them.

---

## 1. Evaluation Is Ephemeral

Evaluation exists only during a single execution cycle.

It is never persisted directly.

Only validated learnings produced by evaluation may later be stored by Memory.

---

## 2. Evaluation Never Generates

The Evaluator must never generate new ideas.

It evaluates existing candidate ideas only.

---

## 3. Evaluation Never Performs Reasoning

The Reasoning Engine establishes strategy.

The Evaluator validates whether generated ideas faithfully execute that strategy.

It must never reinterpret signals or create new strategic directions.

---

## 4. Identity Remains Immutable

Creator Identity is treated as a fixed reference.

The Evaluator may validate alignment against identity.

It must never modify identity.

---

## 5. Reasoning Contract Is Authoritative

The approved reasoning contract is the primary evaluation reference.

Generated ideas should be evaluated against:

- Positioning Thesis
- Strategic Direction
- Opportunity Planning
- Generation Contract

The Evaluator must never override the reasoning contract.

---

## 6. Strategy Before Quality

An idea that violates strategy must not pass evaluation, even if it appears creative or engaging.

Strategic alignment always takes priority over perceived creativity.

---

## 7. Explainability Is Mandatory

Every evaluation decision must be explainable.

Accepted ideas must identify why they satisfy evaluation criteria.

Rejected ideas must identify the dimensions that failed.

---

## 8. Evaluation Produces Knowledge

The Evaluator does not produce scores for their own sake.

Its purpose is to produce structured evaluation reports that future systems can transform into validated knowledge.

---

## 9. Memory Consumes Evaluation

Memory must never consume raw generated ideas.

Memory consumes validated learnings produced by the Evaluator.

---

## 10. Backward Compatibility

The Evaluator must integrate without breaking the existing repository.

All feature flags and existing generation pathways must remain functional throughout implementation.

---

# High-Level Cognitive Flow

Observed Content

↓

Signal Engine

↓

Creator Identity

↓

Reasoning Engine

↓

Idea Generator

↓

Evaluator

↓

Evaluation Report

↓

Validated Learnings

↓

Memory (Future)

---

# Inputs / Outputs

| Component | Inputs | Outputs |
|-----------|--------|---------|
| Evaluator | Creator Identity, Reasoning Contract, Candidate Idea | Evaluation Report |

---

# Milestone Goal

At the end of Milestone 3, the repository should contain a fully functional Evaluator capable of validating generated ideas against the approved reasoning contract while preserving complete backward compatibility with the existing pipeline.

No production behaviour should regress.

No database migrations are required.

No Memory implementation is included in this milestone.

# Repository Understanding

Milestone 2 introduced the complete Reasoning Engine V2 and integrated strategic reasoning into the production idea generation pipeline.

The repository now contains a layered cognitive architecture where generated ideas are produced from validated strategic reasoning rather than directly from observed signals.

The purpose of Milestone 3 is **not** to redesign this pipeline.

Instead, it introduces the Evaluator as the judgment layer responsible for validating generated ideas against the approved reasoning contract before those ideas become validated knowledge.

The implementation should maximize reuse of the existing repository while introducing the smallest set of new evaluation-specific components.

---

# Existing Repository Components

The following components already exist and should remain the foundation of the evaluation system.

## Creator Identity

Reuse completely.

Creator Identity remains the primary source of creator-specific evaluation criteria.

The Evaluator consumes identity.

It never modifies identity.

---

## Signal Engine

Reuse completely.

Signals remain evidence providers.

The Evaluator never performs signal extraction or scoring.

Signals are only consumed indirectly through the approved reasoning contract.

---

## Reasoning Engine V2

Reuse completely.

Reasoning Engine V2 is now the authoritative source of strategic intent.

The Evaluator validates whether generated ideas faithfully execute:

- Positioning Thesis
- Strategic Direction
- Opportunity Planning
- Generation Contract

The Evaluator must never replace or reinterpret reasoning.

---

## Idea Generator

Reuse completely.

The Idea Generator remains responsible only for producing candidate ideas.

The Evaluator receives candidate ideas after generation.

It never generates, rewrites or edits ideas.

---

## Prompt Infrastructure

Reuse completely.

Continue using the shared NIVO prompt construction utilities.

Do not duplicate prompt builders or prompt serialization logic.

---

## Validation Layer

Reuse wherever possible.

Existing validation helpers should continue handling:

- JSON validation
- structured parsing
- hallucination protection
- schema validation
- output sanitation

Only introduce new schemas for evaluation-specific contracts.

---

## Persistence Layer

Reuse completely.

Persistence remains outside the scope of this milestone.

The Evaluator produces Evaluation Reports only.

Memory integration will consume these reports in a future milestone.

---

# Scope

## In Scope

Implement the complete Evaluator V1.

Introduce the evaluation contract.

Implement the evaluation prompt builder.

Implement the evaluation runner.

Integrate the evaluator into the generation pipeline.

Produce structured Evaluation Reports.

Validate candidate ideas against the approved reasoning contract.

Preserve complete backwards compatibility.

Introduce comprehensive unit, integration and regression testing.

---

## Out Of Scope

Memory implementation

Learning persistence

Publishing outcome feedback

Signal extraction

Creator Identity redesign

Reasoning Engine redesign

Idea generation redesign

Database migrations

MongoDB schema changes

Authentication

API routes

UI

Background workers

---

# New Module Structure

Introduce a dedicated evaluation domain.

src/lib/evaluator/

Expected responsibilities

evaluation-report-schema.js

Defines the complete Evaluation Report contract.

---

build-evaluator-prompt.js

Compiles the evaluation prompt.

Responsible only for prompt construction.

No orchestration.

---

run-evaluator.js

Owns the evaluation execution lifecycle.

Responsibilities include:

- assembling evaluation inputs
- invoking Gemini
- validating responses
- returning the Evaluation Report

No persistence.

No packet construction.

No memory updates.

---

Future evaluator modules may be introduced as the intelligence system evolves.

---

# Existing Files To Modify

The following files should receive only the minimum changes required.

src/lib/ideas/run-idea-generation.js

Responsibilities

- invoke the Evaluator after candidate generation
- preserve existing generation behaviour
- support feature-flag routing
- expose Evaluation Reports for downstream systems

---

src/lib/ideas/build-idea-prompt.js

No architectural redesign.

Only minimal modifications if required to support evaluation metadata.

---

run-tests.ps1

Append all Evaluator test suites.

Do not remove existing tests.

---

# Feature Flags

Milestone 3 must remain completely reversible.

The repository should support two evaluation modes.

Mode 1

Evaluation disabled.

Candidate generation completes without evaluation.

---

Mode 2

ENABLE_EVALUATOR_V1=true

Generated ideas are evaluated before leaving the generation pipeline.

Rejected ideas should never appear as accepted outputs.

---

# Implementation Philosophy

This milestone is an architectural extension.

It is not a redesign.

Every implementation decision should prefer:

- extension over replacement
- adaptation over duplication
- feature flags over destructive migration
- backward compatibility over aggressive refactoring

The objective is to introduce a robust evaluation layer while preserving the stability of the existing cognitive pipeline.

# Implementation Phases

Milestone 3 is intentionally divided into small engineering phases.

Each phase must compile successfully before the next begins.

Every phase must preserve backwards compatibility.

---

# Phase 3.1 — Evaluation Contract

## Objective

Introduce the Evaluation Report contract.

No prompt construction.

No orchestration.

No pipeline integration.

Only define and validate the evaluation schema.

---

## Create

src/lib/evaluator/

evaluation-report-schema.js

---

## Responsibilities

Define the complete Evaluation Report contract.

The report represents judgment, not generation.

The contract should expose the following sections.

Identity Alignment

- score
- explanation

Reasoning Alignment

- score
- explanation

Opportunity Fidelity

- score
- explanation

Generation Contract Compliance

- score
- explanation
- violatedConstraints

Audience Alignment

- score
- explanation

Novelty

- score
- explanation

Strategic Value

- score
- explanation

Overall Verdict

- recommendation (APPROVE | REJECT)
- summary

Validated Learnings

Array of durable learnings extracted from accepted ideas.

Rejection Reasons

Array describing why rejected ideas failed evaluation.

---

## Acceptance Criteria

- Schema validates successfully.
- Zod validation passes.
- No pipeline changes exist.

---

# Phase 3.2 — Evaluation Prompt Builder

## Objective

Introduce the Evaluator prompt compiler.

No orchestration changes.

---

## Create

src/lib/evaluator/

build-evaluator-prompt.js

---

## Responsibilities

Construct the evaluation prompt using:

- Creator Identity
- Reasoning Contract
- Candidate Idea

The prompt should guide the model through the approved evaluation flow.

The Evaluator must never generate new ideas.

It judges existing ideas only.

The prompt should produce a valid Evaluation Report.

---

## Acceptance Criteria

- Prompt builder compiles.
- Existing prompt builders remain unchanged.

---

# Phase 3.3 — Evaluation Runner

## Objective

Execute the Evaluator.

---

## Create

run-evaluator.js

---

## Responsibilities

Receive:

- Creator Identity
- Reasoning Contract
- Candidate Idea

Build the evaluation prompt.

Invoke the existing generateJson wrapper.

Validate against evaluation-report-schema.js.

Return the Evaluation Report.

Do not:

- modify ideas
- update memory
- persist data

---

## Modify

src/lib/ideas/run-idea-generation.js

Responsibilities

Introduce:

ENABLE_EVALUATOR_V1

Execution flow:

Candidate Ideas

↓

Evaluator

↓

Evaluation Report

↓

Return to orchestrator

The existing pipeline must remain fully operational.

---

## Acceptance Criteria

- Feature flag routing works.
- Existing generation path still works.
- Build succeeds.

---

# Phase 3.4 — Pipeline Integration

## Objective

Integrate the Evaluator into the production pipeline.

---

## Responsibilities

When evaluation is enabled:

Every generated candidate must be evaluated before leaving the pipeline.

The Evaluator must produce an Evaluation Report for every candidate.

The Evaluator does not approve or reject candidates.

The orchestrator is responsible for interpreting the Evaluation Report and deciding whether a candidate proceeds.

Accepted candidates should carry their Evaluation Report.

Rejected candidates should remain available to the orchestrator for logging, future analytics and Memory integration.

The Generator must remain completely unaware of the evaluation implementation.

The Evaluator consumes ideas.

The Generator never consumes evaluation.

---

## Acceptance Criteria

- Accepted candidates include Evaluation Reports.
- Rejected candidates are filtered correctly.
- Legacy behaviour remains available when evaluation is disabled.

---

# Phase 3.5 — Production Readiness

## Objective

Validate the complete Evaluator implementation.

---

## Create

tests/

evaluation-report-schema.test.mjs

build-evaluator-prompt.test.mjs

run-evaluator.test.mjs

pipeline-evaluator.test.mjs

---

## Required Tests

Schema validation

Prompt generation

Evaluator execution

Feature flag routing

Evaluation report validation

Accepted candidate flow

Rejected candidate flow

Backward compatibility

Pipeline integrity

Regression testing

---

## Regression

Run:

npm run build

Run:

run-tests.ps1

All existing tests must continue passing.

---

# Definition Of Done

Milestone 3 is complete when:

✓ Evaluation Report contract validates.

✓ Evaluation prompt compiles.

✓ Evaluation runner executes.

✓ Pipeline integration works.

✓ Feature flags operate correctly.

✓ Accepted ideas contain Evaluation Reports.

✓ The orchestrator correctly interprets Evaluation Reports and applies the configured approval policy.

✓ Build succeeds.

✓ All regression tests pass.

✓ No architectural invariants are violated.

✓ No database migrations occur.

✓ No production regressions occur.

# Acceptance Criteria

Milestone 3 is considered complete only when all of the following conditions are satisfied.

## Functional Requirements

- Evaluator V1 is fully implemented.
- The Evaluation Report contract validates successfully.
- Creator Identity is used as an immutable evaluation reference.
- The Reasoning Contract is treated as the authoritative strategic reference.
- Candidate ideas are evaluated without modifying their content.
- Every evaluated candidate produces an Evaluation Report.
- The orchestrator correctly interprets Evaluation Reports and applies the configured approval policy.
- Existing generation behaviour remains available through feature flags.

---

## Architectural Requirements

The implementation must preserve the approved Creator Intelligence architecture.

Specifically:

- Evaluation remains ephemeral.
- Creator Identity remains immutable.
- The Reasoning Engine remains the only source of strategy.
- The Evaluator never performs reasoning.
- The Evaluator never generates ideas.
- The Evaluator never rewrites ideas.
- Memory remains outside the scope of this milestone.
- Evaluation Reports become the only output of the Evaluator.

---

## Engineering Requirements

The implementation must:

- Build successfully.
- Pass all existing regression tests.
- Pass all newly introduced Evaluator tests.
- Preserve backward compatibility.
- Avoid breaking existing APIs.
- Avoid database schema changes.
- Avoid MongoDB migrations.
- Avoid prompt regressions.

---

## Code Quality Requirements

The implementation should:

- Minimize duplication.
- Follow existing repository conventions.
- Keep responsibilities clearly separated.
- Keep modules small and focused.
- Prefer extension over replacement.
- Avoid speculative abstractions.

---

# Deliverables

## New Files

Expected additions include:

- evaluation-report-schema.js
- build-evaluator-prompt.js
- run-evaluator.js
- evaluation-report-schema.test.mjs
- build-evaluator-prompt.test.mjs
- run-evaluator.test.mjs
- pipeline-evaluator.test.mjs

Additional helper files may be introduced only when they eliminate duplication or significantly improve maintainability.

---

## Modified Files

Expected modifications include:

- run-idea-generation.js
- run-tests.ps1

Only modify build-idea-prompt.js if evaluation metadata must be exposed.

No other production files should be modified unless implementation reveals a genuine architectural necessity.

---

# Explicit Non-Goals

This milestone must NOT:

- redesign Creator Identity
- redesign the Signal Engine
- redesign the Reasoning Engine
- redesign Idea Generation
- implement Memory
- modify persistence
- redesign database models
- introduce UI changes
- introduce API endpoints
- introduce background workers
- introduce autonomous agents

The objective is to introduce the Evaluator, not to redesign NIVO.

---

# Definition of Done

Milestone 3 is complete when:

✓ Evaluation Report validates successfully.

✓ Evaluation prompt compiles.

✓ Evaluation runner executes successfully.

✓ Pipeline integration functions correctly.

✓ Every candidate receives an Evaluation Report.

✓ The orchestrator correctly applies the configured approval policy.

✓ Build succeeds.

✓ All regression tests pass.

✓ No architectural invariants are violated.

✓ No production regressions are introduced.

