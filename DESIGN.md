# Calculator App — Design Specification

**Author:** Architect (calculator-team)
**Date:** 2026-05-30
**Status:** Final — ready for implementation

---

## 1. Overview

A simple, self-contained web calculator delivered as three plain files with no build tools or external dependencies. It runs directly in any modern browser by opening `index.html`.

---

## 2. File Structure

```
/home/user/test-repository/
├── index.html   — markup, button grid, display, script/style links
├── style.css    — dark-theme design tokens, layout, button variants, responsive rules
└── script.js    — all application state, logic, event handling
```

---

## 3. index.html — Structure

### Document shell
- `<!DOCTYPE html>`, `lang="en"`, UTF-8 charset, viewport meta tag.
- `<title>Calculator</title>`
- `<link rel="stylesheet" href="style.css">` in `<head>`.
- `<script src="script.js">` at the end of `<body>` (no `defer` needed — script runs after DOM is parsed).

### Display area (`.display` inside `.calculator`)
Two `<div>` elements, both with `aria-live="polite"`:

| ID           | Purpose                                          |
|--------------|--------------------------------------------------|
| `#expression`| Shows the running expression, e.g. `12 +`        |
| `#result`    | Shows the current operand / computed result       |

### Button grid (`.buttons`)
A `<div role="group" aria-label="Calculator buttons">` containing 19 `<button>` elements.

Each button carries `data-action` and (where applicable) `data-value` attributes so the JS dispatcher can act without inspecting button text.

#### Layout (5 rows, 4-column grid)

```
Row 1:  C       DEL     %       /
Row 2:  7       8       9       *
Row 3:  4       5       6       -
Row 4:  1       2       3       +
Row 5:  0 (span 2)      .       =
```

#### Button class taxonomy

| Class          | Buttons                        | Purpose                    |
|----------------|--------------------------------|----------------------------|
| `.btn`         | all                            | base styles                |
| `.btn-digit`   | 0–9, `.`                       | digit/decimal              |
| `.btn-zero`    | 0 only                         | `grid-column: span 2`      |
| `.btn-operator`| `%`, `/`, `*`, `-`, `+`        | operator accent colour     |
| `.btn-utility` | `C`, `DEL`                     | utility/clear accent colour|
| `.btn-equals`  | `=`                            | equals accent colour       |

#### data-action values

| `data-action` | `data-value`  | Buttons         |
|---------------|---------------|-----------------|
| `digit`       | `"0"`–`"9"`   | digit buttons   |
| `decimal`     | —             | `.` button      |
| `operator`    | `+`/`-`/`*`/`/`/`%` | operator buttons |
| `equals`      | —             | `=` button      |
| `clear`       | —             | `C` button      |
| `backspace`   | —             | `DEL` button    |

---

## 4. style.css — Visual Design

### Design tokens (CSS custom properties on `:root`)

| Variable            | Value              | Usage                        |
|---------------------|--------------------|------------------------------|
| `--color-body`      | `#1a1a2e`          | page background              |
| `--color-card`      | `#16213e`          | calculator card background   |
| `--color-display`   | `#0f3460`          | display panel background     |
| `--color-operator`  | `#e94560`          | operator buttons & equals    |
| `--color-digit`     | `#1e3a5f`          | digit button background      |
| `--color-utility`   | `#533483`          | C / DEL button background    |
| `--color-equals`    | `#e94560`          | equals button background     |
| `--color-text`      | `#eaeaea`          | primary text                 |
| `--color-text-dim`  | `#c0d0e0`          | expression line text         |
| `--color-shadow`    | `rgba(0,0,0,0.5)`  | card drop shadow             |
| `--color-active`    | `rgba(255,255,255,0.15)` | pressed-state overlay  |
| `--radius-card`     | `16px`             | card border-radius           |
| `--radius-btn`      | `10px`             | button border-radius         |

### Layout approach
- `body`: full-viewport flexbox, centered both axes. `background: var(--color-body)`.
- `main`: `max-width: 380px`, `width: 100%`.
- `.calculator`: card with rounded corners, layered `box-shadow` for depth.
- `.display`: flex column, `justify-content: flex-end`, right-aligned text, `min-height: 110px`.
- `.buttons`: CSS Grid, `grid-template-columns: repeat(4, 1fr)`, `gap: 1px` with a dark background creating thin separator lines between buttons.

### Button states
- `:hover` — `filter: brightness(1.15)` on base colour.
- `:focus-visible` — `outline: 2px solid var(--color-operator)` inset, `z-index: 1` so it renders above neighbours.
- `:active` and `.pressed` (programmatically added) — `transform: scale(0.95)` + `filter: brightness(0.9)`.
- `.active-op` — `box-shadow: inset 0 0 0 2px rgba(255,255,255,0.6)` to indicate the pending operator.

### Result font scaling
Three CSS classes applied dynamically by JS to `#result`:

