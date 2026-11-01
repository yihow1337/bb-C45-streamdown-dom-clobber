# [PRIVATE — DO NOT SUBMIT YET] streamdown@2.7.1: DOM clobbering via disabled rehype-sanitize clobberPrefix

## Program / asset
- Program: Vercel HackerOne (public, paid)
- Asset: https://github.com/vercel/streamdown — Open Source Tier 2 (“all other Vercel-owned projects under github.com/vercel”)
- Affected: streamdown npm **2.7.1** (latest stable; released 2026-10-19)
- Fixed: main @ 66779a8856 / PR #695 (2026-10-23) — **unreleased**

## Summary
Streamdown’s default rehype-sanitize schema ships with `clobberPrefix: ""`. Attacker-controlled (or model-controlled) Markdown that includes raw HTML can therefore emit elements whose `id`/`name` attributes are exactly `location`, `getElementById`, `cookie`, `toString`, etc. That re-enables classic DOM clobbering of `window`/`document` named properties in any application that renders untrusted streamed Markdown through Streamdown — which is its primary use case (AI chat UIs).

An earlier footnote-navigation fix intentionally cleared `clobberPrefix` to avoid double-`user-content-` prefixes from remark-rehype + rehype-sanitize. The security side-effect was not addressed until #695, which restores the prefix and strips doubled footnote ids.

## Novelty
- No public GHSA/CVE/advisory for `streamdown` (GitHub Advisories `affects=streamdown` empty).
- Fix is a silent, unreleased security commit with no writeup.
- Distinct from prior Streamdown/AI-SDK XSS/linkSafety work; sink is sanitize `clobberPrefix`, not protocol/href allowlists.

## Steps to reproduce
1. Install `streamdown@2.7.1` (or run the accompanying `poc-clobber.mjs`, which mirrors the published schema).
2. Render Markdown containing raw HTML such as:
   ```md
   <img id="location" src="x">
   <a id="getElementById" href="https://evil.example">click</a>
   ```
3. Observe output ids remain unprefixed (`id="location"`, `id="getElementById"`).
4. On main / post-#695, the same input yields `id="user-content-location"` etc.

## Impact
- CWE-1336 / DOM clobbering (CWE-79-adjacent): untrusted Markdown can inject named properties onto `window`/`document`.
- Downstream app code that reads `location`, form names, or similarly named globals after rendering AI/user content can be redirected or confused (e.g. `location`-named element influencing navigation helpers).
- Requires the application to render attacker-/model-influenced Markdown via Streamdown (intended deployment).
- Estimated severity: **Low–Medium** (DOM clobber without a demonstrated XSS RCE chain); still a trust-boundary failure Vercel themselves labeled as preventing window clobber.

## Evidence
- `poc-clobber.mjs` + `poc-output.txt`
- Published bundle snippet: `package/dist/chunk-7TTQLYRW.js` contains `clobberPrefix:""`
- Fix commit: https://github.com/vercel/streamdown/commit/66779a8856

## Out of scope notes for triage
- Not a Vercel platform / customer-deployment issue; local OSS PoC only.
- No production testing performed.

## Suggested remediation
Ship a patch release of `streamdown` with #695 (restore `user-content-` clobberPrefix + footnote undouble). Already on main.
