# Grant-readiness frontend validation

Reviewed on 2026-10-15. This record describes the local review build, not a
confirmation that the production Vercel URL has been updated.

## Completed

- Node.js 24 production compilation, TypeScript checks, and ESLint.
- 20 frontend unit/integration tests, including wallet ownership filtering,
  third-party claims, disconnect/account changes, and bounded event discovery.
- 38 desktop/mobile browser cases passed in preview configuration. These cover
  navigation, responsive layout, keyboard focus, wallet simulation, payment
  duration conversion, the business illustration, and visibility disclosures.
- A mainnet-configured local build rendered the real settled proof, reconciled
  0.01 funded = 0.01 withdrawn + 0 refunded + 0 remaining, and displayed both
  confirmed event receipts without connecting a wallet.
- Read-only wallet simulation against real Arc data: an unrelated address saw
  no personal invoices; the actual recipient saw its invoice and zero claimable
  balance; workspace activity changed with the wallet; public activity remained
  visible. No signatures or transactions were sent.
- Deployed-mode screens at 390 and 1440 CSS pixels had no horizontal overflow.
  See [layout-checks.json](verification/layout-checks.json).
- The 84-second narrated review walkthrough uses a clearly labeled business
  illustration and real mainnet evidence. It is labeled REVIEW BUILD and is
  generated locally as `dist/demo/duelet-walkthrough.mp4`.

## Network behavior and limits

The public RPC intermittently returned HTTP 429 during concurrent browser
checks. Sequential wallet checks passed. Event loading now queries all three
lifecycle event types together once per range instead of three requests, and
reuses results for 30 seconds. Explicit transaction-driven refreshes remain.
A network verification failure keeps writes locked and offers a retry with an
accurate RPC-unavailable message; it is not described as a bytecode mismatch.

## Outstanding

- Real WalletConnect QR/session integration requires the project's public Reown
  configuration. The two configuration-dependent browser cases were excluded.
- Physical-phone connection and a signed mobile claim require builder
  participation. Browser emulation is not a physical-device test.
- No real partial withdrawal or cancellation was present in the observed
  mainnet lifecycle; those must not be claimed in the demo or application.
- The saved Vercel account in this workspace does not list Duelet. Publishing
  requires access to the existing project; no replacement project was created.
- Production deployment and grant submission have not been confirmed.
