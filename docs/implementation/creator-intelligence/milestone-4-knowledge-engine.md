# Milestone 4 — Knowledge Engine

> Status: Planned
>
> Owner: NIVO Engineering
>
> Prerequisite: Milestone 3 — Evaluator V1 ✅

---

# Objective

Implement the Knowledge Engine V1 as the long-term learning and memory distillation layer of NIVO.

The Knowledge Engine transforms validated Evaluation Reports into durable, evidence-backed strategic knowledge that continuously improves future reasoning.

It determines what principles should be remembered from accumulated evidence, strengthens proven strategies, weakens obsolete ideas, and selectively retrieves relevant knowledge for future generation cycles.

The Knowledge Engine does **not** generate ideas.

It does **not** evaluate ideas directly.

It does **not** replace the Reasoning Engine.

It closes the cognitive loop, enabling NIVO to evolve from a stateless generation pipeline into a progressively improving strategic intelligence platform while preserving complete backward compatibility through feature flags.

---

# Vision

NIVO should not remember everything.

Raw historical events, chat transcripts, uncurated ideas, and transient evaluation scores create cognitive noise that degrades long-term reasoning.

Instead, NIVO should remember what matters.

Every stored knowledge item must be earned through validated evidence.

Rather than asking:

"What happened in the past?"

The Knowledge Engine asks:

"What reusable evidence-backed principles will improve future strategic reasoning?"

---

# Architectural Invariants

These rules are mandatory.

Implementation must never violate them.

---

## 1. Knowledge Is Earned

Knowledge cannot be assumed, generated directly from LLM prompts, or hallucinated.

Every knowledge item must originate from validated evaluation evidence.

---

## 2. Knowledge Is Evidence-Backed

Every stored knowledge item must be supported by one or more validated observations from Evaluation Reports.

Knowledge without supporting evidence is considered invalid and must not be promoted to durable status.

---

## 3. Knowledge Is Reusable

Knowledge must improve future strategic reasoning.

Historical records, debug traces, or transient evaluation scores that cannot influence future strategic decisions do not belong in the Knowledge Engine.

---

## 4. Knowledge Evolves

Knowledge is never considered permanently true.

As new evidence appears across execution cycles, knowledge must be capable of strengthening, weakening, splitting, merging, or becoming obsolete.

---

## 5. Knowledge Influences Future Reasoning

The purpose of knowledge is to improve future strategic decisions.

Knowledge exists to support reasoning—not replace it. The Reasoning Engine consumes knowledge during strategic planning.

---

## 6. Knowledge Is Never Fabricated

Neither language models nor internal reasoning systems may invent knowledge directly during generation or evaluation.

Only validated experiences processed through the Knowledge Engine may become durable knowledge.

---

## 7. Knowledge Is Probabilistic

Knowledge represents the system's current best understanding based on accumulated evidence.

It adapts when new observations contradict previous conclusions.

---

## 8. Evaluation Produces Evidence, Not Knowledge

The Evaluator produces transient Evaluation Reports during a single execution cycle.

The Knowledge Engine consumes these reports to extract, consolidate, and validate candidate knowledge items.

---

## 9. Reasoning Consumes Knowledge, Never Creates It

The Reasoning Engine retrieves selectively ranked knowledge to inform strategic direction.

It never writes or mutates stored knowledge directly.

---

## 10. Backward Compatibility Is Mandatory

The Knowledge Engine must integrate without breaking existing repository behavior.

All feature flags and existing generation pathways must remain functional throughout implementation.

---

# High-Level Cognitive Flow

```
Observed Content
        │
        ▼
Signal Engine
        │
        ▼
Creator Identity
        │
        ▼
Reasoning Engine ◄───────┐
        │                │
        ▼                │ Selective
Idea Generator           │ Retrieval
        │                │
        ▼                │
Evaluator                │
        │                │
        ▼                │
Evaluation Report        │
        │                │
        ▼                │
Knowledge Engine ────────┤
        │                │
        ▼                │
Knowledge Store ─────────┘
```

