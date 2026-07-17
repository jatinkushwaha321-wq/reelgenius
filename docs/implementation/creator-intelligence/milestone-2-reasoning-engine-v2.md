# Milestone 2 — Reasoning Engine V2

>Status: Planned
>
>Owner: NIVO Engineering
>
>Prerequisite: Milestone 1 — Creator Identity Layer ✅

---

# Objective

Implement the Reasoning Engine V2 as the cognitive core of NIVO.

The Reasoning Engine is responsible for transforming evidence into strategy.

It does **not** generate ideas.

It interprets creator identity, observed evidence, audience context, and historical knowledge to produce a structured reasoning contract that downstream systems consume.

The output of this milestone becomes the single source of truth for:

- Idea Generation
- Evaluator
- Memory (future)
- Explainability
- Future analytics

This milestone replaces the internal reasoning process while preserving complete backward compatibility through feature flags.

---

# Vision

NIVO should not behave like a prompt that directly generates ideas.

Instead it should think in layers.

Observed evidence should become strategic understanding.

Strategic understanding should become opportunities.

Opportunities should become ideas.

Ideas should become evaluated knowledge.

---

# Architectural Invariants

These rules are mandatory.

Implementation must never violate them.

---

## 1. Reasoning Is Ephemeral

Reasoning exists only during a single execution cycle.

It is never persisted.

Every execution begins from fresh inputs.

---

## 2. Identity Guides Reasoning

Creator Identity is the primary lens through which observations are interpreted.

Reasoning must never optimize for audience preferences by violating creator identity.

Identity always precedes audience interpretation.

---

## 3. Signals Are Evidence

Signals are observations.

Signals are not conclusions.

Reasoning is responsible for transforming evidence into understanding.

---

## 4. Memory Is Context

Memory is not a reasoning stage.

Memory provides historical context to reasoning.

Reasoning consumes Memory.

Reasoning never owns Memory.

---

## 5. Reasoning Produces Strategy

Reasoning must never generate content ideas.

Its responsibility ends at strategic opportunity planning.

Idea Generation converts strategy into content.

---

## 6. Evaluator Never Re-Reasons

The Evaluator consumes the reasoning contract.

It must never recreate reasoning independently.

Evaluation validates.

Reasoning interprets.

---

## 7. Identity Is Immutable

Creator Identity remains immutable throughout an execution cycle.

Reasoning may interpret identity.

It may never modify identity.

---

## 8. Strategy Before Opportunity

The engine must determine strategic direction before proposing opportunities.

Opportunities are consequences of strategy.

They are never generated independently.

---

## 9. Opportunity Before Generation

The Idea Generator may only consume approved opportunities.

It must never invent new strategic directions.

---

## 10. Explainability Is Mandatory

Every opportunity produced by the Reasoning Engine must be explainable through observed evidence.

No opportunity may exist without evidence.

Future milestones may expose this reasoning to users.

---

# High-Level Cognitive Flow

Observed Content

↓

Signal Engine

↓

Creator Identity

↓

Memory Context

↓

Situation Assessment

↓

Identity Interpretation

↓

Audience Interpretation

↓

Strategic Direction

↓

Opportunity Planning

↓

Generation Contract

↓

Idea Generator

↓

Evaluator

↓

Memory (Future Persistence)

---

# Milestone Goal

At the end of Milestone 2, the repository should contain a fully functional Reasoning Engine V2 that produces a structured reasoning contract while preserving the existing idea generation pipeline through feature flags.

No production behaviour should regress.

No existing prompt should break.

No database migrations are required.

# Repository Understanding

Milestone 1 introduced the Creator Identity abstraction while preserving complete backward compatibility with the existing idea generation pipeline.

The current repository already contains a mature Reasoning Engine MVP and a production-ready generation pipeline.

The purpose of Milestone 2 is **not** to replace the existing pipeline.

Instead, it introduces a new cognitive reasoning engine that coexists alongside the MVP through feature flags until V2 is validated.

The implementation should maximize reuse of existing infrastructure and avoid unnecessary rewrites.

---

# Existing Repository Components

The following components already exist and should remain the foundation of the system.

## Creator Identity

Reuse completely.

- CreatorIdentity Schema
- buildCreatorIdentity()
- loadCreatorIdentity()

These components become the primary identity input for Reasoning Engine V2.

No architectural changes are expected.

---

## Signal Engine

Reuse completely.

Existing signal extraction, scoring, ranking, balancing and normalization logic remains unchanged.

Signals continue acting as evidence providers.

Reasoning consumes signals.

Reasoning never computes signals.

---

## Packet Builder

Reuse with minimal modifications.

