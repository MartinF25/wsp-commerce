# Storefront UX

## Design Principles
- Clean, modern, technisch hochwertig (see main CLAUDE.md §4)
- Mobile-first, responsive
- Fast: Core Web Vitals green

## Key Pages

| Route | Description |
|---|---|
| `/` | Homepage with hero, product teasers, lead CTA |
| `/shop` | Product catalog / category listing |
| `/shop/[slug]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Multi-step checkout |
| `/account` | Customer account (orders, profile) |
| `/kontakt` | Lead / consultation form |

## Component Library
- Shared components in `packages/ui`
- Tailwind CSS for styling
- Radix UI or shadcn/ui for accessible primitives

## Color Palette (from brand guide)
- Primary: `#FFFFFF`
- Text/Headlines: `#1C1C1E`
- Muted: `#6B7280`
- Accent: `#22C55E` (green) or `#3B82F6` (blue)
