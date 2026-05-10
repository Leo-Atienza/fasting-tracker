---
name: Fast Coach Design System
colors:
  surface: '#f9f9fe'
  surface-dim: '#d9dade'
  surface-bright: '#f9f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f8'
  surface-container: '#ededf2'
  surface-container-high: '#e8e8ed'
  surface-container-highest: '#e2e2e7'
  on-surface: '#1a1c1f'
  on-surface-variant: '#3d4a3c'
  inverse-surface: '#2e3034'
  inverse-on-surface: '#f0f0f5'
  outline: '#6d7b6b'
  outline-variant: '#bccbb8'
  surface-tint: '#006e28'
  primary: '#006e28'
  on-primary: '#ffffff'
  primary-container: '#34c759'
  on-primary-container: '#004d1a'
  inverse-primary: '#53e16f'
  secondary: '#0058bc'
  on-secondary: '#ffffff'
  secondary-container: '#0070eb'
  on-secondary-container: '#fefcff'
  tertiary: '#4f4ccd'
  on-tertiary: '#ffffff'
  tertiary-container: '#a6a5ff'
  on-tertiary-container: '#302aaf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#72fe88'
  primary-fixed-dim: '#53e16f'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#00531c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#e2dfff'
  tertiary-fixed-dim: '#c2c1ff'
  on-tertiary-fixed: '#0c006a'
  on-tertiary-fixed-variant: '#3631b4'
  background: '#f9f9fe'
  on-background: '#1a1c1f'
  surface-variant: '#e2e2e7'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 44px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '300'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap-sm: 12px
  stack-gap-md: 24px
  stack-gap-lg: 40px
  glass-padding: 20px
---

## Brand & Style
The design system for this product is built on the pillars of "High-Performance Zen." It targets health-conscious individuals who appreciate the precision of high-end technology blended with the softness of a wellness retreat. The brand identity is professional and authoritative—positioning itself as a "Coach"—while remaining encouraging through airy layouts and vibrant, life-affirming accents.

The visual language utilizes **Glassmorphism** as its core structural driver. By employing semi-transparent surfaces and multi-layered background blurs, the UI feels lightweight and integrated into the user's device. This approach avoids the heavy "app-like" feel of opaque containers, instead favoring a fluid, organic experience that feels native to modern iOS environments.

## Colors
The palette centers on a sophisticated "Off-White" foundation to ensure a premium, editorial feel. 

- **Success Green (#34C759):** A crisp, vibrant Apple-inspired green used exclusively for active fasting states, completion milestones, and progress achievements.
- **Hydration Blue (#007AFF):** A deep, electric blue used for water tracking and hydration-related metrics.
- **Neutrals:** We use a hierarchy of soft grays (System Gray 6 for backgrounds, White for primary surfaces) to maintain high legibility without the harshness of pure black-on-white.
- **Translucency:** Key interface elements use a 70-80% opacity white with a 20px-30px backdrop blur to create the signature "Glass" effect.

## Typography
The typographic scale is designed for instant scannability and a "High-End Magazine" aesthetic. 

- **Headlines:** We use **Hanken Grotesk** for its sharp, modern geometry. Bold weights (700-800) are reserved for primary stats and motivational headers to create a strong visual anchor.
- **Body:** **Inter** is used for its exceptional legibility. We favor the "Light" (300) weight for long-form descriptions to enhance the "airy" brand feel, switching to "Regular" (400) for interactive elements and inputs.
- **Labels:** Small labels use increased letter-spacing and uppercase styling to provide clear categorization without occupying significant visual real estate.

## Layout & Spacing
The layout follows a strict 4px soft-grid system but prioritizes "Generous Whitespace." Elements are never crowded; we use large margins (24px) to ensure the UI feels calm and unhurried.

- **Fluidity:** Containers should span the full width of the safe area minus margins, utilizing flexible heights based on content.
- **Safe Areas:** Adhere strictly to iOS safe-area insets for notched devices.
- **Visual Breathing Room:** Vertical stacks use a 40px gap between distinct sections to prevent information overload.

## Elevation & Depth
Depth is created through optical physics rather than heavy shadows.

- **Layer 0 (Background):** A subtle linear gradient or a blurred colorful mesh that sits behind everything.
- **Layer 1 (The Glass):** Semi-transparent cards with a `backdrop-filter: blur(20px)`. These represent the primary interactive area.
- **Layer 2 (Floating Elements):** High-priority buttons or active state indicators use a very soft, diffused shadow (`y: 10, blur: 20, opacity: 0.05`) with a slight tint of the accent color (Green or Blue) to imply lift and interaction.
- **Outlines:** Use a 0.5px "Inner Glow" border in pure white at 40% opacity to define the edges of glass containers against light backgrounds.

## Shapes
The shape language is extremely soft and approachable. We utilize **rounded-3xl** (24px-32px) for all primary cards and containers. This creates a "squishy" and friendly aesthetic that removes the clinical feeling often associated with health apps. 

Secondary elements like buttons and input fields use a "Continuous Corner" (Squircle) approach to mimic Apple’s hardware and software icons.

## Components
- **Primary Buttons:** High-gloss, pill-shaped elements. Use the Success Green for "Start Fast" and Electric Blue for "Log Water." Text should be bold and centered.
- **Glass Cards:** The primary vessel for data. Large 24px internal padding, 32px corner radius, and a subtle white inner-stroke.
- **The Fasting Timer:** A large, thin-stroke circular progress ring. The stroke should use a gradient of Success Green to a semi-transparent version of itself.
- **Chips / Tags:** Small, semi-transparent capsules used for fasting stages (e.g., "Ketosis," "Autophagy"). Text is uppercase `label-caps`.
- **Segmented Controls:** A soft-gray background track with a white, glass-morphic "sliding" thumb that indicates the active selection.
- **Selection Inputs:** Large-format radio cards. Instead of small circles, the entire card changes its border-weight and background-blur intensity when selected.