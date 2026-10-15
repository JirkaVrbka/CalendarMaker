# Support / Donation feature — design (DRAFT, paused)

> Status: **DRAFT — design presented, not yet finally approved; implementation NOT started.**
> Paused 2026-10-15 at the user's request ("keep this plan, I will return to it").
> Resume by re-reading this file, confirming the open items, then → `writing-plans`.
> Git: do not commit/stage (standing user rule — see memory `no-git-manipulation`).

## Goal
Add a voluntary "money gift" option to CalendarMaker so users can support the author — **both** a
card-friendly creator button **and** a fee-free Czech bank QR, side by side. Must fit the app's
**client-only / static / no-backend / no-auth** architecture (link-out + client-generated QR only).

## Decisions locked with the user
- **Methods:** Ko-fi button (cards/international) **+** QR Platba (SPAYD) for Czech donors — both.
- **Placement:** a coffee icon in the header → opens a **Support dialog** (not footer/panel/post-export).
- **QR:** generated **client-side** from the IBAN via a small library; **no fixed amount** (donor sets it);
  message "CalendarMaker donation".
- **Ko-fi:** **link-out** (`ko-fi.com/<user>` in a new tab, `rel=noopener`) — NOT the Ko-fi embed script,
  to avoid loading third-party JS (privacy ethos).

## UX
Coffee `IconButton` in the AppBar (near the theme toggle) → MUI `Dialog` "Support CalendarMaker" with:
1. **Buy me a coffee** — Ko-fi link button (new tab).
2. **QR Platba** — generated SPAYD QR + the account/IBAN shown as text + a one-line "scan with your Czech
   bank app" hint.
Localized EN + CZ.

## Components (new, isolated under `src/features/support/`)
- `SupportButton.tsx` — header `IconButton` + `Tooltip`; opens the dialog (local `useState`).
- `SupportDialog.tsx` — MUI `Dialog`: intro, Ko-fi link button, `BankQr`, close. Labels via i18n props.
- `BankQr.tsx` — renders the QR from config using **`qrcode.react`** (`QRCodeSVG`).
- `lib/spayd.ts` — pure `buildSpayd(config)` → `SPD*1.0*ACC:<IBAN>*CC:CZK*MSG:...` (unit-testable, no React).
- `src/config/support.ts` — `{ kofiUrl, iban, recipientName, currency: 'CZK', message }` (placeholders first).
- i18n (EN+CZ): support title, intro, Ko-fi label, QR heading, QR hint, account label, close.

## Data / constraints
No persistence, no backend, no auth. QR computed from config; Ko-fi is a plain external link. The IBAN lives
in the client bundle by nature of a client-side QR (acceptable for a donation account — user is aware).

## Testing
- Unit: `buildSpayd()` produces the correct SPAYD string from config.
- Component: SupportButton opens the dialog; SupportDialog shows the Ko-fi link (correct href/target/rel) + a
  rendered QR + localized text; a11y (dialog role, focusable close).

## Open items to confirm on resume
1. Provide real **Ko-fi URL** + **IBAN** (placeholders until then).
2. Approve adding the **`qrcode.react`** dependency (`npm i qrcode.react` — mature; per "ask before installing deps").
3. Optional extras considered, currently OUT (confirm): EPC/SEPA QR for non-CZ EU donors; a suggested-amount
   selector; Buy Me a Coffee instead of Ko-fi.

## Next step
On resume: confirm the open items → invoke `writing-plans` to produce the implementation plan.
