## Summary
Streamdown's default rehype-sanitize schema in the latest published release (**streamdown@2.7.1**, npm, 2026-10-19) sets `clobberPrefix: ""`. Attacker- or model-controlled Markdown that contains raw HTML can therefore emit elements whose `id`/`name` are exactly `location`, `getElementById`, `cookie`, `toString`, etc. This re-enables classic DOM clobbering of `window`/`document` named properties in any app that renders untrusted streamed Markdown through Streamdown, which is its primary use case (AI chat UIs).

An earlier footnote-navigation fix cleared `clobberPrefix` to avoid double `user-content-` prefixes. The security side effect is fixed on `main` in commit 66779a8856 (PR #695, 2026-10-23), but **that fix has not been released** — 2.7.1 on npm is still affected.

## Asset
https://github.com/vercel/streamdown (Open Source program, Vercel-owned repository)

## Affected version
- streamdown npm 2.7.1 (latest stable). Published bundle `package/dist/chunk-7TTQLYRW.js` contains `clobberPrefix:""`.
- Fixed on main @ 66779a8856 (unreleased).

## Steps to reproduce
1. `npm install streamdown@2.7.1` (or run the attached `poc-clobber.mjs`, which uses the schema shipped in 2.7.1).
2. Render this Markdown through Streamdown with default settings:
```md
<img id="location" src="x">
<a id="getElementById" href="https://evil.example">click</a>
```
3. Observe the output keeps unprefixed ids: `id="location"`, `id="getElementById"`. In a browser, `document.getElementById` now resolves to the injected `<a>` element and named-property lookups for `location` resolve to the injected `<img>`.
4. Negative control: with the main-branch schema (post-#695), the same input yields `id="user-content-location"` / `id="user-content-getElementById"`, so no clobbering.

## Impact
DOM clobbering (CWE-1336 / CWE-79-adjacent). Untrusted Markdown (user content or LLM output, including prompt-injected output) can inject named properties onto `window`/`document`. Application or library code that reads such globals after rendering can be broken or redirected (e.g. `document.getElementById` replaced by an element causes TypeErrors / logic bypass; clobbered config-style globals can steer script behavior). Exploitability depends on the host app having a clobberable gadget; I have not demonstrated a full XSS chain, so I rate this conservatively as **Low**.

## Remediation
Publish a patch release containing #695 (restore the `user-content-` clobberPrefix while de-duplicating footnote ids).

## Notes
Tested only locally against the published npm package with synthetic data. No Vercel production systems or customer data were touched. Attached: `EVIDENCE_C45.tar.gz` (PoC script + output; sha256 2391863316b5ddf172da4bd64eb288e803aa102b46c8944aa5d032be87d9adf7).
