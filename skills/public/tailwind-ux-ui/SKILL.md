---
name: tailwind-ux-ui
description: Design, build, refactor, and debug webapp UX/UI using Tailwind CSS plus project global CSS classes, with strong consistency and responsiveness. Use when implementing new screens/components, fixing visual bugs, normalizing off-pattern interfaces, or improving layout/visual hierarchy in codebases that already have established styles, tokens, or design system conventions.
---

# Build Consistent Tailwind UI

Deliver UX/UI work that looks native to the project, not generic. Favor existing design language first, then fill gaps with minimal, reusable additions.

## Workflow

### 1) Map Existing Design Language First

Inspect the current style system before proposing changes:
- Find Tailwind config and theme extensions (`tailwind.config.*`, `src/styles`, `globals.css`).
- Find reusable primitives/components (`Button`, `Card`, layout wrappers, typography classes).
- Extract established tokens and patterns: spacing scale, typography scale, color usage, radius, shadows, border patterns, focus states, motion usage.
- Identify breakpoint usage already present in code and copy that rhythm.

If a project convention conflicts with generic best practice, follow the project convention unless accessibility or usability is harmed.

### 2) Choose Reuse Strategy

Prefer this order:
1. Reuse existing component variants.
2. Reuse existing utility combinations and global classes.
3. Create a small semantic class in global CSS for repeated patterns.
4. Add new Tailwind utilities only when the prior options cannot express the needed behavior.

Avoid introducing one-off class systems that compete with the project style.

### 3) Implement With DRY, Lean Class Composition

Keep styling maintainable:
- Minimize class duplication across files; extract repeated stacks.
- Keep class sets purposeful; avoid speculative styling.
- Prefer tokenized values over arbitrary values.
- Avoid inline styles unless dynamic runtime values require it.
- Keep naming explicit and system-oriented for any new global classes.

For new global CSS classes:
- Match existing naming conventions if present.
- If no convention exists, use kebab-case semantic names tied to UI role (example: `.form-section-title`, `.panel-surface-muted`).
- Scope utility-like helpers carefully to avoid accidental global overrides.

### 4) Normalize Inconsistent UX/UI

When fixing off-pattern screens/components:
- Align spacing rhythm with nearby pages using same layout type.
- Align typography hierarchy with existing heading/body patterns.
- Align color and emphasis with current semantic intent (primary, secondary, destructive, muted).
- Align interaction states (hover, active, disabled, focus-visible) with the system baseline.
- Remove local visual hacks that conflict with shared styles.

Use before/after diffs that focus on consistency, not novelty.

### 5) Build Responsively by Default

Treat responsive behavior as a first-class requirement:
- Start from mobile/base styles, then layer upward breakpoints.
- Use project-standard breakpoints and container widths.
- Rebalance density for each breakpoint: spacing, font size, grid columns, and control hit area.
- Prevent overflow and truncation regressions in real content states.
- Keep tap targets and form controls usable on small screens.

Load [`references/responsive-consistency-checklist.md`](references/responsive-consistency-checklist.md) when auditing or implementing significant UI updates.

### 6) Verify and Report

After changes:
- Check visual parity with adjacent pages and shared components.
- Check keyboard focus visibility and contrast-sensitive states.
- Check responsive behavior at minimum: mobile, tablet, desktop, large desktop.
- Report what was normalized and what system rules were reused.

## Task Modes

### Build from Scratch

Establish a minimal style spine first:
1. Layout shell and spacing rhythm.
2. Typography hierarchy.
3. Core surfaces and interaction states.
4. Responsive adjustments.

Only then add decorative or secondary styling.

### Add New Feature UI

Compose from existing patterns before inventing new ones. Extend variant APIs or semantic classes only where reuse is likely.

### Fix Existing UX/UI Bugs

Diagnose whether the bug is:
- Token mismatch.
- Variant misuse.
- Breakpoint regression.
- Local override conflict.
- Structural layout issue.

Fix root causes at the most reusable level possible.