---

# Inputs / Outputs

| Component | Inputs | Outputs |
|-----------|--------|---------|
| Knowledge Candidate Extraction | Evaluation Report | Knowledge Candidate |
| Knowledge Consolidation | Knowledge Candidate, Existing Knowledge Store | Validated Knowledge (or Updated Candidate) |
| Knowledge Retrieval | Reasoning Request Context, Knowledge Store | Relevant Knowledge Context |

---

# Milestone Goal

At the end of Milestone 4, the repository should contain a fully functional Knowledge Engine capable of extracting candidate learnings from Evaluation Reports, deterministically consolidating evidence over time into durable knowledge, and selectively retrieving relevant knowledge to improve future reasoning cycles while preserving complete backward compatibility with the existing pipeline.

No production behavior should regress.

No destructive database migrations occur without explicit feature flag isolation.

---

# Repository Understanding

Milestone 1 established immutable Creator Identity.

Milestone 2 introduced the complete Reasoning Engine V2 to drive strategy.

Milestone 3 introduced the Evaluator V1 to inspect generated candidate ideas against the reasoning contract, producing structured Evaluation Reports.

The repository now possesses a complete single-cycle cognitive pipeline (`Observe -> Reason -> Generate -> Evaluate`).

The purpose of Milestone 4 is **not** to redesign this pipeline or modify the internal logic of previous milestones.

Instead, it introduces the Knowledge Engine as the cross-cycle learning domain that consumes Evaluation Reports, accumulates evidence, and feeds relevant insights back into future reasoning executions.

The implementation must maximize reuse of existing contracts while keeping the Knowledge Engine modular, testable, and deterministic where required.

---

# Existing Repository Components

The following components already exist and should remain the foundation of the architecture.

## Creator Identity

Reuse completely.

Creator Identity remains the fixed reference describing who the creator is.

The Knowledge Engine organizes Creator Knowledge and Audience Knowledge alongside identity without ever mutating identity documents.

---

## Signal Engine

Reuse completely.

Signals provide raw observation evidence.

The Knowledge Engine never extracts raw signals directly; it consumes validated learnings from Evaluation Reports.

---

## Reasoning Engine V2

Reuse completely.

Reasoning Engine V2 remains the authoritative source of strategic intent.

It will be integrated with Knowledge Retrieval (`Phase 4.4` & `Phase 4.5`) so that before generating a reasoning contract, relevant historical learnings are injected into the reasoning prompt.

---

## Idea Generator

Reuse completely.

The Idea Generator remains responsible only for transforming strategy into candidate content.

It does not interact with the Knowledge Engine directly.

---

## Evaluator V1

Reuse completely.

The Evaluator produces structured Evaluation Reports (`APPROVE` / `REJECT` verdicts, scores, violated constraints, and `validatedLearnings`).

The Knowledge Engine consumes these reports as raw evidence inputs.

---

## Prompt Infrastructure & Validation Layer

Reuse completely.

Continue using shared NIVO prompt construction utilities and Zod validation helpers.

Do not duplicate validation frameworks or serialization mechanisms.

---

# Scope

## In Scope

Implement the complete Knowledge Engine V1 domain (`src/lib/knowledge/`).

Define data contracts for Knowledge Candidates, Validated Knowledge, and Retrieval Contexts (`Phase 4.1`).

Implement candidate extraction from Evaluation Reports (`Phase 4.2`).

Implement deterministic knowledge consolidation, evidence accumulation, strengthening, weakening, and hypothesis promotion (`Phase 4.3`).

Implement selective, relevance-ranked knowledge retrieval (`Phase 4.4`).

Integrate the Knowledge Engine into the generation and reasoning pipelines under feature flags (`Phase 4.5`).

Preserve complete backward compatibility.

Introduce comprehensive unit, integration, and regression test suites (`Phase 4.6`).

---

## Out Of Scope

Redesign of Creator Identity, Signal Engine, Reasoning Engine V2, or Evaluator V1.

Idea generation redesign or prompt alterations outside knowledge context injection.

