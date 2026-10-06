# Security & Play Policy Review — Pass 2, Addendum 6 (F23 r5: IP re-check of the enlarged fist and redrawn rabbit)

> Transcription note: the reviewer is read-only by design, so the main session writes this file verbatim from the reviewer's returned content.

**Result: PASS** (0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO).

- The enlarged fist and the redrawn rabbit are **not hits** under Play's Intellectual Property and Impersonation policies or PRD-mobile M9.6.
- The circle and the X, and the tests that hold their limits, are unchanged.
- **A5-L1 and A5-L2 are CLOSED.**
- The moved `contextmenu` listener and the new render script have no security impact.
- V2-M3 stays closed as risk-accepted by the owner, not fixed. C7 part (d) stays OPEN as step-15 evidence.

**Details**

- **Date:** 2026-10-01
- **Reviewer:** mobile-security-compliance-reviewer
- **Checklists applied:** play-policy-checklist (Intellectual property and metadata), security-compliance-checklist (application security, dependencies).
- **Scope (files only):**
  - `docs/mobile/security/review-v2-addendum4.md` §1.2-1.3, `review-v2-addendum5.md` (A5-L1, A5-L2)
  - `docs/PRD-addendum-v5.md` r5 (AC3(d), AC4.1, AC4.2, AC7-AC9, pipeline impact)
  - `src/render/shapes.ts:283-407`; bound and limit assertions in `src/render/powerUpGlyphs.test.ts`
  - renders `f23_tokens_magnified_8x_r5.png`, `f23_tokens_24px_r5.png`, `f23_tokens_13dp_at_2x_r5.png`
  - `docs/mobile/PRD-mobile.md` (C7 note), `docs/mobile/release-runbook.md:26`, `:517-519`
  - `src/platform/android/AndroidPlatform.ts:193-197`, `scripts/render-powerup-tokens.mjs`, `package.json`
- **Verification limits:**
  - The three renders are harness captures. I did not view the grayscale copies or the emulator capture (AC6(b) file 5).
  - No shell: the unit tests were read, not run. No git: "untouched" means the code as it stands matches the values recorded in addendum 4.
  - No web access. Marks are compared from my own knowledge. This is a policy-risk judgment, not legal advice.

**Gate effect:** the r5 glyphs may proceed through the remaining gates. Step-15 upload stays blocked by C1-C6, C7(d), C8-C10 and A-C1, as before.

---

## 1. Ruling 1 — fist and rabbit against Play IP / Impersonation policy

### 1.1 Fist (`shapes.ts:336-368`) — NOT A HIT

- It is the r3 fist scaled by 1.4: four knuckle domes, flat base, thumb on the left, no wrist, one amber fill. Nothing was added.
- The addendum 4 §1.2 reasoning holds at the larger size. It is a generic front-view fist pictogram, not a raised arm and not any character's or brand's mark that I know of.
- The no-forearm rule is still tested (`powerUpGlyphs.test.ts:578`). Content rating (§6.3) is unaffected.

### 1.2 Rabbit (`shapes.ts:370-407`) — NOT A HIT (AC4.2(d) satisfied)

As rendered: a whole crouched animal facing right, both feet on one line, two separate ears on the head leaning back about 16-18 degrees, a small tail bump, one notch under the belly. One amber fill, no cut-out, no accessory.

| Mark | Distinctive features | This glyph |
|---|---|---|
| Playboy rabbit head | Head only, bow tie, one bent ear, eye cut-out | Whole body, no tie, both ears straight, no cut-out |
| Energizer / Duracell bunnies | Upright, costumed, drum or battery | Four-legged crouch, no accessories |
| Volkswagen Rabbit badge | Stretched running rabbit, legs extended, ears swept flat along the back | Crouched, feet on one line, ears about 16-18 degrees from vertical |
| Lindt Gold Bunny | Seated side-view bunny, gold foil, red ribbon with bell, ears held together | Four legs with a belly notch, ears apart, no ribbon; see A6-L1 |
| White Rabbit candy, other leaping-rabbit marks | Mid-leap pose | Crouch; a leap is ruled out by AC4.2(c)6 |
| Bugs Bunny, Nesquik, Trix, Miffy, Rabbids | Upright characters with faces | Featureless silhouette |
| RabbitMQ, Rabbit R1, Bad Bunny | Head-only or abstract front-view head | Whole body, side view |
| PlayStation and other console or animal marks (Puma, Jaguar, Lacoste) | No rabbit; other animals in other poses | No resemblance |

- The side-view whole rabbit is also a standard pictogram (it matches the generic "rabbit" emoji idea). The outline is hand-built bezier code, not copied from a font or image.
- The larger size does not change the ruling. The glyph is still inside the shared ring, with a visible gap (tested at `:529-544`).
- Bindings that keep it so (addendum 4 §1.3, plus r5): whole body, side view, never head-only, never upright, never a leap, ears never flat along the back, no clothing or accessories, no cut-out, amber only.
- As before, any redraw outside the r5 AC4 ranges needs a new F23 revision and a new IP check.

### 1.3 Finding

