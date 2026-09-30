# MYH visual system

Use these defaults only when the product does not already have stronger brand or design-system rules.

## Palette

| Role | Default | Usage |
|---|---|---|
| Ink | `#0f172a` | headings, high-emphasis text |
| Text | `#334155` | primary body text |
| Muted | `#5b6b80` | descriptions, metadata (≥ 4.5:1 on Surface, Surface soft and Background) |
| Background | `#f6f8fb` | app shell |
| Surface | `#ffffff` | cards, dialogs, work surfaces |
| Surface soft | `#f8fafc` | quiet grouping |
| Border | `#e2e8f0` | default separators |
| Accent | `#155eef` | primary action, active state |
| Accent deep | `#0b4bd8` | primary hover/pressed |
| Success | `#059669` | successful state — fills, borders, icons |
| Success text | `#047857` | success copy on light surfaces |
| Warning | `#d97706` | review/attention state — fills, borders, icons |
| Warning text | `#b45309` | warning copy on light surfaces |
| Danger | `#dc2626` | destructive/error state |
| Danger text | `#b91c1c` | small error copy on tinted fills |

Do not expose meaning through color alone. Pair semantic colors with text, iconography, or shape/state labels.

Contrast is part of the token contract: every text/background pair must reach 4.5:1 (3:1 for large text and essential non-text UI). The base Success and Warning hues are below 4.5:1 as text on white, so use the *text* variants for copy and badges. When you introduce a new tinted background, re-check Muted and semantic text on it rather than assuming the defaults still pass.

## Typography

Preserve product typography if already established. For greenfield multilingual products with Thai support, a practical default is:

```css
font-family: "DM Sans", "Noto Sans Thai", system-ui, sans-serif;
```

For code/IDs/log output:

```css
font-family: "JetBrains Mono", ui-monospace, monospace;
```

Guidelines:

- Page titles: compact, strong, usually 24–32 px desktop.
- Section titles: 16–20 px.
- Body: 14–16 px depending on density.
- Supporting metadata: 12–13 px only when contrast remains strong.
- Avoid oversized marketing typography in operational workflows.

## Spacing

Use a consistent 4 px base rhythm:

- 4 px: tight internal alignment
- 8 px: icon/text and compact controls
- 16 px: standard component padding
- 24 px: section spacing
- 32 px: large component separation
- 48 px: major sections
- 64 px: rare hero/landing spacing

## Radius

- Buttons/inputs: 8–12 px
- Cards/panels: 12–16 px
- Modal/dialog: 16 px typical
- Chips/status/pills: full pill only when semantics justify it

Avoid making every container a rounded card.

## Elevation

Operational default:

```css
box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
```

Floating menu/dialog when hierarchy needs separation:

```css
box-shadow: 0 12px 30px rgb(15 23 42 / 0.12);
```

Avoid multiple competing shadow levels on the same screen.

## Motion

Preferred duration: 150–200 ms.

Animate only the property that changes:

```css
transition: background-color 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            opacity 180ms ease,
            box-shadow 180ms ease;
```

Avoid:

```css
transition: all 200ms ease;
```

Do not translate/scale operational controls on hover. A subtle entrance animation is acceptable for a welcome hero only when reduced-motion behavior is implemented.

## Icons

- Use one SVG icon family per product surface.
- Maintain consistent stroke weight and bounding box.
- Icons support labels; they do not replace labels for ambiguous actions.
- Do not use emoji as UI iconography.

## Decorative surfaces

A dashboard welcome/brand hero may use illustration or theme-aware accent colors. Contain decoration inside the hero. Tables, queues, forms, approvals, and configuration surfaces remain neutral and operational.
