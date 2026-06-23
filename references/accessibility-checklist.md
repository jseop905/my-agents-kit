# Accessibility Checklist

> **Scope:** 웹 프론트엔드 (HTML/CSS/JavaScript). 네이티브 앱이나 CLI 프로젝트에는 해당하지 않는 항목이 있을 수 있다.

Quick reference for WCAG 2.1 AA compliance. Use alongside `commands/ship.md`.

## Essential Checks

### Keyboard Navigation
- [ ] All interactive elements focusable via Tab
- [ ] Focus order follows visual/logical order
- [ ] Focus is visible (outline/ring)
- [ ] Custom widgets: Enter to activate, Escape to close
- [ ] No keyboard traps
- [ ] Skip-to-content link at top of page
- [ ] Modals trap focus while open, return focus on close

### Screen Readers
- [ ] All images have `alt` text (or `alt=""` for decorative)
- [ ] All form inputs have associated labels
- [ ] Buttons/links have descriptive text (not "Click here")
- [ ] Icon-only buttons have `aria-label`
- [ ] One `<h1>` per page, headings don't skip levels
- [ ] Dynamic content announced (`aria-live`)
- [ ] Tables have `<th>` headers with scope

### Visual
- [ ] Text contrast >= 4.5:1 (normal) or >= 3:1 (large 18px+)
- [ ] UI components contrast >= 3:1
- [ ] Color is not the only way to convey information
- [ ] Text resizable to 200% without breaking layout

### Forms
- [ ] Every input has a visible label
- [ ] Required fields indicated (not by color alone)
- [ ] Error messages specific and associated with field
- [ ] Error state: icon, text, or border (not color alone)

### Content
- [ ] `<html lang="en">` declared
- [ ] Descriptive `<title>`
- [ ] Touch targets >= 44x44px on mobile

## Common HTML Patterns

```html
<!-- Buttons for actions -->
<button onClick={handleDelete}>Delete Task</button>

<!-- Links for navigation -->
<a href="/tasks/123">View Task</a>

<!-- NEVER: div as button -->
<div onClick={handleDelete}>Delete</div>  <!-- BAD -->

<!-- Form labels -->
<label htmlFor="email">Email address</label>
<input id="email" type="email" required />

<!-- ARIA roles -->
<nav aria-label="Main navigation">...</nav>
<div role="status" aria-live="polite">Task saved</div>
<div role="alert">Error: Title is required</div>

<!-- Modal -->
<dialog aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Delete</h2>
</dialog>

<!-- Loading -->
<div aria-busy="true" aria-label="Loading tasks">
  <Spinner />
</div>
```

## ARIA Live Regions

| Value | Behavior | Use For |
|-------|----------|---------|
| `aria-live="polite"` | Announced at next pause | Status updates, confirmations |
| `aria-live="assertive"` | Announced immediately | Errors, time-sensitive alerts |
| `role="status"` | Same as `polite` | Status messages |
| `role="alert"` | Same as `assertive` | Error messages |

## Testing Tools

```bash
npx @axe-core/cli <url>   # CLI testing (e.g. npx @axe-core/cli http://localhost:3000)
npx pa11y             # CLI checker

# Browser: Chrome DevTools → Lighthouse → Accessibility
# macOS: VoiceOver (Cmd + F5)
# Windows: NVDA (free) or JAWS
```

## Common Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| `div` as button | Use `<button>` |
| Missing `alt` text | Add descriptive `alt` |
| Color-only states | Add icons, text, or patterns |
| Custom dropdown, no ARIA | Use native `<select>` or ARIA listbox |
| Removing focus outlines | Style outlines, don't remove |
| Empty links/buttons | Add text or `aria-label` |
| `tabindex > 0` | Use `0` or `-1` only |
