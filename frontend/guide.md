# Auth Pages Guide — Login, Signup, Forgot Password, OTP Verification

Where the auth code lives and what each piece does. All paths are relative to `code/FE`.
These pages are presentational only (no API/auth calls yet). Login and Signup now include an
inline OTP verification step (see section 7) plus shared client-side field validation
(section 3, `lib/validation.ts`).

## 1. Routes (`app/`)

Each route file is a thin wrapper that just renders a screen component.

| URL | File | Renders |
|---|---|---|
| `/login` | `app/login/page.tsx` | `LoginScreen` |
| `/signup` | `app/signup/page.tsx` | `SignupScreen` |
| `/forgot-password` | `app/forgot-password/page.tsx` | `ForgotPasswordScreen` |

Shared files in `app/` used by all three:

| File | Description |
|---|---|
| `app/layout.tsx` | Root layout. Loads fonts (Space Grotesk → `--font-grotesk`, Rubik → `--font-rubik`), mounts `<AmbientBg />` and `<IconSprite />` once, wraps every page. |
| `app/globals.css` | All styling classes used by the auth screens (see section 4). |
| `app/icon.png` | Favicon. |

Auth pages use **no** `AppShell` / `MarketingChrome` — each screen is a full-page two-column layout of its own.

## 2. Screen components (`components/screens/`)

| File | Description | Used in |
|---|---|---|
| `components/screens/LoginScreen.tsx` | Login page. `step` state `"credentials" \| "otp"`. **Credentials step:** left panel (logo, mascot, level ring, weekly streak strip, reward chips); right panel email/username + password (eye toggle), remember-me, validated Log in button, links to Signup and Forgot password. On valid submit it stashes the identifier, resets the OTP boxes/cooldown, and switches to **OTP step:** "Verify it's you" card with `OtpInput`, a "Didn't get a code? Resend in 00:NN" timer, and Verify & log in — see section 7. | `app/login/page.tsx` |
| `components/screens/SignupScreen.tsx` | Signup page. 4-step form (`step` state 1→4): (1) pick role (Learner, College Student, Faculty, Professional, Recruiter), (2) identity fields, (3) **OTP verification** (`OtpInput`, resend timer — see section 7), (4) role-specific details. Contains internal helpers `Field` (renders text/password/select/segmented/LinkedIn fields), `identityRows`, `validateAndAdvance` (runs `collectFormErrors` before advancing a step), and config tables `ROLES`, `ROLE_CONFIG`, `COLLEGES`, `DEPARTMENTS`. Links back to Login. | `app/signup/page.tsx` |
| `components/screens/ForgotPasswordScreen.tsx` | Forgot password page. Same two-column look. State `sent`: email form → "Check your inbox" confirmation (with "use a different email"). Links back to Login. UI only — no email is actually sent. | `app/forgot-password/page.tsx` |

Navigation between them:
- Login → `/signup` ("Create an account"), `/forgot-password` ("Forgot password?")
- Signup → `/login` ("Already have an account?")
- Forgot password → `/login` ("Back to log in")

## 3. Shared components & helpers (`components/`, `lib/`)

The auth screens are mostly self-contained. What they pull in:

