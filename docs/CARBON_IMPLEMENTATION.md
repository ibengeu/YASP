# Carbon Design System Implementation Guide

## Quick Start

YASP now uses **IBM Carbon Design System v11** for all design decisions. All styling is token-based and automatically responsive to light/dark mode switching.

## Core Principles

### 1. **Minimalist Design**
- Sharp corners by default (0px radius)
- Subtle, purposeful shadows
- Clean, professional aesthetic
- Inspired by IBM's design philosophy

### 2. **Systematic Grid**
- 4px base unit for all spacing
- Ensures perfect alignment and consistency
- Predictable, scalable spacing system

### 3. **Semantic Colors**
- All colors have meaning
- Primary for actions, Secondary for less emphasis
- Success, Warning, Info for status
- Destructive for dangerous actions

### 4. **Accessible by Default**
- WCAG AA compliant color contrasts
- Automatic dark mode support
- Clear, readable typography

## Using Carbon Tokens

### Color Usage

**Primary Actions:**
```tsx
<button className="bg-primary text-primary-foreground">
  Submit
</button>
```

**Secondary Actions:**
```tsx
<button className="bg-secondary text-secondary-foreground">
  Cancel
</button>
```

**Status Indicators:**
```tsx
{/* Success */}
<span className="bg-success text-success-foreground">✓ Done</span>

{/* Warning */}
<span className="bg-warning text-warning-foreground">⚠ Caution</span>

{/* Info */}
<span className="bg-info text-info-foreground">ℹ Note</span>

{/* Error */}
<span className="bg-destructive text-destructive-foreground">✕ Error</span>
```

**Muted/Secondary Text:**
```tsx
<p className="text-muted-foreground">Secondary information</p>
```

### Spacing Usage

```tsx
{/* 4px (1 unit) */}
<div className="p-1">Minimal padding</div>

{/* 8px (2 units) */}
<div className="gap-2">Items with small gap</div>

{/* 16px (4 units - base) */}
<div className="p-4 mb-4">Standard padding and margin</div>

{/* 24px (6 units) */}
<div className="p-6">Card padding</div>

{/* 32px (8 units) */}
<div className="gap-8">Large spacing between sections</div>
```

### Typography Usage

```tsx
{/* Headings */}
<h1 className="text-4xl font-bold">Main Heading</h1>
<h2 className="text-3xl font-semibold">Sub Heading</h2>
<h3 className="text-xl font-semibold">Section Title</h3>

{/* Body Text */}
<p className="text-base font-regular">Default paragraph text</p>
<p className="text-sm font-regular text-muted-foreground">Small description</p>

{/* Labels */}
<label className="text-xs font-semibold uppercase">Field Label</label>

{/* Code/Monospace */}
<code className="font-mono text-sm">const x = 42;</code>
```

### Radius Usage

```tsx
{/* Sharp corners (Carbon default) */}
<div className="rounded-none border">Sharp edge</div>

{/* Subtle rounding */}
<button className="rounded-sm">Button</button>

{/* Standard rounded inputs */}
<input className="rounded-md border" />

{/* Cards with gentle rounding */}
<div className="rounded-lg bg-card p-6">Card</div>
```

### Shadow Usage

```tsx
{/* Subtle elevation */}
<div className="rounded-md bg-card shadow-xs">Slightly raised</div>

{/* Standard elevation (cards, containers) */}
<div className="rounded-md bg-card shadow-md">Card shadow</div>

{/* Dropdowns, modals */}
<div className="absolute bg-popover shadow-lg">Dropdown menu</div>

{/* Maximum elevation */}
<div className="fixed inset-0 bg-black/50">
  <div className="bg-card shadow-xl">Modal</div>
</div>
```

## Common Component Patterns

### Form Input
```tsx
<input
  type="text"
  className="w-full bg-input border border-border text-foreground px-4 py-2 rounded-sm placeholder-muted-foreground focus:ring-2 focus:ring-primary"
  placeholder="Enter text"
/>
```

### Card Container
```tsx
<div className="bg-card text-card-foreground border border-border rounded-md p-6 shadow-md">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-muted-foreground">Card content goes here</p>
</div>
```

### Button Group
```tsx
<div className="flex gap-2">
  <button className="bg-primary text-primary-foreground px-4 py-2 rounded-sm">
    Primary
  </button>
  <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-sm">
    Secondary
  </button>
  <button className="border border-border text-foreground px-4 py-2 rounded-sm">
    Outline
  </button>
</div>
```

