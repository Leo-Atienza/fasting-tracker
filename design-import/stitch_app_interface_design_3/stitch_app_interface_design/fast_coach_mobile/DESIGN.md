---
name: Fast Coach Mobile
colors:
  surface: '#faf9f9'
  surface-dim: '#dadada'
  surface-bright: '#faf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e9e8e8'
  surface-container-highest: '#e3e2e3'
  on-surface: '#1a1c1c'
  on-surface-variant: '#42484a'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f0f1'
  outline: '#72787b'
  outline-variant: '#c1c7ca'
  surface-tint: '#46636c'
  primary: '#15333c'
  on-primary: '#ffffff'
  primary-container: '#2d4a53'
  on-primary-container: '#9ab9c3'
  inverse-primary: '#adcbd6'
  secondary: '#006d36'
  on-secondary: '#ffffff'
  secondary-container: '#6dfe9c'
  on-secondary-container: '#007439'
  tertiary: '#213145'
  on-tertiary: '#ffffff'
  tertiary-container: '#37475c'
  on-tertiary-container: '#a5b5ce'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e8f3'
  primary-fixed-dim: '#adcbd6'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#2e4b54'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#faf9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e3'
typography:
  timer-display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 20px
  gutter-mobile: 16px
---

## Brand & Style

The design system is centered on the intersection of high-performance coaching and serene wellness. The brand personality is **Encouraging, Methodical, and Quietly Confident**. It seeks to evoke a sense of "calm discipline" in users—avoiding the high-stress aesthetics of traditional fitness apps in favor of a restorative, health-focused experience.

The design style is **Modern Minimalism** with a tactile softness. It prioritizes data clarity for fasting timers while using generous whitespace and intentional padding to reduce cognitive load. The aesthetic leverages soft elevation and subtle depth to make the interface feel approachable and premium, ensuring that even during difficult fasting windows, the app remains a supportive, non-intrusive companion.

## Colors

This design system utilizes a palette designed to balance clinical professionalism with organic vitality.

- **Primary (Deep Teal):** Used for primary actions, navigation headers, and authoritative text. It provides a grounded, stable foundation.
- **Success (Vibrant Mint):** Reserved specifically for active fasting states, completion celebrations, and positive health trends. It acts as a visual reward.
- **Neutral (Slate/Soft Gray):** Used for background layering and secondary text to maintain high legibility without the harshness of pure black or white.

**Dark Mode Strategy:** The system follows system-level defaults. In dark mode, the deep teal shifts toward a slightly desaturated slate to maintain accessibility, while the background utilizes deep navy-slates instead of pure black to preserve the "soft" brand character.

## Typography

The design system employs **Inter** for its exceptional legibility and neutral, modern character. The typographic hierarchy is structured to prioritize the "state of being"—ensuring the timer is the most prominent element on the screen.

- **Timer Display:** A specialized heavyweight style used exclusively for the countdown/count-up clock.
- **Headlines:** Used for section titles and daily goals, utilizing tighter tracking for a professional, "locked-in" feel.
- **Body & Labels:** Generous line-height is applied to body text to improve readability during quick glances. Labels use a slightly higher font weight to ensure they remain legible against various surface colors.

## Layout & Spacing

This design system uses a **Fluid Grid** approach optimized for mobile viewports. The layout relies on a 4-column structure for mobile devices, with a standard 20px outer margin to provide "breathable" air around the content.

The spacing rhythm is built on a 4px baseline grid. Key layouts should prioritize vertical stacking with generous `xl` (32px) spacing between major sections (e.g., separating the timer from the daily progress cards) to avoid a cluttered or "busy" appearance. Containers should use `md` (16px) internal padding as a minimum to maintain the minimalist aesthetic.

## Elevation & Depth

Visual hierarchy is established through **Ambient Shadows** and **Tonal Layering**. 

1.  **Level 0 (Background):** The base canvas uses the soft neutral background color.
2.  **Level 1 (Cards/Containers):** Elements are raised using a very soft, highly diffused shadow (Blur: 20px, Opacity: 4% Black in light mode, 12% Black in dark mode). These containers house the primary content.
3.  **Level 2 (Active States/Modals):** Elements that require immediate attention or overlap the main UI use a more pronounced shadow and a slightly lighter surface color to indicate physical proximity to the user.

Avoid harsh borders. Instead, use subtle 1px inner strokes (low-contrast) to define boundaries on light surfaces.

## Shapes

The shape language is defined by **Rounded** geometry to reinforce the "friendly and approachable" brand pillars. 

- **Standard Components:** Buttons, input fields, and small cards use a 16px (`rounded-lg`) corner radius.
- **Large Containers:** Main dashboard cards and bottom sheets use a 24px (`rounded-xl`) radius to create a soft, "encapsulated" look.
- **Interactive Elements:** Success indicators and progress pills may use full 999px rounding (Pill-shaped) to distinguish them from structural layout containers.

## Components

- **Fasting Timer:** The hero component. It should feature a large concentric progress ring using a 12px stroke width. The "Active" state uses a Mint Green gradient, while the "Idle" state uses a soft Slate Blue.
- **Buttons:** Primary buttons are Solid Deep Teal with white text, featuring 16px rounded corners. Success buttons (e.g., "End Fast") use the Mint Green palette.
- **Status Chips:** Small, low-contrast pills (e.g., "Autophagy", "Ketosis") with semi-transparent backgrounds and high-contrast text.
- **Cards:** White or dark-slate containers with 24px corners and subtle ambient shadows. No borders.
- **Input Fields:** Soft-gray backgrounds with no borders in their default state, transitioning to a Deep Teal 2px border on focus.
- **Progress Bars:** Thick, 8px tracks with rounded ends, using a desaturated version of the primary color for the track and the vibrant Mint for the progress fill.