buildIdeaPacket() already assembles the execution context.

Milestone 2 should extend the packet rather than replacing it.

Required additions include:

- creatorIdentity
- memoryContext (future-ready)
- reasoningContext (V2)

Legacy creatorContext must remain available for backward compatibility.

---

## Prompt Infrastructure

Reuse completely.

The existing Gemini wrapper, shared prompt scaffolding and JSON generation utilities remain unchanged.

Do not duplicate prompt utilities.

---

## Validation Layer

Reuse wherever possible.

Existing validation helpers should continue protecting:

- hallucination prevention
- JSON validation
- output sanitation
- epistemic guardrails
- duplicate filtering

Only introduce new schemas where V2 requires additional structures.

---

## Persistence Layer

Reuse completely.

Idea persistence, ranking and database interactions are outside the scope of this milestone.

Reasoning Engine V2 produces inputs for these systems.

It never replaces them.

---

# Scope

## In Scope

Introduce the complete Reasoning Engine V2.

Create a dedicated reasoning domain.

Implement the new reasoning contract.

Implement the six-stage cognitive reasoning pipeline.

Introduce feature-flag routing between MVP and V2.

Update the packet builder to expose CreatorIdentity and future Memory context.

Update the Idea Generator so it consumes the V2 reasoning contract.

Introduce comprehensive unit, integration and regression testing.

---

## Out Of Scope

Memory implementation

Evaluator implementation

Database migrations

MongoDB schema changes

UI

API routes

Authentication

Signal extraction algorithms

Creator Identity redesign

Idea persistence redesign

Ranking redesign

---

# New Module Structure

Introduce a dedicated reasoning domain.

src/lib/reasoning/

Expected responsibilities

reasoning-engine-v2-schema.js

Defines the complete Reasoning Engine V2 contract.

---

build-reasoning-v2-prompt.js

Compiles the six-stage cognitive reasoning prompt.

Responsible only for prompt construction.

No orchestration.

---

run-reasoning-engine-v2.js

Owns the execution lifecycle.

Responsibilities include:

- assembling reasoning inputs
- invoking Gemini
- validating responses
- returning the reasoning contract

No persistence.

No packet building.

No prompt construction.

---

Future modules may be added to this domain as the intelligence system evolves.

---

# Existing Files To Modify

The following files should receive only the minimum changes required.

src/lib/ideas/run-idea-generation.js

Responsibilities

- Route execution through feature flags.
- Invoke Reasoning Engine V2 when enabled.
- Preserve the existing MVP path.
- Preserve the non-reasoning fallback.

---

src/lib/ideas/build-idea-packet.js

Responsibilities

Expose

- creatorIdentity
- reasoningContext
- future-ready memoryContext

Maintain the legacy creatorContext adapter.

Do not remove existing packet fields.

---

src/lib/ideas/build-idea-prompt.js

Responsibilities

Detect whether the reasoning context follows the MVP contract or the V2 contract.

Consume V2 strategic opportunities.

Consume positioning thesis.

Consume generation contract.

Preserve the legacy prompt path.

---

run-tests.ps1

Append all new Reasoning Engine V2 test suites.

Do not remove existing tests.

---

# Feature Flags

Milestone 2 must remain completely reversible.

The repository should support three execution modes.

Mode 1

No reasoning.

Current production fallback.

---

Mode 2

Reasoning Engine MVP.

Enabled through:

ENABLE_REASONING_ENGINE_MVP=true

---

Mode 3

Reasoning Engine V2.

Enabled through:

ENABLE_REASONING_ENGINE_V2=true

When V2 is enabled it becomes the exclusive reasoning provider.

The MVP should remain available until V2 is fully validated.

---

# Implementation Philosophy

This milestone is an architectural evolution.

It is not a rewrite.

Every implementation decision should prefer:

- extension over replacement
- adaptation over duplication
- feature flags over destructive migration
- backward compatibility over aggressive refactoring

The objective is to introduce the cognitive reasoning engine while leaving the surrounding production pipeline stable.

# Implementation Phases

Milestone 2 is intentionally divided into small engineering phases.

Each phase should compile successfully before the next begins.

Every phase must preserve backwards compatibility.

---

# Phase 2.1 — Reasoning Contract

## Objective

Introduce the Reasoning Engine V2 output contract.

This phase defines the cognitive contract that all downstream systems will consume.

No orchestration changes.

No prompt changes.

No pipeline integration.

No idea generation changes.

Only define and validate the Reasoning Engine V2 contract.

---

## Create

src/lib/reasoning/

reasoning-engine-v2-schema.js

---

## Responsibilities

Define the complete Reasoning Engine V2 output schema.