Direct LLM-based reasoning during the consolidation phase (`Phase 4.3` must remain deterministic).

Destructive MongoDB schema migrations or legacy data purges.

Authentication, UI, API route changes, or background queue processing systems.

---

# New Module Structure

Introduce a dedicated knowledge domain.

`src/lib/knowledge/`

Expected module responsibilities:

`knowledge-contracts.js`

Defines the complete data contracts for candidates, validated items, and retrieval queries using Zod.

---

`extract-knowledge-candidate.js`

Transforms Evaluation Reports into normalized Knowledge Candidate objects.

Responsible only for hypothesis creation and statement normalization.

No validation, consolidation, or persistence.

---

`consolidate-knowledge.js`

Owns deterministic evidence accumulation and lifecycle transitions.

Responsible for merging similar items, managing evidence counts and strength scores, handling contradictions, and promoting hypotheses to validated knowledge.

No LLM calls. No heuristic guesswork outside defined rules.

---

`retrieve-knowledge.js`

Owns selective retrieval and ranking of stored knowledge for reasoning requests.

Responsible for filtering irrelevant items, scoring relevance, and formatting structured knowledge context for the Reasoning Engine.

No reasoning generation.

---

`knowledge-store.js`

Provides the data access abstraction for storing and loading knowledge candidates and validated items cleanly without breaking existing persistence layers.

---

# Existing Files To Modify

The following files should receive only the minimum changes required.

`src/lib/ideas/run-idea-generation.js`

Responsibilities:

- Invoke `extractKnowledgeCandidate` and `consolidateKnowledge` after Evaluator execution when `ENABLE_KNOWLEDGE_ENGINE_V1=true`.
- Invoke `retrieveKnowledge` prior to calling the Reasoning Engine when both reasoning and knowledge engines are active.
- Preserve existing generation behavior exactly when feature flags are disabled.

---

`src/lib/reasoning/build-reasoning-prompt.js`

Responsibilities:

- Include retrieved knowledge context cleanly inside the reasoning prompt structure when provided.

---

`run-tests.ps1`

Responsibilities:

- Append all new Knowledge Engine unit and integration test suites.
- Do not remove existing regression tests.

---

# Feature Flags

Milestone 4 must remain completely reversible.

The repository should support two execution modes controlled by `ENABLE_KNOWLEDGE_ENGINE_V1`.

## Mode 1 — Knowledge Engine Disabled

`ENABLE_KNOWLEDGE_ENGINE_V1=false` (or undefined)

- Candidate generation and evaluation run without extracting or consolidating knowledge.
- Reasoning requests execute without querying historical knowledge retrieval.
- Complete backward compatibility with Milestone 3 behavior.

---

## Mode 2 — Knowledge Engine Enabled

`ENABLE_KNOWLEDGE_ENGINE_V1=true`

- After every evaluated candidate, the resulting Evaluation Report is transformed into Knowledge Candidates and passed through consolidation.
- Before Reasoning Engine execution, relevant validated knowledge is retrieved and injected as strategic context to inform the upcoming cycle.

---

# Implementation Philosophy

This milestone is an architectural extension that turns NIVO into a continuously learning system.

It is not a redesign of existing intelligence layers.

Every implementation decision must prefer:

- modularity over coupling
- deterministic state transitions over non-deterministic LLM operations
- extension over replacement
- feature flags over destructive migration
- backward compatibility over aggressive refactoring

---

# Implementation Phases

Milestone 4 is intentionally divided into small engineering phases.

Each phase must compile and pass validation before the next begins.

Every phase must preserve backward compatibility.

---

# Phase 4.1 — Knowledge Contracts

## Objective

Create all data contracts and validation schemas used across the Knowledge Engine lifecycle.

---

## Responsibilities

Define Knowledge Candidate schema: hypotheses extracted from evaluation, containing normalized statements, category (`Creator` | `Audience` | `Strategy` | `Experiment` | `Evolution`), initial evidence reference, and lifecycle state.

