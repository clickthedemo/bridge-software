# Tori's redesign-demo feedback, mapped against the build spec

Source: twelve annotated screenshots attached to *Re: Bridge Update, Phase 3
Complete + Project Recap*, 2026-09-17 02:06 UTC, from `getonthebridge0@gmail.com`.

Phase definitions quoted from `CLAUDE_BUILD_SPEC.md`. MVP boundaries quoted
from `CLAUDE.md`. Nothing here is inferred from a roadmap that does not exist
in the repository.

---

## 1. Shipped, no phase dependency

These are presentation and copy. They do not touch a data contract, so no gate
applies to any of them.

| # | Her note | Where | Status |
|---|---|---|---|
| 1 | "remove the purple filter... keep all photos real time no filter" / "ALLOWING natural color to the photos" | global | shipped |
| 2 | "TO CONNECT US ALL." | home hero | shipped |
| 3 | Supporting line on each of the three story cards | home | shipped |
| 4 | "POST IN A PLACE THAT LETS YOU POST, GET RECOGNIZED" | Bridge League | shipped |
| 5 | Founding pricing struck out, replaced with "a sneak peak of what a post looks like" | home | shipped, built from live feed markup |
| 6 | Headline and vocabulary rewrite | Community News | shipped |
| 7 | "Can we put a header here that says 'Choose your experience'" | Community News | shipped |
| 8 | "Let's change to this verbiage" | My Profile lede | shipped verbatim |
| 9 | "add photos with each blurb to help owners read better" | Verified | shipped |
| 10 | "SHOULD WE MAKE HER INTERACTIVE LOL LIKE LIGHT HER PRE-ROLL" | Explore mascot | shipped |

**Note on 10.** The artwork already showed the pre-roll lit with smoke rising,
so the interaction flares the existing ember rather than inventing a second
sprite. She became a real button with a label, a focus ring and a keyboard
path, because a decorative element that responds to a tap is a control.

---

## 2. Shipped at the Phase 3 layer, with a real Phase 4 dependency

### Saved folders
> "Any chance that when a user saves a post, it can go under a specific folder
> like 'SAVED EVENTS', or 'SAVED DEALS' or maybe they can custom their own?"

Built in `lib/social.ts`, the same store that already backs saves, follows and
reposts. Two folders are seeded, custom names are accepted, and the Saved-only
view filters by folder.

**Phase 4 dependency is real.** Phase 4 lists `saved profiles` among the domain
entities that replace mock adapters. Today folders persist to `localStorage`,
which means:

- per device, per browser. Save on your phone, it is not there on your laptop.
- cleared by clearing site data.
- no server authorization, because there is no server call to authorize.

The swap is confined to one module by design. What changes at Phase 4 is the
storage backend, not the interface the components call.

**Phase 5 obligations that do not apply yet, and will.** Phase 5 requires every
data-dependent action to support loading, empty, error with safe retry, and
stale or conflicting data. Local storage is synchronous and cannot fail
partway, so today only the empty state is reachable and it is implemented
("Nothing saved yet"). Once folders are server-backed, the other three become
required and are currently absent.

### Consumer sign up
> "B2B SIGN UP & CONSUMER SIGN UP (NO VERIFICATION = ONLY REPOST ALLOWED)"

The two entry points and the stated limit are shipped. **The limit itself is
not enforced anywhere yet**, and cannot be from the front end.

Phase 4 requires that "for every mutation, enforce authorization on the
server/database boundary, not only by hiding a button." A consumer account that
can only repost is exactly that kind of rule: it belongs to `users and
memberships`, and it needs Miraj's authorization model. Phase 5 then requires a
real `permission denied` state for a consumer who attempts to post, which does
not exist today.

Treat the current build as the front door, correctly labelled. The lock is
Phase 4.

---

## 3. Not built, and why

### My Profile as a social profile
> "What do you think about making this page look something like
> facebook/instagram/linkdn/myspace? It's just plastered with their story,
> their photos, quick uploads like snapchat where consumers can subscribe to
> their content for sneak peaks etc? What do you think?"

Phrased as a question, and it crosses three separate lines:

1. **Gate B, not Phase 4.** Human gate B requires a documented contract for
   "storage buckets, file types, size limits, signed URL behavior, and
   retention" before Supabase is connected. Member photo upload is precisely
   that. The spec says Claude "must not present it as approved or connect
   production services before this gate."
2. **Phase 4 entity work.** `member profiles and role-specific attributes`, plus
   a subscription relationship that does not exist in the entity list at all.
   Follows today are a client-side list, not a subscription.
3. **MVP boundary.** `CLAUDE.md` puts "full social feed" out of scope "unless a
   documented scope change is approved."

Answer to send her: yes, it is the right direction, and it is a scope
conversation with Miraj about storage and subscriptions, not a styling change.

### In-state member-to-member messaging
> "LET'S MAKE THIS A SPOT TO SHOW THEIR ABILITY TO MESSAGE EACH OTHER IF THEY'RE
> WITHIN THE SAME STATE? WHAT DO YOU THINK ABOUT THIS."

`CLAUDE.md` lists **direct messaging** in the out-of-scope set, "unless a
documented scope change is approved." It is also absent from the Phase 4 entity
list; `contact requests` is a structured, reviewable request with a state
machine (`draft -> sent -> accepted | declined | withdrawn`), which is
deliberately not a message thread.

This needs a scope decision before it needs a phase. It is not a matter of
sequencing.

---

## 4. One judgment call worth confirming

Beside the Community News headline she wrote "See what the world is up to!".
Shipped as **"See what the cannabis world is up to"**, keeping the category
word. Reverting to her exact line is a one-word change if she prefers it.

---

## 5. What to tell her

Everything visual and every wording change she asked for is live. The saved
folders work now, on the device she is using. The two questions she asked, a
social-style profile and member messaging, are both real product direction and
both need a scope conversation with Miraj about storage and permissions rather
than a design pass, because they change what the backend has to guarantee.