| Item | Location | Description | Used by |
|---|---|---|---|
| `AmbientBg` | `components/AmbientBg.tsx` | Animated background behind every page. | Mounted in `app/layout.tsx` (all auth pages inherit it) |
| `IconSprite` | `components/IconSprite.tsx` | SVG `<symbol>` sprite; auth screens reference icons via `<use href="#ic-…">`. | Mounted in `app/layout.tsx` |
| `s()` | `lib/style.ts` | Converts inline CSS strings to React `style` objects (`style={s("display:flex;gap:8px")}`). | Login, Signup, ForgotPassword |
| `OtpInput`, `OTP_LENGTH` | `components/OtpInput.tsx` | Controlled 6-box one-time-code input (per-digit auto-advance, backspace-to-previous, paste-to-fill). See section 7 for full source. | Login (OTP step), Signup (step 3) |
| `collectFormErrors`, `messageForField` | `lib/validation.ts` | Runs the browser Constraint Validation API (`checkValidity()`) over a form's named fields and turns `ValidityState` into a human-readable message (`"X is required."`, `"Enter a valid email address."`, etc.), returned as `{ [fieldName]: message }`. | Login, Signup |
| `Link` | `next/link` | Client-side navigation. | Login, Signup, ForgotPassword |
| `Icon.tsx` | `components/Icon.tsx` | Icon wrapper — **not** used by auth screens (they write `<svg><use/></svg>` directly). | — |
| `AppShell`, `AdminShell`, `MarketingChrome`, `lib/nav.ts` | `components/`, `lib/` | App/admin/marketing chrome and nav — **not** used by auth pages. | — |

Icons used from the sprite (`components/IconSprite.tsx`):

| Icon id | Where |
|---|---|
| `ic-flame` | Login (streak days, 7-day streak chip) |
| `ic-gem`, `ic-crown` | Login reward chips |
| `ic-eye` | Password show/hide buttons (Login, Signup) |
| `ic-arrow` | Submit/next buttons (Login, Forgot password) |
| `ic-arrow-l` | Back buttons (Login OTP step, Signup steps 2/3) |
| `ic-shield` | Signup OTP step badge icon |
| `ic-x` | Inline field/OTP error message icon (`.err-msg`) |
| `ic-mail` | Forgot password confirmation |
| `ic-globe` | Signup LinkedIn field |
| `ic-chevron` | Signup select dropdowns and step separators |
| `ic-book`, `ic-cert`, `ic-flask`, `ic-swords` | Signup left-panel stat strip |
| `ic-book`, `ic-target`, `ic-bulb`, `ic-chart`, `ic-search` | Signup role chips |

Images (`public/`):

| File | Used in |
|---|---|
| `public/logo.png` | Header logo on all three auth screens |
| `public/mascot-hero.png` | Mascot on all three auth screens |

## 4. CSS classes (`app/globals.css`)

| Class | Description | Used in |
|---|---|---|
| `.auth-shell` | Full-height flex container for the two columns | All |
| `.auth-side` | Left decorative panel (hidden/compacted on small screens) | All |
| `.auth-orb` | Blurred glow circles in the left panel | All |
| `.auth-main` | Right column that centers the card | All |
| `.auth-card` (+ `.glass`) | The frosted-glass form card | All |
| `.in` | Text input / select style | All |
| `.eyebrow`, `.lead`, `.disp`, `.lime` | Label, subtitle, heading font, highlighted word | All |
| `.btn`, `.btn-v`, `.btn-g` | Buttons (violet primary, ghost secondary) | All |
| `.mascot`, `.mascot-login`, `.mascot-signup`, `.mascot-glow`, `.float`, `.tw` | Mascot image, glow, floating and twinkle animations | All |
| `.lvl-ring`, `.streak-strip`, `.streak-day`, `.reward-chip` | Level ring, streak calendar, reward chips | Login |
| `.pw-field`, `.pw-toggle` | Password input with eye button | Login, Signup |
| `.otp-row`, `.otp-box`, `.otp-resend` | OTP 6-box row, individual digit box (+ `.invalid` state), resend-code link/timer | Login (OTP step), Signup (step 3) |
| `.err-msg`, `.field-shake` (`@keyframes fieldshake`) | Inline validation error text under a field, and the shake animation played on invalid submit | Login, Signup (all validated fields + OTP) |
| `.step-track`, `.step-dot`, `.back-link` | Step progress dots and back button | Signup |
| `.role-row`, `.role-chip`, `.seg-row`, `.seg-chip`, `.select-field`, `.linkedin-field`, `.field-optional`, `.hint` | Signup form field styles | Signup |
| `.stat-strip`, `.stat-cell`, `.stat-ic`, `.stat-num`, `.stat-lbl` | Left-panel stats (Signup); `.stat-ic` also reused for the mail icon badge in Forgot password | Signup, Forgot password |