Define Validated Knowledge schema: promoted items with accumulated supporting evidence references, strength metrics, contradiction history, and status (`CANDIDATE` | `VALIDATED` | `DEPRECATED`).

Define Knowledge Retrieval schema: query parameters, ranking criteria, and structured context payload for reasoning injection.

Define shared validation helper utilities and bounds.

Provide comprehensive unit tests covering all schema invariants and rejection boundaries.

No persistence.

No orchestration.

No LLM.

---

## Inputs

- Architectural definitions from `knowledge-engine-v1.md`.
- Contract structures from `evaluation-report-schema.js`.

---

## Outputs

- `src/lib/knowledge/knowledge-contracts.js`
- `tests/knowledge-contracts.test.mjs`

---

## Dependencies

- None (Phase 4.1 is standalone contract definition).

---

## Success Criteria

- Zod schemas validate well-formed Knowledge Candidates, Validated Knowledge objects, and Retrieval structures.
- Schema validation correctly rejects malformed payloads, missing evidence arrays, invalid categories, and out-of-bounds metrics.
- All unit tests pass with `0 FAIL`.
- Zero impact on existing pipeline code.

---

## Explicit Non-Goals

- No persistence logic.
- No pipeline integration.
- No LLM invocation.

---

# Phase 4.2 — Knowledge Candidate Extraction

## Objective

Implement the extraction layer that transforms Evaluation Reports into normalized Knowledge Candidate hypotheses.

---

## Pipeline

Evaluation Report

↓

Knowledge Candidate

---

## Responsibilities

Consume Evaluation Reports (both approved and rejected candidates) and extract potential strategic learnings (`validatedLearnings` and failure patterns).

Normalize statement text to ensure consistent casing, punctuation, and terminology without mutating meaning.

Assign appropriate knowledge categorization (`Creator`, `Audience`, `Strategy`, `Experiment`, `Evolution`).

Attach explicit evidence references (evaluation report ID, candidate idea title/summary, timestamp, and evaluation verdict).

Mark extracted items strictly as hypotheses (`status: 'CANDIDATE'`).

Must NOT:

- validate knowledge
- persist knowledge
- consolidate evidence

---

## Inputs

- `EvaluationReport` (from Evaluator V1).
- `CandidateIdea` and context metadata.

---

## Outputs

- Array of `KnowledgeCandidate` objects compliant with Phase 4.1 contracts.
- `src/lib/knowledge/extract-knowledge-candidate.js`
- `tests/extract-knowledge-candidate.test.mjs`

---

## Dependencies

- Phase 4.1 — Knowledge Contracts.

---

## Success Criteria

- Extraction deterministically maps `validatedLearnings` from approved ideas into positive strategy/creator hypotheses.
- Extraction maps recurring rejection reasons into clear experiment/strategy hypotheses (e.g., identifying unsuccessful approaches).
- Supporting evidence metadata is preserved exactly as traced from the Evaluation Report.
- No candidates are created with `VALIDATED` status at extraction time.
- All unit tests pass.

---

## Explicit Non-Goals

- Must NOT validate or promote knowledge.
- Must NOT persist knowledge directly to storage.
- Must NOT merge or consolidate across multiple reports.

---

# Phase 4.3 — Knowledge Consolidation

## Objective

Implement deterministic knowledge consolidation to accumulate evidence, merge similar hypotheses, handle contradictions, and promote candidates to validated knowledge.

---

## Pipeline

Knowledge Candidate

↓

Knowledge Consolidation

↓

Validated Knowledge

---

## Responsibilities

Accumulate supporting evidence over time when new candidates match existing stored candidates or validated knowledge items.

Merge identical or highly similar statements deterministically using normalized matching keys or exact semantic hashing.

Adjust evidence counts and numerical strength metrics when supporting evidence is added.

Handle contradictory evidence across execution cycles: adjust strength scores downward or transition items to `DEPRECATED` when contradictory observations outweigh supporting evidence.

Promote hypotheses (`CANDIDATE` -> `VALIDATED`) when accumulated supporting evidence meets required deterministic thresholds (e.g., multiple independent positive observations across distinct cycles).

