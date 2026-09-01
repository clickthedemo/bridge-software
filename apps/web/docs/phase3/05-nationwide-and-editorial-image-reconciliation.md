# Nationwide and editorial image reconciliation

Date: 2026-08-31

## Decision

Bridge's prototype geography is nationwide. Community and Explore must expose
`All states`, all 50 U.S. states, and Washington, D.C. The records currently in
the prototype are illustrative sample data, not the complete list of markets
Bridge intends to serve. Selecting a state without a sample record must say
that the prototype has no sample data for that state; it must not imply that
the market is empty or unsupported.

## Source classification

- Tori's supplied call transcript says the feed should be nationwide, describes
  Bridge as a nationwide legal-state network, requests state/location filters,
  and describes nationwide Explore behavior. This is the direct product source.
- Tori's July 31 email delivered that transcript as the explanation of her
  thinking. The email body does not independently restate the word
  `nationwide`, so the requirement is attributed to the attached transcript,
  not to separate email prose.
- The accepted Phase 2 product contract converts that direction into a testable
  rule: the state selector includes all 50 states and D.C.; limited sample
  records and no-result states must be labeled as prototype coverage.

Canonical internal source:
`C:\Users\dillo\Documents\Codex\projects\client-operations\clients\bridge-software\deliverables\2026-08-01-tori-prototype-transcript-summary.md`

Product contract:
`docs/phase2/phase2-product-contract.md`

## Editorial image rule

Every Bridge editorial slot receives its own generated image. Reusing the same
photograph in multiple editorial slots is prohibited. Shared interface assets,
such as the Bridge mark, are excluded because they are identity primitives
rather than editorial photography.

The image direction uses documentary realism, controlled grain, practical
lighting, and anti-stock-photo composition within Bridge's verified dark
Connected-purple identity.

The generated asset set and source assignments are recorded in
`public/bridge-editorial/BRIDGE-IMAGE-PROVENANCE.json`. Run
`npm run test:images` to verify that:

- all 44 generated editorial assets have distinct binary hashes;
- each generated asset is assigned exactly once in application source;
- every assigned asset exists and matches its recorded provenance hash;
- legacy repeated-image references are absent; and
- Community and Explore both use the shared 52-option nationwide selector.

## Verification result

The 2026-08-31 confirmation run passed desktop and mobile checks for Community,
Explore, Create, My Profile, and Home. It verified image loading, no horizontal
overflow, keyboard focus, reduced-motion behavior, clean browser consoles,
unique category/post/profile imagery, 52 geography options, and correctly
labeled no-sample states.
