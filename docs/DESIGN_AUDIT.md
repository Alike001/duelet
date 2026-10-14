# Duelet Phase 4.1 design audit

Date: 2026-10-14  
Baseline: `7b1560e70fb8aae9e83f6891bb2357d66ec47297`  
Production reference: <https://duelet.vercel.app/>

## Evidence reviewed

- Every current application route and the shared layout, wallet, activity, invoice, proof, and creation components.
- Production screenshots captured under `docs/screenshots/phase-4-1/before/` at desktop and mobile sizes.
- VibeCurb's MIT-licensed `visual-redesign`, `awwwards-hero`, and `awwwards-motion` source instructions. The referenced repository does not contain a separate `awwwards-sections` skill.
- Modulify's public home and designer pages as composition and system-consistency references only.
- Reown AppKit, Wagmi 3, Next.js 16, and official Arc documentation.

No VibeCurb installer or remote script was executed. No reference layout, artwork, brand asset, or source component is copied into Duelet.

## Current strengths to preserve

- The financial terminology is unusually honest: illustrative data, preview mode, unaudited status, and transaction confirmation boundaries are visible.
- Integer USDC presentation and the deterministic fixture match the Solidity model.
- Contract identity checks, exact approvals, simulations, receipt confirmation, and network gating are already in the application logic.
- The homepage has a real product demonstration rather than a decorative chart.
- Responsive overflow and keyboard focus already have browser coverage.

## Route audit

| Surface          | Current weakness                                                                                                                                                                 | Replacement direction                                                                                                                                               | Risk   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Global shell     | A large rounded header, lime CTA, rounded cards, and pills repeat the same visual vocabulary everywhere. Navigation has no current-route signal.                                 | Editorial rail, restrained geometry, one signal-lime accent, active route treatment, clearer network/wallet state.                                                  | Medium |
| `/`              | The hero is a conventional split layout and the stream demo reads as a side card rather than the product's center of gravity. Following sections repeat grids of bordered cards. | Layered-depth financial instrument as the dominant focal point; oversized editorial story; alternating ledger, timeline, cancellation, Arc, and proof compositions. | Low    |
| `/app`           | Disconnected state removes nearly all workspace context. Connected summary uses three generic cards and does not strongly separate payer and payee roles.                        | Keep the workspace visible as an honest shell, add role rails, claim emphasis, network/readiness context, and a composed connection panel.                          | High   |
| `/invoices`      | Filter pills and a desktop table dominate; empty state is visually generic and the mobile hierarchy is weak.                                                                     | Command-bar filtering, clearer discovery limitations, stronger empty-state path, and responsive invoice rows with labels.                                           | High   |
| `/invoices/new`  | Three near-identical form cards create a long stack. The sticky review is dense and approval/funding readiness is buried near the bottom.                                        | Numbered transaction choreography, larger monetary input, visual vesting timeline, prominent two-signature sequence, and clearer gas/principal separation.          | High   |
| `/invoices/[id]` | The amount card is strong but the timeline is a thin line, role/action context is secondary, and identifiers lack deliberate wrapping treatment.                                 | Hero-grade payment rail with elapsed/remaining segments, role-aware actions, immutable destination lock, and deliberate monospace evidence blocks.                  | High   |
| `/proof/[id]`    | It reuses the invoice screen without enough reviewer-specific framing. The reconciliation equation does not visually communicate conservation of funds.                          | Evidence-first header, source labels, ledger-style identity, transaction provenance, and explicit browser-versus-chain distinctions.                                | High   |
| `/activity`      | Table headings are detached from empty state, and an empty deployment leaves a large low-information panel.                                                                      | Event ledger with a compact indexing disclosure and a purposeful no-events state.                                                                                   | Medium |
| `/docs`          | Usable but visually flat; topics read as one continuous article and technical evidence lacks navigational emphasis.                                                              | Sticky protocol index, numbered chapters, formulas as ledger artifacts, stronger risk callouts.                                                                     | Low    |

## Visual problems

### Typography

- The UI declares Geist without actually loading or self-hosting it, so rendered typography depends on the platform fallback.
- Display and application typography use the same family and similar weights.
- Large headlines are forceful but not editorial; supporting text often has similar width and rhythm across sections.
- Financial figures use tabular features but not a distinct numeric voice.

### Color and surfaces

- Warm paper and dark green are appropriate, but acid lime, mint, amber, red, blue, and multiple green surfaces create too many competing accents.
- Most content is enclosed by the same one-pixel border and rounded rectangle.
- The isolated dark cards feel inserted rather than belonging to a continuous surface system.
- Shadows and radii do not distinguish instruments, sheets, notices, and controls.

### Composition

- The homepage repeatedly uses symmetric grids and equal card rows.
- The financial demonstration is not large enough to dominate the opening viewport.
- Application routes rely on `page heading + panel + card grid`, making distinct workflows look interchangeable.
- Mobile navigation is reachable but consumes a full second row without indicating the current section.

### Forms and transaction state

- The amount, duration, and recipient have similar emphasis even though they carry different financial consequences.
- Approval and funding appear as buttons rather than a signed two-step transaction sequence.
- Native gas balance and six-decimal escrow capital are explained in text but not visually separated.
- Wallet rejection and connection errors have no persistent, human-readable wallet surface.

### Wallet experience

- The connect button immediately selects the first connector.
- There is no wallet chooser, explicit MetaMask/browser-wallet choice, QR option, connection error panel, account copy action, or account menu.
- The connected button disconnects on the first click, which is easy to trigger accidentally.
- Network and gas readiness are scattered across route-specific content.

### Motion and accessibility

- GSAP covers the landing page, but motion is concentrated in card entrances and does not reinforce the payment timeline.
- Current animation easing is generic and the homepage marquee moves continuously.
- Reduced-motion handling is present and must remain.
- Focus styling is visible and must remain at least as strong after redesign.

## Functional findings

- Stable Reown AppKit 1.8 documentation requires Wagmi 2.x. Reown's Wagmi 3 adapter is a 2.0 prerelease. The verified Wagmi 3.7.7 transaction stack should not be replaced for a beta modal adapter.
- Wagmi 3 supports injected and WalletConnect connectors directly. WalletConnect requires `@walletconnect/ethereum-provider` and a real public project ID.
- Arc mainnet is CAIP `eip155:5042`, RPC `https://rpc.mainnet.arc.io`, explorer `https://explorer.arc.io`, and native gas symbol USDC with 18-decimal precision. The ERC-20 interface at `0x3600000000000000000000000000000000000000` uses six decimals.
- Official Arc RPC documentation limits `eth_getLogs` queries to 10,000 blocks. The Phase 4.1 implementation now pages at 9,999 blocks and locks that ceiling with a regression test; the previous release requested 25,000-block ranges.

## Design extraction

The useful reference principles are structural, not ornamental:

- VibeCurb: establish a design read before code, commit to one hero architecture, make typography architectural, use a strict palette, and visually diff the result.
- Modulify: retain a reusable system across marketing and application surfaces, keep layouts responsive without flattening every page into the same template, and preserve detail through implementation.
- Duelet-specific conclusion: use a layered-depth hero whose focal object is the real invoice-stream model; let marketing sections vary while application pages share a disciplined ledger language.

## Non-goals

- No Solidity, ABI, accounting, authorization, or deployment change.
- No fake positions, metrics, counterparties, transactions, or yields.
- No copied reference assets or wholesale page layouts.
- No AppKit beta integration, Wagmi downgrade, new custodial account system, onramp, swap, or social login.