Maintain complete auditability: every consolidated or promoted item must retain its full historical array of evidence references.

This phase should remain deterministic.

Do not use LLM reasoning.

---

## Inputs

- Incoming `KnowledgeCandidate` objects (from Phase 4.2).
- Existing collection of `KnowledgeCandidate` and `ValidatedKnowledge` items from storage/memory.

---

## Outputs

- Updated state collection (`validatedKnowledge`, `updatedCandidates`, `deprecatedItems`).
- `src/lib/knowledge/consolidate-knowledge.js`
- `tests/consolidate-knowledge.test.mjs`

---

## Dependencies

- Phase 4.1 — Knowledge Contracts.
- Phase 4.2 — Knowledge Candidate Extraction.

---

## Success Criteria

- Consolidation executes completely deterministically with zero LLM calls.
- Candidate with sufficient independent supporting evidence transitions to `VALIDATED` status.
- Validated knowledge receiving contradictory observations reduces strength or transitions to `DEPRECATED` correctly.
- Evidence lists accumulate without duplicate identical entries or dropped citations.
- Unit tests verify consolidation under multiple simulated historical scenarios.

---

## Explicit Non-Goals

- Do not use LLM reasoning or prompt calls during consolidation.
- Do not perform non-deterministic probabilistic guessing.
- Do not mutate raw evaluation history.

---

# Phase 4.4 — Knowledge Retrieval

## Objective

Implement selective, relevance-ranked knowledge retrieval to supply structured historical context to future reasoning cycles.

---

## Pipeline

Reasoning Request

↓

Knowledge Retrieval

↓

Relevant Knowledge

---

## Responsibilities

Consume a reasoning request context (creator profile, target audience, topic area, and strategic objectives).

Retrieve candidate matches from the stored `ValidatedKnowledge` collection.

Rank relevance deterministically based on category matching, keyword/topic intersection, evidence strength, and freshness.

Filter out irrelevant or deprecated knowledge items (`status: 'DEPRECATED'` and low-relevance items must be excluded to prevent prompt bloat).

Produce structured knowledge context ready for injection into the Reasoning Engine prompt (`KnowledgeRetrieval` schema).

Retrieval only.

No reasoning.

---

## Inputs

- `ReasoningRequestContext` (`profile`, `userId`, topic/signal parameters).
- Stored `ValidatedKnowledge` collection.

---

## Outputs

- Structured `KnowledgeContext` object containing ranked items grouped by category (`Creator`, `Audience`, `Strategy`, `Experiment`, `Evolution`).
- `src/lib/knowledge/retrieve-knowledge.js`
- `tests/retrieve-knowledge.test.mjs`

---

## Dependencies

- Phase 4.1 — Knowledge Contracts.

---

## Success Criteria

- Retrieval accurately filters out deprecated and unvalidated items (`CANDIDATE` items must never be retrieved for reasoning).
- Retrieval ranks high-strength, category-relevant items ahead of generic or tangential knowledge.
- Output formats cleanly into the schema expected by the Reasoning Engine prompt compiler.
- Retrieval executes deterministically and rapidly without LLM queries.
- All unit tests pass.

---

## Explicit Non-Goals

- No reasoning execution.
- No mutation of stored knowledge during retrieval.
- No direct exposure of raw evaluation logs or chat transcripts.

---

# Phase 4.5 — Pipeline Integration

## Objective

Integrate the complete Knowledge Engine into the existing cognitive generation and reasoning pipeline under feature-flag control (`ENABLE_KNOWLEDGE_ENGINE_V1`).

---

## Pipeline

Evaluation Report

↓

Knowledge Engine

↓

Knowledge Store

↓

Future Reasoning

---

## Responsibilities

Integrate after Evaluator inside `run-idea-generation.js` when `ENABLE_KNOWLEDGE_ENGINE_V1=true`: transform Evaluation Reports into candidates and run consolidation.

