# KTech AI - Design System Documentation

## Overview

This document describes the design system used in KTech AI's cyberpunk-styled website.

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Deep Navy | `#0a0f1c` | Background |
| Neon Cyan | `#00ffcc` | Primary accent |
| Neon Magenta | `#ff00aa` | Secondary accent |
| Light Blue-Grey | `#e0e8ff` | Primary text |
| Slate Grey | `#8a9acc` | Secondary text |

### Color Variables (CSS)

```css
--bg-deep: #0a0f1c
--bg-dark: #0d1a2d
--neon-cyan: #00ffcc
--neon-magenta: #ff00aa
--neon-blue: #00ccff
--text-primary: #e0e8ff
--text-secondary: #8a9acc
```

## Typography

### Font Families

- **Headings**: Clash Display (Fontshare)
- **Body**: Satoshi (Fontshare)

### Type Scale

| Element | Size | Weight |
|---------|------|--------|
| Hero Title | 5rem (80px) | 700 |
| Section Title | 2.5rem (40px) | 700 |
| Card Title | 1.3rem | 700 |
| Body | 1rem | 400 |
| Small | 0.85rem | 500 |

## Effects

### Particle Field
- 50 floating particles
- Animation: 15s float cycle
- Opacity fade in/out

### Neon Glow
```css
box-shadow: 0 0 20px rgba(0, 255, 204, 0.5), 0 0 40px rgba(0, 255, 204, 0.3)
```

### Grid Overlay
- 40px × 40px grid
- Color: rgba(0, 255, 204, 0.05)
- Fixed position overlay

### Scanlines
- Repeating linear gradient
- 1px scan lines
- 8s animation cycle

## Components

### Navigation (cyber-nav)
- Fixed position
- Backdrop blur: 20px
- Border-bottom: 1px solid rgba(0, 255, 204, 0.2)

### Hero Section
- Min-height: 90vh
- Split layout: content + visual
- Animated neural rings (3 concentric)

### Feature Cards
- Grid: 3 columns
- Background: rgba(13, 26, 45, 0.6)
- Border: 1px solid rgba(0, 255, 204, 0.2)
- Hover: translateY(-10px) + glow

### Footer
- Padding: 3rem horizontal
- Background: rgba(10, 15, 28, 0.9)
- Status indicator with blink animation

## Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Particle Float | 15s | ease-in-out |
| Pulse Glow | 2s | ease-in-out |
| Neural Ring Rotate | 10-20s | linear |
| Glitch | 3s | steps |
| Scanline Move | 8s | linear |

## Responsive Breakpoints

- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators on all interactive elements
- Reduced motion support via `prefers-reduced-motion`