The contract represents structured reasoning, not generated content.

It becomes the interface between the Reasoning Engine and downstream systems.

The reasoning contract must expose the following sections.

---

### Situation Assessment

Purpose

Describe what was observed without interpretation.

Fields

- observations
- emergingPatterns

---

### Identity Interpretation

Purpose

Interpret observations through the Creator Identity.

Fields

- identityAlignment
- reinforcedBeliefs
- creatorStrengths

---

### Audience Interpretation

Purpose

Interpret the observations from the audience's perspective.

Fields

- currentState
- desiredState
- audienceTensions

---

### Strategic Direction

Purpose

Determine the long-term strategic direction for the creator.

Fields

- positioningThesis
- strategicGoal

---

### Opportunity Planning

Purpose

Produce strategic opportunities that align with the chosen direction.

Each opportunity should contain:

- title
- creatorPerspective
- audienceProblem
- supportingEvidence
- evidenceStrength

The Reasoning Engine proposes opportunities.

It does not generate content ideas.

---

### Generation Contract

Purpose

Provide structured guidance for downstream Idea Generation.

The contract must distinguish the source of every constraint.

Fields

- identityConstraints
- memoryConstraints
- reasoningConstraints

---

## Validation

Create a Zod schema validating the complete reasoning contract.

Every section should be independently validated.

The contract should fail validation if required cognitive sections are missing.

---

## Acceptance Criteria

✓ Schema validates successfully.

✓ Zod validation passes.

✓ No orchestration changes.

✓ No prompt changes.

✓ No pipeline integration.

✓ No production behaviour changes.

## Objective

Introduce the new Reasoning Engine V2 contract.

No orchestration changes.

No prompt changes.

No pipeline integration.

Only define and validate the cognitive contract.

---

## Create

src/lib/reasoning/

reasoning-engine-v2-schema.js

---

## Responsibilities

Define the complete Reasoning Engine V2 output schema.

The contract represents cognition, not generated content.

The schema should contain the following cognitive stages.

Situation Assessment

- observations
- emergingPatterns

Identity Interpretation

- identityAlignment
- reinforcedBeliefs
- creatorStrengths

Audience Interpretation

- currentState
- desiredState
- audienceTensions

Strategic Direction

- positioningThesis
- strategicGoal

Opportunity Planning

Array of opportunities.

Each opportunity should contain:

- title
- creatorPerspective
- audienceProblem
- supportingEvidence
- evidenceStrength

Generation Contract

Must expose three independent constraint namespaces.

identityConstraints

memoryConstraints

reasoningConstraints

---

## Acceptance Criteria

- Schema validates successfully.
- Zod validation passes.
- No pipeline changes exist.

---

# Phase 2.2 — Prompt Construction

## Objective

Introduce the new reasoning prompt.

No orchestration changes.

---

## Create

build-reasoning-v2-prompt.js

---

## Responsibilities

Compile the reasoning prompt using only:

- Creator Identity
- Signals
- Observed Content
- Memory Context (optional)

The prompt should produce the complete V2 reasoning contract.

It must never generate ideas.

It generates strategy only.

---

## Acceptance Criteria

- Prompt builder compiles.
- Existing prompt builders remain unchanged.

---

# Phase 2.3 — Orchestration

## Objective

Execute the new reasoning engine.

---

## Create

run-reasoning-engine-v2.js

---

## Responsibilities

Receive

- Creator Identity
- Signals
- Observed Content
- Memory Context

Build prompt.

Invoke Gemini.

Validate JSON.

Return reasoning contract.

Do not persist anything.

Do not build idea packets.

Do not call the Idea Generator.

---

## Modify

run-idea-generation.js

---

Responsibilities

Introduce

ENABLE_REASONING_ENGINE_V2

feature flag.

Execution flow becomes:

Feature Flag Disabled

↓

Existing MVP

Feature Flag Enabled

↓

Reasoning Engine V2

↓

Idea Generator

The MVP implementation must remain fully operational.

---

## Acceptance Criteria

- Feature flag routing works.
- Existing MVP path still works.
- Build succeeds.

---

# Phase 2.4 — Idea Generator Integration

## Objective

Teach the existing Idea Generator to consume the new reasoning contract.

---

## Modify

build-idea-prompt.js

---

## Responsibilities

Consume

- positioningThesis
- strategicGoal
- opportunities
- generationContract

The Idea Generator must remain responsible only for content generation.

It must never perform strategic reasoning.

It consumes strategy.

It does not create strategy.

---

## Acceptance Criteria

- Prompt builds successfully.
- Generated ideas derive only from reasoning opportunities.
- Legacy prompt path remains available.

---