Update knowledge storage cleanly using storage adapters (`knowledge-store.js`) without breaking existing database schemas or candidate persistence flows.

Retrieve knowledge for future reasoning (`run-idea-generation.js` / reasoning pipeline): query stored knowledge for the creator and inject the resulting `KnowledgeContext` into the reasoning prompt options (`build-reasoning-prompt.js`).

Preserve backward compatibility when `ENABLE_KNOWLEDGE_ENGINE_V1` is disabled (`false` or unset).

Ensure error isolation: exceptions during knowledge extraction or consolidation must be logged and handled safely according to repository resilience rules without corrupting candidate generation delivery.

---

## Inputs

- Evaluated candidates and Evaluation Reports (`run-idea-generation.js`).
- Reasoning requests (`run-idea-generation.js` / reasoning pipeline).

---

## Outputs

- Modified `src/lib/ideas/run-idea-generation.js`
- Modified `src/lib/reasoning/build-reasoning-prompt.js`
- Storage/adapter integration (`src/lib/knowledge/knowledge-store.js`)
- `tests/pipeline-knowledge.test.mjs`

---

## Dependencies

- Phase 4.1 through Phase 4.4.
- Existing Evaluator V1 (`src/lib/evaluator/`) and Reasoning Engine V2 (`src/lib/reasoning/`).

---

## Success Criteria

- When `ENABLE_KNOWLEDGE_ENGINE_V1=false`, the pipeline runs exactly as in Milestone 3 with zero knowledge extraction, consolidation, or retrieval steps executed.
- When `ENABLE_KNOWLEDGE_ENGINE_V1=true`, evaluation reports are extracted into candidates and consolidated after every cycle.
- Subsequent generation cycles for the same creator successfully retrieve validated knowledge from previous runs and inject it into the reasoning prompt.
- No breaking changes occur to existing candidate outputs or REST API responses.

---

## Explicit Non-Goals

- No modification of Evaluator V1 internal scoring or reasoning logic.
- No UI changes.
- No destructive database migrations.

---

# Phase 4.6 — Production Readiness

## Objective

Validate, harden, and finalize the complete Knowledge Engine V1 implementation for production deployment.

---

## Responsibilities

Perform comprehensive regression verification across all execution modes and feature flag permutations.

Verify schema validation boundaries for knowledge items across extreme data cases.

Verify retrieval ranking correctness across large mock knowledge bases.

Verify consolidation correctness, including multi-cycle promotion, contradiction damping, and deprecation flows.

Expand automated test coverage (`run-tests.ps1`) to include all new contract, extraction, consolidation, retrieval, and pipeline integration tests.

Verify production build integrity (`npm run build`).

---

## Inputs

- Complete codebase with Milestone 4 components and integration points.

---

## Outputs

- Comprehensive test suites (`tests/*.test.mjs`)
- Updated `run-tests.ps1`
- Final verification report

---

## Dependencies

- Phase 4.1 through Phase 4.5.

---

## Success Criteria

- `npm run build` completes with zero errors or warnings.
- `run-tests.ps1` executes all pre-existing regression suites and all new Milestone 4 suites with `0 FAIL`.
- Execution Mode 1 (`ENABLE_KNOWLEDGE_ENGINE_V1=false`): 100% backward compatible, zero knowledge operations executed.
- Execution Mode 2 (`ENABLE_KNOWLEDGE_ENGINE_V1=true`): Full cycle closed (`Evaluate -> Extract -> Consolidate -> Retrieve -> Reason -> Generate`).
- All architectural invariants from `knowledge-engine-v1.md` are verified and respected.

---

## Explicit Non-Goals

- No new features outside Milestone 4 scope.
- No design changes to completed phases.

---

# Definition Of Done

Milestone 4 is complete when:

✓ All Knowledge Engine schemas (Candidate, Validated, Retrieval) validate cleanly using Zod.

✓ Knowledge Candidate extraction correctly and deterministically transforms Evaluation Reports into hypotheses.

✓ Knowledge Consolidation accumulates evidence, merges items, handles contradictions, and promotes candidates without LLM calls.