**[LOW] A6-L1 — Intellectual property and metadata (Play IP policy; F23 AC4.2(d)) — `docs/PRD-addendum-v5.md:570-581` — Two bindings are missing for the new pose**

- **Issue:** the token is a gold-toned side-view rabbit. AC4.2(d) names Playboy, Energizer, Duracell and the car badge, but not the seated gold bunny with a ribbon. Nothing in the text forbids a later collar, ribbon or bell, a metallic or gradient fill, or a seated pose.
- **Why it matters:** those are the features that would move the glyph toward a registered shape mark. The geometry tests (notch, two feet) cover the pose only indirectly, and nothing covers a ribbon.
- **Required fix (product-manager / mobile-product-manager, next F23 revision; no code change):** add to AC4.2(d): "no ribbon, collar or bell; flat amber fill only, no gradient or metallic effect; never a seated pose." Also add: "the rabbit is never used as the app icon, splash, logo or a mascot in listing text." Not blocking.

---

## 2. Ruling 2 — circle and X untouched

| Item | Evidence | Result |
|---|---|---|
| Shield circle: one stroked arc, radius 0.34r | `shapes.ts:314-319` | Unchanged |
| X: two diagonals, a = 0.35r, traceability comment | `shapes.ts:320-329` | Unchanged |
| Circle test: "exactly one full circle and nothing else"; radius 0.25r-0.35r | `powerUpGlyphs.test.ts:437`, `:763-771` | Present |
| X test: a between 0.3r and 0.4r | `powerUpGlyphs.test.ts:777-780` | Present |
| Stroked glyphs still bound to ±0.45r | `powerUpGlyphs.test.ts:516-522` | Present |
| `drawPowerUp` still has one caller | `CanvasRenderer.ts:204` | Unchanged |

The five circle limits (addendum 4 §1.4) and the X limits (C7.4) still hold. The store-asset rule (AC9, `PRD-addendum-v5.md:715-726`) is unchanged.

---

## 3. Ruling 3 — A5-L1 and A5-L2

- **A5-L1 — CLOSED.** `docs/mobile/PRD-mobile.md:1135-1139` adds the delivery record under C7.1: the update was posted at 2026-10-01 01:49 UTC, and the owner had not replied by 01:58 UTC. No reply is required. A4-L1 and A4-L3 are therefore CLOSED too. This is checked as text only; I cannot see the thread.
- **A5-L2 — CLOSED.** `docs/mobile/release-runbook.md:517-519` has its own heading "Store graphics (C7)" and the checkbox reads as required, including the tablet screenshots and the 512 icon. Line `:26` is unchanged.

---

## 4. Ruling 4 — security impact of the two code changes

- **`AndroidPlatform.ts:197` — no security impact.** The listener moved from the click root to `document`. It only calls `preventDefault()`. It reads and stores nothing and adds no network call or HTML sink. It is in the Android-only module, so the website is unchanged. Events inside the sandboxed privacy frame do not reach the parent document, so addendum 4 A4-I4 still applies. Data safety answers are unaffected.
- **`scripts/render-powerup-tokens.mjs` — no security impact.** It is a developer tool. Nothing in `src/` imports it, and `package.json` has no script that runs it, so it is not in the web bundle or the `.aab`. It makes no network request, uses no secrets, and writes only PNG files to `docs/mobile/tests/screenshots/`.

**Informational**

- **A6-I1 — `scripts/render-powerup-tokens.mjs:6`.** It imports `esbuild`, which `package.json` does not list directly (it resolves through another dev dependency). A tool upgrade could break the script or change the version silently. Suggest adding `esbuild` as a pinned devDependency.
- **A6-I2 — `scripts/render-powerup-tokens.mjs:14`.** The optional suffix argument goes into the file name unchecked. It is a local developer argument, so the risk is negligible. Do not wire it to CI input.
- **A6-I3 — line references.** Addendum 4 cites `shapes.ts:313-328`, `:346-388` and `AndroidPlatform.ts:199`, `:280`. They are now `:314-329`, `:351-407`, `:197` and `:283`. The e2e hook gate itself is unchanged (`?e2e=1` and not native).
- **A6-I4 — `docs/mobile/PRD-mobile.md:1492`, `:2074-2075`.** These lines still describe the owner update as to be sent. The delivery record at `:1135-1139` supersedes them. `shapes.ts:372`, `:376` give the ear lean as both "about 16" and "18" degrees; both are inside the 15-25 degree range.

---

## 5. Conditions

| # | Status after this addendum |
|---|---|
| A5-L1, A5-L2, A4-L1, A4-L3 | **CLOSED** |
| A6-L1 | OPEN. Owner: product-manager / mobile-product-manager. Due with the next F23 revision; not blocking. |
| C7 (d) | OPEN. Owner: mobile-release-engineer. Due before step-15 upload. |
| A-C1 | OPEN (owner), unchanged. |
| C1-C6, C8-C11 | Unchanged. C9's release evidence must now come from a build that contains F23 **r5**. |

§6 Play Console answers are unchanged by r5. In the amended §6.5 bullet (addendum 4 §3.1), read "F23 r3" as "F23 r5". Everything else in review-v2 and addenda 1-5 is unchanged.
