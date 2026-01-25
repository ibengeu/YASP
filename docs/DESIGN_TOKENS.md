# YASP Design Tokens (Protocol Theme)
Based on **Protocol Design System (Slate/Blue)** + **IBM Carbon Structure**

## Overview
YASP uses the structure of IBM Carbon (grid, tokens) but themed with the "Protocol" design system aesthetic:
-   **Font**: Inter (UI), JetBrains Mono (Code)
-   **Colors**: Slate (Grays), Blue-600 (Primary), Emerald (Success), Amber (Warning)
-   **Radii**: Soft, modern curves (`0.5rem` base, `1rem` cards)
-   **Shadows**: Soft, dreamy drop shadows

## Color Palette (Slate)

### Interactive
| Token | Light (White/Slate 50) | Dark (Slate 900) |
|-------|------------------------|------------------|
| `--interactive-01` | `#2563eb` (Blue 600) | `#3b82f6` (Blue 500) |
| `--interactive-02` | `#0f172a` (Slate 900) | `#f8fafc` (Slate 50) |
| `--interactive-04` | `#eff6ff` (Blue 50) | `#1e293b` (Slate 800) |

### UI & Backgrounds
| Token | Light | Dark |
|-------|-------|------|
| `--ui-01` (Card) | `#ffffff` (White) | `#1e293b` (Slate 800) |
| `--ui-02` (Bg) | `#f8fafc` (Slate 50) | `#0f172a` (Slate 900) |
| `--ui-03` (Border) | `#e2e8f0` (Slate 200) | `#334155` (Slate 700) |

### Typography
| Token | Font Family |
|-------|-------------|
| `--font-sans` | `Inter`, sans-serif |
| `--font-mono` | `JetBrains Mono`, monospace |

## Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Small tags/badges |
| `--radius` | `8px` | Buttons, Inputs |
| `--radius-md` | `12px` | Inner containers |
| `--radius-lg` | `16px` | **Cards, Panels** (Key identifier of this style) |
| `--radius-xl` | `24px` | Modals, Large containers |

## Shadows
Uses a custom soft shadow scale inspired by Tailwind/Stripe:
- `--shadow-sm`: Subtle lift
- `--shadow-lg`: Floating panels

## Usage with Tailwind
Use standard semantic classes which are now mapped to these new values:
```tsx
<div className="bg-card rounded-lg shadow-sm border border-border p-6 font-sans">
  <h1 className="text-foreground font-semibold">Protocol Header</h1>
  <button className="bg-primary text-primary-foreground rounded px-4 py-2">
    Action
  </button>
</div>
```
