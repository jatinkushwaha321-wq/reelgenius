# Milestone 1 — Creator Identity Layer

Status: Planned

---

# Goal

Introduce a first-class Creator Identity abstraction into the existing idea generation pipeline while preserving complete backward compatibility.

This milestone is infrastructure only.

No user-visible behaviour should change.

No prompt behaviour should change.

No reasoning behaviour should change.

---

# Repository Understanding

The current pipeline already contains:

- CreatorProfile
- Signal
- buildIdeaPacket()
- buildIdeaPrompt()
- runIdeaGeneration()
- Reasoning Engine MVP

Creator information is currently scattered across CreatorProfile and packet construction.

This milestone introduces a single CreatorIdentity abstraction that consolidates this information without changing downstream behaviour.

---

# Scope

## In Scope

- Create CreatorIdentity schema.
- Build CreatorIdentity from existing CreatorProfile and Signals.
- Integrate CreatorIdentity into runIdeaGeneration().
- Refactor buildIdeaPacket() to consume CreatorIdentity.
- Add unit and integration tests.

---

## Out of Scope

- Memory
- Evaluator
- Prompt changes
- Reasoning changes
- New database collections
- UI
- API changes

---

# Existing Files To Reuse

Reuse without modification wherever possible.

Models

- CreatorProfile
- Signal
- ObservedContent
- Idea
- AIMemory

Utilities

- buildIdeaPacket()
- buildIdeaPrompt()
- buildReasoningPrompt()
- parseIdeaOutput()
- rankCandidates()
- persistIdeas()

---

# New Files

src/lib/identity/

creator-identity-schema.js

Purpose

Defines the CreatorIdentity Zod schema.

---

build-creator-identity.js

Purpose

Maps CreatorProfile and Signals into a CreatorIdentity object.

No inference.

No LLM.

Only existing repository data.

---

load-creator-identity.js

Purpose

Validates and returns an immutable CreatorIdentity.

Must not perform database queries.

---

tests/

creator-identity.test.mjs

Purpose

Unit and integration tests for the new layer.

---

# Modified Files

## src/lib/ideas/run-idea-generation.js

Responsibilities

- Load CreatorProfile.
- Load Signals.
- Construct CreatorIdentity.
- Pass CreatorIdentity into buildIdeaPacket().

No additional behaviour changes.

---

## src/lib/ideas/build-idea-packet.js

Responsibilities

Replace direct CreatorProfile access with CreatorIdentity.

The generated creatorContext must remain identical to the previous implementation.

Prompt output should not change.

---

# Implementation Sequence

Step 1

Create CreatorIdentity schema.

Build project.

---

Step 2

Implement buildCreatorIdentity().

Run unit tests.

---

Step 3

Implement loadCreatorIdentity().

Run unit tests.

---

Step 4

Integrate into runIdeaGeneration().

Build.

---

Step 5

Modify buildIdeaPacket().

Compare generated creatorContext with previous implementation.

They should be functionally identical.

---

Step 6

Write tests.

Run:

run-tests.ps1

Run:

npm run build

---

# Acceptance Criteria

The milestone is complete when:

✓ CreatorIdentity exists as a reusable abstraction.

✓ Existing prompts remain unchanged.

✓ Existing idea generation remains unchanged.

✓ No new MongoDB collections exist.

✓ No prompt modifications exist.

✓ No UI changes exist.

✓ All tests pass.

✓ Project builds successfully.

---

# Deliverables

New

- creator-identity-schema.js
- build-creator-identity.js
- load-creator-identity.js
- creator-identity.test.mjs

Modified

- run-idea-generation.js
- build-idea-packet.js

Deleted

None.

---

# Definition of Done

Creator Identity becomes the single abstraction representing creator information inside the generation pipeline.

The repository behaves identically before and after the milestone, while preparing the codebase for Reasoning Engine V2, Memory, and Evaluator integration.