| Class     | Font size | Trigger            |
|-----------|-----------|--------------------|
| `.large`  | `2.4rem`  | ≤ 12 characters    |
| `.medium` | `1.9rem`  | 13–18 characters   |
| `.small`  | `1.4rem`  | > 18 characters    |

### Responsive breakpoints

| Breakpoint       | Change                                        |
|------------------|-----------------------------------------------|
| `max-width: 360px` | Reduce button height to 56 px, font to 1.1 rem |
| `min-width: 480px` | Increase max-width to 420 px, button height to 72 px |

---

## 5. script.js — Application Logic

### State object
A single plain object holds all mutable state:

```js
const state = {
  current:     '0',    // string being entered / shown in result
  previous:    null,   // first operand stored as string
  operator:    null,   // pending operator: '+' | '-' | '*' | '/' | '%'
  shouldReset: false   // true after = or operator; next digit replaces current
};
```

### Core functions

| Function                     | Responsibility                                                    |
|------------------------------|-------------------------------------------------------------------|
| `render()`                   | Sync DOM (`#result`, `#expression`) from state; call `adjustFontSize` |
| `adjustFontSize(text)`       | Add `.large`/`.medium`/`.small` class to `#result`               |
| `formatNumber(value)`        | `parseFloat(n.toPrecision(10)).toString()` — removes float noise  |
| `calculate(prev, op, curr)`  | Pure arithmetic; returns `'Error'` on division by zero or NaN    |
| `inputDigit(digit)`          | Append digit; respect `shouldReset`; cap at 15 significant digits |
| `inputDecimal()`             | Append `.` if not already present                                 |
| `inputOperator(op)`          | Chain evaluation if prior op pending; set `shouldReset = true`    |
| `pressEquals()`              | Evaluate; show full expression; clear operator/previous           |
| `clearAll()`                 | Reset all state to initial values                                 |
| `backspace()`                | Remove last char; reset to `'0'` if single char remains          |
| `highlightActiveOp(op)`      | Add `.active-op` to matching operator button                      |
| `clearActiveOp()`            | Remove `.active-op` from all operator buttons                     |
| `flashKey(selector)`         | Add/remove `.pressed` on a button for 100 ms (keyboard feedback)  |

### Division by zero
Inside `calculate()`, when `op === '/'` and `b === 0`, return `'Error'` immediately. All input functions check `state.current === 'Error'` at entry and call `clearAll()` before proceeding, ensuring the calculator recovers gracefully on the next input.

### Operator chaining
When the user presses an operator while `state.shouldReset === true` (i.e. they haven't entered a second operand yet), the operator is simply swapped — no evaluation occurs. When a second operand is present, the pending calculation is evaluated first and its result becomes the new `previous`.

### Event handling

**Click events** — single delegated listener on `.buttons`:
```
e.target.closest('.btn') → read data-action + data-value → dispatch
```

**Keyboard events** — `document.addEventListener('keydown', ...)`:

| Key(s)                   | Action                    |
|--------------------------|---------------------------|
| `0`–`9`                  | `inputDigit`              |
| `.`                      | `inputDecimal`            |
| `+` `-` `*` `/` `%`     | `inputOperator`           |
| `Enter` or `=`           | `pressEquals`             |
| `Backspace`              | `backspace`               |
| `Escape` or `Delete`     | `clearAll`                |

Modifier combos (`Ctrl`, `Meta`, `Alt`) are ignored so browser shortcuts are not hijacked. `e.preventDefault()` is called only for handled keys.

### Initialisation
`clearAll()` is called once at script load to ensure a clean starting state.

---

## 6. Accessibility

- `aria-live="polite"` on both display elements — screen readers announce updates.
- `aria-label` on all buttons that don't have self-describing text (e.g. operators).
- `role="group"` with `aria-label` on the button grid.
- `:focus-visible` outline ensures keyboard-navigable UI without polluting mouse UX.

---

## 7. Constraints & Non-Goals

- **No frameworks, no build tools.** Vanilla HTML/CSS/JS only. Zero npm, zero bundlers.
- **No persistent state.** No localStorage. Each page load starts fresh.
- **No history / undo beyond DEL.** Single-step backspace only.
- **No scientific functions.** Only `+`, `-`, `*`, `/`, `%`.
- **No server.** Files are opened directly in a browser (`file://`) or served statically.

---

## 8. Acceptance Criteria

- [ ] All five operators (`+`, `-`, `*`, `/`, `%`) produce correct results.
- [ ] Division by zero displays `Error` and recovers on next input.
- [ ] `C` resets everything; `DEL` removes the last digit.
- [ ] Decimal point can be entered once per operand; leading zero is normalised.
- [ ] Keyboard shortcuts work: digits, operators, `Enter`, `Backspace`, `Escape`.
- [ ] Active operator is highlighted with an inset ring until evaluation.
- [ ] Very long numbers trigger medium/small font classes to avoid overflow.
- [ ] Layout is usable on screens as narrow as 320 px and as wide as 1 440 px.
- [ ] Dark theme is applied; no white flash on load.
- [ ] No JavaScript errors in the browser console under normal use.
