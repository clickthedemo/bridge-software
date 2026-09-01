# Tori feedback reconciliation

**Source reviewed:** Full 39 minute platform development strategy transcript plus the written feedback available for this review cycle
**Build state:** Implemented and tested locally on 2026-08-20
**Delivery boundary:** The approved 21+ entry gate restoration was deployed to the existing review URL on 2026-08-21. No client message was sent from this change.

## Instituted in the review build

| Tori feedback | Instituted behavior | Surface |
|---|---|---|
| Keep the dark purple direction | Connected network tokens remain the default across every route; no white theme is used | Global theme and Home |
| Preserve the Bridge identity | The exact established Bridge mark and existing typography remain in use | Header, Home, all application routes |
| Make cannabis obvious | First impression names cannabis brands, dispensaries, cultivators, sales teams, and service partners; all major page headings identify the cannabis use case | Home, Community News, Explore, Create, Join |
| Make the next action obvious | Join is the primary homepage action and Explore is the secondary action | Home |
| Use more pictures and less reading | Realistic generated cannabis industry imagery, visual category rails, stronger hierarchy, and media rich cards were added | Home, Community News, Explore, profiles |
| Show a simple useful feed | Visual news and classic chronological layouts are both available | Community News |
| Let members follow useful activity | Category, state, and favorites controls organize promotions, news, events, market signals, and service updates | Community News |
| Search the nationwide cannabis network | State, business category, product, specialty, and free text controls search fictional sample members | Explore |
| Connect learning between markets | Featured markets and a California to Michigan signal make cross state discovery concrete | Explore |
| Add picture based product categories | Flower and genetics, pre rolls and vapes, edibles and wellness, testing and compliance, and industry services are visual entry points | Explore |
| Represent the whole industry | Added cultivator, manufacturer, testing laboratory, transport, cannabis aware banking, hydroponics, facility service, and media examples | Explore and profile data |
| Make profiles useful | Profiles include products, capabilities, looking for, menus where relevant, ordering state, directions, outside channels, and recent activity | Profile detail |
| Support media and contributors | A fictional cannabis media member and editorial feed items are included | Community News and Explore |
| Upload an image or PDF | Promotion creator accepts PNG, JPEG, WebP, or PDF through an upload intent flow | Create |
| Add Promotion as a content type | The active Phase 3 permission contract publishes Promotions | Create |
| Target multiple audiences | Retailers, verified businesses, industry professionals, and Adults 21+ can be selected where eligible | Create |
| Protect business only information | Protected detail removes Adults 21+ and requires eligible verified audiences | Create and My Profile |
| Keep sales and accounting contacts current | A blocking first login and monthly review lets a verified member update and confirm both contacts | My Profile |
| Let members save and review creative | Draft, library, review routing, and PNG preview actions are available locally | Create |
| Consider six months free and $349 | A clearly labeled founding business pricing concept shows the discussed structure without activating billing | Pricing |
| Make Bridge League cooperative | The concept uses private recognition, no public leaderboard, and no requirement to accept every relationship | Bridge League and Dashboard |
| Do not overreach into HR | No HR product was added | Product boundary |

## Tori input still required

1. Confirm the dark Connected purple direction and current Bridge mark as the production brand lock.
2. Confirm whether Visual News or Classic Feed should be the default Community News view.
3. Confirm the launch priority by state and member role so fictional sample markets can be replaced with the right rollout focus.
4. Define what verification and EIN aware access promise for each role, including what members may see before and after a connection.
5. Approve the exact public, member, and protected profile fields, especially vendor to vendor business information.
6. Approve or revise the first six months free concept, the $349 monthly figure, membership tiers, and when payment details are collected.
7. Decide whether Bridge League remains private recognition only and what reward, if any, it should provide.
8. Select the first external providers for menus, ordering, maps, and social channels, and decide whether launch uses links or live integrations.
9. Define editorial contributors, moderation, review, and whether paid placement will ever be allowed in Community News.
10. Approve the realistic cannabis imagery with the purple grain and slow motion treatment.

## Restored entry requirement

On 2026-08-21, the earlier Bridge product requirement for an adult entry gate was restored across every route. The review build now requires an explicit 21+ confirmation before entry, blocks the under-21 path, and remembers an affirmative confirmation on that device. This is a front-end review safeguard only; production identity and age-eligibility enforcement still require Miraj's authentication and claims integration.

## Production dependencies

1. Miraj must return the inspectable API repository, branch, commit, and staging origin before the live Phase 3 adapter is connected.
2. Production authentication, role claims, EIN handling, billing, live member data, ordering, and third party provider connections require backend and policy work.
3. Netlify remains unchanged until the revised build is separately approved for deployment.
4. All profiles, market signals, menu items, activity, and network statistics in the review build are fictional examples.