✓ Knowledge Retrieval selectively filters and ranks validated knowledge for reasoning requests.

✓ Pipeline integration routes correctly when `ENABLE_KNOWLEDGE_ENGINE_V1=true` and runs unmodified when `false`.

✓ The Reasoning Engine successfully receives and utilizes retrieved knowledge context when available.

✓ Production build (`npm run build`) succeeds with zero errors.

✓ All automated unit, integration, and regression tests pass across all feature flag modes.

✓ No architectural invariants from `knowledge-engine-v1.md` are violated.

---

# Acceptance Criteria

Milestone 4 is considered complete only when all of the following conditions are satisfied.

## Functional Requirements

- Knowledge Engine V1 is fully implemented under `src/lib/knowledge/`.
- Evaluation Reports from Evaluator V1 are extracted into normalized Knowledge Candidates.
- Candidates with sufficient supporting evidence are promoted to Validated Knowledge.
- Contradictory evidence correctly reduces strength or deprecates invalid knowledge items.
- Only Validated Knowledge (`status: 'VALIDATED'`) is retrieved and injected into future reasoning cycles.
- Feature flag `ENABLE_KNOWLEDGE_ENGINE_V1` completely isolates and controls all knowledge operations.

---

## Architectural Requirements

The implementation must preserve the approved Creator Intelligence architecture.

Specifically:

- Knowledge is earned strictly through validated evidence; never hallucinated or generated directly from LLM prompts.
- Consolidation (`Phase 4.3`) and Retrieval (`Phase 4.4`) remain completely deterministic.
- The Knowledge Engine never generates or rewrites candidate content ideas.
- The Knowledge Engine never performs strategic reasoning itself.
- Creator Identity remains immutable.
- Existing evaluation reports and reasoning traces are never mutated post-creation.

---

## Engineering Requirements

The implementation must:

- Build successfully (`npm run build`).
- Pass all existing regression tests.
- Pass all newly introduced Knowledge Engine tests (`run-tests.ps1` with `0 FAIL`).
- Preserve backward compatibility.
- Avoid breaking existing APIs.
- Avoid destructive database schema changes or MongoDB migrations.

---

## Code Quality Requirements

The implementation should:

- Minimize duplication.
- Follow existing repository conventions.
- Keep responsibilities clearly separated across contracts, extraction, consolidation, retrieval, and storage adapter layers.
- Keep modules small and focused.
- Prefer deterministic algorithms over speculative LLM abstractions.

---

# Deliverables

## New Files

Expected additions include:

- `src/lib/knowledge/knowledge-contracts.js`
- `src/lib/knowledge/extract-knowledge-candidate.js`
- `src/lib/knowledge/consolidate-knowledge.js`
- `src/lib/knowledge/retrieve-knowledge.js`
- `src/lib/knowledge/knowledge-store.js`
- `tests/knowledge-contracts.test.mjs`
- `tests/extract-knowledge-candidate.test.mjs`
- `tests/consolidate-knowledge.test.mjs`
- `tests/retrieve-knowledge.test.mjs`
- `tests/pipeline-knowledge.test.mjs`

---

## Modified Files

Expected modifications include:

- `src/lib/ideas/run-idea-generation.js`
- `src/lib/reasoning/build-reasoning-prompt.js`
- `run-tests.ps1`
- `docs/implementation/creator-intelligence/milestone-4-knowledge-engine.md`

No other production files should be modified unless implementation reveals a genuine architectural necessity.

---

# Explicit Non-Goals

This milestone must NOT:

- redesign Creator Identity V1
- redesign the Signal Engine
- redesign Reasoning Engine V2
- redesign Evaluator V1
- redesign idea generation prompts or scoring weights
- introduce UI changes or dashboards
- introduce API endpoints or REST route modifications
- introduce background task queues or async worker processes
- introduce non-deterministic LLM calls during consolidation or retrieval

The objective is strictly to plan and implement the Knowledge Engine as the evidence-backed learning layer of NIVO.
