# C45 streamdown DOM clobber via disabled clobberPrefix

- Package: streamdown@2.7.1 (latest stable as of 2026-10-19)
- Repo: github.com/vercel/streamdown (Vercel-owned → H1 Open Source Tier 2, paid)
- Silent fix: 66779a8856 / #695 (2026-10-23) — NOT yet in any npm release (2.7.1 is tip)
- No public GHSA/CVE/advisory for streamdown (checked api.github.com/advisories?affects=streamdown)
- Root cause: earlier footnote fix set `clobberPrefix: ""` on rehype-sanitize schema, which
  stopped double-prefixing footnotes but also stopped prefixing attacker-supplied raw HTML ids.
- Fix restores default `user-content-` prefix + strips doubled footnote prefixes.
- PoC: poc-clobber.mjs mirrors 2.7.1 vs fixed schemas through remark→rehype-raw→sanitize pipeline.