Responsive rules for the auth layout are in the `.auth-*` / `.mascot-login` media queries near the top of `globals.css` (columns stack below ~900px).

## 5. Quick "where do I change X?"

| Change | Edit |
|---|---|
| Login form fields / copy | `components/screens/LoginScreen.tsx` |
| Signup steps, roles, fields | `SignupScreen.tsx` → `ROLES`, `ROLE_CONFIG`, `Field` |
| Reset-password flow copy / states | `components/screens/ForgotPasswordScreen.tsx` |
| Add a new auth page | new `app/<name>/page.tsx` + new `components/screens/<Name>Screen.tsx` (copy an existing screen for the layout) |
| Look & feel of the card / panel | `app/globals.css` (`.auth-*`) |
| Add an icon | `components/IconSprite.tsx` |

## 6. Forgot password — full map

**Route**

| URL | File | Description |
|---|---|---|
| `/forgot-password` | `app/forgot-password/page.tsx` | Thin route; renders `<ForgotPasswordScreen />`. |

**Components**

| Component | Location | Description |
|---|---|---|
| `ForgotPasswordScreen` | `components/screens/ForgotPasswordScreen.tsx` | The whole page. `sent` state toggles between the email form and the "Check your inbox" confirmation; `email` state echoes the address back. Left panel reuses the login look (logo, mascot, headline). |
| `AmbientBg`, `IconSprite` | `components/AmbientBg.tsx`, `components/IconSprite.tsx` | Mounted by `app/layout.tsx`; provide the background and the `ic-arrow` / `ic-mail` icons used here. |
| `s()` | `lib/style.ts` | Inline-CSS-string helper. |

**Links in and out**

| From | To | Where |
|---|---|---|
| Login | `/forgot-password` | "Forgot password?" link in `components/screens/LoginScreen.tsx` |
| Forgot password | `/login` | "Back to log in" link in `ForgotPasswordScreen.tsx` |

**Assets:** `public/logo.png`, `public/mascot-hero.png`. **CSS:** `.auth-*`, `.in`, `.btn-v`, `.btn-g`, `.stat-ic`, `.mascot*` in `app/globals.css`.

## 7. OTP verification — full map

There is no standalone `/otp` route. OTP verification is an inline **step** inside the existing
`LoginScreen` and `SignupScreen` components (same card, same `auth-shell` layout — just a
different chunk of JSX rendered based on `step`), not a separate page.

**Where it appears**

| Screen | Step value | Trigger | What happens after verify |
|---|---|---|---|
| `LoginScreen.tsx` | `step === "otp"` | Credentials form (`identifier` + `password`) passes validation on submit | `handleOtpSubmit` just clears `otpError` (no real auth backend — UI only) |
| `SignupScreen.tsx` | `step === 3` | Identity form (step 2) passes validation on submit | Advances to `step 4` (role-specific details) |

**Shared component — `components/OtpInput.tsx`**

A controlled 6-digit code input. Each box holds one digit; typing a digit auto-advances focus,
Backspace on an empty box moves focus back, and pasting a full code fills all boxes at once.

```tsx
"use client";
import { useRef } from "react";

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange, invalid }: { value: string[]; onChange: (next: string[]) => void; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    if (!digits.length) return;
    e.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || "");
    onChange(next);
    refs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  }

  return (
    <div className="otp-row">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`otp-box${invalid && !value[i] ? " invalid" : ""}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}

