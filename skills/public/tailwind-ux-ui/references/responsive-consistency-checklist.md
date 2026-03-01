# Responsive and Consistency Checklist

Use this checklist for substantial UI work or normalization passes.

## 1) System Match

- Reuse existing component variants before adding new ones.
- Reuse existing spacing and typography scales.
- Reuse semantic color intent already present in the project.
- Reuse existing radius, border, and shadow language.
- Reuse existing focus-visible treatment and interaction timing.

## 2) Layout Rhythm

- Keep vertical spacing cadence consistent section-to-section.
- Keep container widths aligned with existing page patterns.
- Keep grid and flex behavior consistent with sibling screens.
- Avoid ad hoc negative margins unless the system already uses them.

## 3) Typography Hierarchy

- Maintain heading level progression without size jumps.
- Maintain body/secondary/helper text contrast and size relationships.
- Avoid one-off font-size values when a tokenized size exists.

## 4) Component States

- Verify default, hover, active, disabled, and focus-visible states.
- Verify error/success/warning/info states for forms and alerts.
- Verify state styles still match semantic color rules.

## 5) Responsive Behavior

- Validate at project breakpoints (at least mobile, tablet, desktop, large desktop).
- Verify no horizontal overflow in normal and worst-case content.
- Verify text wrapping/truncation behavior is intentional.
- Verify controls stay usable at small viewport widths.
- Verify spacing and density are adjusted per breakpoint, not simply scaled.

## 6) Accessibility Baseline

- Keep interactive targets comfortably tappable on mobile.
- Keep focus order and keyboard navigation logical.
- Keep focus indicators visible against all affected surfaces.
- Keep color contrast sufficient for text and state indicators.

## 7) DRY and Maintainability

- Remove repeated class stacks by extracting shared patterns.
- Prefer small semantic global classes for repeated combinations.
- Keep global CSS additions scoped and non-conflicting.
- Remove obsolete local overrides and dead class fragments.

## 8) Final Diff Quality

- Confirm changes improve consistency rather than visual novelty.
- Confirm no unrelated style churn was introduced.
- Summarize what system rules were reused and what was intentionally added.