### Badge/Tag
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-none bg-primary text-primary-foreground text-xs font-semibold">
  New
</span>
```

### Status Indicator
```tsx
<div className="flex items-center gap-2 p-4 rounded-sm border-l-4 border-info bg-info/10 text-info">
  <Info className="w-5 h-5" />
  <span>This is an informational message</span>
</div>
```

## Dark Mode

Dark mode is **automatic** - just add the `.dark` class to your root element:

```tsx
// Light mode (default)
<html>
  <body>Content</body>
</html>

// Dark mode
<html className="dark">
  <body>Content</body>
</html>
```

All tokens automatically invert:
- Backgrounds become dark (#161616 instead of #ffffff)
- Text becomes light (#f4f4f4 instead of #161616)
- Colors adjust for visibility (e.g., success becomes #42be65 instead of #24a148)
- Shadows increase in opacity

## Available Token Categories

### Colors (26 Semantic Tokens)
- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `accent`, `accent-foreground`
- `muted`, `muted-foreground`
- `border`, `input`, `ring`
- `destructive`, `destructive-foreground`
- `success`, `success-foreground`
- `warning`, `warning-foreground`
- `info`, `info-foreground`
- `disabled`, `disabled-foreground`

### Spacing (16 Values)
- `0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24, 32`
- Base unit: 4px
- All values available as `p-{n}`, `m-{n}`, `gap-{n}`, etc.

### Typography
- **Font Sizes**: `xs` (12px) through `6xl` (48px)
- **Font Weights**: `regular` (400), `medium` (500), `semibold` (600), `bold` (700)
- **Line Heights**: `tight` (1.2), `normal` (1.5), `relaxed` (1.75)

### Radius
- `none` (0px) - default
- `xs` (2px)
- `sm` (4px)
- `md` (8px)
- `lg` (12px)

### Shadows
- `xs`, `sm`, `md`, `lg`, `xl` - elevation levels

## Design Decisions

### Why Carbon?
1. **Professional**: Used by Fortune 500 companies
2. **Accessible**: Built with accessibility in mind
3. **Consistent**: Systematic approach to design
4. **Scalable**: Works for projects of any size

### Why HEX Colors?
- More performant than OKLCH for system fonts/UI
- Better browser support
- Easier to match exact Carbon specifications
- Simpler for designers and developers

### Why 4px Grid?
- Carbon standard ensures consistency
- All sizes are multiples of 4px
- Provides enough flexibility without being overwhelming
- Reduces decision fatigue

### Why Sharp Corners?
- Modern, minimalist aesthetic
- Carbon design philosophy
- Professional appearance
- Optional rounding available when needed

## Migration from Previous System

If you were using the custom OKLCH color system:

| Old | New | Example |
|-----|-----|---------|
| `oklch(...) blue` | `#0f62fe` | Primary button |
| `oklch(...) green` | `#24a148` | Success state |
| Custom spacing | `p-4, gap-8, mb-6` | Carbon grid |
| `rounded-lg` | `rounded-md` | Standard rounding |

## Browser Support

✅ All modern browsers (Chrome, Firefox, Safari, Edge)
✅ CSS Custom Properties (CSS Variables)
✅ Dark mode via class selector
✅ No JavaScript required for theming

## Performance

- No runtime overhead (pure CSS variables)
- No additional bundle size
- Minimal paint/reflow
- Instant dark mode switching

## Resources

- **Local Reference**: `app/docs/DESIGN_TOKENS.md`
- **IBM Carbon**: https://carbondesignsystem.com
- **Token Specs**: All values defined in `app/index.css`

## Questions?

Refer to:
1. `app/docs/DESIGN_TOKENS.md` - Complete token reference
2. `app/index.css` - Token definitions
3. Existing components - See examples in codebase

## Best Practices

1. **Use semantic tokens**: Prefer `bg-primary` over `bg-blue-600`
2. **Respect the grid**: Use spacing tokens (p-4, gap-8, etc.)
3. **Minimal radius**: Keep corners sharp unless there's a reason
4. **Status colors**: Use success/warning/info/destructive consistently
5. **Contrast**: Ensure text uses proper -foreground tokens
6. **Dark mode**: Test components in both light and dark modes

---

**Status**: ✅ Production Ready

All components are built with Carbon Design System tokens and are ready for use.
