# WOP Web Tools
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/wop-platform/wop-web-tools?utm_source=oss&utm_medium=github&utm_campaign=wop-platform%2Fwop-web-tools&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Browser-side WOP merchant workbench: key generation · message interop · offline verification.

- Pure static single file; keys are generated locally in the browser — zero upload, zero network
- Browse online via GitHub Pages, or download `index.html` and use it offline
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

## Ecosystem

- Protocol source of truth: [wop-specs](https://github.com/wop-platform/wop-specs)
- Official SDKs: six languages (java/go/ts/py/php/dotnet)
- Skills layer: [wop-skills](https://github.com/wop-platform/wop-skills)
