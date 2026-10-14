# Duelet design system

## Direction

Duelet is an editorial payment instrument: calm enough for financial decisions, distinctive enough to be remembered, and explicit enough to be verified. Warm paper surfaces hold near-black ink. A single chartreuse signal marks current value, progress, and primary action. Technical evidence uses quiet graphite and monospaced numerals.

The system avoids generic Web3 gradients, glass cards, fake charts, excessive pills, and undifferentiated dashboard tiles.

## Tokens

### Color

| Token           | Value                    | Role                              |
| --------------- | ------------------------ | --------------------------------- |
| `--canvas`      | `#f1eee5`                | Page background                   |
| `--canvas-deep` | `#e8e3d7`                | Alternating editorial field       |
| `--sheet`       | `#faf8f2`                | Forms and primary work surfaces   |
| `--ink`         | `#111713`                | Primary text and deep instruments |
| `--ink-soft`    | `#344039`                | Secondary headings                |
| `--muted`       | `#69736d`                | Supporting copy                   |
| `--line`        | `rgba(17, 23, 19, 0.14)` | Rules and dividers                |
| `--signal`      | `#c8f45a`                | The single brand/action accent    |
| `--signal-deep` | `#78972a`                | Accessible signal text and focus  |
| `--warning`     | `#f2cf82`                | Caution only                      |
| `--danger`      | `#b9564f`                | Destructive action only           |
| `--success`     | `#2f7552`                | Confirmed state only              |

Signal color never implies confirmed financial success. Confirmation uses explicit copy and the success token.

### Typography

- Display: Instrument Serif, self-hosted by Next.js font tooling at build time, with Georgia fallback.
- Interface: Manrope, self-hosted by Next.js font tooling, with system sans fallback.
- Evidence: ui-monospace stack with tabular numerals.
- Hero display: `clamp(4.4rem, 11vw, 10.5rem)`, line-height `0.82`, tight tracking.
- Page title: `clamp(3.2rem, 7vw, 6.8rem)`, line-height `0.9`.
- Section title: `clamp(2.5rem, 5vw, 5.5rem)`, line-height `0.94`.
- Body: `0.95–1.15rem`, maximum `65ch`, line-height `1.65`.
- Financial hero: interface sans, tabular figures, weight 600, tight tracking.
- Evidence labels: `0.68rem`, positive tracking, uppercase only for short machine-oriented labels.

### Spacing

Use a 4px base with a practical scale of 8, 12, 16, 24, 32, 48, 72, 104, and 144px. Marketing sections use optical, asymmetric spacing. Transaction controls use consistent 12–24px internal rhythm.

### Radius

- Controls: 10px.
- Sheets and forms: 16px.
- Major financial instrument: 28px.
- Status markers: full radius only when compact state semantics benefit from it.
- Editorial sections and evidence ledgers may use square rules instead of cards.

### Elevation

- Most surfaces use borders or color contrast, not shadow.
- The dominant financial instrument uses one warm, directional shadow.
- Modals use a deep green-black overlay and a short-distance sheet shadow.

## Layout principles

1. One dominant financial object per screen.
2. Marketing compositions may break the grid; transaction controls may not.
3. Use rules, whitespace, and typography before adding containers.
4. Keep identifiers visible and wrap safely with `overflow-wrap: anywhere`.
5. Separate native 18-decimal gas from six-decimal ERC-20 invoice amounts in both copy and layout.
6. Never use color alone to communicate transaction or invoice state.

## Components

### Header

An editorial top rail with active-route indication, Arc mainnet label, and a wallet control. On mobile, navigation remains visible in a horizontally scrollable rail.

### Buttons

- Primary: ink surface with signal edge or signal surface with ink text, depending on surrounding contrast.
- Secondary: transparent with a strong rule.
- Destructive: danger outline until confirmation intent is explicit.
- Disabled: retains legible copy and explains the blocking state nearby.
- Hover uses a two-pixel lift; press compresses to `0.985`.

### Financial instrument

The invoice-stream visualization contains one large funded amount, a time rail, vested/claimable/unvested values, immutable parties, current observation time, and cancellation consequence. It is labeled illustrative until chain-backed.

### Forms

Sections are numbered steps joined by a vertical transaction rail. Amount is the strongest input. Privacy warnings sit beside metadata, not in a generic footer. Approval and funding are rendered as two distinct signatures.

### Wallet sheet

The modal is a native dialog with focus management, Escape dismissal, backdrop dismissal, connector status, error messages, and mobile bottom-sheet behavior. Connected state opens an account sheet rather than disconnecting immediately.

### Empty and error states

Use a specific explanation, the exact missing prerequisite, and one primary recovery action. Never invent activity to fill space.

## Motion

- Hero: staggered copy reveal followed by the invoice instrument settling into depth.
- Stream rail: progress changes linearly because it represents time, not spring physics.
- Interface state: short spring-like easing for sheets, buttons, and disclosure.
- Scroll reveals guide reading order and never delay access to content.
- `prefers-reduced-motion` disables translation, scale, marquee motion, and scrubbing.

## Responsive breakpoints

- Compact: below 560px.
- Tablet: 560–899px.
- Desktop: 900–1279px.
- Wide: 1280px and above.

Application grids collapse before financial data becomes cramped. Tables become labeled stacked rows. Wallet sheets become bottom-aligned on compact screens. No financial amount may require horizontal page scrolling.

## Accessibility states

- Focus ring: 3px signal-deep with 3px offset.
- Minimum text contrast targets WCAG AA.
- Modal uses `role="dialog"`, `aria-modal`, a labelled title, focus entry, and focus return.
- Status updates use polite live regions; errors use alerts.
- Copy, disconnect, switch network, and connector buttons have explicit accessible names.