# Phase 2.5 — Validation & Testing

## Create

tests/

reasoning-engine-v2.test.mjs

---

## Required Tests

Schema validation

Prompt generation

Reasoning execution

Feature flag routing

Legacy compatibility

Adapter compatibility

Packet integrity

Reasoning contract integrity

Opportunity validation

Generation contract validation

---

## Regression

Run

npm run build

Run

run-tests.ps1

All existing tests must continue passing.

---

# Definition Of Done

Milestone 2 is complete when:

✓ Reasoning Engine V2 exists.

✓ The V2 contract validates.

✓ Feature flag routing functions.

✓ MVP remains operational.

✓ Idea Generation consumes V2 reasoning.

✓ All regression tests pass.

✓ Build succeeds.

✓ No database migrations occur.

✓ No prompt regressions occur.

✓ No behavioural regressions occur.

# Acceptance Criteria

Milestone 2 is considered complete only when all of the following conditions are satisfied.

## Functional Requirements

- Reasoning Engine V2 is fully implemented.
- The V2 reasoning contract validates successfully.
- Creator Identity is the primary reasoning input.
- Existing Signal Engine is reused without modification.
- Existing Idea Generator consumes the V2 reasoning contract.
- Existing MVP reasoning pipeline remains available through feature flags.
- The repository supports seamless switching between MVP and V2 reasoning.

---

## Architectural Requirements

The implementation must preserve the approved Creator Intelligence architecture.

Specifically:

- Reasoning remains ephemeral.
- Creator Identity remains immutable during execution.
- Memory is treated only as contextual input.
- Reasoning produces strategy, never ideas.
- Idea Generation consumes strategy, never performs reasoning.
- Evaluation remains outside the reasoning engine.
- No unnecessary abstractions are introduced.
- Existing repository components are reused wherever appropriate.

---

## Engineering Requirements

The implementation must:

- Build successfully.
- Pass all existing regression tests.
- Pass all newly introduced Reasoning Engine V2 tests.
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

The implementation is expected to introduce a dedicated reasoning module.

Expected additions include:

- reasoning-engine-v2-schema.js
- build-reasoning-v2-prompt.js
- run-reasoning-engine-v2.js
- reasoning-engine-v2.test.mjs

Additional helper files may be introduced only when they eliminate duplication or significantly improve maintainability.

---

## Modified Files

Expected modifications include:

- run-idea-generation.js
- build-idea-packet.js
- build-idea-prompt.js
- run-tests.ps1

No other production files should be modified unless implementation reveals a genuine architectural necessity.

---

# Explicit Non-Goals

This milestone must NOT:

- redesign Creator Identity
- redesign the Signal Engine
- redesign the Evaluator
- implement Memory
- modify authentication
- modify persistence
- redesign database models
- introduce UI changes
- introduce API endpoints
- introduce background workers
- introduce autonomous agents
- redesign the existing generation pipeline

The objective is to introduce Reasoning Engine V2, not to rebuild NIVO.

---

# Definition of Done

Milestone 2 is complete when:

✓ Reasoning Engine V2 produces a valid reasoning contract.

✓ The reasoning contract becomes the single source of strategic guidance for Idea Generation.

✓ Existing production behaviour remains available through feature flags.

✓ The repository builds successfully.

✓ All regression tests pass.

✓ New reasoning tests pass.

✓ No architectural invariants are violated.

✓ No production regressions are introduced.

At this point, NIVO possesses a fully functional cognitive reasoning layer while maintaining complete backward compatibility with the existing production pipeline.

---

# Implementation Rules

The implementation model must follow these rules throughout the milestone.

## Rule 1 — Preserve Architecture

Do not redesign the approved architecture.

If implementation exposes an architectural conflict, stop and report it instead of introducing an alternative design.

---

## Rule 2 — Repository First

Inspect the existing repository before introducing new abstractions.

Prefer extending existing components over creating parallel implementations.

---

## Rule 3 — Backward Compatibility

Every implementation decision should preserve the existing MVP unless explicitly instructed otherwise.

Feature flags should be used for all behavioural transitions.

---

## Rule 4 — Smallest Safe Change

Choose the smallest implementation that satisfies the milestone.

Avoid speculative engineering.

---

## Rule 5 — Build Continuously

Each implementation phase should:

- compile successfully,
- pass its relevant tests,
- preserve repository stability,

before proceeding to the next phase.

---

## Final Deliverable

After implementation, provide an engineering report containing:

- Summary
- Files Added
- Files Modified
- Architectural Decisions
- Build Result
- Test Result
- Known Limitations (if any)

Do not include unnecessary code snippets.

Focus on implementation outcomes and engineering decisions.