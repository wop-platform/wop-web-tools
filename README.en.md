# WOP Web Tools
[![CI](https://github.com/wop-platform/wop-web-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/wop-platform/wop-web-tools/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/github/license/wop-platform/wop-web-tools)](LICENSE) [![Selftest](https://img.shields.io/badge/selftest-155%20assertions-brightgreen)](#vector-self-test) ![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/wop-platform/wop-web-tools?utm_source=oss&utm_medium=github&utm_campaign=wop-platform%2Fwop-web-tools&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Browser-side WOP merchant workbench: key generation · message interop · offline verification.

- Pure static multi-file layout (shell `index.html` + `assets/*`, one file per feature); keys are generated locally in the browser — zero upload, zero network
- Browse online via GitHub Pages; offline use = keep the whole directory (`index.html` + `assets/`) and open it via file://
- Aligned with the ratified specs in [wop-specs](https://github.com/wop-platform/wop-specs)

## Features

| Tab | Capability |
|---|---|
| Key Generation | RSA 3072/4096 key pairs, PKCS#8/SPKI, PEM/Base64, triple self-test, public-key fingerprint |
| Message Interop | Build requests (canonical/sign/digest/L2 envelope/curl), verify platform messages, simulate response/callback loops |

> Callback semantics follow the ratified `wop-sdk-spec` v1.0 (F3/F6) — verification order:
> verify signature → digest check → DEK unwrap → alg-family check → bulk decrypt.

## Vector Self-Test

The page embeds a byte-level vector self-test (positive vectors byte-identical, negative vectors
rejected) aligned with the golden vectors in wop-specs. Run it before trusting output.

## Development

- `docs/intent.md` — intent and boundaries
- `docs/spec.md` — spec (clause-based, with decision records)
- `assets/` — page source of truth (the shell loads 12 deferred scripts + main.css = 13 assets, in order: core → feature slices → selftest → boot)

## Ecosystem

- Protocol source of truth: [wop-specs](https://github.com/wop-platform/wop-specs)
- Official SDKs: six languages (java/go/ts/py/php/dotnet)
- Skills layer: [wop-skills](https://github.com/wop-platform/wop-skills)