export { OTP_LENGTH };
```

**Usage pattern** (identical in both screens): each screen owns its own `otp` (`string[]`,
length `OTP_LENGTH`), `otpError` (bool), and `cooldown` (number, seconds) state, and renders

```tsx
<OtpInput value={otp} onChange={(next) => { setOtp(next); setOtpError(false); }} invalid={otpError} />
{otpError && <p className="err-msg"><svg viewBox="0 0 24 24"><use href="#ic-x" /></svg>Enter all 6 digits.</p>}
```

followed by a resend link driven by a `setTimeout`-based countdown:

```tsx
const RESEND_SECONDS = 30;
useEffect(() => {
  if (step !== "otp" /* or !== 3 in Signup */ || cooldown === 0) return;
  const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
  return () => clearTimeout(t);
}, [step, cooldown]);
```

```tsx
<button type="button" className="otp-resend" disabled={cooldown > 0} onClick={() => setCooldown(RESEND_SECONDS)}>
  {cooldown > 0 ? `Resend in 00:${String(cooldown).padStart(2, "0")}` : "Resend code"}
</button>
```

Submit is guarded by `otpComplete = otp.every((d) => d !== "")`; an incomplete code sets
`otpError` and bumps `shakeKey` to replay the `.field-shake` animation on the wrapping `<div>`
(same pattern as every other validated field — see `lib/validation.ts` in section 3).

**Differences between the two screens**

| | Login | Signup |
|---|---|---|
| Purpose (copy) | "Verify it's you" — login 2FA-style check | "Let's verify it's really you" — email/mobile verification during sign-up |
| Code sent to | The identifier typed in step 1 (shown in the subtitle) | Email **and** mobile number (per the on-screen copy) |
| Back button | Returns to `"credentials"` step | Returns to `step 2` (identity form) |
| Extra visual | — | `.stat-ic` badge with `ic-shield` icon above the copy |
| On success | Stays on the card (no further step; `otpError` cleared) | Advances to `step 4` (role-specific details) |

**CSS:** `.otp-row`, `.otp-box` (+ `.invalid`), `.otp-resend`, `.err-msg`, `.field-shake` /
`@keyframes fieldshake` — all in `app/globals.css`. **Icons:** `ic-x` (error), `ic-shield`
(Signup badge), `ic-arrow-l` (back), `ic-arrow` (submit) from `components/IconSprite.tsx`.

## 8. Work done today (2026-09-22)

Changes made to the auth flow in this session, in `code/FE`:

- **Added `lib/validation.ts`** — shared `collectFormErrors` / `messageForField` helpers that
  wrap the browser Constraint Validation API to produce per-field error messages without a
  validation library.
- **Added `components/OtpInput.tsx`** — the 6-box OTP input described in section 7 (auto-advance,
  backspace navigation, paste-to-fill).
- **`components/screens/LoginScreen.tsx`** — turned Log in into a two-step flow: credentials
  (now validated via `collectFormErrors`, with `.err-msg` + `.field-shake` on error) → OTP
  verification (new `"otp"` step) with a 30s resend cooldown.
- **`components/screens/SignupScreen.tsx`** — inserted OTP verification as a new **step 3**
  between identity (step 2) and role-specific details (now step 4); wired `validateAndAdvance`
  to run field validation before every step transition.
- **`app/globals.css`** — added `.otp-row`, `.otp-box`, `.otp-resend`, `.err-msg`, `.field-shake`
  / `@keyframes fieldshake` to support the OTP UI and the new inline validation error states.

This guide file (`guide.md`) was updated to document all of the above (section 2 screen
descriptions, section 3 shared helpers, section 4 CSS classes, section 5 icon table, and the new
section 7).

Other files touched today outside the scope of this auth guide (not documented here — see
`components/dashboard/`, `components/screens/networking/`, `components/screens/MainScreen.tsx`):
`components/dashboard/dash.css`, `components/dashboard/DashAnalytics.tsx`,
`components/screens/MainScreen.tsx`, `components/screens/networking/ConceptScreen.tsx`,
`components/screens/networking/StoryScreen.tsx`, `components/screens/networking/concept.css`.
